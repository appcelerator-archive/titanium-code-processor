/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Provides a CLI for the code processor unit tests
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var path = require('path'),

	wrench = require('wrench'),

	testutiles = require('./testutils');

module.exports.run = function (cluster) {
	require('child_process').spawn('node', [path.resolve(path.join('..', '..', 'bin', 'assemblebase'))], {
		stdio: 'inherit'
	}).on('exit', function() {
		cluster.fork();
		run(cluster, processArgs());
	});
};

function printHelp() {
	console.log(
		'Usage: test [options]\n\n' +
		'Options:\n' +
		'   -m --multi-threaded    Enables multi-threaded testing\n' +
		'   -c --chapter CHAPTER   The chapter/section/file/whatever to test\n' +
		'   -h --help              Displays this help information');
}

function processArgs() {
	var options = {
			'multi-threaded': false,
			chapter: ''
		},
		args = process.argv,
		currentArg;

	args.splice(0, 2); // remove "node tests"
	console.log();
	while(args.length) {
		currentArg = args.shift();
		switch(currentArg) {
			case '-m':
			case '--multi-threaded':
				options['multi-threaded'] = true;
				break;
			case '-c':
			case '--chapter':
				options.chapter = args.shift();
				if (!options.chapter) {
					console.error('A chapter identifier must be specified with the -c flag');
				printHelp();
				process.exit(1);
				}
				break;
			case '-h':
			case '--help':
				printHelp();
				process.exit(1);
				break;
			default:
				console.error('Invalid argument "' + currentArg + '"');
				printHelp();
				process.exit(1);
				break;
		}
	}
	return options;
}

function run(cluster, options) {
	var multiThreaded = options['multi-threaded'],
		chapter = options.chapter,
		testList = [],
		numTests,
		successes = 0,
		total = 0,
		startTime = Date.now(),
		testsFailed = [],
		i, numThreads = multiThreaded ? require('os').cpus().length : 1,
		printFinishedCountdown = numThreads;

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
				testutiles.getPrettyTime((numTests - total) * (Date.now() - startTime) / total) + ' remaining, ' +
				Math.floor(100 * successes / total) + '% pass rate so far): ' +
				message.file + (!message.success ? '\n   ' + message.error : ''));

			setTimeout(function () {
				processFile(worker);
			}, 0);
		});
		return worker;
	}

	function processFile(worker) {
		var file = testList.shift();

		if (!file) {
			printFinishedCountdown--;
			if (!printFinishedCountdown) {
				console.log('\nAll tests finished in ' + testutiles.getPrettyTime(Date.now() - startTime) + '. ' +
					successes + ' out of ' + total + ' tests (' + Math.floor(100 * successes / total) + '%) passed.\n');
				if (testsFailed.length) {
					console.log(testsFailed.length + ' test' + (testsFailed.length === 1 ? '' : 's') + ' failed:\n' +
						testsFailed.sort().join('\n') + '\n');
				}
				if (options['test-node']) {
					wrench.rmdirSyncRecursive(path.resolve(path.join('/', 'tmp', 'titanium-code-processor')));
				}
				process.exit();
			}
		} else {
			worker.send({
				type: 'processFile',
				testSuiteFile: file
			});
			worker.timeout = setTimeout(function () {
				worker.destroy();
				total++;
				testsFailed.push(file);

				console.log('FAIL (' + total + ' of ' + numTests +', ' +
					testutiles.getPrettyTime((numTests - total) * (Date.now() - startTime) / total) + ' remaining, ' +
					Math.floor(100 * successes / total) + '% pass rate so far): ' +
					file + '\n   Execution timeout exceeded');

				setTimeout(function () {
					worker.destroy();
					processFile(createWorker());
				}, 0);
			}, 30000);
		}
	}

	testList = testutiles.getTests(chapter);
	numTests = testList.length;

	// Run the tests
	console.log('Running ' + numTests + ' tests from ' + (options.chapter ? 'Chapter ' + options.chapter.toString().replace(/\//g, '.') : 'all chapters') +
		' using ' + (numThreads > 1 ? numThreads + ' threads' : '1 thread') + '\n');
	for(i = 0; i < numThreads; i++) {
		processFile(createWorker());
	}
}