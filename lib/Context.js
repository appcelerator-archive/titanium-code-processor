/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @module Context
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

/*****************************************
 *
 * Chapter 10 - Execution of code
 *
 *****************************************/

// ******** DeclarativeEnvironmentRecord Class ********

/**
 * @classdesc ECMA-262 Spec: <em>Declarative environment records are used to define the effect of ECMAScript language 
 * syntactic elements such as FunctionDeclarations, VariableDeclarations, and Catch clauses that directly associate 
 * identifier bindings with ECMAScript language values. Each declarative environment record is associated with an 
 * ECMAScript program scope containing variable and/or function declarations. A declarative environment record binds the 
 * set of identifiers defined by the declarations contained within its scope.</em>
 * 
 * @constructor
 * @see ECMA-262 Spec Chapter 10.2.1
 */
exports.DeclarativeEnvironmentRecord = function DeclarativeEnvironmentRecord() {
	this._bindings = {};
};
var DeclarativeEnvironmentRecord = exports.DeclarativeEnvironmentRecord;

/**
 * ECMA-262 Spec: <em>The concrete environment record method HasBinding for declarative environment records simply 
 * determines if the argument identifier is one of the identifiers bound by the record</em>
 * 
 * @method
 * @param {String} n The name of the binding
 * @returns {Boolean} Whether or not this environment record has the binding
 * @see ECMA-262 Spec Chapter 10.2.1.1.1
 */
exports.DeclarativeEnvironmentRecord.prototype.hasBinding = function(n) {
	return n in this._bindings;
};

/**
 * ECMA-262 Spec: <em>The concrete Environment Record method CreateMutableBinding for declarative environment records 
 * creates a new mutable binding for the name n that is initialised to the value undefined. A binding must not already 
 * exist in this Environment Record for n. If Boolean argument d is provided and has the value true the new binding is 
 * marked as being subject to deletion.</em>
 * 
 * @method
 * @param {String} n The name of the binding
 * @param {Boolean} [d] Whether or not the binding can be deleted
 * @throws {{@link module:Exceptions.InvalidStateError}} Thrown if the binding already exists
 * @see ECMA-262 Spec Chapter 10.2.1.1.2
 */
exports.DeclarativeEnvironmentRecord.prototype.createMutableBinding = function(n, d) {
	var bindings = this._bindings;
	if (n in bindings) {
		throw new InvalidStateError("Could not create mutable binding: binding '" + n + "' already exists");
	}

	bindings[n] = {
		value: new UndefinedType(),
		isDeletable: !!d,
		isMutable: true
	}
};

/**
 * ECMA-262 Spec: <em>The concrete Environment Record method SetMutableBinding for declarative environment records 
 * attempts to change the bound value of the current binding of the identifier whose name is the value of the argument 
 * N to the value of argument v. A binding for n must already exist. If the binding is an immutable binding, a TypeError 
 * is thrown if s is true.</em>
 * 
 * @method
 * @param {String} n The name of the binding
 * @param {module:Base.BaseType} v The value to set on the binding
 * @param {Boolean} s Indicates strict mode, i.e. whether or not an error should be thrown if the binding is not mutable
 * @throws {{@link module:Exceptions.InvalidStateError}} Thrown if the binding does not exist
 * @throws {{@link module:Exceptions.TypeError}} Thrown if the binding is not mutable and s is true
 * @see ECMA-262 Spec Chapter 10.2.1.1.3
 */
exports.DeclarativeEnvironmentRecord.prototype.setMutableBinding = function(n, v, s) {
	var bindings = this._bindings;
	if (!n in bindings) {
		throw new InvalidStateError("Could not set mutable binding: binding '" + n + "' does not exist");
	}

	if (!bindings[n].isMutable) {
		if (s) {
			throw new TypeError("Could not set binding: binding '" + n + "' is not mutable");
		} else {
			return;
		}
	}

	bindings[n].value = v;
};

