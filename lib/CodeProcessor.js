/**
 * @fileoverview This file exposes the main API for the code processor.
 * @author Bryan Hughes <bhughes@appcelerator.com>
 */

// ******** Requires and File-Level Variables ********

var winston = require("winston"),
	uglify = require("uglify-js"),
	xml2js = require("xml2js"),
	logger;

// ******** Types Documentation ********

// JSValue documentation
/**
 * @class Represents an object at a specific point in time during the parsing process.
 * 
 * @name JSValue
 */
/**
 * The type of the current value, or <code>undefined</code> if there is no computed value. Note that there is a
 * difference between the values <code>undefined</code> and <code>"undefined"</code>
 *
 * @name JSValue.type
 * @type String|undefined
 */
/**
 * The current value, or undefined if there is no computed value. This happens if it's not possible to calculate the
 * value at compile time. Think <code>(new Date()).getTime()</code>. One must take care to check the {@link JSValue.type}
 * value first, otherwise it is not possible to tell the difference between a variable having a value of
 * <code>undefined</code>, versus not knowing the value and this reporting <code>undefined</code>.
 *
 * @name JSValue.value
 * @type varies|undefined
 */
/**
 * The name of the variable, if this is a named variable. 
 *
 * @name JSValue.name
 * @type String|undefined
 */

// JSContext documentation
/**
 * @class Represents the current context that the rule exists in. A context is basically scope, but with a few extra
 *      parser specific states.
 * @name JSContext
 */
/**
 * The name of the scope relating to this context, if it has a name.
 *
 * @name JSContext.name
 * @type String|"@anonymous"|"@global"
 */
/**
 * The file name that the context begins on.
 *
 * @name JSContext.file
 * @type String
 */
/**
 * The line that the context begins on.
 *
 * @name JSContext.line
 * @type Integer
 */
/**
 * The column that the context begins on.
 *
 * @name JSContext.column
 * @type Integer
 */

// ******** Event Documentation ********

/**
 * Indicates that <code>Ti.include()</code> was called. 
 *
 * @name CodeProcessor#fileInclude
 * @event
 * @param {JSContext} context The current state of the parser.
 * @param {Object} eventData The data for the event. 
 * @param {String} eventData.includingFile The name of the file that is including another file.
 * @param {String} eventData.file The name of the file being included.
 * @see CodeProcessor#addEventListener
 */

/**
 * Indicates that <code>require()</code> was called. 
 *
 * @name CodeProcessor#fileRequire
 * @event
 * @param {JSContext} context The current state of the parser.
 * @param {Object} eventData The data for the event. 
 * @param {String} eventData.requiringFile The name of the file that is requiring another file.
 * @param {String} eventData.module The module being included. Note: this is NOT the same as the file name for the
 *      module that was included.
 * @see CodeProcessor#addEventListener
 */

/**
 * Indicates that a file is about to be parsed and analyzed. 
 *
 * @name CodeProcessor#fileParsingBegin
 * @event
 * @param {JSContext} context The current state of the parser.
 * @param {Object} eventData The data for the event. 
 * @param {String} eventData.file The name of the file for which parsing is about to begin.
 * @see CodeProcessor#addEventListener
 */

/**
 * Indicates that a file has finished being parsed successfully. 
 *
 * @name CodeProcessor#fileParsingEnd
 * @event
 * @param {JSContext} context The current state of the parser.
 * @param {Object} eventData The data for the event. 
 * @param {String} eventData.file The name of the file for which parsing has just ended.
 * @see CodeProcessor#addEventListener
 */

/**
 * Indicates that a requested file, either the entry point file or one that was required/included, could not be loaded .
 *
 * @name CodeProcessor#fileLoadError
 * @event
 * @param {JSContext} context The current state of the parser.
 * @param {Object} eventData The data for the event. 
 * @param {String} eventData.file The name of the file attempted to load.
 * @param {String} eventData.error Description of the error (e.g. "File Not Found").
 * @see CodeProcessor#addEventListener
 */

