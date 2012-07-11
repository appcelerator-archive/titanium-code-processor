
// See Chapter 8 in the ECMA-262 specification for full explanations of these types and their properties

var util = require("util"),
	Exceptions = require("./Exceptions.js"),
	TiUtil = require("./TiUtil.js");

// ******** Non-spec helpers ********

function isPrimitive(o) {
	return !!~["Number", "String", "Boolean", "Undefined", "Null"].indexOf(o.className);
}
exports.isPrimitive = isPrimitive;

function type(t) {
	return t.className;
}
exports.type = type;

function sameDesc(x, y) {

	if (typeof x === typeof y) {
		if (typeof x === "object") {
			var xKeys = Object.keys(x),
				yKeys = Object.keys(y),
				same = true;

			if (xKeys.length !== yKeys.length) {
				return false;
			}
			for(var i in xKeys) {
				if (i in yKeys) {
					same = same && (sameDesc(x[xKeys[i]], y[xKeys[i]]));
				} else {
					return false;
				}
			}
			return same;
		} else {
			return x === y;
		}
	} else {
		return false;
	}
};
exports.sameDesc = sameDesc;

// ******** Property Type Classes ********

function TypeDataProperty() {

	this.value = new TypeUndefined();
	this.writeable = false;
	this.enumerable = false;
	this.configurable = false;
};
exports.TypeDataProperty = TypeDataProperty;

function TypeAccessorProperty() {

	this.get = new TypeUndefined();
	this.set = new TypeUndefined();
	this.enumerable = false;
	this.configurable = false;
};
exports.TypeAccessorProperty = TypeAccessorProperty;

// ******** Property Descriptor Query Methods ********

function isDataDescriptor(desc) {
	if (!desc) {
		return false;
	}
	if (!TiUtil.isDef(desc.value) && !TiUtil.isDef(desc.writeable)) {
		return false;
	}
	return true;
};
exports.isDataDescriptor = isDataDescriptor;

function isAccessorDescriptor(desc) {
	if (!desc) {
		return false;
	}
	if (!TiUtil.isDef(desc.get) && !TiUtil.isDef(desc.set)) {
		return false;
	}
	return true;
};
exports.isAccessorDescriptor = isAccessorDescriptor;

function isGenericDescriptor(desc) {
	if (!desc) {
		return false;
	}
	return !exports.isAccessorDescriptor(desc) && !exports.isDataDescriptor(desc);
};
exports.isGenericDescriptor = isGenericDescriptor;

function fromPropertyDescriptor(desc) {
	
	if (!desc) {
		return new TypeUndefined();
	}
	
	var obj = new TypeObject();
	
	if (exports.isDataDescriptor(desc)) {
	
		obj.defineOwnProperty("value", {
			value: desc.value,
			writeable: true,
			enumerable: true,
			configurable: true
		}, false);
		
		var writeable = new TypeBoolean();
		writeable.value = desc.writeable
		obj.defineOwnProperty("writeable", {
			value: writeable,
			writeable: true,
			enumerable: true,
			configurable: true
		}, false);
		
	} else {
	
		obj.defineOwnProperty("get", {
			value: desc.get,
			writeable: true,
			enumerable: true,
			configurable: true
		}, false);
		
		obj.defineOwnProperty("set", {
			value: desc.set,
			writeable: true,
			enumerable: true,
			configurable: true
		}, false);
	}
	
	var configurable = new TypeBoolean(),
		enumerable = new TypeBoolean();
	configurable.value = desc.configurable
	enumerable.value = desc.enumerable;
	
	obj.defineOwnProperty("configurable", {
		value: configurable,
		writeable: true,
		enumerable: true,
		configurable: true
	}, false);
	
	obj.defineOwnProperty("enumerable", {
		value: enumerable,
		writeable: true,
		enumerable: true,
		configurable: true
	}, false);
	
	return obj;
};
exports.fromPropertyDescriptor = fromPropertyDescriptor;

function toPropertyDescriptor(obj) {
	if (type(obj) !== "Object") {
		throw new Exceptions.TypeError();
	}
	var desc = {};
	if (obj.hasProperty("enumerable")) {
		desc.enumerable = toBoolean(obj.get("enumerable")).value;
	}
	if (obj.hasProperty("configurable")) {
		desc.configurable = toBoolean(obj.get("configurable")).value;
	}
	if (obj.hasProperty("value")) {
		desc.value = obj.get("value");
	}
	if (obj.hasProperty("writeable")) {
		desc.writeable = toBoolean(obj.get("writeable")).value;
	}
	if (obj.hasProperty("get")) {
		var getter = obj.get("get");
		if (type(getter) !== "Undefined" && !isCallable(getter)) {
			throw new Exceptions.TypeError();
		}
		desc.get = getter;
	}
	if (obj.hasProperty("set")) {
		var setter = obj.get("set");
		if (type(setter) !== "Undefined" && !isCallable(setter)) {
			throw new Exceptions.TypeError();
		}
		desc.set = setter;
	}
	if((desc.get || desc.set) && (TiUtil.isDef(desc.value) || TiUtil.isDef(desc.writeable))) {
		throw new Exceptions.TypeError();
	}
	return desc;
};
exports.toPropertyDescriptor = toPropertyDescriptor;

