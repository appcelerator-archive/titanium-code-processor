/*global
util
FunctionTypeBase
areAnyUnknown
UnknownType
handleRecoverableNativeException
ObjectProtoToStringFunc
UndefinedType
isCallable
isType
isObject
toUint32
FunctionType
NumberType
throwTypeError
ObjectProtoToLocaleStringFunc
ObjectProtoValueOfFunc
ObjectProtoHasOwnPropertyFunc
ObjectProtoIsPrototypeOfFunc
ObjectProtoPropertyIsEnumerableFunc
addNonEnumerableProperty
*/

/*****************************************
 *
 * Function Prototype Class
 *
 *****************************************/

/**
 * toString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.2.4.2
 */
function FunctionProtoToStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(FunctionProtoToStringFunc, FunctionTypeBase);
FunctionProtoToStringFunc.prototype.call = function call(thisVal, args) {
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	if (thisVal.className !== 'Function') {
		handleRecoverableNativeException('TypeError', 'Cannot invoke non-function type');
		return new UnknownType();
	}
	return ObjectProtoToStringFunc.prototype.call.apply(this, arguments);
};

/**
 * apply() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.2.4.2
 */
function FunctionProtoApplyFunc(className) {
	FunctionTypeBase.call(this, 2, className || 'Function');
}
util.inherits(FunctionProtoApplyFunc, FunctionTypeBase);
FunctionProtoApplyFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var thisArg = args[0],
		argArray = args[1],
		len,
		argList = [],
		i = 0;
	
	if (!thisArg) {
		thisArg = new UndefinedType();
	}

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	if (!isCallable(thisVal)) {
		handleRecoverableNativeException('TypeError', 'Attempted to call non-callable value');
		return new UnknownType();
	}
	
	if (!argArray || isType(argArray, ['Undefined', 'Null'])) {
		return thisVal.call(thisArg, []);
	}
	
	if (!isObject(argArray)) {
		handleRecoverableNativeException('TypeError', 'Arguments value is not an object');
		return new UnknownType();
	}
	
	len = toUint32(argArray.get('length')).value;
	for (; i < len; i++) {
		argList.push(argArray.get(i));
	}
	
	return thisVal.call(thisArg, argList);
};

/**
 * call() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.2.4.2
 */
function FunctionProtoCallFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(FunctionProtoCallFunc, FunctionTypeBase);
FunctionProtoCallFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var thisArg = args[0],
		argList = [],
		i = 1,
		len = args.length;
	
	if (!thisArg) {
		thisArg = new UndefinedType();
	}

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	if (!isCallable(thisVal)) {
		handleRecoverableNativeException('TypeError', 'Attempted to call non-callable value');
		return new UnknownType();
	}
	
	for (; i < len; i++) {
		argList.push(args[i]);
	}
	
	return thisVal.call(thisArg, argList);
};

/**
 * bind() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.2.4.2
 */
function FunctionProtoBindFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(FunctionProtoBindFunc, FunctionTypeBase);
FunctionProtoBindFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var target = thisVal,
		thisArg = args[0],
		a = args.slice(1),
		f;
	
	if (!thisArg) {
		thisArg = new UndefinedType();
	}
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	if (!isCallable(target)) {
		handleRecoverableNativeException('TypeError', 'Attempted to call non-callable value');
		return new UnknownType();
	}
	
	// Create the new function
	f = new FunctionType();
	f.targetFunction = target;
	f.boundThis = thisArg;
	f.boundArgs = a;
	f.extensible = true;
	
	// Set the call method
	f.call = function call(thisVal, extraArgs) {
		return target.call(thisArg, a.concat(extraArgs));
	};
	
	// Set the construct method
	f.construct = function construct(extraArgs) {
		if (!target.construct) {
			handleRecoverableNativeException('TypeError', 'Bind target does not have a constructor');
			return new UnknownType();
		}
		return target.construct(a.concat(extraArgs));
	};
	
	// Set the hasInstance method
	f.hasInstance = function hasInstance(v) {
		if (!target.hasInstance) {
			handleRecoverableNativeException('TypeError', 'Bind target does not have a hasInstance method');
			return new UnknownType();
		}
		return target.hasInstance(v);
	};
	
	// Set the length property
	f.put('length', new NumberType(target.className === 'Function' ?
		Math.max(0, target.get('length').value - a.length) : 0), false, true);
	
	// Set caller and arguments to thrower
	f.defineOwnProperty('caller', {
		get: throwTypeError,
		set: throwTypeError,
		enumerable: false,
		configurable: false
	}, false, true);
	f.defineOwnProperty('arguments', {
		get: throwTypeError,
		set: throwTypeError,
		enumerable: false,
		configurable: false
	}, false, true);
	
	return f;
};

/**
 * @classdesc The prototype for Functions
 *
 * @constructor
 * @see ECMA-262 Spec Chapter 15.3.4
 */
exports.FunctionPrototypeType = FunctionPrototypeType;
function FunctionPrototypeType(className) {
	
	// Warning: setting the third argument to anything falsey, or leaving it off, results in infinite recursion
	FunctionTypeBase.call(this, 0, className || 'Function');
	
	// Object prototype methods
	addNonEnumerableProperty(this, 'toLocaleString', new ObjectProtoToLocaleStringFunc(), false, true);
	addNonEnumerableProperty(this, 'valueOf', new ObjectProtoValueOfFunc(), false, true);
	addNonEnumerableProperty(this, 'hasOwnProperty', new ObjectProtoHasOwnPropertyFunc(), false, true);
	addNonEnumerableProperty(this, 'isPrototypeOf', new ObjectProtoIsPrototypeOfFunc(), false, true);
	addNonEnumerableProperty(this, 'propertyIsEnumerable', new ObjectProtoPropertyIsEnumerableFunc(), false, true);
	
	// Function prototype methods
	addNonEnumerableProperty(this, 'toString', new FunctionProtoToStringFunc(), false, true);
	addNonEnumerableProperty(this, 'apply', new FunctionProtoApplyFunc(), false, true);
	addNonEnumerableProperty(this, 'call', new FunctionProtoCallFunc(), false, true);
	addNonEnumerableProperty(this, 'bind', new FunctionProtoBindFunc(), false, true);
}
util.inherits(FunctionPrototypeType, FunctionTypeBase);

/**
 * @classdesc The call method of function prototoypes
 *
 * @method
 * @see ECMA-262 Spec Chapter 15.3.4
 */
FunctionPrototypeType.prototype.call = function call() {
	return new UndefinedType();
};