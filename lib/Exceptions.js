
/**
 * Indicates that an invalid processing state was encountered 
 *
 * @name InvalidStateError
 * @property {String} InvalidStateError.message A message describing the exception.
 * @property {String} InvalidStateError.name The name of the error.
 */
function InvalidStateError(message) {
	Error.call(this);
	Error.captureStackTrace(this, arguments.callee);

	this.message = message || "An invalid state was encountered";
	this.name = "InvalidStateError";
};
InvalidStateError.prototype = new Error();
exports.InvalidStateError = InvalidStateError;

/**
 * Indicates that an invalid processing state was encountered 
 *
 * @name InvalidArgumentsError
 * @property {String} InvalidArgumentsError.message A message describing the exception.
 * @property {String} InvalidArgumentsError.name The name of the error.
 */
function InvalidArgumentsError(message) {
	Error.call(this);
	Error.captureStackTrace(this, arguments.callee);

	this.message = message || "An invalid argument was supplied";
	this.name = "InvalidArgumentsError";
};
InvalidArgumentsError.prototype = new Error();
exports.InvalidArgumentsError = InvalidArgumentsError;

/**
 * Indicates that an invalid processing state was encountered 
 *
 * @name TypeError
 * @property {String} TypeError.message A message describing the exception.
 * @property {String} TypeError.name The name of the error.
 */
function TypeError(message) {
	Error.call(this);
	Error.captureStackTrace(this, arguments.callee);

	this.message = message || "Invalid Type";
	this.name = "TypeError";
};
TypeError.prototype = new Error();
exports.TypeError = TypeError;

/**
 * Indicates that an invalid processing state was encountered 
 *
 * @name ReferenceError
 * @property {String} ReferenceError.message A message describing the exception.
 * @property {String} ReferenceError.name The name of the error.
 */
function ReferenceError(message) {
	Error.call(this);
	Error.captureStackTrace(this, arguments.callee);

	this.message = message || "Invalid Reference";
	this.name = "ReferenceError";
};
ReferenceError.prototype = new Error();
exports.ReferenceError = ReferenceError;