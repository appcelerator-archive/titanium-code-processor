/** 
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * This module contains many base operations used by the code processor. Almost all of the methods and classes strictly
 * implement methods/objects defined in the ECMA-262 specification. Many of the descriptions are taken directly from the
 * ECMA-262 Specification, which can be obtained from 
 * <a href='http://www.ecma-international.org/publications/standards/Ecma-262.htm'>ecma international</a> Direct quotes
 * from the ECMA-262 specification are formatted with the prefix 'ECMA-262 Spec:' followed by the quote in 
 * <em>italics</em>. See Chapters 8, 9, and 10 in the ECMA-262 specification for more explanations of these objects and 
 * methods.
 * 
 * @module Base
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var util = require('util'),
	
	Runtime = require('./Runtime'),
	RuleProcessor = require('./RuleProcessor'),
	AST = require('./AST'),
	
	throwTypeError,
	
	positiveIntegerRegEx = /^\d*$/,
	
	prototypes = {};

/*****************************************
 *
 * Non-spec helpers
 *
 *****************************************/

/**
 * Checks if the given value is a primitive type, i.e. {@link module:Base.type}(o) is one of 'Number', 'String', 'Boolean', 
 * 'Undefined', or 'Null'.
 * 
 * @method
 * @param {module:Base.BaseType} o The value to check
 * @returns {Boolean} Whether or not the value is a primitive
 */
exports.isPrimitive = isPrimitive; // We do the exports first to get docgen to recognize the function properly
function isPrimitive(o) {
	return !!~['Number', 'String', 'Boolean', 'Undefined', 'Null'].indexOf(o && o.className);
}

/**
 * Checks if the given value is an object type (Object, Function, Array, etc)
 * 
 * @method
 * @param {module:Base.BaseType} o The value to check
 * @returns {Boolean} Whether or not the value is a primitive
 */
exports.isObject = isObject;
function isObject(o) {
	return !isPrimitive(o);
}

/**
 * Determines the type of the value.
 * 
 * @method
 * @param {module:Base.BaseType} t The value to check
 * @returns {String} The type of the value, one of 'Undefined', 'Null', 'Number', 'String', 'Boolean', 'Object', 
 *		'Reference', 'Unknown'.
 */
exports.type = type;
function type(t) {
	return t.type;
}

/**
 * Checks if two descriptions describe the same description.
 * 
 * @method
 * @param {module:Base.DataPropertyDescriptor|module:Base.AccessorPropertyDescriptor} x The first descriptor
 * @param {module:Base.DataPropertyDescriptor|module:Base.AccessorPropertyDescriptor} y The second descriptor
 * @returns {Boolean} Whether or not the descriptions are the same
 */
exports.sameDesc = sameDesc;
function sameDesc(x, y) {
	var xKeys,
		yKeys,
		same,
		i,
		hiddenRegex = /^_/;
	if (typeof x === typeof y) {
		if (typeof x === 'object') {
			xKeys = Object.keys(x);
			yKeys = Object.keys(y);
			same = true;

			if (xKeys.length !== yKeys.length) {
				return false;
			}
			for (i in xKeys) {
				if (!hiddenRegex.test(xKeys[i])) {
					if (i in yKeys) {
						same = same && (sameDesc(x[xKeys[i]], y[xKeys[i]]));
					} else {
						return false;
					}
				}
			}
			return same;
		} else {
			return x === y;
		}
	} else {
		return false;
	}
}

/**
 * Checks if the supplied value is one of the supplied types.
 * 
 * @method
 * @param {module:Base.baseType} value The value to check
 * @param {String|Array[String]} types The types to check against
 * @returns {Boolean} Whether or not the value is one of the types
 */
exports.isType = isType;
function isType(value, types) {
	if (typeof types === 'string') {
		types = [types];
	}
	return types.indexOf(type(value)) !== -1;
}

/**
 * Checks if any of the supplied values are unknown
 * 
 * @method
 * @param {Array[{@link module:Base.BaseType}]} values The values to check for unknown
 * @param {Boolean} Whether or not any of the supplied values are unknown
 */
exports.areAnyUnknown = areAnyUnknown;
function areAnyUnknown(values) {
	var i = 0,
		len = values.length;
	for (; i < len; i++) {
		if (type(values[i]) === 'Unknown') {
			return true;
		}
	}
	return false;
}

/**
 * Checks if a value is defined
 * 
 * @method
 * @param {Any} value The value to check
 * @param {Boolean} Whether or not the value is not undefined
 */
