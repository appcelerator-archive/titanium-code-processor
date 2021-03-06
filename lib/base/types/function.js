/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Definition for the function type
 *
 * @module base/types/function
 */
/*global
Runtime,
util,
ObjectType,
prototypes,
NumberType,
handleRecoverableNativeException,
type,
UnknownType,
throwNativeException,
throwTypeError,
createFunctionContext,
UndefinedType,
isType,
isAmbiguousBlock,
exitContext,
getModuleContext,
processInSkippedMode
*/

/*****************************************
 *
 * Function Type Classes
 *
 *****************************************/

// ******** Function Type Base Class ********

/**
 * @classdesc The base for functions that are shared by the actual function type, and by native functions
 *
 * @constructor module:base/types/function.FunctionTypeBase
 * @extends module:base/types/function.ObjectType
 * @param {number} length The number of formal parameters
 * @param {string} [className] The name of the class
 * @see ECMA-262 Spec Chapter 13.2
 */
exports.FunctionTypeBase = FunctionTypeBase;
function FunctionTypeBase(length, className) {

	var proto;

	ObjectType.call(this, className || 'Function');

	// Step 4
	Object.defineProperty(this, 'objectPrototype', {
		get: function () {
			return proto || prototypes.Function;
		},
		set: function (value) {
			proto = value;
		},
		configurable: true
	});

	// Step 9
	this.scope = getModuleContext();

	// Steps 10 (implicit) and 11, defaulting to empty (FunctionType overrides it)
	this.formalParameters = [];

	// Step 13
	this.extensible = true;

	// Step 14 and 15
	this.defineOwnProperty('length', {
		value: new NumberType(length),
		writable: false,
		enumerable: false,
		configurable: false
	}, false, true);

	// Step 17
	this.defineOwnProperty('constructor', {
		value: this,
		writable: true,
		enumerable: false,
		configurable: true
	}, false, true);
}
util.inherits(FunctionTypeBase, ObjectType);

/**
 * ECMA-262 Spec: <em>Returns the value of the named property.</em>
 *
 * @method module:base/types/function.FunctionTypeBase#get
 * @param {string} p The name of the property to fetch
 * @param {boolean} alternate Whether or not to fetch the alternate values, or the base value
 * @return {module:base.BaseType} The value of the property, or a new instance of {@link module:base/types/undefined.UndefinedType} if
 *		the property does not exist
 * @see ECMA-262 Spec Chapters 8.12.3 and 15.3.5.4
 */
FunctionTypeBase.prototype.get = function get(p, alternate) {
	var v = ObjectType.prototype.get.call(this, p, alternate);
	if (p === 'caller' && v.className === 'Function' && v.strict) {
		handleRecoverableNativeException('TypeError', 'Invalid identifier ' + p);
		return new UnknownType();
	}
	return v;
};

/**
 * Checks if the function has an instance of v (or something, not exactly sure)
 *
 * @method module:base/types/function.FunctionTypeBase#hasInstance
 * @param {module:base.BaseType} v The value to check against
 * @return {boolean} Whether or not this function has an instance of v
 * @see ECMA-262 Spec Chapter 15.3.5.3
 */
FunctionTypeBase.prototype.hasInstance = function hasInstance(v) {
	var o = this.get('prototype');

	if (type(v) !== 'Object') {
		return false;
	}
	if (type(o) !== 'Object') {
		throwNativeException('TypeError', 'Value is not an object');
	}
	do {
		v = v.objectPrototype;
		if (o === v) {
			return true;
		}
	} while (v && v !== v.objectPrototype);
	return false;
};

/**
 * @classdesc A function object type
 *
 * @constructor module:base/types/function.FunctionType
 * @extends module:base/types/function.FunctionTypeBase
 * @param {Array.<String>} formalParameterList The list of function arguments
 * @param {module:AST.node} ast The parsed body of the function
 * @param {module:base/context~LexicalEnvironment} lexicalEnvironment The lexical environment of the function
 * @param {boolean} strict Whether or not this is a strict mode function
 * @param {string} [className] The name of the class, defaults to 'Function.' This parameter should only be used by a
 *		constructor for an object extending this one.
 * @see ECMA-262 Spec Chapter 13.2
 */
