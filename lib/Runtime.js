/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * This module provides various communication-like services, such as logging and events.
 * 
 * @module Runtime
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

/**
 * The global options to be used in processing
 * 
 * @type Object
 * @property {Boolean} invokeMethods Indicates whether or not methods should be invoked
 * @property {Boolean} evaluateLoops Indicates whether or not loops should be evaluated
 */
exports.options = {
	invokeMethods: true,
	evaluateLoops: false,
	maxLoopIterations: 10000
};

/**
 * The global object.
 * 
 * @type module:Base.ObjectType
 */
exports.globalObject = undefined;

/**
 * The global context.
 * 
 * @type module:Context.ExecutionContext
 */
exports.globalContext = undefined;

/**
 * The context stack.
 * 
 * @type Array[{@link module:Context.ExecutionContext}]
 */
exports.contextStack = undefined;

/**
 * Gets the current execution context
 * 
 * @method
 * @returns {Context.ExecutionContext} The current execution context
 */
exports.getCurrentContext = function getCurrentContext() {
	return exports.contextStack[exports.contextStack.length - 1];
};

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
exports.getCurrentFile = function getCurrentFile() {
	return exports.fileStack[exports.fileStack.length - 1];	
};