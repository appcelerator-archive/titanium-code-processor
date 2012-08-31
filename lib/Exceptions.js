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
exports.InvalidStateError = InvalidStateError;
function InvalidStateError(message) {
	Error.call(this);
	Error.captureStackTrace(this, arguments.callee);

	this.message = message || "An invalid state was encountered";
	this.name = "InvalidStateError";
}
InvalidStateError.prototype = new Error();

/**
 * @classdesc Indicates that an invalid processing state was encountered 
 *
 * @constructor
 * @property {String} message A message describing the exception.
 * @property {String} name The name of the error.
 */
exports.InvalidArgumentsError = InvalidArgumentsError;
function InvalidArgumentsError(message) {
	Error.call(this);
	Error.captureStackTrace(this, arguments.callee);

	this.message = message || "An invalid argument was supplied";
	this.name = "InvalidArgumentsError";
}
InvalidArgumentsError.prototype = new Error();

/**
 * @classdesc Indicates that an invalid processing state was encountered 
 *
 * @constructor
 * @property {String} message A message describing the exception.
 * @property {String} name The name of the error.
 */
exports.TypeError = TypeError;
function TypeError(message) {
	Error.call(this);
	Error.captureStackTrace(this, arguments.callee);

	this.message = message || "Invalid Type";
	this.name = "TypeError";
	this.reportError = true;
}
TypeError.prototype = new Error();

/**
 * @classdesc Indicates that an invalid processing state was encountered 
 *
 * @constructor
 * @property {String} message A message describing the exception.
 * @property {String} name The name of the error.
 */
exports.SyntaxError = SyntaxError;
function SyntaxError(message) {
	Error.call(this);
	Error.captureStackTrace(this, arguments.callee);

	this.message = message || "Syntax Error";
	this.name = "SyntaxError";
	this.reportError = true;
}
SyntaxError.prototype = new Error();

/**
 * @classdesc Indicates that an invalid processing state was encountered 
 *
 * @constructor
 * @property {String} message A message describing the exception.
 * @property {String} name The name of the error.
 */
exports.ReferenceError = ReferenceError;
function ReferenceError(message) {
	Error.call(this);
	Error.captureStackTrace(this, arguments.callee);

	this.message = message || "Invalid Reference";
	this.name = "ReferenceError";
	this.reportError = true;
}
ReferenceError.prototype = new Error();