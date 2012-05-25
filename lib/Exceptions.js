
/**
 * Indicates that an invalid processing state was encountered
 *
 * @constructor
 * @param {Stirng} message A message describing the exception.
 */
function InvalidStateError(message) {
	Error.call(this);
	Error.captureStackTrace(this, arguments.callee);

	/**
	 * A message describing the exception.
	 * 
	 * @property
	 * @name InvalidStateError#message
	 */
	this.message = message || "An invalid state was encountered";

	/**
	 * The name of the error.
	 * 
	 * @property
	 * @name InvalidStateError#name
	 */
	this.name = "InvalidStateError";
};
InvalidStateError.prototype = new Error();
exports.InvalidStateError = InvalidStateError;

/**
 * Indicates that an invalid argument was supplied
 *
 * @constructor
 * @param {Stirng} message A message describing the exception.
 */
function InvalidArgumentsError(message) {
	Error.call(this);
	Error.captureStackTrace(this, arguments.callee);

	/**
	 * A message describing the exception.
	 * 
	 * @property
	 * @name InvalidStateError#message
	 */
	this.message = message || "An invalid argument was supplied";

	/**
	 * The name of the error.
	 * 
	 * @property
	 * @name InvalidStateError#name
	 */
	this.name = "InvalidArgumentsError";
};
InvalidArgumentsError.prototype = new Error();
exports.InvalidArgumentsError = InvalidArgumentsError;

/**
 * Indicates that an invalid argument was supplied
 *
 * @constructor
 * @param {Stirng} message A message describing the exception.
 */
function TypeError(message) {
	Error.call(this);
	Error.captureStackTrace(this, arguments.callee);

	/**
	 * A message describing the exception.
	 * 
	 * @property
	 * @name InvalidStateError#message
	 */
	this.message = message || "Invalid Type";

	/**
	 * The name of the error.
	 * 
	 * @property
	 * @name InvalidStateError#name
	 */
	this.name = "TypeError";
};
TypeError.prototype = new Error();
exports.TypeError = TypeError;

/**
 * Indicates that an invalid argument was supplied
 *
 * @constructor
 * @param {Stirng} message A message describing the exception.
 */
function ReferenceError(message) {
	Error.call(this);
	Error.captureStackTrace(this, arguments.callee);

	/**
	 * A message describing the exception.
	 * 
	 * @property
	 * @name InvalidStateError#message
	 */
	this.message = message || "Invalid Reference";

	/**
	 * The name of the error.
	 * 
	 * @property
	 * @name InvalidStateError#name
	 */
	this.name = "ReferenceError";
};
ReferenceError.prototype = new Error();
exports.ReferenceError = ReferenceError;