/*global
UndefinedType,
type,
isCallable,
throwNativeException,
isObject,
isType,
toObject,
BaseType,
prototypes,
util,
UnknownType,
handleRecoverableNativeException,
isPrimitive,
sameValue,
isAmbiguousBlock
*/

/*****************************************
 *
 * Object Type Class
 *
 *****************************************/

// ******** Property Classes ********

/**
 * @classdesc A Data Descriptor represents the interface an object exposes for getting and setting a property via direct
 * assignment.
 *
 * @constructor
 * @name module:Base.DataPropertyDescriptor
 * @property {module:Base.BaseType} value ECMA-262 Spec: <em>The value retrieved by reading the property.</em>
 * @property {boolean} writable ECMA-262 Spec: <em>If false, attempts by ECMAScript code to change the property‘s
 *		[[value]] attribute using [[put]] will not succeed.</em>
 * @property {boolean} get ECMA-262 Spec: <em>If true, the property will be enumerated by a for-in enumeration
 *		(see 12.6.4). Otherwise, the property is said to be non-enumerable.</em>
 * @property {boolean} get ECMA-262 Spec: <em>If false, attempts to delete the property, change the property to be an
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
 * @name module:Base.AccessorPropertyDescriptor
 * @property {module:Base.BaseType} get ECMA-262 Spec: <em>If the value is an Object it must be a function Object.
 *		The function‘s [[call]] internal method (8.6.2) is called with an empty arguments list to return the property
 *		value each time a get access of the property is performed.</em>
 * @property {module:Base.BaseType} set ECMA-262 Spec: <em>If the value is an Object it must be a function Object. The
 *		function‘s [[call]] internal method (8.6.2) is called with an arguments list containing the assigned value as
 *		its sole argument each time a set access of the property is performed. The effect of a property's [[set]]
 *		internal method may, but is not required to, have an effect on the value returned by subsequent calls to the
 *		property's [[get]] internal method.</em>
 * @property {boolean} enumerable ECMA-262 Spec: <em>If true, the property is to be enumerated by a for-in enumeration
 *		(see 12.6.4). Otherwise, the property is said to be non-enumerable.</em>
 * @property {boolean} configurable ECMA-262 Spec: <em>If false, attempts to delete the property, change the property to
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
 * @name module:Base.isDataDescriptor
 * @param {(module:Base.DataPropertyDescriptor | module:Base.AccessorPropertyDescriptor | Object)} desc The property descriptor to test
 * @returns {boolean} Whether or not the descriptor is a data descriptor
 * @see ECMA-262 Spec Chapter 8.10.2
 */
exports.isDataDescriptor = isDataDescriptor;
function isDataDescriptor(desc) {
	if (!desc) {
		return false;
	}
	if (typeof desc.value == 'undefined' && typeof desc.writable == 'undefined') {
		return false;
	}
	return true;
}

/**
 * Determines if the supplied property descriptor is an accessor descriptor or not
 *
 * @method
 * @name module:Base.isAccessorDescriptor
 * @param {(module:Base.DataPropertyDescriptor | module:Base.AccessorPropertyDescriptor | Object)} desc The property descriptor to test
 * @returns {boolean} Whether or not the descriptor is an accessor descriptor
 * @see ECMA-262 Spec Chapter 8.10.1
 */
exports.isAccessorDescriptor = isAccessorDescriptor;
function isAccessorDescriptor(desc) {
	if (!desc) {
		return false;
	}
	if (typeof desc.get == 'undefined' && typeof desc.set == 'undefined') {
		return false;
	}
	return true;
}

/**
 * Determines if the supplied property descriptor is a generic descriptor or not
 *
 * @method
 * @name module:Base.isGenericDescriptor
 * @param {(module:Base.DataPropertyDescriptor | module:Base.AccessorPropertyDescriptor | Object)} desc The property descriptor to test
 * @returns {boolean} Whether or not the descriptor is a generic descriptor
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
 * Checks if two descriptions describe the same description.
 *
 * @method
 * @private
 * @param {(module:Base.DataPropertyDescriptor | module:Base.AccessorPropertyDescriptor)} x The first descriptor
 * @param {(module:Base.DataPropertyDescriptor | module:Base.AccessorPropertyDescriptor)} y The second descriptor
 * @returns {boolean} Whether or not the descriptions are the same
 */
