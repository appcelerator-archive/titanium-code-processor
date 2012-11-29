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
	
	wrench = require('wrench');

module.exports.run = function (cluster, options) {
	var test262Dir = options['test-262-dir'],
		multiThreaded = options['multi-threaded'],
		chapter = options.chapter,
		section = options.section,
		fileList = wrench.readdirSyncRecursive(path.join(test262Dir, 'test', 'suite')),
		prunedFileList = [],
		numTests,
		testFileNameRegex,
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

	function createWorker() {
		var worker = cluster.fork();
		worker.send({
			type: 'init',
			options: options
		});
		worker.on('message', function(message) {
			clearTimeout(worker.timeout);
			total++;
			if (message.success) {
				successes++;
			} else {
				testsFailed.push(message.file);
			}
			
			console.log((message.success ? 'PASS' : 'FAIL') + ' (' + total + ' of ' + numTests +', ' +
				getPrettyTime((numTests - total) * (Date.now() - startTime) / total) + ' remaining, ' +
				Math.floor(100 * successes / total) + '% pass rate so far): ' +
				message.file + (!message.success ? '\n   ' + message.errorMessage : ''));

			setTimeout(function () {
				worker.destroy();
				processFile(createWorker());
			}, 0);
		});
		return worker;
	}
	
	function processFile(worker) {
		var file = prunedFileList.shift();
			
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
			worker.send({
				type: 'processFile',
				testSuiteFile: file
			});
			worker.timeout = setTimeout(function () {
				worker.destroy();
				total++;
				testsFailed.push(file);
				
				console.log('FAIL (' + total + ' of ' + numTests +', ' +
					getPrettyTime((numTests - total) * (Date.now() - startTime) / total) + ' remaining, ' +
					Math.floor(100 * successes / total) + '% pass rate so far): ' +
					file + '\n   Execution timeout exceeded');

				setTimeout(function () {
					worker.destroy();
					processFile(createWorker());
				}, 0);
			}, 10000);
		} else {
			setTimeout(function () {
				processFile(worker);
			}, 0);
		}
	}
	
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
		processFile(createWorker());
	}
};