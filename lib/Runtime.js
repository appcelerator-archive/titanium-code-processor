/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * This module provides information on the current state of the VM, the ability to change the state of the VM, and
 * communication-like services, such as logging and events.
 *
 * @module Runtime
 */

var path = require('path'),

	errors = [],
	warnings = [],

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
 * @property {boolean} invokeMethods Indicates whether or not methods should be invoked
 * @property {boolean} evaluateLoops Indicates whether or not loops should be evaluated
 * @property {number} maxLoopIterations Indicates the maximum number of loop iterations to evaluate before erroring
 *		(infinite loop guard)
 * @property {bumber} maxRecursionLimit Indicates the maximum number of recurses to allow before claiming a recursive
 *		call is infinitely recursive (infinite recursion guard)
 * @property {number} cycleDetectionStackSize The size of the stack to use for cycle detection
 * @property {number} maxCycles The maximum number of cycles to allow
 * @property {boolean} logConsoleCalls If enabled, all console.* calls in a user's code are logged to the terminal
 * @property {(number | undefined)} executionTimeLimit Indicates the maximum time the app is allowed to run before erroring.
 *		Undefined means no limit
 * @property {boolean} exactMode Indicates whether or not the app should be evaluated in exact mode. Exact mode does not
 *		use ambiguous mode and throws an exception if an Unknown type is encountered
 * @property {boolean} processUnvisitedCode When set to true, all nodes and files that are not visited/skipped will be
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
 * The wall-clock time when execution will time out, in unix epoch milliseconds
 *
 * @type number
 * @name module:Runtime.executionTimeLimit
 */
exports.executionTimeLimit = 0;

/**
 * A VM object representation of an error thrown from {@link module:base.throwNativeException} or {@link module:base/exception.throwException}
 *
 * @type module:base/types/object.ObjectType
 * @private
 */
exports._exception = undefined;

/**
 * The plugins associated with this run
 *
 * @type Object
 * @name module:Runtime.plugins
 */
exports.plugins = undefined;

/**
 * The source information
 *
 * @type module:CodeProcessor.sourceInformation
 * @name module:Runtime.sourceInformation
 */
exports.sourceInformation = undefined;

/**
 * Represents the location of an AST node in source code
 *
 * @typedef {Object} module:Runtime.location
 * @property {string} filename The name of the file that the node is in
 * @property {number} line The line number of the node
 * @property {number} column The column number of the node
 */
/**
 * Gets the current location being processed
 *
 * @method module:Runtime.getCurrentLocation
 * @return {module:Runtime.location} The current location
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
 * @method module:Runtime.setCurrentLocation
 * @param {string} filename The filename
 * @param {number} line The current line
 * @param {number} column The current column
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
 * @method module:Runtime.mapLocation
 * @param {module:Runtime.location} location The location to map
 * @return {module:Runtime.location} The mapped location, if it can be mapped, else the original location
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
 * @method module:Runtime.exitCurrentLocation
 */
exports.exitCurrentLocation = exitCurrentLocation;
function exitCurrentLocation() {
	locationStack.pop();
}

/**
 * Checks if the current location's file is blacklisted or not
 *
 * @method module:Runtime.isCurrentFileBlacklisted
 * @return {boolean} Whether or not the current file has been blacklisted
 */
exports.isCurrentFileBlacklisted = isCurrentFileBlacklisted;
function isCurrentFileBlacklisted() {
	return isFileBlacklisted(getCurrentLocation().filename);
}

/**
 * Checks if the given files has been blacklisted
 *
 * @method module:Runtime.isFileBlacklisted
 * @param  {string} filename The path to the file to check
 * @return {boolean} Whether or not the given file has been blacklisted
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
 * @method module:Runtime.setAST
 * @param {module:AST.node} ast The ast node to set
 * @param {string} [filename] The name of the file that generated this AST. If not supplied, an identifier is automatically generated
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
 * @method module:Runtime.getASTSet
 * @return {Object} A dictionary of the ASTs processed, with the filename/identifier as the key and the AST as the value
 */
exports.getASTSet = getASTSet;
function getASTSet() {
	return asts;
}

/**
 * Gets the list of files that have been processed so far
 *
 * @method module:Runtime.getProcessedFilesList
 * @return {Array.<string>} An array of filenames
 */
exports.getProcessedFilesList = getProcessedFilesList;
function getProcessedFilesList() {
	return processedFilesList;
}

