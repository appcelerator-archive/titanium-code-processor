/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @module Context
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */
 
var util = require("util"),
	Base = require("./Base"),
	Runtime = require("./Runtime"),
	Exceptions = require("./Exceptions"),
	RuleProcessor = require("./RuleProcessor");

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
		throw new Exceptions.InvalidStateError("Could not create mutable binding: binding '" + n + "' already exists");
	}

	bindings[n] = {
		value: new Base.UndefinedType(),
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
		throw new Exceptions.InvalidStateError("Could not set mutable binding: binding '" + n + "' does not exist");
	}

	if (!bindings[n].isMutable) {
		if (s) {
			throw new Exceptions.TypeError("Could not set binding: binding '" + n + "' is not mutable");
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
		throw new Exceptions.InvalidStateError("Could not get value: binding '" + n + "' does not exist");
	}

	if (s && binding.isMutable && !binding.isInitialized) {
		throw new Exceptions.ReferenceError("Could not get value: binding '" + n + "' has not been initialized");
	}

	return binding.value;
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
	return new Base.UndefinedType(); // Always return undefined for declarative environments
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
		throw new Exceptions.InvalidStateError("Could not create immutable binding: binding '" + n + "' already exists");
	}

	bindings[n] = {
		value: new Base.UndefinedType(),
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
		throw new Exceptions.InvalidStateError("Could not initialize immutable value: binding '" + n + "' does not exist");
	}

	if (binding.isInitialized !== false) {
		throw new Exceptions.InvalidStateError("Could not initialize immutable value: binding '" + n + "' has either been initialized already or is not an immutable value");
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
 * as a result of such a side-effect are considered to be a mutable binding even if the writable attribute of the 
 * corresponding property has the value false. Immutable bindings do not exist for object environment records.</em>
 * 
 * @constructor
 * @see ECMA-262 Spec Chapter 10.2.1
 */
exports.ObjectEnvironmentRecord = function ObjectEnvironmentRecord(bindingObject) {
	if (!bindingObject) { throw "";}
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
		throw new Exceptions.InvalidStateError("Could not create mutable binding: binding '" + n + "' already exists");
	}

	bindingObject.defineOwnProperty(n, {
		value: new Base.UndefinedType(),
		writable: true,
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
		return new Base.UndefinedType();
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
		return new Base.UndefinedType();
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
	if (!lex) {
		newRef = new Base.ReferenceType();
		newRef.baseValue = new Base.UndefinedType();
		newRef.referencedName = name;
		newRef.strictReference = strict;
		return newRef;
	}
	if (lex.envRec.hasBinding(name)) {
		newRef = new Base.ReferenceType();
		newRef.baseValue = lex.envRec;
		newRef.referencedName = name;
		newRef.strictReference = strict;
		return newRef;
	} else {
		return getIdentifierReference(lex.outer, name, strict);
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
 * @property {Boolean} strict Indicates whether or not this execution context is strict mode
 */
exports.ExecutionContext = function ExecutionContext(lexicalEnvironment, variableEnvironment, thisBinding, strict) {
	this.lexicalEnvironment = lexicalEnvironment || null;
	this.variableEnvironment = variableEnvironment || null;
	this.thisBinding = thisBinding || null;
	this.strict = strict !== undefined ? strict : false;
};
var ExecutionContext = exports.ExecutionContext;

// ******** Context Creation Methods ********

/**
 * @private
 */
function findDeclarations(ast) {
	var functions = [],
		variables = [],
		nodeStack = [ast],
		node,
		name,
		i, len;
	
	// "Recursively" find all declarations
	while(nodeStack.length) {
		node = nodeStack.pop();
		name = RuleProcessor.getRuleName(node);
		if (name === "defun") {
			functions.push({
				functionName: node[1],
				formalParameterList: node[2],
				functionBody: node[3]
			});
		} else if (name === "var") {
			for(i = 0, len = node[1].length; i < len; i++) {
				variables.push({
					variableName: node[1][i][0]
				});
			}
		} else {
			
			// Each node is a little different when it comes to children, so we have to parse them separately
			switch(name) {
				case "if":
					node[2] && (nodeStack = nodeStack.concat([node[2]]));
					node[3] && (nodeStack = nodeStack.concat([node[3]]));
					break;
				
				case "do":
					nodeStack = nodeStack.concat([node[2]]);
					break;
				
				case "while":
					nodeStack = nodeStack.concat([node[2]]);
					break;
				
				case "for":
					nodeStack = nodeStack.concat([node[4]]);
					break;
				
				case "for-in":
					nodeStack = nodeStack.concat([node[4]]);
					break;
				
				case "try":
					node[1] && (nodeStack = nodeStack.concat(node[1]));
					node[2] && (nodeStack = nodeStack.concat(node[2][1]));
					node[3] && (nodeStack = nodeStack.concat(node[3]));
					break;
				
				case "switch":
					for(i = 0, len = node[2].length; i < len; i++) {
						nodeStack = nodeStack.concat(node[2][i][1]);
					}
					break;
					
				case "block":
					node[1] && (nodeStack = nodeStack.concat(node[1]));
					break;
					
				case "toplevel":
					nodeStack = nodeStack.concat(node[1]);
					break;
			}
		}
	}
	
	return {
		functions: functions,
		variables: variables
	};
}

/**
 * Creates the global context
 * 
 * @method
 * @param {module:AST.node} ast The AST associated with this global context
 * @returns {module:Base.ExecutionContext} The new global execution context
 * @see ECMA-262 Spec Chapter 10.4.1 and Chapter 10.5
 */
exports.createGlobalContext = function createGlobalContext(ast, strict) {
	
	// Create the context
	var globalObject = new Base.ObjectType(),
		env = NewObjectEnvironment(globalObject, Runtime.globalContext.variableEnvironment),
		configurableBindings = false,
		executionContext = new ExecutionContext(
			env,
			env,
			globalObject,
			strict
		),
		len, i,
		functions, variables, result;
	env = executionContext.variableEnvironment.envRec;
	result = findDeclarations(ast);
	functions = result.functions;
	variables = result.variables;
	
	// Find all of the function declarations and bind them
	for (i = 0, len = functions.length; i < len; i++) {
		var fn = functions[i].functionName,
			fo = new FunctionType(functions[i].formalParameterList, functions[i].functionBody, executionContext.lexicalEnvironment, 
				strict || !!(functions[i].functionBody[0] && functions[i].functionBody[0][0].name === "directive" && 
				functions[i].functionBody[0][1] === "use strict")),
			funcAlreadyDeclared = env.hasBinding(fn),
			existingProp,
			descriptor;
			
		if (!funcAlreadyDeclared) {
			env.createMutableBinding(fn, configurableBindings);
		} else {
			existingProp = globalObject.getProperty(fn);
			if (existingProp.configurable) {
				descriptor = new Base.DataPropertyDescriptor();
				descriptor.writable = true;
				descriptor.enumerable = true;
				descriptor.configurable = configurableBindings;
				globalObject.defineOwnProperty(fn, descriptor, true);
			} else if (Base.isAccessorDescriptor(existingProp) || (existingProp.writable !== true && 
					existingProp.enumerable !== true)) {
				throw new Exceptions.TypeError();
			}
		}
		
		env.setMutableBinding(fn, fo, strict);
	}
	
	// Find all of the variable declarations and bind them
	for(i = 0, len = variables.length; i < len; i++) {
		var dn = variables[i].variableName,
			varAlreadyDeclared = env.hasBinding(dn);
		
		if (!varAlreadyDeclared) {
			env.createMutableBinding(dn, configurableBindings);
			env.setMutableBinding(dn, new Base.UndefinedType(), strict);
		}
	}
	
	// Return the context
	return executionContext;
};
var createGlobalContext = exports.createGlobalContext;

/**
 * Creates an eval context
 * 
 * @method
 * @param {module:Base.ExecutionContext|null} callingContext The context that is evaling code
 * @param {module:AST.node} code The code associated with this eval context
 * @returns {module:Base.ExecutionContext} The new eval execution context
 * @see ECMA-262 Spec Chapter 10.4.2 and Chapter 10.5
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
			new Base.ObjectType()
		);
	}
	
	// TODO: Bind the function and variable declarations to the global context
	throw new Error("IMPLEMENT ME");
	
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
 * @see ECMA-262 Spec Chapter 10.4.3 and Chapter 10.5
 */
exports.createFunctionContext = function createFunctionContext(functionObject, thisArg, argumentsList) {
	
	// Create the context
	var env = NewDeclarativeEnvironment(functionObject.scope),
		configurableBindings = false,
		strict = functionObject.strict,
		executionContext = new ExecutionContext(
			env,
			env,
			functionObject,
			strict
		),
		len, i,
		arg, argName,
		functions, variables, result,
		thisArgType = Base.type(thisArg),
		thisBinding;
	env = executionContext.variableEnvironment.envRec;
	result = findDeclarations(["toplevel", functionObject.code]);
	functions = result.functions;
	variables = result.variables;
	
	// Create the this binding
	if (functionObject.strict) {
		thisBinding = thisArg;
	} else if (thisArgType === "Null" || thisArgType === "Undefined") {
		thisBinding = Runtime.contextStack[1]; // Use the "global" object as created in "toplevel," equivalent to module scope in node.js
	} else if (thisArgType !== "Object") {
		thisBinding = Base.toObject(thisArg);
	} else {
		thisBinding = thisArg;
	}
	
	// Initialize the arguments
	for (i = 0, len = functionObject.formalParameters.length; i < len; i++) {
		arg = argumentsList[i];
		argName = functionObject.formalParameters[i];
		if (!arg) {
			arg = new Base.UndefinedType();
		}
		if (!env.hasBinding(argName)) {
			env.createMutableBinding(argName);
		}
		env.setMutableBinding(argName, arg, strict);
	}
	
	// Find all of the function declarations and bind them
	for (i = 0, len = functions.length; i < len; i++) {
		var fn = functions[i].functionName,
			fo = new FunctionType(functions[i].formalParameterList, functions[i].functionBody, executionContext.lexicalEnvironment, 
				strict || !!(functions[i].functionBody[0] && functions[i].functionBody[0][0].name === "directive" && 
				functions[i].functionBody[0][1] === "use strict")),
			funcAlreadyDeclared = env.hasBinding(fn),
			existingProp,
			descriptor;
			
		if (!funcAlreadyDeclared) {
			env.createMutableBinding(fn, configurableBindings);
		} else {
			existingProp = globalObject.getProperty(fn);
			if (existingProp.configurable) {
				descriptor = new Base.DataPropertyDescriptor();
				descriptor.writable = true;
				descriptor.enumerable = true;
				descriptor.configurable = configurableBindings;
				globalObject.defineOwnProperty(fn, descriptor, true);
			} else if (Base.isAccessorDescriptor(existingProp) || (existingProp.writable !== true && 
					existingProp.enumerable !== true)) {
				throw new Exceptions.TypeError();
			}
		}
		
		env.setMutableBinding(fn, fo, strict);
	}
	
	// Initialize the arguments variable
	if (!env.hasBinding("arguments")) {
		// TODO: Implement Arguments object
		console.error("IMPLEMENT ME");
	}
	
	// Find all of the variable declarations and bind them
	for(i = 0, len = variables.length; i < len; i++) {
		var dn = variables[i].variableName,
			varAlreadyDeclared = env.hasBinding(dn);
		
		if (!varAlreadyDeclared) {
			env.createMutableBinding(dn, configurableBindings);
			env.setMutableBinding(dn, new Base.UndefinedType(), strict);
		}
	}
	
	// Return the context
	return executionContext;
};
 
/*****************************************
 *
 * Chapter 13 - Function Definitions
 *
 *****************************************/
 
/**
 * @classdesc A function object type
 *
 * @constructor
 * @extends module:Base.ObjectType
 * @param {module:AST.node} functionBody The parsed body of the function
 * @param {Array[String]} formalParameterList The list of function arguments
 * @param {String} [className] The name of the class, defaults to "Function." This parameter should only be used by a 
 *		constructor for an object extending this one.
 * @see ECMA-262 Spec Chapter 13.2
 */
exports.FunctionType = function(formalParameterList, functionBody, lexicalEnvironemnt, strict, className) {
	Base.ObjectType.call(this, className || "Function");
	
	// Create the internal properties
	this.scope = lexicalEnvironemnt;
	this.formalParameters = formalParameterList;
	this.code = functionBody;
	this.extensible = true;
	this.strict = strict;
	
	// Create the exposed properties
	this.defineOwnProperty("length", {
		value: formalParameterList.length,
		writable: false,
		enumerable: false,
		configurable: false
	}, false);
	
	// Create the prototype
	var proto = new Base.ObjectType();
	proto.defineOwnProperty("constructor", {
		value: this,
		writable: true,
		enumerable: false,
		configurable: true
	}, false);
	this.defineOwnProperty("prototype", {
		value: proto,
		writable: true,
		enumerable: false,
		configurable: true
	}, false);
	
	// Strict mode additions
	if (strict) {
		// TODO: add ThrowTypeError object as "thrower" property
		throw new Error("IMPLEMENT ME");
	}
}
var FunctionType = exports.FunctionType;
util.inherits(exports.FunctionType, Base.ObjectType);

/**
 * Indicates that a property was referenced (i.e. read).
 *
 * @name module:Base.ObjectType#propertyReferenced
 * @event
 * @param {String} name The name of the proeprty that was referenced
 */
/**
 * ECMA-262 Spec: <em>Returns the value of the named property.</em>
 * 
 * @method
 * @param {String} p The name of the property to fetch
 * @returns {{@link module:Base.BaseType}} The value of the property, or a new instance of {@link module:Base.UndefinedType} if 
 *		the property does not exist
 * @see ECMA-262 Spec Chapters 8.12.3 and 15.3.5.4
 */
exports.FunctionType.prototype.get = function get(p) {
	var v = Base.ObjectType.prototype.get.call(this, p);
	if (p === "caller" && type(v) === "Function" && v.strict) {
		throw new Exceptions.TypeError();
	}
	return v;
};

/**
 * Calls the function
 * 
 * @method
 * @param {module:Base.BaseType} thisVal The value of <code>this</code> of the function
 * @param (Array[{@link module:Base.BaseType}]} args The set of arguments passed in to the function call
 * @returns {module:Base.BaseType} The return value from the function
 * @see ECMA-262 Spec Chapter 13.2.1
 */
exports.FunctionType.prototype.call = function call(thisVal, args) {
	var funcCtx = exports.createFunctionContext(this, thisVal, args),
		result;
	Runtime.contextStack.push(funcCtx);
	
	// Execute the function body
	if (!this.code || this.code.length === 0) {
		result = ["normal", new Base.UndefinedType(), undefined];
	} else {
		for(var i = 0, len = this.code.length; i < len; i++) {
			result = RuleProcessor.processRule(this.code[i]);
		}
	}
	
	// Process the results
	if (result[0] === "throw") {
		throw new Error("IMPLEMENT ME");
	} else if (result[0] === "return") {
		result = result[1];
	} else {
		result = new Base.UndefinedType();
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
exports.FunctionType.prototype.construct = function construct(args) {
	var obj = new Base.ObjectType(),
		proto = this.get("prototype"),
		result;
	obj.extensible = true;
	
	// Hook up the prototype
	if (Base.type(proto) === "Object") {
		obj.objectPrototype = proto;
	} else {
		throw new Error("IMPLEMENT ME");
	}
	
	// Invoke the constructor
	result = this.call(obj, args);
	
	// Return the result
	if (Base.type(result) === "Object") {
		return result;
	}
	return obj;
};

/**
 * Checks if the function has an instance of v (or something)
 * 
 * @method
 * @param {module:Base.BaseType} v The value to check against
 * @returns {Boolean} Whether or not this function has an instance of v
 * @see ECMA-262 Spec Chapter 15.3.5.3
 */
exports.FunctionType.prototype.hasInstance = function hasInstance(v) {
	if (Base.type(v) !== "Object") {
		return false;
	}
	
	var o = this.get("prototype");
	if (Base.type(o) !== "Object") {
		throw new Exceptions.TypeError();
	}
	do {
		v = v.get("prototype");
		if (o === v) {
			return true;
		}
	} while(v);
	return false;
};