// ******** Base Type Class ********

function TypeBase(className) {
	this.className = className;
};

// ******** Object Type Class ********

function TypeObject(type) {
	TypeBase.call(this, type || "Object");

	this._properties = {};

	this.objectPrototype = null;
	this.extensible = true;
};
util.inherits(TypeObject, TypeBase);
exports.TypeObject = TypeObject;

TypeObject.prototype.get = function get(p) {
	var desc = this.getProperty(p);
	if (desc) {
		if (isDataDescriptor(desc)) {
			return desc.value;
		} else {
			return desc.get.className !== "Undefined" ? desc.get.call(this) : new TypeUndefined();
		}
	}
	return new TypeUndefined();
};

TypeObject.prototype.getOwnProperty = function getOwnProperty(p) {
	if (this._properties[p]) {
		var d = {},
			x = this._properties[p];
		if (isDataDescriptor(x)) {
			d.value = x.value;
			d.writeable = x.writeable;
		} else {
			d.get = x.get;
			d.set = x.set;
		}
		d.enumerable = x.enumerable;
		d.configurable = x.configurable;
		return d;
	}
	return undefined;
};

TypeObject.prototype.getProperty = function getProperty(p) {
	var prop = this.getOwnProperty(p);
	if (prop) {
		return prop;
	}
	return this.objectPrototype ? this.objectPrototype.getProperty(p) : undefined;
};

TypeObject.prototype.put = function put(p, v, throwFlag) {
	if (!this.canPut(p)) {
		if (throwFlag) {
			throw new Exceptions.TypeError("Cannot put argument");
		} else {
			return;
		}
	}

	var ownDesc = this.getOwnProperty(p);
	if (isDataDescriptor(ownDesc)) {
		this.defineOwnProperty(p, { value: v }, throwFlag);
		return;
	}

	var desc = this.getProperty(p);
	if (isAccessorDescriptor(desc)) {
		desc.set.call(this, v);
	} else {
		this.defineOwnProperty(p, {
			value: v,
			writeable: true,
			enumerable: true,
			configurable: true
		}, throwFlag);
	}
};

TypeObject.prototype.canPut = function canPut(p) {
	var desc = this.getOwnProperty(p);
	if (desc) {
		if (isAccessorDescriptor(desc)) {
			return desc.set.className !== "Undefined";
		} else {
			return desc.writeable;
		}
	}

	if (!this.objectPrototype) {
		return this.extensible;
	}

	var inherited = this.objectPrototype.getProperty(p);
	if (inherited === undefined) {
		return this.extensible;
	}

	if (isAccessorDescriptor(inherited)) {
		return inherited.set.className !== "Undefined";
	} else {
		return this.extensible && inherited.writeable;
	}
};

TypeObject.prototype.hasProperty = function hasProperty(p) {
	return !!this.getProperty(p);
};

TypeObject.prototype["delete"] = function objDelete(p, throwFlag) {
	var desc = this.getOwnProperty(p);
	if (desc === undefined) {
		return true;
	}
	if (desc.configurable) {
		delete this._properties[p];
		return true;
	}
	if (throwFlag) {
		throw new Exceptions.TypeError("Unable to delete '" + p + "'");
	}
	return false;
};

TypeObject.prototype.defaultValue = function defaultValue(hint) {

	function defaultToString() {
		var toString = this.get("toString"),
			str;
		if (isCallable(toString)) {
			str = toString.call(this);
			if (isPrimitive(str)) {
				return str;
			}
		}
		return undefined;
	}

	function defaultValueOf() {
		var valueOf = this.get("valueOf");
		if (isCallable(valueOf)) {
			var val = valueOf.call(this);
			if (isPrimitive(val)) {
				return val;
			}
		}
		return undefined;
	}

	if (hint === "String") {
		if (!defaultToString.call(this)) {
			if (!defaultValueOf.call(this)) {
				throw new Exceptions.TypeError();
			}
		}
	} else {
		if (!defaultValueOf.call(this)) {
			if (!defaultToString.call(this)) {
				throw new Exceptions.TypeError();
			}
		}
	}
};

