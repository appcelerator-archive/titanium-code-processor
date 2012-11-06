/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * This module provides various communication-like services, such as logging and events.
 * 
 * @module Runtime
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var util = require('util'),
	path = require('path'),
	errors = [],
	warnings = [],
	
	logger,
	
	tags = ['@default'],
	currentTag,
	
	globalEvented,
	
	globalObject,
	contextStack;
	
	executionStack = [],
	fileStack = [],
	locationStack = [],

	delayedFunctionsQueue = [];

/**
 * The global options to be used in processing
 * 
 * @type Object
 * @property {Boolean} invokeMethods Indicates whether or not methods should be invoked
 * @property {Boolean} evaluateLoops Indicates whether or not loops should be evaluated
 * @property {Number} maxLoopIterations Indicates the maximum number of loop iterations to evaluate before erroring 
 * 		(infinite loop guard)
 * @property {Number} maxRecursionLimit Indicates the maximum recursion depth to evaluate before erroring 
 * 		(infinite recursion guard)
 * @property {Number|undefined} executionTimeLimit Indicates the maximum time the app is allowed to run before erroring.
 *		Undefined means no limit.
 * @property {Boolean} exactMode Indicates whether or not the app should be evaluated in exact mode. Exact mode does not 
 * 		use ambiguous mode and throws an exception if an Unknown type is encountered.
 */
exports.options = {
	invokeMethods: true,
	evaluateLoops: true,
	maxLoopIterations: 1000000000000,
	maxRecursionLimit: 1000,
	executionTimeLimit: undefined,
	exactMode: false
};

/**
 * The current recursion depth
 * 
 * @type Number
 */
exports.recursionCount = 0;

/**
 * The time when execution will time out
 * 
 * @type Number
 */
exports.executionTimeLimit = 0;

/**
 * A VM object representation of an error thrown from {@link module:Base.throwNativeException} or {@link module:Base.throwException}
 * 
 * @type module:Base.ObjectType
 */
exports.exception = undefined;

/**
 * Enters an ambiguous block in the current context
 * 
 * @method
 */
exports.enterAmbiguousBlock = function() {
	getCurrentContext()._ambiguousBlock++;
};

/**
 * Exits an ambiguous block in the current context
 * 
 * @method
 */
exports.exitAmbiguousBlock = function() {
	getCurrentContext()._ambiguousBlock--;
};

/**
 * Checks if the current block in the current context is ambiguous
 * 
 * @method
 */
exports.isAmbiguousBlock = function() {
	return !!getCurrentContext()._ambiguousBlock;
};

/**
 * Sets the global object and creates a new context stack
 * 
 * @method
 * @param {module:Base.ObjectType} newGlobalObject The new global object to set
 */
exports.setGlobalObject = function(newGlobalObject) {
	contextStack = [];
	globalObject = newGlobalObject;
}

/**
 * Gets the global object
 * 
 * @method
 * @returns {module:Base.ObjectType} The global object
 */
exports.getGlobalObject = function() {
	return globalObject;
}

/**
 * Gets the current execution context
 * 
 * @method
 * @returns {Base.ExecutionContext} The current execution context
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
 * @returns {Base.ExecutionContext} The global execution context
 */
exports.getGlobalContext = getGlobalContext;
function getGlobalContext() {
	return contextStack && contextStack[0];
}

/**
 * Gets the module object of the current module context (i.e. the 'global' object associated with this module)
 * 
 * @method
 * @returns {module:Base.ObjectType} The module object
 */
exports.getModuleContext = getModuleContext;
function getModuleContext() {
	return contextStack && contextStack[1];
}

/**
 * Gets
 * 
 * @method
 */
exports.getModuleObject = getModuleObject;
function getModuleObject() {
	return getModuleContext().thisBinding;
}

/**
 * Gets the entry point file
 * 
 * @method
 * @returns {String} The current file
 */
exports.getEntryPointFile = getEntryPointFile;
function getEntryPointFile() {
	return fileStack[0];	
}

/**
 * Gets the current file being processed
 * 
 * @method
 * @returns {String} The current file
 */
exports.getCurrentFile = getCurrentFile;
function getCurrentFile() {
	return fileStack[fileStack.length - 1];	
}

/**
 * Enters the given file, from a runtime perspective, i.e. if file a requires file b and calls foo in b from a, then the
 * current file becomes b, even though a is the current file being processed
 * 
 * @method
 * @param {String} file The name of the file to enter
 */
exports.setCurrentFile = setCurrentFile;
function setCurrentFile(file) {
	var currentFile = getCurrentFile();
	if (currentFile !== file) {
		log('trace', 'Entering new file: ' + (currentFile ? path.basename(currentFile) + ' ==> ' : '') + path.basename(file));
	}
	fileStack.push(file);
}

/**
 * Exits the current file, from a runtime perspective
 * 
 * @method
 */
exports.popCurrentFile = popCurrentFile;
function popCurrentFile() {
	var previousFile = fileStack.pop(),
		newFile = getCurrentFile();
	if (newFile !== previousFile) {
		log('trace', 'Exiting current file: ' + path.basename(previousFile) + (newFile ? ' ==> ' + path.basename(newFile) : ''));
	}
}

/**
 * Gets the current location being processed
 * 
 * @method
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
 * @param {Number} line The current line
 * @param {Number} column The current column
 */
exports.setCurrentLocation = setCurrentLocation;
function setCurrentLocation(line, column) {
	locationStack.push({
		line: line,
		column: column,
		file: getCurrentFile()
	})
}

/**
 * Exits the current location, from a runtime perspective
 * 
 * @method
 */
exports.popCurrentLocation = popCurrentLocation;
function popCurrentLocation() {
	locationStack.pop();
}

/**
 * Queues a function for later evaluation
 * 
 * @method
 * @param {module:Base.FunctionType} func The function to execute later
 */
exports.queueFunction = queueFunction;
function queueFunction(func, thisVal, args, ambiguousContext) {
	if (!func.strict && (!thisVal || thisVal.className === 'Null' || thisVal.className === 'Undefined')) {
		thisVal = getModuleContext().thisBinding;
	}
	delayedFunctionsQueue.push({
		func: func,
		thisVal: thisVal,
		args: args || [],
		ambiguousContext: !!ambiguousContext
	});
}

/**
 * Gets the next delayed execution function to be executed
 * 
 * @method
 * @return {module:Base.FunctionType} The next function to be executed
 */
exports.getNextQueuedFunction = getNextQueuedFunction;
function getNextQueuedFunction() {
	return delayedFunctionsQueue.shift();
}

/**
 * Gets the stack list
 * 
 * @method
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
		file = getCurrentFile(),
		result = {
			name: name,
			description: description,
			data: data || {}
		};
	if (file) {
		result.file = file;
	}
	if (location) {
		result.line = location.line + 1; // Line is 0 index based
		result.column = location.column + 1; // Column is 0 index based
	}
	
	return result;
}

// ******** Evented Object Methods ********
/**
 * Base class for adding event support to other objects.
 * 
 * @constructor
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
 * @param {String} level The log level of the message
 * @param {String} message The message to log
 */
exports.log = log;
function log(level, message) {
	if (logger) {
		logger.log(level, message);
	}
}