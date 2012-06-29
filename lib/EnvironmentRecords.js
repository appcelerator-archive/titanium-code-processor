// Chapter 10 implementation

var Exceptions = require("./Exceptions.js"),
	Types = require("./Types.js"),
	TiUtil = require("./TiUtil");

// ******** DeclarativeEnvironmentRecord Class ********

function DeclarativeEnvironmentRecord() {
	this._bindings = {};
};
exports.DeclarativeEnvironmentRecord = DeclarativeEnvironmentRecord;

DeclarativeEnvironmentRecord.prototype.hasBinding = function(n) {
	return n in this._bindings;
};

DeclarativeEnvironmentRecord.prototype.createMutableBinding = function(n, d) {
	var bindings = this._bindings;
	if (n in bindings) {
		throw new InvalidStateError("Could not create mutable binding: binding '" + n + "' already exists");
	}

	bindings[n] = {
		value: new Types.TypeUndefined(),
		isDeletable: !!d,
		isMutable: true
	}
};

DeclarativeEnvironmentRecord.prototype.setMutableBinding = function(n, v, s) {
	var bindings = this._bindings;
	if (!n in bindings) {
		throw new InvalidStateError("Could not set immutable binding: binding '" + n + "' does not exist");
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

DeclarativeEnvironmentRecord.prototype.getBindingValue = function(n, s) {

	var binding = this._bindings[n];
	if (!binding) {
		throw new InvalidStateError("Could not get value: binding '" + n + "' does not exist");
	}

	if (s && binding.isMutable && !binding.isInitialized) {
		throw new ReferenceError("Could not get value: binding '" + n + "' has not been initialized");
	}

	return bindings[n].value;
};

DeclarativeEnvironmentRecord.prototype.deleteBinding = function(n) {

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

DeclarativeEnvironmentRecord.prototype.implicitThisValue = function() {
	return new Types.TypeUndefined(); // Always return undefined for declarative environments
};

DeclarativeEnvironmentRecord.prototype.createImmutableBinding = function(n) {

	var bindings = this._bindings;
	if (n in bindings) {
		throw new InvalidStateError("Could not create immutable binding: binding '" + n + "' already exists");
	}

	bindings[n] = {
		value: new Types.TypeUndefined(),
		isDeletable: false,
		isMutable: false,
		isInitialized: false
	}
};

DeclarativeEnvironmentRecord.prototype.InitializeImmutableBinding = function(n, v) {

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

function ObjectEnvironmentRecord(bindingObject) {
	this._bindingObject = bindingObject;
};
exports.ObjectEnvironmentRecord = ObjectEnvironmentRecord;

ObjectEnvironmentRecord.prototype.hasBinding = function(n) {
	return this._bindingObject.hasProperty(n);
};

ObjectEnvironmentRecord.prototype.createMutableBinding = function(n, d) {
	var bindingObject = this._bindingObject;
	if (bindingObject.hasProperty(n)) {
		throw new InvalidStateError("Could not create mutable binding: binding '" + n + "' already exists");
	}

	bindingObject.defineOwnProperty(n, {
		value: new Types.TypeUndefined(),
		writeable: true,
		enumerable: true,
		configurable: d
	}, true);
};

ObjectEnvironmentRecord.prototype.setMutableBinding = function(n, v, s) {
	this._bindingObject.put(n, v, s);
};

ObjectEnvironmentRecord.prototype.getBindingValue = function(n, s) {
	var bindingObject = this._bindingObject;
	if (!bindingObject.hasProperty(n)) {
		if (s) {
			throw new Exceptions.ReferenceError();
		}
		return undefined;
	}

	return bindingObject.get(n);
};

ObjectEnvironmentRecord.prototype.deleteBinding = function(n) {
	return this._bindingObject["delete"](n, false);
};

ObjectEnvironmentRecord.prototype.implicitThisValue = function(provideThis) {
	if (provideThis) {
		return this._bindingObject;
	} else {
		return new Types.TypeUndefined();
	}
};

// ******** Reference Class ********

function Reference(baseValue, referencedName, strictReference) {
	this.baseValue = undefined;
	this.referencedName = "";
	this.strictReference = false;
	this._isReference = true;
};

function getBase(v) {
	return v.baseValue;
}
exports.getBase = getBase;

function getReferencedName(v) {
	return v.referencedName;
};
exports.getReferencedName = getReferencedName;

function isStrictReference(v) {
	return v.strictReference;
};
exports.isStrictReference = isStrictReference;

function hasPrimitiveBase(v) {
	var className = getBase(v).className;
	return !~["Number", "String", "Boolean"].indexOf(className);
};
exports.hasPrimitiveBase = hasPrimitiveBase;

function isPropertyReference(v) {
	return hasPrimitiveBase(v) || getBase(v).className === "Object";
};
exports.isPropertyReference = isPropertyReference;

function isUnresolvableReference(v) {
	return getBase(v) === undefined;
};
exports.isUnresolvableReference = isUnresolvableReference;

function getValue(v) {
	if (v._isReference) {
		var base = getBase(v);
		if (isUnresolvableReference(v)) {
			throw new Exceptions.ReferenceError();
		}
		var get;
		if (isPropertyReference(v)) {
			if (hasPrimitiveBase(v)) {
				get = function(p) {
					var o = Types.toObject(base),
						desc = o.getProperty(p);
					if (desc === undefined) {
						return undefined;
					}
					if (Types.isDataDescriptor(desc)) {
						return desc.value;
					} else {
						if (!desc.get) {
							return undefined;
						}
						return desc.get.call(base);
					}
				};
			} else {
				get = base.get;
			}
			return get(getReferencedName(v));
		} else {
			return base.getBindingValue(v);
		}
	} else {
		return v;
	}
}
exports.getValue = getValue;

function putValue(v, w) {
	var put;
	if (!v._isReference) {
		throw new Exceptions.ReferenceError();
	}

	var base = getBase(v);
	if (isUnresolvableReference(v)) {
		if (isStrictReference(v)) {
			throw new Exceptions.ReferenceError();
		}
		global.globalObject.put(getReferencedName(v), w, false);
	} else if(isPropertyReference(v)) {
		if (hasPrimitiveBase(v)) {
			var o = Types.toObject(base),
				p = getReferencedName(v),
				throwFlag = isStrictReference(v);
			if (!o.canPut(p)) {
				if (throwFlag) {
					throw new Exceptions.TypeError();
				}
				return;
			}
			if (Types.isDataDescriptor(o.getOwnProperty(p))) {
				if (throwFlag) {
					throw new Exceptions.TypeError();
				}
				return;
			}
			var desc = o.getProperty(p);
			if (Types.isAccessorDescriptor(desc)) {
				desc.setter.call(base, w);
			} else if (throwFlag) {
				throw new Exceptions.TypeError();
			}
		} else {
			base.put(getReferencedName(v), w, isStrictReference(v));
		}
	} else {
		base.setMutableBinding(getReferencedName(v), w, isStrictReference(v));
	}
}
exports.putValue = putValue;

// ******** Lexical Environment Operations ********

function getIdentifierReference(lex, name, strict) {
	var newRef;
	if (lex === null) {
		newRef = new Reference();
		newRef.baseValue = new Types.TypeUndefined();
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
exports.getIdentifierReference = getIdentifierReference;

function newDeclarativeEnvironment(e) {
	return {
		envRec: new DeclarativeEnvironmentRecord(),
		outer: e
	};
}
exports.newDeclarativeEnvironment = newDeclarativeEnvironment;

function newObjectEnvironment(o, e) {
	return {
		envRec: new ObjectEnvironmentRecord(o),
		outer: e
	}
}
exports.newObjectEnvironment = newObjectEnvironment;

var globalObject = exports.globalObject = new Types.TypeObject(),
	globalContext = exports.globalContext = {
		lexicalEnv: new newObjectEnvironment(globalObject),
		variableEnv: new newObjectEnvironment(globalObject),
		thisBinding: globalObject
	};

function createEvalContext() {
	
}
exports.createEvalContext = createEvalContext;

function createFunctionContext() {
	
}
exports.createFunctionContext = createFunctionContext;

var contextStack = [];
function enterContext(context) {
	contextStack.push(context);
}
exports.enterContect = enterContext;

function exitContext() {
	contextStack.pop();
}
exports.exitContext = exitContext;