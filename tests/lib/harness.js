/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * Provides a CLI for the code processor unit tests
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var fs = require('fs'),
	path = require('path'),
	
	wrench = require('wrench'),
	
	fork = require('child_process').fork;

module.exports.run = function (test262Dir, multiThreaded, chapter) {
	var includeDir = path.join(test262Dir, 'test', 'harness'),
		testLib = '',
		fileList = wrench.readdirSyncRecursive(path.join(test262Dir, 'test', 'suite')),
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
		tempDir = path.resolve(path.join(__dirname, '..', 'tmp')),
		i, len = multiThreaded ? require('os').cpus().length : 1,
		printFinishedCountdown = len; // Most laptops don't like running at 100%
	
	// Create the test lib
	['cth.js', 'sta.js', 'ed.js', 'testBuiltInObject.js', 'testIntl.js'].forEach(function(file) {
		testLib += '\n\n/****************************************\n' + 
			' * ' + file + '\n' + 
			' ****************************************/\n\n' + 
			fs.readFileSync(path.join(includeDir, file));
	});
	
	// Parse the chapter
	if (chapter) {
		chapter = parseInt(chapter);
		chapter = (chapter < 10 ? '0' : '') + chapter;
		if (!fs.existsSync(path.join(test262Dir, 'test', 'suite', 'ch' + chapter))) {
			console.error('Invalid chapter number "' + chapter + '"');
			process.exit();
		}
		testFileNameRegex = RegExp('^ch' + chapter + '[\\/\\\\].*\\.js$');
	} else {
		testFileNameRegex = /^ch[0-9][0-68-9][\/\\].*\.js$/
	}
	console.log('\nRunning ' + (chapter ? 'Chapter ' + chapter : 'all') + ' unit tests using ' + 
		(len > 1 ? len + ' threads' : '1 thread') + '\n');
	function processFile() {
		var file = fileList.shift(),
			testFileContent,
			testFilePath,
			testFile,
			child,
			match,
			header,
			properties,
			testProperties,
			body,
			propMatch,
			i, len,
			elapsedTime,
			seconds,
			minutes,
			hours;
		if (!file) {
			printFinishedCountdown--;
			if (!printFinishedCountdown) {
				elapsedTime = new Date((Date.now() - startTime));
				seconds = elapsedTime.getUTCSeconds();
				minutes = elapsedTime.getUTCMinutes();
				hours = elapsedTime.getUTCHours();
				hours = hours === 0 ? '' : hours === 1 ? '1 hour ' : hours + ' hours ';
				minutes = minutes === 0 ? !!hours ? '0 minutes ' : '' : minutes === 1 ? '1 minute ' : minutes + ' minute ';
				seconds = seconds === 1 ? '1 second' : seconds + ' seconds';
				console.log('\nAll tests finished in ' + hours + minutes + seconds + '. ' + 
					successes + ' out of ' + total + ' tests passed\n');
				wrench.rmdirSyncRecursive(tempDir);
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
				
				// Write the test file plus headers to a temp file
				testFileContent = testLib + 
					'\n\n/****************************************\n' + 
					' * ' + file + '\n' + 
					' ****************************************/\n\n' + 
					body;
				testFilePath = path.join(tempDir, file);
				wrench.mkdirSyncRecursive(path.dirname(testFilePath));
				fs.writeFileSync(testFilePath, testFileContent);
				
				child = fork(path.resolve(path.join(__dirname, 'runner')));
				child.send({ file: testFilePath, properties: testProperties});
				total++;
				child.on('message', function(message) {
					console.log((message.success ? 'PASS: ' : 'FAIL: ') + testFilePath + (!message.success ? '\n   ' + message.errorMessage : ''));
					if (message.success) {
						successes++;
					}
					setTimeout(processFile, 0);
				});
			} else {
				throw new Error('Could not parse test case ' + file);
			}			
		} else {
			setTimeout(processFile, 0);
		}
	}
	for(i = 0; i < len; i++) {
		processFile();
	}
};