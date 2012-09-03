/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * This module defines and injects the built-in global objects into the global namespace.
 * 
 * @module Global
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */
 
var util = require("util"),

	Base = require("./Base"),
	Runtime = require("./Runtime"),
	RuleProcessor = require("./RuleProcessor"),
	AST = require("./AST"),
	Exceptions = require("./Exceptions");

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
	
	var globalEnvironmentRecord = Runtime.globalContext.lexicalEnvironment.envRec;
	
	function addObject(name, value) {
		globalEnvironmentRecord.createMutableBinding(name, false, true);
		globalEnvironmentRecord.setMutableBinding(name, value, false, true);
	}
	
	addObject("eval", new EvalFunction());
	addObject("parseInt", new ParseIntFunction());
	addObject("parseFloat", new ParseFloatFunction());
	addObject("isNaN", new IsNaNFunction());
	addObject("isFinite", new IsFiniteFunction());
	addObject("decodeURI", new DecodeURIFunction());
	addObject("decodeURIComponent", new DecodeURIComponentFunction());
	addObject("encodeURI", new EncodeURIFunction());
	addObject("encodeURIComponent", new EncodeURIComponentFunction());
	addObject("Object", new ObjectConstructor());
	addObject("Function", new FunctionConstructor());
	addObject("Array", new ArrayConstructor());
	addObject("String", new StringConstructor());
	addObject("Boolean", new BooleanConstructor());
	addObject("Number", new NumberConstructor());
	addObject("Date", new DateConstructor());
	addObject("RegExp", new RegExpConstructor());
	addObject("Error", new ErrorConstructor());
	addObject("EvalError", new ErrorConstructor());
	addObject("RangeError", new ErrorConstructor());
	addObject("ReferenceError", new ErrorConstructor());
	addObject("SyntaxError", new ErrorConstructor());
	addObject("TypeError", new ErrorConstructor());
	addObject("URIError", new ErrorConstructor());
	addObject("Math", new MathObject());
	addObject("JSON", new JSONObject());
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(1), false, true);
}
util.inherits(EvalFunction, Base.FunctionTypeBase);
EvalFunction.prototype.call = function call(thisVal, args) {
	
	var x = args[0],
		prog,
		evalCtx,
		result;
	
	// Step 1
	if (Base.type(x) !== "String") {
		return x;
	}
	
	// Step 2
	if (!(prog = AST.parseString(x.value))) {
		throw new Exceptions.SyntaxError();
	}
	
	// Step 3
	evalCtx = Base.createEvalContext(Runtime.getCurrentContext(), prog, 
		!!(prog[0] && prog[0][0].name === "directive" && prog[0][1] === "use strict"));
	Runtime.contextStack.push(evalCtx);
	
	// Step 4
	prog.useCurrentContext = true;
	result = RuleProcessor.processRule(prog);
	
	// Step 5
	Runtime.contextStack.pop();
	
	// Step 6
	if (result[0] === "normal") {
		return result[1] ? result[1] : new Base.UndefinedType();
	} else {
		throw new Exceptions.Error();
	}
};

/**
 * parseInt method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.1.2.2
 */
