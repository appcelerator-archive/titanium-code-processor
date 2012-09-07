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
	
	var globalEnvironmentRecord = Runtime.globalContext.lexicalEnvironment.envRec;
	
	function addObject(name, value) {
		globalEnvironmentRecord.createMutableBinding(name, false, true);
		globalEnvironmentRecord.setMutableBinding(name, value, false, true);
	}
	
	// Properties
	addObject("NaN", new Base.NumberType(NaN));
	addObject("Infinity", new Base.NumberType(Infinity));
	
	// Methods
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
	addObject("Error", new ErrorConstructor("Error"));
	addObject("EvalError", new ErrorConstructor("EvalError"));
	addObject("RangeError", new ErrorConstructor("RangeError"));
	addObject("ReferenceError", new ErrorConstructor("ReferenceError"));
	addObject("SyntaxError", new ErrorConstructor("SyntaxError"));
	addObject("TypeError", new ErrorConstructor("TypeError"));
	addObject("URIError", new ErrorConstructor("URIError"));
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
	
	// Variable declarations
	var x = args[0],
		prog,
		evalCtx,
		result,
		exception;
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
		return new Base.UnknownType();
	}
	
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
		if (result[1]) {
			if (result[1].className.match("Error$")) {
				exception = new Exceptions[result[1].className]();
				exception.name = result[1].get("name");
				exception.message = result[1].get("message");
				throw exception;
			} else {
				throw new Exceptions.Error(Base.toString(result[1]).value);
			}
		} else {
			throw new Exceptions.Error();
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(2), false, true);
}
util.inherits(ParseIntFunction, Base.FunctionTypeBase);
ParseIntFunction.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var string,
		radix,
		s,
		r;
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	// Steps 1, 2, and 6
	string = args[0];
	radix = args[1];
	s = Base.toString(string).value.trim();
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
	
	// Variable declarations
	var string,
		s;
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(1), false, true);
}
util.inherits(IsNaNFunction, Base.FunctionTypeBase);
IsNaNFunction.prototype.call = function call(thisVal, args) {
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(1), false, true);
}
util.inherits(IsFiniteFunction, Base.FunctionTypeBase);
IsFiniteFunction.prototype.call = function call(thisVal, args) {
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(1), false, true);
}
util.inherits(DecodeURIFunction, Base.FunctionTypeBase);
DecodeURIFunction.prototype.call = function call(thisVal, args) {
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
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
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(1), false, true);
}
util.inherits(EncodeURIComponentFunction, Base.FunctionTypeBase);
EncodeURIComponentFunction.prototype.call = function call(thisVal, args) {
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(1), false, true);
}
util.inherits(ObjectGetPrototypeOfFunc, Base.FunctionTypeBase);
ObjectGetPrototypeOfFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o = args[0];
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
		return new Base.UnknownType();
	}
	
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
	
	// Variable declarations
	var o = args[0],
		p = args[1],
		name,
		desc;
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
		return new Base.UnknownType();
	}
	
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
	
	// Variable declarations
	var o = args[0],
		array,
		n = 0,
		name;

	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
		return new Base.UnknownType();
	}

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
	
	// Variable declarations
	var o = args[0],
		properties = args[1],
		obj;
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
		return new Base.UnknownType();
	}
	
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
	
	// Variable declarations
	var o = args[0],
		p = args[1],
		attributes = args[2],
		obj,
		name,
		desc;
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
		return new Base.UnknownType();
	}

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
	
	// Variable declarations
	var o,
		properties,
		props,
		names,
		i,
		len,
		p;
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	o = args[0];
	properties = args[1];
	props = Base.toObject(properties);
	names = Object.keys(props._properties);
	i = 0;
	len = names.length;
	
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
	
	// Variable declarations
	var o = args[0],
		p,
		desc;
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
		return new Base.UnknownType();
	}

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
	
	// Variable declarations
	var o = args[0],
		p,
		desc;
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
		return new Base.UnknownType();
	}

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
	
	// Variable declarations
	var o = args[0];
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
		return new Base.UnknownType();
	}

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
	
	// Variable declarations
	var o = args[0],
		p;
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
		return new Base.UnknownType();
	}

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
	
	// Variable declarations
	var o = args[0],
		desc,
		p;
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
		return new Base.UnknownType();
	}

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
	
	// Variable declarations
	var o = args[0];
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
		return new Base.UnknownType();
	}

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
	
	// Variable declarations
	var o = args[0],
		array,
		index = 0,
		p;
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
		return new Base.UnknownType();
	}

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
	
	// Variable declarations
	var value = args[0];
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	// Step 1
	if (!value || Base.isType(value, ["Null", "Undefined"])) {
		return new Base.ObjectType();
	}
	
	// Step 2
	return Base.toObject(value);
};
ObjectConstructor.prototype.construct = function call(args) {
	
	// Variable declarations
	var value = args[0],
		obj;
	
	// Validate the parameters
	if (areAnyUnknown(args)) {
		return new Base.UnknownType();
	}
	
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
 * @see ECMA-262 Spec Chapter 15.3
 */
function FunctionConstructor(className) {
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
}
util.inherits(FunctionConstructor, Base.FunctionTypeBase);
FunctionConstructor.prototype.call = function call(thisVal, args) {
	return FunctionConstructor.prototype.construct.call(this, args);
};
FunctionConstructor.prototype.construct = function call(args) {
	
	// Variable declarations
	var argCount = args.length,
		p = "",
		parsedParameters,
		body,
		k = 1,
		i = 0,
		len;
	
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
			p += "," + Base.toString(args[k]).value;
			k++;
		}
		body = args[k];
	}
	
	// Step 6
	body = Base.toString(body).value;
	
	// Step 7
	p = AST.parseString("function temp(" + p + "){}");
	if (!p) {
		throw new Exceptions.SyntaxError();
	}
	p = p[1][0][2];
	
	// Step 8
	body = AST.parseString("function temp(){" + body + "}");
	if (!body) {
		throw new Exceptions.SyntaxError();
	}
	body = body[1][0][3];
	
	// Step 10
	return new Base.FunctionType(p, body, Runtime.getGlobalContext().lexicalEnvironment, 
		!!(body[0] && body[0][0].name === "directive" && [0][1] === "use strict"));
};

