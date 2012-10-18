/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * This module defines and injects the built-in global objects into the global namespace.
 * 
 * @module Global
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */
 
var util = require('util'),

	Base = require('./Base'),
	Runtime = require('./Runtime'),
	RuleProcessor = require('./RuleProcessor'),
	AST = require('./AST'),
	
	areAnyUnknown = Base.areAnyUnknown;

/*****************************************
 *
 * Non-spec helpers
 *
 *****************************************/

/**
 * Injects
 */
exports.injectGlobals = injectGlobals;
function injectGlobals() {
	
	var globalObject = Runtime.getGlobalObject();
	
	function addObject(name, value) {
		globalObject.defineOwnProperty(name, {
			value: value,
			writable: false,
			enumerable: true,
			configurable: true
		}, false, true);
	}
	
	function addProperty(name, value) {
		globalObject.defineOwnProperty(name, { value: value }, false, true);
	};
	
	// Properties
	addProperty('NaN', new Base.NumberType(NaN));
	addProperty('Infinity', new Base.NumberType(Infinity));
	
	// Methods
	addObject('eval', new EvalFunction());
	addObject('parseInt', new ParseIntFunction());
	addObject('parseFloat', new ParseFloatFunction());
	addObject('isNaN', new IsNaNFunction());
	addObject('isFinite', new IsFiniteFunction());
	addObject('decodeURI', new DecodeURIFunction());
	addObject('decodeURIComponent', new DecodeURIComponentFunction());
	addObject('encodeURI', new EncodeURIFunction());
	addObject('encodeURIComponent', new EncodeURIComponentFunction());
	addObject('Object', new ObjectConstructor());
	addObject('Function', new FunctionConstructor());
	addObject('Array', new ArrayConstructor());
	addObject('String', new StringConstructor());
	addObject('Boolean', new BooleanConstructor());
	addObject('Number', new NumberConstructor());
	addObject('Date', new DateConstructor());
	addObject('RegExp', new RegExpConstructor());
	addObject('Error', new Base.ErrorConstructor('Error'));
	addObject('EvalError', new Base.ErrorConstructor('EvalError'));
	addObject('RangeError', new Base.ErrorConstructor('RangeError'));
	addObject('ReferenceError', new Base.ErrorConstructor('ReferenceError'));
	addObject('SyntaxError', new Base.ErrorConstructor('SyntaxError'));
	addObject('TypeError', new Base.ErrorConstructor('TypeError'));
	addObject('URIError', new Base.ErrorConstructor('URIError'));
	addObject('Math', new MathObject());
	addObject('JSON', new JSONObject());
}

/*****************************************
 *
 * Chapter 15 - Global Functions
 *
 *****************************************/

/**
 * eval method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.1.2.1
 */
function EvalFunction(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(EvalFunction, Base.FunctionTypeBase);
EvalFunction.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var x = args[0],
		prog,
		evalCtx,
		result,
		exception;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	// Step 1
	if (Base.type(x) !== 'String') {
		return x;
	}
	
	// Step 2
	if (!(prog = AST.parseString(x.value))) {
		Base.throwNativeException('SyntaxError');
	} 
	
	// Step 3
	evalCtx = Base.createEvalContext(Runtime.getCurrentContext(), prog, RuleProcessor.isBlockStrict(prog));
	Runtime.enterContext(evalCtx);
	
	// Step 4
	result = RuleProcessor.processRule(prog);
	
	// Step 5
	Runtime.exitContext();
	
	// Step 6
	if (result[0] === 'normal') {
		return result[1] ? result[1] : new Base.UndefinedType();
	} else {
		if (result[1]) {
			if (result[1].className.match('Error$')) {
				Base.throwNativeException(result[1].get('name'), result[1].get('message'));
			} else {
				Base.throwNativeException('Error', Base.toString(result[1]).value);
			}
		} else {
			Base.throwNativeException('Error');
		}
	}
};

/**
 * parseInt method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.1.2.2
 */
function ParseIntFunction(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(2), false, true);
}
util.inherits(ParseIntFunction, Base.FunctionTypeBase);
ParseIntFunction.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var string,
		radix,
		s,
		r;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	// Steps 1, 2, and 6
	string = args[0];
	radix = args[1];
	s = Base.toString(string).value.trim();
	r = radix && Base.type(radix) !== 'Undefined' ? Base.toInt32(radix).value : 10;
		
	// Use the built-in method to perform the parseInt
	return new Base.NumberType(parseInt(s, r));
};

/**
 * parseFloat method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.1.2.3
 */
function ParseFloatFunction(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(ParseFloatFunction, Base.FunctionTypeBase);
ParseFloatFunction.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var string,
		s;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	// Steps 1 and 2
	string = args[0];
	s = Base.toString(string).value.trim();
		
	// Use the built-in method to perform the parseFloat
	return new Base.NumberType(parseFloat(s));
};

/**
 * isNaN method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.1.2.4
 */
