/** 
 * This module contains many base operations used by the code processor. Almost all of the methods and classes strictly
 * implement methods/objects defined in the ECMA-262 specification. Many of the descriptions are taken directly from the
 * ECMA-262 Specification, which can be obtained from 
 * <a href="http://www.ecma-international.org/publications/standards/Ecma-262.htm">ecma international</a> Direct quotes
 * from the ECMA-262 specification are formatted with the prefix "ECMA-262 Spec:" followed by the quote in 
 * <em>italics</em>. See Chapters 8, 9, and 10 in the ECMA-262 specification for more explanations of these objects and 
 * methods.
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
 * @classdesc A Data Descriptor represents the interface an object exposes for getting and setting a property via direct 
 * assignment.
 * 
 * @constructor
 * @property {module:Base.TypeBase} value ECMA-262 Spec: <em>The value retrieved by reading the property.</em>
 * @property {Boolean} writeable ECMA-262 Spec: <em>If false, attempts by ECMAScript code to change the property‘s 
 *		[[value]] attribute using [[put]] will not succeed.</em>
 * @property {Boolean} get ECMA-262 Spec: <em>If true, the property will be enumerated by a for-in enumeration 
 *		(see 12.6.4). Otherwise, the property is said to be non-enumerable.</em>
 * @property {Boolean} get ECMA-262 Spec: <em>If false, attempts to delete the property, change the property to be an 
 *		accessor property, or change its attributes (other than [[value]]) will fail.</em>
 * @see ECMA-262 Spec Chapter 8.10
 */
exports.DataPropertyDescriptor = function DataPropertyDescriptor() {
	this.value = new TypeUndefined();
	this.writeable = false;
	this.enumerable = false;
	this.configurable = false;
};
var DataPropertyDescriptor = exports.DataPropertyDescriptor;

/**
 * @classdesc An Accessor Descriptor represents the interface an object exposes for getting and setting a property via 
 * get and set methods.
 * 
 * @constructor
 * @property {module:Base.TypeBase} get ECMA-262 Spec: <em>If the value is an Object it must be a function Object. 
 *		The function‘s [[call]] internal method (8.6.2) is called with an empty arguments list to return the property 
 *		value each time a get access of the property is performed.</em>
 * @property {module:Base.TypeBase} set ECMA-262 Spec: <em>If the value is an Object it must be a function Object. The 
 *		function‘s [[call]] internal method (8.6.2) is called with an arguments list containing the assigned value as 
 *		its sole argument each time a set access of the property is performed. The effect of a property's [[set]] 
 *		internal method may, but is not required to, have an effect on the value returned by subsequent calls to the 
 *		property's [[get]] internal method.</em>
 * @property {Boolean} enumerable ECMA-262 Spec: <em>If true, the property is to be enumerated by a for-in enumeration 
 *		(see 12.6.4). Otherwise, the property is said to be non-enumerable.</em>
 * @property {Boolean} configurable ECMA-262 Spec: <em>If false, attempts to delete the property, change the property to 
 *		be a data property, or change its attributes will fail.</em>
 * @see ECMA-262 Spec Chapter 8.10
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
 * Determines if the supplied property descriptor is a data descriptor or not
 * 
 * @method
 * @param {module:Base.DataPropertyDescriptor|module:Base.AccessorPropertyDescriptor|Object} The property descriptor to test
 * @returns {Boolean} Whether or not the descriptor is a data descriptor
 * @see ECMA-262 Spec Chapter 8.10.2
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
 * Determines if the supplied property descriptor is an accessor descriptor or not
 * 
 * @method
 * @param {module:Base.DataPropertyDescriptor|module:Base.AccessorPropertyDescriptor|Object} The property descriptor to test
 * @returns {Boolean} Whether or not the descriptor is an accessor descriptor
 * @see ECMA-262 Spec Chapter 8.10.1
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
 * Determines if the supplied property descriptor is a generic descriptor or not
 * 
 * @method
 * @param {module:Base.DataPropertyDescriptor|module:Base.AccessorPropertyDescriptor|Object} The property descriptor to test
 * @returns {Boolean} Whether or not the descriptor is a generic descriptor
 * @see ECMA-262 Spec Chapter 8.10.3
 */
exports.isGenericDescriptor = function isGenericDescriptor(desc) {
	if (!desc) {
		return false;
	}
	return !exports.isAccessorDescriptor(desc) && !exports.isDataDescriptor(desc);
};
var isGenericDescriptor = exports.isGenericDescriptor;

