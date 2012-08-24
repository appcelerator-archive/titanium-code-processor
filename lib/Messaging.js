/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * This module provides various communication-like services, such as logging and events.
 * 
 * @module Messaging
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

var winston = require("winston"),
	util = require("util"),
	errors = [],
	warnings = [];

// ******** Evented Object Methods ********

var tags = ["@default"],
	currentTag;
/**
 * Base class for adding event support to other objects.
 * 
 * @constructor
 */
exports.Evented = function () {
	this._taggedListeners = [this._defaultListeners = {
		tag: "@default",
		listeners: {}
	}];
};

/**
 * @private
 */
exports.Evented.prototype._getEventListeners = function _getEventListeners(tag) {
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
exports.Evented.prototype.on = function on(name, callback, tag) {

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
 * @param {String} name The name of the event, e.g. "processingComplete."
 * @param {Object} data The event data to be sent to the event listeners.
 */
exports.Evented.prototype.fireEvent = function fireEvent(name, data) {
	var listeners = this._getEventListeners(currentTag).listeners[name],
		i = 0,
		len = listeners ? listeners.length : 0;
	data = data || {};

	exports.log("debug", "Event '" + name + "': " + util.inspect(data, false, 2));

	for (; i < len; i++) {
		listeners[i](data);
	}
};

/**
 * Gets a list of registered event tags.
 *
 * @method
 * @returns {Array[String]} The list of tags, including "default"
 */
exports.Evented.prototype.getTags = function getTags() {
	return this._tags;
};

/**
 * Loads the set of event listeners associated with the tag. If the set does not exist, then the previous listener set
 * remains loaded. This affects the tag for ALL classes inheriting from {@link module:Messaging.Evented}.
 *
 * @method
 * @param {String} tag The tag to load
 */
exports.loadListenerSet = function loadTag(tag) {
	if (tags.indexOf(tag) !== -1) {
		currentTag = tag;
	} else {
		throw new Error("Internal Error: tag '" + tag + "' is not a valid tag name");
	}
};

// ******** Global Event Methods ********

var globalEvented = new exports.Evented();

/**
 * Adds an event listener for the given event name.
 *
 * @method
 * @param {String} name The name of the event to listen to, e.g. 'parseError'.
 * @param {function} callback The function to call when the event is fired.
 * @param {Boolean} [tag] Indicates the event listener set to be attached to. Each tag corresponds to a separate parse
 *		of the tree, run in the order that the tag was added. If an event listener is going to modify the tree, a tag
 *		<b>must</b> be provided so that it doesn't stomp on the other event listeners.
 */
exports.on = function on() {
	return globalEvented.on.apply(globalEvented, arguments); 
};

/**
 * Fires a process state event to the current listener set.
 *
 * @method
 * @param {String} name The name of the event, e.g. "processingComplete."
 * @param {Object} data The event data to be sent to the event listeners.
 */
exports.fireEvent = function fireEvent() {
	return globalEvented.fireEvent.apply(globalEvented, arguments); 
};

/**
 * Gets a list of registerd tags.
 *
 * @method
 * @returns {Array[String]} The list of tags, including "default"
 */
exports.getTags = function getTags() {
	return tags;
};

// ******** Error/warning Methods ********

/**
 * Reports an error
 * 
 * @method
 * @param {Object} error The error to report.
 * @param {String} error.description A description of the error.
 * @param {module:AST.node} [error.ast] The AST node that is an instance of this rule.
 * @param {String} [error.file] The file that the rule begins on.
 * @param {Integer} [error.line] The line of the file where the rule begins on.
 * @param {Integer} [error.column] The column of the file where the rule begins on.
 */
exports.reportError = function reportError(error) {
	if (!error.file) {
		error.file = "not available";
	}
	if (!error.line) {
		error.line = "not available";
	}
	if (!error.column) {
		error.column = "not available";
	}
	errors.push(error);
};

/**
 * Reports a warning
 * 
 * @method
 * @param {Object} warning The error to report.
 * @param {String} warning.description A description of the error.
 * @param {module:AST.node} [warning.ast] The AST node that is an instance of this rule.
 * @param {String} [warning.file] The file that the rule begins on.
 * @param {Integer} [warning.line] The line of the file where the rule begins on.
 * @param {Integer} [warning.column] The column of the file where the rule begins on.
 */
exports.reportWarning = function reportWarning(warning) {
	if (!warning.file) {
		warning.file = "not available";
	}
	if (!warning.line) {
		warning.line = "not available";
	}
	if (!warning.column) {
		warning.column = "not available";
	}
	warnings.push(warning);
};

/**
 * Gets the list of all reported errors
 * 
 * @method
 * @returns {Array[Object]} The list of errors, as supplied to {@link module:Messaging.reportError}.
 */
exports.getReportedErrors = function getReportedErrors() {
	return errors;
};

/**
 * Gets the list of all reported warnings
 * 
 * @method
 * @returns {Array[Object]} The list of warnings, as supplied to {@link module:Messaging.reportWarning}.
 */
exports.getReportedWarnings = function getReportedWarnings() {
	return warnings;
};

// ******** Logging Methods ********

// Use the logger, if supplied, or create a new one
var logger = new (winston.Logger)({
	transports: [
		new (winston.transports.Console)({ level: "warn" })
	]
});
logger.setLevels(winston.config.syslog.levels);

exports.setLogger = function setLogger(newLogger) {
	logger = newLogger;
};

exports.log = function log(level, message, component) {
	if (level === "debug") {
		message = (component ? component : "(ti-code-processor)") + " " + message;
	}
	logger.log(level, message);
};