/**
 * Gets the list of files that have not been processed so far (and may not be ever)
 *
 * @method module:Runtime.getUnprocessedFilesList
 * @return {Array.<string>} An array of filenames
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
 * @method module:Runtime.addFunction
 * @param {module:AST.node} func The function to add
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
 * @method module:Runtime.getNextUnprocessedFunction
 * @return {Array.<module:AST.node>} The list of unprocessed functions
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
 * @method module:Runtime.queueFunction
 * @param {module:base/types/function.FunctionType} func The function to execute later
 * @param {(module:base.BaseType | undefined)} thisVal The this value
 * @param {Array.<module:base.BaseType>} args The function arguments
 * @param {boolean} ambiguousContext Whether or not this should be evaluated in ambiguous mode
 * @param {boolean} skippedContext Whether or not this should be evaluated in skipped mode
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
		// everything in this file to Context.js
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
 * Gets the next queued function to be executed
 *
 * @method module:Runtime.getNextQueuedFunction
 * @return {module:base/types/function.FunctionType} The next function to be executed
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
 * @constructor module:Runtime.Evented
 */
exports.Evented = Evented;
function Evented() {
	this.listeners = {};
}

/**
 * An event object
 *
 * @typedef {Object} module:Runtime.eventObject
 * @property {string} type The type of the event
 * @property {string} description The description of the event
 * @property {(string | undefined)} filename The name of the file being processed when the event was triggered, if any
 * @property {(number | undefined)} line The line number of the file being processed when the event was triggered, if any
 * @property {(number | undefined)} column The column number of the file being processed when the event was triggered, if any
 * @property {Object} data The event-specific information
 */
/**
 * A callback to be called when an event is fired
 *
 * @callback module:Runtime.eventedOnCallback
 * @param {module:Runtime.eventObject} e The event information
 */
/**
 * Adds an event listener for the given event
 *
 * @method module:Runtime.Evented#on
 * @param {string} name The name of the event to listen to, e.g. 'parseError'
 * @param {module:Runtime.eventedOnCallback} callback The function to call when the event is fired
 */
Evented.prototype.on = function on(name, callback) {
	var eventListeners = this.listeners;
	if (!eventListeners[name]) {
		eventListeners[name] = [];
	}
	eventListeners[name].push(callback);
};

/**
 * Fires an event to the listener set
 *
 * @method module:Runtime.Evented#fireEvent
 * @param {string} name The name of the event, e.g. 'projectProcessingEnd'
 * @param {string} description A description of the event, e.g. 'Processing completed successfully'
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
 * Adds an event listener for the given event
 *
 * @method module:Runtime.on
 * @param {string} name The name of the event to listen to, e.g. 'parseError'
 * @param {module:Runtime.eventedOnCallback} callback The function to call when the event is fired
 */
exports.on = on;
function on() {
	return globalEvented.on.apply(globalEvented, arguments);
}

/**
 * Fires an event to the global listener set
 *
 * @method module:Runtime.fireEvent
 * @param {string} name The name of the event, e.g. 'projectProcessingEnd'
 * @param {string} description A description of the event, e.g. 'Processing completed successfully'
 * @param {Object} [data] Exra data associated with the event
 */
exports.fireEvent = fireEvent;
function fireEvent() {
	return globalEvented.fireEvent.apply(globalEvented, arguments);
}

// ******** Error/warning Methods ********

/**
 * Reports an error
 *
 * @method module:Runtime.reportError
 * @param {string} type The type of the error, e.g. 'SyntaxError'
 * @param {string} description A description of the error.
 * @param {Array.<module:Runtime.location>} stackTrace The current stack trace
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
 * @method module:Runtime.reportError
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
 * @method module:Runtime.reportWarning
 * @param {string} type The type of the warning, e.g. 'requireMissing.'  Note: the type will be made lowercase.
 * @param {string} description A description of the warning, e.g. 'A required file could not be found'
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
 * Gets the list of all errors reported via {@link module:Runtime.reportError}.
 *
 * @method module:Runtime.getReportedErrors
 * @return {Array.<module:Runtime.eventObject>} The list of errors
 */
exports.getReportedErrors = getReportedErrors;
function getReportedErrors() {
	return errors;
}

/**
 * Gets the list of all warnings reported via {@link module:Runtime.reportWarning}.
 *
 * @method module:Runtime.getReportedWarnings
 * @return {Array.<module:Runtime.eventObject>} The list of warnings
 */
exports.getReportedWarnings = getReportedWarnings;
function getReportedWarnings() {
	return warnings;
}

// ******** Logging Methods ********

/**
 * Sets the logger that everything will use
 *
 * @method module:Runtime.setLogger
 * @param {Object} newLogger The Winston logger to set
 */
exports.setLogger = setLogger;
function setLogger(newLogger) {
	logger = newLogger;
}

/**
 * Logs a message
 *
 * @method module:Runtime.log
 * @param {string} level The log level of the message
 * @param {string} message The message to log
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