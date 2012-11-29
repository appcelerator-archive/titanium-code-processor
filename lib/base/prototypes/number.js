/*global
util
FunctionTypeBase
type
NumberType
UnknownType
areAnyUnknown
handleRecoverableNativeException
toInteger
StringType
toNumber
isDefined
ObjectType
addNonEnumerableProperty
*/

/*****************************************
 *
 * Number Protoype Class
 *
 *****************************************/

/**
 * toString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.6.4.2
 */
function NumberProtoToStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(NumberProtoToStringFunc, FunctionTypeBase);
NumberProtoToStringFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var radix = !args || !args[0] || type(args[0]) === 'Undefined' ? new NumberType(10) : args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
		
	// Make sure this is a number
	if (type(thisVal) !== 'Number') {
		if (type(thisVal) === 'Object' && thisVal.className === 'Number') {
			thisVal = new NumberType(thisVal.primitiveValue);
		} else {
			handleRecoverableNativeException('TypeError', 'Value is not a number or number object');
			return new UnknownType();
		}
	}
	
	// Parse the radix
	if (radix && type(radix) !== 'Undefined') {
		radix = toInteger(radix).value;
		if (radix < 2 || radix > 36) {
			handleRecoverableNativeException('RangeError', 'Invalid radix value ' + radix);
			return new UnknownType();
		}
	} else {
		radix = undefined;
	}
	
	// Use the built-in method to perform the toString
	return new StringType(thisVal.value.toString(radix));
};

/**
 * toLocaleString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.6.4.2
 */
function NumberProtoToLocaleStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(NumberProtoToLocaleStringFunc, FunctionTypeBase);
NumberProtoToLocaleStringFunc.prototype.call = function call(thisVal) {
	
	// Use the built-in method to perform the toLocaleString
	return new StringType(toNumber(thisVal).value.toLocaleString());
};

/**
 * valueOf() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.6.4.2
 */
function NumberProtoValueOfFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(NumberProtoValueOfFunc, FunctionTypeBase);
NumberProtoValueOfFunc.prototype.call = function call(thisVal, args) {
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	// Make sure this is a number
	if (type(thisVal) === 'Number') {
		return thisVal;
	} else if (type(thisVal) === 'Object' && thisVal.className === 'Number') {
		return new NumberType(thisVal.primitiveValue);
	}
	handleRecoverableNativeException('TypeError', 'Value is not a number object');
	return new UnknownType();
};

/**
 * toFixed() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.6.4.2
 */
function NumberProtoToFixedFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(NumberProtoToFixedFunc, FunctionTypeBase);
NumberProtoToFixedFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var fractionDigits,
		f;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Step 1
	fractionDigits = args[0];
	f = isDefined(fractionDigits) ? toInteger(fractionDigits).value : 0;
	
	// Step 2
	if (f < 0 || f > 20) {
		handleRecoverableNativeException('RangeError', 'Invalid fraction digits value ' + f);
		return new UnknownType();
	}
	
	// Use the built-in method to perform the toFixed
	return new StringType(toNumber(thisVal).value.toFixed(f));
};

/**
 * toExponential() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.6.4.2
 */
function NumberProtoToExponentialFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(NumberProtoToExponentialFunc, FunctionTypeBase);
NumberProtoToExponentialFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var fractionDigits,
		f;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Step 1
	fractionDigits = args[0];
	f = isDefined(fractionDigits) ? toInteger(fractionDigits).value : 0;
	
	// Step 2
	if (f < 0 || f > 20) {
		handleRecoverableNativeException('RangeError', 'Invalid fraction digits value ' + f);
		return new UnknownType();
	}
	
	// Use the built-in method to perform the toFixed
	return new StringType(toNumber(thisVal).value.toExponential(f));
};

/**
 * toPrecision() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.6.4.2
 */
function NumberProtoToPrecisionFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(NumberProtoToPrecisionFunc, FunctionTypeBase);
NumberProtoToPrecisionFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var precision,
		p;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Step 1
	precision = args[0];
	p = isDefined(precision) ? toInteger(precision).value : 0;
	
	// Step 2
	if (p < 1 || p > 21) {
		handleRecoverableNativeException('RangeError', 'Invalid precision value ' + p);
		return new UnknownType();
	}
	
	// Use the built-in method to perform the toFixed
	return new StringType(toNumber(thisVal).value.toPrecision(p));
};

/**
 * @classdesc The prototype for Booleans
 *
 * @constructor
 * @see ECMA-262 Spec Chapter 15.6.4
 */
exports.NumberPrototypeType = NumberPrototypeType;
function NumberPrototypeType(className) {
	ObjectType.call(this, className || 'Number');
	this.primitiveValue = 0;
	
	addNonEnumerableProperty(this, 'toString', new NumberProtoToStringFunc(), false, true);
	addNonEnumerableProperty(this, 'toLocaleString', new NumberProtoToLocaleStringFunc(), false, true);
	addNonEnumerableProperty(this, 'valueOf', new NumberProtoValueOfFunc(), false, true);
	addNonEnumerableProperty(this, 'toFixed', new NumberProtoToFixedFunc(), false, true);
	addNonEnumerableProperty(this, 'toExponential', new NumberProtoToExponentialFunc(), false, true);
	addNonEnumerableProperty(this, 'toPrecision', new NumberProtoToPrecisionFunc(), false, true);
}
util.inherits(NumberPrototypeType, ObjectType);