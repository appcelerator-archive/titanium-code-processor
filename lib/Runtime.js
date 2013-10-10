/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * This module provides information on the current state of the VM, the ability to change the state of the VM, and
 * communication-like services, such as logging and events.
 *
 * @module Runtime
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var path = require('path'),

	errors = [],
	warnings = [],

	jsRegex = /\.js$/,

	logger,

	globalEvented,

	locationStack = [],

	processedFilesList = [],
	functions = [],

	asts = {},
	astIdentifier = 1,

	delayedFunctionsQueue = [],
	delayedFunctionsQueueIndex = 0;

/**
 * The global options to be used in processing
 *
 * @type Object
 * @name module:Runtime.options
 * @property {Boolean} invokeMethods Indicates whether or not methods should be invoked
 * @property {Boolean} evaluateLoops Indicates whether or not loops should be evaluated
 * @property {Number} maxLoopIterations Indicates the maximum number of loop iterations to evaluate before erroring
 *		(infinite loop guard)
 * @property {Number} maxRecursionLimit Indicates the maximum recursion depth to evaluate before erroring
 *		(infinite recursion guard)
 * @property {Boolean} logConsoleCalls If enabled, all console.* calls in a user's code are logged to the terminal
 * @property {Number|undefined} executionTimeLimit Indicates the maximum time the app is allowed to run before erroring.
 *		Undefined means no limit
 * @property {Boolean} exactMode Indicates whether or not the app should be evaluated in exact mode. Exact mode does not
 *		use ambiguous mode and throws an exception if an Unknown type is encountered
 * @property {Boolean} nativeExceptionRecovery Indicates whether or not to try and recover from native exceptions.
 *		Default is false because enabling it has the potential of introducing errors in the analysis
 * @property {Boolean} processUnvisitedCode When set to true, all nodes and files that are not visited/skipped will be
 *		processed in ambiguous mode after all other code has been processed. While this will cause more of a project to
 *		be analyzed, this will decrease accuracy and can generate a lot of false positives.
 */
exports.options = {
	invokeMethods: true,
	evaluateLoops: true,
	maxLoopIterations: 200000,
	maxRecursionLimit: 10,
	cycleDetectionStackSize: 10000,
	maxCycles: 200001,
	logConsoleCalls: true,
	nativeExceptionRecovery: true,
	executionTimeLimit: 300000, // 5 minute timeout
	exactMode: false,
	processUnvisitedCode: false
};

/**
 * The current recursion depth
 *
 * @type Number
 * @name module:Runtime.recursionCount
 */
exports.recursionCount = 0;

/**
 * The time when execution will time out
 *
 * @type Number
 * @name module:Runtime.executionTimeLimit
 */
exports.executionTimeLimit = 0;

/**
 * A VM object representation of an error thrown from {@link module:Base.throwNativeException} or {@link module:Base.throwException}
 *
 * @type module:Base.ObjectType
 * @private
 */
exports._exception = undefined;

/**
 * The plugins associated with this run
 *
 * @type Object
 * @private
 */
exports.plugins = undefined;

/**
 * The source information
 *
 * @type Object
 * @property {String} sourceDir The directory containing the source code to be analyzed
 * @property {String} originalSourceDir The original directory that contained source code. Source maps map from here to sourceDir
 * @property {String} entryPoint The entry point for the project
 * @property {Object} sourceMaps The source maps in key-value form. The key is a relative path to the file with sourceDir as the base
 */
exports.sourceInformation = undefined;

/**
 * Gets the current location being processed
 *
 * @method
 * @name module:Runtime.getCurrentLocation
 * @returns {Object} The current location, containing three entries: 'file', 'line', 'column'
 */
exports.getCurrentLocation = getCurrentLocation;
function getCurrentLocation() {
	return locationStack[locationStack.length - 1] || {
		filename: '',
		line: 0,
		column: 0
	};
}

/**
 * Sets the current location
 *
 * @method
 * @name module:Runtime.setCurrentLocation
 * @param {Number} line The current line
 * @param {Number} column The current column
 */
exports.setCurrentLocation = setCurrentLocation;
function setCurrentLocation(filename, line, column) {
	locationStack.push({
		filename: filename,
		line: line,
		column: column
	});
}

/**
 * Maps a location to its original source
 *
 * @method
 * @name module:Runtime.mapLocation
 * @param {Object} location The location to map
 * @param {String} location.filename The name of the file
 * @param {Number} location.line The line number in the file
 * @param {Number} location.column The column number in the file
 */