TypeObject.prototype.defineOwnProperty = function defineOwnProperty(p, desc, throwFlag) {
	var current = this.getOwnProperty(p),
		newProp,
		descKeys = Object.keys(desc);
	
	if (current === undefined && !this.extensible) {
		if (throwFlag) {
			throw new Exceptions.TypeError();
		}
		return false;
	}

	if (current === undefined && this.extensible) {
		if (isAccessorDescriptor(desc)) {
			newProp = new TypeAccessorProperty();
			if (TiUtil.isDef(desc.configurable)) {
				newProp.configurable = desc.configurable;
			}
			if (TiUtil.isDef(desc.enumerable)) {
				newProp.enumerable = desc.enumerable;
			}
			if (TiUtil.isDef(desc.get)) {
				newProp.get = desc.get;
			}
			if (TiUtil.isDef(desc.set)) {
				newProp.set = desc.set;
			}
		} else {
			newProp = new TypeDataProperty();
			if (TiUtil.isDef(desc.configurable)) {
				newProp.configurable = desc.configurable;
			}
			if (TiUtil.isDef(desc.enumerable)) {
				newProp.enumerable = desc.enumerable;
			}
			if (TiUtil.isDef(desc.value)) {
				newProp.value = desc.value;
			}
			if (TiUtil.isDef(desc.writeable)) {
				newProp.writeable = desc.writeable;
			}
		}
		this._properties[p] = newProp;
		return true;
	}

	if (descKeys.length === 0) {
		return true;
	}

	if (sameDesc(current, desc)) {
		return true;
	}
	if (!current.configurable) {
		if (desc.configurable || (TiUtil.isDef(desc.enumerable) && desc.enumerable != current.enumerable)) {
			if (throwFlag) {
				throw new Exceptions.TypeError();
			}
			return false;
		}
	}

	if (isGenericDescriptor(desc)) {
		current = desc;
	} else if (isDataDescriptor(desc) !== isDataDescriptor(current)) {
		if(!current.configurable) {
			if (throwFlag) {
				throw new Exceptions.TypeError();
			}
			return false;
		}

		if (isDataDescriptor(current)) {
			newProp = new TypeAccessorProperty();
			newProp.configurable = current.configurable;
			newProp.enumerable = current.enumerable;
		} else {
			newProp = new TypeDataProperty();
			newProp.configurable = current.configurable;
			newProp.enumerable = current.enumerable;
		}
		current = newProp;
	} else if (isDataDescriptor(desc) && isDataDescriptor(current)) {
		if (!current.configurable) {
			if (!current.writeable && desc.writeable) {
				if (throwFlag) {
					throw new Exceptions.TypeError();
				}
				return false;
			}
			if (!current.writeable && TiUtil.isDef(desc.value) && !sameDesc(desc, current)) {
				if (throwFlag) {
					throw new Exceptions.TypeError();
				}
				return false;
			}
		}
	} else if (isAccessorDescriptor(desc) && isAccessorDescriptor(current)) {
		if (!current.configurable) {
			if(TiUtil.isDef(desc.set) && !sameDesc(desc.set, current.set)) {
				if (throwFlag) {
					throw new Exceptions.TypeError();
				}
				return false;
			}
			if(TiUtil.isDef(desc.get) && !sameDesc(desc.get, current.get)) {
				if (throwFlag) {
					throw new Exceptions.TypeError();
				}
				return false;
			}
		}
	}
	for(var i in descKeys) {
		current[descKeys[i]] = desc[descKeys[i]];
	}
	this._properties[p] = current;
	return true;
};

// ******** Undefined Type Class ********

function TypeUndefined(className) {
	TypeBase.call(this, "Undefined");
};
util.inherits(TypeUndefined, TypeBase);
exports.TypeUndefined = TypeUndefined;

// ******** Null Type Class ********

function TypeNull(className) {
	TypeBase.call(this, "Null");
	this.value = null;
};
util.inherits(TypeNull, TypeBase);
exports.TypeNull = TypeNull;

// ******** Number Type Class ********

function TypeNumber(className) {
	TypeBase.call(this, "Number");
};
util.inherits(TypeNumber, TypeBase);
exports.TypeNumber = TypeNumber;

// ******** Boolean Type Class ********

function TypeBoolean(className) {
	TypeBase.call(this, "Boolean");
	this.value = false;
};
util.inherits(TypeBoolean, TypeBase);
exports.TypeBoolean = TypeBoolean;

// ******** String Type Class ********

function TypeString(className) {
	TypeObject.call(this, "String");
};
util.inherits(TypeString, TypeBase);
exports.TypeString = TypeString;

// ******** Number Object Type Class ********

function TypeNumberObject(className) {
	TypeBase.call(this, "Object");
};
util.inherits(TypeNumberObject, TypeObject);
exports.TypeNumberObject = TypeNumberObject;

// ******** Boolean Object Type Class ********

function TypeBooleanObject(className) {
	TypeBase.call(this, "Object");
	this.value = false;
};
util.inherits(TypeBooleanObject, TypeObject);
exports.TypeBooleanObject = TypeBooleanObject;

