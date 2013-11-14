/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Contains conversion methods for types
 *
 * @module base/conversion
 */
/*global
type,
UnknownType,
BooleanType,
NumberType,
StringType,
ObjectType,
UndefinedType,
prototypes,
handleRecoverableNativeException,
throwNativeException,
isType,
isDataDescriptor
*/

/*****************************************
 *
 * Type Conversion
 *
 *****************************************/

/**
 * ECMA-262 Spec: <em>The abstract operation ToPrimitive takes an input argument and an optional argument PreferredType.
 * The abstract operation ToPrimitive converts its input argument to a non-Object type. If an object is capable of
 * converting to more than one primitive type, it may use the optional hint PreferredType to favour that type.</em>
 *
 * @method module:base/conversion.toPrimitive
 * @param {module:base.BaseType} input The value to convert
 * @param {string} preferredType The preferred type to convert to
 * @return {module:base.BaseType} The converted value
 * @see ECMA-262 Spec Chapter 9.1
 */
exports.toPrimitive = toPrimitive;
function toPrimitive(input, preferredType) {
	input = input || new UndefinedType();
	switch(type(input)) {
		case 'Object':
			return input.defaultValue(preferredType);
		case 'Unknown':
			return new UnknownType();
		default:
			return input;
	}
}

/**
 * ECMA-262 Spec: <em>The abstract operation ToBoolean converts its argument to a value of type Boolean</em>
 *
 * @method module:base/conversion.toBoolean
 * @param {module:base.BaseType} input The value to convert
 * @return {module:base/types/boolean.BooleanType} The converted value
 * @see ECMA-262 Spec Chapter 9.2
 */
exports.toBoolean = toBoolean;
function toBoolean(input) {
	var newBoolean = new BooleanType();
	input = input || new UndefinedType();
	switch (type(input)) {
		case 'Undefined':
			newBoolean.value = false;
			break;
		case 'Null':
			newBoolean.value = false;
			break;
		case 'Boolean':
			newBoolean.value = input.value;
			break;
		case 'Number':
			newBoolean.value = !!input.value;
			break;
		case 'String':
			newBoolean.value = !!input.value;
			break;
		case 'Object':
			newBoolean.value = true;
			break;
		case 'Unknown':
			return new UnknownType();
	}
	return newBoolean;
}

/**
 * ECMA-262 Spec: <em>The abstract operation ToNumber converts its argument to a value of type Number</em>
 *
 * @method module:base/conversion.toNumber
 * @param {module:base.BaseType} input The value to convert
 * @return {module:base/types/number.NumberType} The converted value
 * @see ECMA-262 Spec Chapter 9.3
 */
exports.toNumber = toNumber;
function toNumber(input) {
	var newNumber = new NumberType();
	input = input || new UndefinedType();
	switch (type(input)) {
		case 'Undefined':
			newNumber.value = NaN;
			break;
		case 'Null':
			newNumber.value = 0;
			break;
		case 'Boolean':
			newNumber.value = input.value ? 1 : 0;
			break;
		case 'Number':
			newNumber.value = input.value;
			break;
		case 'String':
			newNumber.value = +input.value;
			break;
		case 'Object':
			newNumber = toNumber(toPrimitive(input, 'Number'));
			break;
		case 'Unknown':
			return new UnknownType();
	}
	return newNumber;
}

/**
 * ECMA-262 Spec: <em>The abstract operation ToInteger converts its argument to an integral numeric value.</em>
 *
 * @method module:base/conversion.toInteger
 * @param {module:base.BaseType} input The value to convert
 * @return {module:base/types/number.NumberType} The converted value
 * @see ECMA-262 Spec Chapter 9.4
 */
exports.toInteger = toInteger;
function toInteger(input) {
	var newNumber = toNumber(input),
		sign;
	if (type(newNumber) === 'Unknown') {
		return new UnknownType();
	} else if (isNaN(newNumber.value)) {
		newNumber.value = 0;
	} else {
		sign = newNumber.value < 0 ? -1 : 1;
		newNumber.value = sign * Math.floor(Math.abs(newNumber.value));
	}
	return newNumber;
}

/**
 * ECMA-262 Spec: <em>The abstract operation ToInt32 converts its argument to one of 2^32 integer values in the range
 * -2^31 through 2^31 - 1, inclusive.</em>
 *
 * @method module:base/conversion.toInt32
 * @param {module:base.BaseType} input The value to convert
 * @return {module:base/types/number.NumberType} The converted value
 * @see ECMA-262 Spec Chapter 9.5
 */
