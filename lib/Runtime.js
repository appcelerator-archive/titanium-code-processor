/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * This module provides various communication-like services, such as logging and events.
 * 
 * @module Messaging
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

var Base = require("./Base"),
	Context = require("./Context");

/**
 * The global options to be used in processing
 * 
 * @type Object
 * @property {Boolean} invokeMethods Indicates whether or not methods should be invoked
 * @property {Boolean} evaluateLoops Indicates whether or not loops should be evaluated
 */
exports.options = {
	invokeMethods: true,
	evaluateLoops: false
};

/**
 * The global object.
 * 
 * @type module:Base.ObjectType
 */
exports.globalObject = null;

/**
 * The global context.
 * 
 * @type module:Context.ExecutionContext
 */
exports.globalContext = null;

/**
 * The context stack.
 * 
 * @type Array[{@link module:Context.ExecutionContext}]
 */
exports.contextStack = null;

/**
 * Gets the current execution context
 * 
 * @method
 * @returns {Context.ExecutionContext} The current execution context
 */
exports.getCurrentContext = function getCurrentContext() {
	return exports.contextStack[exports.contextStack.length - 1];
}

/**
 * Initializes the runtime by creating the global context and it's associated objects and initializing the context stack
 * to contain the global context.
 * 
 * @method
 */
exports.initializeRuntime = function initializeRuntime() {
	exports.globalObject = new Base.ObjectType();
	exports.globalContext = new Context.ExecutionContext(
			Context.NewObjectEnvironment(exports.globalObject, null),
			Context.NewObjectEnvironment(exports.globalObject, null),
			exports.globalObject
		);
	exports.contextStack = [exports.globalContext];
};