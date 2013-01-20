/*global
AST
Runtime
RuleProcessor
FunctionTypeBase
util
areAnyUnknown
UnknownType
type
handleRecoverableNativeException
createEvalContext
UndefinedType
throwNativeException
toString
toInt32
NumberType
BooleanType
toNumber
StringType
ObjectType
addReadOnlyProperty
NullType
ArrayType
isCallable
toInteger
isUndefined
*/

/*****************************************
 *
 * Global methods and objects
 *
 *****************************************/

/**
 * eval method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.1.2.1
 */
function EvalFunction(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(EvalFunction, FunctionTypeBase);
EvalFunction.prototype.call = function call(thisVal, args, isDirectEval, filename) {

	// Variable declarations
	var x = args[0],
		ast,
		result;
	filename = filename || Runtime.getCurrentLocation().filename;

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	// Step 1
	if (type(x) !== 'String') {
		return x;
	}

	// Step 2
	ast = AST.parseString(x.value, filename);
	if (ast.syntaxError) {
		handleRecoverableNativeException('SyntaxError', ast.message, {
				filename: filename,
				line: ast.line,
				column: ast.col
			});
		return new UnknownType();
	}

	// Step 3
	createEvalContext(Runtime.getCurrentContext(), ast, RuleProcessor.isBlockStrict(ast), isDirectEval);

	// Step 4
	result = ast.processRule();

	// Step 5
	Runtime.exitContext();

	// Step 6
	if (result[0] === 'normal') {
		return result[1] ? result[1] : new UndefinedType();
	} else {
		if (result[1]) {
			if (result[1].className.match('Error$')) {
				throwNativeException(result[1].get('name'), result[1].get('message'));
			} else {
				throwNativeException('Error', toString(result[1]).value);
			}
		} else {
			throwNativeException('Error');
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
	FunctionTypeBase.call(this, 2, className || 'Function');
}
util.inherits(ParseIntFunction, FunctionTypeBase);
ParseIntFunction.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var string,
		radix,
		s,
		r;

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	// Steps 1, 2, and 6
	string = args[0];
	radix = args[1];
	s = toString(string).value.trim();
	r = radix && type(radix) !== 'Undefined' ? toInt32(radix).value : 10;

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
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ParseFloatFunction, FunctionTypeBase);
ParseFloatFunction.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var string,
		s;

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	// Steps 1 and 2
	string = args[0];
	s = toString(string).value.trim();

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
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(IsNaNFunction, FunctionTypeBase);
IsNaNFunction.prototype.call = function call(thisVal, args) {

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	// Use the built-in method to perform the isNaN
	return new BooleanType(isNaN(toNumber(args[0]).value));
};

/**
 * isFinite method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.1.2.5
 */
function IsFiniteFunction(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(IsFiniteFunction, FunctionTypeBase);
IsFiniteFunction.prototype.call = function call(thisVal, args) {

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	// Use the built-in method to perform the isFinite
	return new BooleanType(isFinite(toNumber(args[0]).value));
};

/**
 * decodeURI method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.1.3.1
 */
function DecodeURIFunction(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(DecodeURIFunction, FunctionTypeBase);
DecodeURIFunction.prototype.call = function call(thisVal, args) {

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	// Use the built-in method to perform the decodeURI
	return new StringType(decodeURI(toString(args[0]).value));
};

/**
 * decodeURIComponent method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.1.3.2
 */
function DecodeURIComponentFunction(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(DecodeURIComponentFunction, FunctionTypeBase);
DecodeURIComponentFunction.prototype.call = function call(thisVal, args) {

	// Use the built-in method to perform the decodeURI
	return new StringType(decodeURIComponent(toString(args[0]).value));
};

/**
 * encodeURI method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.1.3.3
 */
function EncodeURIFunction(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(EncodeURIFunction, FunctionTypeBase);
EncodeURIFunction.prototype.call = function call(thisVal, args) {

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	// Use the built-in method to perform the decodeURI
	return new StringType(encodeURI(toString(args[0]).value));
};

/**
 * encodeURIComponent method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.1.3.4
 */
function EncodeURIComponentFunction(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(EncodeURIComponentFunction, FunctionTypeBase);
EncodeURIComponentFunction.prototype.call = function call(thisVal, args) {

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	// Use the built-in method to perform the decodeURI
	return new StringType(encodeURIComponent(toString(args[0]).value));
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
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(MathAbsFunc, FunctionTypeBase);
MathAbsFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var x = args[0];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	if (!x) {
		return new NumberType(NaN);
	} else {
		return new NumberType(Math.abs(toNumber(x).value));
	}
};

/**
 * acos() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.2
 */
function MathAcosFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(MathAcosFunc, FunctionTypeBase);
MathAcosFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var x = args[0];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	if (!x) {
		return new NumberType(NaN);
	} else {
		return new NumberType(Math.acos(toNumber(x).value));
	}
};

/**
 * asin() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.3
 */
function MathAsinFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(MathAsinFunc, FunctionTypeBase);
MathAsinFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var x = args[0];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	return new NumberType(x ? Math.asin(toNumber(x).value) : NaN);
};

/**
 * atan() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.4
 */
function MathAtanFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(MathAtanFunc, FunctionTypeBase);
MathAtanFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var x = args[0];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	if (!x) {
		return new NumberType(NaN);
	} else {
		return new NumberType(Math.atan(toNumber(x).value));
	}
};

/**
 * atan2() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.5
 */
function MathAtan2Func(className) {
	FunctionTypeBase.call(this, 2, className || 'Function');
}
util.inherits(MathAtan2Func, FunctionTypeBase);
MathAtan2Func.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var x = args[0];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	if (!x) {
		return new NumberType(NaN);
	} else {
		return new NumberType(Math.abs(toNumber(x).value));
	}
};

/**
 * ceil() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.6
 */
function MathCeilFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(MathCeilFunc, FunctionTypeBase);
MathCeilFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var x = args[0];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	if (!x) {
		return new NumberType(NaN);
	} else {
		return new NumberType(Math.ceil(toNumber(x).value));
	}
};

/**
 * cos() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.7
 */
function MathCosFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(MathCosFunc, FunctionTypeBase);
MathCosFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var x = args[0];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	if (!x) {
		return new NumberType(NaN);
	} else {
		return new NumberType(Math.cos(toNumber(x).value));
	}
};

/**
 * exp() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.8
 */
function MathExpFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(MathExpFunc, FunctionTypeBase);
MathExpFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var x = args[0];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	if (!x) {
		return new NumberType(NaN);
	} else {
		return new NumberType(Math.exp(toNumber(x).value));
	}
};