function ParseIntFunction(className) {
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(2), false, true);
}
util.inherits(ParseIntFunction, Base.FunctionTypeBase);
ParseIntFunction.prototype.call = function call(thisVal, args) {
	
	// Steps 1, 2, and 6
	var string = args[0],
		radix = args[1],
		s = Base.toString(string).value.trim(),
		r = radix && Base.type(radix) !== "Undefined" ? Base.toInt32(radix).value : 10;
		
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(1), false, true);
}
util.inherits(ParseFloatFunction, Base.FunctionTypeBase);
ParseFloatFunction.prototype.call = function call(thisVal, args) {
	
	// Steps 1 and 2
	var string = args[0],
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(1), false, true);
}
util.inherits(IsNaNFunction, Base.FunctionTypeBase);
IsNaNFunction.prototype.call = function call(thisVal, args) {
		
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(1), false, true);
}
util.inherits(IsFiniteFunction, Base.FunctionTypeBase);
IsFiniteFunction.prototype.call = function call(thisVal, args) {
		
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(1), false, true);
}
util.inherits(DecodeURIFunction, Base.FunctionTypeBase);
DecodeURIFunction.prototype.call = function call(thisVal, args) {
	
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(1), false, true);
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(1), false, true);
}
util.inherits(EncodeURIFunction, Base.FunctionTypeBase);
EncodeURIFunction.prototype.call = function call(thisVal, args) {
	
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(1), false, true);
}
util.inherits(EncodeURIComponentFunction, Base.FunctionTypeBase);
EncodeURIComponentFunction.prototype.call = function call(thisVal, args) {
	
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(1), false, true);
}
util.inherits(ObjectGetPrototypeOfFunc, Base.FunctionTypeBase);
ObjectGetPrototypeOfFunc.prototype.call = function call(thisVal, args) {
	var o = args[0];
	if (Base.type(o) !== "Object") {
		throw new Exceptions.TypeError();
	}
	return o.objectPrototype ? o.objectPrototype : new UndefinedType();
};