/**
 * ECMA-262 Spec: <em>The concrete Environment Record method GetBindingValue for declarative environment records simply 
 * returns the value of its bound identifier whose name is the value of the argument n. The binding must already exist. 
 * If s is true and the binding is an uninitialised immutable binding throw a ReferenceError exception.</em>
 * 
 * @method
 * @param {String} n The name of the binding
 * @param {Boolean} s Indicates strict mode, i.e. whether or not an error should be thrown if the binding has not been
 *		initialized
 * @returns {{@link module:Base.BaseType}} The value of the binding
 * @throws {{@link {@link module:Exceptions.InvalidStateError}} Thrown if the binding does not exist
 * @throws {module:Exceptions.ReferenceError}} Thrown if the binding has not been initialized
 * @see ECMA-262 Spec Chapter 10.2.1.1.4
 */
exports.DeclarativeEnvironmentRecord.prototype.getBindingValue = function(n, s) {

	var binding = this._bindings[n];
	if (!binding) {
		throw new InvalidStateError("Could not get value: binding '" + n + "' does not exist");
	}

	if (s && binding.isMutable && !binding.isInitialized) {
		throw new ReferenceError("Could not get value: binding '" + n + "' has not been initialized");
	}

	return bindings[n].value;
};

/**
 * ECMA-262 Spec: <em>The concrete Environment Record method DeleteBinding for declarative environment records can only 
 * delete bindings that have been explicitly designated as being subject to deletion.</em>
 * 
 * @method
 * @param {String} n The name of the binding
 * @returns {Boolean} Whether or not the binding has been deleted
 * @see ECMA-262 Spec Chapter 10.2.1.1.5
 */
exports.DeclarativeEnvironmentRecord.prototype.deleteBinding = function(n) {

	var binding = this._bindings[n];
	if (!binding) {
		return true;
	}

	if (!binding.isDeletable) {
		return false;
	}

	delete this._bindings[n];
	return true;
};

/**
 * ECMA-262 Spec: <em>Declarative Environment Records always return undefined as their ImplicitThisValue.</em>
 * 
 * @method
 * @returns {{@link module:Base.UndefinedType}} Always undefined
 * @see ECMA-262 Spec Chapter 10.2.1.1.6
 */
exports.DeclarativeEnvironmentRecord.prototype.implicitThisValue = function() {
	return new UndefinedType(); // Always return undefined for declarative environments
};

/**
 * ECMA-262 Spec: <em>The concrete Environment Record method CreateImmutableBinding for declarative environment records 
 * creates a new immutable binding for the name n that is initialised to the value undefined. A binding must not already 
 * exist in this environment record for n.</em>
 * 
 * @method
 * @param {String} n The name of the binding
 * @throws {{@link module:Exceptions.InvalidStateError}} Thrown if the binding already exists
 * @see ECMA-262 Spec Chapter 10.2.1.1.7
 */
exports.DeclarativeEnvironmentRecord.prototype.createImmutableBinding = function(n) {

	var bindings = this._bindings;
	if (n in bindings) {
		throw new InvalidStateError("Could not create immutable binding: binding '" + n + "' already exists");
	}

	bindings[n] = {
		value: new UndefinedType(),
		isDeletable: false,
		isMutable: false,
		isInitialized: false
	}
};

/**
 * ECMA-262 Spec: <em>The concrete Environment Record method InitializeImmutableBinding for declarative environment 
 * records is used to set the bound value of the current binding of the identifier whose name is the value of the 
 * argument n to the value of argument v. An uninitialised immutable binding for n must already exist.</em>
 * 
 * @method
 * @param {String} n The name of the binding
 * @param {module:Base.BaseType} v The value to initialize the binding to
 * @throws {{@link module:Exceptions.InvalidStateError}} Thrown if the binding does not exist
 * @throws {{@link module:Exceptions.InvalidStateError}} Thrown if the binding is not immutable or has already been initialized
 * @see ECMA-262 Spec Chapter 10.2.1.1.8
 */