/**
 * floor() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.9
 */
function MathFloorFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(MathFloorFunc, FunctionTypeBase);
MathFloorFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var x = args[0];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	if (!x) {
		return new NumberType(NaN);
	} else if (type(x) === 'Unknown') {
		return new UnknownType();
	} else {
		return new NumberType(Math.floor(toNumber(x).value));
	}
};

/**
 * log() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.10
 */
function MathLogFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(MathLogFunc, FunctionTypeBase);
MathLogFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var x = args[0];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	if (!x) {
		return new NumberType(NaN);
	} else {
		return new NumberType(Math.log(toNumber(x).value));
	}
};

/**
 * max() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.11
 */
function MathMaxFunc(className) {
	FunctionTypeBase.call(this, 2, className || 'Function');
}
util.inherits(MathMaxFunc, FunctionTypeBase);
MathMaxFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var i = 0,
		len = args.length,
		value,
		values = [];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	for(; i < len; i++) {
		value = toNumber(args[i]);
		if (type(value) === 'Unknown') {
			return new UnknownType();
		}
		values.push(toNumber(value).value);
	}
	return new NumberType(Math.max.apply(this, values));
};

/**
 * min() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.12
 */
function MathMinFunc(className) {
	FunctionTypeBase.call(this, 2, className || 'Function');
}
util.inherits(MathMinFunc, FunctionTypeBase);
MathMinFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var i = 0,
		len = args.length,
		value,
		values = [];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	for(; i < len; i++) {
		value = toNumber(args[i]);
		if (type(value) === 'Unknown') {
			return new UnknownType();
		}
		values.push(toNumber(value).value);
	}
	return new NumberType(Math.min.apply(this, values));
};

/**
 * pow() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.13
 */
function MathPowFunc(className) {
	FunctionTypeBase.call(this, 2, className || 'Function');
}
util.inherits(MathPowFunc, FunctionTypeBase);
MathPowFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var x = args[0],
		y = args[1];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	if (!x || !y) {
		return new NumberType(NaN);
	} else {
		return new NumberType(Math.pow(toNumber(x).value, toNumber(y).value));
	}
};

/**
 * random() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.14
 */
function MathRandomFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(MathRandomFunc, FunctionTypeBase);
MathRandomFunc.prototype.call = function call() {
	return new UnknownType();
};

/**
 * round() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.15
 */
function MathRoundFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(MathRoundFunc, FunctionTypeBase);
MathRoundFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var x = args[0];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	if (!x) {
		return new NumberType(NaN);
	} else {
		return new NumberType(Math.round(toNumber(x).value));
	}
};

/**
 * sin() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.16
 */
function MathSinFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(MathSinFunc, FunctionTypeBase);
MathSinFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var x = args[0];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	if (!x) {
		return new NumberType(NaN);
	} else {
		return new NumberType(Math.sin(toNumber(x).value));
	}
};

/**
 * sqrt() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.17
 */
function MathSqrtFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(MathSqrtFunc, FunctionTypeBase);
MathSqrtFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var x = args[0];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	if (!x) {
		return new NumberType(NaN);
	} else {
		return new NumberType(Math.sqrt(toNumber(x).value));
	}
};

/**
 * tan() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.17
 */
function MathTanFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(MathTanFunc, FunctionTypeBase);
MathTanFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var x = args[0];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	if (!x) {
		return new NumberType(NaN);
	} else {
		return new NumberType(Math.tan(toNumber(x).value));
	}
};