// ******** Array Constructor ********

/**
 * isArray() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.4.3.2
 */
function ArrayIsArrayFunc(className) {
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(1), false, true);
}
util.inherits(ArrayIsArrayFunc, Base.FunctionTypeBase);
ArrayIsArrayFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var arg = args[0];
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	// Steps 1 and 2
	return new Base.BooleanType(Base.type(arg) === "Object" && arg.className === "Array");
};

/**
 * Array constructor function
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.4
 */
function ArrayConstructor(className) {
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
	
	this.put("isArray", new ArrayIsArrayFunc(), false, true);
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
		if (type(len) === "Number") {
			if (len.value === Base.toUint32(len).value) {
				array.put("length", Base.toUint32(len), true);
			} else {
				throw new Exceptions.RangeError();
			}
		} else {
			array.put("length", new Base.NumberType(1), true);
			array.put("0", len, true);
		}
	} else if (args.length > 1){
		len = args.length;
		array.put("length", new Base.NumberType(len), true);
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(1), false, true);
}
util.inherits(StringFromCharCodeFunc, Base.FunctionTypeBase);
StringFromCharCodeFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var i = 0,
		len = args.length;
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
	
	this.put("fromCharCode", new StringFromCharCodeFunc(), false, true);
}
util.inherits(StringConstructor, Base.FunctionTypeBase);
StringConstructor.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var value = args[0];
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
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
	obj.className = "String";
	obj.primitiveValue = value ? Base.toString(value).value : "";
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
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
	obj.className = "Boolean";
	obj.primitiveValue = value ? Base.toBoolean(value).value : "";
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);

	this.put("MAX_VALUE", new Base.NumberType(Number.MAX_VALUE), false, true);
	this.put("MIN_VALUE", new Base.NumberType(Number.MIN_VALUE), false, true);
	this.put("NaN", new Base.NumberType(NaN), false, true);
	this.put("NEGATIVE_INFINITY", new Base.NumberType(Number.NEGATIVE_INFINITY), false, true);
	this.put("POSITIVE_INFINITY", new Base.NumberType(Number.POSITIVE_INFINITY), false, true);
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
	obj.className = "Number";
	obj.primitiveValue = value ? Base.toNumber(value).value : "";
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
}
util.inherits(RegExpConstructor, Base.FunctionTypeBase);
RegExpConstructor.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var pattern = args[0],
		flags = args[1];
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	if (type(pattern) === "Object" && pattern.className === "RegExp") {
		return pattern;
	}
	
	return RegExpConstructor.prototype.construct(args);
};
RegExpConstructor.prototype.construct = function call(args) {
	
	// Variable declarations
	var obj,
		pattern = args[0],
		flags = args[1],
		p,
		f;
	
	// Validate the parameters
	if (areAnyUnknown(args)) {
		return new Base.UnknownType();
	}
	
	// Parse the parameters
	if (Base.type(pattern) === "Object" && pattern.className === "RegExp") {
		if (flags && Base.type(flags) !== "Undefined") {
			throw new Exceptions.TypeError();
		}
		p = pattern._pattern;
		f = pattern._flags;
	} else {
		p = pattern && Base.type(pattern) !== "Undefined" ? Base.toString(pattern).value : "";
		f = flags && Base.type(flags) !== "Undefined" ? Base.toString(flags).value : "";
	}
	
	// Create the regex object
	return new Base.RegExpType(p, f);
};

