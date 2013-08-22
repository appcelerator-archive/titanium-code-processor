/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Provides a CLI for the code processor unit tests
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var exec = require('child_process').exec,
	numCPUs = require('os').cpus().length,
	i;

module.exports.run = function (cluster) {
	exec('titanium sdk list -o json', function (error, stdout, stderr) {

		if (error) {
			throw new Error('Could not query the SDK information: ' + stderr);
		}

		var sdkInfo = JSON.parse(stdout),
			sdkPath = sdkInfo.installed[sdkInfo.activeSDK];

		function createWorker(port) {
			cluster.fork({
				unitTestConfig: {
					sdkPath: sdkPath,
					port: port
				}
			});
		}

		for (i = 0; i < numCPUs; i++) {
			createWorker(5000 + i);
		}
	});
};