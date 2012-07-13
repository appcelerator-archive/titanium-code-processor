/** 
 * This module contains many base operations used by the code processor. Almost all of the methods and classes strictly
 * implement methods/objects defined in the ECMA-262 specification. Many of the descriptions are taken directly from the
 * ECMA-262 Specification, which can be obtained from 
 * <a href="http://www.ecma-international.org/publications/standards/Ecma-262.htm">ecma international</a>
 * 
 * See Chapters 8, 9, and 10 in the ECMA-262 specification for more explanations of these objects and methods.
 * 
 * @module Base 
 */

var util = require("util"),
	Exceptions = require("./Exceptions.js"),
	TiUtil = require("./TiUtil.js");

// ******** Non-spec helpers ********

/**
 * Checks if the given value is a primitive type, i.e. {@link module:Base.type}(o) is one of "Number", "String", "Boolean", 
 * "Undefined", or "Null".
 * 
 * @method
 * @param {module:Base.TypeBase} o The value to check
 * @returns {Boolean} Whether or not the value is a primitive
 * @see sameDesc
 */
exports.isPrimitive = function isPrimitive(o) {
	return !!~["Number", "String", "Boolean", "Undefined", "Null"].indexOf(o.className);
}
var isPrimitive = exports.isPrimitive; // The export is assigned to a var later in order to get JSDoc to link properly

/**
 * Determines the type of the value.
 * 
 * @method
 * @param {module:Base.TypeBase} t The value to check
 * @returns {String} The type of the value, one of "Undefined", "Null", "Number", "String", "Boolean", "Object", 
 *		"Reference", "Unknown".
 */
exports.type = function type(t) {
	return t.className;
}
var type = exports.type;

/**
 * Checks if two descriptions describe the same description.
 * 
 * @method
 * @param {module:Base.DataPropertyDescriptor|module:Base.AccessorPropertyDescriptor} x The first descriptor
 * @param {module:Base.DataPropertyDescriptor|module:Base.AccessorPropertyDescriptor} y The second descriptor
 * @returns {Boolean} Whether or not the descriptions are the same
 */