exports.mapLocation = mapLocation;
function mapLocation(location) {
	var sourceInformation = exports.sourceInformation,
		sourceMaps = sourceInformation && sourceInformation.sourceMaps,
		sourceMap,
		mappedLocation;
	if (sourceMaps) {
		sourceMap = sourceMaps[path.relative(exports.sourceInformation.sourceDir, location.filename)];
		if (sourceMap) {
			mappedLocation = sourceMap.originalPositionFor({
				line: location.line,
				column: location.column
			});
			return {
				filename: path.join(mappedLocation.source),
				line: mappedLocation.line,
				column: mappedLocation.column
			};
		} else {
			return location;
		}
	} else {
		return location;
	}
}

/**
 * Exits the current location, from a runtime perspective
 *
 * @method
 * @name module:Runtime.exitCurrentLocation
 */
exports.exitCurrentLocation = exitCurrentLocation;
function exitCurrentLocation() {
	locationStack.pop();
}

/**
 * Exists to be overridden
 * @method
 * @param {String} filename The file to check
 * @returns {Boolean} Whether or not the file is a valid JavaScript file
 */
exports.isFileValid = isFileValid;
function isFileValid(filename) {
	return jsRegex.test(filename);
}

/**
 * Checks if the current location's file is blacklisted or not
 *
 * @method
 * @returns {Boolean} Whether or not the current file has been blacklisted
 */
exports.isCurrentFileBlacklisted = isCurrentFileBlacklisted;
function isCurrentFileBlacklisted() {
	return isFileBlacklisted(getCurrentLocation().filename);
}

/**
 * Checks if the given files has been blacklisted
 *
 * @method
 * @param  {String} filename The path to the file to check
 * @returns {Boolean} Whether or not the given file has been blacklisted
 */
exports.isFileBlacklisted = isFileBlacklisted;
function isFileBlacklisted(filename) {
	var i, len,
		whiteList = exports.options.whiteList;
	if (whiteList) {
		for (i = 0, len = whiteList.length; i < len; i++) {
			if (filename.indexOf(whiteList[i]) === 0) {
				return false;
			}
		}
		return true;
	}
	return false;
}

/**
 * Adds an AST to the set of processed ASTs
 *
 * @method
 * @name module:Runtime.setAST
 * @param {String} [file] The name of the file that generated this AST. If not supplied, an identifier is automatically generated
 */
exports.setAST = setAST;
function setAST(ast, filename) {
	if (!filename) {
		filename = '@unnamed_ast_' + (astIdentifier++);
	}
	asts[filename] = ast;
}

/**
 * Gets the list of ASTs that have been processed
 *
 * @method
 * @name module:Runtime.getASTSet
 * @returns {Object} A dictionary of the ASTs processed, with the filename/identifier as the key and the AST as the value
 */
exports.getASTSet = getASTSet;
function getASTSet() {
	return asts;
}

/**
 * Gets the list of files that have been processed so far
 *
 * @method
 * @name module:Runtime.getProcessedFilesList
 * @returns {Array[String]} An array of filenames
 */
exports.getProcessedFilesList = getProcessedFilesList;
function getProcessedFilesList() {
	return processedFilesList;
}

/**
 * Gets the list of files that have not been processed so far (and may not be)
 *
 * @method
 * @name module:Runtime.getUnprocessedFilesList
 * @returns {Array[String]} An array of filenames
 */
exports.getUnprocessedFilesList = getUnprocessedFilesList;
function getUnprocessedFilesList() {
	var i, len,
		unprocessedFiles = [];
	for (i = 0, len = exports.fileList.length; i < len; i++) {
		if (processedFilesList.indexOf(exports.fileList[i]) === -1) {
			unprocessedFiles.push(exports.fileList[i]);
		}
	}
	return unprocessedFiles;
}

/**
 * Adds a function to the list of all functions
 *
 * @method
 * @name module:Runtime.addFunction
 * @param {moduel:AST.node} func The function to add
 */
exports.addFunction = addFunction;
function addFunction (func) {
	if (functions.indexOf(func) === -1) {
		functions.push(func);
	}
}

/**
 * Gets all functions that haven't been processed yet
 *
 * @method
 * @returns {Array[module:AST.node]} The list of unprocessed functions
 */
exports.getNextUnprocessedFunction = getNextUnprocessedFunction;
function getNextUnprocessedFunction() {
	var bodyNode,
		i, len = functions.length;
	for (i = 0; i < len; i++) {
		bodyNode = functions[i].body[0];
		if (bodyNode && !bodyNode._visited && !bodyNode._skipped) {
			return functions[i];
		}
	}
}

/**
 * Queues a function for later evaluation
 *
 * @method
 * @name module:Runtime.queueFunction
 * @param {module:Base.FunctionType} func The function to execute later
 */
