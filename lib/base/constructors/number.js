/*global
util
FunctionTypeBase
areAnyUnknown
UnknownType
prototypes
addReadOnlyProperty
NumberType
toNumber
ObjectType
*/

/*****************************************
 *
 * Number Constructor
 *
 *****************************************/

/**
 * Number constructor function
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.7
 */
function NumberConstructor(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
	
	this.defineOwnProperty('prototype', {
		value: prototypes.Number
	}, false, true);

	addReadOnlyProperty(this, 'length', new NumberType(0), false, true);
	addReadOnlyProperty(this, 'MAX_VALUE', new NumberType(Number.MAX_VALUE), false, true);
	addReadOnlyProperty(this, 'MIN_VALUE', new NumberType(Number.MIN_VALUE), false, true);
	addReadOnlyProperty(this, 'NaN', new NumberType(NaN), false, true);
	addReadOnlyProperty(this, 'NEGATIVE_INFINITY', new NumberType(Number.NEGATIVE_INFINITY), false, true);
	addReadOnlyProperty(this, 'POSITIVE_INFINITY', new NumberType(Number.POSITIVE_INFINITY), false, true);
}
util.inherits(NumberConstructor, FunctionTypeBase);
NumberConstructor.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var value = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	return value ? toNumber(value) : new NumberType(0);
};
NumberConstructor.prototype.construct = function call(args) {
	
	// Variable declarations
	var value = args[0],
		obj;
	
	// Validate the parameters
	if (areAnyUnknown(args)) {
		return new UnknownType();
	}
	
	obj = new ObjectType();
	obj.className = 'Number';
	obj.primitiveValue = value ? toNumber(value).value : 0;
	
	Object.defineProperty(obj, 'objectPrototype', {
		get: function () {
			return prototypes.Number;
		},
		configurable: true
	});
		
	return obj;
};