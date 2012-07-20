/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @module Messaging
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

var winston = require("winston");

// ******** Event Methods ********

var taggedListeners = [],
	defaultListeners = {
		tag: "@default",
		listeners: {}
	},
	currentListeners,
	tags = ["@default"];

/**
 * Adds an event listener for the given event name.
 *
 * @function
 * @param {String} name The name of the event to listen to, e.g. 'parseError'.
 * @param {function} callback The function to call when the event is fired.
 * @param {Boolean} [tag] Indicates the event listener set to be attached to. Each tag corresponds to a separate parse
 * 		of the tree, run in the order that the tag was added. If an event listener is going to modify the tree, a tag
 * 		<b>must</b> be provided so that it doesn't stomp on the other event listeners.
 */
exports.on = function on(name, callback, tag) {

	// Fetch the event listener set
	var eventListeners,
		i = 0,
		len = taggedListeners.length;
	if (tag) {
		for(; i < len; i++) {
			if (taggedListeners[i].tag == tag) {
				eventListeners = taggedListeners[i];
			}
		}
		if (!eventListeners) {
			taggedListeners.push(eventListeners = {
				tag: tag,
				listeners: {}
			});
		}
	} else {
		eventListeners = defaultListeners;
	}

	// Store the event callback
	if (!eventListeners.listeners[name]) {
		eventListeners.listeners[name] = [];
	}
	eventListeners.listeners[name].push(callback);
};

/**
 * Fires a process state event to the current listener set.
 *
 * @function
 * @param {String} name The name of the event, e.g. "processingComplete."
 * @param {Object} data The event data to be sent to the event listeners.
 */
exports.fireEvent = function fireEvent(name, data) {
	var listeners = currentListeners[name],
		i = 0,
		len = listeners ? listeners.length : 0
	data = data || {};

	exports.log("debug", "Event '" + name + "': " + JSON.stringify(data));

	for(; i < len; i++) {
		listeners[i](data);
	}
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

/**
 * Loads the set of event listeners associated with the tag. If the set does not exist, then the previous listener set
 * remains loaded.
 *
 * @method
 * @param {String} tag The tag to load
 */
exports.loadListenerSet = function loadTag(tag) {
	if (taggedListeners[tag]) {
		currentListeners = taggedListeners[tag];
	} else {
		currentListeners = defaultListeners;
	}
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

exports.log = function log(level, message) {
	if (level === "debug") {
		message = "(ti-code-processor) " + message;
	}
	logger.log(level, message);
};