/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Provides a CLI for the code processor unit tests
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var path = require('path'),

	testutils = require('./testutils');

module.exports.run = function () {

	process.on('message', function (message) {
		switch(message.type) {
			case 'processFile':
				testutils.evaluateTest(path.join(testutils.getTest262Dir(), message.testSuiteFile), message.sdkPath, undefined, function (results) {
					process.send({
						success: results.success,
						error: results.error,
						isInternalError: results.isInternalError,
						file: message.testSuiteFile
					});
				});
				break;
		}
	});
};