exports.sameDesc = sameDesc;
function sameDesc(x, y) {
	if (isDataDescriptor(x) && isDataDescriptor(y)) {
		return x.configurable === y.configurable && x.enumerable === y.enumerable &&
			x.writable === y.writable && sameValue(x.value, y.value);
	} else if (isAccessorDescriptor(x) && isAccessorDescriptor(y)) {
		x.configurable === y.configurable && x.enumerable === y.enumerable &&
			sameValue(x.get, y.get) && sameValue(x.set && y.set);
	} else {
		return false;
	}
}

/**
 * @classdesc An object type. Note: functions are defined as objects, and so are represented by the class.
 *
 * @constructor
 * @name module:Base.ObjectType
 * @extends module:Base.BaseType
 * @param {string} className The name of the class, such as 'String' or 'Object'
 * @param {(module:Base.BaseType | undefined)} value The value to base this object off of
 * @param {boolean} dontCreatePrototype Whether or not to attach the Object prototype to this object
 * @see ECMA-262 Spec Chapters 8.6 and 15.2.2
 */
exports.ObjectType = ObjectType;
function ObjectType(className, value, dontCreatePrototype) {

	var proto;

	// Step 1
	if (value && isObject(value)) {
		return value;
	} else if(value && isType(value, ['String', 'Number', 'Boolean'])) {
		return toObject(value);
	}

	// Initialize the instance (Step 5 implicit)
	BaseType.call(this, className || 'Object');

	// Step 4
	Object.defineProperty(this, 'objectPrototype', {
		get: function () {
			return proto || !dontCreatePrototype && prototypes.Object;
		},
		set: function (value) {
			proto = value;
		},
		configurable: true
	});


	// Step 6
	this.extensible = true;

	this.type = 'Object';

	this._properties = [];
}
util.inherits(ObjectType, BaseType);

/**
 * Indicates that a property was referenced (i.e. read).
 *
 * @name module:Base.ObjectType#propertyReferenced
 * @event
 * @param {string} name The name of the property that was referenced
 * @param {(module:Base.DataPropertyDescriptor | module:Base.AccessorPropertyDescriptor | undefined)} The descriptor
 *		fetched, if it could be found.
 */
/**
 * ECMA-262 Spec: <em>Returns the value of the named property.</em>
 *
 * @method
 * @name module:Base.ObjectType#get
 * @param {string} p The name of the property to fetch
 * @param {boolean} alternate Whether or not to fetch the alternate values, or the base value
 * @returns {module:Base.BaseType} The value of the property, or a new instance of
 *		{@link module:Base.UndefinedType} if the property does not exist
 * @see ECMA-262 Spec Chapter 8.12.3
 */
ObjectType.prototype.get = function get(p, alternate) {
	var desc = this.getProperty(p, alternate),
		result,
		prop;

	function lookup(desc) {
		if (desc) {
			if (isDataDescriptor(desc)) {
				return desc.value;
			} else {
				return (desc.get && desc.get.className !== 'Undefined' && desc.get.callFunction(this)) || new UndefinedType();
			}
		}
	}

	if (alternate) {
		result = {};
		for (prop in desc) {
			result[prop] = lookup(desc[prop]);
		}
	} else {
		result = lookup(desc);
	}

	this.fireEvent('propertyReferenced', 'Property "' + p + '" was referenced', {
		name: p,
		desc: desc
	});

	return result || new UndefinedType();
};

/**
 * ECMA-262 Spec: <em>Returns the Property Descriptor of the named own property of this object, or undefined if absent.</em>
 *
 * @method
 * @name module:Base.ObjectType#getOwnProperty
 * @param {string} p The name of the property descriptor to fetch
 * @param {boolean} alternate Whether or not to fetch the alternate values, or the base value
 * @param {boolean} suppressEvent Not used here, simply used as a placeholder for the implementation in TiApiProvieer
 * @returns {(module:Base.DataPropertyDescriptor | module:Base.AccessorPropertyDescriptor | undefined)} The
 *		objects property, or undefined if the property does not exist
 * @see ECMA-262 Spec Chapter 8.12.1
 */