exports.DeclarativeEnvironmentRecord.prototype.InitializeImmutableBinding = function(n, v) {

	var binding = this._bindings[n];
	if (!binding) {
		throw new InvalidStateError("Could not initialize immutable value: binding '" + n + "' does not exist");
	}

	if (binding.isInitialized !== false) {
		throw new InvalidStateError("Could not initialize immutable value: binding '" + n + "' has either been initialized already or is not an immutable value");
	}

	binding.value = v;
	binding.isInitialized = true;
};

// ******** ObjectEnvironmentRecord Class ********

/**
 * @classdesc ECMA-262 Spec: <em>Object environment records are used to define the effect of ECMAScript elements such as 
 * Program and WithStatement that associate identifier bindings with the properties of some object. Each object 
 * environment record is associated with an object called its binding object. An object environment record binds 
 * the set of identifier names that directly correspond to the property names of its binding object. Property names 
 * that are not an IdentifierName are not included in the set of bound identifiers. Both own and inherited properties 
 * are included in the set regardless of the setting of their [[enumerable]] attribute. Because properties can be 
 * dynamically added and deleted from objects, the set of identifiers bound by an object environment record may 
 * potentially change as a side-effect of any operation that adds or deletes properties. Any bindings that are created 
 * as a result of such a side-effect are considered to be a mutable binding even if the Writable attribute of the 
 * corresponding property has the value false. Immutable bindings do not exist for object environment records.</em>
 * 
 * @constructor
 * @see ECMA-262 Spec Chapter 10.2.1
 */
exports.ObjectEnvironmentRecord = function ObjectEnvironmentRecord(bindingObject) {
	this._bindingObject = bindingObject;
};
var ObjectEnvironmentRecord = exports.ObjectEnvironmentRecord;

/**
 * ECMA-262 Spec: <em>The concrete Environment Record method HasBinding for object environment records determines if its 
 * associated binding object has a property whose name is the value of the argument n</em>
 * 
 * @method
 * @param {String} n The name of the binding
 * @returns {Boolean} Whether or not this environment record has the binding
 * @see ECMA-262 Spec Chapter 10.2.1.2.1
 */
exports.ObjectEnvironmentRecord.prototype.hasBinding = function(n) {
	return this._bindingObject.hasProperty(n);
};

/**
 * ECMA-262 Spec: <em>The concrete Environment Record method CreateMutableBinding for object environment records creates 
 * in an environment record‘s associated binding object a property whose name is the String value and initialises it to 
 * the value undefined. A property named n must not already exist in the binding object. If Boolean argument d is 
 * provided and has the value true the new property‘s [[configurable]] attribute is set to true, otherwise it is set to 
 * false.</em>
 * 
 * @method
 * @param {String} n The name of the binding
 * @param {Boolean} [d] Whether or not the binding can be deleted
 * @throws {{@link module:Exceptions.InvalidStateError}} Thrown if the binding already exists
 * @see ECMA-262 Spec Chapter 10.2.1.2.2
 */
exports.ObjectEnvironmentRecord.prototype.createMutableBinding = function(n, d) {
	var bindingObject = this._bindingObject;
	if (bindingObject.hasProperty(n)) {
		throw new InvalidStateError("Could not create mutable binding: binding '" + n + "' already exists");
	}

	bindingObject.defineOwnProperty(n, {
		value: new UndefinedType(),
		writeable: true,
		enumerable: true,
		configurable: !!d
	}, true);
};

/**
 * ECMA-262 Spec: <em>The concrete Environment Record method SetMutableBinding for object environment records attempts 
 * to set the value of the environment record‘s associated binding object‘s property whose name is the value of the 
 * argument n to the value of argument V. A property named N should already exist but if it does not or is not currently 
 * writable, error handling is determined by the value of the Boolean argument s.</em>
 * 
 * @method
 * @param {String} n The name of the binding
 * @param {module:Base.BaseType} v The value to set on the binding
 * @param {Boolean} s Indicates strict mode, i.e. whether or not an error should be thrown if the binding is not mutable
 * @see ECMA-262 Spec Chapter 10.2.1.2.3
 */