/**
 * getOwnPropertyDescriptor() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectGetOwnPropertyDescriptorFunc(className) {
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(2), false, true);
}
util.inherits(ObjectGetOwnPropertyDescriptorFunc, Base.FunctionTypeBase);
ObjectGetOwnPropertyDescriptorFunc.prototype.call = function call(thisVal, args) {
	
	var o = args[0],
		p = args[1],
		name,
		desc;
	
	// Step 1
	if (Base.type(o) !== "Object") {
		throw new Exceptions.TypeError();
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(1), false, true);
}
util.inherits(ObjectGetOwnPropertyNamesFunc, Base.FunctionTypeBase);
ObjectGetOwnPropertyNamesFunc.prototype.call = function call(thisVal, args) {
	
	var o = args[0],
		array,
		n = 0,
		name;

	// Step 1
	if (Base.type(o) !== "Object") {
		throw new Exceptions.TypeError();
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
}
util.inherits(ObjectCreateFunc, Base.FunctionTypeBase);
ObjectCreateFunc.prototype.call = function call(thisVal, args) {
	
	var o = args[0],
		properties = args[1],
		obj;

	// Step 1
	if (Base.type(o) !== "Object") {
		throw new Exceptions.TypeError();
	}
	
	// Step 2
	obj = new Base.ObjectType();
	
	// Step 3
	obj.objectPrototype = o;
	
	// Step 4
	if (properties && Base.type(properties) !== "Undefined") {
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
}
util.inherits(ObjectDefinePropertyFunc, Base.FunctionTypeBase);
ObjectDefinePropertyFunc.prototype.call = function call(thisVal, args) {
	
	var o = args[0],
		p = args[1],
		attributes = args[2],
		obj,
		name,
		desc;

	// Step 1
	if (Base.type(o) !== "Object") {
		throw new Exceptions.TypeError();
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
}
util.inherits(ObjectDefinePropertiesFunc, Base.FunctionTypeBase);
ObjectDefinePropertiesFunc.prototype.call = function call(thisVal, args) {
	
	var o = args[0],
		properties = args[1],
		props = Base.toObject(properties),
		names = Object.keys(props._properties),
		i = 0,
		len = names.length,
		p;

	// Step 1
	if (Base.type(o) !== "Object") {
		throw new Exceptions.TypeError();
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
}
util.inherits(ObjectSealFunc, Base.FunctionTypeBase);
ObjectSealFunc.prototype.call = function call(thisVal, args) {
	
	var o = args[0],
		p,
		desc;

	// Step 1
	if (Base.type(o) !== "Object") {
		throw new Exceptions.TypeError();
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
}
util.inherits(ObjectFreezeFunc, Base.FunctionTypeBase);
ObjectFreezeFunc.prototype.call = function call(thisVal, args) {
	
	var o = args[0],
		p,
		desc;

	// Step 1
	if (Base.type(o) !== "Object") {
		throw new Exceptions.TypeError();
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
}
util.inherits(ObjectPreventExtensionsFunc, Base.FunctionTypeBase);
ObjectPreventExtensionsFunc.prototype.call = function call(thisVal, args) {
	
	var o = args[0];

	// Step 1
	if (Base.type(o) !== "Object") {
		throw new Exceptions.TypeError();
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
}
util.inherits(ObjectIsSealedFunc, Base.FunctionTypeBase);
ObjectIsSealedFunc.prototype.call = function call(thisVal, args) {
	
	var o = args[0],
		p;

	// Step 1
	if (Base.type(o) !== "Object") {
		throw new Exceptions.TypeError();
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
}
util.inherits(ObjectIsFrozenFunc, Base.FunctionTypeBase);
ObjectIsFrozenFunc.prototype.call = function call(thisVal, args) {
	
	var o = args[0],
		desc,
		p;

	// Step 1
	if (Base.type(o) !== "Object") {
		throw new Exceptions.TypeError();
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
}
util.inherits(ObjectIsExtensibleFunc, Base.FunctionTypeBase);
ObjectIsExtensibleFunc.prototype.call = function call(thisVal, args) {
	
	var o = args[0];

	// Step 1
	if (Base.type(o) !== "Object") {
		throw new Exceptions.TypeError();
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
}
util.inherits(ObjectKeysFunc, Base.FunctionTypeBase);
ObjectKeysFunc.prototype.call = function call(thisVal, args) {
	
	var o = args[0],
		array,
		index = 0,
		p;

	// Step 1
	if (Base.type(o) !== "Object") {
		throw new Exceptions.TypeError();
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
	
	this.put("getPrototypeOf", new ObjectGetPrototypeOfFunc(), false, true);
	this.put("getOwnPropertyDescriptor", new ObjectGetOwnPropertyDescriptorFunc(), false, true);
	this.put("getOwnPropertyNames", new ObjectGetOwnPropertyNamesFunc(), false, true);
	this.put("create", new ObjectCreateFunc(), false, true);
	this.put("defineProperty", new ObjectDefinePropertyFunc(), false, true);
	this.put("defineProperties", new ObjectDefinePropertiesFunc(), false, true);
	this.put("seal", new ObjectSealFunc(), false, true);
	this.put("freeze", new ObjectFreezeFunc(), false, true);
	this.put("preventExtensions", new ObjectPreventExtensionsFunc(), false, true);
	this.put("isSealed", new ObjectIsSealedFunc(), false, true);
	this.put("isFrozen", new ObjectIsFrozenFunc(), false, true);
	this.put("isExtensible", new ObjectIsExtensibleFunc(), false, true);
	this.put("keys", new ObjectKeysFunc(), false, true);
}
util.inherits(ObjectConstructor, Base.FunctionTypeBase);
ObjectConstructor.prototype.call = function call(thisVal, args) {
	
	var value = args[0];
	
	// Step 1
	if (!value || Base.isType(value, ["Null", "Undefined"])) {
		return new Base.ObjectType();
	}
	
	// Step 2
	return Base.toObject(value);
};
ObjectConstructor.prototype.construct = function call(args) {
	debugger;
	var value = args[0],
		obj;
	
	// Step 1
	if (value && !Base.isType(value, ["Undefined", "Null"])) {
		if (Base.type(value) === "Object") {
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
 * @see ECMA-262 Spec Chapter 13.2
 */
function FunctionConstructor(className) {
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
}
util.inherits(FunctionConstructor, Base.FunctionTypeBase);
FunctionConstructor.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};
FunctionConstructor.prototype.construct = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

// ******** Array Constructor ********

/**
 * isArray() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ArrayIsArrayFunc(className) {
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
}
util.inherits(ArrayIsArrayFunc, Base.FunctionTypeBase);
ArrayIsArrayFunc.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

/**
 * Array constructor function
 * 
 * @private
 * @see ECMA-262 Spec Chapter 13.2
 */