exports.isDefined = isDefined;
function isDefined(value) {
	return typeof value !== 'undefined';
}

/**
 * Checks if a value is defined
 * 
 * @method
 * @param {Any} value The value to check
 * @param {Boolean} Whether or not the value is not undefined
 */
exports.isUndefined = isUndefined;
function isUndefined(value) {
	return typeof value === 'undefined';
}

/**
 * Adds a read-only prop to an object
 * 
 * @method
 * @param {module:Base.BaseType} obj The object to add the property to
 * @param {String} name The name of the property
 * @Param {module:Base.BaseType} value The value of the new property
 */
exports.addReadOnlyProperty = addReadOnlyProperty;
function addReadOnlyProperty(obj, name, value) {
	obj.defineOwnProperty(name, { value: value }, false, true);
}

/**
 * Throws a native exception if exception recovery is turned off, else reports an error but doesn't actually throw
 * the exception.
 * 
 * @method
 * @param {String} exceptionType The type of exception, e.g. 'TypeError'
 * @param {String} message The exception message
 */
exports.handleRecoverableNativeException = handleRecoverableNativeException;
function handleRecoverableNativeException(exceptionType, message) {
	if (!Runtime.inTryCatch() && Runtime.options.nativeExceptionRecovery) {
		Runtime.reportError('recoveredFromException', 'An exception was thrown but not caught: ' + 
			message, {
				description: 'Uncaught exception',
				exception: Runtime.getGlobalObject().get(exceptionType).construct([new StringType(message)])
			});
	} else {
		throwNativeException(exceptionType, message);
	}
}

/**
 * Throws a native exception. Due to the internal nature, we have to do a little tricker to get the result inserted into
 * the rule processing flow.
 * 
 * @method
 * @param {String} exceptionType The type of exception, e.g. 'TypeError'
 * @param {String} message The exception message
 */
exports.throwNativeException = throwNativeException;
function throwNativeException (exceptionType, message) {
	throwException(Runtime.getGlobalObject().get(exceptionType).construct([new StringType(message)]));
}

/**
 * Throws a native exception. Due to the internal nature, we have to do a little tricker to get the result inserted into
 * the rule processing flow.
 * 
 * @method
 * @param {String} exceptionType The type of exception, e.g. 'TypeError'
 * @param {String} message The exception message
 */
exports.throwException = throwException;
function throwException (exception) {
	debugger;
	var error,
		location = Runtime.getCurrentLocation();
	
	// Set the exception
	exception.file = location.file;
	exception.line = location.line;
	exception.column = location.column;
	exception.stackTrace = Runtime.getStackTrace();
	Runtime._exception = exception;
	
	// Throw an internal error to redirect control flow. This is caught by RuleProcessor.processRule where 
	// Runtime._exception is pulled out.
	error = new Error('VM exception flow controller');
	error.isCodeProcessorException = true;

	throw error;
}

/**
 * Injects the global objects into the global namespace
 * 
 * @method
 */
