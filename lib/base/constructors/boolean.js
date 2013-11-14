/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Definition for the boolean constructor
 *
 * @module base/constructors/boolean
 */
/*global
util,
FunctionTypeBase,
areAnyUnknown,
UnknownType,
BooleanType,
prototypes,
toBoolean,
ObjectType,
wrapNativeCall
*/

/*****************************************
 *
 * Boolean Constructor
 *
 *****************************************/

/**
 * Boolean constructor function
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.6
 */
function BooleanConstructor(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');

	this.defineOwnProperty('prototype', {
		value: prototypes.Boolean
	}, false, true);
}
util.inherits(BooleanConstructor, FunctionTypeBase);
BooleanConstructor.prototype.callFunction = wrapNativeCall(function callFunction(thisVal, args) {

	// Variable declarations
	var value = args[0];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	return value ? toBoolean(value) : new BooleanType(false);
});
BooleanConstructor.prototype.construct = wrapNativeCall(function construct(args) {

	// Variable declarations
	var value = args[0],
		obj;

	// Validate the parameters
	if (areAnyUnknown(args)) {
		return new UnknownType();
	}

	obj = new ObjectType();
	obj.className = 'Boolean';
	obj.primitiveValue = value ? toBoolean(value).value : false;

	Object.defineProperty(obj, 'objectPrototype', {
		get: function () {
			return prototypes.Boolean;
		},
		configurable: true
	});

	return obj;
}, true);