function IsNaNFunction(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(IsNaNFunction, Base.FunctionTypeBase);
IsNaNFunction.prototype.call = function call(thisVal, args) {
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	// Use the built-in method to perform the isNaN
	return new Base.BooleanType(isNaN(Base.toNumber(args[0]).value));
};

/**
 * isFinite method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.1.2.5
 */
function IsFiniteFunction(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(IsFiniteFunction, Base.FunctionTypeBase);
IsFiniteFunction.prototype.call = function call(thisVal, args) {
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	// Use the built-in method to perform the isFinite
	return new Base.BooleanType(isFinite(Base.toNumber(args[0]).value));
};

/**
 * decodeURI method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.1.3.1
 */
function DecodeURIFunction(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(DecodeURIFunction, Base.FunctionTypeBase);
DecodeURIFunction.prototype.call = function call(thisVal, args) {
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	// Use the built-in method to perform the decodeURI
	return new Base.StringType(decodeURI(Base.toString(args[0]).value));
};

/**
 * decodeURIComponent method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.1.3.2
 */
function DecodeURIComponentFunction(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(DecodeURIComponentFunction, Base.FunctionTypeBase);
DecodeURIComponentFunction.prototype.call = function call(thisVal, args) {
	
	// Use the built-in method to perform the decodeURI
	return new Base.StringType(decodeURIComponent(Base.toString(args[0]).value));
};

/**
 * encodeURI method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.1.3.3
 */
function EncodeURIFunction(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(EncodeURIFunction, Base.FunctionTypeBase);
EncodeURIFunction.prototype.call = function call(thisVal, args) {
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	// Use the built-in method to perform the decodeURI
	return new Base.StringType(encodeURI(Base.toString(args[0]).value));
};

/**
 * encodeURIComponent method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.1.3.4
 */
function EncodeURIComponentFunction(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(EncodeURIComponentFunction, Base.FunctionTypeBase);
EncodeURIComponentFunction.prototype.call = function call(thisVal, args) {
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	// Use the built-in method to perform the decodeURI
	return new Base.StringType(encodeURIComponent(Base.toString(args[0]).value));
};

/*****************************************
 *
 * Chapter 15 - Global Constructors
 *
 *****************************************/

// ******** Object Constructor ********

/**
 * getPrototypeOf() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectGetPrototypeOfFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(ObjectGetPrototypeOfFunc, Base.FunctionTypeBase);
ObjectGetPrototypeOfFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	if (Base.type(o) !== 'Object') {
		Base.throwNativeException('TypeError', 'Value is not an object');
	}
	return o.objectPrototype ? o.objectPrototype : new Base.UndefinedType();
};

/**
 * getOwnPropertyDescriptor() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectGetOwnPropertyDescriptorFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(2), false, true);
}
util.inherits(ObjectGetOwnPropertyDescriptorFunc, Base.FunctionTypeBase);
ObjectGetOwnPropertyDescriptorFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o = args[0],
		p = args[1],
		name;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	// Step 1
	if (Base.type(o) !== 'Object') {
		Base.throwNativeException('TypeError', 'Value is not an object');
	}
	
	// Step 2
	name = Base.toString(p).value;
	
	// Steps 3 and 4
	return Base.fromPropertyDescriptor(o.getOwnProperty(name));
};

/**
 * getOwnPropertyNames() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectGetOwnPropertyNamesFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(ObjectGetOwnPropertyNamesFunc, Base.FunctionTypeBase);
ObjectGetOwnPropertyNamesFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o = args[0],
		array,
		n = 0,
		name;

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}

	// Step 1
	if (Base.type(o) !== 'Object') {
		Base.throwNativeException('TypeError', 'Value is not an object');
	}
	
	// Step 2
	array = new Base.ArrayType();
	
	// Step 4
	for (name in o._properties) {
		array.defineOwnProperty(n, {
			value: name,
			writable: true,
			enumerable: true,
			configurable: true
		}, false, true);
		n++;
	}
	
	// Step 5
	return array;
};

/**
 * create() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectCreateFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
}
util.inherits(ObjectCreateFunc, Base.FunctionTypeBase);
ObjectCreateFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o = args[0],
		properties = args[1],
		obj;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	// Step 1
	if (Base.type(o) !== 'Object') {
		Base.throwNativeException('TypeError', 'Value is not an object');
	}
	
	// Step 2
	obj = new Base.ObjectType();
	
	// Step 3
	obj.objectPrototype = o;
	
	// Step 4
	if (properties && Base.type(properties) !== 'Undefined') {
		ObjectDefinePropertiesFunc.prototype.call(thisVal, [obj, properties]);
	}
	
	// Step 5
	return obj;
};

/**
 * defineProperties() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectDefinePropertyFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
}
util.inherits(ObjectDefinePropertyFunc, Base.FunctionTypeBase);
ObjectDefinePropertyFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o = args[0],
		p = args[1],
		attributes = args[2],
		name,
		desc;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}

	// Step 1
	if (Base.type(o) !== 'Object') {
		Base.throwNativeException('TypeError', 'Value is not an object');
	}
	
	// Step 2
	name = Base.toString(p).value;
	
	// Step 3
	desc = Base.toPropertyDescriptor(attributes);
	
	// Step 4
	o.defineOwnProperty(name, desc, true);
	
	// Step 5
	return o;
};

/**
 * defineProperties() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectDefinePropertiesFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
}
util.inherits(ObjectDefinePropertiesFunc, Base.FunctionTypeBase);
ObjectDefinePropertiesFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o,
		properties,
		props,
		names,
		i,
		len,
		p;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	o = args[0];
	properties = args[1];
	props = Base.toObject(properties);
	names = Object.keys(props._properties);
	i = 0;
	len = names.length;
	
	// Step 1
	if (Base.type(o) !== 'Object') {
		Base.throwNativeException('TypeError', 'Value is not an object');
	}
	
	// Steps 5 and 6
	for(; i < len; i++) {
		p = names[i];
		o.defineOwnProperty(p, Base.toPropertyDescriptor(props.get(p)), true);
	}
	
	// Step 7
	return o;
};

/**
 * seal() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectSealFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
}
util.inherits(ObjectSealFunc, Base.FunctionTypeBase);
ObjectSealFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o = args[0],
		p,
		desc;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}

	// Step 1
	if (Base.type(o) !== 'Object') {
		Base.throwNativeException('TypeError', 'Value is not an object');
	}
	
	// Step 2
	for(p in o._properties) {
		desc = o.getOwnProperty(p);
		desc.configurable = false;
		o.defineOwnProperty(p, desc, true);
	}
	
	// Step 3
	o.extensible = false;
	
	// Step 4
	return o;
};

/**
 * freeze() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectFreezeFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
}
util.inherits(ObjectFreezeFunc, Base.FunctionTypeBase);
ObjectFreezeFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o = args[0],
		p,
		desc;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}

	// Step 1
	if (Base.type(o) !== 'Object') {
		Base.throwNativeException('TypeError', 'Value is not an object');
	}
	
	// Step 2
	for(p in o._properties) {
		desc = o.getOwnProperty(p);
		if (Base.isDataDescriptor(desc)) {
			desc.writable = false;
		}
		desc.configurable = false;
		o.defineOwnProperty(p, desc, true);
	}
	
	// Step 3
	o.extensible = false;
	
	// Step 4
	return o;
};

/**
 * preventExtensions() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectPreventExtensionsFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
}
util.inherits(ObjectPreventExtensionsFunc, Base.FunctionTypeBase);
ObjectPreventExtensionsFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}

	// Step 1
	if (Base.type(o) !== 'Object') {
		Base.throwNativeException('TypeError', 'Value is not an object');
	}
	
	// Step 2
	o.extensible = false;
	
	// Step 3
	return o;
};

/**
 * isSealed() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectIsSealedFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
}
util.inherits(ObjectIsSealedFunc, Base.FunctionTypeBase);
ObjectIsSealedFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o = args[0],
		p;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}

	// Step 1
	if (Base.type(o) !== 'Object') {
		Base.throwNativeException('TypeError', 'Value is not an object');
	}
	
	// Step 2
	for(p in o._properties) {
		if (o.getOwnProperty(p).configurable) {
			return new Base.BooleanType(false);
		}
	}
	
	// Step 3
	return new Base.BooleanType(!o.extensible);
};

/**
 * isFrozen() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectIsFrozenFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
}
util.inherits(ObjectIsFrozenFunc, Base.FunctionTypeBase);
ObjectIsFrozenFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o = args[0],
		desc,
		p;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}

	// Step 1
	if (Base.type(o) !== 'Object') {
		Base.throwNativeException('TypeError', 'Value is not an object');
	}
	
	// Step 2
	for(p in o._properties) {
		desc = o.getOwnProperty(p);
		if ((Base.isDataDescriptor(desc) && desc.writable) || desc.configurable) {
			return new Base.BooleanType(false);
		}
	}
	
	// Step 3
	return new Base.BooleanType(!o.extensible);
};

/**
 * isExtensible() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectIsExtensibleFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
}
util.inherits(ObjectIsExtensibleFunc, Base.FunctionTypeBase);
ObjectIsExtensibleFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}

	// Step 1
	if (Base.type(o) !== 'Object') {
		Base.throwNativeException('TypeError', 'Value is not an object');
	}
	
	// Step 2
	return new Base.BooleanType(o.extensible);
};

/**
 * keys() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectKeysFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
}
util.inherits(ObjectKeysFunc, Base.FunctionTypeBase);
ObjectKeysFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o = args[0],
		array,
		index = 0,
		p;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}

	// Step 1
	if (Base.type(o) !== 'Object') {
		Base.throwNativeException('TypeError', 'Value is not an object');
	}
	
	// Step 3
	array = new Base.ArrayType();
	
	// Step 5
	for(p in o._properties) {
		if (o._properties[p].enumerable) {
			array.defineOwnProperty(index, {
				value: new Base.StringType(p),
				writable: true,
				enumerable: true,
				configurable: true
			}, false);
			index++;
		}
	}
	
	// Step 6
	return array;
};

/**
 * Object constructor function
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2
 */
function ObjectConstructor(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
	
	this.put('getPrototypeOf', new ObjectGetPrototypeOfFunc(), false, true);
	this.put('getOwnPropertyDescriptor', new ObjectGetOwnPropertyDescriptorFunc(), false, true);
	this.put('getOwnPropertyNames', new ObjectGetOwnPropertyNamesFunc(), false, true);
	this.put('create', new ObjectCreateFunc(), false, true);
	this.put('defineProperty', new ObjectDefinePropertyFunc(), false, true);
	this.put('defineProperties', new ObjectDefinePropertiesFunc(), false, true);
	this.put('seal', new ObjectSealFunc(), false, true);
	this.put('freeze', new ObjectFreezeFunc(), false, true);
	this.put('preventExtensions', new ObjectPreventExtensionsFunc(), false, true);
	this.put('isSealed', new ObjectIsSealedFunc(), false, true);
	this.put('isFrozen', new ObjectIsFrozenFunc(), false, true);
	this.put('isExtensible', new ObjectIsExtensibleFunc(), false, true);
	this.put('keys', new ObjectKeysFunc(), false, true);
}
util.inherits(ObjectConstructor, Base.FunctionTypeBase);
ObjectConstructor.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var value = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	// Step 1
	if (!value || Base.isType(value, ['Null', 'Undefined'])) {
		return new Base.ObjectType();
	}
	
	// Step 2
	return Base.toObject(value);
};
ObjectConstructor.prototype.construct = function call(args) {
	
	// Variable declarations
	var value = args[0];
	
	// Validate the parameters
	if (areAnyUnknown(args)) {
		return new Base.UnknownType();
	}
	
	// Step 1
	if (value && !Base.isType(value, ['Undefined', 'Null'])) {
		if (Base.type(value) === 'Object') {
			return value;
		} else {
			return Base.toObject(value);
		}
	}
	
	// Steps 3-8
	return new Base.ObjectType();
};

// ******** Function Constructor ********

/**
 * Function constructor function
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.3
 */
function FunctionConstructor(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
}
util.inherits(FunctionConstructor, Base.FunctionTypeBase);
FunctionConstructor.prototype.call = function call(thisVal, args) {
	return FunctionConstructor.prototype.construct.call(this, args);
};
FunctionConstructor.prototype.construct = function call(args) {
	
	// Variable declarations
	var argCount = args.length,
		p = '',
		body,
		k = 1;
	
	// Validate the parameters
	if (areAnyUnknown(args)) {
		return new Base.UnknownType();
	}
	
	// Step 3
	if (argCount === 0) {
		body = new Base.StringType();

	// Step 4
	} else if (argCount === 1) {
		body = args[0];
		
	// Step 5
	} else if (argCount > 1) {
		p = Base.toString(args[0]).value;
		while (k < argCount - 1) {
			p += ',' + Base.toString(args[k]).value;
			k++;
		}
		body = args[k];
	}
	
	// Step 6
	body = Base.toString(body).value;
	
	// Step 7
	p = AST.parseString('function temp(' + p + '){}');
	if (!p) {
		Base.throwNativeException('SyntaxError');
	}
	p = p[1][0][2];
	
	// Step 8
	body = AST.parseString('function temp(){' + body + '}');
	if (!body) {
		Base.throwNativeException('SyntaxError');
	}
	body = body[1][0][3];
	
	// Step 10
	return new Base.FunctionType(p, body, Runtime.getModuleContext().lexicalEnvironment, RuleProcessor.isBlockStrict(body));
};

// ******** Array Constructor ********

/**
 * isArray() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.4.3.2
 */
function ArrayIsArrayFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(ArrayIsArrayFunc, Base.FunctionTypeBase);
ArrayIsArrayFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var arg = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	// Steps 1 and 2
	return new Base.BooleanType(Base.type(arg) === 'Object' && arg.className === 'Array');
};

/**
 * Array constructor function
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.4
 */
function ArrayConstructor(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
	
	this.put('isArray', new ArrayIsArrayFunc(), false, true);
}
util.inherits(ArrayConstructor, Base.FunctionTypeBase);
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
		return new Base.UnknownType();
	}
	
	array = new Base.ArrayType();
	if (args.length === 1) {
		len = args[0];
		if (Base.type(len) === 'Number') {
			if (len.value === Base.toUint32(len).value) {
				array.put('length', Base.toUint32(len), true);
			} else {
				Base.throwNativeException('RangeError', 'Invalid length ' + len.value);
			}
		} else {
			array.put('length', new Base.NumberType(1), true);
			array.put('0', len, true);
		}
	} else if (args.length > 1){
		len = args.length;
		array.put('length', new Base.NumberType(len), true);
		for(; i < len; i++) {
			array.put(i, args[i], true);
		}
	}
	
	return array;
};

// ******** String Constructor ********

/**
 * isArray() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.3.2
 */
function StringFromCharCodeFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(StringFromCharCodeFunc, Base.FunctionTypeBase);
StringFromCharCodeFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var i = 0,
		len = args.length;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	// Convert the array to something we can apply()
	for(; i < len; i++) {
		args[i] = Base.toUint16(args[i]).value;
	}
	
	// Use the built-in match method to perform the match
	return new Base.StringType(String.fromCharCode.apply(this, args));
};

/**
 * String constructor function
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5
 */
function StringConstructor(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
	
	this.put('fromCharCode', new StringFromCharCodeFunc(), false, true);
}
util.inherits(StringConstructor, Base.FunctionTypeBase);
StringConstructor.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var value = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	if (!value) {
		return new Base.StringType();
	}
	return Base.toString(value);
};
StringConstructor.prototype.construct = function call(args) {
	
	// Variable declarations
	var value = args[0],
		obj;
	
	// Validate the parameters
	if (areAnyUnknown(args)) {
		return new Base.UnknownType();
	}
	
	obj = new Base.ObjectType();
	obj.className = 'String';
	obj.primitiveValue = value ? Base.toString(value).value : '';
	obj.objectPrototype = new Base.StringPrototypeType();
	
	return obj;
};

