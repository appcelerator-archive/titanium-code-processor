/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Provides a CLI for the code processor unit tests
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

module.exports.run = function () {

	var options,
		testutils = require('./testutils');

	process.on('message', function (message) {
		switch(message.type) {
			case 'init':
				options = message.options;
				testutils.initCodeProcessor();
				break;
			case 'processFile':
				processFile(message);
				break;
		}
	});

	function processFile(message) {
		var testFile = message.testSuiteFile,
			results = testutils.evaluateTest(testFile);

		process.send({
			success: results.success,
			error: results.error,
			file: testFile
		});
	}
};