/**
 * Math Object
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8
 */
function MathObject(className) {
	ObjectType.call(this, className);

	// Properties
	addReadOnlyProperty(this, 'E', new NumberType(Math.E));
	addReadOnlyProperty(this, 'LN10', new NumberType(Math.LN10));
	addReadOnlyProperty(this, 'LN2', new NumberType(Math.LN2));
	addReadOnlyProperty(this, 'LOG2E', new NumberType(Math.LOG2E));
	addReadOnlyProperty(this, 'LOG10E', new NumberType(Math.LOG10E));
	addReadOnlyProperty(this, 'PI', new NumberType(Math.PI));
	addReadOnlyProperty(this, 'SQRT1_2', new NumberType(Math.SQRT1_2));
	addReadOnlyProperty(this, 'SQRT2', new NumberType(Math.SQRT2));

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
util.inherits(MathObject, ObjectType);

// ******** JSON Object ********

/**
 * parse() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.12.2
 */
function JSONParseFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(JSONParseFunc, FunctionTypeBase);
JSONParseFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var text = args[0],
		reviver = args[1],
		nativeObject;

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	// Parse the code
	try {
		nativeObject = JSON.parse(toString(text).value);
	} catch(e) {
		handleRecoverableNativeException('SyntaxError', e.message);
		return new UnknownType();
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
				if (type(v) !== 'Undefined') {
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
				return new UndefinedType();
			case 'null':
				return new NullType();
			case 'string':
				return new StringType(native);
			case 'number':
				return new NumberType(native);
			case 'boolean':
				return new BooleanType(native);
			case 'object':
				if (Array.isArray(native)) {
					converted = new ArrayType();
					for(i = 0, len = native.length; i < len; i++) {
						child = processObject(native[i]);
						setProperty(i, child, converted);
					}
				} else {
					converted = new ObjectType();
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
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(JSONStringifyFunc, FunctionTypeBase);
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
		return new UnknownType();
	}

	function str(key, holder) {

		// Step 1
		var value = holder.get(key),
			toJSON;

		// Step 2
		if (type(value) === 'Object') {
			toJSON = value.get('toJSON');
			if (type(toJSON) === 'Unknown') {
				throw 'Unknown';
			}
			if (isCallable(toJSON)) {
				value = toJSON.call(value, [key]);
			}
		}

		// Step 3
		if (replacerFunction) {
			value = replacerFunction.call(holder, [key, value]);
		}

		// Step 4
		if (type(value) == 'Object') {
			if (value.className === 'Number') {
				value = toNumber(value);
			}
			if (value.className === 'String') {
				value = toString(value);
			}
			if (value.className === 'Boolean') {
				value = new BooleanType(value.primitiveValue);
			}
		}

		// Steps 5-7
		if (type(value) === 'Null') {
			return 'null';
		} else if (value.value === false) {
			return 'false';
		} else if (value.value === true) {
			return 'true';
		}

		// Step 8
		if (type(value) === 'String') {
			return quote(value.value);
		}

		// Step 9
		if (type(value) === 'Number') {
			if (isFinite(value.value)) {
				return toString(value).value;
			} else {
				return 'null';
			}
		}

		// Step 10
		if (type(value) === 'Unknown') {
			throw 'Unknown';
		}
		if (type(value) === 'Object' && isCallable(value)) {
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
			handleRecoverableNativeException('TypeError');
			throw 'Unknown';
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
			value._getPropertyNames().forEach(function (p) {
				if (value._lookupProperty(p).enumerable) {
					k.push(p);
				}
			});
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
			handleRecoverableNativeException('TypeError');
			throw 'Unknown';
		}

		// Step 2
		stack.push(value);

		// Step 4
		indent += gap;

		// Step 6
		len = value.get('length').value;

		// Step 8
		while (index < len) {
			strP = str(toString(new NumberType(index)).value, value);
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
	if (replacer && type(replacer) === 'Object') {
		if (isCallable(replacer)) {
			replacerFunction = replacer;
		} else if (replacer.className === 'Array') {
			propertyList = [];
			for(i = 0, len = toInteger(replacer.get('length')).value; i < len; i++) {
				v = replacer.get(i);
				if (v.className === 'String' || v.className === 'Number') {
					v = toString(v).value;
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
			space = Math.min(10, toNumber(space).value);
			gap = (new Array(space)).join(' ');
		} else if (space.className === 'String') {
			gap = toString(space).value.substring(0, 9);
			space = space.value;
		} else {
			space = undefined;
			gap = '';
		}
	} else {
		gap = '';
	}

	// Step 10
	wrapper = new ObjectType();
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
			return new UnknownType();
		} else {
			throw e;
		}
	}
	if (isUndefined(result)) {
		return new UndefinedType();
	} else {
		return new StringType(result);
	}
};

/**
 * JSON Object
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.12
 */
function JSONObject(className) {
	ObjectType.call(this, className);

	this.put('parse', new JSONParseFunc(), false, true);
	this.put('stringify', new JSONStringifyFunc(), false, true);
}
util.inherits(JSONObject, ObjectType);