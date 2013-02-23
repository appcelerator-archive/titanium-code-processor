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

var wrench = require('wrench'),
	path = require('path'),
	errors = [],
	warnings = [],

	jsRegex = /\.js$/,

	logger,

	globalEvented,

	globalObject,
	contextStack,
	functionContextCount,

	entryPointFile,

	locationStack = [],

	processedFilesList = [],
	functions = [],

	asts = {},
	astIdentifier = 1,

	tryCatch = 0,

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
	maxLoopIterations: 1000000,
	maxRecursionLimit: 1000,
	logConsoleCalls: true,
	nativeExceptionRecovery: true,
	executionTimeLimit: 0,
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
 * A temporary flag for use by {@link module:RuleProcessor}
 *
 * @type Boolean
 * @private
 */
exports._unknown = false;

/**
 * The plugins associated with this run
 *
 * @type Object
 * @private
 */
exports.plugins = undefined;

/**
 * Enters an ambiguous block in the current context
 *
 * @method
 * @name module:Runtime.enterAmbiguousBlock
 */
exports.enterAmbiguousBlock = function() {
	getCurrentContext()._ambiguousBlock++;
};

/**
 * Exits an ambiguous block in the current context
 *
 * @method
 * @name module:Runtime.exitAmbiguousBlock
 */
exports.exitAmbiguousBlock = function() {
	getCurrentContext()._ambiguousBlock--;
};

/**
 * Checks if the current block in the current context is ambiguous
 *
 * @method
 * @name module:Runtime.isAmbiguousBlock
 */
exports.isAmbiguousBlock = function() {
	return !!getCurrentContext()._ambiguousBlock;
};

/**
 * Enters the current try catch block
 *
 * @method
 * @name module:Runtime.enterTryCatch
 */
exports.enterTryCatch = function () {
	tryCatch++;
};

/**
 * Exits the current try catch block
 *
 * @method
 * @name module:Runtime.exitTryCatch
 */
exports.exitTryCatch = function () {
	tryCatch--;
};

/**
 * Checks if we are currently in a try-catch block
 *
 * @method
 * @name module:Runtime.inTryCatch
 */
exports.inTryCatch = function () {
	return !!tryCatch;
};

/**
 * Sets the global object and creates a new context stack
 *
 * @method
 * @name module:Runtime.setGlobalObject
 * @param {module:Base.ObjectType} newGlobalObject The new global object to set
 */
exports.setGlobalObject = function(newGlobalObject) {
	contextStack = [];
	functionContextCount = 0;
	globalObject = newGlobalObject;
};

/**
 * Gets the global object
 *
 * @method
 * @name module:Runtime.getGlobalObject
 * @returns {module:Base.ObjectType} The global object
 */
exports.getGlobalObject = function() {
	return globalObject;
};

/**
 * Gets the current execution context
 *
 * @method
 * @name module:Runtime.getCurrentContext
 * @returns {module:Base.ExecutionContext} The current execution context
 */
exports.getCurrentContext = getCurrentContext;
function getCurrentContext() {
	return contextStack && contextStack[contextStack.length - 1];
}

/**
 * Enters the given file, from a runtime perspective, i.e. if file a requires file b and calls foo in b from a, then the
 * current file becomes b, even though a is the current file being processed
 *
 * @method
 * @name module:Runtime.enterContext
 * @param {String} file The name of the file to enter
 */
exports.enterContext = enterContext;
function enterContext(context) {
	log('trace', 'Entering new context');
	contextStack.push(context);
	if (context.isFunctionContext) {
		functionContextCount++;
	}
}

/**
 * Exits the current file, from a runtime perspective
 *
 * @method
 * @name module:Runtime.exitContext
 */
exports.exitContext = exitContext;
function exitContext() {
	log('trace', 'Exiting context');
	var context = contextStack.pop();
	if (context.isFunctionContext) {
		functionContextCount--;
	}
	return context;
}

/**
 * Returns whether or not we are in a function context (i.e. not in global scope)
 *
 * @method
 * @name module:Runtime.inFunctionContext
 * @returns {Boolean} Whether or not we are in a function context
 */
exports.inFunctionContext = inFunctionContext;
function inFunctionContext() {
	return !!functionContextCount;
}

/**
 * Gets the global execution context
 *
 * @method
 * @name module:Runtime.getGlobalContext
 * @returns {module:Base.ExecutionContext} The global execution context
 */
exports.getGlobalContext = getGlobalContext;
function getGlobalContext() {
	return contextStack[0];
}

/**
 * Gets the module object of the current module context (i.e. the 'global' object associated with this module)
 *
 * @method
 * @name module:Runtime.getModuleContext
 * @returns {module:Base.ObjectType} The module object
 */
exports.getModuleContext = getModuleContext;
function getModuleContext() {
	return contextStack[1] || contextStack[0];
}

/**
 * Gets the entry point file
 *
 * @method
 * @name module:Runtime.getEntryPointFile
 * @returns {String} The current file
 */
exports.getEntryPointFile = getEntryPointFile;
function getEntryPointFile() {
	return entryPointFile;
}

/**
 * Gets the entry point file
 *
 * @method
 * @name module:Runtime.setEntryPointFile
 * @returns {String} The current file
 */
