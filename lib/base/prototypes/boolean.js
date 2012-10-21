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
	FunctionTypeBase.call(this, 0, false, className || 'Function');
}
util.inherits(BooleanProtoToStringFunc, FunctionTypeBase);
BooleanProtoToStringFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var b = thisVal;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Type conversion
	if (type(b) !== "Boolean") {
		if (type(b) === "Object" && b.className === "Boolean") {
			b = new BooleanType(b.primitiveValue);
		} else {
			throwNativeException('TypeError', 'Value is not a boolean object');
		}
	}
	
	// Use the built-in method to perform the toString
	return new StringType(b.value.toString());
};

/**
 * valueOf() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.6.4.2
 */
function BooleanProtoValueOfFunc(className) {
	FunctionTypeBase.call(this, 0, false, className || 'Function');
}
util.inherits(BooleanProtoValueOfFunc, FunctionTypeBase);
BooleanProtoValueOfFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var b = thisVal;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
		
	if (type(b) !== "Boolean") {
		if (type(b) === "Object" && b.className === "Boolean") {
			b = new BooleanType(b.primitiveValue);
		} else {
			throwNativeException('TypeError', 'Value is not a boolean object');
		}
	}
	return b;
};

/**
 * @classdesc The prototype for Booleans
 * 
 * @constructor
 * @see ECMA-262 Spec Chapter 15.6.4
 */
exports.BooleanPrototypeType = BooleanPrototypeType;
function BooleanPrototypeType(className) {
	ObjectType.call(this, className);
	
	this.put("toString", new BooleanProtoToStringFunc(), false, true);
	this.put("valueOf", new BooleanProtoValueOfFunc(), false, true);
}
util.inherits(BooleanPrototypeType, ObjectType);

prototypes['Boolean'] = new BooleanPrototypeType();