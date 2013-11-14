/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Contains exception handling functions
 *
 * @module base/exceptions
 */
/*global
Runtime,
StringType,
getValue,
getIdentifierReference,
isSkippedMode,
getGlobalContext,
type,
RuleProcessor
*/

/*****************************************
 *
 * Exception handling
 *
 *****************************************/

/**
 * Throws a native exception if exception recovery is turned off, else reports an error but doesn't actually throw
 * the exception.
 *
 * @method module:base/exceptions.handleRecoverableNativeException
 * @param {string} exceptionType The type of exception, e.g. 'TypeError'
 * @param {string} message The exception message
 */
exports.handleRecoverableNativeException = handleRecoverableNativeException;
function handleRecoverableNativeException(exceptionType, message) {
	if (!isSkippedMode()) {
		if (Runtime.options.nativeExceptionRecovery && !Runtime.options.exactMode) {
			Runtime.reportError(exceptionType, message, RuleProcessor.getStackTrace());
		} else {
			throwNativeException(exceptionType, message);
		}
	}
}

/**
 * Throws a native exception. Due to the internal nature, we have to do a little tricker to get the result inserted into
 * the rule processing flow.
 *
 * @method module:base/exceptions.throwNativeException
 * @param {string} exceptionType The type of exception, e.g. 'TypeError'
 * @param {string} message The exception message
 */
exports.throwNativeException = throwNativeException;
function throwNativeException (exceptionType, message) {
	var exc = getValue(getIdentifierReference(getGlobalContext().variableEnvironment, exceptionType, false));
	throwException(exc.construct([new StringType(message)]));
}

/**
 * Throws a native exception. Due to the internal nature, we have to do a little trick to get the result inserted into
 * the rule processing flow.
 *
 * @method module:base/exceptions.throwException
 * @param {string} exceptionType The type of exception, e.g. 'TypeError'
 * @param {string} message The exception message
 */
exports.throwException = throwException;
function throwException (exception) {
	var error;

	// Set the exception
	debugger;
	exception.stackTrace = RuleProcessor.getStackTrace();
	Runtime._exception = exception;

	error = new Error('VM exception flow controller');
	error.isCodeProcessorException = true;

	throw error;
}

/**
 * Processes the variety of forms that exceptions can take into a single manageable type
 *
 * @method module:base/exceptions.getExceptionMessage
 * @return {string} The exception message
 */
exports.getExceptionMessage = getExceptionMessage;
function getExceptionMessage(exception) {
	if (type(exception) === 'String') {
		exception = exception.value;
	} else if (type(exception) === 'Unknown') {
		exception = '<unknown>';
	} else {
		exception = exception._lookupProperty('message').value;
		if (type(exception) === 'Unknown') {
			exception = '<unknown>';
		} else {
			exception = exception.value;
		}
	}
	return exception;
}