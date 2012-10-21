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
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
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
	obj.objectPrototype = new BooleanPrototypeType();
		
	return obj;
};
GlobalObjects['Boolean'] = new BooleanConstructor();