// ******** Boolean Constructor ********

/**
 * Boolean constructor function
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.6
 */
function BooleanConstructor(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
}
util.inherits(BooleanConstructor, Base.FunctionTypeBase);
BooleanConstructor.prototype.call = function call(thisVal, args) {
	return Base.toBoolean(args[0]);
};
BooleanConstructor.prototype.construct = function call(args) {
	
	// Variable declarations
	var value = args[0],
		obj;
	
	// Validate the parameters
	if (areAnyUnknown(args)) {
		return new Base.UnknownType();
	}
	
	obj = new Base.ObjectType();
	obj.className = 'Boolean';
	obj.primitiveValue = value ? Base.toBoolean(value).value : '';
	obj.objectPrototype = new Base.BooleanPrototypeType();
		
	return obj;
	
};

// ******** Number Constructor ********

/**
 * Number constructor function
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.7
 */
function NumberConstructor(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);

	this.put('MAX_VALUE', new Base.NumberType(Number.MAX_VALUE), false, true);
	this.put('MIN_VALUE', new Base.NumberType(Number.MIN_VALUE), false, true);
	this.put('NaN', new Base.NumberType(NaN), false, true);
	this.put('NEGATIVE_INFINITY', new Base.NumberType(Number.NEGATIVE_INFINITY), false, true);
	this.put('POSITIVE_INFINITY', new Base.NumberType(Number.POSITIVE_INFINITY), false, true);
}
util.inherits(NumberConstructor, Base.FunctionTypeBase);
NumberConstructor.prototype.call = function call(thisVal, args) {
	return Base.toNumber(args[0]);
};
NumberConstructor.prototype.construct = function call(args) {
	
	// Variable declarations
	var value = args[0],
		obj;
	
	// Validate the parameters
	if (areAnyUnknown(args)) {
		return new Base.UnknownType();
	}
	
	obj = new Base.ObjectType();
	obj.className = 'Number';
	obj.primitiveValue = value ? Base.toNumber(value).value : '';
	obj.objectPrototype = new Base.NumberPrototypeType();
		
	return obj;
};

// ******** RegExp Constructor ********

/**
 * RegExp constructor function
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.10
 */
function RegExpConstructor(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
}
util.inherits(RegExpConstructor, Base.FunctionTypeBase);
RegExpConstructor.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var pattern = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	if (Base.type(pattern) === 'Object' && pattern.className === 'RegExp') {
		return pattern;
	}
	
	return RegExpConstructor.prototype.construct(args);
};
RegExpConstructor.prototype.construct = function call(args) {
	
	// Variable declarations
	var pattern = args[0],
		flags = args[1],
		p,
		f;
	
	// Validate the parameters
	if (areAnyUnknown(args)) {
		return new Base.UnknownType();
	}
	
	// Parse the parameters
	if (Base.type(pattern) === 'Object' && pattern.className === 'RegExp') {
		if (flags && Base.type(flags) !== 'Undefined') {
			Base.throwNativeException('TypeError');
		}
		p = pattern._pattern;
		f = pattern._flags;
	} else {
		p = pattern && Base.type(pattern) !== 'Undefined' ? Base.toString(pattern).value : '';
		f = flags && Base.type(flags) !== 'Undefined' ? Base.toString(flags).value : '';
	}
	
	// Create the regex object
	return new Base.RegExpType(p, f);
};