/**
 * Converts a property descriptor to a generic object.
 * 
 * @method
 * @param {module:Base.DataPropertyDescriptor|module:Base.AccessorPropertyDescriptor|Object} The property descriptor to convert
 * @returns {{@link module:Base.TypeUndefined}|{@link module:Base.TypeObject}} The converted property descriptor
 * @see ECMA-262 Spec Chapter 8.10.4
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
 * Converts a generic object to a property descriptor (think Object.defineProperty).
 * 
 * @method
 * @param {Object} o The object to convert
 * @returns {{@link module:Base.DataPropertyDescriptor}|{@link module:Base.AccessorPropertyDescriptor}} The converted property descriptor
 * @throws {{@link module:Exceptions.TypeError}} Thrown when the object is not a well formed data or accessor property descriptor
 * @see ECMA-262 Spec Chapter 8.10.5
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
 * @classdesc The base class for all types
 * 
 * @constructor
 * @param {String} className The name of the class, such as "String" or "Object"
 */
exports.TypeBase = function TypeBase(className) {
	this.className = className;
};
var TypeBase = module.exports.TypeBase;

// ******** Object Type Class ********

/**
 * @classdesc An object type. Note: functions are defined as objects, and so are represented by the class.
 * 
 * @constructor
 * @extends module:Base.TypeBase
 * @param {String} className The name of the class, such as "String" or "Object"
 * @see ECMA-262 Spec Chapter 8.6
 */
exports.TypeObject = function TypeObject(className) {
	TypeBase.call(this, className || "Object");

	this._properties = {};

	this.objectPrototype = null;
	this.extensible = true;
};
var TypeObject = exports.TypeObject;
util.inherits(TypeObject, TypeBase);

/**
 * ECMA-262 Spec: <em>Returns the value of the named property.</em>
 * 
 * @method
 * @param {String} p The name of the property to fetch
 * @returns {{@link module:Base.TypeBase}} The value of the property, or a new instance of {@link module:Base.TypeUndefined} if 
 *		the property does not exist
 * @see ECMA-262 Spec Chapter 8.12.3
 */
