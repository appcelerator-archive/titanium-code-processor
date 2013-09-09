/*****************************************
 *
 * Cloner
 *
 *****************************************/
/*global
Map,
UndefinedType,
NullType,
StringType,
NumberType,
BooleanType,
ObjectType,
FunctionType,
isDataDescriptor,
ReferenceType,
ArrayType,
RegExpType,
UnknownType,
DeclarativeEnvironmentRecord,
ObjectEnvironmentRecord,
ExecutionContext,
LexicalEnvironment,
StringPrototypeType,
NumberPrototypeType,
BooleanPrototypeType
*/

exports.Cloner = Cloner;
function Cloner() {
	this._valueMap = new Map();
}

Cloner.prototype.cloneContext = function cloneContext(source) {
	var newEnvRec = source.lexicalEnvironment.envRec instanceof ObjectEnvironmentRecord ?
			this.cloneObjectEnvironment(source.lexicalEnvironment) :
			this.cloneDeclarativeEnvironment(source.lexicalEnvironment),
		newContext = new ExecutionContext(
			newEnvRec,
			newEnvRec,
			source.thisBinding && this.cloneObject(source.thisBinding),
			source.strict
		);
	newContext._ambiguousBlock = source._ambiguousBlock;
	return newContext;
};

Cloner.prototype.cloneDeclarativeEnvironment = function cloneDeclarativeEnvironment(source) {
	var newEnvRec = new DeclarativeEnvironmentRecord(),
		outer,
		binding;

	// Clone the bindings
	for (binding in source.envRec._bindings) {
		newEnvRec._bindings[binding] = {
			value: this.cloneValue(source.envRec._bindings[binding].value),
			isDeletable: source.envRec._bindings[binding].isDeletable,
			isMutable: source.envRec._bindings[binding].isMutable
		};
	}
	newEnvRec._ambiguousContext = source._ambiguousContext;

	// Clone the outer lexical environment
	if (source.outer) {
		if (source.outer.envRec instanceof DeclarativeEnvironmentRecord) {
			outer = this.cloneDeclarativeEnvironment(source.outer);
		} else {
			outer = this.cloneObjectEnvironment(source.outer);
		}
	}

	return new LexicalEnvironment(newEnvRec, outer);
};

Cloner.prototype.cloneObjectEnvironment = function cloneObjectEnvironment(source) {
	var newEnvRec = new ObjectEnvironmentRecord(this.cloneObject(source.envRec._bindingObject)),
		outer;

	newEnvRec._ambiguousContext = source.envRec._ambiguousContext;

	// Clone the outer lexical environment
	if (source.outer) {
		if (source.outer.envRec instanceof DeclarativeEnvironmentRecord) {
			outer = this.cloneDeclarativeEnvironment(source.outer);
		} else {
			outer = this.cloneObjectEnvironment(source.outer);
		}
	}

	return new LexicalEnvironment(newEnvRec, outer);
};

Cloner.prototype.cloneValue = function cloneValue(source) {
	var cloned = this._valueMap.get(source);
	if (cloned) {
		return cloned;
	}
	if (source.dontClone) {
		return source;
	}
	switch(source.className) {
		case 'Undefined':
			cloned = this.cloneUndefined(source);
			break;
		case 'Null':
			cloned = this.cloneNull(source);
			break;
		case 'String':
			cloned = source instanceof StringPrototypeType ? this.cloneObject(source) : this.cloneString(source);
			break;
		case 'Number':
			cloned = source instanceof NumberPrototypeType ? this.cloneObject(source) : this.cloneNumber(source);
			break;
		case 'Boolean':
			cloned = source instanceof BooleanPrototypeType ? this.cloneObject(source) : this.cloneBoolean(source);
			break;
		// TODO: This is a hack since arguments objects have a few special overridden internal methods, but it's close enough for now.
		case 'Arguments':
		case 'Object':
			cloned = this.cloneObject(source);
			break;
		case 'Function':
			cloned = this.cloneFunction(source);
			break;
		case 'Array':
			cloned = this.cloneArray(source);
			break;
		case 'RegExp':
			cloned = this.cloneRegExp(source);
			break;
		case 'Error':
		case 'EvalError':
		case 'RangeError':
		case 'ReferenceError':
		case 'SyntaxError':
		case 'TypeError':
		case 'URIError':
			cloned = this.cloneError(source);
			break;
		case 'Reference':
			cloned = this.cloneReference(source);
			break;
		case 'Unknown':
			cloned = this.cloneUnknown(source);
			break;
		default:
			throw new Error('Internal Error: Cannot clone value of unknown class type "' + source.className + '"');
	}
	return cloned;
};

Cloner.prototype.cloneUndefined = function cloneUndefined(source) {
	var cloned = new UndefinedType();
	if (!this._valueMap.has(source)) {
		this._valueMap.set(source, cloned);
	}
	return cloned;
};

Cloner.prototype.cloneNull = function cloneNull(source) {
	var cloned = new NullType();
	if (!this._valueMap.has(source)) {
		this._valueMap.set(source, cloned);
	}
	return cloned;
};