exports.ObjectEnvironmentRecord.prototype.setMutableBinding = function(n, v, s) {
	this._bindingObject.put(n, v, s);
};

/**
 * ECMA-262 Spec: <em>The concrete Environment Record method SetMutableBinding for object environment records attempts 
 * to set the value of the environment record‘s associated binding object‘s property whose name is the value of the 
 * argument n to the value of argument v. A property named N should already exist but if it does not or is not currently 
 * writable, error handling is determined by the value of the Boolean argument s.</em>
 * 
 * @method
 * @param {String} n The name of the binding
 * @param {Boolean} s Indicates strict mode, i.e. whether or not an error should be thrown if the binding has not been
 *		initialized
 * @returns {{@link module:Base.BaseType}} The value of the binding
 * @throws {{@link module:Exceptions.ReferenceError}} Thrown if the binding does not exist
 * @see ECMA-262 Spec Chapter 10.2.1.2.4
 */
exports.ObjectEnvironmentRecord.prototype.getBindingValue = function(n, s) {
	var bindingObject = this._bindingObject;
	if (!bindingObject.hasProperty(n)) {
		if (s) {
			throw new Exceptions.ReferenceError();
		}
		return undefined;
	}

	return bindingObject.get(n);
};

/**
 * ECMA-262 Spec: <em>The concrete Environment Record method DeleteBinding for object environment records can only 
 * delete bindings that correspond to properties of the environment object whose [[configurable]] attribute have the 
 * value true.</em>
 * 
 * @method
 * @param {String} n The name of the binding
 * @returns {Boolean} Whether or not the binding has been deleted
 * @see ECMA-262 Spec Chapter 10.2.1.2.5
 */
exports.ObjectEnvironmentRecord.prototype.deleteBinding = function(n) {
	return this._bindingObject["delete"](n, false);
};

/**
 * ECMA-262 Spec: <em>Object Environment Records return undefined as their ImplicitThisValue unless their provideThis 
 * flag is true.</em>
 * 
 * @method
 * @returns {{@link module:Base.BaseType}} The value of this, if it exists
 * @see ECMA-262 Spec Chapter 10.2.1.2.6
 */
exports.ObjectEnvironmentRecord.prototype.implicitThisValue = function() {
	if (this.provideThis) {
		return this._bindingObject;
	} else {
		return new UndefinedType();
	}
};

// ******** Lexical Environment ********

/**
 * @classdesc ECMA-262 Spec: <em>A Lexical Environment is a specification type used to define the association of 
 * Identifiers to specific variables and functions based upon the lexical nesting structure of ECMAScript code. A 
 * Lexical Environment consists of an Environment Record and a possibly null reference to an outer Lexical Environment. 
 * Usually a Lexical Environment is associated with some specific syntactic structure of ECMAScript code such as a 
 * FunctionDeclaration, a WithStatement, or a Catch clause of a TryStatement and a new Lexical Environment is created 
 * each time such code is evaluated.</em>
 * 
 * @constructor
 * @param {module:Base.DeclarativeEnvironmentRecord|module:Base.ObjectEnvironmentRecord} [envRec] The environment record
 *		to associate with the new lexical environment
 * @param {module:Base.LexicalEnvironment} [outer] The outer lexical environment
 * @property {module:Base.DeclarativeEnvironmentRecord|module:Base.ObjectEnvironmentRecord} envRec The environment 
 *		record associated with this lexical environment
 * @property {module:Base.LexicalEnvironment|null} outer The outer lexical environment of this lexical environment, if it
 *		exists
 * @see ECMA-262 Spec Chapter 10.2
 */