// ******** Date Prototype Type Class ********

/**
 * toString() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.2
 */
function DateProtoToStringFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoToStringFunc, Base.FunctionTypeBase);
DateProtoToStringFunc.prototype.call = function call(thisVal, args) {
	return new Base.StringType(this._date.toString());
};

/**
 * toDateString() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.3
 */
function DateProtoToDateStringFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoToDateStringFunc, Base.FunctionTypeBase);
DateProtoToDateStringFunc.prototype.call = function call(thisVal, args) {
	return new Base.StringType(this._date.toDateString());
};

/**
 * toTimeString() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.4
 */
function DateProtoToTimeStringFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoToTimeStringFunc, Base.FunctionTypeBase);
DateProtoToTimeStringFunc.prototype.call = function call(thisVal, args) {
	return new Base.StringType(this._date.toTimeString());
};

/**
 * toLocaleString() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.5
 */
function DateProtoToLocaleStringFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoToLocaleStringFunc, Base.FunctionTypeBase);
DateProtoToLocaleStringFunc.prototype.call = function call(thisVal, args) {
	return new Base.StringType(this._date.toLocaleString());
};

/**
 * toLocaleDateString() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.6
 */
function DateProtoToLocaleDateStringFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoToLocaleDateStringFunc, Base.FunctionTypeBase);
DateProtoToLocaleDateStringFunc.prototype.call = function call(thisVal, args) {
	return new Base.StringType(this._date.toLocaleDateString());
};

/**
 * toLocaleTimeString() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.7
 */
function DateProtoToLocaleTimeStringFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoToLocaleTimeStringFunc, Base.FunctionTypeBase);
DateProtoToLocaleTimeStringFunc.prototype.call = function call(thisVal, args) {
	return new Base.StringType(this._date.toLocaleTimeString());
};

/**
 * valueOf() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.8
 */
function DateProtoValueOfFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoValueOfFunc, Base.FunctionTypeBase);
DateProtoValueOfFunc.prototype.call = function call(thisVal, args) {
	return new Base.NumberType(this._date.valueOf());
};

/**
 * getTime() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.9
 */
function DateProtoGetTimeFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetTimeFunc, Base.FunctionTypeBase);
DateProtoGetTimeFunc.prototype.call = function call(thisVal, args) {
	return new Base.NumberType(this._date.getTime());
};

/**
 * getFullYear() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.10
 */
function DateProtoGetFullYearFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetFullYearFunc, Base.FunctionTypeBase);
DateProtoGetFullYearFunc.prototype.call = function call(thisVal, args) {
	return new Base.NumberType(this._date.getFullYear());
};

/**
 * getUTCFullYear() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.11
 */
function DateProtoGetUTCFullYearFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetUTCFullYearFunc, Base.FunctionTypeBase);
DateProtoGetUTCFullYearFunc.prototype.call = function call(thisVal, args) {
	return new Base.NumberType(this._date.getUTCFullYear());
};

/**
 * getMonth() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.12
 */
function DateProtoGetMonthFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetMonthFunc, Base.FunctionTypeBase);
DateProtoGetMonthFunc.prototype.call = function call(thisVal, args) {
	return new Base.NumberType(this._date.getMonth());
};

/**
 * getUTCMonth() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.13
 */
function DateProtoGetUTCMonthFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetUTCMonthFunc, Base.FunctionTypeBase);
DateProtoGetUTCMonthFunc.prototype.call = function call(thisVal, args) {
	return new Base.NumberType(this._date.getUTCMonth());
};

/**
 * getDate() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.14
 */
function DateProtoGetDateFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetDateFunc, Base.FunctionTypeBase);
DateProtoGetDateFunc.prototype.call = function call(thisVal, args) {
	return new Base.NumberType(this._date.getDate());
};

/**
 * getUTCDate() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.15
 */
function DateProtoGetUTCDateFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetUTCDateFunc, Base.FunctionTypeBase);
DateProtoGetUTCDateFunc.prototype.call = function call(thisVal, args) {
	return new Base.NumberType(this._date.getUTCDate());
};

/**
 * getDay() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.16
 */
function DateProtoGetDayFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetDayFunc, Base.FunctionTypeBase);
DateProtoGetDayFunc.prototype.call = function call(thisVal, args) {
	return new Base.NumberType(this._date.getDay());
};

/**
 * getUTCDay() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.17
 */
function DateProtoGetUTCDayFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetUTCDayFunc, Base.FunctionTypeBase);
DateProtoGetUTCDayFunc.prototype.call = function call(thisVal, args) {
	return new Base.NumberType(this._date.getUTCDay());
};

/**
 * getHours() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.18
 */
function DateProtoGetHoursFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetHoursFunc, Base.FunctionTypeBase);
DateProtoGetHoursFunc.prototype.call = function call(thisVal, args) {
	return new Base.NumberType(this._date.getHours());
};

/**
 * getUTCHours() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.19
 */
function DateProtoGetUTCHoursFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetUTCHoursFunc, Base.FunctionTypeBase);
DateProtoGetUTCHoursFunc.prototype.call = function call(thisVal, args) {
	return new Base.NumberType(this._date.getUTCHours());
};

/**
 * getMinutes() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.20
 */
function DateProtoGetMinutesFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetMinutesFunc, Base.FunctionTypeBase);
DateProtoGetMinutesFunc.prototype.call = function call(thisVal, args) {
	return new Base.NumberType(this._date.getMinutes());
};

/**
 * getUTCMinutes() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.21
 */
function DateProtoGetUTCMinutesFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetUTCMinutesFunc, Base.FunctionTypeBase);
DateProtoGetUTCMinutesFunc.prototype.call = function call(thisVal, args) {
	return new Base.NumberType(this._date.getUTCMinutes());
};

/**
 * getSeconds() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.22
 */
function DateProtoGetSecondsFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetSecondsFunc, Base.FunctionTypeBase);
DateProtoGetSecondsFunc.prototype.call = function call(thisVal, args) {
	return new Base.NumberType(this._date.getSeconds());
};

/**
 * getUTCSeconds() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.23
 */
function DateProtoGetUTCSecondsFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetUTCSecondsFunc, Base.FunctionTypeBase);
DateProtoGetUTCSecondsFunc.prototype.call = function call(thisVal, args) {
	return new Base.NumberType(this._date.getUTCSeconds());
};

/**
 * getMilliseconds() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.24
 */
function DateProtoGetMillisecondsFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetMillisecondsFunc, Base.FunctionTypeBase);
DateProtoGetMillisecondsFunc.prototype.call = function call(thisVal, args) {
	return new Base.NumberType(this._date.getMilliseconds());
};

/**
 * getUTCMilliseconds() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.25
 */
function DateProtoGetUTCMillisecondsFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetUTCMillisecondsFunc, Base.FunctionTypeBase);
DateProtoGetUTCMillisecondsFunc.prototype.call = function call(thisVal, args) {
	return new Base.NumberType(this._date.getUTCMilliseconds());
};

/**
 * getTimezoneOffset() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.26
 */
function DateProtoGetTimezoneOffsetFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetTimezoneOffsetFunc, Base.FunctionTypeBase);
DateProtoGetTimezoneOffsetFunc.prototype.call = function call(thisVal, args) {
	return new Base.NumberType(this._date.getTimezoneOffset());
};

/**
 * setTime() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.27
 */
function DateProtoSetTimeFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoSetTimeFunc, Base.FunctionTypeBase);
DateProtoSetTimeFunc.prototype.call = function call(thisVal, args) {
	var time = args[0];
	if (time) {
		time = Base.toNumber(time).value;
	}
	return new Base.NumberType(this._date.setTime(time));
};

/**
 * setMilliseconds() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.28
 */
function DateProtoSetMillisecondsFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoSetMillisecondsFunc, Base.FunctionTypeBase);
DateProtoSetMillisecondsFunc.prototype.call = function call(thisVal, args) {
	var ms = args[0];
	if (ms) {
		ms = Base.toNumber(ms).value;
	}
	return new Base.NumberType(this._date.setMilliseconds(ms));
};

/**
 * setUTCMilliseconds() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.29
 */
function DateProtoSetUTCMillisecondsFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoSetUTCMillisecondsFunc, Base.FunctionTypeBase);
DateProtoSetUTCMillisecondsFunc.prototype.call = function call(thisVal, args) {
	var ms = args[0];
	if (ms) {
		ms = Base.toNumber(ms).value;
	}
	return new Base.NumberType(this._date.setUTCMilliseconds(ms));
};

/**
 * setSeconds() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.30
 */
function DateProtoSetSecondsFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(2), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoSetSecondsFunc, Base.FunctionTypeBase);
DateProtoSetSecondsFunc.prototype.call = function call(thisVal, args) {
	var sec = args[0],
		ms = args[1];
	if (sec) {
		sec = Base.toNumber(sec).value;
	}
	if (ms) {
		ms = Base.toNumber(ms).value;
	}
	return new Base.NumberType(this._date.setSeconds(sec, ms));
};

/**
 * setUTCSeconds() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.31
 */
function DateProtoSetUTCSecondsFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(2), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoSetUTCSecondsFunc, Base.FunctionTypeBase);
DateProtoSetUTCSecondsFunc.prototype.call = function call(thisVal, args) {
	var sec = args[0],
		ms = args[1];
	if (sec) {
		sec = Base.toNumber(sec).value;
	}
	if (ms) {
		ms = Base.toNumber(ms).value;
	}
	return new Base.NumberType(this._date.setUTCSeconds(sec, ms));
};

/**
 * setMinutes() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.32
 */
function DateProtoSetMinutesFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(3), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoSetMinutesFunc, Base.FunctionTypeBase);
DateProtoSetMinutesFunc.prototype.call = function call(thisVal, args) {
	var min = args[0],
		sec = args[1],
		ms = args[2];
	if (min) {
		min = Base.toNumber(min).value;
	}
	if (sec) {
		sec = Base.toNumber(sec).value;
	}
	if (ms) {
		ms = Base.toNumber(ms).value;
	}
	return new Base.NumberType(this._date.setMinutes(min, sec, ms));
};

/**
 * setUTCMinutes() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.33
 */
function DateProtoSetUTCMinutesFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(3), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoSetUTCMinutesFunc, Base.FunctionTypeBase);
DateProtoSetUTCMinutesFunc.prototype.call = function call(thisVal, args) {
	var min = args[0],
		sec = args[1],
		ms = args[2];
	if (min) {
		min = Base.toNumber(min).value;
	}
	if (sec) {
		sec = Base.toNumber(sec).value;
	}
	if (ms) {
		ms = Base.toNumber(ms).value;
	}
	return new Base.NumberType(this._date.setUTCMinutes(min, sec, ms));
};

/**
 * setHours() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.34
 */
function DateProtoSetHoursFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(4), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoSetHoursFunc, Base.FunctionTypeBase);
DateProtoSetHoursFunc.prototype.call = function call(thisVal, args) {
	var hour = args[0],
		min = args[1],
		sec = args[2],
		ms = args[3];
	if (hour) {
		hour = Base.toNumber(hour).value;
	}
	if (min) {
		min = Base.toNumber(min).value;
	}
	if (sec) {
		sec = Base.toNumber(sec).value;
	}
	if (ms) {
		ms = Base.toNumber(ms).value;
	}
	return new Base.NumberType(this._date.setHours(hour, min, sec, ms));
};

/**
 * setUTCHours() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.35
 */
function DateProtoSetUTCHoursFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(4), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoSetUTCHoursFunc, Base.FunctionTypeBase);
DateProtoSetUTCHoursFunc.prototype.call = function call(thisVal, args) {
	var hour = args[0],
		min = args[1],
		sec = args[2],
		ms = args[3];
	if (hour) {
		hour = Base.toNumber(hour).value;
	}
	if (min) {
		min = Base.toNumber(min).value;
	}
	if (sec) {
		sec = Base.toNumber(sec).value;
	}
	if (ms) {
		ms = Base.toNumber(ms).value;
	}
	return new Base.NumberType(this._date.setUTCHours(hour, min, sec, ms));
};

/**
 * setDate() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.36
 */
function DateProtoSetDateFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoSetDateFunc, Base.FunctionTypeBase);
DateProtoSetDateFunc.prototype.call = function call(thisVal, args) {
	var date = args[0];
	if (date) {
		date = Base.toNumber(dt).value;
	}
	return new Base.NumberType(this._date.setDate(date));
};

/**
 * setUTCDate() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.37
 */
function DateProtoSetUTCDateFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoSetUTCDateFunc, Base.FunctionTypeBase);
DateProtoSetUTCDateFunc.prototype.call = function call(thisVal, args) {
	var date = args[0];
	if (date) {
		date = Base.toNumber(dt).value;
	}
	return new Base.NumberType(this._date.setUTCDate(date));
};

/**
 * setMonth() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.38
 */
function DateProtoSetMonthFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(2), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoSetMonthFunc, Base.FunctionTypeBase);
DateProtoSetMonthFunc.prototype.call = function call(thisVal, args) {
	var month = args[0],
		date = args[1];
	if (month) {
		month = Base.toNumber(month).value;
	}
	if (date) {
		date = Base.toNumber(date).value;
	}
	return new Base.NumberType(this._date.setMonth(month, date));
};

/**
 * setUTCMonth() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.39
 */
function DateProtoSetUTCMonthFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(2), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoSetUTCMonthFunc, Base.FunctionTypeBase);
DateProtoSetUTCMonthFunc.prototype.call = function call(thisVal, args) {
	var month = args[0],
		date = args[1];
	if (month) {
		month = Base.toNumber(month).value;
	}
	if (date) {
		date = Base.toNumber(date).value;
	}
	return new Base.NumberType(this._date.setUTCMonth(month, date));
};

/**
 * setFullYear() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.40
 */
function DateProtoSetFullYearFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(3), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoSetFullYearFunc, Base.FunctionTypeBase);
DateProtoSetFullYearFunc.prototype.call = function call(thisVal, args) {
	var year = args[0]
		month = args[1],
		date = args[2];
	if (year) {
		year = Base.toNumber(year).value;
	}
	if (month) {
		month = Base.toNumber(month).value;
	}
	if (date) {
		date = Base.toNumber(date).value;
	}
	return new Base.NumberType(this._date.setFullYear(year, month, date));
};

/**
 * setUTCFullYear() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.41
 */
function DateProtoSetUTCFullYearFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(3), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoSetUTCFullYearFunc, Base.FunctionTypeBase);
DateProtoSetUTCFullYearFunc.prototype.call = function call(thisVal, args) {
	var year = args[0]
		month = args[1],
		date = args[2];
	if (year) {
		year = Base.toNumber(year).value;
	}
	if (month) {
		month = Base.toNumber(month).value;
	}
	if (date) {
		date = Base.toNumber(date).value;
	}
	return new Base.StringType(this._date.setUTCFullYear(year, month, date));
};

/**
 * toUTCString() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.42
 */
function DateProtoToUTCStringFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoToUTCStringFunc, Base.FunctionTypeBase);
DateProtoToUTCStringFunc.prototype.call = function call(thisVal, args) {
	return new Base.StringType(this._date.toUTCString());
};

/**
 * toISOString() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.43
 */
function DateProtoToISOStringFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoToISOStringFunc, Base.FunctionTypeBase);
DateProtoToISOStringFunc.prototype.call = function call(thisVal, args) {
	return new Base.StringType(this._date.toISOString());
};

/**
 * toJSON() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.44
 */
function DateProtoToJSONFunc(internalDateObj, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoToJSONFunc, Base.FunctionTypeBase);
DateProtoToJSONFunc.prototype.call = function call(thisVal, args) {
	return new Base.StringType(this._date.toJSON());
};

