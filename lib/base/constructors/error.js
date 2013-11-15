/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Definition for the error constructor
 *
 * @module base/constructors/error
 */
/*global
util,
FunctionTypeBase,
areAnyUnknown,
UnknownType,
prototypes,
ObjectType,
StringType,
toString,
type,
wrapNativeCall
*/

/*****************************************
 *
 * Error Constructor
 *
 *****************************************/

/**
 * Error constructor function
 *
 * @private
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
ErrorConstructor.instantiateClone = function instantiateClone(source) {
	return new ErrorConstructor(source._errorType, source.className);
};
ErrorConstructor.prototype.callFunction = wrapNativeCall(function callFunction(thisVal, args) {

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	return ErrorConstructor.prototype.construct.call(this, args);
});
ErrorConstructor.prototype.construct = wrapNativeCall(function construct(args) {

	// Variable declarations
	var errorType = this._errorType,
		err,
		message = args[0];

	// Validate the parameters
	if (areAnyUnknown(args)) {
		return new UnknownType();
	}

	err = new ObjectType(errorType, undefined, true);
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
}, true);