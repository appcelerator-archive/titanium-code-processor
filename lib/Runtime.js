/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * This module provides various communication-like services, such as logging and events.
 * 
 * @module Runtime
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

var util = require("util"),
	errors = [],
	warnings = [],
	
	logger,
	
	tags = ["@default"],
	currentTag,
	
	globalEvented;

/**
 * The global options to be used in processing
 * 
 * @type Object
 * @property {Boolean} invokeMethods Indicates whether or not methods should be invoked
 * @property {Boolean} evaluateLoops Indicates whether or not loops should be evaluated
 */
exports.options = {
	invokeMethods: true,
	evaluateLoops: true,
	maxLoopIterations: 1000000000000,
	maxRecursionLimit: 1000,
	executionTimeLimit: undefined
};

exports.recursionCount = 0;

/**
 * The global object.
 * 
 * @type module:Base.ObjectType
 */
exports.globalObject = undefined;

/**
 * The global context.
 * 
 * @type module:Base.ExecutionContext
 */
exports.globalContext = undefined;

/**
 * The context stack.
 * 
 * @type Array[{@link module:Base.ExecutionContext}]
 */
exports.contextStack = undefined;

/**
 * Gets the current execution context
 * 
 * @method
 * @returns {Base.ExecutionContext} The current execution context
 */
exports.getCurrentContext = getCurrentContext;
function getCurrentContext() {
	return exports.contextStack[exports.contextStack.length - 1];
}

/**
 * Gets the global execution context
 * 
 * @method
 * @returns {Base.ExecutionContext} The global execution context
 */
exports.getGlobalContext = getGlobalContext;
function getGlobalContext() {
	return exports.contextStack[1] || exports.globalContext;
}

/**
 * The time when execution will time out
 * 
 * @type Number
 */
exports.executionTimeLimit = 0;

/**
 * A semaphore indicating whether or not the current code is ambiguous
 * 
 * @type Number
 */
exports.ambiguousCode = 0;

/**
 * A stack of files being processed
 * 
 * @type Array[String]
 */
exports.fileStack = [];

/**
 * Gets the current file being processed
 * 
 * @method
 * @returns {String} The current file
 */
exports.getCurrentFile = getCurrentFile;
function getCurrentFile() {
	return exports.fileStack[exports.fileStack.length - 1];	
}

/**
 * A stack of line/columns being processed. Each entry is an object with the keys 'line' and 'column' that contain a
 * numerical interpretation of line and column numbers.
 * 
 * @type Array[Object]
 */
exports.locationStack = [];

/**
 * Gets the current file being processed
 * 
 * @method
 * @returns {String} The current file
 */
exports.getCurrentLocation = getCurrentLocation;
function getCurrentLocation() {
	return exports.locationStack[exports.locationStack.length - 1];	
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
		tag: "@default",
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
	var eventListeners = this._getEventListeners(tag || "@default");

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
 * @param {String} name The name of the event, e.g. "processingComplete"
 * @param {String} description A description of the event, e.g. "Processing completed successfully"
 * @param {Object} [data] Exra data associated with the event
 */
Evented.prototype.fireEvent = function fireEvent(name, description, data) {
	
	var listeners = this._getEventListeners(currentTag).listeners[name],
		i = 0,
		len = listeners ? listeners.length : 0,
		e = createEventObject(name, description, data);
	
	log("trace", "Event '" + name + "': " + util.inspect(e, false, 2));
	
	for (; i < len; i++) {
		listeners[i](e);
	}
};

/**
 * Gets a list of registered event tags.
 *
 * @method
 * @returns {Array[String]} The list of tags, including "default"
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
		throw new Error("Internal Error: tag '" + tag + "' is not a valid tag name");
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
 * @param {String} name The name of the event, e.g. "processingcomplete."
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
 * @returns {Array[String]} The list of tags, including "default"
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
 * @param {String} name The name of the error, e.g. "syntaxError." Note: the name will be made lowercase.
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
 * @param {String} name The name of the warning, e.g. "requireMissing."  Note: the name will be made lowercase.
 * @param {String} description A description of the error, e.g. "Processing completed successfully"
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

exports.setLogger = setLogger;
function setLogger(newLogger) {
	logger = newLogger;
}

exports.log = log;
function log(level, message) {
	if (logger) {
		logger.log(level, message);
	}
}