/**
 * @classdesc The prototype for Errors
 * 
 * @constructor
 * @see ECMA-262 Spec Chapter 15.9.5
 */
exports.DatePrototypeType = DatePrototypeType;
function DatePrototypeType(internalDateObj, className) {
	Base.ObjectType.call(this, className);
	
	this.put('constructor', new DateConstructor(internalDateObj), false, true);
	this.put('toString', new DateProtoToStringFunc(internalDateObj), false, true);
	this.put('toDateString', new DateProtoToDateStringFunc(internalDateObj), false, true);
	this.put('toTimeString', new DateProtoToTimeStringFunc(internalDateObj), false, true);
	this.put('toLocaleString', new DateProtoToLocaleStringFunc(internalDateObj), false, true);
	this.put('toLocaleDateString', new DateProtoToLocaleDateStringFunc(internalDateObj), false, true);
	this.put('toLocaleTimeString', new DateProtoToLocaleTimeStringFunc(internalDateObj), false, true);
	this.put('valueOf', new DateProtoValueOfFunc(internalDateObj), false, true);
	this.put('getTime', new DateProtoGetTimeFunc(internalDateObj), false, true);
	this.put('getFullYear', new DateProtoGetFullYearFunc(internalDateObj), false, true);
	this.put('getUTCFullYear', new DateProtoGetUTCFullYearFunc(internalDateObj), false, true);
	this.put('getMonth', new DateProtoGetMonthFunc(internalDateObj), false, true);
	this.put('getUTCMonth', new DateProtoGetUTCMonthFunc(internalDateObj), false, true);
	this.put('getDate', new DateProtoGetDateFunc(internalDateObj), false, true);
	this.put('getUTCDate', new DateProtoGetUTCDateFunc(internalDateObj), false, true);
	this.put('getDay', new DateProtoGetDayFunc(internalDateObj), false, true);
	this.put('getUTCDay', new DateProtoGetUTCDayFunc(internalDateObj), false, true);
	this.put('getHours', new DateProtoGetHoursFunc(internalDateObj), false, true);
	this.put('getUTCHours', new DateProtoGetUTCHoursFunc(internalDateObj), false, true);
	this.put('getMinutes', new DateProtoGetMinutesFunc(internalDateObj), false, true);
	this.put('getUTCMinutes', new DateProtoGetUTCMinutesFunc(internalDateObj), false, true);
	this.put('getSeconds', new DateProtoGetSecondsFunc(internalDateObj), false, true);
	this.put('getUTCSeconds', new DateProtoGetUTCSecondsFunc(internalDateObj), false, true);
	this.put('getMilliseconds', new DateProtoGetMillisecondsFunc(internalDateObj), false, true);
	this.put('getUTCMilliseconds', new DateProtoGetUTCMillisecondsFunc(internalDateObj), false, true);
	this.put('getTimezoneOffset', new DateProtoGetTimezoneOffsetFunc(internalDateObj), false, true);
	this.put('setTime', new DateProtoSetTimeFunc(internalDateObj), false, true);
	this.put('setMilliseconds', new DateProtoSetMillisecondsFunc(internalDateObj), false, true);
	this.put('setUTCMilliseconds', new DateProtoSetUTCMillisecondsFunc(internalDateObj), false, true);
	this.put('setSeconds', new DateProtoSetSecondsFunc(internalDateObj), false, true);
	this.put('setUTCSeconds', new DateProtoSetUTCSecondsFunc(internalDateObj), false, true);
	this.put('setMinutes', new DateProtoSetMinutesFunc(internalDateObj), false, true);
	this.put('setUTCMinutes', new DateProtoSetUTCMinutesFunc(internalDateObj), false, true);
	this.put('setHours', new DateProtoSetHoursFunc(internalDateObj), false, true);
	this.put('setUTCHours', new DateProtoSetUTCHoursFunc(internalDateObj), false, true);
	this.put('setDate', new DateProtoSetDateFunc(internalDateObj), false, true);
	this.put('setUTCDate', new DateProtoSetUTCDateFunc(internalDateObj), false, true);
	this.put('setMonth', new DateProtoSetMonthFunc(internalDateObj), false, true);
	this.put('setUTCMonth', new DateProtoSetUTCMonthFunc(internalDateObj), false, true);
	this.put('setFullYear', new DateProtoSetFullYearFunc(internalDateObj), false, true);
	this.put('setUTCFullYear', new DateProtoSetUTCFullYearFunc(internalDateObj), false, true);
	this.put('toUTCString', new DateProtoToUTCStringFunc(internalDateObj), false, true);
	this.put('toISOString', new DateProtoToISOStringFunc(internalDateObj), false, true);
	this.put('toJSON', new DateProtoToJSONFunc(internalDateObj), false, true);
}
util.inherits(DatePrototypeType, Base.ObjectType);

// ******** Date Constructor ********

/**
 * parse() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.4.2
 */
function DateParseFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
}
util.inherits(DateParseFunc, Base.FunctionTypeBase);
DateParseFunc.prototype.call = function call(thisVal, args) {
	return new Base.UnknownType();
};

/**
 * UTC() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.4.3
 */
function DateUTCFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
}
util.inherits(DateUTCFunc, Base.FunctionTypeBase);
DateUTCFunc.prototype.call = function call(thisVal, args) {
	return new Base.UnknownType();
};

/**
 * now() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.4.4
 */
function DateNowFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
}
util.inherits(DateNowFunc, Base.FunctionTypeBase);
DateNowFunc.prototype.call = function call(thisVal, args) {
	if (Runtime.options.exactMode) {
		return new Base.NumberType(Date.now());
	} else {
		return new Base.UnknownType();
	}
};

/**
 * Date constructor function
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9
 */
function DateConstructor(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
	
	this.put('parse', new DateParseFunc(), false, true);
	this.put('UTC', new DateUTCFunc(), false, true);
	this.put('now', new DateNowFunc(), false, true);
}
util.inherits(DateConstructor, Base.FunctionTypeBase);
DateConstructor.prototype.call = function call(thisVal, args) {
	if (Runtime.options.exactMode) {
		return new Base.StringType(Date());
	} else {
		return new Base.UnknownType();
	}
};
DateConstructor.prototype.construct = function call(args) {
	var dateObj,
		internalDateObj,
		param,
		convertedArgs,
		i, len;
	if (Runtime.options.exactMode) {
		if (args.length === 0) {
			internalDateObj = new Date();
		} else if (args.length === 1){
			if (Base.type(args[0]) === "String") {
				internalDateObj = new Date(args[0].value);
			} else {
				internalDateObj = new Date(Base.toNumber(args[0]).value);
			}
		} else {
			convertedArgs = [];
			for(i = 0, len = args.length; i < len; i++) {
				convertedArgs[i] = Base.toNumber(args[i]).value
			}
			switch(args.length) {
				case 2: 
					internalDateObj = new Date(
						convertedArgs[0], 
						convertedArgs[1]); 
					break;
				case 3: 
					internalDateObj = new Date(
						convertedArgs[0], 
						convertedArgs[1], 
						convertedArgs[2]); 
					break;
				case 4: 
					internalDateObj = new Date(
						convertedArgs[0], 
						convertedArgs[1], 
						convertedArgs[2], 
						convertedArgs[3]); 
					break;
				case 5: 
					internalDateObj = new Date(
						convertedArgs[0], 
						convertedArgs[1], 
						convertedArgs[2], 
						convertedArgs[3], 
						convertedArgs[4]); 
					break;
				case 6: 
					internalDateObj = new Date(
						convertedArgs[0], 
						convertedArgs[1], 
						convertedArgs[2], 
						convertedArgs[3], 
						convertedArgs[4], 
						convertedArgs[5]); 
					break;
				case 7: 
					internalDateObj = new Date(
						convertedArgs[0], 
						convertedArgs[1], 
						convertedArgs[2], 
						convertedArgs[3], 
						convertedArgs[4], 
						convertedArgs[5], 
						convertedArgs[6]); 
					break;
			}
		}
		dateObj = new Base.ObjectType();
		dateObj.objectPrototype = new DatePrototypeType(internalDateObj);
		return dateObj;
	} else {
		return new Base.UnknownType();
	}
};

