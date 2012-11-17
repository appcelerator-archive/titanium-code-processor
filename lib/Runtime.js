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

var errors = [],
	warnings = [],
	
	logger,
	
	tags = ['@default'],
	currentTag,
	
	globalEvented,
	
	globalObject,
	contextStack,

	entryPointFile,
	
	locationStack = [],

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
 */
exports.options = {
	invokeMethods: true,
	evaluateLoops: true,
	maxLoopIterations: 1000000000000,
	maxRecursionLimit: 1000,
	logConsoleCalls: true,
	executionTimeLimit: undefined,
	exactMode: false,
	nativeExceptionRecovery: false
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
	return contextStack.pop();
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
	return contextStack.length > 2;
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
	return contextStack && contextStack[0];
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
	return contextStack && contextStack[1];
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
	return locationStack[locationStack.length - 1];
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
function setCurrentLocation(file, line, column) {
	locationStack.push({
		line: line,
		column: column,
		file: file
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
 * Adds an AST to the set of processed ASTs
 *
 * @method
 * @name module:Runtime.setAST
 * @param {String} [file] The name of the file that generated this AST. If not supplied, an identifier is automatically generated
 */
exports.setAST = setAST;
function setAST(ast, file) {
	if (!file) {
		file = '@unnamed_ast_' + (astIdentifier++);
	}
	asts[file] = ast;
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
		file = location.file,
		line = location.line,
		column = location.column,
		i = 0,
		len = delayedFunctionsQueue.length;
	for (; i < len; i++) {
		if (delayedFunctionsQueue[i].file === file &&
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
		file: file,
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
		if (!stack.length || stack[stack.length - 1].file !== locationStack[i].file ||
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
	if (location) {
		result.file = location.file;
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
	this._taggedListeners = [this._defaultListeners = {
		tag: '@default',
		listeners: {}
	}];
}

/**
 * @private
 */
Evented.prototype._getEventListeners = function _getEventListeners(tag) {
	// Fetch the event listener set
	var eventListeners,
		i = 0,
		taggedListeners = this._taggedListeners,
		len = taggedListeners.length;
	for (; i < len; i++) {
		if (taggedListeners[i].tag == tag) {
			eventListeners = taggedListeners[i];
		}
	}
	if (!eventListeners) {
		taggedListeners.unshift(eventListeners = {
			tag: tag,
			listeners: {}
		});
		tags.unshift(tag);
	}
	return eventListeners;
};

/**
 * Adds an event listener for the given event name.
 *
 * @method
 * @name module:Runtime.Evented#on
 * @param {String} name The name of the event to listen to, e.g. 'parseError'.
 * @param {function} callback The function to call when the event is fired.
 * @param {String} [tag] Indicates the event listener set to be attached to. Each tag corresponds to a separate parse
 *		of the tree, run in the order that the tag was added. If an event listener is going to modify the tree, a tag
 *		<b>must</b> be provided so that it doesn't stomp on the other event listeners.
 */
Evented.prototype.on = function on(name, callback, tag) {

	// Fetch the event listener set
	var eventListeners = this._getEventListeners(tag || '@default');

	// Store the event callback
	if (!eventListeners.listeners[name]) {
		eventListeners.listeners[name] = [];
	}
	eventListeners.listeners[name].push(callback);
};

/**
 * Fires a process state event to the current listener set.
 *
 * @method
 * @name module:Runtime.Evented#fireEvent
 * @param {String} name The name of the event, e.g. 'processingComplete'
 * @param {String} description A description of the event, e.g. 'Processing completed successfully'
 * @param {Object} [data] Exra data associated with the event
 */
Evented.prototype.fireEvent = function fireEvent(name, description, data) {
	
	var listeners = this._getEventListeners(currentTag).listeners[name],
		i = 0,
		len = listeners ? listeners.length : 0,
		e = createEventObject(name, description, data);
	
	for (; i < len; i++) {
		listeners[i](e);
	}
};

/**
 * Gets a list of registered event tags.
 *
 * @method
 * @name module:Runtime.Evented#getTags
 * @returns {Array[String]} The list of tags, including '@default'
 */
Evented.prototype.getTags = function getTags() {
	return this._tags;
};

/**
 * Loads the set of event listeners associated with the tag. If the set does not exist, then the previous listener set
 * remains loaded. This affects the tag for ALL classes inheriting from {@link module:Runtime.Evented}.
 *
 * @method
 * @name module:Runtime.loadListenerSet
 * @param {String} tag The tag to load
 */
exports.loadListenerSet = loadListenerSet;
function loadListenerSet(tag) {
	if (tags.indexOf(tag) !== -1) {
		currentTag = tag;
	} else {
		throw new Error('Internal Error: tag "' + tag + '" is not a valid tag name');
	}
}

// ******** Global Event Methods ********

globalEvented = new Evented();

/**
 * Adds an event listener for the given event name.
 *
 * @method
 * @name module:Runtime.on
 * @param {String} name The name of the event to listen to, e.g. 'syntaxError'.
 * @param {function} callback The function to call when the event is fired.
 * @param {String} [tag] Indicates the event listener set to be attached to. Each tag corresponds to a separate parse
 *		of the tree, run in the order that the tag was added. If an event listener is going to modify the tree, a tag
 *		<b>must</b> be provided so that it doesn't stomp on the other event listeners.
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

/**
 * Gets a list of registerd tags.
 *
 * @method
 * @name module:Runtime.getTags
 * @returns {Array[String]} The list of tags, including '@default'
 */
exports.getTags = getTags;
function getTags() {
	return tags;
}

// ******** Error/warning Methods ********

/**
 * Reports an error
 *
 * @method
 * @name module:Runtime.reportError
 * @param {String} name The name of the error, e.g. 'syntaxError.' Note: the name will be made lowercase.
 * @param {String} description A description of the error.
 */
exports.reportError = reportError;
function reportError(name, description, data) {
	errors.push(createEventObject(name, description, data));
}

/**
 * Reports a warning
 *
 * @method
 * @name module:Runtime.reportWarning
 * @param {String} name The name of the warning, e.g. 'requireMissing.'  Note: the name will be made lowercase.
 * @param {String} description A description of the error, e.g. 'Processing completed successfully'
 * @param {Object} data Exra data associated with the event
 */
exports.reportWarning = reportWarning;
function reportWarning(name, description, data) {
	warnings.push(createEventObject(name, description, data));
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