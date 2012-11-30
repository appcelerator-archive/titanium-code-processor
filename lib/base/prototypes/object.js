/*global
util
FunctionTypeBase
StringType
UnknownType
areAnyUnknown
type
toObject
isCallable
handleRecoverableNativeException
toString
BooleanType
isObject
isType
isDefined
ObjectType
addNonEnumerableProperty
*/

/*****************************************
 *
 * Object Prototype Class
 *
 *****************************************/

/**
 * toString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.2.4.2
 */
function ObjectProtoToStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(ObjectProtoToStringFunc, FunctionTypeBase);
ObjectProtoToStringFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var result = new StringType();
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	if (type(thisVal) === 'Undefined') {
		result.value = '[object Undefined]';
	} else if (type(thisVal) === 'Null') {
		result.value = '[object Null]';
	} else {
		result.value = '[object ' + toObject(thisVal).className + ']';
	}
	
	return result;
};

/**
 * toLocaleString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.2.4.3
 */
function ObjectProtoToLocaleStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(ObjectProtoToLocaleStringFunc, FunctionTypeBase);
ObjectProtoToLocaleStringFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o,
		toString;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	o = toObject(thisVal),
	toString = o.get('toString');
	if (type(toString) === 'Unknown') {
		return new UnknownType();
	} else if (!isCallable(toString)) {
		handleRecoverableNativeException('TypeError', 'toString is not callable');
		return new UnknownType();
	}
	return toString.call(o);
};

/**
 * valueOf() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.2.4.4
 */
function ObjectProtoValueOfFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(ObjectProtoValueOfFunc, FunctionTypeBase);
ObjectProtoValueOfFunc.prototype.call = function call(thisVal, args) {
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Convert to an object
	return toObject(thisVal);
};

/**
 * hasOwnProperty() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.2.4.5
 */
function ObjectProtoHasOwnPropertyFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ObjectProtoHasOwnPropertyFunc, FunctionTypeBase);
ObjectProtoHasOwnPropertyFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var p,
		o,
		desc;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	p = toString(args[0]);
	o = toObject(thisVal);
	desc = o.getOwnProperty(p.value);
	
	return new BooleanType(!!desc);
};

/**
 * isPrototypeOf() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.2.4.6
 */
function ObjectProtoIsPrototypeOfFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ObjectProtoIsPrototypeOfFunc, FunctionTypeBase);
ObjectProtoIsPrototypeOfFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var result = new BooleanType(),
		o,
		v = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	if (isObject(v)) {
		o = toObject(thisVal);
		while (true) {
			if (v === v.objectPrototype) {
				break;
			}
			v = v.objectPrototype;
			if (v && v.objectPrototype && type(v.objectPrototype) === 'Unknown') {
				return new UnknownType();
			}
			if (!v || isType(v, ['Undefined', 'Null'])) {
				break;
			}
			if (o === v) {
				result.value = true;
				break;
			}
		}
	}
	
	return result;
};

/**
 * propertyIsEnumerable() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.2.4.7
 */
function ObjectProtoPropertyIsEnumerableFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ObjectProtoPropertyIsEnumerableFunc, FunctionTypeBase);
ObjectProtoPropertyIsEnumerableFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var p,
		o,
		desc;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	p = toString(args[0]);
	o = toObject(thisVal);
	desc = o.getOwnProperty(p.value);
	
	return new BooleanType(isDefined(desc) && desc.enumerable);
};

/**
 * @classdesc The prototype for Objects, which is itself an object
 *
 * @constructor
 * @see ECMA-262 Spec Chapter 15.2.4
 */
exports.ObjectPrototypeType = ObjectPrototypeType;
function ObjectPrototypeType(className) {
	ObjectType.call(this, className || 'Object');
	
	addNonEnumerableProperty(this, 'toString', new ObjectProtoToStringFunc(), false, true);
	addNonEnumerableProperty(this, 'toLocaleString', new ObjectProtoToLocaleStringFunc(), false, true);
	addNonEnumerableProperty(this, 'valueOf', new ObjectProtoValueOfFunc(), false, true);
	addNonEnumerableProperty(this, 'hasOwnProperty', new ObjectProtoHasOwnPropertyFunc(), false, true);
	addNonEnumerableProperty(this, 'isPrototypeOf', new ObjectProtoIsPrototypeOfFunc(), false, true);
	addNonEnumerableProperty(this, 'propertyIsEnumerable', new ObjectProtoPropertyIsEnumerableFunc(), false, true);
}
util.inherits(ObjectPrototypeType, ObjectType);