exports.queueFunction = queueFunction;
function queueFunction(func, thisVal, args, ambiguousContext, skippedContext) {

	// Make sure that the function isn't already in the queue
	var location = getCurrentLocation(),
		filename = location.filename,
		line = location.line,
		column = location.column,
		i, len;
	for (i = 0, len = delayedFunctionsQueue.length; i < len; i++) {
		if (delayedFunctionsQueue[i].filename === filename &&
				delayedFunctionsQueue[i].line === line &&
				delayedFunctionsQueue[i].column === column) {
			return;
		}
	}

	// Set the thisVal to its default here since we won't be able to get it later
	if (!func.strict && (!thisVal || thisVal.className === 'Null' || thisVal.className === 'Undefined')) {
		// I really hate doing an inline require, but it's necessary to break a circular dependency without moving
		// everythign in this file to Context.js
		thisVal = require('./Base').getModuleContext().thisBinding;
	}

	// Queue the function
	delayedFunctionsQueue.push({
		func: func,
		thisVal: thisVal,
		args: args || [],
		ambiguousContext: !!ambiguousContext,
		skippedContext: !!skippedContext,
		filename: filename,
		line: line,
		column: column
	});
}

/**
 * Gets the next delayed execution function to be executed
 *
 * @method
 * @name module:Runtime.getNextQueuedFunction
 * @return {module:Base.FunctionType} The next function to be executed
 */
exports.getNextQueuedFunction = getNextQueuedFunction;
function getNextQueuedFunction() {
	if (delayedFunctionsQueue[delayedFunctionsQueueIndex]) {
		return delayedFunctionsQueue[delayedFunctionsQueueIndex++];
	}
}

/**
 * @private
 */
function createEventObject(type, description, data) {
	var location = getCurrentLocation(),
		result = {
			type: type,
			description: description,
			data: data
		};
	if (data && data.exception) {
		result.filename = data.exception.filename;
		result.line = data.exception.line;
		result.column = data.exception.column;
	} else if (location) {
		result.filename = location.filename;
		result.line = location.line;
		result.column = location.column;
	}

	return result;
}

// ******** Evented Object Methods ********
/**
 * Base class for adding event support to other objects.
 *
 * @constructor
 * @name module:Runtime.Evented
 */
exports.Evented = Evented;
function Evented() {
	this.listeners = {};
}

/**
 * Adds an event listener for the given event name.
 *
 * @method
 * @name module:Runtime.Evented#on
 * @param {String} name The name of the event to listen to, e.g. 'parseError'
 * @param {function} callback The function to call when the event is fired
 */
Evented.prototype.on = function on(name, callback) {
	var eventListeners = this.listeners;
	if (!eventListeners[name]) {
		eventListeners[name] = [];
	}
	eventListeners[name].push(callback);
};

/**
 * Fires a process state event to the current listener set.
 *
 * @method
 * @name module:Runtime.Evented#fireEvent
 * @param {String} name The name of the event, e.g. 'projectProcessingEnd'
 * @param {String} description A description of the event, e.g. 'Processing completed successfully'
 * @param {Object} [data] Exra data associated with the event
 */
Evented.prototype.fireEvent = function fireEvent(name, description, data) {
	var listeners = this.listeners[name],
		i, len = listeners ? listeners.length : 0,
		e = createEventObject(name, description, data);
	log('trace', 'Firing event "' + name + '": ' + description + (e.filename ? ' (' + e.filename + ':' + e.line + ')' : ''));
	for (i = 0; i < len; i++) {
		listeners[i](e);
	}
};

// ******** Global Event Methods ********

globalEvented = new Evented();

/**
 * Adds an event listener for the given event name.
 *
 * @method
 * @name module:Runtime.on
 * @param {String} name The name of the event to listen to, e.g. 'syntaxError'.
 * @param {function} callback The function to call when the event is fired.
 */
exports.on = on;
function on() {
	return globalEvented.on.apply(globalEvented, arguments);
}

/**
 * Fires a process state event to the current listener set.
 *
 * @method
 * @param {String} name The name of the event, e.g. 'processingcomplete.'
 * @param {String} description A description of the event.
 */
exports.fireEvent = fireEvent;
function fireEvent() {
	return globalEvented.fireEvent.apply(globalEvented, arguments);
}

// ******** Error/warning Methods ********

/**
 * Reports an error
 *
 * @method
 * @name module:Runtime.reportError
 * @param {String} type The type of the error, e.g. 'SyntaxError'
 * @param {String} description A description of the error.
 */