exports.setEntryPointFile = setEntryPointFile;
function setEntryPointFile(newEntryPointFile) {
	entryPointFile = newEntryPointFile;
}

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
	var processedFilesList = getProcessedFilesList(),
		parentDirectory = path.dirname(getEntryPointFile()),
		filesList = wrench.readdirSyncRecursive(parentDirectory),
		i, len,
		filename,
		rootDir,
		unprocessedFiles = [];
	for (i = 0, len = filesList.length; i < len; i++) {
		filename = filesList[i];
		rootDir = filename.split(path.sep)[0];
		if (exports.isFileValid(filename) && processedFilesList.indexOf(path.resolve(path.join(parentDirectory, filename))) === -1) {
			unprocessedFiles.push(path.resolve(path.join(parentDirectory, filename)));
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
exports.getUnprocessedFunctions = getUnprocessedFunctions;
function getUnprocessedFunctions() {
	var unprocessedFunctions = [],
		bodyNode,
		i, len = functions.length;
	for(i = 0; i < len; i++) {
		bodyNode = functions[i].body[0];
		if (bodyNode && !bodyNode._visited && !bodyNode._skipped) {
			unprocessedFunctions.push(functions[i]);
		}
	}
	return unprocessedFunctions;
}

/**
 * Queues a function for later evaluation
 *
 * @method
 * @name module:Runtime.queueFunction
 * @param {module:Base.FunctionType} func The function to execute later
 */
exports.queueFunction = queueFunction;
function queueFunction(func, thisVal, args, ambiguousContext) {

	// Make sure that the function isn't already in the queue
	var location = getCurrentLocation(),
		filename = location.filename,
		line = location.line,
		column = location.column,
		i = 0,
		len = delayedFunctionsQueue.length;
	for (; i < len; i++) {
		if (delayedFunctionsQueue[i].filename === filename &&
				delayedFunctionsQueue[i].line === line &&
				delayedFunctionsQueue[i].column === column) {
			return;
		}
	}

	// Set the thisVal to its default here since we won't be able to get it later
	if (!func.strict && (!thisVal || thisVal.className === 'Null' || thisVal.className === 'Undefined')) {
		thisVal = getModuleContext().thisBinding;
	}

	// Queue the function
	delayedFunctionsQueue.push({
		func: func,
		thisVal: thisVal,
		args: args || [],
		ambiguousContext: !!ambiguousContext,
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
 * Gets the stack list
 *
 * @method
 * @name module:Runtime.getStackTrace
 */
exports.getStackTrace = getStackTrace;
function getStackTrace() {
	var stack = [],
		i = 0, len = locationStack.length;
	for (; i < len; i++) {
		if (!stack.length || stack[stack.length - 1].filename !== locationStack[i].filename ||
				stack[stack.length - 1].line !== locationStack[i].line) {
			stack.push(locationStack[i]);
		}
	}
	return stack;
}

/**
 * @private
 */
function createEventObject(name, description, data) {
	var location = getCurrentLocation(),
		result = {
			name: name,
			description: description,
			data: data || {}
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
 * @param {String} name The name of the error, e.g. 'SyntaxError'
 * @param {String} description A description of the error.
 */
exports.reportError = reportError;
function reportError(name, description, data) {
	var i, len,
		error,
		eventObject = createEventObject(name, description, data),
		countRegex = / \([0-9]* occurances\)$/;
	for (i = 0, len = errors.length; i < len; i++) {
		error = errors[i];
		if (error.file === eventObject.file && error.line === eventObject.line && error.column === eventObject.column &&
				error.name === eventObject.name) {
			if (error.occurances > 1) {
				error.description = error.description.slice(0, -error.description.match(countRegex)[0].length);
			}
			error.occurances++;
			error.description += ' (' + error.occurances + ' occurances)';
			return;
		}
	}
	eventObject.occurances = 1;
	fireEvent('errorReported', name + ': ' + description, {
		name: name,
		description: description
	});
	errors.push(eventObject);
}

/**
 * Reports a warning
 *
 * @method
 * @name module:Runtime.reportWarning
 * @param {String} name The name of the warning, e.g. 'requireMissing.'  Note: the name will be made lowercase.
 * @param {String} description A description of the warning, e.g. 'Processing completed successfully'
 * @param {Object} data Exra data associated with the event
 */
exports.reportWarning = reportWarning;
function reportWarning(name, description, data) {
	var i, len,
		warning,
		eventObject = createEventObject(name, description, data),
		countRegex = / \([0-9]* occurances\)$/;
	for (i = 0, len = warnings.length; i < len; i++) {
		warning = warnings[i];
		if (warning.file === eventObject.file && warning.line === eventObject.line && warning.column === eventObject.column &&
				warning.name === eventObject.name) {
			if (warning.occurances > 1) {
				warning.description = warning.description.slice(0, -warning.description.match(countRegex)[0].length);
			}
			warning.occurances++;
			warning.description += ' (' + warning.occurances + ' occurances)';
			return;
		}
	}
	eventObject.occurances = 1;
	fireEvent('warningReported', name + ': ' + description, {
		name: name,
		description: description
	});
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