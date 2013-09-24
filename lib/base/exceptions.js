/*global
Runtime,
StringType,
getValue,
getIdentifierReference,
inTryCatch,
getGlobalContext,
isSkippedMode,
type
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
 * @method
 * @name module:Base.handleRecoverableNativeException
 * @param {String} exceptionType The type of exception, e.g. 'TypeError'
 * @param {String} message The exception message
 */
exports.handleRecoverableNativeException = handleRecoverableNativeException;
function handleRecoverableNativeException(exceptionType, message) {
	if (isSkippedMode()) {
		Runtime.reportError(exceptionType, message);
		return; // Squash errors in skipped mode
	}
	if (!inTryCatch() && Runtime.options.nativeExceptionRecovery && !Runtime.options.exactMode) {
		Runtime.reportError(exceptionType, message);
	} else {
		throwNativeException(exceptionType, message);
	}
}

/**
 * Throws a native exception. Due to the internal nature, we have to do a little tricker to get the result inserted into
 * the rule processing flow.
 *
 * @method
 * @name module:Base.throwNativeException
 * @param {String} exceptionType The type of exception, e.g. 'TypeError'
 * @param {String} message The exception message
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
 * @method
 * @name module:Base.throwException
 * @param {String} exceptionType The type of exception, e.g. 'TypeError'
 * @param {String} message The exception message
 */
exports.throwException = throwException;
function throwException (exception) {
	var error;

	// Set the exception
	exception.stackTrace = Runtime.getStackTrace();
	Runtime._exception = exception;

	error = new Error('VM exception flow controller');
	error.isCodeProcessorException = true;

	throw error;
}

/**
 * Processes the variety of forms that exceptions can take into a single manageable type
 *
 * @methpd
 * @returns {String} The exception message
 */
exports.getsExceptionMessage = getsExceptionMessage;
function getsExceptionMessage(exception) {
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