exports.toInt32 = toInt32;
function toInt32(input) {
	var newNumber = toNumber(input),
		sign;
	if (type(newNumber) === 'Unknown') {
		return new UnknownType();
	} else if (isNaN(newNumber.value) || newNumber.value === Infinity || newNumber.value === -Infinity) {
		newNumber.value = 0;
	} else {
		sign = newNumber.value < 0 ? -1 : 1;
		newNumber.value = sign * Math.floor(Math.abs(newNumber.value)) % Math.pow(2, 32);
		if (newNumber.value >= Math.pow(2, 31)) {
			newNumber.value -= Math.pow(2, 32);
		}
	}
	return newNumber;
}

/**
 * ECMA-262 Spec: <em>The abstract operation ToUint32 converts its argument to one of 2^32 integer values in the range 0
 * through 2^32 - 1, inclusive.</em>
 *
 * @method module:base/conversion.toUint32
 * @param {module:base.BaseType} input The value to convert
 * @return {module:base/types/number.NumberType} The converted value
 * @see ECMA-262 Spec Chapter 9.6
 */
exports.toUint32 = toUint32;
function toUint32(input) {
	var newNumber = toNumber(input),
		sign;
	if (type(newNumber) === 'Unknown') {
		return new UnknownType();
	} else if (isNaN(newNumber.value) || newNumber.value === Infinity || newNumber.value === -Infinity) {
		newNumber.value = 0;
	} else {
		sign = newNumber.value < 0 ? -1 : 1;
		newNumber.value = sign * Math.floor(Math.abs(newNumber.value)) % Math.pow(2, 32);
	}
	return newNumber;
}

/**
 * ECMA-262 Spec: <em>The abstract operation ToUint16 converts its argument to one of 2^16 integer values in the range 0
 * through 2^16 - 1, inclusive.</em>
 *
 * @method module:base/conversion.toUint16
 * @param {module:base.BaseType} input The value to convert
 * @return {module:base/types/number.NumberType} The converted value
 * @see ECMA-262 Spec Chapter 9.7
 */
exports.toUint16 = toUint16;
function toUint16(input) {
	var newNumber = toNumber(input),
		sign;
	if (type(newNumber) === 'Unknown') {
		return new UnknownType();
	} else if (isNaN(newNumber.value) || newNumber.value === Infinity || newNumber.value === -Infinity) {
		newNumber.value = 0;
	} else {
		sign = newNumber.value < 0 ? -1 : 1;
		newNumber.value = sign * Math.floor(Math.abs(newNumber.value)) % Math.pow(2, 16);
	}
	return newNumber;
}

/**
 * ECMA-262 Spec: <em>The abstract operation ToString converts its argument to a value of type String</em>
 *
 * @method module:base/conversion.toString
 * @param {module:base.BaseType} input The value to convert
 * @return {module:base/types/string.StringType} The converted value
 * @see ECMA-262 Spec Chapter 9.8
 */
exports.toString = toString;
function toString(input) {
	var newString;
	input = input || new UndefinedType();
	if (type(input) === 'Unknown') {
		newString = new UnknownType();
	} else if (type(input) === 'Object') {
		newString = toString(toPrimitive(input, 'String'));
	} else {
		newString = new StringType();
		newString.value = input.value + '';
	}
	return newString;
}

/**
 * ECMA-262 Spec: <em>The abstract operation ToObject converts its argument to a value of type Object</em>
 *
 * @method module:base/conversion.toObject
 * @param {module:base.BaseType} input The value to convert
 * @return {module:base/types/object.ObjectType} The converted value
 * @see ECMA-262 Spec Chapter 9.9
 */
exports.toObject = toObject;
function toObject(input) {
	var newObject;
	input = input || new UndefinedType();
	switch (type(input)) {
		case 'Boolean':
			newObject = new ObjectType();
			newObject.className = 'Boolean';
			newObject.primitiveValue = input.value;

			Object.defineProperty(newObject, 'objectPrototype', {
				get: function () {
					return prototypes.Boolean;
				},
				configurable: true
			});

			return newObject;
		case 'Number':
			newObject = new ObjectType();
			newObject.className = 'Number';
			newObject.primitiveValue = input.value;

			Object.defineProperty(newObject, 'objectPrototype', {
				get: function () {
					return prototypes.Number;
				},
				configurable: true
			});

			return newObject;
		case 'String':
			newObject = new ObjectType();
			newObject.className = 'String';
			newObject.primitiveValue = input.value;

			Object.defineProperty(newObject, 'objectPrototype', {
				get: function () {
					return prototypes.String;
				},
				configurable: true
			});

			newObject._properties = input._properties;
			return newObject;
		case 'Object':
			return input;
		case 'Unknown':
			return new UnknownType();
		default:
			handleRecoverableNativeException('TypeError', 'Values of type ' + type(input) + ' cannot be converted to objects');
			return new UnknownType();
	}
}



