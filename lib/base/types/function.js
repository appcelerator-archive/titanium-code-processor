/*****************************************
 *
 * Function Type Classes
 *
 *****************************************/

// ******** Function Type Base Class ********

/**
 * @classdesc The base for functions that are shared by the actual function type, and by native functions
 * 
 * @constructor
 * @extends module:Base.ObjectType
 * @param {Integer} length The number of formal parameters
 * @param {Boolean} [dontCreatePrototype] Always set to false. Only used by the function prototype itself to prevent
 *		infinite recursion
 * @param {String} [className] The name of the class
 * @see ECMA-262 Spec Chapter 13.2
 */  
exports.FunctionTypeBase = FunctionTypeBase;
function FunctionTypeBase(length, dontCreatePrototype, className) {
	
	var proto;
	
	ObjectType.call(this, className || 'Function', undefined, true);
	
	// Step 4
	if (!dontCreatePrototype) {
		Object.defineProperty(this, 'objectPrototype', {
			get: function () {
				return proto || prototypes['Function'];
			},
			set: function (value) {
				proto = value;
			},
			configurable: true
		});
	}
	
	// Step 9
	this.scope = Runtime.getModuleContext();
	
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
	
	// Step 16
	proto = new ObjectType();
	
	// Step 17
	proto.defineOwnProperty('constructor', {
		value: this,
		writable: true,
		enumerable: false,
		configurable: true
	}, false, true);
	
	// Step 18
	this.defineOwnProperty('prototype', {
		value: proto,
		writable: true,
		enumerable: false,
		configurable: false
	}, false, true);
	proto = undefined; // Reuse of variable
}
util.inherits(FunctionTypeBase, ObjectType);

/**
 * ECMA-262 Spec: <em>Returns the value of the named property.</em>
 * 
 * @method
 * @param {String} p The name of the property to fetch
 * @returns {{@link module:Base.BaseType}} The value of the property, or a new instance of {@link module:Base.UndefinedType} if 
 *		the property does not exist
 * @see ECMA-262 Spec Chapters 8.12.3 and 15.3.5.4
 */
FunctionTypeBase.prototype.get = function get(p) {
	var v = ObjectType.prototype.get.call(this, p);
	if (p === 'caller' && v.className === 'Function' && v.strict) {
		throwException('TypeError', 'Invalid identifier ' + p);
	}
	return v;
};

/**
 * Checks if the function has an instance of v (or something)
 * 
 * @method
 * @param {module:Base.BaseType} v The value to check against
 * @returns {Boolean} Whether or not this function has an instance of v
 * @see ECMA-262 Spec Chapter 15.3.5.3
 */
FunctionTypeBase.prototype.hasInstance = function hasInstance(v) {
	var o = this.get('prototype');
	
	if (type(v) !== 'Object') {
		return false;
	}
	if (type(o) !== 'Object') {
		throwException('TypeError', 'Value is not an object');
	}
	do {
		v = v.objectPrototype;
		if (o === v) {
			return true;
		}
	} while (v);
	return false;
};
 
/**
 * @classdesc A function object type
 *
 * @constructor
 * @extends module:Base.FunctionTypeBase
 * @param {Array[String]} formalParameterList The list of function arguments
 * @param {module:AST.node} functionBody The parsed body of the function
 * @param {module:Base.LexicalEnvironment} lexicalEnvironment The lexical environment of the function
 * @param {Boolean} strict Whether or not this is a strict mode function
 * @param {String} [className] The name of the class, defaults to 'Function.' This parameter should only be used by a 
 *		constructor for an object extending this one.
 * @see ECMA-262 Spec Chapter 13.2
 */
exports.FunctionType = FunctionType;
function FunctionType(formalParameterList, functionBody, lexicalEnvironemnt, strict, className) {
	
	// Steps 3 (implicit), 4, 13, 14, and 15 covered in the parent constructor
	FunctionTypeBase.call(this, formalParameterList ? formalParameterList.length : 0, false, className);
	
	// Step 9
	this.scope = lexicalEnvironemnt;
	
	// Steps 10 (implicit) and 11
	this.formalParameters = formalParameterList;
	
	// Step 12
	this.code = functionBody;
	
	// Store whether or not this is strict mode for easy access later
	this.strict = strict;
	
	// Store the filename so that it can be set properly when calling methods cross-file
	this.filename = Runtime.getCurrentFile();
	
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
 * @method
 * @param {module:Base.BaseType} thisVal The value of <code>this</code> of the function
 * @param (Array[{@link module:Base.BaseType}]} args The set of arguments passed in to the function call
 * @returns {module:Base.BaseType} The return value from the function
 * @see ECMA-262 Spec Chapter 13.2.1
 */
FunctionType.prototype.call = function call(thisVal, args) {
	
	var funcCtx,
		result,
		i,
		len;
	
	if (type(thisVal) === 'Unknown') {
		result = ['normal', new UnknownType(), undefined];
	} else {
		funcCtx = createFunctionContext(this, thisVal, args || []);
		
		// Enter the context
		Runtime.enterContext(funcCtx);
		
		// Execute the function body
		Runtime.setCurrentFile(this.filename);
		if (!this.code || this.code.length === 0) {
			result = ['normal', new UndefinedType(), undefined];
		} else {
			for (i = 0, len = this.code.length; i < len; i++) {
				result = RuleProcessor.processRule(this.code[i]);
				if (result && result.length === 3 && result[0] !== 'normal') {
					break;
				}
			}
		}
		Runtime.popCurrentFile();
		
		// Exit the context
		Runtime.exitContext();
		
		// Process the results
		if (result[0] === 'throw') {
			// Do nothing, but preserve the result value
		} else if (result[0] === 'return') {
			result = result[1];
		} else {
			result = new UndefinedType();
		}
	}
	
	return result;
};

/**
 * Invoked the method as a constructor
 * 
 * @method
 * @param (Array[{@link module:Base.BaseType}]} args The set of arguments passed in to the function call
 * @returns {module:Base.ObjectType} The object that was just created, or the return value of the constructor
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
	result = this.call(obj, args);
	
	// Return the result
	if (isType(result, ['Object', 'Unknown'])) {
		return result;
	}
	return obj;
};