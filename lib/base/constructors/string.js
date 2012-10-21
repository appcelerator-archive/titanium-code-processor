/*****************************************
 *
 * String Constructor
 *
 *****************************************/

/**
 * isArray() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.3.2
 */
function StringFromCharCodeFunc(className) {
	FunctionTypeBase.call(this, 1, false, className || 'Function');
}
util.inherits(StringFromCharCodeFunc, FunctionTypeBase);
StringFromCharCodeFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var i = 0,
		len = args.length;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Convert the array to something we can apply()
	for(; i < len; i++) {
		args[i] = toUint16(args[i]).value;
	}
	
	// Use the built-in match method to perform the match
	return new StringType(String.fromCharCode.apply(this, args));
};

/**
 * String constructor function
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5
 */
function StringConstructor(className) {
	FunctionTypeBase.call(this, 0, false, className || 'Function');
	
	this.put('fromCharCode', new StringFromCharCodeFunc(), false, true);
}
util.inherits(StringConstructor, FunctionTypeBase);
StringConstructor.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var value = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	if (!value) {
		return new StringType();
	}
	return toString(value);
};
StringConstructor.prototype.construct = function call(args) {
	
	// Variable declarations
	var value = args[0],
		obj;
	
	// Validate the parameters
	if (areAnyUnknown(args)) {
		return new UnknownType();
	}
	
	obj = new ObjectType();
	obj.className = 'String';
	obj.primitiveValue = value ? toString(value).value : '';
	
	Object.defineProperty(obj, 'objectPrototype', {
		get: function () {
			return prototypes['String'];
		},
		configurable: true
	});
	
	return obj;
};
prototypes['String'].put('constructor', globalObjects['String'] = new StringConstructor(), false, true);