exports.init = init;
function init() {
	
	var globalObject,
		globalContext,
		env,
		globalObjects = {};
	
	function addObject(name, value) {
		globalObject.defineOwnProperty(name, {
			value: value,
			writable: true,
			enumerable: false,
			configurable: true
		}, false, true);
	}

	// Create the global object and context
	globalObject = new ObjectType();
	globalObject._closure = globalObject;
	Runtime.setGlobalObject(globalObject);
	env = newObjectEnvironment(globalObject, undefined);
	globalContext = new ExecutionContext(
		env,
		env,
		globalObject);
	Runtime.enterContext(globalContext);

	// Create the prototypes
	prototypes['Number'] = new NumberPrototypeType();
	prototypes['Boolean'] = new BooleanPrototypeType();
	prototypes['String'] = new StringPrototypeType();
	prototypes['Object'] = new ObjectPrototypeType();
	prototypes['Array'] = new ArrayPrototypeType();
	prototypes['Function'] = new FunctionPrototypeType();
	prototypes['RegExp'] = new RegExpPrototypeType();
	prototypes['Date'] = new DatePrototypeType();
	prototypes['Error'] = new ErrorPrototypeType('Error');
	prototypes['EvalError'] = new ErrorPrototypeType('EvalError');
	prototypes['RangeError'] = new ErrorPrototypeType('RangeError');
	prototypes['ReferenceError'] = new ErrorPrototypeType('ReferenceError');
	prototypes['SyntaxError'] = new ErrorPrototypeType('SyntaxError');
	prototypes['TypeError'] = new ErrorPrototypeType('TypeError');
	prototypes['URIError'] = new ErrorPrototypeType('URIError');

	// Create the global objects and set the constructors
	prototypes['Number'].put('constructor', globalObjects['Number'] = new NumberConstructor(), false, true);
	prototypes['Boolean'].put('constructor', globalObjects['Boolean'] = new BooleanConstructor(), false, true);
	prototypes['String'].put('constructor', globalObjects['String'] = new StringConstructor(), false, true);
	prototypes['Object'].put('constructor', globalObjects['Object'] = new ObjectConstructor(), false, true);
	prototypes['Array'].put('constructor', globalObjects['Array'] = new ArrayConstructor(), false, true);
	prototypes['Function'].put('constructor', globalObjects['Function'] = new FunctionConstructor(), false, true);
	prototypes['RegExp'].put('constructor', globalObjects['RegExp'] = new RegExpConstructor(), false, true);
	prototypes['Date'].put('constructor', globalObjects['Date'] = new DateConstructor(), false, true);
	prototypes['Error'].put('constructor', globalObjects['Error'] = new ErrorConstructor('Error'), false, true);
	prototypes['EvalError'].put('constructor', globalObjects['EvalError'] = new ErrorConstructor('EvalError'), false, true);
	prototypes['RangeError'].put('constructor', globalObjects['RangeError'] = new ErrorConstructor('RangeError'), false, true);
	prototypes['ReferenceError'].put('constructor', globalObjects['ReferenceError'] = new ErrorConstructor('ReferenceError'), false, true);
	prototypes['SyntaxError'].put('constructor', globalObjects['SyntaxError'] = new ErrorConstructor('SyntaxError'), false, true);
	prototypes['TypeError'].put('constructor', globalObjects['TypeError'] = new ErrorConstructor('TypeError'), false, true);
	prototypes['URIError'].put('constructor', globalObjects['URIError'] = new ErrorConstructor('URIError'), false, true);
	
	// Create the throw type error
	throwTypeError = new FunctionType([], undefined, globalContext.lexicalEnvironment, globalContext.strict);
	throwTypeError.call = function () {
		throwNativeException('TypeError', '');
	};
	throwTypeError.extensible = false;

	// Properties
	addReadOnlyProperty(globalObject, 'NaN', new NumberType(NaN));
	addReadOnlyProperty(globalObject, 'Infinity', new NumberType(Infinity));
	addReadOnlyProperty(globalObject, 'undefined', new UndefinedType());
	
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
	
	// Types
	addObject('Object', globalObjects['Object']);
	addObject('Function', globalObjects['Function']);
	addObject('Array', globalObjects['Array']);
	addObject('String', globalObjects['String']);
	addObject('Boolean', globalObjects['Boolean']);
	addObject('Number', globalObjects['Number']);
	addObject('Date', globalObjects['Date']);
	addObject('RegExp', globalObjects['RegExp']);
	addObject('Error', globalObjects['Error']);
	addObject('EvalError', globalObjects['EvalError']);
	addObject('RangeError', globalObjects['RangeError']);
	addObject('ReferenceError', globalObjects['ReferenceError']);
	addObject('SyntaxError', globalObjects['SyntaxError']);
	addObject('TypeError', globalObjects['TypeError']);
	addObject('URIError', globalObjects['URIError']);
	
	// Objects
	addObject('Math', new MathObject());
	addObject('JSON', new JSONObject());
}

// ******** Base Type Class ********

/**
 * @classdesc The base class for all types
 * 
 * @constructor
 * @extends module:Runtime.Evented
 * @param {String} className The name of the class, such as 'String' or 'Object'
 */
exports.BaseType = BaseType;
function BaseType(className) {
	Runtime.Evented.call(this);
	this.className = className;
	this._closure = Runtime.getCurrentContext();
}
util.inherits(BaseType, Runtime.Evented);

/**
 * Checks if this value is local to an ambiguous context (always true if not in an ambiguous context)
 * 
 * @private
 */
BaseType.prototype._isLocal = function () {
	var lexicalEnvironment = Runtime.getCurrentContext().lexicalEnvironment,
		targetLexicalEnvironment = this._closure.lexicalEnvironment;
	while (lexicalEnvironment) {
		if (targetLexicalEnvironment === lexicalEnvironment) {
			return true;
		} else if (lexicalEnvironment._ambiguousContext) {
			return false;
		}
		lexicalEnvironment = lexicalEnvironment.outer;
	}
	return true;
};

