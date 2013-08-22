/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Provides a CLI for the code processor unit tests
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var path = require('path'),
	exec = require('child_process').exec,
	os = require('os'),

	dnode = require('dnode'),
	mdns = require('mdns');

module.exports.run = function (cluster) {
	require('child_process').spawn('node', [path.resolve(path.join(__dirname, '..', '..', 'tools', 'assemblebase'))], {
		stdio: 'inherit'
	}).on('exit', function() {
		cluster.fork(); // Not sure why this is needed, but it crashes without it
		exec('titanium sdk list -o json', function (error, stdout, stderr) {

			if (error) {
				throw new Error('Could not query the SDK information: ' + stderr);
			}

			var sdkInfo = JSON.parse(stdout),
				sdkPath = sdkInfo.installed[sdkInfo.activeSDK],
				server;

			// Start the server and advertise it
			server = dnode({
				getConfig: function (callback) {
					callback({
						numCPUs: os.cpus().length
					});
				},
				runUnitTest: function (testSuiteFile, callback) {
					if (testSuiteFile) {
						console.log('Running test "' + testSuiteFile + '"');
						var worker = cluster.fork(),
							timeout = setTimeout(function () {
								callback({
									success: false,
									error: 'Test timed out',
									isInternalError: false,
									file: testSuiteFile
								});
								console.log('Test "' + testSuiteFile + '" timed out');
								worker.destroy();
							}, 30000);
						worker.on('message', function(message) {
							callback(message);
							console.log('Test "' + testSuiteFile + '" finished');
							clearTimeout(timeout);
							worker.destroy();
						});
						worker.send({
							type: 'processFile',
							testSuiteFile: testSuiteFile,
							sdkPath: sdkPath
						});
					} else {
						callback();
					}
				},
				exit: function () {
					console.log('Received exit command');
					process.exit();
				}
			});
			server.listen(7070);
			mdns.createAdvertisement(mdns.tcp('ticp-unit-test'), 7070).start();
			console.log('Unit test server running on port 7070');
		});
	});
};