function ArrayConstructor(className) {
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
	
	this.put("isArray", new ArrayIsArrayFunc(), false, true);
}
util.inherits(ArrayConstructor, Base.FunctionTypeBase);
ArrayConstructor.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};
ArrayConstructor.prototype.construct = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

// ******** String Constructor ********

/**
 * isArray() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function StringFromCharCodeFunc(className) {
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
}
util.inherits(StringFromCharCodeFunc, Base.FunctionTypeBase);
StringFromCharCodeFunc.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

/**
 * String constructor function
 * 
 * @private
 * @see ECMA-262 Spec Chapter 13.2
 */
function StringConstructor(className) {
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
	
	this.put("fromCharCode", new StringFromCharCodeFunc(), false, true);
}
util.inherits(StringConstructor, Base.FunctionTypeBase);
StringConstructor.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};
StringConstructor.prototype.construct = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

// ******** Boolean Constructor ********

/**
 * Boolean constructor function
 * 
 * @private
 * @see ECMA-262 Spec Chapter 13.2
 */
function BooleanConstructor(className) {
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
}
util.inherits(BooleanConstructor, Base.FunctionTypeBase);
BooleanConstructor.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};
BooleanConstructor.prototype.construct = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

// ******** Number Constructor ********

/**
 * Number constructor function
 * 
 * @private
 * @see ECMA-262 Spec Chapter 13.2
 */
function NumberConstructor(className) {
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
	
	// TODO:
	/*
	MAX_VALUE
	MIN_VALUE
	NaN
	NEGATIVE_INFINITY
	POSITIVE_INFINITY
	*/
}
util.inherits(NumberConstructor, Base.FunctionTypeBase);
NumberConstructor.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};
NumberConstructor.prototype.construct = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

// ******** Date Constructor ********

/**
 * parse() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function DateParseFunc(className) {
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
}
util.inherits(DateParseFunc, Base.FunctionTypeBase);
DateParseFunc.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

/**
 * UTC() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function DateUTCFunc(className) {
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
}
util.inherits(DateUTCFunc, Base.FunctionTypeBase);
DateUTCFunc.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

/**
 * now() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function DateNowFunc(className) {
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
}
util.inherits(DateNowFunc, Base.FunctionTypeBase);
DateNowFunc.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

/**
 * Date constructor function
 * 
 * @private
 * @see ECMA-262 Spec Chapter 13.2
 */
function DateConstructor(className) {
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
	
	this.put("parse", new DateParseFunc(), false, true);
	this.put("UTC", new DateUTCFunc(), false, true);
	this.put("now", new DateNowFunc(), false, true);
}
util.inherits(DateConstructor, Base.FunctionTypeBase);
DateConstructor.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};
DateConstructor.prototype.construct = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

// ******** RegExp Constructor ********

/**
 * RegExp constructor function
 * 
 * @private
 * @see ECMA-262 Spec Chapter 13.2
 */
function RegExpConstructor(className) {
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
}
util.inherits(RegExpConstructor, Base.FunctionTypeBase);
RegExpConstructor.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};
RegExpConstructor.prototype.construct = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

// ******** Error Constructor ********

/**
 * Error constructor function
 * 
 * @private
 * @see ECMA-262 Spec Chapter 13.2
 */
function ErrorConstructor(className) {
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
}
util.inherits(ErrorConstructor, Base.FunctionTypeBase);
ErrorConstructor.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};
ErrorConstructor.prototype.construct = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

/*****************************************
 *
 * Chapter 15 - Global Objects
 *
 *****************************************/

// ******** Math Object ********

/**
 * Math Object
 * 
 * @private
 * @see ECMA-262 Spec Chapter 13.2
 */
function MathObject(className) {
	Base.ObjectType.call(this, className);
}
util.inherits(MathObject, Base.ObjectType);

// ******** JSON Object ********

/**
 * JSON Object
 * 
 * @private
 * @see ECMA-262 Spec Chapter 13.2
 */
function JSONObject(className) {
	Base.ObjectType.call(this, className);
}
util.inherits(JSONObject, Base.ObjectType);