/**
 * Updates the closure if this variable is leaked
 * 
 * @private
 */
BaseType.prototype._updateClosure = function (targetClosure) {
	var lexicalEnvironment = this._closure.lexicalEnvironment,
		targetLexicalEnvironment = targetClosure.lexicalEnvironment;
	while (lexicalEnvironment) {
		if (lexicalEnvironment === targetLexicalEnvironment) {
			this._closure = targetClosure;
			return true;
		}
		lexicalEnvironment = lexicalEnvironment.outer;
	}
	return false;
};

/**
 * Looks up a property
 * 
 * @private
 */
BaseType.prototype._lookupProperty = function (p) {
	var i = 0, len = this._properties.length;
	p = p.toString();
	for (; i < len; i++) {
		if (this._properties[i]._name === p) {
			return this._properties[i];
		}
	}
};

/**
 * Adds a property
 * 
 * @private
 */
BaseType.prototype._addProperty = function (p, desc) {
	p = p.toString();
	desc._name = p;
	this._removeProperty(p);
	this._properties.push(desc);
};

/**
 * Removes a property
 * 
 * @private
 */
BaseType.prototype._removeProperty = function (p) {
	var i = 0, len = this._properties.length;
	p = p.toString();
	for (; i < len; i++) {
		if (this._properties[i]._name === p) {
			this._properties.splice(i, 1);
			return;
		}
	}
};

/**
 * Gets a list of properties
 * 
 * @private
 */
BaseType.prototype._getPropertyNames = function () {
	var i = 0, len = this._properties.length,
		properties = [];
	for (; i < len; i++) {
		properties[i] = this._properties[i]._name;
	}
	return properties.sort();
};

/*****************************************
 *
 * Spec Miscellany
 *
 *****************************************/

/**
 * The Strict Equality Comparison Algorithm
 * 
 * @method
 * @param {moduel:Base.BaseType} x The first value to compare
 * @param {moduel:Base.BaseType} y The second value to compare
 * @returns {Boolean} Whether or not the two equals are strictly equal
 * @see ECMA-262 Spec Chapter 11.9.6
 */
exports.strictEquals = strictEquals;
function strictEquals(x, y) {
	var typeX = type(x),
		typeY = type(y);
	
	if (typeX !== typeY) {
		return false;
	}
	
	switch(typeX) {
		case 'Undefined':
		case 'Null': return true;
		case 'Boolean':
		case 'Number':
		case 'String': return x.value === y.value;
		case 'Object': return x === y;
	}
}

exports.abstractEquality = abstractEquality;
function abstractEquality(x, y) {
	var typeX = type(x),
		typeY = type(y),
		xValue = x.value,
		yValue = y.value;
	
	// Step 1
	if (typeY === typeX) {
		if (typeX === 'Undefined' || typeX === 'Null') {
			return true;
		}
		if (typeX === 'Number') {
			if (isNaN(xValue) || isNaN(yValue)) {
				return false;
			}
			return xValue === yValue;
		}
		if (typeX === 'String') {
			return xValue === yValue;
		}
		if (typeX === 'Boolean') {
			return xValue === yValue;
		}
		return x === y;
	}
	
	// Step 2
	if (typeX === 'Undefined' && typeY === 'Null') {
		return true;
	}
	
	// Step 3
	if (typeX === 'Null' && typeY === 'Undefined') {
		return true;
	}
	
	// Step 4
	if (typeX === 'Number' && typeY === 'String') {
		return abstractEquality(x, toNumber(y));
	}
	
	// Step 5
	if (typeX === 'String' && typeY === 'Number') {
		return abstractEquality(toNumber(x), y);
	}
	
	// Step 6
	if (typeX === 'Boolean') {
		return abstractEquality(toNumber(x), y);
	}
	
	// Step 7
	if (typeY === 'Boolean') {
		return abstractEquality(x, toNumber(y));
	}
	
	// Step 8
	if (typeY === 'Object' && (typeX === 'String' || typeX === 'Number')) {
		return abstractEquality(x, toPrimitive(y));
	}
	
	// Step 8
	if (typeX === 'Object' && (typeY === 'String' || typeY === 'Number')) {
		return abstractEquality(toPrimitive(x), y);
	}
	
	// Step 9
	return false
}