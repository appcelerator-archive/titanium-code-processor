/*global
Runtime
StringType
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
function handleRecoverableNativeException(exceptionType, message, location) {
	var exception;
	if (!Runtime.inTryCatch() && Runtime.options.nativeExceptionRecovery && !Runtime.options.exactMode) {
		exception = Runtime.getGlobalObject().get(exceptionType).construct([new StringType(message)]);
		location = location || Runtime.getCurrentLocation();
		exception.filename = location.filename;
		exception.line = location.line;
		exception.column = location.column;
		Runtime.reportError(exceptionType, 'An exception was thrown but not caught: ' + message, {
			description: 'Uncaught exception',
			exception: exception
		});
	} else {
		throwNativeException(exceptionType, message, location);
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
function throwNativeException (exceptionType, message, location) {
	throwException(Runtime.getGlobalObject().get(exceptionType).construct([new StringType(message)]), location);
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
function throwException (exception, location) {
	var error;
	location = location || Runtime.getCurrentLocation();

	// Set the exception
	exception.filename = location.filename;
	exception.line = location.line;
	exception.column = location.column;
	exception.stackTrace = Runtime.getStackTrace();
	Runtime._exception = exception;

	error = new Error('VM exception flow controller');
	error.isCodeProcessorException = true;

	throw error;
}