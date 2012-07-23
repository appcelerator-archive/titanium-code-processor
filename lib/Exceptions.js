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
var InvalidStateError = exports.InvalidStateError;
InvalidStateError.prototype = new Error();

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
var InvalidArgumentsError = exports.InvalidArgumentsError;
InvalidArgumentsError.prototype = new Error();

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
var TypeError = exports.TypeError;
TypeError.prototype = new Error();

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
var ReferenceError = exports.ReferenceError;
ReferenceError.prototype = new Error();