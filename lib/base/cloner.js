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
ReferenceType
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
	if (!this._valueMap.has(source)) {
		this._valueMap.set(source, newFunc);
	}
	newFunc.extensible = source.extensible;
	for (i = 0, len = source._properties.length; i < len; i++) {
		newFunc._properties[i] = this.cloneDescriptor(source._properties[i]);
	}
	newFunc.objectPrototype = source.objectPrototype && this.cloneValue(source.objectPrototype);
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
	var cloned = new ReferenceType(this.cloneValue(source.value), source.referencedName, source.strictReference);
	if (!this._valueMap.has(source)) {
		this._valueMap.set(source, cloned);
	}
	return cloned;
};

Cloner.prototype.cloneUnknown = function cloneUnknown(source) {
	throw new Error('Not Implemented');
};