exports.TypeObject.prototype.get = function get(p) {
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
 * ECMA-262 Spec: <em>Returns the Property Descriptor of the named own property of this object, or undefined if absent.</em>
 * 
 * @method
 * @param {String} p The name of the property descriptor to fetch
 * @returns {{@link module:Base.DataPropertyDescriptor}|{@link module:Base.AccessorPropertyDescriptor}|undefined} The objects property, 
 *		or undefined if the property does not exist
 * @see ECMA-262 Spec Chapter 8.12.1
 */
exports.TypeObject.prototype.getOwnProperty = function getOwnProperty(p) {
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
 * ECMA-262 Spec: <em>Returns the fully populated Property Descriptor of the named property of this object, or undefined 
 * if absent.</em>
 * 
 * @method
 * @param {String} p The name of the property descriptor to fetch
 * @returns {{@link module:Base.DataPropertyDescriptor}|{@link module:Base.AccessorPropertyDescriptor}|undefined} The objects property, 
 *		or undefined if the property does not exist
 * @see ECMA-262 Spec Chapter 8.12.2
 */
exports.TypeObject.prototype.getProperty = function getProperty(p) {
	var prop = this.getOwnProperty(p);
	if (prop) {
		return prop;
	}
	return this.objectPrototype ? this.objectPrototype.getProperty(p) : undefined;
};

/**
 * ECMA-262 Spec: <em>Sets the specified named property to the value of the second parameter. The flag controls failure 
 * handling.</em>
 * 
 * @method
 * @param {String} p The name of the parameter to set the value as
 * @param {module:Base.TypeBase} v The value to set
 * @param {Boolean} throwFlag Whether or not to throw an exception on error (related to strict mode)
 * @throws {{@link module:Exceptions.TypeError}} Thrown when the property cannot be put and throwFlag is true
 * @see ECMA-262 Spec Chapter 8.12.5
 */
exports.TypeObject.prototype.put = function put(p, v, throwFlag) {
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
 * ECMA-262 Spec: <em>Returns a Boolean value indicating whether a [[put]] operation with PropertyName can be performed.</em>
 * 
 * @method
 * @param {String} p The name of the parameter to test
 * @returns {Boolean} Whether or not the parameter can be put
 * @see ECMA-262 Spec Chapter 8.12.4
 */
exports.TypeObject.prototype.canPut = function canPut(p) {
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
 * ECMA-262 Spec: <em>Returns a Boolean value indicating whether the object already has a property with the given name.</em>
 * 
 * @method
 * @param {String} p The name of the parameter to check for
 * @param {Boolean} Whether or not the property exists on the object
 * @see ECMA-262 Spec Chapter 8.12.6
 */
exports.TypeObject.prototype.hasProperty = function hasProperty(p) {
	return !!this.getProperty(p);
};

/**
 * ECMA-262 Spec: <em>Removes the specified named own property from the object. The flag controls failure handling.</em>
 * 
 * @method
 * @param {String} p The name of the parameter to delete
 * @param {Boolean} throwFlag Whether or not to throw an exception on error (related to strict mode)
 * @returns {Boolean} Whether or not the object was deleted succesfully
 * @throws {{@link module:Exceptions.TypeError}} Thrown when the property cannot be deleted and throwFlag is true
 * @see ECMA-262 Spec Chapter 8.12.7
 */
exports.TypeObject.prototype["delete"] = function objDelete(p, throwFlag) {
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
 * ECMA-262 Spec: <em>Returns a default primitive value for the object.</em>
 * 
 * @method
 * @param {String} A hint for the default value, one of "String" or "Number." Any other value is interpreted as "String"
 * @returns {{@link module:Base.TypeString}|{@link module.Base.TypeNumber}|{@link module:Base.TypeUndefined}} The primitive default value
 * @throws {{@link module:Exceptions.TypeError}} Thrown when the primitive cannot be calculated
 * @see ECMA-262 Spec Chapter 8.12.8
 */
exports.TypeObject.prototype.defaultValue = function defaultValue(hint) {

	function defaultToString() {
		var toString = this.get("toString"),
			str;
		if (isCallable(toString)) {
			str = toString.call(this);
			if (isPrimitive(str)) {
				return str;
			}
		}
		return new TypeUndefined();
	}

	function defaultValueOf() {
		var valueOf = this.get("valueOf");
		if (isCallable(valueOf)) {
			var val = valueOf.call(this);
			if (isPrimitive(val)) {
				return val;
			}
		}
		return new TypeUndefined();
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
 * ECMA-262 Spec: <em>Creates or alters the named own property to have the state described by a Property Descriptor. The 
 * flag controls failure handling.</em>
 * 
 * @method
 * @param {String} p The name of the parameter to delete
 * @param {module:Base.DataPropertyDescriptor|module:Base.AccessorPropertyDescriptor} desc The descriptor for the property
 * @param {Boolean} throwFlag Whether or not to throw an exception on error (related to strict mode)
 * @returns {Boolean} Indicates whether or not the property was defined successfully
 * @throws {{@link module:Exceptions.TypeError}} Thrown when the property cannot be defined and throwFlag is true
 * @see ECMA-262 Spec Chapter 8.12.9
 */
exports.TypeObject.prototype.defineOwnProperty = function defineOwnProperty(p, desc, throwFlag) {
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
 * @classdesc An undefined type.
 * 
 * @constructor
 * @extends module:Base.TypeBase
 * @see ECMA-262 Spec Chapter 8.1
 */
exports.TypeUndefined = function TypeUndefined(className) {
	TypeBase.call(this, "Undefined");
};
var TypeUndefined = exports.TypeUndefined;
util.inherits(TypeUndefined, TypeBase);

// ******** Null Type Class ********

/**
 * @classdesc A null type.
 * 
 * @constructor
 * @extends module:Base.TypeBase
 * @see ECMA-262 Spec Chapter 8.2
 */
exports.TypeNull = function TypeNull(className) {
	TypeBase.call(this, "Null");
	this.value = null;
};
var TypeNull = exports.TypeNull;
util.inherits(TypeNull, TypeBase);

// ******** Number Type Class ********

/**
 * @classdesc A number type.
 * 
 * @constructor
 * @extends module:Base.TypeBase
 * @see ECMA-262 Spec Chapter 8.5
 */
exports.TypeNumber = function TypeNumber(className) {
	TypeBase.call(this, "Number");
};
var TypeNumber = exports.TypeNumber;
util.inherits(TypeNumber, TypeBase);

// ******** Boolean Type Class ********

/**
 * @classdesc A boolean type.
 * 
 * @constructor
 * @extends module:Base.TypeBase
 * @see ECMA-262 Spec Chapter 8.3
 */
exports.TypeBoolean = function TypeBoolean(className) {
	TypeBase.call(this, "Boolean");
	this.value = false;
};
var TypeBoolean = exports.TypeBoolean;
util.inherits(TypeBoolean, TypeBase);

// ******** String Type Class ********

/**
 * @classdesc A string type.
 * 
 * @constructor
 * @extends module:Base.TypeBase
 * @see ECMA-262 Spec Chapter 8.4
 */
exports.TypeString = function TypeString(className) {
	TypeObject.call(this, "String");
};
var TypeString = exports.TypeString;
util.inherits(TypeString, TypeBase);

// ******** Reference Class ********

/**
 * @classdesc ECMA-262 Spec: <em>The Reference type is used to explain the behaviour of such operators as delete, typeof, 
 * and the assignment operators. For example, the left-hand operand of an assignment is expected to produce a reference. 
 * The behaviour of assignment could, instead, be explained entirely in terms of a case analysis on the syntactic form 
 * of the left-hand operand of an assignment operator, but for one difficulty: function calls are permitted to return 
 * references. This possibility is admitted purely for the sake of host objects. No built-in ECMAScript function 
 * defined by this specification returns a reference and there is no provision for a user- defined function to return a 
 * reference.</em>
 * 
 * @constructor
 * @extends module:Base.TypeBase
 * @see ECMA-262 Spec Chapter 8.7
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
 * ECMA-262 Spec: <em>Returns the base value component of the supplied reference.</em>
 * 
 * @method
 * @param {module:Base.TypeReference} v The reference to get the base of
 * @returns {{@link module:Base.TypeBase}} The base value of the reference
 * @see ECMA-262 Spec Chapter 8.7
 */
exports.getBase = function getBase(v) {
	return v.baseValue;
}
var getBase = exports.getBase;

/**
 * ECMA-262 Spec: <em>Returns the referenced name component of the supplied reference.</em>
 * 
 * @method
 * @param {module:Base.TypeReference} v The reference to get the name of
 * @returns {String} The base value of the reference
 * @see ECMA-262 Spec Chapter 8.7
 */
exports.getReferencedName = function getReferencedName(v) {
	return v.referencedName;
};
var getReferencedName = exports.getReferencedName;

/**
 * ECMA-262 Spec: <em>Returns the strict reference component of the supplied reference.</em>
 * 
 * @method
 * @param {module:Base.TypeReference} v The reference to check for strictness
 * @returns {Boolean} Whether or not the reference is a strict reference
 * @see ECMA-262 Spec Chapter 8.7
 */
exports.isStrictReference = function isStrictReference(v) {
	return v.strictReference;
};
var isStrictReference = exports.isStrictReference;

/**
 * ECMA-262 Spec: <em>Returns true if the base value is a Boolean, String, or Number.</em>
 * 
 * @method
 * @param {module:Base.TypeReference} v The reference to check for a primitive base
 * @returns {Boolean} Whether or not the reference has a primitive base
 * @see ECMA-262 Spec Chapter 8.7
 */
exports.hasPrimitiveBase = function hasPrimitiveBase(v) {
	return !!~["Number", "String", "Boolean"].indexOf(type(getBase(v)));
};
var hasPrimitiveBase = exports.hasPrimitiveBase;

/**
 * ECMA-262 Spec: <em>Returns true if either the base value is an object or HasPrimitiveBase(V) is true; otherwise 
 * returns false.</em>
 * 
 * @method
 * @param {module:Base.TypeReference} v The reference to get the name of
 * @returns {Boolean} Whether or not the reference is a property reference
 * @see ECMA-262 Spec Chapter 8.7
 */
exports.isPropertyReference = function isPropertyReference(v) {
	return hasPrimitiveBase(v) || type(getBase(v)) === "Object";
};
isPropertyReference = exports.isPropertyReference;

/**
 * ECMA-262 Spec: <em>Returns true if the base value is undefined and false otherwise.</em>
 * 
 * @method
 * @param {module:Base.TypeReference} v The reference to get the name of
 * @returns {Boolean} Whether or not the reference is an unresolvable reference
 * @see ECMA-262 Spec Chapter 8.7
 */
exports.isUnresolvableReference = function isUnresolvableReference(v) {
	return getBase(v) === undefined;
};
var isUnresolvableReference = exports.isUnresolvableReference;

/**
 * Gets the value pointed to by the supplied reference.
 * 
 * @method
 * @param {module:Base.TypeReference} v The reference to get
 * @returns {{@link module:Base.TypeBase}|{@link module:Base.TypeUndefined}} The value pointed to by the reference, or 
 *		TypeUndefined if the value could not be retrieved
 * @throws {{@link module:Exceptions.ReferenceError}} Thrown if the reference is not resolvable
 * @see ECMA-262 Spec Chapter 8.7.1
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
 * Puts the supplied value in the reference
 * 
 * @method
 * @param {module:Base.TypeReference} v The reference to put the value to
 * @param {module:Base.TypeBase} w The value to set
 * @throws {{@link module:Exceptions.ReferenceError}} Thrown if the reference is not resolvable
 * @throws {{@link module:Exceptions.TypeError}} Thrown if the value cannot be stored
 * @see ECMA-262 Spec Chapter 8.7.2
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
 * @classdesc Represents an unknown type. Types are considered to be "unknown" if their value cannot be determined at 
 * compile time and are unique to this implementation. There is no equivalent in the ECMA-262 spec.
 * 
 * @constructor
 * @extends module:Base.TypeBase
 */
exports.TypeUnknown = function TypeUnknown(className) {
	TypeObject.call(this, "Unknown");
};
var TypeUnknown = exports.TypeUnknown;
util.inherits(TypeUnknown, TypeObject);

// ******** Type Conversions ********

/**
 * ECMA-262 Spec: <em>The abstract operation ToPrimitive takes an input argument and an optional argument PreferredType. 
 * The abstract operation ToPrimitive converts its input argument to a non-Object type. If an object is capable of 
 * converting to more than one primitive type, it may use the optional hint PreferredType to favour that type.</em>
 * 
 * @method
 * @param {module:Base.TypeBase} input The value to convert
 * @param {String} preferredType The preferred type to convert to
 * @returns {{@link module:Base.TypeBase}} The converted value
 * @see ECMA-262 Spec Chapter 9.1
 */
exports.toPrimitive = function toPrimitive(input, preferredType) {
	if (type(input) === "Object") {
		return input.getDefaultValue(preferredType);
	} else {
		return input;
	}
};
var toPrimitive = exports.toPrimitive;

/**
 * ECMA-262 Spec: <em>The abstract operation ToBoolean converts its argument to a value of type Boolean</em>
 * 
 * @method
 * @param {module:Base.TypeBase} input The value to convert
 * @returns {{@link module:Base.TypeBoolean}} The converted value
 * @see ECMA-262 Spec Chapter 9.2
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
 * ECMA-262 Spec: <em>The abstract operation ToNumber converts its argument to a value of type Number</em>
 * 
 * @method
 * @param {module:Base.TypeBase} input The value to convert
 * @returns {{@link module:Base.TypeNumber}} The converted value
 * @see ECMA-262 Spec Chapter 9.3
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
 * ECMA-262 Spec: <em>The abstract operation ToInteger converts its argument to an integral numeric value.</em>
 * 
 * @method
 * @param {module:Base.TypeBase} input The value to convert
 * @returns {{@link module:Base.TypeNumber}} The converted value
 * @see ECMA-262 Spec Chapter 9.4
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
 * ECMA-262 Spec: <em>The abstract operation ToInt32 converts its argument to one of 2^32 integer values in the range 
 * -2^31 through 2^31 - 1, inclusive.</em>
 * 
 * @method
 * @param {module:Base.TypeBase} input The value to convert
 * @returns {{@link module:Base.TypeNumber}} The converted value
 * @see ECMA-262 Spec Chapter 9.5
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
 * ECMA-262 Spec: <em>The abstract operation ToUint32 converts its argument to one of 2^32 integer values in the range 0 
 * through 2^32 - 1, inclusive.</em>
 * 
 * @method
 * @param {module:Base.TypeBase} input The value to convert
 * @returns {{@link module:Base.TypeNumber}} The converted value
 * @see ECMA-262 Spec Chapter 9.6
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
 * ECMA-262 Spec: <em>The abstract operation ToUint16 converts its argument to one of 2^16 integer values in the range 0 
 * through 2^16 - 1, inclusive.</em>
 * 
 * @method
 * @param {module:Base.TypeBase} input The value to convert
 * @returns {{@link module:Base.TypeNumber}} The converted value
 * @see ECMA-262 Spec Chapter 9.7
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
 * ECMA-262 Spec: <em>The abstract operation ToString converts its argument to a value of type String</em>
 * 
 * @method
 * @param {module:Base.TypeBase} input The value to convert
 * @returns {{@link module:Base.TypeString}} The converted value
 * @see ECMA-262 Spec Chapter 9.8
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
 * ECMA-262 Spec: <em>The abstract operation ToObject converts its argument to a value of type Object</em>
 * 
 * @method
 * @param {module:Base.TypeBase} input The value to convert
 * @returns {{@link module:Base.TypeObject}} The converted value
 * @see ECMA-262 Spec Chapter 9.9
 */
exports.toObject = function toObject(input) {
	var newObject;
	switch(type(input)) {
		case "Boolean":
			newObject = new TypeObject();
			newObject.primitiveValue = input.value;
			return newObject;
		case "Number":
			newObject = new TypeObject();
			newObject.primitiveValue = input.value;
			return newObject;
		case "String":
			newObject = new TypeObject();
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
 * ECMA-262 Spec: <em>The abstract operation CheckObjectCoercible throws an error if its argument is a value that cannot 
 * be converted to an Object using ToObject.</em>
 * 
 * @method
 * @param {module:Base.TypeBase} input The value to check if it's coercible
 * @throws {{@link module:Exceptions.TypeError}} Thrown if the object is not coercible
 * @see ECMA-262 Spec Chapter 9.10
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
 * ECMA-262 Spec: <em>The abstract operation IsCallable determines if its argument, which must be an ECMAScript 
 * language value, is a callable function Object</em>
 * 
 * @method
 * @param {module:Base.TypeBase} input The value to check if it's callable
 * @returns {Boolean} Whether or not the object is callable
 * @see ECMA-262 Spec Chapter 9.11
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
 * ECMA-262 Spec: <em>The internal comparison abstract operation SameValue(x, y), where x and y are ECMAScript language 
 * values, produces true or false.</em> Note that, since we are in JavaScript land already, we just do a straight up
 * comparison between objects. The function is defined so that implementations that use it more closely resemble the 
 * specification.
 * 
 * @method
 * @param {module:Base.TypeBoolean} x The first value to compare
 * @param {module:Base.TypeBoolean} y The second value to compare
 * @returns {Boolean} Whether or not the values are the same
 * @see ECMA-262 Spec Chapter 9.12
 */
exports.sameValue = function sameValue(x, y) {
	return x.value === y.value;
};
var sameValue = exports.sameValue;

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
		value: new TypeUndefined(),
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
 * @param {module:Base.TypeBase} v The value to set on the binding
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
 * @returns {{@link module:Base.TypeBase}} The value of the binding
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
 * @returns {{@link module:Base.TypeUndefined}} Always undefined
 * @see ECMA-262 Spec Chapter 10.2.1.1.6
 */
exports.DeclarativeEnvironmentRecord.prototype.implicitThisValue = function() {
	return new TypeUndefined(); // Always return undefined for declarative environments
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
		value: new TypeUndefined(),
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
 * @param {module:Base.TypeBase} v The value to initialize the binding to
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
		value: new TypeUndefined(),
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
 * @param {module:Base.TypeBase} v The value to set on the binding
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
 * @returns {{@link module:Base.TypeBase}} The value of the binding
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
 * @returns {{@link module:Base.TypeBase}} The value of this, if it exists
 * @see ECMA-262 Spec Chapter 10.2.1.2.6
 */
exports.ObjectEnvironmentRecord.prototype.implicitThisValue = function() {
	if (this.provideThis) {
		return this._bindingObject;
	} else {
		return new TypeUndefined();
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
 * @param {module:Base.TypeObject} o The binding object
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
 * @property {module:Base.TypeObject} thisBinding ECMA-262 Spec: <em>The value associated with the this keyword within 
 *		ECMAScript code associated with this execution context.</em>
 */
exports.ExecutionContext = function ExecutionContext(lexicalEnvironment, variableEnvironment, thisBinding) {
	this.lexicalEnvironment = lexicalEnvironment || null;
	this.variableEnvironment = variableEnvironment || null;
	this.thisBinding = thisBinding || null;
};