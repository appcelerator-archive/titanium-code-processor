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
FunctionTypeBase,
FunctionType,
isDataDescriptor
*/

exports.Cloner = Cloner;
function Cloner() {
	this._valueMap = new Map();
}

Cloner.prototype.cloneValue = function cloneValue(source) {
	var cloned = this._valueMap.get(source);
	if (cloned) {
		return cloned;
	}
	switch(source.className) {
		case 'Undefined':
			cloned = this.cloneUndefined(source);
			break;
		case 'Null':
			cloned = this.cloneNull(source);
			break;
		case 'String':
			cloned = this.cloneString(source);
			break;
		case 'Number':
			cloned = this.cloneNumber(source);
			break;
		case 'Boolean':
			cloned = this.cloneBoolean(source);
			break;
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
		case 'Date':
			cloned = this.cloneDate(source);
			break;
		case 'Error':
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
	this._valueMap.set(source, cloned);
	return cloned;
};

Cloner.prototype.cloneUndefined = function cloneUndefined() {
	return new UndefinedType();
};

Cloner.prototype.cloneNull = function cloneNull() {
	return new NullType();
};

Cloner.prototype.cloneString = function cloneString(source) {
	return new StringType(source.value);
};

Cloner.prototype.cloneNumber = function cloneNumber(source) {
	return new NumberType(source.value);
};

Cloner.prototype.cloneBoolean = function cloneBoolean(source) {
	return new BooleanType(source.value);
};

Cloner.prototype.cloneDescriptor = function cloneDescriptor(sourceDesc) {
	var newDesc = {
			enumerable: sourceDesc.enumerable,
			configurable: sourceDesc.configurable
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
	var newObject = new ObjectType(source.className),
		i, len;
	newObject.extensible = source.extensible;
	for (i = 0, len = source._properties.length; i < len; i++) {
		newObject._properties[i] = this.cloneDescriptor(source._properties[i]);
	}
	if (source.objectPrototype) {
		newObject.objectPrototype = source.objectPrototype && this.cloneValue(source.objectPrototype);
	}
	return newObject;
};

Cloner.prototype.cloneFunction = function cloneFunction(source) {
	var newFunc,
		i, len;
	if (source instanceof FunctionType) {
		newFunc = new FunctionType(
			source.formalParameters,
			source._ast,
			//cloneLexicalEnvironment(source.scope),
			source.scope,
			source.strict,
			source.className);
	} else {
		newFunc = source.constructor.instantiateClone ?
			source.constructor.instantiateClone(source) :
			new source.constructor(source.className);
		newFunc.callFunction = source.callFunction;
		newFunc.construct = source.construct;
	}
	newFunc.extensible = source.extensible;
	for (i = 0, len = source._properties.length; i < len; i++) {
		newFunc._properties[i] = this.cloneDescriptor(source._properties[i]);
	}
	if (source.objectPrototype) {
		newFunc.objectPrototype = this.cloneValue(source.objectPrototype);
	}
	return newFunc;
};

Cloner.prototype.cloneArray = function cloneArray(source) {
	throw new Error('Not Implemented');
};

Cloner.prototype.cloneRegExp = function cloneRegExp(source) {
	throw new Error('Not Implemented');
};

Cloner.prototype.cloneDate = function cloneDate(source) {
	throw new Error('Not Implemented');
};

Cloner.prototype.cloneError = function cloneError(source) {
	throw new Error('Not Implemented');
};

Cloner.prototype.cloneReference = function cloneReference(source) {
	return new ReferenceType(cloneValue(source.value), source.referencedName, source.strictReference);
};

Cloner.prototype.cloneUnknown = function cloneUnknown(source) {
	throw new Error('Not Implemented');
};
