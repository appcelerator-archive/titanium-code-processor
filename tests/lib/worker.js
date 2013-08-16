/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Provides a CLI for the code processor unit tests
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

module.exports.run = function () {

	var options,
		testutils = require('./testutils'),
		queuedMessage,
		initializing;

	process.on('message', function (message) {
		switch(message.type) {
			case 'init':
				options = message.options;
				initializing = true;
				testutils.initCodeProcessor(undefined, function () {
					initializing = false;
					if (queuedMessage) {
						processFile(queuedMessage);
						queuedMessage = undefined;
					}
				});
				break;
			case 'processFile':
				if (initializing) {
					if (queuedMessage) {
						throw new Error('Invalid state');
					}
					queuedMessage = message;
				} else {
					processFile(message);
				}
				break;
		}
	});

	function processFile(message) {
		var testFile = message.testSuiteFile,
			results = testutils.evaluateTest(testFile);
		process.send({
			success: results.success,
			error: results.error,
			isInternalError: results.isInternalError,
			file: testFile
		});
	}
};