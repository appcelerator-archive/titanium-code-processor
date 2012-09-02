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
	debugger;
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
 * @see ECMA-262 Spec Chapter 15.10.6.4
 */
function EvalFunction(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(EvalFunction, FunctionTypeBase);
EvalFunction.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

/**
 * parseInt method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.10.6.4
 */
function ParseIntFunction(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(ParseIntFunction, FunctionTypeBase);
ParseIntFunction.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

/**
 * parseFloat method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.10.6.4
 */
function ParseFloatFunction(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(ParseFloatFunction, FunctionTypeBase);
ParseFloatFunction.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

/**
 * isNaN method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.10.6.4
 */
function IsNaNFunction(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(IsNaNFunction, FunctionTypeBase);
IsNaNFunction.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

/**
 * isFinite method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.10.6.4
 */
function IsFiniteFunction(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(IsFiniteFunction, FunctionTypeBase);
IsFiniteFunction.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

/**
 * decodeURI method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.10.6.4
 */
function DecodeURIFunction(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(DecodeURIFunction, FunctionTypeBase);
DecodeURIFunction.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

/**
 * decodeURIComponent method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.10.6.4
 */
function DecodeURIComponentFunction(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(DecodeURIComponentFunction, FunctionTypeBase);
DecodeURIComponentFunction.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

/**
 * encodeURI method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.10.6.4
 */
function EncodeURIFunction(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(EncodeURIFunction, FunctionTypeBase);
EncodeURIFunction.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

/**
 * encodeURIComponent method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.10.6.4
 */
function EncodeURIComponentFunction(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(EncodeURIComponentFunction, FunctionTypeBase);
EncodeURIComponentFunction.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

/*****************************************
 *
 * Chapter 15 - Global Constructors
 *
 *****************************************/

// ******** Object Constructor ********

/**
 * Object constructor function
 * 
 * @private
 * @see ECMA-262 Spec Chapter 13.2
 */
function ObjectConstructor(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
	
	/*
	getPrototypeOf
	getOwnPropertyDescriptor
	getOwnPropertyNames
	create
	defineProperty
	defineProperties
	seal
	freeze
	preventExtensions
	isSealed
	isFrozen
	isExtensible
	keys
	*/
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
 * Array constructor function
 * 
 * @private
 * @see ECMA-262 Spec Chapter 13.2
 */
function ArrayConstructor(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
	
	/*
	isArray
	*/
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
 * String constructor function
 * 
 * @private
 * @see ECMA-262 Spec Chapter 13.2
 */
function StringConstructor(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
	
	/*
	fromCharCode
	*/
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
 * Date constructor function
 * 
 * @private
 * @see ECMA-262 Spec Chapter 13.2
 */
function DateConstructor(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
	
	/*
	parse
	UTC
	now
	*/
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