/**
 * Converts a property descriptor to a generic object.
 *
 * @method module:base/conversion.fromPropertyDescriptor
 * @param {module:base/types/object.DataPropertyDescriptor|module:base/types/object.AccessorPropertyDescriptor|Object} The property descriptor to convert
 * @return {(module:base/types/undefined.UndefinedType | module:base/types/object.ObjectType)} The converted property descriptor
 * @see ECMA-262 Spec Chapter 8.10.4
 */
exports.fromPropertyDescriptor = fromPropertyDescriptor;
function fromPropertyDescriptor(desc) {

	var obj = new ObjectType();

	if (!desc) {
		return new UndefinedType();
	}

	if (isDataDescriptor(desc)) {

		obj.defineOwnProperty('value', {
			value: desc.value || new UndefinedType(),
			writable: true,
			enumerable: true,
			configurable: true
		}, false, true);

		obj.defineOwnProperty('writable', {
			value: new BooleanType(desc.writable),
			writable: true,
			enumerable: true,
			configurable: true
		}, false, true);

	} else {

		obj.defineOwnProperty('get', {
			value: desc.get || new UndefinedType(),
			writable: true,
			enumerable: true,
			configurable: true
		}, false, true);

		obj.defineOwnProperty('set', {
			value: desc.set || new UndefinedType(),
			writable: true,
			enumerable: true,
			configurable: true
		}, false, true);
	}

	obj.defineOwnProperty('configurable', {
		value: new BooleanType(desc.configurable),
		writable: true,
		enumerable: true,
		configurable: true
	}, false, true);

	obj.defineOwnProperty('enumerable', {
		value: new BooleanType(desc.enumerable),
		writable: true,
		enumerable: true,
		configurable: true
	}, false, true);

	return obj;
}

/**
 * Converts a generic object to a property descriptor (think Object.defineProperty).
 *
 * @method module:base/conversion.toPropertyDescriptor
 * @param {Object} o The object to convert
 * @return {(module:base/types/object.DataPropertyDescriptor | module:base/types/object.AccessorPropertyDescriptor)} The converted property descriptor
 * @see ECMA-262 Spec Chapter 8.10.5
 */
exports.toPropertyDescriptor = toPropertyDescriptor;
function toPropertyDescriptor(obj) {
	var desc = {},
		getter,
		setter;

	if (type(obj) === 'Unknown') {

		// Create a sensible default data property descriptor
		desc.value = obj;
		desc.writable = false;
		desc.enumerable = true;
		desc.configurable = false;

	} else if (type(obj) === 'Object') {

		// Parse through all of the options
		if (obj.hasProperty('enumerable')) {
			desc.enumerable = toBoolean(obj.get('enumerable')).value;
		}
		if (obj.hasProperty('configurable')) {
			desc.configurable = toBoolean(obj.get('configurable')).value;
		}
		if (obj.hasProperty('value')) {
			desc.value = obj.get('value');
		}
		if (obj.hasProperty('writable')) {
			desc.writable = toBoolean(obj.get('writable')).value;
		}
		if (obj.hasProperty('get')) {
			getter = obj.get('get');
			if (type(getter) !== 'Undefined' && type(getter) !== 'Unknown' && !isCallable(getter)) {
				throwNativeException('TypeError', 'get is not callable');
			}
			desc.get = getter;
		}
		if (obj.hasProperty('set')) {
			setter = obj.get('set');
			if (type(setter) !== 'Undefined' && type(setter) !== 'Unknown' && !isCallable(setter)) {
				throwNativeException('TypeError', 'set is not callable');
			}
			desc.set = setter;
		}
		if ((desc.get || desc.set) && (typeof desc.value != 'undefined' || typeof desc.writable != 'undefined')) {
			throwNativeException('TypeError', 'Property descriptors cannot contain both get/set and value/writable properties');
		}
	} else {
		throwNativeException('TypeError', 'Property descriptors must be objects');
	}

	return desc;
}