/**
 * Indicates that a context change, such as calling a closure, exiting a function, etc, has occurred. 
 *
 * @name CodeProcessor#contextChange
 * @event
 * @param {JSContext} context The current state of the parser.
 * @param {Object} eventData The data for the event. 
 * @param {JSContext} eventData.previousContext The previous context that was just exited.
 * @see CodeProcessor#addEventListener
 */

/**
 * Indicates that a parse error was encountered. Note: parse errors also invoke the {@link CodeProcessor#parse} method's
 * error callback with the information below.
 *
 * @name CodeProcessor#processingError
 * @event
 * @param {JSContext} context The current state of the parser.
 * @param {Object} eventData The data for the event. 
 * @param {String} eventData.message The error message as reported from UglifyJS.
 * @param {Integer} eventData.file The file that the error occured in.
 * @param {Integer} eventData.line The line of the file where the error occured.
 * @param {Integer} eventData.column The column of the file where the error occured.
 * @see CodeProcessor#addEventListener
 */

/**
 * Indicates that all parsing has been completed successfully. Note: parsing complete also invokes the
 * {@link CodeProcessor#parse} method's completion callback with the information below.
 *
 * @name CodeProcessor#processingComplete
 * @event
 * @param {JSContext} context The current state of the parser.
 * @param {Object={}} eventData The data for the event. This is an empty object
 * @see CodeProcessor#addEventListener
 */

/**
 * All rule events share the same signature and data format. You can pass in <code>"allrules"</code> to listen for every
 * rule event.
 *
 * @name CodeProcessor#ruleEvent
 * @event
 * @param {JSContext} context The current state of the parser.
 * @param {Object} eventData The data for the event. 
 * @param {String} eventData.ruleName The name of the rule, as passed in to {@link CodeProcessor#addEventListener}.
 * @param {Object[]} eventData.rule The rule, as defined by UglifyJS.
 * @param {JSValue|undefined} eventData.value If this rule can be represented by a value at runtime, it is supplied here.
 * @param {Object} [treeNode] The tree branch for this node. This is only passed in if <code>canMakeModifications</code>
 *      was set to <code>true</code> in the <code>addEventListener</code> call.
 * @see CodeProcessor#addEventListener
 */

// ******** Error declarations ********

function InvalidStateError(message) {
	Error.call(this);
	Error.captureStackTrace(this, arguments.callee);
	this.message = message || "An invalid state was encountered";
	this.name = "InvalidStateError";
};
InvalidStateError.prototype = new Error();
exports.InvalidStateError = InvalidStateError;

// ******** Internal helper methods ********

function isParserStateEvent(name) {
	return ~["fileInclude", "fileRequire", "fileParsingBegin", "fileParsingEnd", "fileLoadError", "contextChange", "processingError", "processingComplete", "ruleEvent"].indexOf(name);
}

function log(level, message) {
	if (level === "debug") {
		message = "(ti-require-finder) " + message;
	}
	logger.log(level, message);
}

// ******** Application methods ********

/**
 * Creates an instance of the code processor that is configured to parse the project associated with the given tiapp.xml
 * 
 * @class Provides Abstract Syntax Tree (AST) based parsing capabilities for Titanium Mobile projects. {@link Plugins}
 *      can be utilized to gather useful information about the project.
 * 
 * @constructor
 * @param {String} projectRoot The path to the root folder of the project. The parser will look for the tiapp.xml file
 * 		in this folder.
 * @param {Winston Logger} [logger] An instance of a winston logger (with syslog levels) to use instead of creating an
 * 		internal logger instance
 * @throws {InvalidArguments} Thrown when a valid project path is not specified
 */