exports.LexicalEnvironment = function LexicalEnvironment(envRec, outer) {
	this.envRec = envRec;
	this.outer = outer || null;
};
var LexicalEnvironment = exports.LexicalEnvironment;

// ******** Lexical Environment Operations ********

/**
 * ECMA-262 Spec: <em>The abstract operation GetIdentifierReference is called with a Lexical Environment lex, an 
 * identifier String name, and a Boolean flag strict. The value of lex may be null.</em>
 * 
 * @method
 * @param {module:Base.LexicalEnvironment|null} lex The lexical environment to search
 * @see ECMA-262 Spec Chapter 10.2.2.1
 */
exports.getIdentifierReference = function getIdentifierReference(lex, name, strict) {
	var newRef;
	if (lex === null) {
		newRef = new Reference();
		newRef.baseValue = new UndefinedType();
		newRef.referencedName = name;
		newRef.strictReference = strict;
		return newRef;
	}
	if (lex.envRec.hasBinding(name)) {
		newRef = new Reference();
		newRef.baseValue = lex.envRef;
		newRef.referencedName = name;
		newRef.strictReference = strict;
		return newRef;
	} else {
		return lex.outer.getIdentifierReference(lex, name, strict);
	}
}
var getIdentifierReference = exports.getIdentifierReference;

/**
 * Creates a new lexical environment with a declarative environment record
 * 
 * @method
 * @param {module:Base.LexicalEnvironment|null} e The outer lexical environment of the new lexical environment
 * @returns {{@link module:Base.LexicalEnvironment} The newly created lexical environment
 * @see ECMA-262 Spec Chapter 10.2.2.2
 */
exports.NewDeclarativeEnvironment = function NewDeclarativeEnvironment(e) {
	return new LexicalEnvironment(new DeclarativeEnvironmentRecord(), e);
};
var NewDeclarativeEnvironment = exports.NewDeclarativeEnvironment;

/**
 * Creates a new lexical environment with an object environment record
 * 
 * @method
 * @param {module:Base.ObjectType} o The binding object
 * @param {module:Base.LexicalEnvironment|null} e The outer lexical environment of the new lexical environment
 * @returns {{@link module:Base.LexicalEnvironment} The newly created lexical environment
 * @see ECMA-262 Spec Chapter 10.2.2.3
 */
exports.NewObjectEnvironment = function NewObjectEnvironment(o, e) {
	return new LexicalEnvironment(new ObjectEnvironmentRecord(o), e);
};
var NewObjectEnvironment = exports.NewObjectEnvironment;

// ******** Execution Context ********

/**
 * @classdesc ECMA-262 Spec: <em>When control is transferred to ECMAScript executable code, control is entering an 
 * execution context. Active execution contexts logically form a stack. The top execution context on this logical stack 
 * is the running execution context. A new execution context is created whenever control is transferred from the 
 * executable code associated with the currently running execution context to executable code that is not associated 
 * with ￼that execution context. The newly created execution context is pushed onto the stack and becomes the running 
 * execution context. An execution context contains whatever state is necessary to track the execution progress of its 
 * associated code.</em>
 * 
 * @constructor
 * @property {module:Base.LexicalEnvironment} lexicalEnvironment ECMA-262 Spec: <em>Identifies the Lexical Environment 
 *		used to resolve identifier references made by code within this execution context.</em>
 * @property {module:Base.LexicalEnvironment} variableEnvironment ECMA-262 Spec: <em>Identifies the Lexical Environment 
 *		whose environment record holds bindings created by VariableStatements and FunctionDeclarations within this 
 *		execution context.</em>
 * @property {module:Base.ObjectType} thisBinding ECMA-262 Spec: <em>The value associated with the this keyword within 
 *		ECMAScript code associated with this execution context.</em>
 */