// ******** Date Constructor ********

/**
 * parse() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.4.2
 */
function DateParseFunc(className) {
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
}
util.inherits(DateNowFunc, Base.FunctionTypeBase);
DateNowFunc.prototype.call = function call(thisVal, args) {
	return new Base.UnknownType();
};

/**
 * Date constructor function
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9
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
	return new Base.UnknownType();
};
DateConstructor.prototype.construct = function call(args) {
	return new Base.UnknownType();
};

// ******** Error Prototype Type Class ********

/**
 * toString() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.11.4.4
 */
function ErrorProtoToStringFunc(className) {
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
}
util.inherits(ErrorProtoToStringFunc, Base.FunctionTypeBase);
ErrorProtoToStringFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o = thisVal,
		name,
		msg;
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	// Step 2
	if (Base.type(o) !== "Object") {
		throw new Exceptions.TypeError();
	}
	
	// Steps 3 and 4
	name = o.get("name");
	if (Base.type(name) === "Undefined") {
		name = new Base.StringType("Error");
	} else {
		name = Base.toString(name);
	}
	
	// Steps 5 and 6 (and 7, which seems to be a copy-paste error, go figure)
	msg = o.get("message");
	if (Base.type(msg) === "Undefined") {
		msg = new Base.StringType("");
	} else {
		msg = Base.toString(msg);
	}
	
	// Steps 8-10
	if (!name.value) {
		return msg;
	} else if (!msg.value) {
		return name;
	} else {
		return new Base.StringType(name.value + ": " + msg.value);
	}
};

/**
 * @classdesc The prototype for Errors
 * 
 * @constructor
 * @see ECMA-262 Spec Chapter 15.11.4
 */
exports.ErrorPrototypeType = ErrorPrototypeType;
function ErrorPrototypeType(className) {
	Base.ObjectType.call(this, className);
	
	this.put("toString", new ErrorProtoToStringFunc(), false, true);
}
util.inherits(ErrorPrototypeType, Base.ObjectType);

// ******** Error Constructor ********

/**
 * Error constructor function
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.11
 */