exports.sameDesc = function sameDesc(x, y) {

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
var sameDesc = exports.sameDesc;

/*****************************************
 *
 * Chapter 8 - Types
 *
 *****************************************/

// ******** Property Classes ********

/**
 * A Data Descriptor represents the interface an object exposes for getting and setting a property
 * 
 * @constructor
 */
exports.DataPropertyDescriptor = function DataPropertyDescriptor() {
	this.value = new TypeUndefined();
	this.writeable = false;
	this.enumerable = false;
	this.configurable = false;
};
var DataPropertyDescriptor = exports.DataPropertyDescriptor;

/**
 * @constructor
 */
exports.AccessorPropertyDescriptor = function AccessorPropertyDescriptor() {

	this.get = new TypeUndefined();
	this.set = new TypeUndefined();
	this.enumerable = false;
	this.configurable = false;
};
var AccessorPropertyDescriptor = exports.AccessorPropertyDescriptor;

// ******** Property Descriptor Query Methods ********

/**
 * @method
 */
exports.isDataDescriptor = function isDataDescriptor(desc) {
	if (!desc) {
		return false;
	}
	if (!TiUtil.isDef(desc.value) && !TiUtil.isDef(desc.writeable)) {
		return false;
	}
	return true;
};
var isDataDescriptor = exports.isDataDescriptor;

/**
 * @method
 */
exports.isAccessorDescriptor = function isAccessorDescriptor(desc) {
	if (!desc) {
		return false;
	}
	if (!TiUtil.isDef(desc.get) && !TiUtil.isDef(desc.set)) {
		return false;
	}
	return true;
};
var isAccessorDescriptor = exports.isAccessorDescriptor;

/**
 * @method
 */
exports.isGenericDescriptor = function isGenericDescriptor(desc) {
	if (!desc) {
		return false;
	}
	return !exports.isAccessorDescriptor(desc) && !exports.isDataDescriptor(desc);
};
var isGenericDescriptor = exports.isGenericDescriptor;

/**
 * @method
 */
exports.fromPropertyDescriptor = function fromPropertyDescriptor(desc) {
	
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
var fromPropertyDescriptor = exports.fromPropertyDescriptor;

/**
 * @method
 */
exports.toPropertyDescriptor = function toPropertyDescriptor(obj) {
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
var toPropertyDescriptor = exports.toPropertyDescriptor;

// ******** Base Type Class ********

/**
 * @constructor
 */
exports.TypeBase = function TypeBase(className) {
	this.className = className;
};
var TypeBase = module.exports.TypeBase;

// ******** Object Type Class ********

/**
 * @constructor
 * @extends module:Base.TypeBase
 */
exports.TypeObject = function TypeObject(type) {
	TypeBase.call(this, type || "Object");

	this._properties = {};

	this.objectPrototype = null;
	this.extensible = true;
};
var TypeObject = exports.TypeObject;
util.inherits(TypeObject, TypeBase);

/**
 * @method
 */
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

/**
 * @method
 */
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

/**
 * @method
 */
TypeObject.prototype.getProperty = function getProperty(p) {
	var prop = this.getOwnProperty(p);
	if (prop) {
		return prop;
	}
	return this.objectPrototype ? this.objectPrototype.getProperty(p) : undefined;
};

/**
 * @method
 */
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

/**
 * @method
 */
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

/**
 * @method
 */
TypeObject.prototype.hasProperty = function hasProperty(p) {
	return !!this.getProperty(p);
};

/**
 * @method
 */
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

/**
 * @method
 */
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

/**
 * @method
 */
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
			newProp = new AccessorPropertyDescriptor();
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
			newProp = new DataPropertyDescriptor();
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
			newProp = new AccessorPropertyDescriptor();
			newProp.configurable = current.configurable;
			newProp.enumerable = current.enumerable;
		} else {
			newProp = new DataPropertyDescriptor();
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

/**
 * @constructor
 * @extends module:Base.TypeBase
 */
exports.TypeUndefined = function TypeUndefined(className) {
	TypeBase.call(this, "Undefined");
};
var TypeUndefined = exports.TypeUndefined;
util.inherits(TypeUndefined, TypeBase);

// ******** Null Type Class ********

/**
 * @constructor
 * @extends module:Base.TypeBase
 */
exports.TypeNull = function TypeNull(className) {
	TypeBase.call(this, "Null");
	this.value = null;
};
var TypeNull = exports.TypeNull;
util.inherits(TypeNull, TypeBase);

// ******** Number Type Class ********

/**
 * @constructor
 * @extends module:Base.TypeBase
 */
exports.TypeNumber = function TypeNumber(className) {
	TypeBase.call(this, "Number");
};
var TypeNumber = exports.TypeNumber;
util.inherits(TypeNumber, TypeBase);

// ******** Boolean Type Class ********

/**
 * @constructor
 * @extends module:Base.TypeBase
 */
exports.TypeBoolean = function TypeBoolean(className) {
	TypeBase.call(this, "Boolean");
	this.value = false;
};
var TypeBoolean = exports.TypeBoolean;
util.inherits(TypeBoolean, TypeBase);

// ******** String Type Class ********

/**
 * @constructor
 * @extends module:Base.TypeBase
 */
exports.TypeString = function TypeString(className) {
	TypeObject.call(this, "String");
};
var TypeString = exports.TypeString;
util.inherits(TypeString, TypeBase);

// ******** Number Object Type Class ********

/**
 * @constructor
 * @extends module:Base.TypeObject
 */
exports.TypeNumberObject = function TypeNumberObject(className) {
	TypeObject.call(this, "Object");
};
var TypeNumberObject = exports.TypeNumberObject;
util.inherits(TypeNumberObject, TypeObject);

// ******** Boolean Object Type Class ********

/**
 * @constructor
 * @extends module:Base.TypeObject
 */
exports.TypeBooleanObject = function TypeBooleanObject(className) {
	TypeObject.call(this, "Object");
	this.value = false;
};
var TypeBooleanObject = exports.TypeBooleanObject;
util.inherits(TypeBooleanObject, TypeObject);

// ******** String Object Type Class ********

/**
 * @constructor
 * @extends module:Base.TypeObject
 */
exports.TypeStringObject = function TypeStringObject(className) {
	TypeObject.call(this, "Object");
};
var TypeStringObject = exports.TypeStringObject;
util.inherits(TypeStringObject, TypeObject);

// ******** Reference Class ********

/**
 * @constructor
 * @extends module:Base.TypeBase
 */
exports.TypeReference = function TypeReference(baseValue, referencedName, strictReference) {
	TypeBase.call(this, "Reference");
	this.baseValue = undefined;
	this.referencedName = "";
	this.strictReference = false;
};
var TypeReference = exports.TypeReference;
util.inherits(TypeReference, TypeBase);

/**
 * @method
 */
exports.getBase = function getBase(v) {
	return v.baseValue;
}
var getBase = exports.getBase;

/**
 * @method
 */
exports.getReferencedName = function getReferencedName(v) {
	return v.referencedName;
};
var getReferencedName = exports.getReferencedName;

/**
 * @method
 */
exports.isStrictReference = function isStrictReference(v) {
	return v.strictReference;
};
var isStrictReference = exports.isStrictReference;

/**
 * @method
 */
exports.hasPrimitiveBase = function hasPrimitiveBase(v) {
	return !!~["Number", "String", "Boolean"].indexOf(type(getBase(v)));
};
var hasPrimitiveBase = exports.hasPrimitiveBase;

/**
 * @method
 */
exports.isPropertyReference = function isPropertyReference(v) {
	return hasPrimitiveBase(v) || type(getBase(v)) === "Object";
};
isPropertyReference = exports.isPropertyReference;

/**
 * @method
 */
exports.isUnresolvableReference = function isUnresolvableReference(v) {
	return getBase(v) === undefined;
};
var isUnresolvableReference = exports.isUnresolvableReference;

/**
 * @method
 */
exports.getValue = function getValue(v) {
	if (type(v) !== "Reference") {
		return v;
	}
	if (isUnresolvableReference(v)) {
		throw new Exceptions.ReferenceError();
	}
	
	var base = getBase(v),
		get;
	if (isPropertyReference(v)) {
		if (hasPrimitiveBase(v)) {
			get = function(p) {
				var o = toObject(base),
					desc = o.getProperty(p);
				if (desc === undefined) {
					return new Types.TypeUndefined();
				}
				if (isDataDescriptor(desc)) {
					return desc.value;
				} else {
					if (!desc.get) {
						return new Types.TypeUndefined();
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
}
var getValue = exports.getValue;

/**
 * @method
 */
exports.putValue = function putValue(v, w) {
	var put;
	if (type(v) !== "Reference") {
		throw new Exceptions.ReferenceError();
	}

	var base = getBase(v),
		put;
	if (isUnresolvableReference(v)) {
		if (isStrictReference(v)) {
			throw new Exceptions.ReferenceError();
		}
		global.globalObject.put(getReferencedName(v), w, false);
	} else if(isPropertyReference(v)) {
		if (hasPrimitiveBase(v)) {
			put = function(p, w, throwFlag) {
				var o = toObject(base);
				if (!o.canPut(p) || isDataDescriptor(o.getOwnProperty(p))) {
					if (throwFlag) {
						throw new Exceptions.TypeError();
					}
					return;
				}
				var desc = o.getProperty(p);
				if (isAccessorDescriptor(desc)) {
					desc.setter.call(base, w);
				} else if (throwFlag) {
					throw new Exceptions.TypeError();
				}
			}
		} else {
			put = base.put;
		}
		put(getReferencedName(v), w, isStrictReference(v));
	} else {
		base.setMutableBinding(getReferencedName(v), w, isStrictReference(v));
	}
}
var putValue = exports.putValue;

// ******** Unknown Type Class ********

/**
 * @constructor
 * @extends module:Base.TypeBase
 */
exports.TypeUnknown = function TypeUnknown(className) {
	TypeObject.call(this, "Unknown");
};
var TypeUnknown = exports.TypeUnknown;
util.inherits(TypeUnknown, TypeObject);

// ******** Type Conversions ********

function toPrimitive(input, preferredType) {
	if (type(input) === "Object") {
		return input.getDefaultValue(preferredType);
	} else {
		return input;
	}
};
exports.toPrimitive = toPrimitive;

/**
 * @method
 */
exports.toBoolean = function toBoolean(input) {
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
var toBoolean = exports.toBoolean;

/**
 * @method
 */
exports.toNumber = function toNumber(input) {
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
var toNumber = exports.toNumber;

/**
 * @method
 */
exports.toInteger = function toInteger(input) {
	var newNumber = toNumber(input);
	if (isNaN(newNumber.value)) {
		newNumber.value = 0;
	} else {
		newNumber.value = Math.floor(newNumber.value);
	}
	return newNumber;
};
var toInteger = exports.toInteger;

/**
 * @method
 */
exports.toInt32 = function toInt32(input) {
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
var toInt32 = exports.toInt32;

/**
 * @method
 */
exports.toUint32 = function toUint32(input) {
	var newNumber = toNumber(input);
	if (isNaN(newNumber.value) || newNumber.value === Infinity || newNumber.value === -Infinity) {
		newNumber.value = 0;
	} else {
		newNumber.value = Math.floor(newNumber.value) % Math.pow(2,32);
	}
	return newNumber;
};
var toUint32 = exports.toUint32;

/**
 * @method
 */
exports.toUint16 = function toUint16(input) {
	var newNumber = toNumber(input);
	if (isNaN(newNumber.value) || newNumber.value === Infinity || newNumber.value === -Infinity) {
		newNumber.value = 0;
	} else {
		newNumber.value = Math.floor(newNumber.value) % Math.pow(2,16);
	}
	return newNumber;
};
var toUint16 = exports.toUint16;

/**
 * @method
 */
exports.toString = function toString(input) {
	var newString = new TypeString();
	if (type(input) === "Object") {
		newString.value = toString(toPrimitive(input, "String"));
	} else {
		newString.value = input.value + "";
	}
	return newString;
};
var toString = exports.toString;

/**
 * @method
 */
exports.toObject = function toObject(input) {
	var newObject;
	switch(type(input)) {
		case "Boolean":
			newObject = new TypeBooleanObject();
			newObject.primitiveValue = input.value;
			return newObject;
		case "Number":
			newObject = new TypeNumberObject();
			newObject.primitiveValue = input.value;
			return newObject;
		case "String":
			newObject = new TypeStringObject();
			newObject.primitiveValue = input.value;
			return newObject;
		case "Object":
			return input;
		default:
			throw new Exceptions.TypeError();
	}
	return newObject;
};
var toObject = exports.toObject;

/**
 * @method
 */
exports.checkObjectCoercible = function checkObjectCoercible(input) {
	var inputType = type(input);
	if (inputType === "Undefined" || inputType === "Null") {
		throw new Exceptions.TypeError();
	}
	return;
};
var checkObjectCoercible = exports.checkObjectCoercible;

/**
 * @method
 */
exports.isCallable = function isCallable(input) {
	if (type(input) === "Object") {
		return !!input.call;
	} else {
		return false;
	}
};
var isCallable = exports.isCallable;

/**
 * @method
 */
exports.sameValue = function sameValue(x, y) {
	return x.value === y.value;
};
var sameValue = exports.sameValue;

// ******** DeclarativeEnvironmentRecord Class ********

/**
 * @constructor
 */
exports.DeclarativeEnvironmentRecord = function DeclarativeEnvironmentRecord() {
	this._bindings = {};
};
var DeclarativeEnvironmentRecord = exports.DeclarativeEnvironmentRecord;

/**
 * @method
 */
DeclarativeEnvironmentRecord.prototype.hasBinding = function(n) {
	return n in this._bindings;
};

/**
 * @method
 */
DeclarativeEnvironmentRecord.prototype.createMutableBinding = function(n, d) {
	var bindings = this._bindings;
	if (n in bindings) {
		throw new InvalidStateError("Could not create mutable binding: binding '" + n + "' already exists");
	}

	bindings[n] = {
		value: new TypeUndefined(),
		isDeletable: !!d,
		isMutable: true
	}
};

/**
 * @method
 */
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

/**
 * @method
 */
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

/**
 * @method
 */
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

/**
 * @method
 */
DeclarativeEnvironmentRecord.prototype.implicitThisValue = function() {
	return new TypeUndefined(); // Always return undefined for declarative environments
};

/**
 * @method
 */
DeclarativeEnvironmentRecord.prototype.createImmutableBinding = function(n) {

	var bindings = this._bindings;
	if (n in bindings) {
		throw new InvalidStateError("Could not create immutable binding: binding '" + n + "' already exists");
	}

	bindings[n] = {
		value: new TypeUndefined(),
		isDeletable: false,
		isMutable: false,
		isInitialized: false
	}
};

/**
 * @method
 */
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

/**
 * @constructor
 */
exports.ObjectEnvironmentRecord = function ObjectEnvironmentRecord(bindingObject) {
	this._bindingObject = bindingObject;
};
var ObjectEnvironmentRecord = exports.ObjectEnvironmentRecord;

/**
 * @method
 */
ObjectEnvironmentRecord.prototype.hasBinding = function(n) {
	return this._bindingObject.hasProperty(n);
};

/**
 * @method
 */
ObjectEnvironmentRecord.prototype.createMutableBinding = function(n, d) {
	var bindingObject = this._bindingObject;
	if (bindingObject.hasProperty(n)) {
		throw new InvalidStateError("Could not create mutable binding: binding '" + n + "' already exists");
	}

	bindingObject.defineOwnProperty(n, {
		value: new TypeUndefined(),
		writeable: true,
		enumerable: true,
		configurable: d
	}, true);
};

/**
 * @method
 */
ObjectEnvironmentRecord.prototype.setMutableBinding = function(n, v, s) {
	this._bindingObject.put(n, v, s);
};

/**
 * @method
 */
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

/**
 * @method
 */
ObjectEnvironmentRecord.prototype.deleteBinding = function(n) {
	return this._bindingObject["delete"](n, false);
};

/**
 * @method
 */
ObjectEnvironmentRecord.prototype.implicitThisValue = function(provideThis) {
	if (provideThis) {
		return this._bindingObject;
	} else {
		return new TypeUndefined();
	}
};

// ******** Lexical Environment Operations ********

/**
 * @method
 */
exports.getIdentifierReference = function getIdentifierReference(lex, name, strict) {
	var newRef;
	if (lex === null) {
		newRef = new Reference();
		newRef.baseValue = new TypeUndefined();
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

var globalObject = exports.globalObject = new TypeObject(),
	globalContext = exports.globalContext = {
		lexicalEnvironment: new newObjectEnvironment(globalObject),
		variableEnvironment: new newObjectEnvironment(globalObject),
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