var CodeProcessor = exports.CodeProcessor = function CodeProcessorConstructor(projectRoot, externalLogger) {
	
	// Use the logger, if supplied, or create a new one
	logger = externalLogger;
	if (!logger) {
		logger = new (winston.Logger)({
			transports: [
				new (winston.transports.Console)({ level: "warn" })
			]
		});
		logger.setLevels(winston.config.syslog.levels);
	}
	logger.debug("(ti-code-processor) Creating CodeAnalyzer instance with project root '" + projectRoot + "'");
	
	// Initialize the event listeners
	this._parserStateEventListeners = [];
	this._ruleEventListeners = [];
};

/**
 * Begins to parse a project. If only one function is supplied as an argument, it is assumed to be the
 * <code>completionCallback</code>.
 *
 * @function
 * @param {function()} [completionCallback] A callback to be called when all processing has completed successfully.
 * @param {function(error)} [errorCallback] A callback to be called when an error occurred that prevents processing from
 * 		continuing, e.g. a syntax error in code.
 * @throws {InvalidArguments} Thrown when invalid callbacks are supplied.
 */
CodeProcessor.prototype.process = function process(completionCallback, errorCallback) {
	this.addEventListener("processingComplete", completionCallback);
	this.addEventListener("processingError", errorCallback);
	
	var self = this;
	setTimeout(function(){
		self._fireParserStateEvent("processingComplete");
	}, 1000);
};

// ******** Plugin methods ********

/**
 * Adds an event listener for the given eventname. This applies to both parser state and parser rule events. 
 *
 * @function
 * @param {String} name The name of the event to listen to, e.g. 'parseError'.
 * @param {CodeProcessorEventCallback} callback The function to call when the event is fired.
 * @param {Boolean} [canMakeModifications] Indicates whether or not the event listener can make modifications to the rule.
 *      Used for determining callback signature and order of execution (if true, will be run first, potentially affecting
 *      whether or not other event listeners are invoked).
 */
CodeProcessor.prototype.addEventListener = function addEventListener(name, callback, canMakeModifications) {
	var eventListeners;
	if (isParserStateEvent(name)) {
		eventListeners = this._parserStateEventListeners;
		if (!eventListeners[name]) {
			eventListeners[name] = [];
		}
		eventListeners[name].push(callback);
	} else {
		eventListeners = this._ruleEventListeners;
		if (!eventListeners[name]) {
			eventListeners[name] = {
				writeable: [],
				readonly: []
			};
		}
		if (canMakeModifications) {
			eventListeners[name].writeable.push(callback);
		} else {
			eventListeners[name].readonly.push(callback);
		}
	}
	this._ruleEventListeners
};

/**
 * Looks up a variable based on the variable name. This can only be called from within a rule event callback, otherwise
 *      it throws an exception.
 *
 * @function
 * @param {String} variableName The name of the variable to look up.
 * @throws {InvalidArguments} Thrown when a valid variable name is not supplied.
 * @throws {InvalidContext} Thrown when not called from within a rule event callback.
 * @returns {JSValue|undefined} Returns the value of the variable if found, else undefined.
 */
CodeProcessor.prototype.lookupVariable = function lookupVariable(variableName) {
	
};

/**
 * Replaces the current branch with the one supplied. 
 *
 * @function
 * @param {Object} [newBranch] the branch to replace the old one with. If ommitted, the old branch is deleted. If the
 *      new branch is not valid (i.e. has more than one root node, is not a properly formatted tree, etc), then it will
 *      throw an exception. This can only be called from within a rule event callback for a writeable plugin, otherwise
 *      it throws an exception.
 * @throws {InvalidArguments} Thrown when an invalid branch is supplied.
 * @throws {InvalidContext} Thrown when not called from within a rule event callback.
 */
CodeProcessor.prototype.replaceCurrentBranch = function replaceCurrentBranch(newBranch) {
	
};

// ******** Private methods ********

CodeProcessor.prototype._fireParserStateEvent = function fireParserStateEvent(name, data) {
	var listeners = this._parserStateEventListeners[name],
		i = 0,
		len = listeners ? listeners.length : 0
	!data && (data = {});
	
	for(; i < len; i++) {
		listeners[i](data);
	}
};