exports.FunctionType = FunctionType;
function FunctionType(formalParameterList, ast, lexicalEnvironment, strict, className) {

	// Steps 3 (implicit), 4, 13, 14, and 15 covered in the parent constructor
	FunctionTypeBase.call(this, formalParameterList ? formalParameterList.length : 0, className);

	// Step 9
	this.scope = lexicalEnvironment;

	// Steps 10 (implicit) and 11
	this.formalParameters = formalParameterList;

	// Step 12
	this.code = ast && ast.body;
	this._ast = ast;

	// Store whether or not this is strict mode for easy access later
	this.strict = strict;

	// Steps 16 and 18
	this.defineOwnProperty('prototype', {
		value: new ObjectType(),
		writable: true,
		enumerable: false,
		configurable: false
	}, false, true);

	// Step 19
	if (strict) {
		this.defineOwnProperty('caller', {
			get: throwTypeError,
			set: throwTypeError,
			enumerable: false,
			configurable: false
		}, false, true);
		this.defineOwnProperty('arguments', {
			get: throwTypeError,
			set: throwTypeError,
			enumerable: false,
			configurable: false
		}, false, true);
	}
}
util.inherits(FunctionType, FunctionTypeBase);

// ******** Function Type Class ********

/**
 * Calls the function
 *
 * @method module:base/types/function.FunctionType#callFunction
 * @param {module:base.BaseType} thisVal The value of <code>this</code> of the function
 * @param (Array.<module:base.BaseType>} args The set of arguments passed in to the function call
 * @param {Object} options The call options
 * @param {boolean} options.ambiguousContext Whether or not to call as an ambiguous function
 * @param {boolean} options.alwaysInvoke When true, ignores the invokeMethods option
 * @return {module:base.BaseType} The return value from the function
 * @see ECMA-262 Spec Chapter 13.2.1
 */
FunctionType.prototype.callFunction = function callFunction(thisVal, args, options) {

	var funcCtx,
		result,
		i, j,
		len,
		inAmbiguousBlock = isAmbiguousBlock();

	if (!Runtime.options.invokeMethods && !(options && options.alwaysInvoke)) {
		result = new UnknownType();
	} else {
		funcCtx = createFunctionContext(this, thisVal, args || []);
		funcCtx.lexicalEnvironment.envRec._ambiguousContext = !!(options && options.isAmbiguousContext) || inAmbiguousBlock;

		// Execute the function body
		try {
			if (!this.code || this.code.length === 0) {
				result = ['normal', new UndefinedType(), undefined];
			} else {
				for (i = 0, len = this.code.length; i < len; i++) {
					try {
						result = this.code[i].processRule();
					} catch(e) {
						if (!RuleProcessor.inRecursionUnroll()) {
							processInSkippedMode(function () {
								for (j = i + 1; j < len; j++) {
									this.code[j].processRule();
								}
							}.bind(this));
						}
						throw e;
					}
					this.code[i]._ambiguousContext = this.code[i]._ambiguousContext || funcCtx.lexicalEnvironment._ambiguousContext;
					if (result && result.length === 3 && result[0] !== 'normal') {
						processInSkippedMode(function () {
							for (j = i + 1; j < len; j++) {
								this.code[j].processRule();
							}
						}.bind(this));
						break;
					}
				}
			}
		} finally {
			// Exit the context
			exitContext();
		}

		// Process the results
		if (result[0] !== 'throw') {
			if (result[0] === 'return') {
				result = result[1];
			} else {
				result = new UndefinedType();
			}
			result = funcCtx._returnIsUnknown ? new UnknownType() : result;
		}
	}

	return result;
};

/**
 * Invoked the method as a constructor
 *
 * @method module:base/types/function.FunctionType#construct
 * @param (Array.<module:base.BaseType>} args The set of arguments passed in to the function call
 * @return {module:base/types/object.ObjectType} The object that was just created, or the return value of the constructor
 * @see ECMA-262 Spec Chapter 13.2.2
 */
FunctionType.prototype.construct = function construct(args) {
	var obj = new ObjectType(),
		proto = this.get('prototype'),
		result;
	obj.extensible = true;

	// Hook up the prototype
	if (isType(proto, ['Object', 'Unknown'])) {
		obj.objectPrototype = proto;
	}

	// Invoke the constructor
	result = this.callFunction(obj, args);

	// Return the result
	if (isType(result, ['Object', 'Unknown'])) {
		return result;
	}
	return obj;
};