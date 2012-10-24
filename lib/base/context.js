/*****************************************
 *
 * Lexical Environments and Contexts
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
exports.DeclarativeEnvironmentRecord = DeclarativeEnvironmentRecord;
function DeclarativeEnvironmentRecord() {
	this._bindings = {};
}

/**
 * ECMA-262 Spec: <em>The concrete environment record method HasBinding for declarative environment records simply 
 * determines if the argument identifier is one of the identifiers bound by the record</em>
 * 
 * @method
 * @param {String} n The name of the binding
 * @returns {Boolean} Whether or not this environment record has the binding
 * @see ECMA-262 Spec Chapter 10.2.1.1.1
 */
DeclarativeEnvironmentRecord.prototype.hasBinding = function hasBinding(n) {
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
 * @throws Thrown if the binding already exists
 * @see ECMA-262 Spec Chapter 10.2.1.1.2
 */
DeclarativeEnvironmentRecord.prototype.createMutableBinding = function createMutableBinding(n, d) {
	var bindings = this._bindings;
	if (n in bindings) {
		throw new Error('Could not create mutable binding: binding "' + n + '" already exists');
	}

	bindings[n] = {
		value: new UndefinedType(),
		isDeletable: !!d,
		isMutable: true
	};
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
 * @throws Thrown if the binding does not exist
 * @see ECMA-262 Spec Chapter 10.2.1.1.3
 */
DeclarativeEnvironmentRecord.prototype.setMutableBinding = function setMutableBinding(n, v, s) {
	var bindings = this._bindings;
	if (!(n in bindings)) {
		throw new Error('Could not set mutable binding: binding "' + n + '" does not exist');
	}

	if (!bindings[n].isMutable) {
		if (s) {
			throwNativeException('TypeError', 'Could not set binding: binding "' + n + '" is not mutable');
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
 * @throws Thrown if the binding does not exist
 * @see ECMA-262 Spec Chapter 10.2.1.1.4
 */
DeclarativeEnvironmentRecord.prototype.getBindingValue = function getBindingValue(n, s) {

	var binding = this._bindings[n];
	if (!binding) {
		throw new Error('Could not get value: binding "' + n + '" does not exist');
	}

	if (s && !binding.isMutable && !binding.isInitialized) {
		throwNativeException('ReferenceError', 'Could not get value: binding "' + n + '" has not been initialized');
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
DeclarativeEnvironmentRecord.prototype.deleteBinding = function deleteBinding(n) {

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
DeclarativeEnvironmentRecord.prototype.implicitThisValue = function implicitThisValue() {
	return new UndefinedType(); // Always return undefined for declarative environments
};

/**
 * ECMA-262 Spec: <em>The concrete Environment Record method CreateImmutableBinding for declarative environment records 
 * creates a new immutable binding for the name n that is initialised to the value undefined. A binding must not already 
 * exist in this environment record for n.</em>
 * 
 * @method
 * @param {String} n The name of the binding
 * @throws Thrown if the binding already exists
 * @see ECMA-262 Spec Chapter 10.2.1.1.7
 */
DeclarativeEnvironmentRecord.prototype.createImmutableBinding = function createImmutableBinding(n) {

	var bindings = this._bindings;
	if (n in bindings) {
		throw new Error('Could not create immutable binding: binding "' + n + '" already exists');
	}

	bindings[n] = {
		value: new UndefinedType(),
		isDeletable: false,
		isMutable: false,
		isInitialized: false
	};
};

/**
 * ECMA-262 Spec: <em>The concrete Environment Record method InitializeImmutableBinding for declarative environment 
 * records is used to set the bound value of the current binding of the identifier whose name is the value of the 
 * argument n to the value of argument v. An uninitialised immutable binding for n must already exist.</em>
 * 
 * @method
 * @param {String} n The name of the binding
 * @param {module:Base.BaseType} v The value to initialize the binding to
 * @throws Thrown if the binding does not exist
 * @throws Thrown if the binding is not immutable or has already been initialized
 * @see ECMA-262 Spec Chapter 10.2.1.1.8
 */
DeclarativeEnvironmentRecord.prototype.initializeImmutableBinding = function initializeImmutableBinding(n, v) {

	var binding = this._bindings[n];
	if (!binding) {
		throw new Error('Could not initialize immutable value: binding "' + n + '" does not exist');
	}

	if (binding.isInitialized !== false) {
		throw new Error('Could not initialize immutable value: binding "' + n + '" has either been initialized already or is not an immutable value');
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
exports.ObjectEnvironmentRecord = ObjectEnvironmentRecord;
function ObjectEnvironmentRecord(bindingObject) {
	if (!bindingObject) { 
		throw '';
	}
	this._bindingObject = bindingObject;
}

/**
 * ECMA-262 Spec: <em>The concrete Environment Record method HasBinding for object environment records determines if its 
 * associated binding object has a property whose name is the value of the argument n</em>
 * 
 * @method
 * @param {String} n The name of the binding
 * @returns {Boolean} Whether or not this environment record has the binding
 * @see ECMA-262 Spec Chapter 10.2.1.2.1
 */
ObjectEnvironmentRecord.prototype.hasBinding = function hasBinding(n) {
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
 * @param {Boolean} suppressEvent Suppresses the 'propertySet' event (used when setting prototypes)
 * @throws Thrown if the binding already exists
 * @see ECMA-262 Spec Chapter 10.2.1.2.2
 */
ObjectEnvironmentRecord.prototype.createMutableBinding = function createMutableBinding(n, d, suppressEvent) {
	var bindingObject = this._bindingObject,
		hasProp = bindingObject.hasProperty(n);
	if (Runtime.ambiguousCode) {
		return;
	} else if (bindingObject.hasProperty(n)) {
		throw new Error('Internal Error: could not create mutable binding: binding "' + n + '" already exists');
	}

	bindingObject.defineOwnProperty(n, {
		value: new UndefinedType(),
		writable: true,
		enumerable: true,
		configurable: !!d
	}, true, suppressEvent);
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
 * @param {Boolean} suppressEvent Suppresses the 'propertySet' event (used when setting prototypes)
 * @see ECMA-262 Spec Chapter 10.2.1.2.3
 */
ObjectEnvironmentRecord.prototype.setMutableBinding = function setMutableBinding(n, v, s, suppressEvent) {
	this._bindingObject.put(n, v, s, suppressEvent);
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
 * @see ECMA-262 Spec Chapter 10.2.1.2.4
 */
ObjectEnvironmentRecord.prototype.getBindingValue = function getBindingValue(n, s) {
	var bindingObject = this._bindingObject;
	if (!bindingObject.hasProperty(n)) {
		if (s) {
			throwNativeException('ReferenceError', 'Property ' + n + ' does not exist');
		}
		return new UndefinedType();
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
ObjectEnvironmentRecord.prototype.deleteBinding = function deleteBinding(n) {
	return this._bindingObject['delete'](n, false);
};

/**
 * ECMA-262 Spec: <em>Object Environment Records return undefined as their ImplicitThisValue unless their provideThis 
 * flag is true.</em>
 * 
 * @method
 * @returns {{@link module:Base.BaseType}} The value of this, if it exists
 * @see ECMA-262 Spec Chapter 10.2.1.2.6
 */
ObjectEnvironmentRecord.prototype.implicitThisValue = function implicitThisValue() {
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
 * @property {module:Base.LexicalEnvironment|undefined} outer The outer lexical environment of this lexical environment, 
 *		if it exists
 * @see ECMA-262 Spec Chapter 10.2
 */
exports.LexicalEnvironment = LexicalEnvironment;
function LexicalEnvironment(envRec, outer) {
	this.envRec = envRec;
	this.outer = outer;
}

// ******** Lexical Environment Operations ********

/**
 * ECMA-262 Spec: <em>The abstract operation GetIdentifierReference is called with a Lexical Environment lex, an 
 * identifier String name, and a Boolean flag strict. The value of lex may be null.</em>
 * 
 * @method
 * @param {module:Base.LexicalEnvironment|undefined} lex The lexical environment to search
 * @see ECMA-262 Spec Chapter 10.2.2.1
 */
exports.getIdentifierReference = getIdentifierReference;
function getIdentifierReference(lex, name, strict) {
	var newRef;
	if (!lex) {
		newRef = new ReferenceType();
		newRef.baseValue = new UndefinedType();
		newRef.referencedName = name;
		newRef.strictReference = strict;
		return newRef;
	}
	if (lex.envRec.hasBinding(name)) {
		newRef = new ReferenceType();
		newRef.baseValue = lex.envRec;
		newRef.referencedName = name;
		newRef.strictReference = strict;
		return newRef;
	} else {
		return getIdentifierReference(lex.outer, name, strict);
	}
}

/**
 * Creates a new lexical environment with a declarative environment record
 * 
 * @method
 * @param {module:Base.LexicalEnvironment|undefined} e The outer lexical environment of the new lexical environment
 * @returns {{@link module:Base.LexicalEnvironment} The newly created lexical environment
 * @see ECMA-262 Spec Chapter 10.2.2.2
 */
exports.newDeclarativeEnvironment = newDeclarativeEnvironment;
function newDeclarativeEnvironment(e) {
	return new LexicalEnvironment(new DeclarativeEnvironmentRecord(), e);
}

/**
 * Creates a new lexical environment with an object environment record
 * 
 * @method
 * @param {module:Base.ObjectType} o The binding object
 * @param {module:Base.LexicalEnvironment|undefined} e The outer lexical environment of the new lexical environment
 * @returns {{@link module:Base.LexicalEnvironment} The newly created lexical environment
 * @see ECMA-262 Spec Chapter 10.2.2.3
 */
exports.newObjectEnvironment = newObjectEnvironment;
function newObjectEnvironment(o, e) {
	return new LexicalEnvironment(new ObjectEnvironmentRecord(o), e);
}

// ******** Execution Context ********

/**
 * @classdesc ECMA-262 Spec: <em>When control is transferred to ECMAScript executable code, control is entering an 
 * execution context. Active execution contexts logically form a stack. The top execution context on this logical stack 
 * is the running execution context. A new execution context is created whenever control is transferred from the 
 * executable code associated with the currently running execution context to executable code that is not associated 
 * with that execution context. The newly created execution context is pushed onto the stack and becomes the running 
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
exports.ExecutionContext = ExecutionContext;
function ExecutionContext(lexicalEnvironment, variableEnvironment, thisBinding, strict) {
	this.lexicalEnvironment = lexicalEnvironment;
	this.variableEnvironment = variableEnvironment;
	this.thisBinding = thisBinding;
	this.strict = isDefined(strict) ? strict : false;
}

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
	
	// 'Recursively' find all declarations
	while (nodeStack.length) {
		node = nodeStack.pop();
		name = RuleProcessor.getRuleName(node);
		if (name === 'defun') {
			functions.push({
				functionName: node[1],
				formalParameterList: node[2],
				functionBody: node[3]
			});
		} else if (name === 'var') {
			for (i = 0, len = node[1].length; i < len; i++) {
				variables.push({
					variableName: node[1][i][0]
				});
			}
		} else {
			
			// Each node is a little different when it comes to children, so we have to parse them separately
			switch (name) {
				case 'if':
					if (node[2]) {
						nodeStack = nodeStack.concat([node[2]]);
					}
					if (node[3]) {
						nodeStack = nodeStack.concat([node[3]]);
					}
					break;
				
				case 'do':
					nodeStack = nodeStack.concat([node[2]]);
					break;
				
				case 'while':
					nodeStack = nodeStack.concat([node[2]]);
					break;
				
				case 'for':
					if (node[1]) {
						nodeStack = nodeStack.concat([node[1]]);
					}
					if (node[4]) {
						nodeStack = nodeStack.concat([node[4]]);
					}
					break;
				
				case 'for-in':
					nodeStack = nodeStack.concat([node[1], node[4]]);
					break;
				
				case 'try':
					if (node[1]) {
						nodeStack = nodeStack.concat(node[1]);
					}
					if (node[2]) {
						nodeStack = nodeStack.concat(node[2][1]);
					}
					if (node[3]) {
						nodeStack = nodeStack.concat(node[3]);
					}
					break;
				
				case 'switch':
					for (i = 0, len = node[2].length; i < len; i++) {
						nodeStack = nodeStack.concat(node[2][i][1]);
					}
					break;
					
				case 'block':
					if (node[1]) {
						nodeStack = nodeStack.concat(node[1]);
					}
					break;
					
				case 'toplevel':
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
exports.createGlobalContext = createGlobalContext;
function createGlobalContext(ast, strict) {
	
	// Create the context
	var globalObject = new ObjectType(),
		env = newObjectEnvironment(globalObject, Runtime.getGlobalContext().variableEnvironment),
		configurableBindings = false,
		executionContext = new ExecutionContext(
			env,
			env,
			globalObject,
			strict),
		len, i,
		functions, variables, result,
		fn, fo,
		funcAlreadyDeclared,
		existingProp,
		descriptor,
		dn,
		varAlreadyDeclared;
	env = executionContext.variableEnvironment.envRec;
	result = findDeclarations(ast);
	functions = result.functions;
	variables = result.variables;
	
	// Find all of the function declarations and bind them
	for (i = 0, len = functions.length; i < len; i++) {
		fn = functions[i].functionName;
		fo = new FunctionType(functions[i].formalParameterList, functions[i].functionBody, executionContext.lexicalEnvironment, 
			strict || RuleProcessor.isBlockStrict(functions[i].functionBody));
		funcAlreadyDeclared = env.hasBinding(fn);
			
		if (!funcAlreadyDeclared) {
			env.createMutableBinding(fn, configurableBindings);
		} else {
			existingProp = globalObject.getProperty(fn);
			if (existingProp.configurable) {
				descriptor = new DataPropertyDescriptor();
				descriptor.writable = true;
				descriptor.enumerable = true;
				descriptor.configurable = configurableBindings;
				globalObject.defineOwnProperty(fn, descriptor, true);
			} else if (isAccessorDescriptor(existingProp) || (existingProp.writable !== true && 
					existingProp.enumerable !== true)) {
				throwNativeException('TypeError', fn + 
					' is not a valid identifier name because a non-writable identifier with that name already exists');
			}
		}
		
		env.setMutableBinding(fn, fo, strict);
	}
	
	// Find all of the variable declarations and bind them
	for (i = 0, len = variables.length; i < len; i++) {
		dn = variables[i].variableName,
		varAlreadyDeclared = env.hasBinding(dn);
		
		if (!varAlreadyDeclared) {
			env.createMutableBinding(dn, configurableBindings);
			env.setMutableBinding(dn, new UndefinedType(), strict);
		}
	}
	
	// Return the context
	return executionContext;
}

/**
 * Creates an eval context
 * 
 * @method
 * @param {module:Base.ExecutionContext|undefined} callingContext The context that is evaling code
 * @param {module:AST.node} code The code associated with this eval context
 * @returns {module:Base.ExecutionContext} The new eval execution context
 * @see ECMA-262 Spec Chapter 10.4.2 and Chapter 10.5
 */
exports.createEvalContext = createEvalContext;
function createEvalContext(callingContext, code, strict) {
	
	var globalObject = Runtime.getGlobalObject(),
		executionContext,
		env,
		configurableBindings = true,
		len, i,
		result,
		functions,
		variables,
		fn,
		fo,
		funcAlreadyDeclared,
		existingProp,
		descriptor,
		dn,
		varAlreadyDeclared;
	
	// Create or set the execution context
	if (callingContext) {
		executionContext = callingContext;
		executionContext = new ExecutionContext(
			callingContext.lexicalEnvironment,
			callingContext.variableEnvironment,
			callingContext.thisBinding,
			callingContext.strict || strict
		);
	} else {
		executionContext = new ExecutionContext(
			newObjectEnvironment(globalObject, undefined),
			newObjectEnvironment(globalObject, undefined),
			new ObjectType(),
			strict
		);
	}
	
	// Create the inner lexical environment if this is strict mode code
	if (strict) {
		executionContext.variableEnvironment = newDeclarativeEnvironment(executionContext.lexicalEnvironment);
		executionContext.lexicalEnvironment = newDeclarativeEnvironment(executionContext.lexicalEnvironment);
	}
	
	// Bind the function and variable declarations to the global context
	env = executionContext.variableEnvironment.envRec;
	result = findDeclarations(code);
	functions = result.functions;
	variables = result.variables;
	
	// Find all of the function declarations and bind them
	for (i = 0, len = functions.length; i < len; i++) {
		fn = functions[i].functionName;
		fo = new FunctionType(functions[i].formalParameterList, functions[i].functionBody, executionContext.lexicalEnvironment, 
			strict || RuleProcessor.isBlockStrict(functions[i].functionBody));
		funcAlreadyDeclared = env.hasBinding(fn);
			
		if (!funcAlreadyDeclared) {
			env.createMutableBinding(fn, configurableBindings);
		} else {
			existingProp = globalObject.getProperty(fn);
			if (existingProp.configurable) {
				descriptor = new DataPropertyDescriptor();
				descriptor.writable = true;
				descriptor.enumerable = true;
				descriptor.configurable = configurableBindings;
				globalObject.defineOwnProperty(fn, descriptor, true);
			} else if (isAccessorDescriptor(existingProp) || (existingProp.writable !== true && 
					existingProp.enumerable !== true)) {
				throwNativeException('TypeError', fn + 
					' is not a valid identifier name because a non-writable identifier with that name already exists');
			}
		}
		
		env.setMutableBinding(fn, fo, strict);
	}
	
	// Find all of the variable declarations and bind them
	for (i = 0, len = variables.length; i < len; i++) {
		dn = variables[i].variableName;
		varAlreadyDeclared = env.hasBinding(dn);
		
		if (!varAlreadyDeclared) {
			env.createMutableBinding(dn, configurableBindings);
			env.setMutableBinding(dn, new UndefinedType(), strict);
		}
	}
	
	return executionContext;
}

/**
 * ECMA-262 Spec: <em>When control enters an execution context for function code, an arguments object is created unless 
 * (as specified in 10.5) the identifier arguments occurs as an Identifier in the function‘s FormalParameterList or 
 * occurs as the Identifier of a VariableDeclaration or FunctionDeclaration contained in the function code.</em>
 *
 * @method
 * @param {module:Base.FunctionType} func ECMA-262 Spec: <em>the function object whose code is to be evaluated</em>
 * @param {Array[String]} names ECMA-262 Spec: <em>a List containing the function‘s formal parameter names</em>
 * @param {Array[{@link module:Base.BaseType}]} args ECMA-262 Spec: <em>the actual arguments passed to the [[call]] internal method</em>
 * @param {module:Base.LexicalEnvironment} env ECMA-262 Spec: <em>the variable environment for the function code</em>
 * @param {Boolean} strict ECMA-262 Spec: <em>a Boolean that indicates whether or not the function code is strict code</em>
 * @returns {module:Base.ObjectType} The arguments object
 * @see ECMA-262 Spec Chapter 10.4.2 and Chapter 10.6
 */
exports.createArgumentsObject = createArgumentsObject;
function createArgumentsObject(func, names, args, env, strict) {
	var len = args.length,
		obj = new ObjectType(),
		map = new ObjectType(),
		mappedNames = [],
		indx = len - 1,
		val,
		name;
	
	obj.className = 'Arguments';
	obj.defineOwnProperty('length', {
		value: new NumberType(len),
		writable: true,
		enumerable: true,
		configurable: true
	}, false, true);
	
	while (indx >= 0) {
		val = args[indx];
		obj.defineOwnProperty(indx, {
			value: val,
			writable: true,
			enumerable: true,
			configurable: true
		}, false, true);
		if (indx < names.length) {
			name = names[indx];
			if (!strict && !(name in mappedNames)) {
				mappedNames.push(name);
				map.defineOwnProperty(indx, {
					// Note: we have to do this crazy parse since returns aren't allowedin global scope
					get: new FunctionType([], AST.parseString('function temp () { return ' + name + '; }')[1][0][3][0], env, true),
					set: new FunctionType([name + '_arg'], AST.parseString(name + ' = ' + name + '_arg;')[1][0], env, true),
					configurable: true
				}, false, true);
			}
		}
		indx--;
	}
	
	if (mappedNames.length) {
		obj.parameterMap = map;
		
		obj.get = function get(p) {
			var isMapped = map.getOwnProperty(p),
				v;
			if (isMapped) {
				return map.get(p);
			} else {
				v = ObjectType.prototype.get.call(obj, p);
				if (p === 'callee' && v.className === 'Function' && v.strict) {
					throwNativeException('TypeError', 'Invalid identifier ' + p);
				}
				return v;
			}
		};
		
		obj.getOwnProperty = function getOwnProperty(p) {
			var desc = ObjectType.prototype.getOwnProperty.call(obj, p),
				isMapped;
			
			if (!desc) {
				return;
			}
			
			isMapped = map.getOwnProperty(p);
			if (isMapped) {
				desc.value = map.get(p);
			}
			return desc;
		};
		
		obj.defineOwnProperty = function defineOwnProperty(p, desc, throwFlag) {
			var isMapped = map.getOwnProperty(p),
				allowed = obj.getOwnProperty(p, desc, throwFlag);
			
			if (!allowed) {
				if (throwFlag) {
					throwNativeException('TypeError', 'Cannot define property ' + p);
				}
				return false;
			}
			
			if (isMapped) {
				if (isAccessorDescriptor(desc)) {
					map['delete'](p, false);
				} else {
					if (desc.value) {
						map.put(p, desc.value, throwFlag, true);
					}
					if (desc.writable === false) {
						map['delete'](p, false);
					}
				}
			}
		};
		
		obj['delete'] = function (p, throwFlag) {
			var isMapped = map.getOwnProperty(p),
				result = ObjectType.prototype['delete'].call(obj, p, throwFlag);
			if (result && isMapped) {
				map['delete'](p, false);
			}
			return result;
		};
	}
	
	if (strict) {
		obj.defineOwnProperty('caller', {
			get: throwTypeError,
			set: throwTypeError,
			enumerable: false,
			configurable: false
		}, false, true);
		obj.defineOwnProperty('callee', {
			get: throwTypeError,
			set: throwTypeError,
			enumerable: false,
			configurable: false
		}, false, true);
	} else {
		obj.defineOwnProperty('callee', {
			value: func,
			writeable: true,
			enumerable: true,
			configurable: true
		}, false, true);
	}
	
	return obj;
}

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
exports.createFunctionContext = createFunctionContext;
function createFunctionContext(functionObject, thisArg, argumentsList) {
	
	// Create the context
	var globalObject = Runtime.getGlobalObject(),
		env = newDeclarativeEnvironment(functionObject.scope),
		configurableBindings = false,
		strict = functionObject.strict,
		executionContext,
		len, i,
		arg, argName,
		functions, variables, result,
		thisArgType = type(thisArg),
		thisBinding,
		fn,
		fo,
		funcAlreadyDeclared,
		existingProp,
		descriptor,
		argsObj,
		dn,
		varAlreadyDeclared;
	
	// Create the this binding
	if (functionObject.strict) {
		thisBinding = thisArg;
	} else if (thisArgType === 'Null' || thisArgType === 'Undefined') {
		thisBinding = Runtime.getModuleContext().thisBinding;
	} else if (thisArgType !== 'Object') {
		thisBinding = toObject(thisArg);
	} else {
		thisBinding = thisArg;
	}
	
	// Create the execution context and find declarations inside of it
	executionContext = new ExecutionContext(env, env, thisBinding, strict);
	env = executionContext.variableEnvironment.envRec;
	result = findDeclarations(['toplevel', functionObject.code]);
	functions = result.functions;
	variables = result.variables;
	
	// Initialize the arguments
	for (i = 0, len = functionObject.formalParameters.length; i < len; i++) {
		arg = argumentsList[i];
		argName = functionObject.formalParameters[i];
		if (!arg) {
			arg = new UndefinedType();
		}
		if (!env.hasBinding(argName)) {
			env.createMutableBinding(argName);
		}
		env.setMutableBinding(argName, arg, strict);
	}
	
	// Find all of the function declarations and bind them
	for (i = 0, len = functions.length; i < len; i++) {
		fn = functions[i].functionName;
		fo = new FunctionType(functions[i].formalParameterList, functions[i].functionBody, executionContext.lexicalEnvironment, 
			strict || RuleProcessor.isBlockStrict(functions[i].functionBody));
		funcAlreadyDeclared = env.hasBinding(fn);
			
		if (!funcAlreadyDeclared) {
			env.createMutableBinding(fn, configurableBindings);
		} else {
			existingProp = globalObject.getProperty(fn);
			if (existingProp.configurable) {
				descriptor = new DataPropertyDescriptor();
				descriptor.writable = true;
				descriptor.enumerable = true;
				descriptor.configurable = configurableBindings;
				globalObject.defineOwnProperty(fn, descriptor, true);
			} else if (isAccessorDescriptor(existingProp) || (existingProp.writable !== true && 
					existingProp.enumerable !== true)) {
				throwNativeException('TypeError', fn + 
					' is not a valid identifier name because a non-writable identifier with that name already exists');
			}
		}
		
		env.setMutableBinding(fn, fo, strict);
	}
	
	// Initialize the arguments variable
	if (!env.hasBinding('arguments')) {
		argsObj = createArgumentsObject(functionObject, functionObject.formalParameters, argumentsList, env, strict);
		if (strict) {
			env.createImmutableBinding('arguments');
			env.initializeImmutableBinding('arguments', argsObj);
		} else {
			env.createMutableBinding('arguments');
			env.setMutableBinding('arguments', argsObj, false);
		}
	}
	
	// Find all of the variable declarations and bind them
	for (i = 0, len = variables.length; i < len; i++) {
		dn = variables[i].variableName;
		varAlreadyDeclared = env.hasBinding(dn);
		
		if (!varAlreadyDeclared) {
			env.createMutableBinding(dn, configurableBindings);
			env.setMutableBinding(dn, new UndefinedType(), strict);
		}
	}
	
	// Return the context
	return executionContext;
}