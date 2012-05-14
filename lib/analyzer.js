/**
 * @fileoverview This file exposes the main API for the analyzer
 * @author Bryan Hughes <bhughes@appcelerator.com>
 */

// ******** Documentation for event callback types ********

// JSValue documentation
/**
 * @class Represents an object at a specific point in time during the parsing process.
 * 
 * @name JSValue
 */
/**
 * The type of the current value, or undefined if there is no computed value. 
 *
 * @name JSValue.type
 * @type String|undefined
 */
/**
 * The current value, or undefined if there is no computed value. This happens if it's not possible to calculate the
 * value at compile time. Think (new Date()).getTime(). One must take care to check the {@link JSValue.type} value first,
 * otherwise it is not possible to tell the difference between a variable having a value of undefined, versus not knowing
 * the value and this reporting undefined.
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

/**
 * Creates an instance of the analyzer that is configured to parse the project associated with the given tiapp.xml
 * 
 * @class Provides Abstract Syntax Tree (AST) based parsing capabilities for Titanium Mobile projects. {@link Plugins}
 *      can be utilized to gather useful information about the project.
 * 
 * @constructor
 * @param {String} projectRoot The path to the root folder of the project. The parser will look for the tiapp.xml file
 * 		in this folder.
 * @throws {InvalidArguments} Thrown when a valid project path is not specified
 */
var CodeAnalyzer = module.exports = function(projectRoot) {};

/**
 * Begins to parse a project. If only one function is supplied as an argument, it is assumed to be the
 * completionCallback
 *
 * @function
 * @param {function()} [completionCallback] A callback to be called when all processing has completed successfully.
 * @param {function(error)} [errorCallback] A callback to be called when an error occurred that prevents processing from
 * 		continuing, e.g. a syntax error in code.
 * @throws {InvalidArguments} Thrown when invalid callbacks are supplied.
 */
CodeAnalyzer.prototype.parse = function(completionCallback, errorCallback) {};

// ******** Plugin methods ********

/**
 * Adds an event listener for the given eventname. This applies to both parser state and parser rule events. 
 *
 * @function
 * @param {String} eventName The name of the event to listen to, e.g. 'parseError'.
 * @param {function(context, eventData, [treeNode])} callback The function to call when the event is fired. See {@link JSContext}
 * @param {Boolean} [canMakeModifications] Indicates whether or not the event listener can make modifications to the rule.
 *      Used for determining callback signature and order of execution (if true, will be run first, potentially affecting
 *      whether or not other event listeners are invoked).
 */
CodeAnalyzer.prototype.addEventListener = function(eventName, callback, canMakeModifications) {};

/**
 * Looks up a variable based on the variable name. This can only be called from within a rule event callback, otherwise
 *      it throws an exception.
 *
 * @function
 * @param {String} variableName The name of the variable to look up.
 * @throws {InvalidArguments} Thrown when a valid variable name is not supplied.
 * @throws {InvalidContext} Thrown when not called from within a rule event callback.
 */
CodeAnalyzer.prototype.lookupVariable = function(variableName) {};

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
CodeAnalyzer.prototype.replaceCurrentBranch = function(newBranch) {};