ObjectType.prototype.getOwnProperty = function getOwnProperty(p, alternate, suppressEvent) {
	var x,
		prop,
		copied;

	function copyDescriptor(desc) {
		var d = {};
		if (isDataDescriptor(desc)) {
			d.value = desc.value;
			d.writable = desc.writable;
		} else {
			d.get = desc.get;
			d.set = desc.set;
		}
		d.enumerable = desc.enumerable;
		d.configurable = desc.configurable;
		return d;
	}

	if (type(this) === 'Unknown') {
		return alternate ? { 1: {
			value: new UnknownType(),
			configurable: false,
			writable: false,
			enumerable: true
		} } : {
			value: new UnknownType(),
			configurable: false,
			writable: false,
			enumerable: true
		};
	}
	x = this._lookupProperty(p, alternate);
	if (x) {
		if (alternate) {
			copied = {};
			for (prop in x) {
				copied[prop] = copyDescriptor(x[prop]);
			}
			return copied;
		} else {
			return copyDescriptor(x);
		}
	}
};

/**
 * ECMA-262 Spec: <em>Returns the fully populated Property Descriptor of the named property of this object, or undefined
 * if absent.</em>
 *
 * @method
 * @name module:Base.ObjectType#getProperty
 * @param {string} p The name of the property descriptor to fetch
 * @param {boolean} alternate Whether or not to fetch the alternate values, or the base value
 * @returns {(module:Base.DataPropertyDescriptor | module:Base.AccessorPropertyDescriptor | undefined)} The objects property,
 *		or undefined if the property does not exist
 * @see ECMA-262 Spec Chapter 8.12.2
 */
ObjectType.prototype.getProperty = function getProperty(p, alternate) {
	var prop = this.getOwnProperty(p, alternate);
	if (prop) {
		return prop;
	}
	return this.objectPrototype && type(this.objectPrototype) != 'Null' && this.objectPrototype != this ?
		this.objectPrototype.getProperty(p, alternate) : undefined;
};

/**
 * Indicates that a property was set (i.e. written).
 *
 * @name module:Base.ObjectType#propertySet
 * @event
 * @param {string} name The name of the property that was set
 * @param {module:Base.BaseType} value The value that was set
 */
/**
 * ECMA-262 Spec: <em>Sets the specified named property to the value of the second parameter. The flag controls failure
 * handling.</em>
 *
 * @method
 * @name module:Base.ObjectType#put
 * @param {string} p The name of the parameter to set the value as
 * @param {module:Base.BaseType} v The value to set
 * @param {boolean} throwFlag Whether or not to throw an exception on error (related to strict mode)
 * @param {boolean} suppressEvent Suppresses the 'propertySet' event (used when setting prototypes)
 * @see ECMA-262 Spec Chapter 8.12.5
 */
