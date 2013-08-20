/**
 * <p>Copyright (c) 2012-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Provides a CLI for the code processor unit tests
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var fs = require('fs'),
	path = require('path'),
	existsSync = fs.existsSync || path.existsSync,
	exec = require('child_process').exec,

	wrench = require('wrench'),

	CodeProcessor = require('../../lib/CodeProcessor'),
	Runtime = require('../../lib/Runtime'),
	RuleProcessor = require('../../lib/RuleProcessor'),
	Base = require('../../lib/Base'),
	AST = require('../../lib/AST'),

	sdkPath;

exports.getCodeProcessorConfig = function() {
	var config;
	try {
		config = JSON.parse(fs.readFileSync(path.join(process.env.HOME, '.titanium', 'config.json')));
		config = config['code-processor'];
		if (!config) {
			console.error('Missing "code-processor" entry in titanium config file');
		} else {
			return config;
		}
	} catch(e) {
		console.error('Error reading titanium config file: ' + e);
	}
};

exports.getTest262Dir = function() {
	var config = exports.getCodeProcessorConfig();

	if (!config) {
		return;
	}

	if (!config.test) {
		console.error('Missing "test" entry in titanium config file');
		return;
	}
	config = config.test;

	if (!config['test-262-directory']) {
		console.error('Missing "test-262-directory" entry in titanium config file');
		return;
	}
	config = config['test-262-directory'];

	if (!existsSync(config)) {
		console.error('Test 262 directory "' + config + '" does not exist');
		return;
	}
	return config;
};

exports.getTests = function (test) {
	var testPath = [exports.getTest262Dir(), 'test', 'suite'],
		i, len,
		segments,
		isS = /^S/.test(test),
		jsRegex = /\.js$/,
		fileList,
		prunedFileList = [];

	if (test) {
		if (isS) {
			test = test.replace('S', '');
		}
		segments = test.match(/(^[0-9\.]*)/)[1].split('.');
		testPath.push('ch' + (parseInt(segments[0], 10) < 10 ? '0' + segments[0] : segments[0]));
		for(i = 1; i < segments.length; i++) {
			testPath.push(segments.slice(0, i).join('.') + '.' + segments[i]);
		}
		testPath = path.join.apply(path, testPath);
		if (segments.join('.') !== test) {
			fileList = path.join(testPath, (isS ? 'S' : '') + test + '.js');
			if (!existsSync(fileList)) {
				console.error('Test file "' + fileList + '" does not exist');
				return;
			}
			return [fileList];
		}
	} else {
		testPath = path.join.apply(path, testPath);
	}
	if (!existsSync(testPath)) {
		console.error('Test path "' + testPath + '" does not exist');
		return;
	}
	fileList = wrench.readdirSyncRecursive(testPath);
	for(i = 0, len = fileList.length; i < len; i++) {
		if (jsRegex.test(fileList[i])) {
			prunedFileList.push(path.join(testPath, fileList[i]));
		}
	}
	fileList = prunedFileList;
	return fileList;
};

exports.parseHeader = function (testCase) {
	var testFileRegex = new RegExp(
			'^((?:(?:\\s*\\/\\/.*)?\\s*\\n)*)' + // Header
			'(?:\\/\\*\\*?((?:\\s|\\S)*?)\\*\\/\\s*\\n)' + // Data comment
			'?((?:\\s|\\S)*)$'), // Test case
		propertySplitRegex = /\s*\n\s*\*\s*@/,
		starsRegex = /\*/g,
		propertyNameRegex = /^(\w+)/,
		match,
		header,
		properties,
		body,
		testProperties = {},
		i, len,
		propMatch,
		ast;

	match = testFileRegex.exec(testCase);
	if (!match) {
		console.error('Could not parse test case');
	} else {
		header = match[1].trim();
		properties = match[2].trim();
		body = match[3];
		if (properties) {
			properties = properties.split(propertySplitRegex);
			testProperties.commentary = properties[0].replace(starsRegex, '\n').trim();
			properties.shift();
			for(i = 0, len = properties.length; i < len; i++) {
				propMatch = propertyNameRegex.exec(properties[i]);
				if (!propMatch) {
					throw new Error('Malformed "@" attribute: ' + properties[i]);
				}
				if (propMatch[1] in properties) {
					throw new Error('Duplicate "@" attribute: ' + propMatch[1]);
				}
				testProperties[propMatch[1]] = properties[i].replace(propMatch[1], '').replace(starsRegex, '\n').trim();
			}
		}
		ast = AST.parseString(testCase);
		if (!ast.syntaxError) {
			testProperties.isStrictModeTest = RuleProcessor.isBlockStrict(ast);
		}
		return testProperties;
	}
};