// ******** String Object Type Class ********

function TypeStringObject(className) {
	TypeObject.call(this, "Object");
};
util.inherits(TypeStringObject, TypeObject);
exports.TypeStringObject = TypeStringObject;

// ******** Unknown Type Class ********

function TypeUnknown(className) {
	TypeObject.call(this, "Unknown");
};
util.inherits(TypeUnknown, TypeObject);
exports.TypeUnknown = TypeUnknown;

// ******** Type Conversions ********

function toPrimitive(input, preferredType) {
	if (type(input) === "Object") {
		return input.getDefaultValue(preferredType);
	} else {
		return input;
	}
};
exports.toPrimitive = toPrimitive;

function toBoolean(input) {
	var newBoolean = new TypeBoolean();
	switch(type(input)) {
		case "Undefined":
			newBoolean.value = false;
			break;
		case "Null":
			newBoolean.value = false;
			break;
		case "Boolean":
			newBoolean.value = input.value;
			break;
		case "Number":
			newBoolean.value = !!input.value;
			break;
		case "String":
			newBoolean.value = !!input.value;
			break;
		case "Object":
			newBoolean.value = true;
			break;
	}
	return newBoolean;
};
exports.toBoolean = toBoolean;

function toNumber(input) {
	var newNumber = new TypeNumber();
	switch(type(input)) {
		case "Undefined":
			newNumber.value = NaN;
			break;
		case "Null":
			newNumber.value = 0;
			break;
		case "Boolean":
			newNumber.value = input.value ? 1 : 0;
			break;
		case "Number":
			newNumber.value = input.value;
			break;
		case "String":
			newNumber.value = parseFloat(input.value);
			newNumber.value = isNaN(newNumber.value) ? 0 : newNumber.value;
			break;
		case "Object":
			newNumber.value = toNumber(toPrimitive(input, "Number"));
			break;
	}
	return newNumber;
};
exports.toNumber = toNumber;

function toInteger(input) {
	var newNumber = toNumber(input);
	if (isNaN(newNumber.value)) {
		newNumber.value = 0;
	} else {
		newNumber.value = Math.floor(newNumber.value);
	}
	return newNumber;
};
exports.toInteger = toInteger;

function toInt32(input) {
	var newNumber = toNumber(input);
	if (isNaN(newNumber.value) || newNumber.value === Infinity || newNumber.value === -Infinity) {
		newNumber.value = 0;
	} else {
		newNumber.value = Math.floor(newNumber.value) % Math.pow(2,32);
		if (newNumber.value >= Math.pow(2,31)) {
			newNumber.value -= Math.pow(2,32);
		}
	}
	return newNumber;
};
exports.toInt32 = toInt32;

function toUint32(input) {
	var newNumber = toNumber(input);
	if (isNaN(newNumber.value) || newNumber.value === Infinity || newNumber.value === -Infinity) {
		newNumber.value = 0;
	} else {
		newNumber.value = Math.floor(newNumber.value) % Math.pow(2,32);
	}
	return newNumber;
};
exports.toUint32 = toUint32;

function toUint16(input) {
	var newNumber = toNumber(input);
	if (isNaN(newNumber.value) || newNumber.value === Infinity || newNumber.value === -Infinity) {
		newNumber.value = 0;
	} else {
		newNumber.value = Math.floor(newNumber.value) % Math.pow(2,16);
	}
	return newNumber;
};
exports.toUint16 = toUint16;

function toString(input) {
	var newString = new TypeString();
	if (type(input) === "Object") {
		newString.value = toString(toPrimitive(input, "String"));
	} else {
		newString.value = input.value + "";
	}
	return newString;
};
exports.toString = toString;

function toObject(input) {
	var newObject;
	switch(type(input)) {
		case "Boolean":
			newObject = new TypeBooleanObject();
			newObject.value = input.value;
			return newObject;
		case "Number":
			newObject = new TypeNumberObject();
			newObject.value = input.value;
			return newObject;
		case "String":
			newObject = new TypeStringObject();
			newObject.value = input.value;
			return newObject;
		case "Object":
			return input;
		default:
			throw new Exceptions.TypeError();
	}
	return newObject;
};
exports.toObject = toObject;

function checkObjectCoercible(input) {
	var inputType = type(input);
	if (inputType === "Undefined" || inputType === "Null") {
		throw new Exceptions.TypeError();
	}
	return;
};
exports.checkObjectCoercible = checkObjectCoercible;

function isCallable(input) {
	if (type(input) === "Object") {
		return !!input.call;
	} else {
		return false;
	}
};
exports.isCallable = isCallable;

function sameValue(x, y) {
	return x.value === y.value;
};
exports.sameValue = sameValue;