Cloner.prototype.cloneString = function cloneString(source) {
	var cloned = new StringType(source.value);
	if (!this._valueMap.has(source)) {
		this._valueMap.set(source, cloned);
	}
	return cloned;
};

Cloner.prototype.cloneNumber = function cloneNumber(source) {
	var cloned = new NumberType(source.value);
	if (!this._valueMap.has(source)) {
		this._valueMap.set(source, cloned);
	}
	return cloned;
};

Cloner.prototype.cloneBoolean = function cloneBoolean(source) {
	var cloned = new BooleanType(source.value);
	if (!this._valueMap.has(source)) {
		this._valueMap.set(source, cloned);
	}
	return cloned;
};

Cloner.prototype.cloneDescriptor = function cloneDescriptor(sourceDesc) {
	var newDesc = {
			enumerable: sourceDesc.enumerable,
			configurable: sourceDesc.configurable,
			_name: sourceDesc._name
		};
	if (isDataDescriptor(sourceDesc)) {
		newDesc.value = this.cloneValue(sourceDesc.value);
		newDesc.writable = sourceDesc.writable;
	} else {
		newDesc.get = sourceDesc.get && this.cloneValue(sourceDesc.get);
		newDesc.set = sourceDesc.set && this.cloneValue(sourceDesc.set);
	}
	return newDesc;
};

Cloner.prototype.cloneObject = function cloneObject(source) {
	var newObject = new ObjectType(source.className, undefined, true),
		i, len;
	if (!this._valueMap.has(source)) {
		this._valueMap.set(source, newObject);
	}
	newObject.extensible = source.extensible;
	for (i = 0, len = source._properties.length; i < len; i++) {
		newObject._properties[i] = this.cloneDescriptor(source._properties[i]);
	}
	newObject.objectPrototype = source.objectPrototype && this.cloneValue(source.objectPrototype);
	return newObject;
};

Cloner.prototype.cloneFunction = function cloneFunction(source) {
	var newFunc,
		i, len;
	if (source instanceof FunctionType) {
		newFunc = new FunctionType(
			source.formalParameters,
			source._ast,
			undefined, // Note: we wait to clone the scope until after the mapping is created to break a cyclic dependency
			source.strict,
			source.className);
		if (!this._valueMap.has(source)) {
			this._valueMap.set(source, newFunc);
		}
		if (source.scope.envRec instanceof DeclarativeEnvironmentRecord) {
			newFunc.scope = this.cloneDeclarativeEnvironment(source.scope);
		} else {
			newFunc.scope = this.cloneObjectEnvironment(source.scope);
		}
	} else {
		newFunc = source.constructor.instantiateClone ?
			source.constructor.instantiateClone(source) :
			new source.constructor(source.className);
		newFunc.callFunction = source.callFunction;
		newFunc.construct = source.construct;
		if (!this._valueMap.has(source)) {
			this._valueMap.set(source, newFunc);
		}
	}
	newFunc.extensible = source.extensible;
	for (i = 0, len = source._properties.length; i < len; i++) {
		newFunc._properties[i] = this.cloneDescriptor(source._properties[i]);
	}
	newFunc.objectPrototype = source.objectPrototype && this.cloneValue(source.objectPrototype);
	return newFunc;
};

Cloner.prototype.cloneArray = function cloneArray(source) {
	var newObject = new ArrayType(source.className),
		i, len;
	if (!this._valueMap.has(source)) {
		this._valueMap.set(source, newObject);
	}
	newObject.extensible = source.extensible;
	for (i = 0, len = source._properties.length; i < len; i++) {
		newObject._properties[i] = this.cloneDescriptor(source._properties[i]);
	}
	newObject.objectPrototype = source.objectPrototype && this.cloneValue(source.objectPrototype);
	return newObject;
};

Cloner.prototype.cloneRegExp = function cloneRegExp(source) {
	var newObject = new RegExpType(source._pattern, source._flags, source.className),
		i, len;
	if (!this._valueMap.has(source)) {
		this._valueMap.set(source, newObject);
	}
	newObject.extensible = source.extensible;
	for (i = 0, len = source._properties.length; i < len; i++) {
		newObject._properties[i] = this.cloneDescriptor(source._properties[i]);
	}
	newObject.objectPrototype = source.objectPrototype && this.cloneValue(source.objectPrototype);
	return newObject;
};

Cloner.prototype.cloneError = function cloneError(source) {
	var cloned = this.cloneObject(source);
	cloned._errorType = source._errorType;
	return cloned;
};

Cloner.prototype.cloneReference = function cloneReference(source) {
	var cloned = new ReferenceType(this.cloneValue(source.value), source.referencedName, source.strictReference);
	if (!this._valueMap.has(source)) {
		this._valueMap.set(source, cloned);
	}
	return cloned;
};

Cloner.prototype.cloneUnknown = function cloneUnknown(source) {
	var cloned = new UnknownType();
	if (!this._valueMap.has(source)) {
		this._valueMap.set(source, cloned);
	}
	return cloned;
};