exports.getLibrary = function() {
	var testLib = '',
		test262Dir = exports.getTest262Dir(),
		includeDir;
	if (!test262Dir) {
		return;
	}
	includeDir = path.join(test262Dir, 'test', 'harness');
	['cth.js', 'sta.js', 'ed.js', 'testBuiltInObject.js', 'testIntl.js'].forEach(function(file) {
		testLib += '\n\n/****************************************\n' +
			' * ' + file + '\n' +
			' ****************************************/\n\n' +
			fs.readFileSync(path.join(includeDir, file));
	});
	return testLib;
};

exports.evaluateTest = function(testFilePath, sdkPath, logger, callback) {
	var testLib = exports.getLibrary(),
		testFileContents = fs.readFileSync(testFilePath).toString(),
		testProperties = exports.parseHeader(testFileContents),
		ast,
		test262Dir = exports.getTest262Dir(),
		results,
		errorMessage,
		success,
		isInternalError = false;

	Runtime.setLogger(logger);

	function parseException(exception) {
		if (Base.type(exception) === 'String') {
			exception = exception.value;
		} else if (Base.type(exception) === 'Unknown') {
			exception = '<unknown>';
		} else {
			console.log(!!exception._lookupProperty, exception.className);
			exception = exception.className + ': ' + exception._lookupProperty('message').value.value;
		}
		return exception;
	}

	if (!test262Dir) {
		return;
	}

	try {
		/*jshint debug: true*/
		debugger;
		ast = AST.parseString((testProperties.isStrictModeTest ? '"use strict";\n' : '') + testLib +
			'\n\n/****************************************\n' +
			' * ' + testFilePath + '\n' +
			' ****************************************/\n\n' +
			testFileContents);
		if (!ast.syntaxError) {
			Runtime._unknown = false;
			CodeProcessor.init(undefined, {
				exactMode: true
			}, [{
				path: path.resolve(path.join(__dirname, '..', '..', 'plugins', 'ti-api-provider')),
				options: {
					globalsOnly: true,
					sdkPath: sdkPath,
					platform: 'mobileweb',
					modules: []
				}
			}], ast);
			Runtime._unknown = false;

			try {
				results = ast.processRule();
			} catch (e) {
				throw e;
			}

			// Check if an exception was thrown but not caught
			if (results && results[0] === 'throw') {
				errorMessage = 'Error: ' + parseException(results[1]._exception);
				success = testProperties.hasOwnProperty('negative');
			} else {
				// Parse caught exceptions
				results = CodeProcessor.getResults();

				if (results.errors.length) {
					errorMessage = ['Errors: '];
					results.errors.forEach(function (err) {
						errorMessage.push(parseException(err));
					});
					success = testProperties.hasOwnProperty('negative');
				} else {
					success = !testProperties.hasOwnProperty('negative');
					if (!success) {
						errorMessage = 'The test was expected to fail but didn\'t';
					}
				}
			}
		} else {
			success = testProperties.hasOwnProperty('negative');
			errorMessage = 'SyntaxError: ' + ast.message;
		}
	} catch (e) {
		if (e.isCodeProcessorException) {
			results = ['throw', Runtime._exception, undefined];
			errorMessage = Runtime._exception;
			if (Base.type(errorMessage) === 'String') {
				errorMessage = errorMessage.value;
			} else if (Base.type(errorMessage) === 'Unknown') {
				errorMessage = '<unknown>';
			} else {
				errorMessage = errorMessage._lookupProperty('message').value.value;
			}
			success = testProperties.hasOwnProperty('negative');

			Runtime._exception = undefined;
		} else {
			success = false;
			errorMessage = '**** Internal error: ' + e.message + '\n' + e.stack;
			isInternalError = true;
		}
	}
	callback({
		success: success,
		error: errorMessage,
		isInternalError: isInternalError
	});
};

exports.getPrettyTime = function (diff) {
	var elapsedTime = new Date(diff),
		seconds = elapsedTime.getUTCSeconds(),
		minutes = elapsedTime.getUTCMinutes(),
		hours = elapsedTime.getUTCHours();
	hours = hours === 0 ? '' : hours === 1 ? '1 hour ' : hours + ' hours ';
	minutes = minutes === 0 ? hours ? '0 minutes ' : '' : minutes === 1 ? '1 minute ' : minutes + ' minutes ';
	seconds = seconds === 1 ? '1 second' : seconds + ' seconds';
	return hours + minutes + seconds;
};