/*****************************************
 *
 * Chapter 15 - Global Objects
 *
 *****************************************/

// ******** Math Object ********

/**
 * abs() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.1
 */
function MathAbsFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(MathAbsFunc, Base.FunctionTypeBase);
MathAbsFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var x = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	if (!x) {
		return new Base.NumberType(NaN);
	} else {
		return new Base.NumberType(Math.abs(Base.toNumber(x).value));
	}
};

/**
 * acos() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.2
 */
function MathAcosFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(MathAcosFunc, Base.FunctionTypeBase);
MathAcosFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var x = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	if (!x) {
		return new Base.NumberType(NaN);
	} else {
		return new Base.NumberType(Math.acos(Base.toNumber(x).value));
	}
};

/**
 * asin() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.3
 */
function MathAsinFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(MathAsinFunc, Base.FunctionTypeBase);
MathAsinFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var x = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	return new Base.NumberType(x ? Math.asin(Base.toNumber(x).value) : NaN);
};

/**
 * atan() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.4
 */
function MathAtanFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(MathAtanFunc, Base.FunctionTypeBase);
MathAtanFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var x = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	if (!x) {
		return new Base.NumberType(NaN);
	} else {
		return new Base.NumberType(Math.atan(Base.toNumber(x).value));
	}
};

/**
 * atan2() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.5
 */
function MathAtan2Func(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(2), false, true);
}
util.inherits(MathAtan2Func, Base.FunctionTypeBase);
MathAtan2Func.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var x = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	if (!x) {
		return new Base.NumberType(NaN);
	} else {
		return new Base.NumberType(Math.abs(Base.toNumber(x).value));
	}
};

/**
 * ceil() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.6
 */
function MathCeilFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(MathCeilFunc, Base.FunctionTypeBase);
MathCeilFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var x = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	if (!x) {
		return new Base.NumberType(NaN);
	} else {
		return new Base.NumberType(Math.ceil(Base.toNumber(x).value));
	}
};

/**
 * cos() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.7
 */
function MathCosFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(MathCosFunc, Base.FunctionTypeBase);
MathCosFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var x = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	if (!x) {
		return new Base.NumberType(NaN);
	} else {
		return new Base.NumberType(Math.cos(Base.toNumber(x).value));
	}
};

/**
 * exp() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.8
 */
function MathExpFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(MathExpFunc, Base.FunctionTypeBase);
MathExpFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var x = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	if (!x) {
		return new Base.NumberType(NaN);
	} else {
		return new Base.NumberType(Math.exp(Base.toNumber(x).value));
	}
};

/**
 * floor() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.9
 */
function MathFloorFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(MathFloorFunc, Base.FunctionTypeBase);
MathFloorFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var x = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	if (!x) {
		return new Base.NumberType(NaN);
	} else if (Base.type(x) === 'Unknown') {
		return new Base.UnknownType();
	} else {
		return new Base.NumberType(Math.floor(Base.toNumber(x).value));
	}
};

/**
 * log() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.10
 */
function MathLogFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(MathLogFunc, Base.FunctionTypeBase);
MathLogFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var x = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	if (!x) {
		return new Base.NumberType(NaN);
	} else {
		return new Base.NumberType(Math.log(Base.toNumber(x).value));
	}
};

/**
 * max() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.11
 */
function MathMaxFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(2), false, true);
}
util.inherits(MathMaxFunc, Base.FunctionTypeBase);
MathMaxFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var i = 0,
		len = args.length,
		value,
		values = [];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	for(; i < len; i++) {
		value = Base.toNumber(args[i]);
		if (Base.type(value) === 'Unknown') {
			return new Base.UnknownType();
		}
		values.push(Base.toNumber(value).value);
	}
	return new Base.NumberType(Math.max.apply(this, values));
};

/**
 * min() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.12
 */
function MathMinFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(2), false, true);
}
util.inherits(MathMinFunc, Base.FunctionTypeBase);
MathMinFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var i = 0,
		len = args.length,
		value,
		values = [];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	for(; i < len; i++) {
		value = Base.toNumber(args[i]);
		if (Base.type(value) === 'Unknown') {
			return new Base.UnknownType();
		}
		values.push(Base.toNumber(value).value);
	}
	return new Base.NumberType(Math.min.apply(this, values));
};

/**
 * pow() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.13
 */
function MathPowFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(2), false, true);
}
util.inherits(MathPowFunc, Base.FunctionTypeBase);
MathPowFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var x = args[0],
		y = args[1];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	if (!x || !y) {
		return new Base.NumberType(NaN);
	} else {
		return new Base.NumberType(Math.log(Base.toNumber(x).value), Math.log(Base.toNumber(y).value));
	}
};

/**
 * random() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.14
 */
function MathRandomFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
}
util.inherits(MathRandomFunc, Base.FunctionTypeBase);
MathRandomFunc.prototype.call = function call(thisVal, args) {
	return new Base.UnknownType();
};

/**
 * round() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.15
 */
function MathRoundFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(MathRoundFunc, Base.FunctionTypeBase);
MathRoundFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var x = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	if (!x) {
		return new Base.NumberType(NaN);
	} else {
		return new Base.NumberType(Math.round(Base.toNumber(x).value));
	}
};

/**
 * sin() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.16
 */
function MathSinFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(MathSinFunc, Base.FunctionTypeBase);
MathSinFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var x = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	if (!x) {
		return new Base.NumberType(NaN);
	} else {
		return new Base.NumberType(Math.sin(Base.toNumber(x).value));
	}
};

/**
 * sqrt() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.17
 */
function MathSqrtFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(MathSqrtFunc, Base.FunctionTypeBase);
MathSqrtFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var x = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	if (!x) {
		return new Base.NumberType(NaN);
	} else {
		return new Base.NumberType(Math.sqrt(Base.toNumber(x).value));
	}
};

/**
 * tan() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.17
 */
function MathTanFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(MathTanFunc, Base.FunctionTypeBase);
MathTanFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var x = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	if (!x) {
		return new Base.NumberType(NaN);
	} else {
		return new Base.NumberType(Math.tan(Base.toNumber(x).value));
	}
};

/**
 * Math Object
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.8
 */
function MathObject(className) {
	Base.ObjectType.call(this, className);
	
	var put = function put(name, value) {
		this.defineOwnProperty(name, { value: value }, false, true);
	}.bind(this);
	
	// Properties
	put('E', new Base.NumberType(Math.E));
	put('LN10', new Base.NumberType(Math.LN10));
	put('LN2', new Base.NumberType(Math.LN2));
	put('LOG2E', new Base.NumberType(Math.LOG2E));
	put('LOG10E', new Base.NumberType(Math.LOG10E));
	put('PI', new Base.NumberType(Math.PI));
	put('SQRT1_2', new Base.NumberType(Math.SQRT1_2));
	put('SQRT2', new Base.NumberType(Math.SQRT2));
	
	// Methods
	this.put('abs', new MathAbsFunc(), false, true);
	this.put('acos', new MathAcosFunc(), false, true);
	this.put('asin', new MathAsinFunc(), false, true);
	this.put('atan', new MathAtanFunc(), false, true);
	this.put('atan2', new MathAtan2Func(), false, true);
	this.put('ceil', new MathCeilFunc(), false, true);
	this.put('cos', new MathCosFunc(), false, true);
	this.put('exp', new MathExpFunc(), false, true);
	this.put('floor', new MathFloorFunc(), false, true);
	this.put('log', new MathLogFunc(), false, true);
	this.put('max', new MathMaxFunc(), false, true);
	this.put('min', new MathMinFunc(), false, true);
	this.put('pow', new MathPowFunc(), false, true);
	this.put('random', new MathRandomFunc(), false, true);
	this.put('round', new MathRoundFunc(), false, true);
	this.put('sin', new MathSinFunc(), false, true);
	this.put('sqrt', new MathSqrtFunc(), false, true);
	this.put('tan', new MathTanFunc(), false, true);
}
util.inherits(MathObject, Base.ObjectType);

