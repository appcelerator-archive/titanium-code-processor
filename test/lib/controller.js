/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Provides a CLI for the code processor unit tests
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var dnode = require('dnode'),

	testutiles = require('./testutils'),

	servers = [],
	testList = [],
	numTests,
	successes = 0,
	total = 0,
	startTime = Date.now(),
	testsFailed = [];

module.exports.addService = function addService(host, port) {
	var d = dnode.connect({
			host: host,
			port: port
		});
	d.on('remote', function (remote) {
		remote.getConfig(function (config) {
			servers.push({
				d: d,
				remote: remote,
				config: config,
				numTestsRunning: 0
			});
			console.log('****** Connected to unit test server ' + host + ':' + port + ' with ' + config.numCPUs + ' CPUs ******\n');
			pump();
		});
	});
};

module.exports.removeService = function removeService(config) {
	console.log('ERROR: server was removed', config);
};

module.exports.init = function runTests(chapters) {
	testList = testutiles.getTests(chapters);
	numTests = testList.length;
	console.log('Running ' + numTests + ' tests from ' + (chapters ? 'Chapter ' + chapters.toString().replace(/\//g, '.') : 'all chapters') + '\n');
};

function pump() {
	var i, len,
		server;
	for (i = 0, len = servers.length; i < len; i++) {
		server = servers[i];
		while (server.numTestsRunning < server.config.numCPUs) {
			runNextTest(server);
		}
	}
}

function runNextTest(server) {
	var test = testList.shift();
	server.numTestsRunning++;
	server.remote.runUnitTest(test, function (results) {
		server.numTestsRunning--;
		if (results) {
			total++;
			if (results.success) {
				successes++;
			} else {
				testsFailed.push(results.file);
			}

			console.log((results.success ? 'PASS' : 'FAIL') + ' (' + total + ' of ' + numTests +', ' +
				testutiles.getPrettyTime((numTests - total) * (Date.now() - startTime) / total) + ' remaining, ' +
				Math.floor(100 * successes / total) + '% pass rate so far): ' +
				results.file + (!results.success ? '\n   ' + results.error : ''));

			if (total == numTests) {
				console.log('\nAll tests finished in ' + testutiles.getPrettyTime(Date.now() - startTime) + '. ' +
					successes + ' out of ' + total + ' tests (' + Math.floor(100 * successes / total) + '%) passed.\n');
				if (testsFailed.length) {
					console.log(testsFailed.length + ' test' + (testsFailed.length === 1 ? '' : 's') + ' failed:\n' +
						testsFailed.sort().join('\n') + '\n');
				}
				process.exit();
			}
		}
		pump();
	});
}
