/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Definition for the boolean prototype
 *
 * @module base/prototypes/boolean
 */
/*global
util,
FunctionTypeBase,
areAnyUnknown,
UnknownType,
type,
StringType,
handleRecoverableNativeException,
BooleanType,
ObjectType,
addNonEnumerableProperty,
wrapNativeCall
*/

/*****************************************
 *
 * Boolean Prototype Class
 *
 *****************************************/

/**
 * toString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.6.4.2
 */
function BooleanProtoToStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(BooleanProtoToStringFunc, FunctionTypeBase);
BooleanProtoToStringFunc.prototype.callFunction = wrapNativeCall(function callFunction(thisVal, args) {

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	// Make sure this is a boolean
	if (type(thisVal) !== 'Boolean') {
		if (type(thisVal) === 'Object' && thisVal.className === 'Boolean') {
			return new StringType(thisVal.primitiveValue + '');
		} else {
			handleRecoverableNativeException('TypeError', 'Value is not a boolean or boolean object');
			return new UnknownType();
		}
	} else {
		return new StringType(thisVal.value + '');
	}
});

/**
 * valueOf() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.6.4.2
 */
function BooleanProtoValueOfFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(BooleanProtoValueOfFunc, FunctionTypeBase);
BooleanProtoValueOfFunc.prototype.callFunction = wrapNativeCall(function callFunction(thisVal, args) {

	// Variable declarations
	var b = thisVal;

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	if (type(b) !== 'Boolean') {
		if (type(b) === 'Object' && b.className === 'Boolean') {
			b = new BooleanType(b.primitiveValue);
		} else {
			handleRecoverableNativeException('TypeError', 'Value is not a boolean object');
			return new UnknownType();
		}
	}
	return b;
});

/**
 * @classdesc The prototype for Booleans
 *
 * @constructor module:base/prototypes/boolean.BooleanPrototypeType
 * @see ECMA-262 Spec Chapter 15.6.4
 */
exports.BooleanPrototypeType = BooleanPrototypeType;
function BooleanPrototypeType(className) {
	ObjectType.call(this, className || 'Boolean');
	this.primitiveValue = false;

	addNonEnumerableProperty(this, 'toString', new BooleanProtoToStringFunc(), false, true);
	addNonEnumerableProperty(this, 'valueOf', new BooleanProtoValueOfFunc(), false, true);
}
util.inherits(BooleanPrototypeType, ObjectType);