exports.ExecutionContext = function ExecutionContext(lexicalEnvironment, variableEnvironment, thisBinding) {
	this.lexicalEnvironment = lexicalEnvironment || null;
	this.variableEnvironment = variableEnvironment || null;
	this.thisBinding = thisBinding || null;
};
var ExecutionContext = exports.ExecutionContext;

// ******** Context Creation Methods ********

/**
 * Determines whether or not the supplied code contains a use strict directive
 * 
 * @method
 * @param {UglifyJS AST} code The code to check
 * @returns {Boolean} Whether or not the code contains a use strict directive
 */
exports.containsUseStrict = function containsUseStrict(code) {
	return !!(code[1][0] && code[1][0][0].name === "directive" && code[1][0][1] === "use strict");
};
var containsUseStrict = exports.containsUseStrict;

/**
 * This method recursively finds all function declared within code
 * 
 * @private
 * @method
 */
function findFunctionDeclarations(code) {
	// TODO: implement me
}

/**
 * This method recursively finds all variables declared within code
 * 
 * @private
 * @method
 */
function findVariableDeclarations(code) {
	// TODO: implement me
}

/**
 * Creates the global context
 * 
 * @method
 * @param {UglifyJS AST} code The code associated with this global context
 * @returns {module:Base.ExecutionContext} The new global execution context
 * @see ECMA-262 Spec Chapter 10.4.1
 */
exports.createGlobalContext = function createGlobalContext(code) {

	// Create the context
	var strict = containsUseStrict(code),
		globalObject = new ObjectType(),
		env = NewObjectEnvironment(globalObject, null),
		configurableBindings = false,
		executionContext = new ExecutionContext(
			NewObjectEnvironment(globalObject, null),
			env,
			globalObject
		),
		len, i;
	
	// TODO: Bind the function and variable declarations to the global context
	
	// Return the context
	return executionContext;
};

/**
 * Creates an eval context
 * 
 * @method
 * @param {module:Base.ExecutionContext|null} callingContext The context that is evaling code
 * @param {UglifyJS AST} code The code associated with this eval context
 * @returns {module:Base.ExecutionContext} The new eval execution context
 * @see ECMA-262 Spec Chapter 10.4.2
 */
exports.createEvalContext = function createEvalContext(callingContext, code) {
	
	// Create or set the execution context
	var executionContext,
		strict = containsUseStrict(code);
	if (callingContext) {
		executionContext = callingContext;
	} else {
		executionContext = new ExecutionContext(
			NewObjectEnvironment(globalObject, null),
			NewObjectEnvironment(globalObject, null),
			new ObjectType()
		);
	}
	
	// TODO: Bind the function and variable declarations to the global context
	
	// Create the inner lexical environment if this is strict mode code
	if (exports.containsUseStrict(code)) {
		executionContext.variableEnvironment = NewDeclarativeEnvironment(executionContext.lexicalEnvironment);
		executionContext.lexicalEnvironment = NewDeclarativeEnvironment(executionContext.lexicalEnvironment);
	}
	
	return executionContext;
};

/**
 * Creates a function context
 * 
 * @method
 * @param {module:Base.ObjectType} functionObject The function object of the context to be created.
 * @param {module:Base.ObjectType} thisArg The object to bind the this pointer to
 * @param {Array} argumentsList The list of function arguments
 * @returns {module:Base.ExecutionContext} The new global execution context
 * @see ECMA-262 Spec Chapter 10.4.3
 */
exports.createFunctionContext = function createFunctionContext(functionObject, thisArg, argumentsList) {
	// TODO: Bind the function and variable declarations to the global context
};

// ******** VM Initialization ********

/**
 * The stack of current contexts
 * 
 * @type Array
 */
exports.contextStack = [];

/**
 * Initializes the ECMAScript VM by creating the true global context (i.e. where window and document reside)
 * 
 * @method
 */
exports.initVM = function() {
	exports.contextStack.push(createGlobalContext(["toplevel",[]]));
};