ObjectType.prototype.put = function put(p, v, throwFlag, suppressEvent) {

	var canPutP = this.canPut(p),
		ownDesc,
		desc;
	if (canPutP === 'Unknown') {
		return;
	}

	if (!canPutP) {
		if (throwFlag) {
			handleRecoverableNativeException('TypeError', 'Cannot put argument');
			this.defineOwnProperty(p, { value: new UnknownType() }, throwFlag, suppressEvent);
		} else {
			return;
		}
	}

	if (!suppressEvent) {
		this.fireEvent('propertySet', 'Property "' + p + '" was set', {
			name: p,
			value: v
		});
	}

	ownDesc = this.getOwnProperty(p);
	if (isDataDescriptor(ownDesc)) {
		this.defineOwnProperty(p, { value: v }, throwFlag, suppressEvent);
		return;
	}

	desc = this.getProperty(p);
	if (isAccessorDescriptor(desc)) {
		desc.set.callFunction(this, [v]);
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
 * ECMA-262 Spec: <em>Returns a boolean value indicating whether a [[put]] operation with PropertyName can be performed.</em>
 *
 * @method
 * @name module:Base.ObjectType#canPut
 * @param {string} p The name of the parameter to test
 * @returns {boolean} Whether or not the parameter can be put
 * @see ECMA-262 Spec Chapter 8.12.4
 */
ObjectType.prototype.canPut = function canPut(p) {
	var desc = this.getOwnProperty(p),
		inherited;
	if (desc) {
		if (isAccessorDescriptor(desc)) {
			return desc.set && desc.set.className != 'Undefined';
		} else {
			return desc.writable;
		}
	}

	if (this.objectPrototype && type(this.objectPrototype) == 'Unknown') {
		return 'Unknown';
	}

	if (!this.objectPrototype || type(this.objectPrototype) == 'Null') {
		return this.extensible;
	}

	inherited = this.objectPrototype.getProperty(p);
	if (typeof inherited == 'undefined') {
		return this.extensible;
	}

	if (isAccessorDescriptor(inherited)) {
		return inherited.set && inherited.set.className != 'Undefined';
	} else {
		return this.extensible && inherited.writable;
	}
};

/**
 * ECMA-262 Spec: <em>Returns a boolean value indicating whether the object already has a property with the given name.</em>
 *
 * @method
 * @name module:Base.ObjectType#hasProperty
 * @param {string} p The name of the parameter to check for
 * @param {boolean} Whether or not the property exists on the object
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
 * @param {string} name The name of the property referenced
 */
/**
 * ECMA-262 Spec: <em>Removes the specified named own property from the object. The flag controls failure handling.</em>
 *
 * @method
 * @name module:Base.ObjectType#delete
 * @param {string} p The name of the parameter to delete
 * @param {boolean} throwFlag Whether or not to throw an exception on error (related to strict mode)
 * @returns {boolean} Whether or not the object was deleted succesfully
 * @see ECMA-262 Spec Chapter 8.12.7
 */
ObjectType.prototype['delete'] = function objDelete(p, throwFlag) {
	var desc = this.getOwnProperty(p);

	this.fireEvent('propertyDeleted', 'Property "' + p + '" was deleted', {
		name: p
	});

	if (typeof desc == 'undefined') {
		return true;
	}
	if (desc.configurable) {
		this._removeProperty(p);
		return true;
	}
	if (throwFlag) {
		throwNativeException('TypeError', 'Unable to delete "' + p + '"');
	}
	return false;
};

/**
 * ECMA-262 Spec: <em>Returns a default primitive value for the object.</em>
 *
 * @method
 * @name module:Base.ObjectType#defaultValue
 * @param {string} A hint for the default value, one of 'String' or 'Number.' Any other value is interpreted as 'String'
 * @returns {(module:Base.StringType | @link module:Base.NumberType | @link module:Base.UndefinedType)} The primitive default value
 * @see ECMA-262 Spec Chapter 8.12.8
 */
ObjectType.prototype.defaultValue = function defaultValue(hint) {

	var result;

	function defaultToString() {
		var toString = this.get('toString'),
			str;
		if (type(toString) === 'Unknown') {
			return new UnknownType();
		}
		if (isCallable(toString)) {
			str = toString.callFunction(this);
			if (type(str) === 'Unknown' || isPrimitive(str)) {
				return str;
			}
		}
	}

	function defaultValueOf() {
		var valueOf = this.get('valueOf'),
			val;
		if (type(valueOf) === 'Unknown') {
			return new UnknownType();
		}
		if (isCallable(valueOf)) {
			val = valueOf.callFunction(this);
			if (type(val) === 'Unknown' || isPrimitive(val)) {
				return val;
			}
		}
	}

	if (hint === 'String') {
		result = defaultToString.call(this);
		if (result) {
			return result;
		}
		result = defaultValueOf.call(this);
		if (result) {
			return result;
		}
		handleRecoverableNativeException('TypeError', 'Could not get the default string value');
		return new UnknownType();
	} else {
		result = defaultValueOf.call(this);
		if (result) {
			return result;
		}
		result = defaultToString.call(this);
		if (result) {
			return result;
		}
		handleRecoverableNativeException('TypeError', 'Could not get the default number value');
		return new UnknownType();
	}
};

/**
 * Indicates that a property was defined.
 *
 * @name module:Base.ObjectType#propertyDefined
 * @event
 * @param {string} name The name of the property referenced
 */
/**
 * ECMA-262 Spec: <em>Creates or alters the named own property to have the state described by a Property Descriptor. The
 * flag controls failure handling.</em>
 *
 * @method
 * @name module:Base.ObjectType#defineOwnProperty
 * @param {string} p The name of the parameter to delete
 * @param {(module:Base.DataPropertyDescriptor | module:Base.AccessorPropertyDescriptor)} desc The descriptor for the property
 * @param {boolean} throwFlag Whether or not to throw an exception on error (related to strict mode)
 * @param {boolean} suppressEvent Suppresses the 'propertyDefined' event (used when setting prototypes)
 * @returns {boolean} Indicates whether or not the property was defined successfully
 * @see ECMA-262 Spec Chapter 8.12.9
 */
ObjectType.prototype.defineOwnProperty = function defineOwnProperty(p, desc, throwFlag, suppressEvent) {
	var current = this.getOwnProperty(p, false, true),
		newProp,
		descKeys = Object.keys(desc),
		i;

	if (isDataDescriptor(desc)) {
		desc.value = desc.value || new UndefinedType();
		desc.value._updateClosure(this._closure);
		if (type(desc.value) === 'Unknown' || !desc.value._isLocal() || isAmbiguousBlock()) {
			newProp = new DataPropertyDescriptor();
			if (typeof desc.configurable != 'undefined') {
				newProp.configurable = desc.configurable;
			}
			if (typeof desc.enumerable != 'undefined') {
				newProp.enumerable = desc.enumerable;
			}
			if (typeof desc.writable != 'undefined') {
				newProp.writable = desc.writable;
			}
			newProp.value = new UnknownType();
			this._addProperty(p, newProp);
			return true;
		}
	}

	if (typeof current == 'undefined' && !this.extensible) {
		if (throwFlag) {
			handleRecoverableNativeException('TypeError', 'Could not define property ' + p + ': object is not extensible');
		}
		return false;
	}

	if (!suppressEvent) {
		this.fireEvent('propertyDefined', 'Property "' + p + '" was defined', {
			name: p
		});
	}

	if (typeof current == 'undefined' && this.extensible) {
		if (isAccessorDescriptor(desc)) {
			newProp = new AccessorPropertyDescriptor();
			if (typeof desc.configurable != 'undefined') {
				newProp.configurable = desc.configurable;
			}
			if (typeof desc.enumerable != 'undefined') {
				newProp.enumerable = desc.enumerable;
			}
			if (typeof desc.get != 'undefined') {
				newProp.get = desc.get;
			}
			if (typeof desc.set != 'undefined') {
				newProp.set = desc.set;
			}
		} else {
			newProp = new DataPropertyDescriptor();
			if (typeof desc.configurable != 'undefined') {
				newProp.configurable = desc.configurable;
			}
			if (typeof desc.enumerable != 'undefined') {
				newProp.enumerable = desc.enumerable;
			}
			if (typeof desc.value != 'undefined') {
				newProp.value = desc.value;
			}
			if (typeof desc.writable != 'undefined') {
				newProp.writable = desc.writable;
			}
		}
		this._addProperty(p, newProp);
		return true;
	}

	if (descKeys.length === 0) {
		return true;
	}

	if (sameDesc(current, desc)) {
		return true;
	}
	if (!current.configurable) {
		if (desc.configurable || (typeof desc.enumerable != 'undefined' && desc.enumerable !== current.enumerable)) {
			if (throwFlag) {
				handleRecoverableNativeException('TypeError', 'Could not define property ' + p +
					': existing property is not configurable and writable mismatch between existing and new property');
			}
			return false;
		}
	}

	if (isGenericDescriptor(desc)) {
		current = desc;
	} else if (isDataDescriptor(desc) !== isDataDescriptor(current)) {
		if (!current.configurable) {
			if (throwFlag) {
				handleRecoverableNativeException('TypeError', 'Could not define property ' + p +
					': descriptor type mismatch between existing and new property');
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
		if (!current.configurable && !current.writable) {
			if (desc.writable) {
				if (throwFlag) {
					handleRecoverableNativeException('TypeError', 'Could not define property ' + p +
						': existing property is not configurable and writable mismatch between existing and new property');
				}
				return false;
			}
			if (typeof desc.value != 'undefined' && !sameDesc(desc, current)) {
				if (throwFlag) {
					handleRecoverableNativeException('TypeError', 'Could not define property ' + p +
						': existing property is not configurable and value mismatch between existing and new property');
				}
				return false;
			}
		}
	} else if (isAccessorDescriptor(desc) && isAccessorDescriptor(current)) {
		if (!current.configurable && typeof desc.set != 'undefined') {
			if (!sameValue(desc.set, current.set)) {
				if (throwFlag) {
					handleRecoverableNativeException('TypeError', 'Could not define property ' + p +
						': existing property is not configurable and set mismatch between existing and new property');
				}
				return false;
			}
			if (!sameValue(desc.get, current.get)) {
				if (throwFlag) {
					handleRecoverableNativeException('TypeError', 'Could not define property ' + p +
						': existing property is not configurable and get mismatch between existing and new property');
				}
				return false;
			}
		}
	}
	for (i in descKeys) {
		current[descKeys[i]] = desc[descKeys[i]];
	}
	this._addProperty(p, current);
	return true;
};