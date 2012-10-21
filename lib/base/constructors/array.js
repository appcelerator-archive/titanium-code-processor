/*****************************************
 *
 * Array Constructor
 *
 *****************************************/

/**
 * isArray() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.4.3.2
 */
function ArrayIsArrayFunc(className) {
	FunctionTypeBase.call(this, 1, false, className || 'Function');
}
util.inherits(ArrayIsArrayFunc, FunctionTypeBase);
ArrayIsArrayFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var arg = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1 and 2
	return new BooleanType(type(arg) === 'Object' && arg.className === 'Array');
};

/**
 * Array constructor function
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.4
 */
function ArrayConstructor(className) {
	FunctionTypeBase.call(this, 0, false, className || 'Function');
	
	this.put('isArray', new ArrayIsArrayFunc(), false, true);
}
util.inherits(ArrayConstructor, FunctionTypeBase);
ArrayConstructor.prototype.call = function call(thisVal, args) {
	return ArrayConstructor.prototype.construct.call(this, args);
};
ArrayConstructor.prototype.construct = function call(args) {
	
	// Variable declarations
	var array,
		len,
		i = 0;
	
	// Validate the parameters
	if (areAnyUnknown(args)) {
		return new UnknownType();
	}
	
	array = new ArrayType();
	if (args.length === 1) {
		len = args[0];
		if (type(len) === 'Number') {
			if (len.value === toUint32(len).value) {
				array.put('length', toUint32(len), true);
			} else {
				throwNativeException('RangeError', 'Invalid length ' + len.value);
			}
		} else {
			array.put('length', new NumberType(1), true);
			array.put('0', len, true);
		}
	} else if (args.length > 1){
		len = args.length;
		array.put('length', new NumberType(len), true);
		for(; i < len; i++) {
			array.put(i, args[i], true);
		}
	}
	
	return array;
};
prototypes['Array'].put('constructor', globalObjects['Array'] = new ArrayConstructor(), false, true);