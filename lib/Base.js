/** 
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * This module contains many base operations used by the code processor. Almost all of the methods and classes strictly
 * implement methods/objects defined in the ECMA-262 specification. Many of the descriptions are taken directly from the
 * ECMA-262 Specification, which can be obtained from 
 * <a href="http://www.ecma-international.org/publications/standards/Ecma-262.htm">ecma international</a> Direct quotes
 * from the ECMA-262 specification are formatted with the prefix "ECMA-262 Spec:" followed by the quote in 
 * <em>italics</em>. See Chapters 8, 9, and 10 in the ECMA-262 specification for more explanations of these objects and 
 * methods.
 * 
 * @module Base
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

var util = require("util"),
	
	Exceptions = require("./Exceptions"),
	Messaging = require("./Messaging"),
	Runtime = require("./Runtime"),
	RuleProcessor = require("./RuleProcessor"),
	AST = require("./AST"),
	
	throwTypeError;

// ******** Non-spec helpers ********

/**
 * Checks if the given value is a primitive type, i.e. {@link module:Base.type}(o) is one of "Number", "String", "Boolean", 
 * "Undefined", or "Null".
 * 
 * @method
 * @param {module:Base.BaseType} o The value to check
 * @returns {Boolean} Whether or not the value is a primitive
 */
exports.isPrimitive = isPrimitive; // We do the exports first to get docgen to recognize the function properly
function isPrimitive(o) {
	return !!~["Number", "String", "Boolean", "Undefined", "Null"].indexOf(o.className);
}

/**
 * Checks if the given value is an object type (Object, Function, Array, etc)
 * 
 * @method
 * @param {module:Base.BaseType} o The value to check
 * @returns {Boolean} Whether or not the value is a primitive
 */
exports.isObject = isObject;
function isObject(o) {
	return !isPrimitive(o);
}

/**
 * Determines the type of the value.
 * 
 * @method
 * @param {module:Base.BaseType} t The value to check
 * @returns {String} The type of the value, one of "Undefined", "Null", "Number", "String", "Boolean", "Object", 
 *		"Reference", "Unknown".
 */
exports.type = type;
function type(t) {
	return t.type;
}

/**
 * Checks if two descriptions describe the same description.
 * 
 * @method
 * @param {module:Base.DataPropertyDescriptor|module:Base.AccessorPropertyDescriptor} x The first descriptor
 * @param {module:Base.DataPropertyDescriptor|module:Base.AccessorPropertyDescriptor} y The second descriptor
 * @returns {Boolean} Whether or not the descriptions are the same
 */
