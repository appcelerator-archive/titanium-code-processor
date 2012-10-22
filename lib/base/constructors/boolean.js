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
	FunctionTypeBase.call(this, 1, false, className || 'Function');
	
	this.defineOwnProperty('prototype', {
		value: prototypes['Boolean']
	}, false, true);
}
util.inherits(BooleanConstructor, FunctionTypeBase);
BooleanConstructor.prototype.call = function call(thisVal, args) {
	return toBoolean(args[0]);
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
	obj.primitiveValue = value ? toBoolean(value).value : '';
	
	Object.defineProperty(obj, 'objectPrototype', {
		get: function () {
			return prototypes['Boolean'];
		},
		configurable: true
	});
		
	return obj;
};
prototypes['Boolean'].put('constructor', globalObjects['Boolean'] = new BooleanConstructor(), false, true);