/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * Provides a CLI for the code processor unit tests
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var CodeProcessor = require('../../lib/CodeProcessor'),
	Base = require('../../lib/Base');

process.on('message', function(message) {
	var testFilePath = message.file,
		properties = message.properties,
		success = true,
		errorMessage = '';
	try {

		result = CodeProcessor.process([testFilePath], [], {
			executionTimeLimit: 10000,
			exactMode: true
		});
		
		if (result && result[0] === 'throw') {
			if (result[1]) {
				switch(Base.type(result[1])) {
					case 'String': value = result[1].value; break;
					case 'Object': value = result[1]._properties['message'].value.value; break;
				}
				success = properties.hasOwnProperty('negative');
				if (!success) {
					errorMessage = 'Exception: ' + value;
				}
			} else {
				errorMessage = '**** Internal error: missing throw value at line ' + Runtime.getCurrentLocation().line;
				success = false;
			}
		} else { // Parse non-exception errors
			result = CodeProcessor.getResults();
			if (result.errors.length) {
				errorMessage = []
				result.errors.forEach(function(err) {
					try {
						errorMessage.push('Error: ' + err.name + ': ' + err.data.exception._properties.message.value.value);
					} catch(e) {}
				});
				errorMessage = errorMessage.join('\n');
				success = false;
			} else {
				success = !properties.hasOwnProperty('negative');
				if (!success) {
					errorMessage = 'The test was expected to fail but didn\'t';
				}
			}
		}

	} catch(e) {
		errorMessage = '**** Internal error: ' + e.message + '\n' + e.stack;
	}
	process.send({ 
		success: success,
		errorMessage: errorMessage
	});
	process.exit();
});