exports.sameDesc = sameDesc;
function sameDesc(x, y) {

	if (typeof x === typeof y) {
		if (typeof x === "object") {
			var xKeys = Object.keys(x),
				yKeys = Object.keys(y),
				same = true;

			if (xKeys.length !== yKeys.length) {
				return false;
			}
			for (var i in xKeys) {
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
}

/**
 * Checks if the supplied value is one of the supplied types.
 * 
 * @method
 * @param {module:Base.baseType} value The value to check
 * @param {String|Array[String]} types The types to check against
 * @returns {Boolean} Whether or not the value is one of the types
 */
exports.isType = isType;
function isType(value, types) {
	if (typeof types === "string") {
		types = [types];
	}
	return types.indexOf(type(value)) !== -1;
}

/**
 * Checks if a value is defined
 * 
 * @method
 * @param {Any} value The value to check
 * @param {Boolean} Whether or not the value is not undefined
 */
exports.isDefined = isDefined;
function isDefined(value) {
	return typeof value !== "undefined";
}

/**
 * Checks if a value is defined
 * 
 * @method
 * @param {Any} value The value to check
 * @param {Boolean} Whether or not the value is not undefined
 */
exports.isUndefined = isUndefined;
function isUndefined(value) {
	return typeof value === "undefined";
}

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
 * @property {module:Base.BaseType} value ECMA-262 Spec: <em>The value retrieved by reading the property.</em>
 * @property {Boolean} writable ECMA-262 Spec: <em>If false, attempts by ECMAScript code to change the property‘s 
 *		[[value]] attribute using [[put]] will not succeed.</em>
 * @property {Boolean} get ECMA-262 Spec: <em>If true, the property will be enumerated by a for-in enumeration 
 *		(see 12.6.4). Otherwise, the property is said to be non-enumerable.</em>
 * @property {Boolean} get ECMA-262 Spec: <em>If false, attempts to delete the property, change the property to be an 
 *		accessor property, or change its attributes (other than [[value]]) will fail.</em>
 * @see ECMA-262 Spec Chapter 8.10
 */
exports.DataPropertyDescriptor = DataPropertyDescriptor;
function DataPropertyDescriptor() {
	this.value = new UndefinedType();
	this.writable = false;
	this.enumerable = false;
	this.configurable = false;
}

/**
 * @classdesc An Accessor Descriptor represents the interface an object exposes for getting and setting a property via 
 * get and set methods.
 * 
 * @constructor
 * @property {module:Base.BaseType} get ECMA-262 Spec: <em>If the value is an Object it must be a function Object. 
 *		The function‘s [[call]] internal method (8.6.2) is called with an empty arguments list to return the property 
 *		value each time a get access of the property is performed.</em>
 * @property {module:Base.BaseType} set ECMA-262 Spec: <em>If the value is an Object it must be a function Object. The 
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
exports.AccessorPropertyDescriptor = AccessorPropertyDescriptor;
function AccessorPropertyDescriptor() {

	this.get = undefined;
	this.set = undefined;
	this.enumerable = false;
	this.configurable = false;
}

// ******** Property Descriptor Query Methods ********

/**
 * Determines if the supplied property descriptor is a data descriptor or not
 * 
 * @method
 * @param {module:Base.DataPropertyDescriptor|module:Base.AccessorPropertyDescriptor|Object} The property descriptor to test
 * @returns {Boolean} Whether or not the descriptor is a data descriptor
 * @see ECMA-262 Spec Chapter 8.10.2
 */
exports.isDataDescriptor = isDataDescriptor;
function isDataDescriptor(desc) {
	if (!desc) {
		return false;
	}
	if (isUndefined(desc.value) && isUndefined(desc.writable)) {
		return false;
	}
	return true;
}

/**
 * Determines if the supplied property descriptor is an accessor descriptor or not
 * 
 * @method
 * @param {module:Base.DataPropertyDescriptor|module:Base.AccessorPropertyDescriptor|Object} The property descriptor to test
 * @returns {Boolean} Whether or not the descriptor is an accessor descriptor
 * @see ECMA-262 Spec Chapter 8.10.1
 */
exports.isAccessorDescriptor = isAccessorDescriptor;
function isAccessorDescriptor(desc) {
	if (!desc) {
		return false;
	}
	if (isUndefined(desc.get) && isUndefined(desc.set)) {
		return false;
	}
	return true;
}

/**
 * Determines if the supplied property descriptor is a generic descriptor or not
 * 
 * @method
 * @param {module:Base.DataPropertyDescriptor|module:Base.AccessorPropertyDescriptor|Object} The property descriptor to test
 * @returns {Boolean} Whether or not the descriptor is a generic descriptor
 * @see ECMA-262 Spec Chapter 8.10.3
 */
exports.isGenericDescriptor = isGenericDescriptor;
function isGenericDescriptor(desc) {
	if (!desc) {
		return false;
	}
	return !isAccessorDescriptor(desc) && !isDataDescriptor(desc);
}

/**
 * Converts a property descriptor to a generic object.
 * 
 * @method
 * @param {module:Base.DataPropertyDescriptor|module:Base.AccessorPropertyDescriptor|Object} The property descriptor to convert
 * @returns {{@link module:Base.UndefinedType}|{@link module:Base.ObjectType}} The converted property descriptor
 * @see ECMA-262 Spec Chapter 8.10.4
 */
exports.fromPropertyDescriptor = fromPropertyDescriptor;
function fromPropertyDescriptor(desc) {
	
	var obj = new ObjectType();
	
	if (!desc) {
		return new UndefinedType();
	}
	
	if (isDataDescriptor(desc)) {
	
		obj.defineOwnProperty("value", {
			value: desc.value,
			writable: true,
			enumerable: true,
			configurable: true
		}, false);
		
		obj.defineOwnProperty("writable", {
			value: new BooleanType(desc.writable),
			writable: true,
			enumerable: true,
			configurable: true
		}, false);
		
	} else {
	
		obj.defineOwnProperty("get", {
			value: desc.get,
			writable: true,
			enumerable: true,
			configurable: true
		}, false);
		
		obj.defineOwnProperty("set", {
			value: desc.set,
			writable: true,
			enumerable: true,
			configurable: true
		}, false);
	}
	
	obj.defineOwnProperty("configurable", {
		value: new BooleanType(desc.configurable),
		writable: true,
		enumerable: true,
		configurable: true
	}, false);
	
	obj.defineOwnProperty("enumerable", {
		value: new BooleanType(desc.enumerable),
		writable: true,
		enumerable: true,
		configurable: true
	}, false);
	
	return obj;
}

/**
 * Converts a generic object to a property descriptor (think Object.defineProperty).
 * 
 * @method
 * @param {Object} o The object to convert
 * @returns {{@link module:Base.DataPropertyDescriptor}|{@link module:Base.AccessorPropertyDescriptor}} The converted property descriptor
 * @throws {{@link module:Exceptions.TypeError}} Thrown when the object is not a well formed data or accessor property descriptor
 * @see ECMA-262 Spec Chapter 8.10.5
 */
exports.toPropertyDescriptor = toPropertyDescriptor;
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
	if (obj.hasProperty("writable")) {
		desc.writable = toBoolean(obj.get("writable")).value;
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
	if ((desc.get || desc.set) && (isDefined(desc.value) || isDefined(desc.writable))) {
		throw new Exceptions.TypeError();
	}
	return desc;
}

// ******** Base Type Class ********

/**
 * @classdesc The base class for all types
 * 
 * @constructor
 * @extends module:Messaging.Evented
 * @param {String} className The name of the class, such as "String" or "Object"
 */
exports.BaseType = BaseType;
function BaseType(className) {
	Messaging.Evented.call(this);
	this.className = className;
}
util.inherits(BaseType, Messaging.Evented);

// ******** Object Type Class ********

/**
 * @classdesc An object type. Note: functions are defined as objects, and so are represented by the class.
 * 
 * @constructor
 * @extends module:Base.BaseType
 * @param {String} [className] The name of the class, such as "String" or "Object"
 * @see ECMA-262 Spec Chapters 8.6 and 15.2.2
 */
exports.ObjectType = ObjectType;
function ObjectType(className, value, dontCreatePrototype) {
	
	// Step 1
	if (value && isObject(value)) {
		return value;
	} else if(value && isType(value, ["String", "Number", "Boolean"])) {
		return toObject(value);
	}
	
	// Initialize the instance (Step 5 implicit)
	BaseType.call(this, className || "Object");
	this.type = "Object";
	
	this._properties = {};
	
	// Step 4
	this.objectPrototype = dontCreatePrototype ? undefined : new ObjectPrototypeType();
	
	// Step 6
	this.extensible = true;
}
util.inherits(ObjectType, BaseType);

/**
 * Indicates that a property was referenced (i.e. read).
 *
 * @name module:Base.ObjectType#propertyReferenced
 * @event
 * @param {String} name The name of the proeprty that was referenced
 * @param {{@link module:Base.DataPropertyDescriptor}|{@link module:Base.AccessorPropertyDescriptor}|undefined} The
 *		descriptor fetched, if it could be found.
 */
/**
 * ECMA-262 Spec: <em>Returns the value of the named property.</em>
 * 
 * @method
 * @param {String} p The name of the property to fetch
 * @returns {{@link module:Base.BaseType}} The value of the property, or a new instance of 
 *		{@link module:Base.UndefinedType} if the property does not exist
 * @see ECMA-262 Spec Chapter 8.12.3
 */
ObjectType.prototype.get = function get(p) {
	var desc = this.getProperty(p),
		result = new UndefinedType();
	
	if (desc) {
		if (isDataDescriptor(desc)) {
			result = desc.value;
		} else {
			result = desc.get.className !== "Undefined" ? desc.get.call(this) : new UndefinedType();
		}
	}
	
	this.fireEvent("propertyReferenced", {
		name: p,
		desc: desc
	});
	
	return result;
};

/**
 * ECMA-262 Spec: <em>Returns the Property Descriptor of the named own property of this object, or undefined if absent.</em>
 * 
 * @method
 * @param {String} p The name of the property descriptor to fetch
 * @returns {{@link module:Base.DataPropertyDescriptor}|{@link module:Base.AccessorPropertyDescriptor}|undefined} The 
 *		objects property, or undefined if the property does not exist
 * @see ECMA-262 Spec Chapter 8.12.1
 */
ObjectType.prototype.getOwnProperty = function getOwnProperty(p) {
	if (Object.hasOwnProperty.call(this._properties, p)) {
		var d = {},
			x = this._properties[p];
		if (isDataDescriptor(x)) {
			d.value = x.value;
			d.writable = x.writable;
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
ObjectType.prototype.getProperty = function getProperty(p) {
	var prop = this.getOwnProperty(p);
	if (prop) {
		return prop;
	}
	return this.objectPrototype ? this.objectPrototype.getProperty(p) : undefined;
};

/**
 * Indicates that a property was set (i.e. written).
 *
 * @name module:Base.ObjectType#propertySet
 * @event
 * @param {String} name The name of the proeprty that was set
 * @param {module:Base.BaseType} value The value that was set
 */
/**
 * ECMA-262 Spec: <em>Sets the specified named property to the value of the second parameter. The flag controls failure 
 * handling.</em>
 * 
 * @method
 * @param {String} p The name of the parameter to set the value as
 * @param {module:Base.BaseType} v The value to set
 * @param {Boolean} throwFlag Whether or not to throw an exception on error (related to strict mode)
 * @param {Boolean} suppressEvent Suppresses the "propertySet" event (used when setting prototypes)
 * @throws {{@link module:Exceptions.TypeError}} Thrown when the property cannot be put and throwFlag is true
 * @see ECMA-262 Spec Chapter 8.12.5
 */
ObjectType.prototype.put = function put(p, v, throwFlag, suppressEvent) {
	if (!this.canPut(p)) {
		if (throwFlag) {
			throw new Exceptions.TypeError("Cannot put argument");
		} else {
			return;
		}
	}
	
	if (!suppressEvent) {
		this.fireEvent("propertySet", {
			name: p,
			value: v
		});
	}

	var ownDesc = this.getOwnProperty(p);
	if (isDataDescriptor(ownDesc)) {
		this.defineOwnProperty(p, { value: v }, throwFlag, suppressEvent);
		return;
	}

	var desc = this.getProperty(p);
	if (isAccessorDescriptor(desc)) {
		desc.set.call(this, [v]);
	} else {
		this.defineOwnProperty(p, {
			value: v,
			writable: true,
			enumerable: true,
			configurable: true
		}, throwFlag, suppressEvent);
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
ObjectType.prototype.canPut = function canPut(p) {
	var desc = this.getOwnProperty(p);
	if (desc) {
		if (isAccessorDescriptor(desc)) {
			return desc.set.className !== "Undefined";
		} else {
			return desc.writable;
		}
	}

	if (!this.objectPrototype) {
		return this.extensible;
	}

	var inherited = this.objectPrototype.getProperty(p);
	if (isUndefined(inherited)) {
		return this.extensible;
	}

	if (isAccessorDescriptor(inherited)) {
		return inherited.set.className !== "Undefined";
	} else {
		return this.extensible && inherited.writable;
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
ObjectType.prototype.hasProperty = function hasProperty(p) {
	return !!this.getProperty(p);
};

/**
 * Indicates that a property was deleted
 *
 * @name module:Base.ObjectType#propertyDeleted
 * @event
 * @param {String} name The name of the proeprty referenced
 */
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
ObjectType.prototype["delete"] = function objDelete(p, throwFlag) {
	var desc = this.getOwnProperty(p);
	
	this.fireEvent("propertyDeleted", {
		name: p
	});
	
	if (isUndefined(desc)) {
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
 * @returns {{@link module:Base.StringType}|{@link module.Base.NumberType}|{@link module:Base.UndefinedType}} The primitive default value
 * @throws {{@link module:Exceptions.TypeError}} Thrown when the primitive cannot be calculated
 * @see ECMA-262 Spec Chapter 8.12.8
 */
ObjectType.prototype.defaultValue = function defaultValue(hint) {
	
	var result;
	
	function defaultToString() {
		var toString = this.get("toString"),
			str;
		if (isCallable(toString)) {
			str = toString.call(this);
			if (isPrimitive(str)) {
				return str;
			}
		}
	}
	
	function defaultValueOf() {
		var valueOf = this.get("valueOf");
		if (isCallable(valueOf)) {
			var val = valueOf.call(this);
			if (isPrimitive(val)) {
				return val;
			}
		}
	}
	
	if (hint === "String") {
		result = defaultToString.call(this);
		if (result) {
			return result;
		}
		result = defaultValueOf.call(this);
		if (result) {
			return result;
		}
		throw new Exceptions.TypeError();
	} else {
		result = defaultValueOf.call(this);
		if (result) {
			return result;
		}
		result = defaultToString.call(this);
		if (result) {
			return result;
		}
		throw new Exceptions.TypeError();
	}
};

/**
 * Indicates that a property was defined.
 *
 * @name module:Base.ObjectType#propertyDefined
 * @event
 * @param {String} name The name of the proeprty referenced
 */
/**
 * ECMA-262 Spec: <em>Creates or alters the named own property to have the state described by a Property Descriptor. The 
 * flag controls failure handling.</em>
 * 
 * @method
 * @param {String} p The name of the parameter to delete
 * @param {module:Base.DataPropertyDescriptor|module:Base.AccessorPropertyDescriptor} desc The descriptor for the property
 * @param {Boolean} throwFlag Whether or not to throw an exception on error (related to strict mode)
 * @param {Boolean} suppressEvent Suppresses the "propertyDefined" event (used when setting prototypes)
 * @returns {Boolean} Indicates whether or not the property was defined successfully
 * @see ECMA-262 Spec Chapter 8.12.9
 */
ObjectType.prototype.defineOwnProperty = function defineOwnProperty(p, desc, throwFlag, suppressEvent) {
	var current = this.getOwnProperty(p),
		newProp,
		descKeys = Object.keys(desc);
	
	if (isUndefined(current) && !this.extensible) {
		if (throwFlag) {
			throw new Exceptions.TypeError();
		}
		return false;
	}
	
	if (!suppressEvent) {
		this.fireEvent("propertyDefined", {
			name: p
		});
	}

	if (isUndefined(current) && this.extensible) {
		if (isAccessorDescriptor(desc)) {
			newProp = new AccessorPropertyDescriptor();
			if (isDefined(desc.configurable)) {
				newProp.configurable = desc.configurable;
			}
			if (isDefined(desc.enumerable)) {
				newProp.enumerable = desc.enumerable;
			}
			if (isDefined(desc.get)) {
				newProp.get = desc.get;
			}
			if (isDefined(desc.set)) {
				newProp.set = desc.set;
			}
		} else {
			newProp = new DataPropertyDescriptor();
			if (isDefined(desc.configurable)) {
				newProp.configurable = desc.configurable;
			}
			if (isDefined(desc.enumerable)) {
				newProp.enumerable = desc.enumerable;
			}
			if (isDefined(desc.value)) {
				newProp.value = desc.value;
			}
			if (isDefined(desc.writable)) {
				newProp.writable = desc.writable;
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
		if (desc.configurable || (isDefined(desc.enumerable) && desc.enumerable !== current.enumerable)) {
			if (throwFlag) {
				throw new Exceptions.TypeError();
			}
			return false;
		}
	}

	if (isGenericDescriptor(desc)) {
		current = desc;
	} else if (isDataDescriptor(desc) !== isDataDescriptor(current)) {
		if (!current.configurable) {
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
			if (!current.writable && desc.writable) {
				if (throwFlag) {
					throw new Exceptions.TypeError();
				}
				return false;
			}
			if (!current.writable && isDefined(desc.value) && !sameDesc(desc, current)) {
				if (throwFlag) {
					throw new Exceptions.TypeError();
				}
				return false;
			}
		}
	} else if (isAccessorDescriptor(desc) && isAccessorDescriptor(current)) {
		if (!current.configurable) {
			if (isDefined(desc.set) && !sameDesc(desc.set, current.set)) {
				if (throwFlag) {
					throw new Exceptions.TypeError();
				}
				return false;
			}
			if (isDefined(desc.get) && !sameDesc(desc.get, current.get)) {
				if (throwFlag) {
					throw new Exceptions.TypeError();
				}
				return false;
			}
		}
	}
	for (var i in descKeys) {
		current[descKeys[i]] = desc[descKeys[i]];
	}
	this._properties[p] = current;
	return true;
};

// ******** Array Type Class ********

/**
 * @classdesc An array type.
 * 
 * @constructor
 * @extends module:Base.ObjectType
 * @param {String} [className] The name of the class, such as "String" or "Object"
 * @see ECMA-262 Spec Chapters 11.1.4 and 15.4
 */
exports.ArrayType = ArrayType;
function ArrayType(className) {
	
	ObjectType.call(this, className || "Array");
	this.objectPrototype = new ArrayPrototypeType();
}
util.inherits(ArrayType, ObjectType);

// ******** RegExp Type Class ********

/**
 * @classdesc An array type.
 * 
 * @constructor
 * @extends module:Base.ObjectType
 * @param {String} [className] The name of the class, such as "String" or "Object"
 * @see ECMA-262 Spec Chapters 11.1.4 and 15.4
 */
exports.RegExpType = RegExpType;
function RegExpType(pattern, flags, className) {
	
	ObjectType.call(this, className || "RegExp");
	this.objectPrototype = new RegExpPrototypeType();
	
	if (isDefined(pattern)) {
		try {
			this.value = new RegExp(pattern, flags);
		} catch(e) {
			throw new Exceptions.SyntaxError();
		}
		this._refreshPropertiesFromRegExp();
	}
}
util.inherits(RegExpType, ObjectType);

RegExpType.prototype._refreshPropertiesFromRegExp = function _refreshPropertiesFromRegExp() {
	
	var value = this.value;
	
	this.put("lastIndex", new NumberType(value.lastIndex), false, true);
	this.put("ignoreCase", new BooleanType(value.ignoreCase), false, true);
	this.put("global", new BooleanType(value.global), false, true);
	this.put("multiline", new BooleanType(value.multiline), false, true);
	this.put("source", new StringType(value.source), false, true);
};

RegExpType.prototype._refreshRegExpFromProperties = function _refreshRegExpFromProperties() {
	this.value.lastIndex = this.get("lastIndex");
};

// ******** Undefined Type Class ********

/**
 * @classdesc An undefined type.
 * 
 * @constructor
 * @extends module:Base.BaseType
 * @param {String} [className] The name of the class, such as "String" or "Object"
 * @see ECMA-262 Spec Chapter 8.1
 */
exports.UndefinedType = UndefinedType;
function UndefinedType(className) {
	BaseType.call(this, className || "Undefined");
	this.type = "Undefined";
}
util.inherits(UndefinedType, BaseType);

// ******** Null Type Class ********

/**
 * @classdesc A null type.
 * 
 * @constructor
 * @extends module:Base.BaseType
 * @param {String} [className] The name of the class, such as "String" or "Object"
 * @see ECMA-262 Spec Chapter 8.2
 */
exports.NullType = NullType;
function NullType(className) {
	BaseType.call(this, className || "Null");
	this.type = "Null";
}
util.inherits(NullType, BaseType);

// ******** Number Type Class ********

/**
 * @classdesc A number type.
 * 
 * @constructor
 * @extends module:Base.BaseType
 * @param {Integer} [initialValue] The initial value of the number. Defaults to 0 if omitted
 * @param {String} [className] The name of the class, such as "String" or "Object"
 * @see ECMA-262 Spec Chapter 8.5
 */
exports.NumberType = NumberType;
function NumberType(initialValue, className) {
	BaseType.call(this, className || "Number");
	this.type = "Number";
	this.value = isUndefined(initialValue) ? 0 : initialValue;
}
util.inherits(NumberType, BaseType);

// ******** Boolean Type Class ********

/**
 * @classdesc A boolean type.
 * 
 * @constructor
 * @extends module:Base.BaseType
 * @param {Boolean} [initialValue] The initial value of the number. Defaults to false if omitted
 * @param {String} [className] The name of the class, such as "String" or "Object"
 * @see ECMA-262 Spec Chapter 8.3
 */
exports.BooleanType = BooleanType;
function BooleanType(initialValue, className) {
	BaseType.call(this, className || "Boolean");
	this.type = "Boolean";
	this.value = isUndefined(initialValue) ? false : initialValue;
}
util.inherits(BooleanType, BaseType);

// ******** String Type Class ********

/**
 * @classdesc A string type.
 * 
 * @constructor
 * @extends module:Base.BaseType
 * @param {String} [initialValue] The initial value of the number. Defaults to "" if omitted
 * @param {String} [className] The name of the class, such as "String" or "Object"
 * @see ECMA-262 Spec Chapter 8.4
 */
exports.StringType = StringType;
function StringType(initialValue, className) {
	ObjectType.call(this, className || "String");
	this.type = "String";
	this.value = isUndefined(initialValue) ? "" : initialValue;
	this.objectPrototype = new StringPrototypeType();
}
util.inherits(StringType, BaseType);

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
 * @extends module:Base.BaseType
 * @see ECMA-262 Spec Chapter 8.7
 */
exports.ReferenceType = ReferenceType;
function ReferenceType(baseValue, referencedName, strictReference) {
	BaseType.call(this, "Reference");
	this.type = "Reference";
	this.baseValue = undefined;
	this.referencedName = "";
	this.strictReference = false;
}
util.inherits(ReferenceType, BaseType);

/**
 * ECMA-262 Spec: <em>Returns the base value component of the supplied reference.</em>
 * 
 * @method
 * @param {module:Base.ReferenceType} v The reference to get the base of
 * @returns {{@link module:Base.BaseType}} The base value of the reference
 * @see ECMA-262 Spec Chapter 8.7
 */
exports.getBase = getBase;
function getBase(v) {
	return v.baseValue;
}

/**
 * ECMA-262 Spec: <em>Returns the referenced name component of the supplied reference.</em>
 * 
 * @method
 * @param {module:Base.ReferenceType} v The reference to get the name of
 * @returns {String} The base value of the reference
 * @see ECMA-262 Spec Chapter 8.7
 */
exports.getReferencedName = getReferencedName;
function getReferencedName(v) {
	return v.referencedName;
}

/**
 * ECMA-262 Spec: <em>Returns the strict reference component of the supplied reference.</em>
 * 
 * @method
 * @param {module:Base.ReferenceType} v The reference to check for strictness
 * @returns {Boolean} Whether or not the reference is a strict reference
 * @see ECMA-262 Spec Chapter 8.7
 */
exports.isStrictReference = isStrictReference;
function isStrictReference(v) {
	return v.strictReference;
}

/**
 * ECMA-262 Spec: <em>Returns true if the base value is a Boolean, String, or Number.</em>
 * 
 * @method
 * @param {module:Base.ReferenceType} v The reference to check for a primitive base
 * @returns {Boolean} Whether or not the reference has a primitive base
 * @see ECMA-262 Spec Chapter 8.7
 */
exports.hasPrimitiveBase = hasPrimitiveBase;
function hasPrimitiveBase(v) {
	return isType(getBase(v), ["Number", "String", "Boolean"]);
}

/**
 * ECMA-262 Spec: <em>Returns true if either the base value is an object or HasPrimitiveBase(V) is true; otherwise 
 * returns false.</em>
 * 
 * @method
 * @param {module:Base.ReferenceType} v The reference to get the name of
 * @returns {Boolean} Whether or not the reference is a property reference
 * @see ECMA-262 Spec Chapter 8.7
 */
exports.isPropertyReference = isPropertyReference;
function isPropertyReference(v) {
	return hasPrimitiveBase(v) || type(getBase(v)) === "Object";
}

/**
 * ECMA-262 Spec: <em>Returns true if the base value is undefined and false otherwise.</em>
 * 
 * @method
 * @param {module:Base.ReferenceType} v The reference to get the name of
 * @returns {Boolean} Whether or not the reference is an unresolvable reference
 * @see ECMA-262 Spec Chapter 8.7
 */
exports.isUnresolvableReference = isUnresolvableReference;
function isUnresolvableReference(v) {
	return type(getBase(v)) === "Undefined";
}

/**
 * Gets the value pointed to by the supplied reference.
 * 
 * @method
 * @param {module:Base.ReferenceType} v The reference to get
 * @returns {{@link module:Base.BaseType}|{@link module:Base.UndefinedType}} The value pointed to by the reference, or 
 *		UndefinedType if the value could not be retrieved
 * @throws {{@link module:Exceptions.ReferenceError}} Thrown if the reference is not resolvable
 * @see ECMA-262 Spec Chapter 8.7.1
 */
exports.getValue = getValue;
function getValue(v) {
	if (type(v) !== "Reference") {
		return v;
	}
	if (isUnresolvableReference(v)) {
		throw new Exceptions.ReferenceError();
	}
	
	var base = getBase(v),
		get,
		getThisObj = this;
	if (isPropertyReference(v)) {
		if (hasPrimitiveBase(v)) {
			get = function get(p) {
				var o = toObject(base),
					desc = o.getProperty(p);
				if (isUndefined(desc)) {
					return new UndefinedType();
				}
				if (isDataDescriptor(desc)) {
					return desc.value;
				} else {
					if (!desc.get) {
						return new UndefinedType();
					}
					return desc.get.call(base);
				}
			};
		} else {
			get = base.get;
			getThisObj = base;
		}
		return get.call(getThisObj, getReferencedName(v));
	} else {
		return base.getBindingValue(getReferencedName(v), isStrictReference(v));
	}
}

/**
 * Puts the supplied value in the reference
 * 
 * @method
 * @param {module:Base.ReferenceType} v The reference to put the value to
 * @param {module:Base.BaseType} w The value to set
 * @throws {{@link module:Exceptions.ReferenceError}} Thrown if the reference is not resolvable
 * @throws {{@link module:Exceptions.TypeError}} Thrown if the value cannot be stored
 * @see ECMA-262 Spec Chapter 8.7.2
 */
exports.putValue = putValue;
function putValue(v, w) {
	if (type(v) !== "Reference") {
		throw new Exceptions.ReferenceError();
	}

	var base = getBase(v),
		put,
		putThisObj = this;
	if (isUnresolvableReference(v)) {
		if (isStrictReference(v)) {
			throw new Exceptions.ReferenceError();
		}
		Runtime.globalObject.put(getReferencedName(v), w, false);
	} else if (isPropertyReference(v)) {
		if (hasPrimitiveBase(v)) {
			put = function put(p, w, throwFlag) {
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
			};
		} else {
			put = base.put;
			putThisObj = base;
		}
		put.call(putThisObj, getReferencedName(v), w, isStrictReference(v));
	} else {
		base.setMutableBinding(getReferencedName(v), w, isStrictReference(v));
	}
}

// ******** Unknown Type Class ********

/**
 * @classdesc Represents an unknown type. Types are considered to be "unknown" if their value cannot be determined at 
 * compile time and are unique to this implementation. There is no equivalent in the ECMA-262 spec.
 * 
 * @constructor
 * @param {String} [className] The name of the class, such as "String" or "Object"
 * @extends module:Base.BaseType
 */
exports.UnknownType = UnknownType;
function UnknownType(className) {
	ObjectType.call(this, className || "Unknown");
	this.type = "Unknown";
}
util.inherits(UnknownType, BaseType);

/*****************************************
 *
 * Chapter 9 - Type Conversion
 *
 *****************************************/

/**
 * ECMA-262 Spec: <em>The abstract operation ToPrimitive takes an input argument and an optional argument PreferredType. 
 * The abstract operation ToPrimitive converts its input argument to a non-Object type. If an object is capable of 
 * converting to more than one primitive type, it may use the optional hint PreferredType to favour that type.</em>
 * 
 * @method
 * @param {module:Base.BaseType} input The value to convert
 * @param {String} preferredType The preferred type to convert to
 * @returns {{@link module:Base.BaseType}} The converted value
 * @see ECMA-262 Spec Chapter 9.1
 */
exports.toPrimitive = toPrimitive;
function toPrimitive(input, preferredType) {
	if (type(input) === "Object") {
		return input.defaultValue(preferredType);
	} else {
		return input;
	}
}

/**
 * ECMA-262 Spec: <em>The abstract operation ToBoolean converts its argument to a value of type Boolean</em>
 * 
 * @method
 * @param {module:Base.BaseType} input The value to convert
 * @returns {{@link module:Base.BooleanType}} The converted value
 * @see ECMA-262 Spec Chapter 9.2
 */
exports.toBoolean = toBoolean;
function toBoolean(input) {
	var newBoolean = new BooleanType();
	switch (type(input)) {
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
			break
	}
	return newBoolean;
}

/**
 * ECMA-262 Spec: <em>The abstract operation ToNumber converts its argument to a value of type Number</em>
 * 
 * @method
 * @param {module:Base.BaseType} input The value to convert
 * @returns {{@link module:Base.NumberType}} The converted value
 * @see ECMA-262 Spec Chapter 9.3
 */
exports.toNumber = toNumber;
function toNumber(input) {
	var newNumber = new NumberType();
	switch (type(input)) {
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
}

/**
 * ECMA-262 Spec: <em>The abstract operation ToInteger converts its argument to an integral numeric value.</em>
 * 
 * @method
 * @param {module:Base.BaseType} input The value to convert
 * @returns {{@link module:Base.NumberType}} The converted value
 * @see ECMA-262 Spec Chapter 9.4
 */
exports.toInteger = toInteger;
function toInteger(input) {
	var newNumber = toNumber(input);
	if (isNaN(newNumber.value)) {
		newNumber.value = 0;
	} else {
		newNumber.value = Math.floor(newNumber.value);
	}
	return newNumber;
}

/**
 * ECMA-262 Spec: <em>The abstract operation ToInt32 converts its argument to one of 2^32 integer values in the range 
 * -2^31 through 2^31 - 1, inclusive.</em>
 * 
 * @method
 * @param {module:Base.BaseType} input The value to convert
 * @returns {{@link module:Base.NumberType}} The converted value
 * @see ECMA-262 Spec Chapter 9.5
 */
exports.toInt32 = toInt32;
function toInt32(input) {
	var newNumber = toNumber(input);
	if (isNaN(newNumber.value) || newNumber.value === Infinity || newNumber.value === -Infinity) {
		newNumber.value = 0;
	} else {
		newNumber.value = Math.floor(newNumber.value) % Math.pow(2, 32);
		if (newNumber.value >= Math.pow(2, 31)) {
			newNumber.value -= Math.pow(2, 32);
		}
	}
	return newNumber;
}

/**
 * ECMA-262 Spec: <em>The abstract operation ToUint32 converts its argument to one of 2^32 integer values in the range 0 
 * through 2^32 - 1, inclusive.</em>
 * 
 * @method
 * @param {module:Base.BaseType} input The value to convert
 * @returns {{@link module:Base.NumberType}} The converted value
 * @see ECMA-262 Spec Chapter 9.6
 */
exports.toUint32 = toUint32;
function toUint32(input) {
	var newNumber = toNumber(input);
	if (isNaN(newNumber.value) || newNumber.value === Infinity || newNumber.value === -Infinity) {
		newNumber.value = 0;
	} else {
		newNumber.value = Math.floor(newNumber.value) % Math.pow(2, 32);
	}
	return newNumber;
}

/**
 * ECMA-262 Spec: <em>The abstract operation ToUint16 converts its argument to one of 2^16 integer values in the range 0 
 * through 2^16 - 1, inclusive.</em>
 * 
 * @method
 * @param {module:Base.BaseType} input The value to convert
 * @returns {{@link module:Base.NumberType}} The converted value
 * @see ECMA-262 Spec Chapter 9.7
 */
exports.toUint16 = toUint16;
function toUint16(input) {
	var newNumber = toNumber(input);
	if (isNaN(newNumber.value) || newNumber.value === Infinity || newNumber.value === -Infinity) {
		newNumber.value = 0;
	} else {
		newNumber.value = Math.floor(newNumber.value) % Math.pow(2, 16);
	}
	return newNumber;
}

/**
 * ECMA-262 Spec: <em>The abstract operation ToString converts its argument to a value of type String</em>
 * 
 * @method
 * @param {module:Base.BaseType} input The value to convert
 * @returns {{@link module:Base.StringType}} The converted value
 * @see ECMA-262 Spec Chapter 9.8
 */
exports.toString = toString;
function toString(input) {
	var newString = new StringType();
	if (type(input) === "Object") {
		newString.value = toString(toPrimitive(input, "String"));
	} else {
		newString.value = input.value + "";
	}
	return newString;
}

/**
 * ECMA-262 Spec: <em>The abstract operation ToObject converts its argument to a value of type Object</em>
 * 
 * @method
 * @param {module:Base.BaseType} input The value to convert
 * @returns {{@link module:Base.ObjectType}} The converted value
 * @see ECMA-262 Spec Chapter 9.9
 */
exports.toObject = toObject;
function toObject(input) {
	var newObject;
	switch (type(input)) {
		case "Boolean":
			newObject = new ObjectType();
			newObject.className = "Boolean";
			newObject.primitiveValue = input.value;
			newObject.objectPrototype = new BooleanPrototypeType();
			return newObject;
		case "Number":
			newObject = new ObjectType();
			newObject.className = "Number";
			newObject.primitiveValue = input.value;
			newObject.objectPrototype = new NumberPrototypeType();
			return newObject;
		case "String":
			newObject = new ObjectType();
			newObject.className = "String";
			newObject.primitiveValue = input.value;
			newObject.objectPrototype = new StringPrototypeType();
			return newObject;
		case "Object":
			return input;
		default:
			throw new Exceptions.TypeError();
	}
	return newObject;
}

/**
 * ECMA-262 Spec: <em>The abstract operation CheckObjectCoercible throws an error if its argument is a value that cannot 
 * be converted to an Object using ToObject.</em>
 * 
 * @method
 * @param {module:Base.BaseType} input The value to check if it's coercible
 * @throws {{@link module:Exceptions.TypeError}} Thrown if the object is not coercible
 * @see ECMA-262 Spec Chapter 9.10
 */
exports.checkObjectCoercible = checkObjectCoercible;
function checkObjectCoercible(input) {
	if (isType(input, ["Undefined", "Null"])) {
		throw new Exceptions.TypeError();
	}
	return;
}

/**
 * ECMA-262 Spec: <em>The abstract operation IsCallable determines if its argument, which must be an ECMAScript 
 * language value, is a callable function Object</em>
 * 
 * @method
 * @param {module:Base.BaseType} input The value to check if it's callable
 * @returns {Boolean} Whether or not the object is callable
 * @see ECMA-262 Spec Chapter 9.11
 */
exports.isCallable = isCallable;
function isCallable(input) {
	if (type(input) === "Object") {
		return !!input.call;
	} else {
		return false;
	}
}

/**
 * ECMA-262 Spec: <em>The internal comparison abstract operation SameValue(x, y), where x and y are ECMAScript language 
 * values, produces true or false.</em> Note that, since we are in JavaScript land already, we just do a straight up
 * comparison between objects. The function is defined so that implementations that use it more closely resemble the 
 * specification.
 * 
 * @method
 * @param {module:Base.BooleanType} x The first value to compare
 * @param {module:Base.BooleanType} y The second value to compare
 * @returns {Boolean} Whether or not the values are the same
 * @see ECMA-262 Spec Chapter 9.12
 */
exports.sameValue = sameValue;
function sameValue(x, y) {
	return x.value === y.value;
}

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
 * @throws {{@link module:Exceptions.InvalidStateError}} Thrown if the binding already exists
 * @see ECMA-262 Spec Chapter 10.2.1.1.2
 */
DeclarativeEnvironmentRecord.prototype.createMutableBinding = function createMutableBinding(n, d) {
	var bindings = this._bindings;
	if (n in bindings) {
		throw new Exceptions.InvalidStateError("Could not create mutable binding: binding '" + n + "' already exists");
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
 * @throws {{@link module:Exceptions.InvalidStateError}} Thrown if the binding does not exist
 * @throws {{@link module:Exceptions.TypeError}} Thrown if the binding is not mutable and s is true
 * @see ECMA-262 Spec Chapter 10.2.1.1.3
 */
DeclarativeEnvironmentRecord.prototype.setMutableBinding = function setMutableBinding(n, v, s) {
	var bindings = this._bindings;
	if (!(n in bindings)) {
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
DeclarativeEnvironmentRecord.prototype.getBindingValue = function getBindingValue(n, s) {

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
 * @throws {{@link module:Exceptions.InvalidStateError}} Thrown if the binding already exists
 * @see ECMA-262 Spec Chapter 10.2.1.1.7
 */
DeclarativeEnvironmentRecord.prototype.createImmutableBinding = function createImmutableBinding(n) {

	var bindings = this._bindings;
	if (n in bindings) {
		throw new Exceptions.InvalidStateError("Could not create immutable binding: binding '" + n + "' already exists");
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
 * @throws {{@link module:Exceptions.InvalidStateError}} Thrown if the binding does not exist
 * @throws {{@link module:Exceptions.InvalidStateError}} Thrown if the binding is not immutable or has already been initialized
 * @see ECMA-262 Spec Chapter 10.2.1.1.8
 */
DeclarativeEnvironmentRecord.prototype.InitializeImmutableBinding = function InitializeImmutableBinding(n, v) {

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
exports.ObjectEnvironmentRecord = ObjectEnvironmentRecord;
function ObjectEnvironmentRecord(bindingObject) {
	if (!bindingObject) { 
		throw "";
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
 * @throws {{@link module:Exceptions.InvalidStateError}} Thrown if the binding already exists
 * @see ECMA-262 Spec Chapter 10.2.1.2.2
 */
ObjectEnvironmentRecord.prototype.createMutableBinding = function createMutableBinding(n, d) {
	var bindingObject = this._bindingObject;
	if (bindingObject.hasProperty(n)) {
		throw new Exceptions.InvalidStateError("Could not create mutable binding: binding '" + n + "' already exists");
	}

	bindingObject.defineOwnProperty(n, {
		value: new UndefinedType(),
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
ObjectEnvironmentRecord.prototype.setMutableBinding = function setMutableBinding(n, v, s) {
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
ObjectEnvironmentRecord.prototype.getBindingValue = function getBindingValue(n, s) {
	var bindingObject = this._bindingObject;
	if (!bindingObject.hasProperty(n)) {
		if (s) {
			throw new Exceptions.ReferenceError();
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
	
	// "Recursively" find all declarations
	while (nodeStack.length) {
		node = nodeStack.pop();
		name = RuleProcessor.getRuleName(node);
		if (name === "defun") {
			functions.push({
				functionName: node[1],
				formalParameterList: node[2],
				functionBody: node[3]
			});
		} else if (name === "var") {
			for (i = 0, len = node[1].length; i < len; i++) {
				variables.push({
					variableName: node[1][i][0]
				});
			}
		} else {
			
			// Each node is a little different when it comes to children, so we have to parse them separately
			switch (name) {
				case "if":
					if (node[2]) {
						nodeStack = nodeStack.concat([node[2]]);
					}
					if (node[3]) {
						nodeStack = nodeStack.concat([node[3]]);
					}
					break;
				
				case "do":
					nodeStack = nodeStack.concat([node[2]]);
					break;
				
				case "while":
					nodeStack = nodeStack.concat([node[2]]);
					break;
				
				case "for":
					nodeStack = nodeStack.concat([node[1], node[4]]);
					break;
				
				case "for-in":
					nodeStack = nodeStack.concat([node[1], node[4]]);
					break;
				
				case "try":
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
				
				case "switch":
					for (i = 0, len = node[2].length; i < len; i++) {
						nodeStack = nodeStack.concat(node[2][i][1]);
					}
					break;
					
				case "block":
					if (node[1]) {
						nodeStack = nodeStack.concat(node[1]);
					}
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
exports.createGlobalContext = createGlobalContext;
function createGlobalContext(ast, strict) {
	
	// Create the context
	var globalObject = new ObjectType(),
		env = newObjectEnvironment(globalObject, Runtime.globalContext.variableEnvironment),
		configurableBindings = false,
		executionContext = new ExecutionContext(
			env,
			env,
			globalObject,
			strict),
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
				descriptor = new DataPropertyDescriptor();
				descriptor.writable = true;
				descriptor.enumerable = true;
				descriptor.configurable = configurableBindings;
				globalObject.defineOwnProperty(fn, descriptor, true);
			} else if (isAccessorDescriptor(existingProp) || (existingProp.writable !== true && 
					existingProp.enumerable !== true)) {
				throw new Exceptions.TypeError();
			}
		}
		
		env.setMutableBinding(fn, fo, strict);
	}
	
	// Find all of the variable declarations and bind them
	for (i = 0, len = variables.length; i < len; i++) {
		var dn = variables[i].variableName,
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
function createEvalContext(callingContext, code) {
	
	// Create or set the execution context
	var executionContext,
		strict = containsUseStrict(code);
	if (callingContext) {
		executionContext = callingContext;
	} else {
		executionContext = new ExecutionContext(
			newObjectEnvironment(globalObject, undefined),
			newObjectEnvironment(globalObject, undefined),
			new ObjectType()
		);
	}
	
	// TODO: Bind the function and variable declarations to the global context
	
	// Create the inner lexical environment if this is strict mode code
	if (containsUseStrict(code)) {
		executionContext.variableEnvironment = newDeclarativeEnvironment(executionContext.lexicalEnvironment);
		executionContext.lexicalEnvironment = newDeclarativeEnvironment(executionContext.lexicalEnvironment);
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
	
	obj.className = "Arguments";
	obj.defineOwnProperty("length", {
		value: new NumberType(len),
		writable: true,
		enumerable: true,
		configurable: true
	}, false);
	
	while (indx >= 0) {
		val = args[indx];
		obj.defineOwnProperty(indx + "", {
			value: val,
			writable: true,
			enumerable: true,
			configurable: true
		}, false);
		if (indx < names.length) {
			name = names[indx];
			if (!strict && !(name in mappedNames)) {
				mappedNames.push(name);
				map.defineOwnProperty(indx + "", {
					// Note: we have to do this crazy parse since returns aren't allowedin global scope
					get: new FunctionType([], AST.parseString("function temp () { return " + name + "; }")[1][0][3][0], env, true),
					set: new FunctionType([name + "_arg"], AST.parseString(name + " = " + name + "_arg;")[1][0], env, true),
					configurable: true
				}, false);
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
				if (p === "callee" && v.className === "Function" && v.strict) {
					throw new Exceptions.TypeError();
				}
				return v;
			}
		};
		
		obj.getOwnProperty = function getOwnProperty(p) {
			var desc = ObjectType.prototype.getOwnProperty.call(obj, p),
				map,
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
					throw new Exceptions.TypeError();
				}
				return false;
			}
			
			if (isMapped) {
				if (isAccessorDescriptor(desc)) {
					map["delete"](p, false);
				} else {
					if (desc.value) {
						map.put(p, desc.value, throwFlag);
					}
					if (desc.writable === false) {
						map["delete"](p, false);
					}
				}
			}
		};
		
		obj["delete"] = function (p, throwFlag) {
			var isMapped = map.getOwnProperty(p),
				result = ObjectType.prototype["delete"].call(obj, p, throwFlag);
			if (result && isMapped) {
				map["delete"](p, false);
			}
			return result;
		};
	}
	
	if (strict) {
		obj.defineOwnProperty("caller", {
			get: throwTypeError,
			set: throwTypeError,
			enumerable: false,
			configurable: false
		}, false);
		obj.defineOwnProperty("callee", {
			get: throwTypeError,
			set: throwTypeError,
			enumerable: false,
			configurable: false
		}, false);
	} else {
		obj.defineOwnProperty("callee", {
			value: func,
			writeable: true,
			enumerable: true,
			configurable: true
		}, false);
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
	var env = newDeclarativeEnvironment(functionObject.scope),
		configurableBindings = false,
		strict = functionObject.strict,
		executionContext,
		len, i,
		arg, argName,
		functions, variables, result,
		thisArgType = type(thisArg),
		thisBinding;
	
	// Create the this binding
	if (functionObject.strict) {
		thisBinding = thisArg;
	} else if (thisArgType === "Null" || thisArgType === "Undefined") {
		thisBinding = Runtime.getGlobalContext(); // Use the "global" object as created in "toplevel," equivalent to module scope in node.js
	} else if (thisArgType !== "Object") {
		thisBinding = toObject(thisArg);
	} else {
		thisBinding = thisArg;
	}
	
	// Create the execution context and find declarations inside of it
	executionContext = new ExecutionContext(env, env, thisBinding, strict);
	env = executionContext.variableEnvironment.envRec;
	result = findDeclarations(["toplevel", functionObject.code]);
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
				descriptor = new DataPropertyDescriptor();
				descriptor.writable = true;
				descriptor.enumerable = true;
				descriptor.configurable = configurableBindings;
				globalObject.defineOwnProperty(fn, descriptor, true);
			} else if (isAccessorDescriptor(existingProp) || (existingProp.writable !== true && 
					existingProp.enumerable !== true)) {
				throw new Exceptions.TypeError();
			}
		}
		
		env.setMutableBinding(fn, fo, strict);
	}
	
	// Initialize the arguments variable
	if (!env.hasBinding("arguments")) {
		var argsObj = createArgumentsObject(functionObject, functionObject.formalParameters, argumentsList, env, strict);
		if (strict) {
			env.createImmutableBinding("arguments");
			env.InitializeImmutableBinding("arguments", argsObj);
		} else {
			env.createMutableBinding("arguments");
			env.setMutableBinding("arguments", argsObj, false);
		}
	}
	
	// Find all of the variable declarations and bind them
	for (i = 0, len = variables.length; i < len; i++) {
		var dn = variables[i].variableName,
			varAlreadyDeclared = env.hasBinding(dn);
		
		if (!varAlreadyDeclared) {
			env.createMutableBinding(dn, configurableBindings);
			env.setMutableBinding(dn, new UndefinedType(), strict);
		}
	}
	
	// Return the context
	return executionContext;
}
 
/*****************************************
 *
 * Chapter 11 - Miscellany
 *
 *****************************************/

/**
 * The Strict Equality Comparison Algorithm
 * 
 * @method
 * @param {moduel:Base.BaseType} x The first value to compare
 * @param {moduel:Base.BaseType} y The second value to compare
 * @returns {Boolean} Whether or not the two equals are strictly equal
 * @see ECMA-262 Spec Chapter 11.9.6
 */
exports.strictEquals = strictEquals;
function strictEquals(x, y) {
	var typeX = type(x),
		typeY = type(y);
	
	if (typeX !== typeY) {
		return false;
	}
	
	switch(typeX) {
		case "Undefined":
		case "Null": return true;
		case "Boolean":
		case "Number":
		case "String": return x.value === y.value;
		case "Object": return x === y;
	}
}
 
/*****************************************
 *
 * Chapter 13 - Function Definitions
 *
 *****************************************/
 
/**
 * @classdesc The base for functions that are shared by the actual function type, and by native functions
 * 
 * @constructor
 * @extends module:Base.ObjectType
 * @param {Integer} length The number of formal parameters
 * @param {Boolean} [dontCreatePrototype] Always set to false. Only used by the function prototype itself to prevent
 *		infinite recursion
 * @param {String} [className] The name of the class
 * @see ECMA-262 Spec Chapter 13.2
 */  
exports.FunctionTypeBase = FunctionTypeBase;
function FunctionTypeBase(length, dontCreatePrototype, className) {
	
	ObjectType.call(this, className || "Function");
	
	var lenNumber,
		proto;
	
	// Step 4
	this.objectPrototype = dontCreatePrototype ? undefined : new FunctionPrototypeType();
	
	// Step 9
	this.scope = Runtime.getGlobalContext();
	
	// Steps 10 (implicit) and 11, defaulting to empty (FunctionType overrides it)
	this.formalParameters = [];
	
	// Step 13
	this.extensible = true;
	
	// Step 14 and 15
	this.defineOwnProperty("length", {
		value: new NumberType(length),
		writable: false,
		enumerable: false,
		configurable: false
	}, false);
	
	// Step 16
	proto = new ObjectType();
	
	// Step 17
	proto.defineOwnProperty("constructor", {
		value: this,
		writable: true,
		enumerable: false,
		configurable: true
	}, false);
	
	// Step 18
	this.defineOwnProperty("prototype", {
		value: proto,
		writable: true,
		enumerable: false,
		configurable: false
	}, false);
}
util.inherits(FunctionTypeBase, ObjectType);

/**
 * ECMA-262 Spec: <em>Returns the value of the named property.</em>
 * 
 * @method
 * @param {String} p The name of the property to fetch
 * @returns {{@link module:Base.BaseType}} The value of the property, or a new instance of {@link module:Base.UndefinedType} if 
 *		the property does not exist
 * @see ECMA-262 Spec Chapters 8.12.3 and 15.3.5.4
 */
FunctionTypeBase.prototype.get = function get(p) {
	var v = ObjectType.prototype.get.call(this, p);
	if (p === "caller" && v.className === "Function" && v.strict) {
		throw new Exceptions.TypeError();
	}
	return v;
};

/**
 * Checks if the function has an instance of v (or something)
 * 
 * @method
 * @param {module:Base.BaseType} v The value to check against
 * @returns {Boolean} Whether or not this function has an instance of v
 * @see ECMA-262 Spec Chapter 15.3.5.3
 */
FunctionTypeBase.prototype.hasInstance = function hasInstance(v) {
	if (type(v) !== "Object") {
		return false;
	}
	
	var o = this.get("prototype");
	if (type(o) !== "Object") {
		throw new Exceptions.TypeError();
	}
	do {
		v = v.get("prototype");
		if (o === v) {
			return true;
		}
	} while (v);
	return false;
};
 
/**
 * @classdesc A function object type
 *
 * @constructor
 * @extends module:Base.FunctionTypeBase
 * @param {Array[String]} formalParameterList The list of function arguments
 * @param {module:AST.node} functionBody The parsed body of the function
 * @param {module:Base.LexicalEnvironment} lexicalEnvironment The lexical environment of the function
 * @param {Boolean} strict Whether or not this is a strict mode function
 * @param {String} [className] The name of the class, defaults to "Function." This parameter should only be used by a 
 *		constructor for an object extending this one.
 * @see ECMA-262 Spec Chapter 13.2
 */
exports.FunctionType = FunctionType;
function FunctionType(formalParameterList, functionBody, lexicalEnvironemnt, strict, className) {
	
	// Steps 3 (implicit), 4, 13, 14, and 15 covered in the parent constructor
	FunctionTypeBase.call(this, formalParameterList ? formalParameterList.length : 0, false, className);
	
	// Step 9
	this.scope = lexicalEnvironemnt;
	
	// Steps 10 (implicit) and 11
	this.formalParameters = formalParameterList;
	
	// Step 12
	this.code = functionBody;
	
	// Store whether or not this is strict mode for easy access later
	this.strict = strict;
	
	// Step 19
	if (strict) {
		this.defineOwnProperty("caller", {
			get: throwTypeError,
			set: throwTypeError,
			enumerable: false,
			configurable: false
		}, false);
		this.defineOwnProperty("arguments", {
			get: throwTypeError,
			set: throwTypeError,
			enumerable: false,
			configurable: false
		}, false);
	}
}
util.inherits(FunctionType, FunctionTypeBase);

/**
 * Calls the function
 * 
 * @method
 * @param {module:Base.BaseType} thisVal The value of <code>this</code> of the function
 * @param (Array[{@link module:Base.BaseType}]} args The set of arguments passed in to the function call
 * @returns {module:Base.BaseType} The return value from the function
 * @see ECMA-262 Spec Chapter 13.2.1
 */
FunctionType.prototype.call = function call(thisVal, args) {
	var funcCtx = createFunctionContext(this, thisVal, args || []),
		result;
	Runtime.contextStack.push(funcCtx);
	
	// Execute the function body
	if (!this.code || this.code.length === 0) {
		result = ["normal", new UndefinedType(), undefined];
	} else {
		for (var i = 0, len = this.code.length; i < len; i++) {
			result = RuleProcessor.processRule(this.code[i]);
			if (result && result.length === 3 && result[0] !== "normal") {
				break;
			}
		}
	}
	
	Runtime.contextStack.pop();
	
	// Process the results
	if (result[0] === "throw") {
		// Do nothing, but preserve the result value
	} else if (result[0] === "return") {
		result = result[1];
	} else {
		result = new UndefinedType();
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
FunctionType.prototype.construct = function construct(args) {
	var obj = new ObjectType(),
		proto = this.get("prototype"),
		result;
	obj.extensible = true;
	
	// Hook up the prototype
	if (type(proto) === "Object") {
		obj.objectPrototype = proto;
	}
	
	// Invoke the constructor
	result = this.call(obj, args);
	
	// Return the result
	if (type(result) === "Object") {
		return result;
	}
	return obj;
};

/**
 * Creates the ThrowTypeError function, if it doesn't already exist
 *
 * @method
 * @return {module:Base.FunctionType} The ThrowTypeError function
 * @see ECMA-262 Spec Chapter 13.2.3
 */
exports.createThrowTypeErrorFunction = createThrowTypeErrorFunction;
function createThrowTypeErrorFunction() {
	
	if (!throwTypeError) {
		var globalContext = Runtime.getGlobalContext();
		
		throwTypeError = new FunctionType([], undefined, globalContext.lexicalEnvironment, globalContext.strict);
		throwTypeError.call = function() {
			return new Exceptions.TypeError();
		};
		throwTypeError.extensible = false;
	}
	return throwTypeError;
}

/*****************************************
 *
 * Chapter 15 - Built-ins
 *
 *****************************************/

// ******** Object Prototype Type Class ********

/**
 * toString() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.4.2
 */
function ObjectProtoToStringFunc(className) {
	ObjectType.call(this, className || "Function", undefined, true);
	this.put("length", new NumberType(0), false, true);
}
util.inherits(ObjectProtoToStringFunc, FunctionTypeBase);
ObjectProtoToStringFunc.prototype.call = function call(thisVal, args) {
	var result = new StringType();
	
	if (type(thisVal) === "Undefined") {
		result.value = "[object Undefined]";
	} else if (type(thisVal) === "Null") {
		result.value = "[object Null]";
	} else {
		result.value = "[object " + toObject(thisVal).className + "]";
	}
	
	return result;
};

/**
 * toLocaleString() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.4.3
 */
function ObjectProtoToLocaleStringFunc(className) {
	ObjectType.call(this, className || "Function", undefined, true);
	this.put("length", new NumberType(0), false, true);
}
util.inherits(ObjectProtoToLocaleStringFunc, FunctionTypeBase);
ObjectProtoToLocaleStringFunc.prototype.call = function call(thisVal, args) {
	var o = toObject(thisVal),
		toString = o.get("toString");
	if (!isCallable(toString)) {
		throw new Exceptions.TypeError();
	}
	return toString.call(o);
};

/**
 * valueOf() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.4.4
 */
function ObjectProtoValueOfFunc(className) {
	ObjectType.call(this, className || "Function", undefined, true);
	this.put("length", new NumberType(0), false, true);
}
util.inherits(ObjectProtoValueOfFunc, FunctionTypeBase);
ObjectProtoValueOfFunc.prototype.call = function call(thisVal, args) {
	return toObject(thisVal);
};

/**
 * hasOwnProperty() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.4.5
 */
function ObjectProtoHasOwnPropertyFunc(className) {
	ObjectType.call(this, className || "Function", undefined, true);
	this.put("length", new NumberType(1), false, true);
}
util.inherits(ObjectProtoHasOwnPropertyFunc, FunctionTypeBase);
ObjectProtoHasOwnPropertyFunc.prototype.call = function call(thisVal, args) {
	var p = toString(args[0]),
		o = toObject(thisVal),
		desc = o.getOwnProperty(p.value);
	return new BooleanType(!!desc);
};

/**
 * isPrototypeOf() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.4.6
 */
function ObjectProtoIsPrototypeOfFunc(className) {
	ObjectType.call(this, className || "Function", undefined, true);
	this.put("length", new NumberType(1), false, true);
}
util.inherits(ObjectProtoIsPrototypeOfFunc, FunctionTypeBase);
ObjectProtoIsPrototypeOfFunc.prototype.call = function call(thisVal, args) {
	var result = new BooleanType(),
		o,
		v = args[0];

	if (isObject(v)) {
		o = toObject(thisVal);
		while (true) {
			v = v.objectPrototype;
			if (!v || isType(v, ["Undefined", "Null"])) {
				break;
			}
			if (o === v) {
				result.value = true;
				break;
			}
		}
	}
	
	return result;
};

/**
 * propertyIsEnumerable() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.4.7
 */
function ObjectProtoPropertyIsEnumerableFunc(className) {
	ObjectType.call(this, className || "Function", undefined, true);
	this.put("length", new NumberType(1), false, true);
}
util.inherits(ObjectProtoPropertyIsEnumerableFunc, FunctionTypeBase);
ObjectProtoPropertyIsEnumerableFunc.prototype.call = function call(thisVal, args) {
	var p = toString(args[0]),
		o = toObject(thisVal),
		desc = o.getOwnProperty(p.value);
	return new BooleanType(isDefined(desc) && desc.enumerable);
};

/**
 * @classdesc The prototype for Objects, which is itself an object
 * 
 * @constructor
 * @see ECMA-262 Spec Chapter 15.2.4
 */
exports.ObjectPrototypeType = ObjectPrototypeType;
function ObjectPrototypeType(className) {
	
	// Warning: setting the third argument to anything falsey, or leaving it off, results in infinite recursion
	ObjectType.call(this, className || "Object", undefined, true);
		
	// toString method
	this.put("toString", new ObjectProtoToStringFunc(), false, true);
	this.put("toLocaleString", new ObjectProtoToLocaleStringFunc(), false, true);
	this.put("valueOf", new ObjectProtoValueOfFunc(), false, true);
	this.put("hasOwnProperty", new ObjectProtoHasOwnPropertyFunc(), false, true);
	this.put("isPrototypeOf", new ObjectProtoIsPrototypeOfFunc(), false, true);
	this.put("propertyIsEnumerable", new ObjectProtoPropertyIsEnumerableFunc(), false, true);
}
util.inherits(ObjectPrototypeType, ObjectType);

// ******** Function Prototype Type Class ********

/**
 * toString() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.4.2
 */
function FunctionProtoToStringFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(FunctionProtoToStringFunc, FunctionTypeBase);
FunctionProtoToStringFunc.prototype.call = function call(thisVal, args) {
	if (thisVal.className !== "Function") {
		throw new Exceptions.TypeError();
	}
	return ObjectProtoToStringFunc.apply(this, arguments);
};

/**
 * apply() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.4.2
 */
function FunctionProtoApplyFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(2), false, true);
}
util.inherits(FunctionProtoApplyFunc, FunctionTypeBase);
FunctionProtoApplyFunc.prototype.call = function call(thisVal, args) {
	
	if (!isCallable(thisVal)) {
		throw new Exceptions.TypeError();
	}
	
	var thisArg = args[0],
		argArray = args[1],
		len,
		argList = [],
		i = 0;
	
	if (!argArray || isType(argArray, ["Undefined", "Null"])) {
		return thisVal.call(thisArg, []);
	}
	
	if (!isObject(argArray)) {
		throw new Exceptions.TypeError();
	}
	
	len = toUint32(argArray.get("length")).value;
	for (; i < len; i++) {
		argList.push(argArray.get(i));
	}
	
	return thisVal.call(thisArg, argList);
};

/**
 * call() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.4.2
 */
function FunctionProtoCallFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(FunctionProtoCallFunc, FunctionTypeBase);
FunctionProtoCallFunc.prototype.call = function call(thisVal, args) {
	
	if (!isCallable(thisVal)) {
		throw new Exceptions.TypeError();
	}
	var thisArg = args[0],
		argList = [],
		i = 1,
		len = args.length;
	
	for (; i < len; i++) {
		argList.push(args[i]);
	}
	
	return thisVal.call(thisArg, argList);
};

/**
 * bind() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.2.4.2
 */
function FunctionProtoBindFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(FunctionProtoBindFunc, FunctionTypeBase);
FunctionProtoBindFunc.prototype.call = function call(thisVal, args) {
	
	var target = thisVal,
		thisArg = args[0],
		a = args.slice(1),
		f,
		l;
	
	if (!isCallable(target)) {
		throw new Exceptions.TypeError();
	}
	
	// Create the new function
	f = new FunctionType();
	f.targetFunction = target;
	f.boundThis = thisArg;
	f.boundArgs = a;
	f.extensible = true;
	
	// Set the call method
	f.call = function call(thisVal, extraArgs) {
		return target.call(thisArg, a.concat(extraArgs));
	};
	
	// Set the construct method
	f.construct = function construct(extraArgs) {
		if (!target.construct) {
			throw new Exceptions.TypeError();
		}
		return target.construct(a.concat(extraArgs));
	};
	
	// Set the hasInstance method
	f.hasInstance = function hasInstance(v) {
		if (!target.hasInstance) {
			throw new Exceptions.TypeError();
		}
		return target.hasInstance(v);
	};
	
	// Set the length property
	f.put("length", new NumberType(target.className === "Function" ? Math.max(0, target.get("length").value - a.length) : 0));
	
	// Set caller and arguments to thrower
	f.defineOwnProperty("caller", {
		get: throwTypeError,
		set: throwTypeError,
		enumerable: false,
		configurable: false
	}, false);
	f.defineOwnProperty("arguments", {
		get: throwTypeError,
		set: throwTypeError,
		enumerable: false,
		configurable: false
	}, false);
	
	return f;
};

/**
 * @classdesc The prototype for Functions
 * 
 * @constructor
 * @see ECMA-262 Spec Chapter 15.3.4
 */
exports.FunctionPrototypeType = FunctionPrototypeType;
function FunctionPrototypeType(className) {
	
	// Warning: setting the third argument to anything falsey, or leaving it off, results in infinite recursion
	FunctionTypeBase.call(this, className || "Function", true);
	
	this.put("toString", new FunctionProtoToStringFunc(), false, true);
	this.put("apply", new FunctionProtoApplyFunc(), false, true);
	this.put("call", new FunctionProtoCallFunc(), false, true);
	this.put("bind", new FunctionProtoBindFunc(), false, true);
}
util.inherits(FunctionPrototypeType, FunctionTypeBase);

// ******** Array Prototype Type Class ********

/**
 * toString() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.2
 */
function ArrayProtoToStringFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(ArrayProtoToStringFunc, FunctionTypeBase);
ArrayProtoToStringFunc.prototype.call = function call(thisVal, args) {
	
	// Steps 1 and 2
	var array = toObject(thisVal),
		func = array.get("join");
	
	// Step 3
	if (!isCallable(func)) {
		func = new ObjectProtoToStringFunc();
	}
	
	// Step 4
	return func.call(array, []);
};

/**
 * toLocaleString() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.3
 */
function ArrayProtoToLocaleStringFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(ArrayProtoToLocaleStringFunc, FunctionTypeBase);
ArrayProtoToLocaleStringFunc.prototype.call = function call(thisVal, args) {
	
	// Steps 1-4
	var array = toObject(thisVal),
		len = toUint32(array.get("length")).value,
		separator = ",",
		firstElement,
		r,
		func,
		elementObj,
		k = 1,
		s,
		nextElement;
	
	// Step 5
	if (len === 0) {
		return new StringType();
	}
	
	// Step 6
	firstElement = array.get(0);
	
	// Steps 7 and 8
	if (isType(firstElement, ["Undefined", "Null"])) {
		r = "";
	} else {
		elementObj = toObject(firstElement);
		func = elementObj.get("toLocaleString");
		if (!isCallable(func)) {
			throw new Exceptions.TypeError();
		}
		r = func.call(elementObj, []).value;
	}
	
	// Step 10
	while (k < len) {
		s = r + separator;
		nextElement = array.get(k);
		if (isType(nextElement, ["Undefined", "Null"])) {
			r = "";
		} else {
			elementObj = toObject(nextElement);
			func = elementObj.get("toLocaleString");
			if (!isCallable(func)) {
				throw new Exceptions.TypeError();
			}
			r = func.call(elementObj, []).value;
		}
		r = s + r;
		k++;
	}
	
	// Step 11
	return new StringType(r);
};

/**
 * concat() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.4
 */
function ArrayProtoConcatFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(ArrayProtoConcatFunc, FunctionTypeBase);
ArrayProtoConcatFunc.prototype.call = function call(thisVal, args) {
	
	// Steps 1-4
	var o = toObject(thisVal),
		a = new ArrayType(),
		n = 0,
		items = [o].concat(args),
		e,
		k,
		len;
	
	// Step 5
	while (items.length) {
		
		// Step 5.a
		e = items.shift();
		
		if (e.className === "Array") { // Step 5.b
			k = 0;
			len = e.get("length").value;
			while (k < len) {
				if (e.hasProperty(k)) {
					a.defineOwnProperty(n, {
						value: e.get(k),
						writable: true,
						enumerable: true,
						configurable: true
					}, false);
				}
				n++;
				k++;
			}
		} else { // Step 5.c
			a.defineOwnProperty(n, {
				value: e,
				writable: true,
				enumerable: true,
				configurable: true
			}, false);
			n++;
		}
	}
	
	// Why is length not set in the spec? Seems to be an omissions since other methods (like pop) do it.
	a.put("length", new NumberType(n), false);
	
	// Step 6
	return a;
};

/**
 * join() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.5
 */
function ArrayProtoJoinFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(ArrayProtoJoinFunc, FunctionTypeBase);
ArrayProtoJoinFunc.prototype.call = function call(thisVal, args) {
	
	// Steps 1-3
	var separator = args[0],
		o = toObject(thisVal),
		len = toUint32(o.get("length")).value,
		sep,
		r,
		element0,
		k = 1,
		s,
		element,
		next;
	
	// Steps 4 and 5
	if (!separator || type(separator) === "Undefined") {
		sep = ",";
	} else {
		sep = toString(separator).value;
	}
	
	// Step 6
	if (len === 0) {
		return new StringType();
	}
	
	// Step 7
	element0 = o.get(0);
	
	// Step 8
	if (isType(element0, ["Undefined", "Null"])) {
		r = "";
	} else {
		r = toString(element0).value;
	}
	
	// Step 10
	while (k < len) {
		s = r + sep;
		element = o.get(k);
		if (isType(element, ["Undefined", "Null"])) {
			next = "";
		} else {
			next = toString(element).value;
		}
		r = s + next;
		k++;
	}
	
	// Step 11
	return new StringType(r);
};

/**
 * pop() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.6
 */
function ArrayProtoPopFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(ArrayProtoPopFunc, FunctionTypeBase);
ArrayProtoPopFunc.prototype.call = function call(thisVal, args) {
	
	// Steps 1-3
	var o = toObject(thisVal),
		len = toUint32(o.get("length")).value,
		indx,
		element;
	
	// Steps 4 and 5
	if (len === 0) {
		o.put("length", new NumberType(0), true);
		return new UndefinedType();
	} else {
		indx = len - 1;
		element = o.get(indx);
		o["delete"](indx, true);
		o.put("length", new NumberType(indx), true);
		return element;
	}
};

/**
 * push() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.7
 */
function ArrayProtoPushFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(ArrayProtoPushFunc, FunctionTypeBase);
ArrayProtoPushFunc.prototype.call = function call(thisVal, args) {
	
	// Steps 1-4
	var o = toObject(thisVal),
		n = toUint32(o.get("length")).value,
		items = args,
		lengthNumber = new NumberType();
	
	// Step 5
	while (items.length) {
		o.put(n++, items.shift(), true);
	}
	
	// Step 6
	lengthNumber.value = n;
	o.put("length", lengthNumber, true);
	
	// Step 7
	return lengthNumber;
};

/**
 * reverse() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.8
 */
function ArrayProtoReverseFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(ArrayProtoReverseFunc, FunctionTypeBase);
ArrayProtoReverseFunc.prototype.call = function call(thisVal, args) {
	
	// Steps 1-5
	var o = toObject(thisVal),
		len = toUint32(o.get("length")).value,
		upper,
		middle = Math.floor(len / 2),
		lower = 0,
		upperValue,
		lowerValue,
		lowerExists,
		upperExists;
	
	// Step 6
	while (lower !== middle) {
		upper = len - lower - 1;
		
		lowerValue = o.get(lower);
		upperValue = o.get(upper);
		
		lowerExists = o.hasProperty(lower);
		upperExists = o.hasProperty(upper);
		
		if (lowerExists && upperExists) {
			o.put(lower, upperValue, true);
			o.put(upper, lowerValue, true);
		} else if (upperExists) {
			o.put(lower, upperValue, true);
			o["delete"](upper, true);
		} else if (lowerExists) {
			o["delete"](o, lower);
			o.put(upper, lowerValue, true);
		}
		
		lower++;
	}
	
	// Step 7
	return o;
};

/**
 * shift() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.9
 */
function ArrayProtoShiftFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(ArrayProtoShiftFunc, FunctionTypeBase);
ArrayProtoShiftFunc.prototype.call = function call(thisVal, args) {
	
	// Steps 1-3
	var o = toObject(thisVal),
		len = toUint32(o.get("length")).value,
		first,
		k = 1,
		from,
		to;
	
	// Step 4
	if (len === 0) {
		o.put("length", new NumberType(0), true);
		return new UndefinedType();
	}
	
	// Step 5
	first = o.get(0);
	
	// Step 7
	while (k < len) {
		from = k;
		to = k - 1;
		
		if (o.hasProperty(from)) {
			o.put(to, o.get(from), true);
		} else {
			o["delete"](to, true);
		}
		k++;
	}
	
	// Step 8
	o["delete"](len - 1, true);
	
	// Step 9
	o.put("length", new NumberType(len - 1), true);
	
	// Step 10
	return first;
};

/**
 * slice() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.10
 */
function ArrayProtoSliceFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(2), false, true);
}
util.inherits(ArrayProtoSliceFunc, FunctionTypeBase);
ArrayProtoSliceFunc.prototype.call = function call(thisVal, args) {
	
	// Steps 1-9
	var start = args[0],
		end = args[1],
		o = toObject(thisVal),
		a = new ArrayType(),
		len = toUint32(o.get("length")).value,
		relativeStart = toInteger(start).value,
		k = relativeStart < 0 ? Math.max(len + relativeStart, 0) : Math.min(relativeStart, len),
		relativeEnd = !end || type(end) === "Undefined" ? len : toInteger(end).value,
		finalVal = relativeEnd < 0 ? Math.max(len + relativeEnd, 0) : Math.min(relativeEnd, len),
		n = 0;
		
	// Step 10
	while (k < finalVal) {
		if (o.hasProperty(k)) {
			a.defineOwnProperty(n, {
				value: o.get(k),
				writable: true,
				enumerable: true,
				configurable: true
			}, false);
		}
		k++;
		n++;
	}
	
	// Step 11
	return a;
};

/**
 * sort() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.11
 */
function ArrayProtoSortFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(ArrayProtoSortFunc, FunctionTypeBase);
ArrayProtoSortFunc.prototype.call = function call(thisVal, args) {
	
	var compareFn = args[0],
		o = toObject(thisVal),
		len = toUint32(o.get("length")).value,
		i,
		changes = true;
	
	function swapValues(j, k) {
		var jValue,
			kValue;
		
		// Pull the values out of the array, if they exist
		if (o.hasProperty(j)) {
			jValue = o.get(j);
			o["delete"](j, true);
		}
		if (o.hasProperty(k)) {
			kValue = o.get(k);
			o["delete"](k, true);
		}
		
		// Put the values back into the array in their swapped positions
		if (jValue) {
			o.put(k, jValue, true);
		}
		if (kValue) {
			o.put(j, kValue, true);
		}
	}
	
	// SortCompare algorithm
	function sortCompare(j, k) {
		
		// Steps 3 and 4
		var hasj = o.hasProperty(j),
			hask = o.hasProperty(k),
			x,
			y,
			xType,
			yType,
			xVal,
			yVal;
		
		// Steps 5-7
		if (!hasj && !hask) {
			return 0;
		}
		if (!hasj) {
			return 1;
		}
		if (!hask) {
			return -1;
		}
		
		// Steps 8 and 9
		x = o.get(j);
		y = o.get(k);
		xType = type(x);
		yType = type(y);
		
		// Steps 10-12
		if (xType === "Undefined" && yType === "Undefined") {
			return 0;
		}
		if (xType === "Undefined") {
			return 1;
		}
		if (yType === "Undefined") {
			return -1;
		}
		
		// Step 13
		if (compareFn && type(compareFn) !== "Undefined") {
			if (!isCallable(compareFn)) {
				throw new Exceptions.TypeError();
			}
			return compareFn(new UndefinedType(), [x, y]).value;
		}
		
		// Note: the spec says to always convert to a string and compare, but string comparisons don't work the same as
		// number comparisons in JavaScript, so we have to handle numbers specially (i.e. 1 < 10 !== "1" < "10")
		if (xType !== "Number" || yType !== "Number") {
		
			// Steps 14 and 15
			x = toString(x);
			y = toString(y);
		}
		xVal = x.value;
		yVal = y.value;
		
		// Steps 16-18
		if (xVal < yVal) {
			return -1;
		}
		if (xVal > yVal) {
			return 1;
		}
		return 0;
	}
	
	// In-place quicksort algorithm
	function sort(leftIndex, rightIndex) {
		var storeIndex = leftIndex,
			pivotIndex = Math.floor((rightIndex - leftIndex) / 2) + leftIndex,
			i;
		
		if (leftIndex < rightIndex) {
			
			// Swap the pivot and right values
			swapValues(pivotIndex, rightIndex);
		
			// Sort the array into the two pivot arrays
			for (i = leftIndex; i < rightIndex; i++) {
				
				// Compare i and the store index, and swap if necessary
				if (sortCompare(i, rightIndex) < 0) {
					swapValues(i, storeIndex);
					storeIndex++;
				}
			}
		
			// Swap the pivot back into place and return its index
			swapValues(storeIndex, rightIndex);
			
			// Sort the left and right sides of the pivot
			sort(leftIndex, storeIndex - 1);
			sort(storeIndex + 1, rightIndex);
		}
	}
	
	// Sort the array
	sort(0, len - 1);
	
	// Return the sorted object
	return o;
};

/**
 * splice() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.12
 */
function ArrayProtoSpliceFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(2), false, true);
}
util.inherits(ArrayProtoSpliceFunc, FunctionTypeBase);
ArrayProtoSpliceFunc.prototype.call = function call(thisVal, args) {
	
	// Steps 1-8
	var start = args[0],
		deleteCount = args[1],
		o = toObject(thisVal),
		a = new ArrayType(),
		len = toUint32(o.get("length")).value,
		relativeStart = toUint32(start).value,
		actualStart = relativeStart < 0 ? Math.max(len + relativeStart, 0) : Math.min(relativeStart, len),
		actualDeleteCount = Math.min(Math.max(toInteger(deleteCount).value, 0), len - actualStart),
		k = 0,
		from,
		to,
		items,
		itemCount;
	
	// Step 9
	while (k < actualDeleteCount) {
		from = actualStart + k;
		if (o.hasProperty(from)) {
			a.defineOwnProperty(k, {
				value: o.get(from),
				writable: true,
				enumerable: true,
				configurable: true
			}, false);
		}
		k++;
	}
	
	// Steps 10 and 11
	items = args.slice(2);
	itemCount = items.length;
	
	// Steps 12 and 13
	if (itemCount < actualDeleteCount) {
		k = actualStart;
		while (k < len - actualDeleteCount) {
			from = k + actualDeleteCount;
			to = k + itemCount;
			
			if (o.hasProperty(from)) {
				o.put(to, o.get(from), true);
			} else {
				o["delete"](to, true);
			}
			k++;
		}
		k = len;
		while (k > len - actualDeleteCount + itemCount) {
			o["delete"](k - 1, true);
			k--;
		}
	} else if (itemCount > actualDeleteCount) {
		k = len - actualDeleteCount;
		while (k > actualStart) {
			from = k + actualDeleteCount - 1;
			to = k + itemCount - 1;
			
			if (o.hasProperty(from)) {
				o.put(to, o.get(from), true);
			} else {
				o["delete"](to, true);
			}
			
			k--;
		}
	}
	
	// Step 14
	k = actualStart;
	
	// Step 15
	while (items.length) {
		o.put(k, items.shift(), true);
		k++;
	}
	
	// Step 16
	o.put("length", new NumberType(len - actualDeleteCount + itemCount), true);
	
	// Step 17
	return a;
};

/**
 * unshift() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.13
 */
function ArrayProtoUnshiftFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(ArrayProtoUnshiftFunc, FunctionTypeBase);
ArrayProtoUnshiftFunc.prototype.call = function call(thisVal, args) {
	
	// Steps 1-5
	var o = toObject(thisVal),
		len = toUint32(o.get("length")).value,
		argCount = args.length,
		k = len,
		from,
		to,
		j,
		items;
		
	// Step 6
	while (k > 0) {
		from = k - 1;
		to = k + argCount - 1;
		
		if (o.hasProperty(from)) {
			o.put(to, o.get(from), true);
		} else {
			o["delete"](to, true);
		}
		
		k--;
	}
	
	// Step 7 and 8
	j = 0;
	items = args;
	
	// Step 9
	while (items.length) {
		o.put(j++, items.shift(), true);
	}
	
	// Step 10
	o.put("length", len + argCount, true);
	
	// Step 11
	return new NumberType(len + argCount);
};

/**
 * indexOf() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.14
 */
function ArrayProtoIndexOfFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(ArrayProtoIndexOfFunc, FunctionTypeBase);
ArrayProtoIndexOfFunc.prototype.call = function call(thisVal, args) {
	
	// Steps 1-3
	var searchElement = args[0],
		fromIndex = args[1],
		o = toObject(thisVal),
		len = toUint32(o.get("length")).value,
		n = 0,
		k,
		elementK;
		
	// Step 4
	if (len === 0) {
		return new NumberType(-1);
	}
	
	// Step 5
	if (fromIndex && type(fromIndex) !== "Undefined") {
		n = toInteger(fromIndex).value;
	}
	
	// Step 6
	if (n >= len) {
		return new NumberType(-1);
	}
	
	// Steps 7 and 8
	k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
	
	// Step 9
	while (k < len) {
		if (o.hasProperty(k)) {
			elementK = o.get(k);
			if (strictEquals(searchElement, elementK)) {
				return new NumberType (k);
			}
		}
		k++;
	}
	
	// Step 10
	return new NumberType(-1);
};

/**
 * indexOf() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.15
 */
function ArrayProtoLastIndexOfFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(ArrayProtoLastIndexOfFunc, FunctionTypeBase);
ArrayProtoLastIndexOfFunc.prototype.call = function call(thisVal, args) {
	
	// Steps 1-3
	var searchElement = args[0],
		fromIndex = args[1],
		o = toObject(thisVal),
		len = toUint32(o.get("length")).value,
		n = len - 1,
		k,
		elementK;
		
	// Step 4
	if (len === 0) {
		return new NumberType(-1);
	}
	
	// Step 5
	if (fromIndex && type(fromIndex) !== "Undefined") {
		n = toInteger(fromIndex).value;
	}
	
	// Steps 6 and 7
	k = n >= 0 ? Math.min(n, len - 1) : len - Math.abs(n);
	
	// Step 8
	while (k >= 0) {
		if (o.hasProperty(k)) {
			elementK = o.get(k);
			if (strictEquals(searchElement, elementK)) {
				return new NumberType (k);
			}
		}
		k--;
	}
	
	// Step 9
	return new NumberType(-1);
};

/**
 * every() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.16
 */
function ArrayProtoEveryFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(ArrayProtoEveryFunc, FunctionTypeBase);
ArrayProtoEveryFunc.prototype.call = function call(thisVal, args) {
	
	// Steps 1-3
	var callbackFn = args[0],
		thisArg = args[1],
		o = toObject(thisVal),
		len = toUint32(o.get("length")).value,
		t,
		k = 0;
	
	// Step 4
	if (!isCallable(callbackFn)) {
		throw new Exceptions.TypeError();
	}
	
	// Step 5
	t = callbackFn && type(callbackFn) === "Undefined" ? callbackFn : new UndefinedType();
	
	// Step 7
	while (k < len) {
		if (o.hasProperty(k) && !toBoolean(callbackFn.call(t, [o.get(k), new NumberType(k), o])).value) {
			return new BooleanType(false);
		}
		k++;
	}
	
	// Step 8
	return new BooleanType(true);
};

/**
 * some() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.17
 */
function ArrayProtoSomeFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(ArrayProtoSomeFunc, FunctionTypeBase);
ArrayProtoSomeFunc.prototype.call = function call(thisVal, args) {
	
	// Steps 1-3
	var callbackFn = args[0],
		thisArg = args[1],
		o = toObject(thisVal),
		len = toUint32(o.get("length")).value,
		t,
		k = 0;
	
	// Step 4
	if (!isCallable(callbackFn)) {
		throw new Exceptions.TypeError();
	}
	
	// Step 5
	t = callbackFn && type(callbackFn) === "Undefined" ? callbackFn : new UndefinedType();
	
	// Step 7
	while (k < len) {
		if (o.hasProperty(k) && toBoolean(callbackFn.call(t, [o.get(k), new NumberType(k), o])).value) {
			return new BooleanType(true);
		}
		k++;
	}
	
	// Step 8
	return new BooleanType(false);
};

/**
 * forEach() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.18
 */
function ArrayProtoForEachFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(ArrayProtoForEachFunc, FunctionTypeBase);
ArrayProtoForEachFunc.prototype.call = function call(thisVal, args) {
	
	// Steps 1-3
	var callbackFn = args[0],
		thisArg = args[1],
		o = toObject(thisVal),
		len = toUint32(o.get("length")).value,
		t,
		k = 0;
	
	// Step 4
	if (!isCallable(callbackFn)) {
		throw new Exceptions.TypeError();
	}
	
	// Step 5
	t = callbackFn && type(callbackFn) === "Undefined" ? callbackFn : new UndefinedType();
	
	// Step 7
	while  (k < len) {
		if (o.hasProperty(k)) {
			callbackFn.call(t, [o.get(k), new NumberType(k), o]);
		}
		k++;
	}
	
	// Step 8
	return new UndefinedType();
};

/**
 * map() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.19
 */
function ArrayProtoMapFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(ArrayProtoMapFunc, FunctionTypeBase);
ArrayProtoMapFunc.prototype.call = function call(thisVal, args) {
	
	// Steps 1-3
	var callbackFn = args[0],
		thisArg = args[1],
		o = toObject(thisVal),
		len = toUint32(o.get("length")).value,
		t,
		a,
		k = 0;
	
	// Step 4
	if (!isCallable(callbackFn)) {
		throw new Exceptions.TypeError();
	}
	
	// Step 5
	t = callbackFn && type(callbackFn) === "Undefined" ? callbackFn : new UndefinedType();
	
	// Step 6
	a = new ArrayType();
	a.put("length", new NumberType(len), true);
	
	// Step 8
	while (k < len) {
		if (o.hasProperty(k)) {
			a.defineOwnProperty(k, {
				value: callbackFn.call(t, [o.get(k), new NumberType(k), o]),
				writable: true,
				enumerable: true,
				configurable: true
			}, false);
		}
		k++;
	}
	
	// Step 9
	return a;
};

/**
 * filter() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.20
 */
function ArrayProtoFilterFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(ArrayProtoFilterFunc, FunctionTypeBase);
ArrayProtoFilterFunc.prototype.call = function call(thisVal, args) {
	
	// Steps 1-3
	var callbackFn = args[0],
		thisArg = args[1],
		o = toObject(thisVal),
		len = toUint32(o.get("length")).value,
		t,
		a,
		k = 0,
		to = 0,
		kValue;
	
	// Step 4
	if (!isCallable(callbackFn)) {
		throw new Exceptions.TypeError();
	}
	
	// Step 5
	t = callbackFn && type(callbackFn) === "Undefined" ? callbackFn : new UndefinedType();
	
	// Step 6
	a = new ArrayType();
	a.put("length", new NumberType(len), true);
	
	// Step 9
	while (k < len) {
		if (o.hasProperty(k)) {
			kValue = o.get(k);
			if (toBoolean(callbackFn.call(t, [kValue, new NumberType(k), o])).value) {
				a.defineOwnProperty(to, {
					value: kValue,
					writable: true,
					enumerable: true,
					configurable: true
				}, false);
				to++;
			}
		}
		k++;
	}
	
	// Step 10
	return a;
};

/**
 * reduce() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.21
 */
function ArrayProtoReduceFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(ArrayProtoReduceFunc, FunctionTypeBase);
ArrayProtoReduceFunc.prototype.call = function call(thisVal, args) {
	
	// Steps 1-3
	var callbackFn = args[0],
		initialValue = args[1],
		o = toObject(thisVal),
		len = toUint32(o.get("length")).value,
		t,
		a,
		k = 0,
		to = 0,
		kValue,
		accumulator,
		kPresent,
		undef = new UndefinedType();
	
	// Step 4
	if (!isCallable(callbackFn)) {
		throw new Exceptions.TypeError();
	}
	
	// Step 5
	if (len === 0 && !initialValue) {
		throw new Exceptions.TypeError();
	}
	
	// Steps 7 and 8
	if (initialValue) {
		accumulator = initialValue;
	} else {
		kPresent = false;
		while (!kPresent && k < len) {
			kPresent = o.hasProperty(k);
			if (kPresent) {
				accumulator = o.get(k);
			}
			k++;
		}
		if (!kPresent) {
			throw new Exceptions.TypeError();
		}
	}
	
	// Step 9
	while (k < len) {
		if (o.hasProperty(k)) {
			accumulator = callbackFn.call(undef, [accumulator, o.get(k), new NumberType(k), o]);
		}
		k++;
	}
	
	// Step 10
	return accumulator;
};

/**
 * reduceRight() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.22
 */
function ArrayReduceRightFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(ArrayReduceRightFunc, FunctionTypeBase);
ArrayReduceRightFunc.prototype.call = function call(thisVal, args) {
	
	// Steps 1-3
	var callbackFn = args[0],
		initialValue = args[1],
		o = toObject(thisVal),
		len = toUint32(o.get("length")).value,
		t,
		a,
		k = len - 1,
		to = 0,
		kValue,
		accumulator,
		kPresent,
		undef = new UndefinedType();
	
	// Step 4
	if (!isCallable(callbackFn)) {
		throw new Exceptions.TypeError();
	}
	
	// Step 5
	if (len === 0 && !initialValue) {
		throw new Exceptions.TypeError();
	}
	
	// Steps 7 and 8
	if (initialValue) {
		accumulator = initialValue;
	} else {
		kPresent = false;
		while (!kPresent && k >= 0) {
			kPresent = o.hasProperty(k);
			if (kPresent) {
				accumulator = o.get(k);
			}
			k--;
		}
		if (!kPresent) {
			throw new Exceptions.TypeError();
		}
	}
	
	// Step 9
	while (k >= 0) {
		if (o.hasProperty(k)) {
			accumulator = callbackFn.call(undef, [accumulator, o.get(k), new NumberType(k), o]);
		}
		k--;
	}
	
	// Step 10
	return accumulator;
};

/**
 * @classdesc The prototype for Arrays
 * 
 * @constructor
 * @see ECMA-262 Spec Chapter 15.4.4
 */
exports.ArrayPrototypeType = ArrayPrototypeType;
function ArrayPrototypeType(className) {
	ObjectType.call(this, className);
	
	this.put("toString", new ArrayProtoToStringFunc(), false, true);
	this.put("toLocaleString", new ArrayProtoToLocaleStringFunc(), false, true);
	this.put("concat", new ArrayProtoConcatFunc(), false, true);
	this.put("join", new ArrayProtoJoinFunc(), false, true);
	this.put("pop", new ArrayProtoPopFunc(), false, true);
	this.put("push", new ArrayProtoPushFunc(), false, true);
	this.put("reverse", new ArrayProtoReverseFunc(), false, true);
	this.put("shift", new ArrayProtoShiftFunc(), false, true);
	this.put("slice", new ArrayProtoSliceFunc(), false, true);
	this.put("sort", new ArrayProtoSortFunc(), false, true);
	this.put("splice", new ArrayProtoSpliceFunc(), false, true);
	this.put("unshift", new ArrayProtoUnshiftFunc(), false, true);
	this.put("indexOf", new ArrayProtoIndexOfFunc(), false, true);
	this.put("lastIndexOf", new ArrayProtoLastIndexOfFunc(), false, true);
	this.put("every", new ArrayProtoEveryFunc(), false, true);
	this.put("some", new ArrayProtoSomeFunc(), false, true);
	this.put("forEach", new ArrayProtoForEachFunc(), false, true);
	this.put("map", new ArrayProtoMapFunc(), false, true);
	this.put("filter", new ArrayProtoFilterFunc(), false, true);
	this.put("reduce", new ArrayProtoReduceFunc(), false, true);
	this.put("reduceRight", new ArrayReduceRightFunc(), false, true);	
}
util.inherits(ArrayPrototypeType, ObjectType);

// ******** String Prototype Type Class ********

/**
 * toString() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.2
 */
function StringProtoToStringFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(StringProtoToStringFunc, FunctionTypeBase);
StringProtoToStringFunc.prototype.call = function call(thisVal, args) {
	if (thisVal.className !== "String") {
		throw new Exceptions.TypeError();
	}
	return new StringType(this.value);
};

/**
 * valueOf() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.3
 */
function StringProtoValueOfFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(StringProtoValueOfFunc, FunctionTypeBase);
StringProtoValueOfFunc.prototype.call = function call(thisVal, args) {
	if (thisVal.className !== "String") {
		throw new Exceptions.TypeError();
	}
	return new StringType(this.value);
};

/**
 * charAt() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.4
 */
function StringProtoCharAtFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(StringProtoCharAtFunc, FunctionTypeBase);
StringProtoCharAtFunc.prototype.call = function call(thisVal, args) {
	
	var pos = args[0],
		s,
		position;
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal);
	
	// Step 3
	position = toInteger(pos);
	
	// Steps 4-6
	return new StringType(s.value.charAt(position.value));
};

/**
 * charCodeAt() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.5
 */
function StringProtoCharCodeAtFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(StringProtoCharCodeAtFunc, FunctionTypeBase);
StringProtoCharCodeAtFunc.prototype.call = function call(thisVal, args) {
	
	var pos = args[0],
		s,
		position;
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal);
	
	// Step 3
	position = toInteger(pos);
	
	// Steps 4-6
	return new StringType(s.value.charCodeAt(position.value));
};

/**
 * concat() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.6
 */
function StringProtoConcatFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(StringProtoConcatFunc, FunctionTypeBase);
StringProtoConcatFunc.prototype.call = function call(thisVal, args) {
	
	var s,
		position,
		r,
		i = 0,
		len = args.length;
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Step 3 (deep copy args and convert to values)
	args = [].concat(args);
	for(; i < len; i++) {
		args[i] = toString(args[i]).value;
	}
	
	// Steps 4-6
	return new StringType(s.concat.apply(s, args));
};

/**
 * indexOf() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.7
 */
function StringProtoIndexOfFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(StringProtoIndexOfFunc, FunctionTypeBase);
StringProtoIndexOfFunc.prototype.call = function call(thisVal, args) {
	
	var searchString = args[0],
		position = args[2],
		s,
		searchStr,
		pos;
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Step 3
	searchStr = toString(searchString).value;
	
	// Step 4
	pos = isDefined(position) ? toInteger(position).value : 0;
	
	// Steps 5-8
	return new NumberType(s.indexOf(searchStr, pos));
};

/**
 * lastIndexOf() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.8
 */
function StringProtoLastIndexOfFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(StringProtoLastIndexOfFunc, FunctionTypeBase);
StringProtoLastIndexOfFunc.prototype.call = function call(thisVal, args) {
	
	var searchString = args[0],
		position = args[2],
		s,
		searchStr,
		pos;
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Step 3
	searchStr = toString(searchString).value;
	
	// Step 4
	pos = isDefined(position) ? toNumber(position).value : undefined;
	
	// Steps 5-8
	return new NumberType(s.lastIndexOf(searchStr, pos));
	
};

/**
 * localeCompare() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.9
 */
function StringProtoLocaleCompareFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(StringProtoLocaleCompareFunc, FunctionTypeBase);
StringProtoLocaleCompareFunc.prototype.call = function call(thisVal, args) {
	
	var that = args[0],
		s;
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Step 3
	that = toString(that).value;
	
	return new NumberType(s.localeCompare(that));
};

/**
 * match() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.10
 */
function StringProtoMatchFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(StringProtoMatchFunc, FunctionTypeBase);
StringProtoMatchFunc.prototype.call = function call(thisVal, args) {
	
	var regexp = args[0],
		s,
		rx,
		result,
		a = new ArrayType();
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Steps 3 and 4
	if (regexp && regexp.className === "RegExp") {
		rx = regexp;
	} else {
		if (!regexp || type(regexp) === "Undefined") {
			rx = new RegExpType("", "");
		} else {
			rx = new RegExpType(toString(regexp).value, "");
		}
	}
	
	// Update the regexp object
	rx._refreshRegExpFromProperties();
	
	// Use the built-in match method to perform the match
	result = s.match(rx.value);
	
	// Update the regexp object
	rx._refreshPropertiesFromRegExp();
	
	// Check for no match
	if (result === null) {
		return new NullType();
	}
	
	// Create the results array
	a.put("index", new NumberType(result.index), false);
	a.put("input", rx, false);
	for (i = 0, len = result.length; i < len; i++) {
		a.put(i, new StringType(result[i]), false);
	}
	return a;
};

/**
 * replace() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.11
 */
function StringProtoReplaceFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(2), false, true);
}
util.inherits(StringProtoReplaceFunc, FunctionTypeBase);
StringProtoReplaceFunc.prototype.call = function call(thisVal, args) {
	var searchValue = args[0],
		replaceValue = args[1],
		s,
		result;
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Get the native searchValue
	if (searchValue.className !== "RegExp") {
		searchValue = toString(searchValue);
	} else {
		searchValue._refreshRegExpFromProperties();
	}
	searchValue = searchValue.value;
	
	// Run the built-in replace method
	if (isCallable(replaceValue)) {
		result = new StringType(s.replace(searchValue, function () {
			var args = [
					new StringType(arguments[0]), // match
				],
				i = 1,
				len = arguments.length - 2;
			
			// Push the matches into the arguments
			for(; i < len; i++) {
				args.push(new StringType(arguments[i]));
			}

			// Push the offset and the string into the arguments
			args.push(new NumberType(arguments[arguments.length - 2])); 
			args.push(new StringType(arguments[arguments.length - 1]));
			
			// Call the callback method
			return toString(replaceValue.call(new UndefinedType(), args)).value;
		}));
	} else {
		result = new StringType(s.replace(searchValue, toString(replaceValue).value));
	}

	// Update the regexp object
	if (searchValue.className === "RegExp") {
		rx._refreshPropertiesFromRegExp();
	}
	
	return result;
};

/**
 * search() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.12
 */
function StringProtoSearchFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(StringProtoSearchFunc, FunctionTypeBase);
StringProtoSearchFunc.prototype.call = function call(thisVal, args) {
	
	var regexp = args[0],
		string,
		rx,
		result;
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	string = toString(thisVal).value;
	
	// Steps 3 and 4
	if (regexp && regexp.className === "RegExp") {
		rx = regexp;
	} else {
		if (!regexp || type(regexp) === "Undefined") {
			rx = new RegExpType("", "");
		} else {
			rx = new RegExpType(toString(regexp).value, "");
		}
	}
	
	// Update the regexp object
	rx._refreshRegExpFromProperties();
	
	// Use the built-in method to perform the match
	result = string.search(rx.value);
	
	// Update the regexp object
	rx._refreshPropertiesFromRegExp();
	
	return new NumberType(result);
};

/**
 * slice() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.13
 */
function StringProtoSliceFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(2), false, true);
}
util.inherits(StringProtoSliceFunc, FunctionTypeBase);
StringProtoSliceFunc.prototype.call = function call(thisVal, args) {
	
	var start = args[0],
		end = args[1],
		s;
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Step 4
	start = toInteger(start).value;
	
	// Step 5
	end = isDefined(end) ? toInteger(end).value : s.length;
	
	// Use the built-in method to perform the slice
	return new StringType(s.slice(start, end));
};

/**
 * split() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.14
 */
function StringProtoSplitFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(2), false, true);
}
util.inherits(StringProtoSplitFunc, FunctionTypeBase);
StringProtoSplitFunc.prototype.call = function call(thisVal, args) {
	
	var separator = args[0],
		limit = args[1],
		s,
		result,
		a = new ArrayType(),
		i,
		len;
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Convert the separator into a form the native method can use
	if (!separator || type(separator) === "Undefined") {
		separator = undefined;
	} else if (separator.className === "RegExp"){
		separator = separator.value;
	} else {
		separator = toString(separator).value;
	}
	
	// Convert the limit into a form the native method can use
	if (!limit || type(limit) === "Undefined") {
		limit = undefined;
	} else {
		limit = toUint32(limit).value;
	}
	
	// Call the split method
	result = s.split(separator, limit);
	
	// Convert the results and return them
	for (i = 0, len = result.length; i < len; i++) {
		a.put(i, new StringType(result[i]), false);
	}
	return a;
};

/**
 * substring() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.15
 */
function StringProtoSubstringFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(2), false, true);
}
util.inherits(StringProtoSubstringFunc, FunctionTypeBase);
StringProtoSubstringFunc.prototype.call = function call(thisVal, args) {
	
	var start = args[0],
		end = args[1],
		s;
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Step 4
	start = toInteger(start).value;
	
	// Step 5
	end = isDefined(end) ? toInteger(end).value : s.length;
	
	// Use the built-in method to perform the substring
	return new StringType(s.substring(start, end));
};

/**
 * toLowerCase() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.16
 */
function StringProtoToLowerCaseFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(StringProtoToLowerCaseFunc, FunctionTypeBase);
StringProtoToLowerCaseFunc.prototype.call = function call(thisVal, args) {
	
	var s;
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Use the built-in method to perform the toLowerCase
	return new StringType(s.toLowerCase());
	
};

/**
 * toLocaleLowerCase() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.17
 */
function StringProtoToLocaleLowerCaseFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(StringProtoToLocaleLowerCaseFunc, FunctionTypeBase);
StringProtoToLocaleLowerCaseFunc.prototype.call = function call(thisVal, args) {
	
	var s;
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Use the built-in method to perform the toLowerCase
	return new StringType(s.toLocaleLowerCase());
};

/**
 * toUpperCase() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.18
 */
function StringProtoToUpperCaseFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(StringProtoToUpperCaseFunc, FunctionTypeBase);
StringProtoToUpperCaseFunc.prototype.call = function call(thisVal, args) {
	
	var s;
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Use the built-in method to perform the toLowerCase
	return new StringType(s.toUpperCase());
};

/**
 * toLocaleUpperCase() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.19
 */
function StringProtoToLocaleUpperCaseFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(StringProtoToLocaleUpperCaseFunc, FunctionTypeBase);
StringProtoToLocaleUpperCaseFunc.prototype.call = function call(thisVal, args) {
	
	var s;
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Use the built-in method to perform the toLowerCase
	return new StringType(s.toLocaleUpperCase());
};

/**
 * trim() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.20
 */
function StringProtoTrimFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(StringProtoTrimFunc, FunctionTypeBase);
StringProtoTrimFunc.prototype.call = function call(thisVal, args) {
	
	var s;
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Use the built-in method to perform the toLowerCase
	return new StringType(s.trim());
};

/**
 * @classdesc The prototype for Strings
 * 
 * @constructor
 * @see ECMA-262 Spec Chapter 15.5.4
 */
exports.StringPrototypeType = StringPrototypeType;
function StringPrototypeType(className) {
	ObjectType.call(this, className);
	
	this.put("toString", new StringProtoToStringFunc(), false, true);
	this.put("valueOf", new StringProtoValueOfFunc(), false, true);
	this.put("charAt", new StringProtoCharAtFunc(), false, true);
	this.put("charCodeAt", new StringProtoCharCodeAtFunc(), false, true);
	this.put("concat", new StringProtoConcatFunc(), false, true);
	this.put("indexOf", new StringProtoIndexOfFunc(), false, true);
	this.put("lastIndexOf", new StringProtoLastIndexOfFunc(), false, true);
	this.put("localeCompare", new StringProtoLocaleCompareFunc(), false, true);
	this.put("match", new StringProtoMatchFunc(), false, true);
	this.put("replace", new StringProtoReplaceFunc(), false, true);
	this.put("search", new StringProtoSearchFunc(), false, true);
	this.put("slice", new StringProtoSliceFunc(), false, true);
	this.put("split", new StringProtoSplitFunc(), false, true);
	this.put("substring", new StringProtoSubstringFunc(), false, true);
	this.put("toLowerCase", new StringProtoToLowerCaseFunc(), false, true);
	this.put("toLocaleLowerCase", new StringProtoToLocaleLowerCaseFunc(), false, true);
	this.put("toUpperCase", new StringProtoToUpperCaseFunc(), false, true);
	this.put("toLocaleUpperCase", new StringProtoToLocaleUpperCaseFunc(), false, true);
	this.put("trim", new StringProtoTrimFunc(), false, true);	
}
util.inherits(StringPrototypeType, ObjectType);

// ******** Boolean Prototype Type Class ********

/**
 * toString() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.6.4.2
 */
function BooleanProtoToStringFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(BooleanProtoToStringFunc, FunctionTypeBase);
BooleanProtoToStringFunc.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

/**
 * valueOf() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.6.4.2
 */
function BooleanProtoValueOfFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(BooleanProtoValueOfFunc, FunctionTypeBase);
BooleanProtoValueOfFunc.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

/**
 * @classdesc The prototype for Booleans
 * 
 * @constructor
 * @see ECMA-262 Spec Chapter 15.6.4
 */
exports.BooleanPrototypeType = BooleanPrototypeType;
function BooleanPrototypeType(className) {
	ObjectType.call(this, className);
	
	this.put("toString", new BooleanProtoToStringFunc(), false, true);
	this.put("valueOf", new BooleanProtoValueOfFunc(), false, true);
}
util.inherits(BooleanPrototypeType, ObjectType);

// ******** Number Prototype Type Class ********

/**
 * toString() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.6.4.2
 */
function NumberProtoToStringFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(NumberProtoToStringFunc, FunctionTypeBase);
NumberProtoToStringFunc.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

/**
 * toLocaleString() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.6.4.2
 */
function NumberProtoToLocaleStringFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(NumberProtoToLocaleStringFunc, FunctionTypeBase);
NumberProtoToLocaleStringFunc.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

/**
 * valueOf() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.6.4.2
 */
function NumberProtoValueOfFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(NumberProtoValueOfFunc, FunctionTypeBase);
NumberProtoValueOfFunc.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

/**
 * toFixed() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.6.4.2
 */
function NumberProtoToFixedFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(NumberProtoToFixedFunc, FunctionTypeBase);
NumberProtoToFixedFunc.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

/**
 * toExponential() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.6.4.2
 */
function NumberProtoToExponentialFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(NumberProtoToExponentialFunc, FunctionTypeBase);
NumberProtoToExponentialFunc.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

/**
 * toPrecision() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.6.4.2
 */
function NumberProtoToPrecisionFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(NumberProtoToPrecisionFunc, FunctionTypeBase);
NumberProtoToPrecisionFunc.prototype.call = function call(thisVal, args) {
	// TODO:
	throw new Error("IMPLEMENT ME");
};

/**
 * @classdesc The prototype for Booleans
 * 
 * @constructor
 * @see ECMA-262 Spec Chapter 15.6.4
 */
exports.NumberPrototypeType = NumberPrototypeType;
function NumberPrototypeType(className) {
	ObjectType.call(this, className);
	
	this.put("toString", new NumberProtoToStringFunc(), false, true);
	this.put("toLocaleString", new NumberProtoToLocaleStringFunc(), false, true);
	this.put("valueOf", new NumberProtoValueOfFunc(), false, true);
	this.put("toFixed", new NumberProtoToFixedFunc(), false, true);
	this.put("toExponential", new NumberProtoToExponentialFunc(), false, true);
	this.put("toPrecision", new NumberProtoToPrecisionFunc(), false, true);
}
util.inherits(NumberPrototypeType, ObjectType);

// ******** RegExp Prototype Type Class ********

/**
 * exec() prototype method. Note: here we wrap node's native exec method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.10.6.2 and https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/RegExp/exec
 */
function RegExpProtoExecFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(RegExpProtoExecFunc, FunctionTypeBase);
RegExpProtoExecFunc.prototype.call = function call(thisVal, args) {
	
	var r = thisVal,
		rValue = r.value,
		s = toString(args[0]),
		result,
		a = new ArrayType,
		i,
		len;
	
	// Update lastIndex since it's writeable
	rValue.lastIndex = r.get("lastIndex").value;
	
	// Update the regexp object
	r._refreshRegExpFromProperties();
	
	// Perform the exec
	result = r.value.exec(s.value);
	
	// Update the regexp object
	r._refreshPropertiesFromRegExp();
	
	// Check for no match
	if (result === null) {
		return new NullType();
	}
	
	// Create the results array
	a.put("index", new NumberType(result.index), false);
	a.put("input", s, false);
	for (i = 0, len = result.length; i < len; i++) {
		a.put(i, new StringType(result[i]), false);
	}
	return a;
};

/**
 * test() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.10.6.3
 */
function RegExpProtoTestFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(RegExpProtoTestFunc, FunctionTypeBase);
RegExpProtoTestFunc.prototype.call = function call(thisVal, args) {
	var result = RegExpProtoExecFunc.prototype.call(thisVal, args);
	return toBoolean(result);
};

/**
 * toString() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.10.6.4
 */
function RegExpProtoToStringFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(RegExpProtoToStringFunc, FunctionTypeBase);
RegExpProtoToStringFunc.prototype.call = function call(thisVal, args) {
	return new StringType(thisVal.value.toString());
};

/**
 * @classdesc The prototype for RegExps
 * 
 * @constructor
 * @see ECMA-262 Spec Chapter 15.10.6
 */
exports.RegExpPrototypeType = RegExpPrototypeType;
function RegExpPrototypeType(className) {
	ObjectType.call(this, className);
	
	this.put("exec", new RegExpProtoExecFunc(), false, true);
	this.put("test", new RegExpProtoTestFunc(), false, true);
	this.put("toString", new RegExpProtoToStringFunc(), false, true);
}
util.inherits(RegExpPrototypeType, ObjectType);