/*global
util
FunctionTypeBase
areAnyUnknown
UnknownType
BooleanType
prototypes
toBoolean
ObjectType
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
BooleanConstructor.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var value = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	return value ? toBoolean(value) : new BooleanType(false);
};
BooleanConstructor.prototype.construct = function call(args) {
	
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
};