
// See Chapter 8 in the ECMA-262 specification for full explanations of these types and their properties

var util = require("util"),
	Reference = require("./Reference.js"),
	TypeConversion = require("../type_conversion/TypeConversion.js"),
	TiUtil = require.("../TiUtil.js");

// ******** Data Property Type Class ********

function TypeDataProperty() {

	this.value = undefined;
	this.writeable = false;
	this.enumerable = false;
	this.configurable = false;
};
exports.TypeDataProperty = TypeDataProperty;

// ******** Accessor Property Type Class ********

function TypeAccessorProperty() {

	this.get = undefined;
	this.set = undefined;
	this.enumerable = false;
	this.configurable = false;
};
exports.TypeAccessorProperty = TypeAccessorProperty;

// ******** Base Type Class ********

function TypeBase(className) {
	this.className = className;
};

// ******** Number Type Class ********
function TypeNumber(className) {
	TypeBase.call(this, "Number");
};
util.inherits(exports.TypeNumber = TypeNumber, TypeBase);

// ******** Boolean Type Class ********

function TypeBoolean(className) {
	TypeBase.call(this, "Boolean");
};
util.inherits(exports.TypeBoolean = TypeBoolean, TypeBase);

// ******** Object Type Class ********

function TypeObject(type) {
	TypeBase.call(this, type || "Object");

	this._properties = {};

	this.objectPrototype = null;
	this.extensible = true;
};
util.inherits(exports.TypeObject = TypeObject, TypeBase);

TypeObject.prototype.get = function get(p) {
	var desc = this.getProperty(p);
	if (desc === undefined) {
		return undefined;
	}
	if (Reference.isDataDescriptor(x)) {
		return x.value;
	} else {
		return desc.get && desc.get.call(this);
	}
};

TypeObject.prototype.getOwnProperty = function getOwnProperty(p) {
	if (!this._properties[p]) {
		return undefined;
	}
	var d = {},
		x = this._properties[p];
	if (Reference.isDataDescriptor(x)) {
		d.value = x.value;
		d.writeable = x.writeable;
	} else {
		d.get = x.get;
		d.set = x.set;
	}
	d.enumerable = x.enumerable;
	d.configurable = x.configurable;
	return d;
};

TypeObject.prototype.getProperty = function getProperty(p) {
	var prop = this.getOwnProperty(p);
	if (prop) {
		return prop;
	}
	return this.objectPrototype && this.objectPrototype.getProperty(p);
};

TypeObject.prototype.put = function put(p, v, throwFlag) {
	if (!this.canPut(p)) {
		if (throwFlag) {
			throw new TypeError("Cannot put argument");
		} else {
			return;
		}
	}

	var ownDesc = this.getOwnProperty(p);
	if (Reference.isDataDescriptor(ownDesc)) {
		this.defineOwnProperty(p, { value: v }, throwFlag);
		return;
	}

	var desc = this.getProperty(p);
	if (Reference.isAccessorDescriptor(desc)) {
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
		if (Reference.isAccessorDescriptor(desc)) {
			return !!desc.set;
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

	if (Reference.isAccessorDescriptor(inherited)) {
		return !!inherited.set;
	} else {
		if (!inherited.extensible) {
			return false;
		} else {
			return inherited.writeable;
		}
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
		throw new TypeError("Unable to delete '" + p + "'");
	}
	return false;
};

TypeObject.prototype.defaultValue = function defaultValue(hint) {

	function defaultToString() {
		var toString = this.get("toString"),
			str;
		if (TypeConversion.isCallable(toString)) {
			str = toString.call(this);
			if (Reference.isPrimitive(str)) {
				return str;
			}
		}
		return undefined;
	}

	function defaultValueOf() {
		var valueOf = this.get("valueOf");
		if (TypeConversion.isCallable(valueOf)) {
			var val = valueOf.call(this);
			if (Reference.isPrimitive(val)) {
				return val;
			}
		}
		return undefined;
	}

	if (hint === "String") {
		if (!defaultToString.call(this)) {
			if (!defaultValueOf.call(this)) {
				throw new TypeError();
			}
		}
	} else {
		if (!defaultValueOf.call(this)) {
			if (!defaultToString.call(this)) {
				throw new TypeError();
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
			throw new TypeError();
		}
		return false;
	}

	if (current === undefined && this.extensible) {
		if (Reference.isGenericDescriptor(desc) || Reference.isDataDescriptor(desc)) {
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
		} else {
			newProp = new TypeAccessorProperty();
			if (TiUtil.isDef(desc.configurable)) {
				newProp.configurable = desc.configurable;
			}
			if (TiUtil.isDef(desc.enumerable)) {
				newProp.enumerable = desc.enumerable;
			}
			if (TiUtil.isDef(desc.get)) {
				newProp.value = desc.value;
			}
			if (TiUtil.isDef(desc.set)) {
				newProp.writeable = desc.writeable;
			}
		}
		this._properties[p] = newProp;
		return true;
	}

	if (descKeys.length === 0) {
		return true;
	}

	if (TypeConversion.sameValue(current, desc)) {
		return true;
	}
	if (!current.configurable) {
		if (desc.configurable || (isDef(desc.enumerable) && desc.enumerable != current.enumerable)) {
			if (throwFlag) {
				throw new TypeError();
			}
			return false;
		}
	}

	if (Reference.isDataDescriptor(desc) != Reference.isDataDescriptor(current)) {
		if(!current.configurable) {
			if (throwFlag) {
				throw new TypeError();
			}
			return false;
		}

		if (Reference.isDataDescriptor(current)) {
			newProp = new TypeAccessorProperty();
			newProp.configurable = current.configurable;
			newProp.enumerable = current.enumerable;
		} else {
			newProp = new TypeDataProperty();
			newProp.configurable = current.configurable;
			newProp.enumerable = current.enumerable;
		}
	} else if (Reference.isDataDescriptor(desc) && Reference.isDataDescriptor(current)) {
		if (!current.configurable) {
			if (!current.writeable && desc.writeable) {
				if (throwFlag) {
					throw new TypeError();
				}
				return false;
			}
			if (!current.writeable && TiUtil.isDef(desc.value) && !TypeConversion.sameValue(desc.value, current.value)) {
				if (throwFlag) {
					throw new TypeError();
				}
				return false;
			}
		}
	} else if (Reference.isAccessorDescriptor(desc) && Reference.isAccessorDescriptor(current)) {
		if (!current.configurable) {
			if(TiUtil.isDef(desc.set) && !TypeConversion.sameValue(desc.set, current.set)) {
				if (throwFlag) {
					throw new TypeError();
				}
				return false;
			}
			if(TiUtil.isDef(desc.get) && !TypeConversion.sameValue(desc.get, current.get)) {
				if (throwFlag) {
					throw new TypeError();
				}
				return false;
			}
		}
	}
	for(var i in descKeys) {
		newProp[i] = desc[i];
	}
	this._properties[p] = newProp;
	return true;
};

// ******** String Type Class ********

function TypeString(className) {
	TypeObject.call(this, "String");
};
util.inherits(exports.TypeString = TypeString, TypeObject);