/**
 * ECMA-262 Spec: <em>The abstract operation CheckObjectCoercible throws an error if its argument is a value that cannot
 * be converted to an Object using ToObject.</em>
 *
 * @method module:base/conversion.checkObjectCoercible
 * @param {module:base.BaseType} input The value to check if it's coercible
 * @see ECMA-262 Spec Chapter 9.10
 */
exports.checkObjectCoercible = checkObjectCoercible;
function checkObjectCoercible(input) {
	if (isType(input, ['Undefined', 'Null'])) {
		throwNativeException('TypeError', type(input).toLowerCase() + ' cannot be coerced to an object');
	}
}

/**
 * ECMA-262 Spec: <em>The abstract operation IsCallable determines if its argument, which must be an ECMAScript
 * language value, is a callable function Object</em>
 *
 * @method module:base/conversion.isCallable
 * @param {module:base.BaseType} input The value to check if it's callable
 * @return {boolean} Whether or not the object is callable
 * @see ECMA-262 Spec Chapter 9.11
 */
exports.isCallable = isCallable;
function isCallable(input) {
	if (input && type(input) === 'Object') {
		return !!input.callFunction;
	} else {
		return false;
	}
}

/**
 * Converts a value to unknown "in-place"
 *
 * @method module:base/conversion.convertToUnknown
 * @param {module:base.BaseType} value The value to convert
 */
exports.convertToUnknown = convertToUnknown;
function convertToUnknown (value) {
	UnknownType.call(value);
}

/**
 * The Strict Equality Comparison Algorithm
 *
 * @method module:base/conversion.strictEquals
 * @param {module:base.BaseType} x The first value to compare
 * @param {module:base.BaseType} y The second value to compare
 * @return {boolean} Whether or not the two equals are strictly equal
 * @see ECMA-262 Spec Chapter 11.9.6
 */
exports.strictEquals = strictEquals;
function strictEquals(x, y) {
	var typeX = type(x),
		typeY = type(y);

	if (typeX !== typeY) {
		return false;
	}

	switch(typeX) {
		case 'Undefined':
		case 'Null': return true;
		case 'Boolean':
		case 'Number':
		case 'String': return x.value === y.value;
		case 'Object': return x === y;
	}
}

/**
 * The Abstract Equality Comparison Algorithm
 *
 * @method module:base/conversion.strictEquals
 * @param {module:base.BaseType} x The first value to compare
 * @param {module:base.BaseType} y The second value to compare
 * @return {boolean} Whether or not the two equals are strictly equal
 * @see ECMA-262 Spec Chapter 11.9.3
 */
exports.abstractEquality = abstractEquality;
function abstractEquality(x, y) {
	var typeX = type(x),
		typeY = type(y),
		xValue = x.value,
		yValue = y.value;

	// Step 1
	if (typeY === typeX) {
		if (typeX === 'Undefined' || typeX === 'Null') {
			return true;
		}
		if (typeX === 'Number') {
			if (isNaN(xValue) || isNaN(yValue)) {
				return false;
			}
			return xValue === yValue;
		}
		if (typeX === 'String') {
			return xValue === yValue;
		}
		if (typeX === 'Boolean') {
			return xValue === yValue;
		}
		return x === y;
	}

	// Step 2
	if (typeX === 'Undefined' && typeY === 'Null') {
		return true;
	}

	// Step 3
	if (typeX === 'Null' && typeY === 'Undefined') {
		return true;
	}

	// Step 4
	if (typeX === 'Number' && typeY === 'String') {
		return abstractEquality(x, toNumber(y));
	}

	// Step 5
	if (typeX === 'String' && typeY === 'Number') {
		return abstractEquality(toNumber(x), y);
	}

	// Step 6
	if (typeX === 'Boolean') {
		return abstractEquality(toNumber(x), y);
	}

	// Step 7
	if (typeY === 'Boolean') {
		return abstractEquality(x, toNumber(y));
	}

	// Step 8
	if (typeY === 'Object' && (typeX === 'String' || typeX === 'Number')) {
		return abstractEquality(x, toPrimitive(y));
	}

	// Step 8
	if (typeX === 'Object' && (typeY === 'String' || typeY === 'Number')) {
		return abstractEquality(toPrimitive(x), y);
	}

	// Step 9
	return false;
}