exports.reportError = reportError;
function reportError(type, description, stackTrace) {

	// Squash the reporting of the error if we are in skipped mode
	if (require('./Base').isSkippedMode()) {
		return;
	}

	var i, len,
		error,
		eventObject = createEventObject(type, description || '');
	for (i = 0, len = errors.length; i < len; i++) {
		error = errors[i];
		if (error.file === eventObject.file && error.line === eventObject.line && error.column === eventObject.column &&
				error.type === eventObject.type && error.description === eventObject.description) {
			error.occurances++;
			return;
		}
	}
	eventObject.occurances = 1;
	fireEvent('errorReported', type + ': ' + description, {
		type: type,
		description: description
	});
	log('error', type + ': ' + description +
		(stackTrace ? '\n    at ' + stackTrace.join('\n    at ') : ''));
	errors.push(eventObject);
}

/**
 * Reports a syntax error from uglify. Syntax errors from Uglify are handled differently because the code processor
 * needs to get the location via a different means than all other errors since they aren't generated internally.
 *
 * @method
 * @name module:Runtime.reportError
 * @param {Object} uglifyError The exception thrown by Uglify
 */
exports.reportUglifyError = reportUglifyError;
function reportUglifyError(uglifyError) {

	// Squash the reporting of the error if we are in skipped mode
	if (require('./Base').isSkippedMode()) {
		return;
	}

	var i, len,
		error,
		eventObject = createEventObject('SyntaxError', uglifyError.message || '');
	eventObject.filename = uglifyError.filename;
	eventObject.line = uglifyError.line;
	eventObject.column = uglifyError.column;
	for (i = 0, len = errors.length; i < len; i++) {
		error = errors[i];
		if (error.file === eventObject.file && error.line === eventObject.line && error.column === eventObject.column &&
				error.type === eventObject.type && error.description === eventObject.description) {
			error.occurances++;
			return;
		}
	}
	eventObject.occurances = 1;
	fireEvent('errorReported', 'SyntaxError: ' + uglifyError.message, {
		type: 'SyntaxError',
		description: uglifyError.message
	});
	log('error', 'SyntaxError: ' + uglifyError.message);
	errors.push(eventObject);
}

/**
 * Reports a warning
 *
 * @method
 * @name module:Runtime.reportWarning
 * @param {String} type The type of the warning, e.g. 'requireMissing.'  Note: the type will be made lowercase.
 * @param {String} description A description of the warning, e.g. 'Processing completed successfully'
 */
exports.reportWarning = reportWarning;
function reportWarning(type, description) {

	// Squash the reporting of the error if we are in skipped mode
	if (require('./Base').isSkippedMode()) {
		return;
	}

	var i, len,
		warning,
		eventObject = createEventObject(type, description || '');
	for (i = 0, len = warnings.length; i < len; i++) {
		warning = warnings[i];
		if (warning.file === eventObject.file && warning.line === eventObject.line && warning.column === eventObject.column &&
				warning.type === eventObject.type && warning.description === eventObject.description) {
			warning.occurances++;
			return;
		}
	}
	eventObject.occurances = 1;
	fireEvent('warningReported', type + ': ' + description, {
		type: type,
		description: description
	});
	log('warn', type + ': ' + description);
	warnings.push(eventObject);
}

/**
 * Gets the list of all reported errors
 *
 * @method
 * @name module:Runtime.getReportedErrors
 * @name module:Runtime.getReportedErrors
 * @returns {Array[Object]} The list of errors, as supplied to {@link module:Runtime.reportError}.
 */
exports.getReportedErrors = getReportedErrors;
function getReportedErrors() {
	return errors;
}

/**
 * Gets the list of all reported warnings
 *
 * @method
 * @name module:Runtime.getReportedWarnings
 * @name module:Runtime.getReportedWarnings
 * @returns {Array[Object]} The list of warnings, as supplied to {@link module:Runtime.reportWarning}.
 */
exports.getReportedWarnings = getReportedWarnings;
function getReportedWarnings() {
	return warnings;
}

// ******** Logging Methods ********

/**
 * Sets the logger that everything will use
 *
 * @method
 * @name module:Runtime.setLogger
 * @name module:Runtime.setLogger
 * @param {Winston logger} newLogger The logger to set
 */
exports.setLogger = setLogger;
function setLogger(newLogger) {
	logger = newLogger;
}

/**
 * Logs a message
 *
 * @method
 * @name module:Runtime.log
 * @param {String} level The log level of the message
 * @param {String} message The message to log
 */
exports.log = log;
function log(level, message) {
	if (logger) {
		logger.log(level, message);
	}
}

// ******** Runtime events to listen to ********

/**
 * @private
 */
on('enteredFile', function(e) {
	processedFilesList.push(e.data.filename);
});