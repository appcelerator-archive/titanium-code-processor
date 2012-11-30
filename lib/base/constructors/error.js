/*global
util
FunctionTypeBase
areAnyUnknown
UnknownType
prototypes
ObjectType
StringType
toString
type
*/

/*****************************************
 *
 * Error Constructor
 *
 *****************************************/

/**
 * Error constructor function
 *
 * @constructor
 * @see ECMA-262 Spec Chapter 15.11
 */
exports.ErrorConstructor = ErrorConstructor;
function ErrorConstructor(errorType, className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
	
	this.defineOwnProperty('prototype', {
		value: prototypes[errorType]
	}, false, true);
	
	this._errorType = errorType;
}
util.inherits(ErrorConstructor, FunctionTypeBase);
ErrorConstructor.prototype.call = function call(thisVal, args) {
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	return ErrorConstructor.prototype.construct.call(this, args);
};
ErrorConstructor.prototype.construct = function call(args) {
	
	// Variable declarations
	var errorType = this._errorType,
		err,
		message = args[0];
	
	// Validate the parameters
	if (areAnyUnknown(args)) {
		return new UnknownType();
	}
	
	err = new ObjectType();
	err.className = errorType;
	err.extensible = true;

	Object.defineProperty(err, 'objectPrototype', {
		get: function () {
			return prototypes[errorType];
		},
		configurable: true
	});

	err.put('name', new StringType(errorType), true);
	err.put('message', message && type(message) !== 'Undefined' ? toString(message) : new StringType(''), true);
	
	return err;
};