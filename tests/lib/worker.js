/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Provides a CLI for the code processor unit tests
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var path = require('path'),
	fs = require('fs'),

	wrench = require('wrench'),

	CodeProcessor = require('../../lib/CodeProcessor'),
	Base = require('../../lib/Base'),
	Runtime = require('../../lib/Runtime'),
	AST = require('../../lib/AST'),
	RuleProcessor = require('../../lib/RuleProcessor');

module.exports.run = function () {

	var testLib = '',
		test262Dir,
		options,
		testFileRegex = new RegExp(
			'^((?:(?:\\s*\\/\\/.*)?\\s*\\n)*)' + // Header
			'(?:\\/\\*\\*?((?:\\s|\\S)*?)\\*\\/\\s*\\n)' + // Data comment
			'?((?:\\s|\\S)*)$'), // Test case
		propertySplitRegex = /\s*\n\s*\*\s*@/,
		starsRegex = /\*/g,
		propertyNameRegex = /^(\w+)/;

	process.on('message', function (message) {
		switch(message.type) {
			case 'init':
				init(message);
				break;
			case 'processFile':
				processFile(message);
				break;
		}
	});

	function init(message) {
		var includeDir;
		options = message.options;
		test262Dir = options['test-262-dir'],
		includeDir = path.join(test262Dir, 'test', 'harness');

		// Create the test lib
		['cth.js', 'sta.js', 'ed.js', 'testBuiltInObject.js', 'testIntl.js'].forEach(function(file) {
			testLib += '\n\n/****************************************\n' +
				' * ' + file + '\n' +
				' ****************************************/\n\n' +
				fs.readFileSync(path.join(includeDir, file));
		});
	}

	function processFile(message) {
		var testSuiteFilePath = message.testSuiteFile,
			testSuiteFile,
			properties,
			tempDir = path.resolve(path.join('/', 'tmp', 'titanium-code-processor')),
			i, len,
			testFileContent,
			testFilePath,
			match,
			header,
			testProperties,
			body,
			propMatch,
			ast,
			result,
			value,
			success,
			errorMessage;

		// Read in the test case
		testSuiteFile = fs.readFileSync(path.join(test262Dir, 'test', 'suite', testSuiteFilePath)).toString();

		// Attempt to parse the header
		match = testFileRegex.exec(testSuiteFile);
		if (!match) {
			success = false;
			errorMessage = 'Could not parse test case ';
		} else {

			// Parse the header data
			header = match[1].trim();
			properties = match[2].trim();
			body = match[3];
			testProperties = {};
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

			// Check if this is a strict mode test
			ast = AST.parseString(body);
			testProperties.strictMode = !!(ast && ast.directives && RuleProcessor.isBlockStrict(ast));

			// Write the test file plus headers to a temp file
			testFileContent = (testProperties.strictMode ? '"use strict";\n' : '') + testLib +
				'\n\n/****************************************\n' +
				' * ' + testSuiteFilePath + '\n' +
				' ****************************************/\n\n' +
				body;
			testFilePath = path.join(tempDir, testSuiteFilePath);
			wrench.mkdirSyncRecursive(path.dirname(testFilePath));
			fs.writeFileSync(testFilePath, testFileContent);

			// Check if we are testing node or the code processor
			if (options['test-node']) {
				try {
					require(testFilePath);
					success = !testProperties.hasOwnProperty('negative');
					if (!success) {
						errorMessage = 'The test was expected to fail but didn\'t';
					}
				} catch(e) {
					success = testProperties.hasOwnProperty('negative');
					if (!success) {
						errorMessage = 'Exception: ' + e.message;
					}
				}
			} else {
				try {
					result = CodeProcessor.process(testFilePath, [], {
						exactMode: true
					});

					if (result && result[0] === 'throw') {
						if (result[1]) {
							switch(Base.type(result[1])) {
								case 'String': value = result[1].value; break;
								case 'Object': value = result[1]._lookupProperty('message').value.value + ' (line ' + (result[1].line) + ')'; break;
							}
							success = testProperties.hasOwnProperty('negative');
							if (!success) {
								errorMessage = 'Exception: ' + value;
							}
						} else {
							errorMessage = '**** Internal error: missing throw value at line ' + Runtime.getCurrentLocation().line;
						}
					} else { // Parse non-exception errors
						result = CodeProcessor.getResults();
						if (result.errors.length === 1) {
							errorMessage = 'Error: ' + result.errors[0].name + ': ' + (result.errors[0].data.message ?
								result.errors[0].data.message :
								result.errors[0].data.exception._lookupProperty('message').message.value.value);
							success = testProperties.hasOwnProperty('negative');
						} else if (result.errors.length > 1) {
							errorMessage = ['Multiple errors: '];
							result.errors.forEach(function(err) {
								try {
									errorMessage.push(err.name + ': ' + err.data.exception._lookupProperty('message').value.value);
								} catch(e) {}
							});
							errorMessage = errorMessage.join('\n');
							success = testProperties.hasOwnProperty('negative');
						} else {
							success = !testProperties.hasOwnProperty('negative');
							if (!success) {
								errorMessage = 'The test was expected to fail but didn\'t';
							}
						}
					}

				} catch(e) {
					errorMessage = '**** Internal error: ' + e.message + '\n' + e.stack;
				}
			}
		}

		process.send({
			success: success,
			errorMessage: errorMessage,
			file: testSuiteFilePath
		});
	}
};