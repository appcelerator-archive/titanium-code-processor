/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Provides a CLI for the code processor unit tests
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var CodeProcessor = require('../../lib/CodeProcessor'),
	Base = require('../../lib/Base'),
	Runtime = require('../../lib/Runtime');

process.on('message', function(message) {
	var testFilePath = message.file,
		properties = message.properties,
		success = false,
		errorMessage = '',
		result,
		value;

	// Run the test
	try {
		result = CodeProcessor.process([testFilePath], [], {
			exactMode: true
		});
		
		if (result && result[0] === 'throw') {
			if (result[1]) {
				switch(Base.type(result[1])) {
					case 'String': value = result[1].value; break;
					case 'Object': value = result[1]._lookupProperty('message').value.value + ' (line ' + (result[1].line) + ')'; break;
				}
				success = properties.hasOwnProperty('negative');
				if (!success) {
					errorMessage = 'Exception: ' + value;
				}
			} else {
				errorMessage = '**** Internal error: missing throw value at line ' + Runtime.getCurrentLocation().line;
			}
		} else { // Parse non-exception errors
			result = CodeProcessor.getResults();
			if (result.errors.length === 1) {
				errorMessage = 'Error: ' + result.errors[0].name + ': ' + (result.errors[0].data.message ?
					result.errors[0].data.message :
					result.errors[0].data.exception._lookupProperty('message').message.value.value);
				success = properties.hasOwnProperty('negative');
			} else if (result.errors.length > 1) {
				errorMessage = ['Multiple errors: '];
				result.errors.forEach(function(err) {
					try {
						errorMessage.push(err.name + ': ' + err.data.exception._lookupProperty('message').value.value);
					} catch(e) {}
				});
				errorMessage = errorMessage.join('\n');
				success = properties.hasOwnProperty('negative');
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