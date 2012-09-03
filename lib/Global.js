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
	Exceptions = require("./Exceptions"),
	
	// Common objects/methods from Base
	ObjectType = Base.ObjectType,
	FunctionTypeBase = Base.FunctionTypeBase,
	NumberType = Base.NumberType,
	type = Base.type;

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
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(EvalFunction, FunctionTypeBase);
EvalFunction.prototype.call = function call(thisVal, args) {
	
	var x = args[0],
		prog,
		evalCtx,
		result;
	
	// Step 1
	if (type(x) !== "String") {
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
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(2), false, true);
}
util.inherits(ParseIntFunction, FunctionTypeBase);
ParseIntFunction.prototype.call = function call(thisVal, args) {
	
	// Steps 1, 2, and 6
	var string = args[0],
		radix = args[1],
		s = Base.toString(string).value.trim(),
		r = radix && type(radix) !== "Undefined" ? Base.toInt32(radix).value : 10;
		
	// Use the built-in method to perform the parseInt
	return new NumberType(parseInt(s, r));
};

/**
 * parseFloat method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.1.2.3
 */
function ParseFloatFunction(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(ParseFloatFunction, FunctionTypeBase);
ParseFloatFunction.prototype.call = function call(thisVal, args) {
	
	// Steps 1 and 2
	var string = args[0],
		s = Base.toString(string).value.trim();
		
	// Use the built-in method to perform the parseFloat
	return new NumberType(parseFloat(s));
};

/**
 * isNaN method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.1.2.4
 */
function IsNaNFunction(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(IsNaNFunction, FunctionTypeBase);
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
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(IsFiniteFunction, FunctionTypeBase);
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
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(DecodeURIFunction, FunctionTypeBase);
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
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(DecodeURIComponentFunction, FunctionTypeBase);
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
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(EncodeURIFunction, FunctionTypeBase);
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
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(EncodeURIComponentFunction, FunctionTypeBase);
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
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(ObjectGetPrototypeOfFunc, FunctionTypeBase);
ObjectGetPrototypeOfFunc.prototype.call = function call(thisVal, args) {
	var o = args[0];
	if (type(o) !== "Object") {
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
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(2), false, true);
}
util.inherits(ObjectGetOwnPropertyDescriptorFunc, FunctionTypeBase);
ObjectGetOwnPropertyDescriptorFunc.prototype.call = function call(thisVal, args) {
	
	var o = args[0],
		p = args[1],
		name,
		desc;
	
	// Step 1
	if (type(o) !== "Object") {
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
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(ObjectGetOwnPropertyNamesFunc, FunctionTypeBase);
ObjectGetOwnPropertyNamesFunc.prototype.call = function call(thisVal, args) {
	
	var o = args[0],
		array,
		n = 0,
		name;

	// Step 1
	if (type(o) !== "Object") {
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
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(ObjectCreateFunc, FunctionTypeBase);
ObjectCreateFunc.prototype.call = function call(thisVal, args) {
	
	var o = args[0],
		properties = args[1],
		obj;

	// Step 1
	if (type(o) !== "Object") {
		throw new Exceptions.TypeError();
	}
	
	// Step 2
	obj = new ObjectType();
	
	// Step 3
	obj.objectPrototype = o;
	
	// Step 4
	if (properties && type(properties) !== "Undefined") {
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
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(ObjectDefinePropertyFunc, FunctionTypeBase);
ObjectDefinePropertyFunc.prototype.call = function call(thisVal, args) {
	
	var o = args[0],
		p = args[1],
		attributes = args[2],
		obj,
		name,
		desc;

	// Step 1
	if (type(o) !== "Object") {
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
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(ObjectDefinePropertiesFunc, FunctionTypeBase);
ObjectDefinePropertiesFunc.prototype.call = function call(thisVal, args) {
	debugger;
	var o = args[0],
		properties = args[1],
		props = Base.toObject(properties),
		names = Object.keys(props._properties),
		i = 0,
		len = names.length,
		p;

	// Step 1
	if (type(o) !== "Object") {
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
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(ObjectSealFunc, FunctionTypeBase);
ObjectSealFunc.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

/**
 * freeze() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectFreezeFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(ObjectFreezeFunc, FunctionTypeBase);
ObjectFreezeFunc.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

/**
 * preventExtensions() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectPreventExtensionsFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(ObjectPreventExtensionsFunc, FunctionTypeBase);
ObjectPreventExtensionsFunc.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

/**
 * isSealed() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectIsSealedFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(ObjectIsSealedFunc, FunctionTypeBase);
ObjectIsSealedFunc.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

/**
 * isFrozen() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectIsFrozenFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(ObjectIsFrozenFunc, FunctionTypeBase);
ObjectIsFrozenFunc.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

/**
 * isExtensible() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectIsExtensibleFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(ObjectIsExtensibleFunc, FunctionTypeBase);
ObjectIsExtensibleFunc.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

/**
 * keys() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectKeysFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(ObjectKeysFunc, FunctionTypeBase);
ObjectKeysFunc.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

/**
 * Object constructor function
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2
 */
function ObjectConstructor(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
	
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
util.inherits(ObjectConstructor, FunctionTypeBase);
ObjectConstructor.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};
ObjectConstructor.prototype.construct = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

// ******** Function Constructor ********

/**
 * Function constructor function
 * 
 * @private
 * @see ECMA-262 Spec Chapter 13.2
 */
function FunctionConstructor(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(FunctionConstructor, FunctionTypeBase);
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
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(ArrayIsArrayFunc, FunctionTypeBase);
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
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
	
	this.put("isArray", new ArrayIsArrayFunc(), false, true);
}
util.inherits(ArrayConstructor, FunctionTypeBase);
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
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(StringFromCharCodeFunc, FunctionTypeBase);
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
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
	
	this.put("fromCharCode", new StringFromCharCodeFunc(), false, true);
}
util.inherits(StringConstructor, FunctionTypeBase);
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
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(BooleanConstructor, FunctionTypeBase);
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
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
	
	// TODO:
	/*
	MAX_VALUE
	MIN_VALUE
	NaN
	NEGATIVE_INFINITY
	POSITIVE_INFINITY
	*/
}
util.inherits(NumberConstructor, FunctionTypeBase);
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
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(DateParseFunc, FunctionTypeBase);
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
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(DateUTCFunc, FunctionTypeBase);
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
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(DateNowFunc, FunctionTypeBase);
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
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
	
	this.put("parse", new DateParseFunc(), false, true);
	this.put("UTC", new DateUTCFunc(), false, true);
	this.put("now", new DateNowFunc(), false, true);
}
util.inherits(DateConstructor, FunctionTypeBase);
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
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(RegExpConstructor, FunctionTypeBase);
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
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(ErrorConstructor, FunctionTypeBase);
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
	ObjectType.call(this, className);
}
util.inherits(MathObject, ObjectType);

// ******** JSON Object ********

/**
 * JSON Object
 * 
 * @private
 * @see ECMA-262 Spec Chapter 13.2
 */
function JSONObject(className) {
	ObjectType.call(this, className);
}
util.inherits(JSONObject, ObjectType);