// ******** JSON Object ********

/**
 * parse() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.12.2
 */
function JSONParseFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
}
util.inherits(JSONParseFunc, Base.FunctionTypeBase);
JSONParseFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var text = args[0],
		reviver = args[1],
		nativeObject;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}

	// Parse the code
	try {
		nativeObject = JSON.parse(Base.toString(text).value);
	} catch(e) {
		Base.throwNativeException('SyntaxError', e.message);
	}
	
	// Convert the result into an object type
	function processObject(native) {
		var converted,
			p,
			child,
			i, len;
		
		function setProperty(k, v, obj) {
			if (reviver) {
				converted.put(k, v, true, true);
				v = reviver.call(obj, [k, v]);
				if (Base.type(v) !== 'Undefined') {
					converted.put(k, v, true);
				} else {
					converted['delete'](k, false);
				}
			} else {
				converted.put(k, v, true, true);
			}
		}
		
		switch(typeof native) {
			case 'undefined':
				return new Base.UndefinedType();
			case 'null':
				return new Base.NullType();
			case 'string':
				return new Base.StringType(native);
			case 'number':
				return new Base.NumberType(native);
			case 'boolean':
				return new Base.BooleanType(native);
			case 'object':
				if (Array.isArray(native)) {
					converted = new Base.ArrayType();
					for(i = 0, len = native.length; i < len; i++) {
						child = processObject(native[i]);
						setProperty(i, child, converted);
					}
				} else {
					converted = new Base.ObjectType();
					for(p in native) {
						setProperty(p, processObject(native[p]), converted);
					}
				}
				return converted;
		}
	}
	return processObject(nativeObject);
};

/**
 * parse() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.12.3
 */
function JSONStringifyFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(0), false, true);
}
util.inherits(JSONStringifyFunc, Base.FunctionTypeBase);
JSONStringifyFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var value = args[0],
		replacer = args[1],
		space = args[2],
		replacerFunction,
		propertyList,
		v,
		i, len,
		gap,
		stack = [],
		indent = '',
		wrapper,
		result;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	function str(key, holder) {
		
		// Step 1
		var value = holder.get(key),
			toJSON;
		
		// Step 2
		if (Base.type(value) === 'Object') {
			toJSON = value.get('toJSON');
			if (Base.type(toJSON) === 'Unknown') {
				throw 'Unknown';
			}
			if (Base.isCallable(toJSON)) {
				value = toJSON.call(value, [key]);
			}
		}
		
		// Step 3
		if (replacerFunction) {
			value = replacerFunction.call(holder, [key, value]);
		}
		
		// Step 4
		if (Base.type(value) == 'Object') {
			if (value.className === 'Number') {
				value = Base.toNumber(value);
			}
			if (value.className === 'String') {
				value = Base.toString(value);
			}
			if (value.className === 'Boolean') {
				value = new Base.BooleanType(value.primitiveValue);
			}
		}
		
		// Steps 5-7
		if (Base.type(value) === 'Null') {
			return 'null';
		} else if (value.value === false) {
			return 'false';
		} else if (value.value === true) {
			return 'true';
		}
		
		// Step 8
		if (Base.type(value) === 'String') {
			return quote(value.value);
		}
		
		// Step 9
		if (Base.type(value) === 'Number') {
			if (isFinite(value.value)) {
				return Base.toString(value).value;
			} else {
				return 'null';
			}
		}
		
		// Step 10
		if (Base.type(value) === 'Unknown') {
			throw 'Unknown';
		}
		if (Base.type(value) === 'Object' && !Base.isCallable(value)) {
			if (value.className === 'Array') {
				return ja(value);
			}
			return jo(value);
		}
		
		return undefined;
	}
	
	function quote(value) {
		return JSON.stringify(value);
	}
	
	function jo(value) {
		
		var stepBack = indent,
			k,
			p,
			i, len,
			partial = [],
			strP,
			member,
			final;
		
		// Step 1
		if (stack.indexOf(value) !== -1) {
			Base.throwNativeException('TypeError');
		}
		
		// Step 2
		stack.push(value);
		
		// Step 4
		indent += gap;
		
		// Steps 5 and 6
		if (propertyList) {
			k = propertyList;
		} else {
			k = [];
			for(p in value._properties) {
				if (value._properties[p].enumerable) {
					k.push(p);
				}
			}
		}
		
		// Step 8
		for(i = 0, len = k.length; i < len; i++) {
			p = k[i];
			strP = str(p, value);
			if (strP) {
				member = quote(p) + ':';
				if (gap) {
					member += space;
				}
				member += strP;
				partial.push(member);
			}
		}
		
		// Steps 9 and 10
		if (!partial) {
			final = '{}';
		} else {
			if (!gap) {
				final = '{' + partial.join(',') + '}';
			} else {
				final = '{\n' + indent + partial.join(',\n' + indent) + '\n' + stepBack + '}';
			}
		}
		
		// Step 11
		stack.pop();
		
		// Step 12
		indent = stepBack;
		
		// Step 12
		return final;
	}
	
	function ja(value) {
		
		var stepBack = indent,
			partial = [],
			len,
			index = 0,
			strP,
			final;
		
		// Step 1
		if (stack.indexOf(value) !== -1) {
			Base.throwNativeException('TypeError');
		}
		
		// Step 2
		stack.push(value);
		
		// Step 4
		indent += gap;
		
		// Step 6
		len = value.get('length').value;
		
		// Step 8
		while (index < len) {
			strP = str(Base.toString(new Base.NumberType(index)).value, value);
			if (strP) {
				partial.push(strP);
			} else {
				partial.push('null');
			}
			index++;
		}
		
		// Steps 9 and 10
		if (!partial) {
			final = '[]';
		} else {
			if (!gap) {
				final = '[' + partial.join(',') + ']';
			} else {
				final = '[\n' + indent + partial.join(',\n' + indent) + '\n' + stepBack + ']';
			}
		}
		
		// Step 11
		stack.pop();
		
		// Step 12
		indent = stepBack;
		
		// Step 12
		return final;
	}
	
	// Parse the replacer argument, Step 4
	if (replacer && Base.type(replacer) === 'Object') {
		if (Base.isCallable(replacer)) {
			replacerFunction = replacer;
		} else if (replacer.className === 'Array') {
			propertyList = [];
			for(i = 0, len = Base.toInteger(replacer.get('length')).value; i < len; i++) {
				v = replacer.get(i);
				if (v.className === 'String' || v.className === 'Number') {
					v = Base.toString(v).value;
					if (propertyList.indexOf(v) === -1) {
						propertyList.push(v);
					}
				}
			}
		}
	}
	
	// Parse the space argument, steps 5-8
	if (space) {
		if (space.className === 'Number') {
			space = Math.min(10, Base.toNumber(space).value);
			gap = (new Array(space)).join(' ');
		} else if (space.className === 'String') {
			gap = Base.toString(space).value.substring(0, 9);
			space = space.value;
		} else {
			space = undefined;
			gap = '';
		}
	} else {
		gap = '';
	}
	
	// Step 10
	wrapper = new Base.ObjectType();
	wrapper.defineOwnProperty('', {
		value: value,
		writable: true,
		enumerable: true,
		configurable: true
	}, false);
	
	// Step 11
	try {
		result = str('', wrapper);
	} catch(e) {
		if (e === 'Unknown') {
			return new Base.UnknownType();
		} else {
			throw e;
		}
	}
	if (Base.isUndefined(result)) {
		return new Base.UndefinedType();
	} else {
		return new Base.StringType(result);
	}
};

/**
 * JSON Object
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.12
 */
function JSONObject(className) {
	Base.ObjectType.call(this, className);

	this.put('parse', new JSONParseFunc(), false, true);
	this.put('stringify', new JSONStringifyFunc(), false, true);
}
util.inherits(JSONObject, Base.ObjectType);
