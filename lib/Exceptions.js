/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * This module contains exceptions that can be thrown by code being processed.
 * 
 * @module Exceptions
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

/**
 * @classdesc Indicates that an invalid processing state was encountered 
 *
 * @constructor
 * @property {String} message A message describing the exception.
 * @property {String} name The name of the error.
 */
exports.InvalidStateError = function InvalidStateError(message) {
	Error.call(this);
	Error.captureStackTrace(this, arguments.callee);

	this.message = message || "An invalid state was encountered";
	this.name = "InvalidStateError";
};
exports.InvalidStateError.prototype = new Error();

/**
 * @classdesc Indicates that an invalid processing state was encountered 
 *
 * @constructor
 * @property {String} message A message describing the exception.
 * @property {String} name The name of the error.
 */
exports.InvalidArgumentsError = function InvalidArgumentsError(message) {
	Error.call(this);
	Error.captureStackTrace(this, arguments.callee);

	this.message = message || "An invalid argument was supplied";
	this.name = "InvalidArgumentsError";
};
exports.InvalidArgumentsError.prototype = new Error();

/**
 * @classdesc Indicates that an invalid processing state was encountered 
 *
 * @constructor
 * @property {String} message A message describing the exception.
 * @property {String} name The name of the error.
 */
exports.TypeError = function TypeError(message) {
	Error.call(this);
	Error.captureStackTrace(this, arguments.callee);

	this.message = message || "Invalid Type";
	this.name = "TypeError";
};
exports.TypeError.prototype = new Error();

/**
 * @classdesc Indicates that an invalid processing state was encountered 
 *
 * @constructor
 * @property {String} message A message describing the exception.
 * @property {String} name The name of the error.
 */
exports.SyntaxError = function SyntaxError(message) {
	Error.call(this);
	Error.captureStackTrace(this, arguments.callee);

	this.message = message || "Syntax Error";
	this.name = "SyntaxError";
};
exports.SyntaxError.prototype = new Error();

/**
 * @classdesc Indicates that an invalid processing state was encountered 
 *
 * @constructor
 * @property {String} message A message describing the exception.
 * @property {String} name The name of the error.
 */
exports.ReferenceError = function ReferenceError(message) {
	Error.call(this);
	Error.captureStackTrace(this, arguments.callee);

	this.message = message || "Invalid Reference";
	this.name = "ReferenceError";
};
exports.ReferenceError.prototype = new Error();