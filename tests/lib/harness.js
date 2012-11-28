/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Provides a CLI for the code processor unit tests
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var fs = require('fs'),
	path = require('path'),
	existsSync = fs.existsSync || path.existsSync,
	
	wrench = require('wrench'),
	
	fork = require('child_process').fork,

	AST = require('../../lib/AST'),
	RuleProcessor = require('../../lib/RuleProcessor');

module.exports.run = function (options) {
	var test262Dir = options['test-262-dir'],
		multiThreaded = options['multi-threaded'],
		chapter = options.chapter,
		section = options.section,
		testNode = options['test-node'],
		includeDir = path.join(test262Dir, 'test', 'harness'),
		testLib = '',
		fileList = wrench.readdirSyncRecursive(path.join(test262Dir, 'test', 'suite')),
		prunedFileList = [],
		numTests,
		testFileNameRegex,
		testFileRegex = new RegExp(
			'^((?:(?:\\s*\\/\\/.*)?\\s*\\n)*)' + // Header
			'(?:\\/\\*\\*?((?:\\s|\\S)*?)\\*\\/\\s*\\n)' + // Data comment
			'?((?:\\s|\\S)*)$'), // Test case
		propertySplitRegex = /\s*\n\s*\*\s*@/,
		starsRegex = /\*/g,
		propertyNameRegex = /^(\w+)/,
		successes = 0,
		total = 0,
		startTime = Date.now(),
		testsFailed = [],
		tempDir = path.resolve(path.join('/', 'tmp', 'titanium-code-processor')),
		i, len = multiThreaded ? require('os').cpus().length : 1,
		printFinishedCountdown = len; // Most laptops don't like running at 100%
	
	function getPrettyTime(diff) {
		var elapsedTime = new Date(diff),
			seconds = elapsedTime.getUTCSeconds(),
			minutes = elapsedTime.getUTCMinutes(),
			hours = elapsedTime.getUTCHours();
		hours = hours === 0 ? '' : hours === 1 ? '1 hour ' : hours + ' hours ';
		minutes = minutes === 0 ? hours ? '0 minutes ' : '' : minutes === 1 ? '1 minute ' : minutes + ' minutes ';
		seconds = seconds === 1 ? '1 second' : seconds + ' seconds';
		return hours + minutes + seconds;
	}
	
	function processFile() {
		var file = prunedFileList.shift(),
			testFileContent,
			testFilePath,
			testFile,
			match,
			header,
			properties,
			testProperties,
			body,
			propMatch,
			child,
			childTimer,
			i, len,
			ast,
			message;
		if (!file) {
			printFinishedCountdown--;
			if (!printFinishedCountdown) {
				console.log('\nAll tests finished in ' + getPrettyTime(Date.now() - startTime) + '. ' +
					successes + ' out of ' + total + ' tests (' + Math.floor(100 * successes / total) + '%) passed.\n');
				if (testsFailed.length) {
					console.log('Failed tests:\n' + testsFailed.join('\n') + '\n');
				}
				wrench.rmdirSyncRecursive(tempDir);
				process.exit();
			}
		} else if (testFileNameRegex.test(file)) {
			
			// Read in the test case
			testFile = fs.readFileSync(path.join(test262Dir, 'test', 'suite', file));
			
			// Parse the header
			match = testFileRegex.exec(testFile);
			if (match) {
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
				testProperties.strictMode = !!(ast && ast[1] && RuleProcessor.isBlockStrict(ast[1]));

				// Write the test file plus headers to a temp file
				testFileContent = (testProperties.strictMode ? '"use strict";\n' : '') + testLib +
					'\n\n/****************************************\n' +
					' * ' + file + '\n' +
					' ****************************************/\n\n' +
					body;
				testFilePath = path.join(tempDir, file);
				wrench.mkdirSyncRecursive(path.dirname(testFilePath));
				fs.writeFileSync(testFilePath, testFileContent);
				
				if (testNode) {
					try {
						message = {};
						require(testFilePath);
						message.success = !testProperties.negative;
						if (!message.success) {
							message.errorMessage = 'The test was expected to fail but didn\'t';
						}
					} catch(e) {
						message.success = testProperties.negative;
						if (!message.success) {
							message.errorMessage = 'Exception: ' + e.message;
						}
					}
					total++;
					if (message.success) {
						successes++;
					}
					console.log((message.success ? 'PASS' : 'FAIL') + ' (' + total + ' of ' + numTests +', ' +
						getPrettyTime((numTests - total) * (Date.now() - startTime) / total) + ' remaining, ' +
						Math.floor(100 * successes / total) + '% pass rate so far): ' +
						testFilePath + (!message.success ? '\n   ' + message.errorMessage : ''));
					setTimeout(processFile, 0);
				} else {
					child = fork(path.resolve(path.join(__dirname, 'runner')));
					child.send({ file: testFilePath, properties: testProperties});
					childTimer = setTimeout(function () {
						total++;
						console.log('FAIL (' + total + ' of ' + numTests +', ' +
							getPrettyTime((numTests - total) * (Date.now() - startTime) / total) + ' remaining, ' +
							Math.floor(100 * successes / total) + '% pass rate so far): ' +
							testFilePath + '\n   Execution time limit exceeded');
						testsFailed.push(file);
						child.removeAllListeners('message');
						setTimeout(processFile, 0);
					}, 10000);
					child.on('message', function(message) {
						clearTimeout(childTimer);
						total++;
						if (message.success) {
							successes++;
						}
						console.log((message.success ? 'PASS' : 'FAIL') + ' (' + total + ' of ' + numTests +', ' +
							getPrettyTime((numTests - total) * (Date.now() - startTime) / total) + ' remaining, ' +
							Math.floor(100 * successes / total) + '% pass rate so far): ' +
							testFilePath + (!message.success ? '\n   ' + message.errorMessage : ''));
						if (!message.success) {
							testsFailed.push(file);
						}
						setTimeout(processFile, 0);
					});
				}
			} else {
				throw new Error('Could not parse test case ' + file);
			}
		} else {
			setTimeout(processFile, 0);
		}
	}
	
	// Create the test lib
	['cth.js', 'sta.js', 'ed.js', 'testBuiltInObject.js', 'testIntl.js'].forEach(function(file) {
		testLib += '\n\n/****************************************\n' +
			' * ' + file + '\n' +
			' ****************************************/\n\n' +
			fs.readFileSync(path.join(includeDir, file));
	});
	
	// Parse the chapter
	if (chapter) {
		chapter = parseInt(chapter, 10);
		chapter = (chapter < 10 ? '0' : '') + chapter;
		if (!existsSync(path.join(test262Dir, 'test', 'suite', 'ch' + chapter))) {
			console.error('Invalid chapter number "' + chapter + '"');
			process.exit();
		}
		testFileNameRegex = RegExp('^ch' + chapter + '[\\/\\\\].*\\.js$');
	} else if (section) {
		chapter = parseInt(section, 10);
		chapter = (chapter < 10 ? '0' : '') + chapter;
		if (!existsSync(path.join(test262Dir, 'test', 'suite', 'ch' + chapter))) {
			console.error('Invalid chapter number "' + chapter + '"\n');
			process.exit();
		}
		if (!existsSync(path.join(test262Dir, 'test', 'suite', 'ch' + chapter, section))) {
			console.error('Invalid section "' + section + '"\n');
			process.exit();
		}
		testFileNameRegex = RegExp('^ch' + chapter + '[\\/\\\\]' + section + '[\\/\\\\].*\\.js$');
	} else {
		testFileNameRegex = /^ch[0-9][0-68-9][\/\\].*\.js$/;
	}
	
	// Prune the list of tests
	for(i = 0; i < fileList.length; i++) {
		if (testFileNameRegex.test(fileList[i])) {
			prunedFileList.push(fileList[i]);
		}
	}
	numTests = prunedFileList.length;
	
	// Run the tests
	console.log('\nRunning ' + numTests + ' tests from ' +
		(section ? 'Section ' + section : chapter ? 'Chapter ' + chapter : 'all chapters') +
		' using ' + (len > 1 ? len + ' threads' : '1 thread') + '\n');
	for(i = 0; i < len; i++) {
		processFile();
	}
};