function ErrorConstructor(errorName, className) {
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
	this._name = errorName;
}
util.inherits(ErrorConstructor, Base.FunctionTypeBase);
ErrorConstructor.prototype.call = function call(thisVal, args) {
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	return ErrorConstructor.prototype.construct(args);
};
ErrorConstructor.prototype.construct = function call(args) {
	
	// Variable declarations
	var err,
		message = args[0];
	
	// Validate the parameters
	if (areAnyUnknown(args)) {
		return new Base.UnknownType();
	}
	
	err = new Base.ObjectType();
	err.className = "Error";
	err.objectPrototype = new ErrorPrototypeType();
	err.extensible = true;

	err.put("name", new Base.StringType(this._name), true);
	err.put("message", message && Base.type(message) !== "Undefined" ? Base.toString(message) : new Base.StringType(""), true);
	
	return err;
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(1), false, true);
}
util.inherits(MathAbsFunc, Base.FunctionTypeBase);
MathAbsFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var x = args[0];
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(1), false, true);
}
util.inherits(MathAcosFunc, Base.FunctionTypeBase);
MathAcosFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var x = args[0];
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(1), false, true);
}
util.inherits(MathAsinFunc, Base.FunctionTypeBase);
MathAsinFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var x = args[0];
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(1), false, true);
}
util.inherits(MathAtanFunc, Base.FunctionTypeBase);
MathAtanFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var x = args[0];
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(2), false, true);
}
util.inherits(MathAtan2Func, Base.FunctionTypeBase);
MathAtan2Func.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var x = args[0];
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(1), false, true);
}
util.inherits(MathCeilFunc, Base.FunctionTypeBase);
MathCeilFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var x = args[0];
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(1), false, true);
}
util.inherits(MathCosFunc, Base.FunctionTypeBase);
MathCosFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var x = args[0];
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(1), false, true);
}
util.inherits(MathExpFunc, Base.FunctionTypeBase);
MathExpFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var x = args[0];
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(1), false, true);
}
util.inherits(MathFloorFunc, Base.FunctionTypeBase);
MathFloorFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var x = args[0];
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	if (!x) {
		return new Base.NumberType(NaN);
	} else if (Base.type(x) === "Unknown") {
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(1), false, true);
}
util.inherits(MathLogFunc, Base.FunctionTypeBase);
MathLogFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var x = args[0];
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(2), false, true);
}
util.inherits(MathMaxFunc, Base.FunctionTypeBase);
MathMaxFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var i = 0,
		len = args.length,
		value,
		values = [];
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	for(; i < len; i++) {
		value = Base.toNumber(args[i]);
		if (Base.type(value) === "Unknown") {
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(2), false, true);
}
util.inherits(MathMinFunc, Base.FunctionTypeBase);
MathMinFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var i = 0,
		len = args.length,
		value,
		values = [];
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	for(; i < len; i++) {
		value = Base.toNumber(args[i]);
		if (Base.type(value) === "Unknown") {
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(2), false, true);
}
util.inherits(MathPowFunc, Base.FunctionTypeBase);
MathPowFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var x = args[0],
		y = args[1];
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(1), false, true);
}
util.inherits(MathRoundFunc, Base.FunctionTypeBase);
MathRoundFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var x = args[0];
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(1), false, true);
}
util.inherits(MathSinFunc, Base.FunctionTypeBase);
MathSinFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var x = args[0];
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(1), false, true);
}
util.inherits(MathSqrtFunc, Base.FunctionTypeBase);
MathSqrtFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var x = args[0];
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(1), false, true);
}
util.inherits(MathTanFunc, Base.FunctionTypeBase);
MathTanFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var x = args[0];
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
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
	
	// Properties
	this.put("E", new Base.NumberType(Math.E), false, true);
	this.put("LN10", new Base.NumberType(Math.LN10), false, true);
	this.put("LN2", new Base.NumberType(Math.LN2), false, true);
	this.put("LOG2E", new Base.NumberType(Math.LOG2E), false, true);
	this.put("LOG10E", new Base.NumberType(Math.LOG10E), false, true);
	this.put("PI", new Base.NumberType(Math.PI), false, true);
	this.put("SQRT1_2", new Base.NumberType(Math.SQRT1_2), false, true);
	this.put("SQRT2", new Base.NumberType(Math.SQRT2), false, true);
	
	// Methods
	this.put("abs", new MathAbsFunc(), false, true);
	this.put("acos", new MathAcosFunc(), false, true);
	this.put("asin", new MathAsinFunc(), false, true);
	this.put("atan", new MathAtanFunc(), false, true);
	this.put("atan2", new MathAtan2Func(), false, true);
	this.put("ceil", new MathCeilFunc(), false, true);
	this.put("cos", new MathCosFunc(), false, true);
	this.put("exp", new MathExpFunc(), false, true);
	this.put("floor", new MathFloorFunc(), false, true);
	this.put("log", new MathLogFunc(), false, true);
	this.put("max", new MathMaxFunc(), false, true);
	this.put("min", new MathMinFunc(), false, true);
	this.put("pow", new MathPowFunc(), false, true);
	this.put("random", new MathRandomFunc(), false, true);
	this.put("round", new MathRoundFunc(), false, true);
	this.put("sin", new MathSinFunc(), false, true);
	this.put("sqrt", new MathSqrtFunc(), false, true);
	this.put("tan", new MathTanFunc(), false, true);
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
}
util.inherits(JSONParseFunc, Base.FunctionTypeBase);
JSONParseFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var text = args[0],
		reviver = args[1],
		nativeReviver,
		nativeObject;
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
		return new Base.UnknownType();
	}

	// Parse the code
	try {
		nativeObject = JSON.parse(Base.toString(text).value);
	} catch(e) {
		throw new Exceptions.SyntaxError();
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
				if (Base.type(v) !== "Undefined") {
					converted.put(k, v, true);
				} else {
					converted["delete"](k, false);
				}
			} else {
				converted.put(k, v, true, true);
			}
		}
		
		switch(typeof native) {
			case "undefined":
				return new Base.UndefinedType();
			case "null":
				return new Base.NullType();
			case "string":
				return new Base.StringType(native);
			case "number":
				return new Base.NumberType(native);
			case "boolean":
				return new Base.BooleanType(native);
			case "object":
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
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(0), false, true);
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
		indent = "",
		wrapper,
		result;
	
	// Validate the parameters
	if (areAnyUnknown(args.concat(thisVal))) {
		return new Base.UnknownType();
	}
	
	function str(key, holder) {
		
		// Step 1
		var value = holder.get(key),
			toJSON;
		
		// Step 2
		if (Base.type(value) === "Object") {
			toJSON = value.get("toJSON");
			if (Base.type(toJSON) === "Unknown") {
				throw "Unknown";
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
		if (Base.type(value) == "Object") {
			if (value.className === "Number") {
				value = Base.toNumber(value);
			}
			if (value.className === "String") {
				value = Base.toString(value);
			}
			if (value.className === "Boolean") {
				value = new BooleanType(value.primitiveValue);
			}
		}
		
		// Steps 5-7
		if (Base.type(value) === "Null") {
			return "null";
		} else if (value.value === false) {
			return "false";
		} else if (value.value === true) {
			return "true";
		}
		
		// Step 8
		if (Base.type(value) === "String") {
			return quote(value.value);
		}
		
		// Step 9
		if (Base.type(value) === "Number") {
			if (isFinite(value.value)) {
				return Base.toString(value).value;
			} else {
				return "null";
			}
		}
		
		// Step 10
		if (Base.type(value) === "Unknown") {
			throw "Unknown";
		}
		if (Base.type(value) === "Object" && !Base.isCallable(value)) {
			if (value.className === "Array") {
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
			throw new Exceptions.TypeError();
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
				member = quote(p) + ":";
				if (gap) {
					member += space;
				}
				member += strP;
				partial.push(member);
			}
		}
		
		// Steps 9 and 10
		if (!partial) {
			final = "{}";
		} else {
			if (!gap) {
				final = "{" + partial.join(",") + "}";
			} else {
				final = "{\n" + indent + partial.join(",\n" + indent) + "\n" + stepBack + "}";
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
			throw new Exceptions.TypeError();
		}
		
		// Step 2
		stack.push(value);
		
		// Step 4
		indent += gap;
		
		// Step 6
		len = value.get("length").value;
		
		// Step 8
		while (index < len) {
			strP = str(Base.toString(new Base.NumberType(index)).value, value);
			if (strP) {
				partial.push(strP);
			} else {
				partial.push("null");
			}
			index++;
		}
		
		// Steps 9 and 10
		if (!partial) {
			final = "[]";
		} else {
			if (!gap) {
				final = "[" + partial.join(",") + "]";
			} else {
				final = "[\n" + indent + partial.join(",\n" + indent) + "\n" + stepBack + "]";
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
	if (replacer && Base.type(replacer) === "Object") {
		if (Base.isCallable(replacer)) {
			replacerFunction = replacer;
		} else if (replacer.className === "Array") {
			propertyList = [];
			for(i = 0, len = Base.toInteger(replacer.get("length")).value; i < len; i++) {
				v = replacer.get(i);
				if (v.className === "String" || v.className === "Number") {
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
		if (space.className === "Number") {
			space = Math.min(10, Base.toNumber(space).value);
			gap = (new Array(space)).join(" ");
		} else if (space.className === "String") {
			gap = Base.toString(space).value.substring(0, 9);
			space = space.value;
		} else {
			space = undefined;
			gap = "";
		}
	} else {
		gap = "";
	}
	
	// Step 10
	wrapper = new Base.ObjectType();
	wrapper.defineOwnProperty("", {
		value: value,
		writable: true,
		enumerable: true,
		configurable: true
	}, false);
	
	// Step 11
	try {
		result = str("", wrapper);
	} catch(e) {
		if (e === "Unknown") {
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

	this.put("parse", new JSONParseFunc(), false, true);
	this.put("stringify", new JSONStringifyFunc(), false, true);
}
util.inherits(JSONObject, Base.ObjectType);
