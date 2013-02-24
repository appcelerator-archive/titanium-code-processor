

/*global

*/

/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * This module contains many base operations used by the code processor. Almost all of the methods and classes strictly
 * implement methods/objects defined in the ECMA-262 specification. Many of the descriptions are taken directly from the
 * ECMA-262 Specification, which can be obtained from
 * <a href='http://www.ecma-international.org/publications/standards/Ecma-262.htm'>ecma international</a> Direct quotes
 * from the ECMA-262 specification are formatted with the prefix 'ECMA-262 Spec:' followed by the quote in
 * <em>italics</em>. See Chapters 8, 9, and 10 in the ECMA-262 specification for more explanations of these objects and
 * methods.
 *
 * @module Base
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var util = require('util'),

	Runtime = require('./Runtime'),
	RuleProcessor = require('./RuleProcessor'),
	AST = require('./AST'),

	throwTypeError,

	positiveIntegerRegEx = /^\d*$/,

	prototypes = {};

/*****************************************
 *
 * Non-spec helpers
 *
 *****************************************/

/**
 * Checks if the given value is a primitive type, i.e. {@link module:Base.type}(o) is one of 'Number', 'String', 'Boolean',
 * 'Undefined', or 'Null'.
 *
 * @method
 * @private
 * @param {module:Base.BaseType} o The value to check
 * @returns {Boolean} Whether or not the value is a primitive
 */
function isPrimitive(o) {
	return !!~['Number', 'String', 'Boolean', 'Undefined', 'Null'].indexOf(o && o.className);
}

/**
 * Checks if the given value is an object type (Object, Function, Array, etc)
 *
 * @method
 * @private
 * @param {module:Base.BaseType} o The value to check
 * @returns {Boolean} Whether or not the value is a primitive
 */
function isObject(o) {
	return !isPrimitive(o);
}

/**
 * Checks if two descriptions describe the same description.
 *
 * @method
 * @private
 * @param {module:Base.DataPropertyDescriptor|module:Base.AccessorPropertyDescriptor} x The first descriptor
 * @param {module:Base.DataPropertyDescriptor|module:Base.AccessorPropertyDescriptor} y The second descriptor
 * @returns {Boolean} Whether or not the descriptions are the same
 */
function sameDesc(x, y) {
	var xKeys,
		yKeys,
		same,
		i,
		hiddenRegex = /^_/;
	if (typeof x === typeof y) {
		if (typeof x === 'object') {
			xKeys = Object.keys(x);
			yKeys = Object.keys(y);
			same = true;

			if (xKeys.length !== yKeys.length) {
				return false;
			}
			for (i in xKeys) {
				if (!hiddenRegex.test(xKeys[i])) {
					if (i in yKeys) {
						same = same && (sameDesc(x[xKeys[i]], y[xKeys[i]]));
					} else {
						return false;
					}
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
 * Checks if any of the supplied values are unknown
 *
 * @method
 * @private
 * @param {Array[{@link module:Base.BaseType}]} values The values to check for unknown
 * @param {Boolean} Whether or not any of the supplied values are unknown
 */
function areAnyUnknown(values) {
	var i = 0,
		len = values.length;
	for (; i < len; i++) {
		if (type(values[i]) === 'Unknown') {
			return true;
		}
	}
	return false;
}

/**
 * Checks if a value is defined
 *
 * @method
 * @private
 * @param {Any} value The value to check
 * @param {Boolean} Whether or not the value is not undefined
 */
function isDefined(value) {
	return typeof value !== 'undefined';
}

/**
 * Checks if a value is defined
 *
 * @method
 * @private
 * @param {Any} value The value to check
 * @param {Boolean} Whether or not the value is not undefined
 */
function isUndefined(value) {
	return typeof value === 'undefined';
}

/**
 * Adds a read-only prop to an object
 *
 * @method
 * @private
 * @param {module:Base.BaseType} obj The object to add the property to
 * @param {String} name The name of the property
 * @param {module:Base.BaseType} value The value of the new property
 */
function addReadOnlyProperty(obj, name, value) {
	obj.defineOwnProperty(name, { value: value }, false, true);
}

/**
 * Adds a non-enumerable prop to an object
 *
 * @method
 * @private
 * @param {module:Base.BaseType} obj The object to add the property to
 * @param {String} name The name of the property
 * @param {module:Base.BaseType} value The value of the new property
 */
function addNonEnumerableProperty(obj, name, value) {
	obj.defineOwnProperty(name, {
		value: value,
		enumerable: false,
		configurable: true,
		writable: true,
	}, false, true);
}

/**
 * Determines the type of the value.
 *
 * @method
 * @name module:Base.type
 * @param {module:Base.BaseType} t The value to check
 * @returns {String} The type of the value, one of 'Undefined', 'Null', 'Number', 'String', 'Boolean', 'Object',
 *		'Reference', 'Unknown'.
 */
exports.type = type; // We do the exports first to get docgen to recognize the function properly
function type(t) {
	return t.type;
}

/**
 * Checks if the supplied value is one of the supplied types.
 *
 * @method
 * @name module:Base.isType
 * @param {module:Base.baseType} value The value to check
 * @param {String|Array[String]} types The types to check against
 * @returns {Boolean} Whether or not the value is one of the types
 */
exports.isType = isType;
function isType(value, types) {
	if (typeof types === 'string') {
		types = [types];
	}
	return types.indexOf(type(value)) !== -1;
}

// ******** Base Type Class ********

/**
 * @classdesc The base class for all types
 *
 * @constructor
 * @name module:Base.BaseType
 * @extends module:Runtime.Evented
 * @param {String} className The name of the class, such as 'String' or 'Object'
 */
exports.BaseType = BaseType;
function BaseType(className) {
	Runtime.Evented.call(this);
	this.className = className;
	this._closure = Runtime.getCurrentContext();
}
util.inherits(BaseType, Runtime.Evented);

/**
 * Checks if this value is local to an ambiguous context (always true if not in an ambiguous context)
 *
 * @private
 */
BaseType.prototype._isLocal = function () {
	var lexicalEnvironment = Runtime.getCurrentContext().lexicalEnvironment,
		targetLexicalEnvironment = this._closure.lexicalEnvironment;
	while (lexicalEnvironment) {
		if (targetLexicalEnvironment === lexicalEnvironment) {
			return true;
		} else if (lexicalEnvironment._ambiguousContext) {
			return false;
		}
		lexicalEnvironment = lexicalEnvironment.outer;
	}
	return true;
};

/**
 * Updates the closure if this variable is leaked
 *
 * @private
 */
BaseType.prototype._updateClosure = function (targetClosure) {
	var lexicalEnvironment = this._closure.lexicalEnvironment,
		targetLexicalEnvironment = targetClosure.lexicalEnvironment;
	while (lexicalEnvironment) {
		if (lexicalEnvironment === targetLexicalEnvironment) {
			this._closure = targetClosure;
			return true;
		}
		lexicalEnvironment = lexicalEnvironment.outer;
	}
	return false;
};

/**
 * Looks up a property
 *
 * @private
 */
BaseType.prototype._lookupProperty = function (p) {
	var i = 0, len = this._properties.length;
	p = p.toString();
	for (; i < len; i++) {
		if (this._properties[i]._name === p) {
			return this._properties[i];
		}
	}
};

/**
 * Adds a property
 *
 * @private
 */
BaseType.prototype._addProperty = function (p, desc) {
	p = p.toString();
	desc._name = p;
	this._removeProperty(p);
	this._properties.push(desc);
};

/**
 * Removes a property
 *
 * @private
 */
BaseType.prototype._removeProperty = function (p) {
	var i = 0, len = this._properties.length;
	p = p.toString();
	for (; i < len; i++) {
		if (this._properties[i]._name === p) {
			this._properties.splice(i, 1);
			return;
		}
	}
};

/**
 * Gets a list of properties
 *
 * @private
 */
BaseType.prototype._getPropertyNames = function () {
	var i = 0, len = this._properties.length,
		properties = [];
	for (; i < len; i++) {
		properties[i] = this._properties[i]._name;
	}
	return properties.sort();
};

/*global
util
Runtime
BaseType
*/

/*****************************************
 *
 * Unknown Type Class
 *
 *****************************************/

/**
 * @classdesc Represents an unknown type. Types are considered to be 'unknown' if their value cannot be determined at
 * compile time and are unique to this implementation. There is no equivalent in the ECMA-262 spec.
 *
 * @constructor
 * @name module:Base.UnknownType
 * @param {String} [className] The name of the class, such as 'String' or 'Object'
 * @extends module:Base.BaseType
 */
exports.UnknownType = UnknownType;
function UnknownType(className) {
	var currentLocation = Runtime.getCurrentLocation();
	if (Runtime.options.exactMode) {
		throw new Error('Attempted to instantiate an unknown type in exact mode at ' + currentLocation.filename + ':' +
			currentLocation.line);
	}
	Runtime._unknown = true;
	BaseType.call(this, className || 'Unknown');
	this.type = 'Unknown';
}
util.inherits(UnknownType, BaseType);

/*global
util
BaseType
*/

/*****************************************
 *
 * Undefined Type Class
 *
 *****************************************/

/**
 * @classdesc An undefined type.
 *
 * @constructor
 * @name module:Base.UndefinedType
 * @extends module:Base.BaseType
 * @param {String} [className] The name of the class, such as 'String' or 'Object'
 * @see ECMA-262 Spec Chapter 8.1
 */
exports.UndefinedType = UndefinedType;
function UndefinedType(className) {
	BaseType.call(this, className || 'Undefined');
	this.type = 'Undefined';
}
util.inherits(UndefinedType, BaseType);

/*global
util
BaseType
*/

/*****************************************
 *
 * Null Type Class
 *
 *****************************************/

/**
 * @classdesc A null type.
 *
 * @constructor
 * @name module:Base.NullType
 * @extends module:Base.BaseType
 * @param {String} [className] The name of the class, such as 'String' or 'Object'
 * @see ECMA-262 Spec Chapter 8.2
 */
exports.NullType = NullType;
function NullType(className) {
	BaseType.call(this, className || 'Null');
	this.type = 'Null';
	this.value = null;
}
util.inherits(NullType, BaseType);

/*global
util
BaseType
isUndefined
prototypes
*/

/*****************************************
 *
 * Number Type Class
 *
 *****************************************/

/**
 * @classdesc A number type.
 *
 * @constructor
 * @name module:Base.NumberType
 * @extends module:Base.BaseType
 * @param {Integer} [initialValue] The initial value of the number. Defaults to 0 if omitted
 * @param {String} [className] The name of the class, such as 'String' or 'Object'
 * @see ECMA-262 Spec Chapter 8.5
 */
exports.NumberType = NumberType;
function NumberType(initialValue, className) {
	
	var proto;
	
	BaseType.call(this, className || 'Number');
	
	Object.defineProperty(this, 'objectPrototype', {
		get: function () {
			return proto || prototypes.Number;
		},
		set: function (value) {
			proto = value;
		},
		configurable: true
	});
	
	this.type = 'Number';
	this.value = isUndefined(initialValue) ? 0 : initialValue;
}
util.inherits(NumberType, BaseType);

/*global
util
BaseType
prototypes
isUndefined
*/

/*****************************************
 *
 * Boolean Type Class
 *
 *****************************************/

/**
 * @classdesc A boolean type.
 *
 * @constructor
 * @name module:Base.BooleanType
 * @extends module:Base.BaseType
 * @param {Boolean} [initialValue] The initial value of the number. Defaults to false if omitted
 * @param {String} [className] The name of the class, such as 'String' or 'Object'
 * @see ECMA-262 Spec Chapter 8.3
 */
exports.BooleanType = BooleanType;
function BooleanType(initialValue, className) {
	
	var proto;
	
	BaseType.call(this, className || 'Boolean');
	
	Object.defineProperty(this, 'objectPrototype', {
		get: function () {
			return proto || prototypes.Boolean;
		},
		set: function (value) {
			proto = value;
		},
		configurable: true
	});
	
	this.type = 'Boolean';
	this.value = isUndefined(initialValue) ? false : initialValue;
}
util.inherits(BooleanType, BaseType);

/*global
util
NumberType
ObjectType
prototypes
isUndefined
BaseType
*/

/*****************************************
 *
 * String Type Class
 *
 *****************************************/

/**
 * @classdesc A string type.
 *
 * @constructor
 * @name module:Base.StringType
 * @extends module:Base.BaseType
 * @param {String} [initialValue] The initial value of the number. Defaults to '' if omitted
 * @param {String} [className] The name of the class, such as 'String' or 'Object'
 * @see ECMA-262 Spec Chapter 8.4
 */
exports.StringType = StringType;
function StringType(initialValue, className) {
	
	var value,
		proto;
	Object.defineProperty(this, 'value', {
		get: function() {
			return value;
		},
		set: function(val) {
			value = val;
			this._addProperty('length', {
				value: new NumberType(value.length)
			});
		}.bind(this)
	});
	
	ObjectType.call(this, className || 'String');
	
	Object.defineProperty(this, 'objectPrototype', {
		get: function () {
			return proto || prototypes.String;
		},
		set: function (value) {
			proto = value;
		},
		configurable: true
	});
	
	this.type = 'String';
	this.value = isUndefined(initialValue) ? '' : initialValue;
}
util.inherits(StringType, BaseType);

/*global
Runtime
UndefinedType
isUndefined
type
isCallable
throwNativeException
isDefined
isObject
isType
toObject
BaseType
prototypes
util
UnknownType
handleRecoverableNativeException
isPrimitive
sameDesc
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
 * @name module:Base.AccessorPropertyDescriptor
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
 * @name module:Base.isDataDescriptor
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
 * @name module:Base.isAccessorDescriptor
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
 * @name module:Base.isGenericDescriptor
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
 * @classdesc An object type. Note: functions are defined as objects, and so are represented by the class.
 *
 * @constructor
 * @name module:Base.ObjectType
 * @extends module:Base.BaseType
 * @param {String} [className] The name of the class, such as 'String' or 'Object'
 * @see ECMA-262 Spec Chapters 8.6 and 15.2.2
 */
exports.ObjectType = ObjectType;
function ObjectType(className, value) {

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
			return proto || prototypes.Object;
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
 * @param {String} name The name of the property that was referenced
 * @param {{@link module:Base.DataPropertyDescriptor}|{@link module:Base.AccessorPropertyDescriptor}|undefined} The
 *		descriptor fetched, if it could be found.
 */
/**
 * ECMA-262 Spec: <em>Returns the value of the named property.</em>
 *
 * @method
 * @name module:Base.ObjectType#get
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
			result = desc.get && desc.get.className !== 'Undefined' ? desc.get.call(this) : new UndefinedType();
		}
	}

	this.fireEvent('propertyReferenced', 'Property "' + p + '" was referenced', {
		name: p,
		desc: desc
	});

	return result;
};

/**
 * ECMA-262 Spec: <em>Returns the Property Descriptor of the named own property of this object, or undefined if absent.</em>
 *
 * @method
 * @name module:Base.ObjectType#getOwnProperty
 * @param {String} p The name of the property descriptor to fetch
 * @param {Boolean} suppressEvent Indicates whether or not to suppress an event
 * @returns {{@link module:Base.DataPropertyDescriptor}|{@link module:Base.AccessorPropertyDescriptor}|undefined} The
 *		objects property, or undefined if the property does not exist
 * @see ECMA-262 Spec Chapter 8.12.1
 */
ObjectType.prototype.getOwnProperty = function getOwnProperty(p, suppressEvent) {
	var d,
		x;
	if (type(this) === 'Unknown') {
		return {
			value: new UnknownType(),
			configurable: false,
			writable: false,
			enumerable: true
		};
	}
	x = this._lookupProperty(p);
	if (x) {
		d = {};
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
};

/**
 * ECMA-262 Spec: <em>Returns the fully populated Property Descriptor of the named property of this object, or undefined
 * if absent.</em>
 *
 * @method
 * @name module:Base.ObjectType#getProperty
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
	return this.objectPrototype && this.objectPrototype !== this ? this.objectPrototype.getProperty(p) : undefined;
};

/**
 * Indicates that a property was set (i.e. written).
 *
 * @name module:Base.ObjectType#propertySet
 * @event
 * @param {String} name The name of the property that was set
 * @param {module:Base.BaseType} value The value that was set
 */
/**
 * ECMA-262 Spec: <em>Sets the specified named property to the value of the second parameter. The flag controls failure
 * handling.</em>
 *
 * @method
 * @name module:Base.ObjectType#put
 * @param {String} p The name of the parameter to set the value as
 * @param {module:Base.BaseType} v The value to set
 * @param {Boolean} throwFlag Whether or not to throw an exception on error (related to strict mode)
 * @param {Boolean} suppressEvent Suppresses the 'propertySet' event (used when setting prototypes)
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

	ownDesc = this.getOwnProperty(p, true);
	if (isDataDescriptor(ownDesc)) {
		this.defineOwnProperty(p, { value: v }, throwFlag, suppressEvent);
		return;
	}

	desc = this.getProperty(p);
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
 * @name module:Base.ObjectType#canPut
 * @param {String} p The name of the parameter to test
 * @returns {Boolean} Whether or not the parameter can be put
 * @see ECMA-262 Spec Chapter 8.12.4
 */
ObjectType.prototype.canPut = function canPut(p) {
	var desc = this.getOwnProperty(p, true),
		inherited;
	if (desc) {
		if (isAccessorDescriptor(desc)) {
			return desc.set && desc.set.className !== 'Undefined';
		} else {
			return desc.writable;
		}
	}

	if (this.objectPrototype && type(this.objectPrototype) === 'Unknown') {
		return 'Unknown';
	}

	if (!this.objectPrototype) {
		return this.extensible;
	}

	inherited = this.objectPrototype.getProperty(p);
	if (isUndefined(inherited)) {
		return this.extensible;
	}

	if (isAccessorDescriptor(inherited)) {
		return inherited.set.className !== 'Undefined';
	} else {
		return this.extensible && inherited.writable;
	}
};

/**
 * ECMA-262 Spec: <em>Returns a Boolean value indicating whether the object already has a property with the given name.</em>
 *
 * @method
 * @name module:Base.ObjectType#hasProperty
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
 * @param {String} name The name of the property referenced
 */
/**
 * ECMA-262 Spec: <em>Removes the specified named own property from the object. The flag controls failure handling.</em>
 *
 * @method
 * @name module:Base.ObjectType#delete
 * @param {String} p The name of the parameter to delete
 * @param {Boolean} throwFlag Whether or not to throw an exception on error (related to strict mode)
 * @returns {Boolean} Whether or not the object was deleted succesfully
 * @see ECMA-262 Spec Chapter 8.12.7
 */
ObjectType.prototype['delete'] = function objDelete(p, throwFlag) {
	var desc = this.getOwnProperty(p, true);

	this.fireEvent('propertyDeleted', 'Property "' + p + '" was deleted', {
		name: p
	});

	if (isUndefined(desc)) {
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
 * @param {String} A hint for the default value, one of 'String' or 'Number.' Any other value is interpreted as 'String'
 * @returns {{@link module:Base.StringType}|{@link module:Base.NumberType}|{@link module:Base.UndefinedType}} The primitive default value
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
			str = toString.call(this);
			if (isPrimitive(str)) {
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
			val = valueOf.call(this);
			if (isPrimitive(val)) {
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
 * @param {String} name The name of the property referenced
 */
/**
 * ECMA-262 Spec: <em>Creates or alters the named own property to have the state described by a Property Descriptor. The
 * flag controls failure handling.</em>
 *
 * @method
 * @name module:Base.ObjectType#defineOwnProperty
 * @param {String} p The name of the parameter to delete
 * @param {module:Base.DataPropertyDescriptor|module:Base.AccessorPropertyDescriptor} desc The descriptor for the property
 * @param {Boolean} throwFlag Whether or not to throw an exception on error (related to strict mode)
 * @param {Boolean} suppressEvent Suppresses the 'propertyDefined' event (used when setting prototypes)
 * @returns {Boolean} Indicates whether or not the property was defined successfully
 * @see ECMA-262 Spec Chapter 8.12.9
 */
ObjectType.prototype.defineOwnProperty = function defineOwnProperty(p, desc, throwFlag, suppressEvent) {
	var current = this.getOwnProperty(p, true),
		newProp,
		descKeys = Object.keys(desc),
		i;

	if (isDataDescriptor(desc)) {
		desc.value = desc.value || new UndefinedType();
		desc.value._updateClosure(this._closure);
		if (type(desc.value) === 'Unknown' || !desc.value._isLocal() || Runtime.isAmbiguousBlock()) {
			newProp = new DataPropertyDescriptor();
			if (isDefined(desc.configurable)) {
				newProp.configurable = desc.configurable;
			}
			if (isDefined(desc.enumerable)) {
				newProp.enumerable = desc.enumerable;
			}
			if (isDefined(desc.writable)) {
				newProp.writable = desc.writable;
			}
			newProp.value = new UnknownType();
			this._addProperty(p, newProp);
			return true;
		}
	}

	if (isUndefined(current) && !this.extensible) {
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
		if (desc.configurable || (isDefined(desc.enumerable) && desc.enumerable !== current.enumerable)) {
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
			if (isDefined(desc.value) && !sameDesc(desc, current)) {
				if (throwFlag) {
					handleRecoverableNativeException('TypeError', 'Could not define property ' + p +
						': existing property is not configurable and value mismatch between existing and new property');
				}
				return false;
			}
		}
	} else if (isAccessorDescriptor(desc) && isAccessorDescriptor(current)) {
		if (!current.configurable && isDefined(desc.set)) {
			if (!sameDesc(desc.set, current.set)) {
				if (throwFlag) {
					handleRecoverableNativeException('TypeError', 'Could not define property ' + p +
						': existing property is not configurable and set mismatch between existing and new property');
				}
				return false;
			}
			if (!sameDesc(desc.get, current.get)) {
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

/*global
util
ObjectType
prototypes
NumberType
positiveIntegerRegEx
*/

/*****************************************
 *
 * Array Type Class
 *
 *****************************************/

/**
 * @classdesc An array type.
 *
 * @constructor
 * @name module:Base.ArrayType
 * @extends module:Base.ObjectType
 * @param {String} [className] The name of the class, such as 'String' or 'Object'
 * @see ECMA-262 Spec Chapters 11.1.4 and 15.4
 */
exports.ArrayType = ArrayType;
function ArrayType(className) {
	
	var proto;
	
	ObjectType.call(this, className || 'Array');
	
	Object.defineProperty(this, 'objectPrototype', {
		get: function () {
			return proto || prototypes.Array;
		},
		set: function (value) {
			proto = value;
		},
		configurable: true
	});
	
	this._addProperty('length', {
		value: new NumberType(0),
		writable: true,
		enumerable: false,
		configurable: false
	});
}
util.inherits(ArrayType, ObjectType);

/**
 * ECMA-262 Spec: <em>Creates or alters the named own property to have the state described by a Property Descriptor. The
 * flag controls failure handling.</em>
 *
 * @method
 * @name module:Base.ArrayType#defineOwnProperty
 * @param {String} p The name of the parameter to delete
 * @param {module:Base.DataPropertyDescriptor|module:Base.AccessorPropertyDescriptor} desc The descriptor for the property
 * @param {Boolean} throwFlag Whether or not to throw an exception on error (related to strict mode)
 * @param {Boolean} suppressEvent Suppresses the 'propertyDefined' event (used when setting prototypes)
 * @returns {Boolean} Indicates whether or not the property was defined successfully
 * @see ECMA-262 Spec Chapter 8.12.9 and 15.4.5.1
 */
ArrayType.prototype.defineOwnProperty = function defineOwnProperty(p) {
	
	var parsedP;
	
	// Call the parent method
	ObjectType.prototype.defineOwnProperty.apply(this, arguments);
	
	// Check if this is an integer, a.k.a. if we need to update the length
	if (positiveIntegerRegEx.test(p)) {
		parsedP = parseInt(p, 10);
		if (parsedP >= this.get('length').value) {
			this._addProperty('length', {
				value: new NumberType(parsedP + 1),
				writable: true,
				enumerable: false,
				configurable: false
			});
		}
	}
};

/*global
util
ObjectType
prototypes
isDefined
throwNativeException
NumberType
BooleanType
StringType
*/

/*****************************************
 *
 * RegExp Type Class
 *
 *****************************************/

// ******** RegExp Type Class ********

/**
 * @classdesc A regexp type.
 *
 * @constructor
 * @name module:Base.RegExpType
 * @extends module:Base.ObjectType
 * @param {String} pattern The regex pattern
 * @Param {String} flags The regex flags
 * @param {String} [className] The name of the class, such as 'String' or 'Object'
 * @see ECMA-262 Spec Chapters 11.1.4 and 15.4
 */
exports.RegExpType = RegExpType;
function RegExpType(pattern, flags, className) {

	var proto;

	ObjectType.call(this, className || 'RegExp');

	Object.defineProperty(this, 'objectPrototype', {
		get: function () {
			return proto || prototypes.RegExp;
		},
		set: function (value) {
			proto = value;
		},
		configurable: true
	});

	if (isDefined(pattern)) {
		if (Object.prototype.toString.apply(pattern).indexOf('RegExp') !== -1) { // For some reason, pattern instanceof RegExp doesn't work
			this.value = pattern;
			this._pattern = pattern.source;
			this._flags = (pattern.global ? 'g' : '') + (pattern.ignoreCase ? 'i' : '') + (pattern.multiline ? 'm' : '');
		} else {
			try {
				this.value = new RegExp(pattern, flags);
				this._pattern = pattern;
				this._flags = flags;
			} catch(e) {
				throwNativeException('SyntaxError', 'Regular expression pattern is undefined');
			}
		}
		this._refreshPropertiesFromRegExp();
	}
}
util.inherits(RegExpType, ObjectType);

/**
 * @private
 */
RegExpType.prototype._refreshPropertiesFromRegExp = function _refreshPropertiesFromRegExp() {

	var value = this.value;

	this.put('lastIndex', new NumberType(value.lastIndex), false, true);
	this.put('ignoreCase', new BooleanType(value.ignoreCase), false, true);
	this.put('global', new BooleanType(value.global), false, true);
	this.put('multiline', new BooleanType(value.multiline), false, true);
	this.put('source', new StringType(value.source), false, true);
};

/**
 * @private
 */
RegExpType.prototype._refreshRegExpFromProperties = function _refreshRegExpFromProperties() {
	this.value.lastIndex = this.get('lastIndex');
};

/*global
Runtime
util
ObjectType
prototypes
NumberType
handleRecoverableNativeException
type
UnknownType
throwNativeException
throwTypeError
createFunctionContext
UndefinedType
isType
*/

/*****************************************
 *
 * Function Type Classes
 *
 *****************************************/

// ******** Function Type Base Class ********

/**
 * @classdesc The base for functions that are shared by the actual function type, and by native functions
 *
 * @constructor
 * @name module:Base.FunctionTypeBase
 * @extends module:Base.ObjectType
 * @param {Integer} length The number of formal parameters
 * @param {String} [className] The name of the class
 * @see ECMA-262 Spec Chapter 13.2
 */
exports.FunctionTypeBase = FunctionTypeBase;
function FunctionTypeBase(length, className) {

	var proto;

	ObjectType.call(this, className || 'Function');

	// Step 4
	Object.defineProperty(this, 'objectPrototype', {
		get: function () {
			return proto || prototypes.Function;
		},
		set: function (value) {
			proto = value;
		},
		configurable: true
	});

	// Step 9
	this.scope = Runtime.getModuleContext();

	// Steps 10 (implicit) and 11, defaulting to empty (FunctionType overrides it)
	this.formalParameters = [];

	// Step 13
	this.extensible = true;

	// Step 14 and 15
	this.defineOwnProperty('length', {
		value: new NumberType(length),
		writable: false,
		enumerable: false,
		configurable: false
	}, false, true);

	// Step 16
	proto = new ObjectType();

	// Step 17
	proto.defineOwnProperty('constructor', {
		value: this,
		writable: true,
		enumerable: false,
		configurable: true
	}, false, true);

	// Step 18
	this.defineOwnProperty('prototype', {
		value: proto,
		writable: true,
		enumerable: false,
		configurable: false
	}, false, true);
	proto = undefined; // Reuse of variable
}
util.inherits(FunctionTypeBase, ObjectType);

/**
 * ECMA-262 Spec: <em>Returns the value of the named property.</em>
 *
 * @method
 * @name module:Base.FunctionTypeBase#get
 * @param {String} p The name of the property to fetch
 * @returns {{@link module:Base.BaseType}} The value of the property, or a new instance of {@link module:Base.UndefinedType} if
 *		the property does not exist
 * @see ECMA-262 Spec Chapters 8.12.3 and 15.3.5.4
 */
FunctionTypeBase.prototype.get = function get(p) {
	var v = ObjectType.prototype.get.call(this, p);
	if (p === 'caller' && v.className === 'Function' && v.strict) {
		handleRecoverableNativeException('TypeError', 'Invalid identifier ' + p);
		return new UnknownType();
	}
	return v;
};

/**
 * Checks if the function has an instance of v (or something, not exactly sure)
 *
 * @method
 * @name module:Base.FunctionTypeBase#hasInstance
 * @param {module:Base.BaseType} v The value to check against
 * @returns {Boolean} Whether or not this function has an instance of v
 * @see ECMA-262 Spec Chapter 15.3.5.3
 */
FunctionTypeBase.prototype.hasInstance = function hasInstance(v) {
	var o = this.get('prototype');

	if (type(v) !== 'Object') {
		return false;
	}
	if (type(o) !== 'Object') {
		throwNativeException('TypeError', 'Value is not an object');
	}
	do {
		v = v.objectPrototype;
		if (o === v) {
			return true;
		}
	} while (v && v !== v.objectPrototype);
	return false;
};

/**
 * @classdesc A function object type
 *
 * @constructor
 * @name module:Base.FunctionType
 * @extends module:Base.FunctionTypeBase
 * @param {Array[String]} formalParameterList The list of function arguments
 * @param {module:AST.node} functionBody The parsed body of the function
 * @param {module:Base.LexicalEnvironment} lexicalEnvironment The lexical environment of the function
 * @param {Boolean} strict Whether or not this is a strict mode function
 * @param {String} [className] The name of the class, defaults to 'Function.' This parameter should only be used by a
 *		constructor for an object extending this one.
 * @see ECMA-262 Spec Chapter 13.2
 */
exports.FunctionType = FunctionType;
function FunctionType(formalParameterList, functionBody, lexicalEnvironemnt, strict, className) {

	// Steps 3 (implicit), 4, 13, 14, and 15 covered in the parent constructor
	FunctionTypeBase.call(this, formalParameterList ? formalParameterList.length : 0, className);

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
		this.defineOwnProperty('caller', {
			get: throwTypeError,
			set: throwTypeError,
			enumerable: false,
			configurable: false
		}, false, true);
		this.defineOwnProperty('arguments', {
			get: throwTypeError,
			set: throwTypeError,
			enumerable: false,
			configurable: false
		}, false, true);
	}
}
util.inherits(FunctionType, FunctionTypeBase);

// ******** Function Type Class ********

/**
 * Calls the function
 *
 * @method
 * @name module:Base.FunctionType#call
 * @param {module:Base.BaseType} thisVal The value of <code>this</code> of the function
 * @param (Array[{@link module:Base.BaseType}]} args The set of arguments passed in to the function call
 * @returns {module:Base.BaseType} The return value from the function
 * @see ECMA-262 Spec Chapter 13.2.1
 */
FunctionType.prototype.call = function call(thisVal, args, ambiguousContext) {

	var funcCtx,
		result,
		i,
		len;

	ambiguousContext = !!ambiguousContext || Runtime.isAmbiguousBlock();
	funcCtx = createFunctionContext(this, thisVal, args || []);
	funcCtx.lexicalEnvironment._ambiguousContext = ambiguousContext;

	// Execute the function body
	try {
		if (!this.code || this.code.length === 0) {
			result = ['normal', new UndefinedType(), undefined];
		} else {
			for (i = 0, len = this.code.length; i < len; i++) {
				result = this.code[i].processRule();
				this.code[i]._ambiguousContext = this.code[i]._ambiguousContext || ambiguousContext;
				if (result && result.length === 3 && result[0] !== 'normal') {
					break;
				}
			}
		}
	} finally {
		// Exit the context
		Runtime.exitContext();
	}

	// Process the results
	if (result[0] === 'throw') {
		// Do nothing, but preserve the result value
	} else if (result[0] === 'return') {
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
 * @name module:Base.FunctionType#construct
 * @param (Array[{@link module:Base.BaseType}]} args The set of arguments passed in to the function call
 * @returns {module:Base.ObjectType} The object that was just created, or the return value of the constructor
 * @see ECMA-262 Spec Chapter 13.2.2
 */
FunctionType.prototype.construct = function construct(args) {
	var obj = new ObjectType(),
		proto = this.get('prototype'),
		result;
	obj.extensible = true;

	// Hook up the prototype
	if (isType(proto, ['Object', 'Unknown'])) {
		obj.objectPrototype = proto;
	}

	// Invoke the constructor
	result = this.call(obj, args);

	// Return the result
	if (isType(result, ['Object', 'Unknown'])) {
		return result;
	}
	return obj;
};

/*global
util
Runtime
BaseType
isType
type
handleRecoverableNativeException
toObject
UnknownType
isUndefined
UndefinedType
isDataDescriptor
throwNativeException
isAccessorDescriptor
*/

/*****************************************
 *
 * Reference Type Class
 *
 *****************************************/

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
 * @name module:Base.ReferenceType
 * @extends module:Base.BaseType
 * @see ECMA-262 Spec Chapter 8.7
 */
exports.ReferenceType = ReferenceType;
function ReferenceType(baseValue, referencedName, strictReference) {
	BaseType.call(this, 'Reference');
	this.type = 'Reference';
	this.baseValue = baseValue;
	this.referencedName = referencedName || '';
	this.strictReference = !!strictReference;
}
util.inherits(ReferenceType, BaseType);

/**
 * ECMA-262 Spec: <em>Returns the base value component of the supplied reference.</em>
 *
 * @method
 * @name module:Base.getBase
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
 * @name module:Base.getReferencedName
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
 * @name module:Base.isStrictReference
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
 * @name module:Base.hasPrimitiveBase
 * @param {module:Base.ReferenceType} v The reference to check for a primitive base
 * @returns {Boolean} Whether or not the reference has a primitive base
 * @see ECMA-262 Spec Chapter 8.7
 */
exports.hasPrimitiveBase = hasPrimitiveBase;
function hasPrimitiveBase(v) {
	return isType(getBase(v), ['Number', 'String', 'Boolean']);
}

/**
 * ECMA-262 Spec: <em>Returns true if either the base value is an object or HasPrimitiveBase(V) is true; otherwise
 * returns false.</em>
 *
 * @method
 * @name module:Base.isPropertyReference
 * @param {module:Base.ReferenceType} v The reference to get the name of
 * @returns {Boolean} Whether or not the reference is a property reference
 * @see ECMA-262 Spec Chapter 8.7
 */
exports.isPropertyReference = isPropertyReference;
function isPropertyReference(v) {
	return hasPrimitiveBase(v) || type(getBase(v)) === 'Object';
}

/**
 * ECMA-262 Spec: <em>Returns true if the base value is undefined and false otherwise.</em>
 *
 * @method
 * @name module:Base.isUnresolvableReference
 * @param {module:Base.ReferenceType} v The reference to get the name of
 * @returns {Boolean} Whether or not the reference is an unresolvable reference
 * @see ECMA-262 Spec Chapter 8.7
 */
exports.isUnresolvableReference = isUnresolvableReference;
function isUnresolvableReference(v) {
	return type(getBase(v)) === 'Undefined';
}

/**
 * Gets the value pointed to by the supplied reference.
 *
 * @method
 * @name module:Base.getValue
 * @param {module:Base.ReferenceType} v The reference to get
 * @returns {{@link module:Base.BaseType}|{@link module:Base.UndefinedType}} The value pointed to by the reference, or
 *		UndefinedType if the value could not be retrieved
 * @see ECMA-262 Spec Chapter 8.7.1
 */
exports.getValue = getValue;
function getValue(v) {
	
	var base,
		get,
		getThisObj = this;
	
	if (type(v) !== 'Reference') {
		return v;
	}
	if (isUnresolvableReference(v)) {
		handleRecoverableNativeException('ReferenceError', 'Cannot dereference ' + v.referencedName + ' of undefined');
		return new UnknownType();
	}
	
	base = getBase(v);
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
 * @name module:Base.putValue
 * @param {module:Base.ReferenceType} v The reference to put the value to
 * @param {module:Base.BaseType} w The value to set
 * @see ECMA-262 Spec Chapter 8.7.2
 */
exports.putValue = putValue;
function putValue(v, w) {

	var base,
		put,
		putThisObj = this;
		
	if (type(v) !== 'Reference') {
		throwNativeException('ReferenceError', 'Attempted to put a value to a non-reference');
	}
	
	base = getBase(v);
	if (isUnresolvableReference(v)) {
		if (isStrictReference(v)) {
			throwNativeException('ReferenceError', v.referencedName + ' is not resolvable');
		}
		Runtime.getGlobalObject().put(getReferencedName(v), w, false);
		Runtime.fireEvent('undeclaredGlobalVariableCreated', 'Automatically creating global variable ' + v.referencedName, {
			name: v.referencedName
		});
	} else if (isPropertyReference(v)) {
		if (hasPrimitiveBase(v)) {
			put = function put(p, w, throwFlag) {
				var o = toObject(base),
					desc,
					canPutP = o.canPut(p);
				if (canPutP === 'Unknown') {
					o.defineOwnProperty({
						value: new UnknownType(),
						writable: false,
						configurable: false,
						enumerable: true
					});
					return;
				}
				if (!canPutP || isDataDescriptor(o.getOwnProperty(p))) {
					if (throwFlag) {
						handleRecoverableNativeException('TypeError', 'Could not put ' + v.referencedName);
					}
					return;
				}
				desc = o.getProperty(p);
				if (isAccessorDescriptor(desc)) {
					desc.setter.call(base, w);
				} else if (throwFlag) {
					handleRecoverableNativeException('TypeError', 'Could not put ' + v.referencedName);
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

/*global
util
FunctionTypeBase
type
NumberType
UnknownType
areAnyUnknown
handleRecoverableNativeException
toInteger
StringType
toNumber
isDefined
ObjectType
addNonEnumerableProperty
*/

/*****************************************
 *
 * Number Protoype Class
 *
 *****************************************/

/**
 * toString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.6.4.2
 */
function NumberProtoToStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(NumberProtoToStringFunc, FunctionTypeBase);
NumberProtoToStringFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var radix = !args || !args[0] || type(args[0]) === 'Undefined' ? new NumberType(10) : args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
		
	// Make sure this is a number
	if (type(thisVal) !== 'Number') {
		if (type(thisVal) === 'Object' && thisVal.className === 'Number') {
			thisVal = new NumberType(thisVal.primitiveValue);
		} else {
			handleRecoverableNativeException('TypeError', 'Value is not a number or number object');
			return new UnknownType();
		}
	}
	
	// Parse the radix
	if (radix && type(radix) !== 'Undefined') {
		radix = toInteger(radix).value;
		if (radix < 2 || radix > 36) {
			handleRecoverableNativeException('RangeError', 'Invalid radix value ' + radix);
			return new UnknownType();
		}
	} else {
		radix = undefined;
	}
	
	// Use the built-in method to perform the toString
	return new StringType(thisVal.value.toString(radix));
};

/**
 * toLocaleString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.6.4.2
 */
function NumberProtoToLocaleStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(NumberProtoToLocaleStringFunc, FunctionTypeBase);
NumberProtoToLocaleStringFunc.prototype.call = function call(thisVal) {
	
	// Use the built-in method to perform the toLocaleString
	return new StringType(toNumber(thisVal).value.toLocaleString());
};

/**
 * valueOf() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.6.4.2
 */
function NumberProtoValueOfFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(NumberProtoValueOfFunc, FunctionTypeBase);
NumberProtoValueOfFunc.prototype.call = function call(thisVal, args) {
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	// Make sure this is a number
	if (type(thisVal) === 'Number') {
		return thisVal;
	} else if (type(thisVal) === 'Object' && thisVal.className === 'Number') {
		return new NumberType(thisVal.primitiveValue);
	}
	handleRecoverableNativeException('TypeError', 'Value is not a number object');
	return new UnknownType();
};

/**
 * toFixed() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.6.4.2
 */
function NumberProtoToFixedFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(NumberProtoToFixedFunc, FunctionTypeBase);
NumberProtoToFixedFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var fractionDigits,
		f;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Step 1
	fractionDigits = args[0];
	f = isDefined(fractionDigits) ? toInteger(fractionDigits).value : 0;
	
	// Step 2
	if (f < 0 || f > 20) {
		handleRecoverableNativeException('RangeError', 'Invalid fraction digits value ' + f);
		return new UnknownType();
	}
	
	// Use the built-in method to perform the toFixed
	return new StringType(toNumber(thisVal).value.toFixed(f));
};

/**
 * toExponential() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.6.4.2
 */
function NumberProtoToExponentialFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(NumberProtoToExponentialFunc, FunctionTypeBase);
NumberProtoToExponentialFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var fractionDigits,
		f;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Step 1
	fractionDigits = args[0];
	f = isDefined(fractionDigits) ? toInteger(fractionDigits).value : 0;
	
	// Step 2
	if (f < 0 || f > 20) {
		handleRecoverableNativeException('RangeError', 'Invalid fraction digits value ' + f);
		return new UnknownType();
	}
	
	// Use the built-in method to perform the toFixed
	return new StringType(toNumber(thisVal).value.toExponential(f));
};

/**
 * toPrecision() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.6.4.2
 */
function NumberProtoToPrecisionFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(NumberProtoToPrecisionFunc, FunctionTypeBase);
NumberProtoToPrecisionFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var precision,
		p;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Step 1
	precision = args[0];
	p = isDefined(precision) ? toInteger(precision).value : 0;
	
	// Step 2
	if (p < 1 || p > 21) {
		handleRecoverableNativeException('RangeError', 'Invalid precision value ' + p);
		return new UnknownType();
	}
	
	// Use the built-in method to perform the toFixed
	return new StringType(toNumber(thisVal).value.toPrecision(p));
};

/**
 * @classdesc The prototype for Booleans
 *
 * @constructor
 * @see ECMA-262 Spec Chapter 15.6.4
 */
exports.NumberPrototypeType = NumberPrototypeType;
function NumberPrototypeType(className) {
	ObjectType.call(this, className || 'Number');
	this.primitiveValue = 0;
	
	addNonEnumerableProperty(this, 'toString', new NumberProtoToStringFunc(), false, true);
	addNonEnumerableProperty(this, 'toLocaleString', new NumberProtoToLocaleStringFunc(), false, true);
	addNonEnumerableProperty(this, 'valueOf', new NumberProtoValueOfFunc(), false, true);
	addNonEnumerableProperty(this, 'toFixed', new NumberProtoToFixedFunc(), false, true);
	addNonEnumerableProperty(this, 'toExponential', new NumberProtoToExponentialFunc(), false, true);
	addNonEnumerableProperty(this, 'toPrecision', new NumberProtoToPrecisionFunc(), false, true);
}
util.inherits(NumberPrototypeType, ObjectType);

/*global
util
FunctionTypeBase
areAnyUnknown
UnknownType
type
StringType
handleRecoverableNativeException
BooleanType
ObjectType
addNonEnumerableProperty
*/

/*****************************************
 *
 * Boolean Prototype Class
 *
 *****************************************/

/**
 * toString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.6.4.2
 */
function BooleanProtoToStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(BooleanProtoToStringFunc, FunctionTypeBase);
BooleanProtoToStringFunc.prototype.call = function call(thisVal, args) {
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Make sure this is a boolean
	if (type(thisVal) !== 'Boolean') {
		if (type(thisVal) === 'Object' && thisVal.className === 'Boolean') {
			return new StringType(thisVal.primitiveValue + '');
		} else {
			handleRecoverableNativeException('TypeError', 'Value is not a boolean or boolean object');
			return new UnknownType();
		}
	} else {
		return new StringType(thisVal.value + '');
	}
};

/**
 * valueOf() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.6.4.2
 */
function BooleanProtoValueOfFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(BooleanProtoValueOfFunc, FunctionTypeBase);
BooleanProtoValueOfFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var b = thisVal;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
		
	if (type(b) !== 'Boolean') {
		if (type(b) === 'Object' && b.className === 'Boolean') {
			b = new BooleanType(b.primitiveValue);
		} else {
			handleRecoverableNativeException('TypeError', 'Value is not a boolean object');
			return new UnknownType();
		}
	}
	return b;
};

/**
 * @classdesc The prototype for Booleans
 *
 * @constructor
 * @see ECMA-262 Spec Chapter 15.6.4
 */
exports.BooleanPrototypeType = BooleanPrototypeType;
function BooleanPrototypeType(className) {
	ObjectType.call(this, className || 'Boolean');
	this.primitiveValue = false;
	
	addNonEnumerableProperty(this, 'toString', new BooleanProtoToStringFunc(), false, true);
	addNonEnumerableProperty(this, 'valueOf', new BooleanProtoValueOfFunc(), false, true);
}
util.inherits(BooleanPrototypeType, ObjectType);

/*global
util
FunctionTypeBase
areAnyUnknown
UnknownType
type
StringType
handleRecoverableNativeException
checkObjectCoercible
toString
toInteger
NumberType
isDefined
toNumber
RegExpType
NullType
ArrayType
isCallable
UndefinedType
toUint32
ObjectType
addNonEnumerableProperty
*/

/*****************************************
 *
 * String Prototype Class
 *
 *****************************************/

/**
 * toString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.2
 */
function StringProtoToStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(StringProtoToStringFunc, FunctionTypeBase);
StringProtoToStringFunc.prototype.call = function call(thisVal, args) {
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Make sure this is a string
	if (type(thisVal) !== 'String') {
		if (type(thisVal) === 'Object' && thisVal.className === 'String') {
			return new StringType(thisVal.primitiveValue + '');
		} else {
			handleRecoverableNativeException('TypeError', 'Value is not a number or number object');
			return new UnknownType();
		}
	} else {
		return new StringType(thisVal.value + '');
	}
};

/**
 * valueOf() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.3
 */
function StringProtoValueOfFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(StringProtoValueOfFunc, FunctionTypeBase);
StringProtoValueOfFunc.prototype.call = function call(thisVal, args) {
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	if (thisVal.className !== 'String') {
		handleRecoverableNativeException('TypeError', 'Value is not a string');
		return new UnknownType();
	}
	if (thisVal.hasOwnProperty('primitiveValue')) {
		return new StringType(thisVal.primitiveValue);
	} else {
		return new StringType(thisVal.value);
	}
};

/**
 * charAt() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.4
 */
function StringProtoCharAtFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
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
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(StringProtoCharCodeAtFunc, FunctionTypeBase);
StringProtoCharCodeAtFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var pos = args[0],
		s,
		position;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal);
	
	// Step 3
	position = toInteger(pos);
	
	// Steps 4-6
	return new NumberType(s.value.charCodeAt(position.value));
};

/**
 * concat() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.6
 */
function StringProtoConcatFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(StringProtoConcatFunc, FunctionTypeBase);
StringProtoConcatFunc.prototype.call = function call(thisVal, args) {
	
	var s,
		i = 0,
		len = args.length;
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Step 3 (deep copy args and convert to values)
	args = [].concat(args);
	for (; i < len; i++) {
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
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(StringProtoIndexOfFunc, FunctionTypeBase);
StringProtoIndexOfFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var searchString = args[0],
		position = args[2],
		s,
		searchStr,
		pos;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
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
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(StringProtoLastIndexOfFunc, FunctionTypeBase);
StringProtoLastIndexOfFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var searchString = args[0],
		position = args[2],
		s,
		searchStr,
		pos;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
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
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(StringProtoLocaleCompareFunc, FunctionTypeBase);
StringProtoLocaleCompareFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var that = args[0],
		s;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
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
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(StringProtoMatchFunc, FunctionTypeBase);
StringProtoMatchFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var regexp = args[0],
		s,
		rx,
		result,
		a,
		i,
		len;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Steps 3 and 4
	if (regexp && regexp.className === 'RegExp') {
		rx = regexp;
	} else {
		if (!regexp || type(regexp) === 'Undefined') {
			rx = new RegExpType('', '');
		} else {
			rx = new RegExpType(toString(regexp).value, '');
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
	a = new ArrayType();
	a.put('index', new NumberType(result.index), false, true);
	a.put('input', rx, false, true);
	for (i = 0, len = result.length; i < len; i++) {
		a.put(i, new StringType(result[i]), false, true);
	}
	a.put('length', new NumberType(result.length), false, true);
	return a;
};

/**
 * replace() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.11
 */
function StringProtoReplaceFunc(className) {
	FunctionTypeBase.call(this, 2, className || 'Function');
}
util.inherits(StringProtoReplaceFunc, FunctionTypeBase);
StringProtoReplaceFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var searchValue = args[0],
		replaceValue = args[1],
		s,
		rx,
		result;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Get the native searchValue
	if (searchValue.className !== 'RegExp') {
		searchValue = toString(searchValue);
	} else {
		searchValue._refreshRegExpFromProperties();
	}
	searchValue = searchValue.value;
	
	// Run the built-in replace method
	if (isCallable(replaceValue)) {
		result = new StringType(s.replace(searchValue, function () {
			var args = [
					new StringType(arguments[0]) // match
				],
				i = 1,
				len = arguments.length - 2;
			
			// Push the matches into the arguments
			for (; i < len; i++) {
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
	if (searchValue.className === 'RegExp') {
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
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(StringProtoSearchFunc, FunctionTypeBase);
StringProtoSearchFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var regexp = args[0],
		string,
		rx,
		result;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	string = toString(thisVal).value;
	
	// Steps 3 and 4
	if (regexp && regexp.className === 'RegExp') {
		rx = regexp;
	} else {
		if (!regexp || type(regexp) === 'Undefined') {
			rx = new RegExpType('', '');
		} else {
			rx = new RegExpType(toString(regexp).value, '');
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
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(StringProtoSliceFunc, FunctionTypeBase);
StringProtoSliceFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var start = args[0],
		end = args[1],
		s;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
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
	FunctionTypeBase.call(this, 2, className || 'Function');
}
util.inherits(StringProtoSplitFunc, FunctionTypeBase);
StringProtoSplitFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var separator = args[0],
		limit = args[1],
		s,
		result,
		a,
		i,
		len;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Convert the separator into a form the native method can use
	if (!separator || type(separator) === 'Undefined') {
		separator = undefined;
	} else if (separator.className === 'RegExp'){
		separator = separator.value;
	} else {
		separator = toString(separator).value;
	}
	
	// Convert the limit into a form the native method can use
	if (!limit || type(limit) === 'Undefined') {
		limit = undefined;
	} else {
		limit = toUint32(limit).value;
	}
	
	// Call the split method
	result = s.split(separator, limit);
	
	// Convert the results and return them
	a = new ArrayType();
	for (i = 0, len = result.length; i < len; i++) {
		a.put(i, new StringType(result[i]), false, true);
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
	FunctionTypeBase.call(this, 2, className || 'Function');
}
util.inherits(StringProtoSubstringFunc, FunctionTypeBase);
StringProtoSubstringFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var start = args[0],
		end = args[1],
		s;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
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
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(StringProtoToLowerCaseFunc, FunctionTypeBase);
StringProtoToLowerCaseFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var s;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
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
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(StringProtoToLocaleLowerCaseFunc, FunctionTypeBase);
StringProtoToLocaleLowerCaseFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var s;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
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
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(StringProtoToUpperCaseFunc, FunctionTypeBase);
StringProtoToUpperCaseFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var s;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
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
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(StringProtoToLocaleUpperCaseFunc, FunctionTypeBase);
StringProtoToLocaleUpperCaseFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var s;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
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
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(StringProtoTrimFunc, FunctionTypeBase);
StringProtoTrimFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var s;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
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
	ObjectType.call(this, className || 'String');
	this.primitiveValue = '';
	addNonEnumerableProperty(this, 'length', new NumberType(0), false, true);
	
	addNonEnumerableProperty(this, 'toString', new StringProtoToStringFunc(), false, true);
	addNonEnumerableProperty(this, 'valueOf', new StringProtoValueOfFunc(), false, true);
	addNonEnumerableProperty(this, 'charAt', new StringProtoCharAtFunc(), false, true);
	addNonEnumerableProperty(this, 'charCodeAt', new StringProtoCharCodeAtFunc(), false, true);
	addNonEnumerableProperty(this, 'concat', new StringProtoConcatFunc(), false, true);
	addNonEnumerableProperty(this, 'indexOf', new StringProtoIndexOfFunc(), false, true);
	addNonEnumerableProperty(this, 'lastIndexOf', new StringProtoLastIndexOfFunc(), false, true);
	addNonEnumerableProperty(this, 'localeCompare', new StringProtoLocaleCompareFunc(), false, true);
	addNonEnumerableProperty(this, 'match', new StringProtoMatchFunc(), false, true);
	addNonEnumerableProperty(this, 'replace', new StringProtoReplaceFunc(), false, true);
	addNonEnumerableProperty(this, 'search', new StringProtoSearchFunc(), false, true);
	addNonEnumerableProperty(this, 'slice', new StringProtoSliceFunc(), false, true);
	addNonEnumerableProperty(this, 'split', new StringProtoSplitFunc(), false, true);
	addNonEnumerableProperty(this, 'substring', new StringProtoSubstringFunc(), false, true);
	addNonEnumerableProperty(this, 'toLowerCase', new StringProtoToLowerCaseFunc(), false, true);
	addNonEnumerableProperty(this, 'toLocaleLowerCase', new StringProtoToLocaleLowerCaseFunc(), false, true);
	addNonEnumerableProperty(this, 'toUpperCase', new StringProtoToUpperCaseFunc(), false, true);
	addNonEnumerableProperty(this, 'toLocaleUpperCase', new StringProtoToLocaleUpperCaseFunc(), false, true);
	addNonEnumerableProperty(this, 'trim', new StringProtoTrimFunc(), false, true);
}
util.inherits(StringPrototypeType, ObjectType);

/*global
util
FunctionTypeBase
StringType
UnknownType
areAnyUnknown
type
toObject
isCallable
handleRecoverableNativeException
toString
BooleanType
isObject
isType
isDefined
ObjectType
addNonEnumerableProperty
*/

/*****************************************
 *
 * Object Prototype Class
 *
 *****************************************/

/**
 * toString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.2.4.2
 */
function ObjectProtoToStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(ObjectProtoToStringFunc, FunctionTypeBase);
ObjectProtoToStringFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var result = new StringType();
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	if (type(thisVal) === 'Undefined') {
		result.value = '[object Undefined]';
	} else if (type(thisVal) === 'Null') {
		result.value = '[object Null]';
	} else {
		result.value = '[object ' + toObject(thisVal).className + ']';
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
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(ObjectProtoToLocaleStringFunc, FunctionTypeBase);
ObjectProtoToLocaleStringFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o,
		toString;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	o = toObject(thisVal),
	toString = o.get('toString');
	if (type(toString) === 'Unknown') {
		return new UnknownType();
	} else if (!isCallable(toString)) {
		handleRecoverableNativeException('TypeError', 'toString is not callable');
		return new UnknownType();
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
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(ObjectProtoValueOfFunc, FunctionTypeBase);
ObjectProtoValueOfFunc.prototype.call = function call(thisVal, args) {
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Convert to an object
	return toObject(thisVal);
};

/**
 * hasOwnProperty() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.2.4.5
 */
function ObjectProtoHasOwnPropertyFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ObjectProtoHasOwnPropertyFunc, FunctionTypeBase);
ObjectProtoHasOwnPropertyFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var p,
		o,
		desc;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	p = toString(args[0]);
	o = toObject(thisVal);
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
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ObjectProtoIsPrototypeOfFunc, FunctionTypeBase);
ObjectProtoIsPrototypeOfFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var result = new BooleanType(),
		o,
		v = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	if (isObject(v)) {
		o = toObject(thisVal);
		while (true) {
			if (v === v.objectPrototype) {
				break;
			}
			v = v.objectPrototype;
			if (v && v.objectPrototype && type(v.objectPrototype) === 'Unknown') {
				return new UnknownType();
			}
			if (!v || isType(v, ['Undefined', 'Null'])) {
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
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ObjectProtoPropertyIsEnumerableFunc, FunctionTypeBase);
ObjectProtoPropertyIsEnumerableFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var p,
		o,
		desc;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	p = toString(args[0]);
	o = toObject(thisVal);
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
	ObjectType.call(this, className || 'Object');
	
	addNonEnumerableProperty(this, 'toString', new ObjectProtoToStringFunc(), false, true);
	addNonEnumerableProperty(this, 'toLocaleString', new ObjectProtoToLocaleStringFunc(), false, true);
	addNonEnumerableProperty(this, 'valueOf', new ObjectProtoValueOfFunc(), false, true);
	addNonEnumerableProperty(this, 'hasOwnProperty', new ObjectProtoHasOwnPropertyFunc(), false, true);
	addNonEnumerableProperty(this, 'isPrototypeOf', new ObjectProtoIsPrototypeOfFunc(), false, true);
	addNonEnumerableProperty(this, 'propertyIsEnumerable', new ObjectProtoPropertyIsEnumerableFunc(), false, true);
}
util.inherits(ObjectPrototypeType, ObjectType);

/*global
util
FunctionTypeBase
areAnyUnknown
UnknownType
toObject
type
isCallable
ObjectProtoToStringFunc
toUint32
StringType
isType
handleRecoverableNativeException
ArrayType
NumberType
toString
UndefinedType
toInteger
strictEquals
BooleanType
toBoolean
ObjectType
ObjectProtoValueOfFunc
ObjectProtoHasOwnPropertyFunc
ObjectProtoIsPrototypeOfFunc
ObjectProtoPropertyIsEnumerableFunc
addNonEnumerableProperty
*/

/*****************************************
 *
 * Array Prototype Class
 *
 *****************************************/

/**
 * toString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.2
 */
function ArrayProtoToStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(ArrayProtoToStringFunc, FunctionTypeBase);
ArrayProtoToStringFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations,
	var array,
		func;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1 and 2
	array = toObject(thisVal);
	func = array.get('join');
	
	// Step 3
	if (type(func) === 'Unknown') {
		return new UnknownType();
	} else if (!isCallable(func)) {
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
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(ArrayProtoToLocaleStringFunc, FunctionTypeBase);
ArrayProtoToLocaleStringFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var array,
		len,
		separator,
		firstElement,
		r,
		func,
		elementObj,
		k,
		s,
		nextElement;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-4
	array = toObject(thisVal);
	len = toUint32(array.get('length')).value;
	separator = ',';
	k = 1;
	
	// Step 5
	if (len === 0) {
		return new StringType();
	}
	
	// Step 6
	firstElement = array.get(0);
	
	// Steps 7 and 8
	if (isType(firstElement, ['Undefined', 'Null'])) {
		r = '';
	} else {
		elementObj = toObject(firstElement);
		func = elementObj.get('toLocaleString');
		if (type(elementObj) === 'Unknown' || type(func) === 'Unknown') {
			return new UnknownType();
		}
		if (!isCallable(func)) {
			handleRecoverableNativeException('TypeError', 'toLocaleString is not callable');
			return new UnknownType();
		}
		r = func.call(elementObj, []).value;
	}
	
	// Step 10
	while (k < len) {
		s = r + separator;
		nextElement = array.get(k);
		if (isType(nextElement, ['Undefined', 'Null'])) {
			r = '';
		} else {
			elementObj = toObject(nextElement);
			func = elementObj.get('toLocaleString');
			if (type(elementObj) === 'Unknown' || type(func) === 'Unknown') {
				return new UnknownType();
			}
			if (!isCallable(func)) {
				handleRecoverableNativeException('TypeError', 'toLocaleString is not callable');
				return new UnknownType();
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
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ArrayProtoConcatFunc, FunctionTypeBase);
ArrayProtoConcatFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o,
		a,
		n,
		items,
		e,
		k,
		len;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-4
	o = toObject(thisVal);
	a = new ArrayType();
	n = 0;
	items = [o].concat(args);
		
	// Step 5
	while (items.length) {
		
		// Step 5.a
		e = items.shift();
		
		if (e.className === 'Array') { // Step 5.b
			k = 0;
			len = e.get('length').value;
			while (k < len) {
				if (e.hasProperty(k)) {
					a.defineOwnProperty(n, {
						value: e.get(k),
						writable: true,
						enumerable: true,
						configurable: true
					}, false, true);
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
			}, false, true);
			n++;
		}
	}
	
	// Why is length not set in the spec? Seems to be an omissions since other methods (like pop) do it.
	a._addProperty('length', {
		value: new NumberType(n),
		writable: true,
		enumerable: false,
		configurable: false
	});
	
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
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ArrayProtoJoinFunc, FunctionTypeBase);
ArrayProtoJoinFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var separator,
		o,
		len,
		sep,
		r,
		element0,
		k,
		s,
		element,
		next;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-3
	separator = args[0];
	o = toObject(thisVal);
	len = toUint32(o.get('length')).value;
	k = 1;
	
	// Steps 4 and 5
	if (!separator || type(separator) === 'Undefined') {
		sep = ',';
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
	if (isType(element0, ['Undefined', 'Null'])) {
		r = '';
	} else {
		r = toString(element0).value;
	}
	
	// Step 10
	while (k < len) {
		s = r + sep;
		element = o.get(k);
		if (isType(element, ['Undefined', 'Null'])) {
			next = '';
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
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(ArrayProtoPopFunc, FunctionTypeBase);
ArrayProtoPopFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o,
		len,
		indx,
		element;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-3
	o = toObject(thisVal);
	len = toUint32(o.get('length')).value;
	
	// Steps 4 and 5
	if (len === 0) {
		o._addProperty('length', {
			value: new NumberType(0),
			writable: true,
			enumerable: false,
			configurable: false
		});
		return new UndefinedType();
	} else {
		indx = len - 1;
		element = o.get(indx);
		o['delete'](indx, true);
		o._addProperty('length', {
			value: new NumberType(indx),
			writable: true,
			enumerable: false,
			configurable: false
		});
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
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ArrayProtoPushFunc, FunctionTypeBase);
ArrayProtoPushFunc.prototype.call = function call(thisVal, args) {
	
	// Steps 1-4
	var o,
		n,
		items,
		lengthNumber;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-4
	o = toObject(thisVal);
	n = toUint32(o.get('length')).value;
	items = args;
	lengthNumber = new NumberType();
		
	// Step 5
	while (items.length) {
		o.put(n++, items.shift(), true, true);
	}
	
	// Step 6
	lengthNumber.value = n;
	o._addProperty('length', {
		value: lengthNumber,
		writable: true,
		enumerable: false,
		configurable: false
	});
	
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
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(ArrayProtoReverseFunc, FunctionTypeBase);
ArrayProtoReverseFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o,
		len,
		upper,
		middle,
		lower,
		upperValue,
		lowerValue,
		lowerExists,
		upperExists;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-5
	o = toObject(thisVal);
	len = toUint32(o.get('length')).value;
	middle = Math.floor(len / 2);
	lower = 0;
		
	// Step 6
	while (lower !== middle) {
		upper = len - lower - 1;
		
		lowerValue = o.get(lower);
		upperValue = o.get(upper);
		
		lowerExists = o.hasProperty(lower);
		upperExists = o.hasProperty(upper);
		
		if (lowerExists && upperExists) {
			o.put(lower, upperValue, true, true);
			o.put(upper, lowerValue, true, true);
		} else if (upperExists) {
			o.put(lower, upperValue, true, true);
			o['delete'](upper, true);
		} else if (lowerExists) {
			o['delete'](o, lower);
			o.put(upper, lowerValue, true, true);
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
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(ArrayProtoShiftFunc, FunctionTypeBase);
ArrayProtoShiftFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o,
		len,
		first,
		k,
		from,
		to;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-3
	o = toObject(thisVal);
	len = toUint32(o.get('length')).value;
	k = 1;
	
	// Step 4
	if (len === 0) {
		o._addProperty('length', {
			value: new NumberType(0),
			writable: true,
			enumerable: false,
			configurable: false
		});
		return new UndefinedType();
	}
	
	// Step 5
	first = o.get(0);
	
	// Step 7
	while (k < len) {
		from = k;
		to = k - 1;
		
		if (o.hasProperty(from)) {
			o.put(to, o.get(from), true, true);
		} else {
			o['delete'](to, true);
		}
		k++;
	}
	
	// Step 8
	o['delete'](len - 1, true);
	
	// Step 9
	o._addProperty('length', {
		value: new NumberType(len - 1),
		writable: true,
		enumerable: false,
		configurable: false
	});
	
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
	FunctionTypeBase.call(this, 2, className || 'Function');
}
util.inherits(ArrayProtoSliceFunc, FunctionTypeBase);
ArrayProtoSliceFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var start,
		end,
		o,
		a,
		len,
		relativeStart,
		k,
		relativeEnd,
		finalVal,
		n;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-9
	start = args[0] || new NumberType(0);
	end = args[1];
	o = toObject(thisVal);
	a = new ArrayType();
	len = toUint32(o.get('length')).value;
	relativeStart = toInteger(start).value;
	k = relativeStart < 0 ? Math.max(len + relativeStart, 0) : Math.min(relativeStart, len);
	relativeEnd = !end || type(end) === 'Undefined' ? len : toInteger(end).value;
	finalVal = relativeEnd < 0 ? Math.max(len + relativeEnd, 0) : Math.min(relativeEnd, len);
	n = 0;
	
	// Step 10
	while (k < finalVal) {
		if (o.hasProperty(k)) {
			a.defineOwnProperty(n, {
				value: o.get(k),
				writable: true,
				enumerable: true,
				configurable: true
			}, false, true);
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
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(ArrayProtoSortFunc, FunctionTypeBase);
ArrayProtoSortFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var compareFn,
		o,
		len,
		changes;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	compareFn = args[0];
	o = toObject(thisVal);
	len = toUint32(o.get('length')).value;
	changes = true;
	
	function swapValues(j, k) {
		var jValue,
			kValue;
		
		// Pull the values out of the array, if they exist
		if (o.hasProperty(j)) {
			jValue = o.get(j);
			o['delete'](j, true);
		}
		if (o.hasProperty(k)) {
			kValue = o.get(k);
			o['delete'](k, true);
		}
		
		// Put the values back into the array in their swapped positions
		if (jValue) {
			o.put(k, jValue, true, true);
		}
		if (kValue) {
			o.put(j, kValue, true, true);
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
		if (xType === 'Unknown' || yType === 'Unknown') {
			return NaN;
		}
		if (xType === 'Undefined' && yType === 'Undefined') {
			return 0;
		}
		if (xType === 'Undefined') {
			return 1;
		}
		if (yType === 'Undefined') {
			return -1;
		}
		
		// Step 13
		if (compareFn && type(compareFn) !== 'Undefined') {
			if (type(compareFn) === 'Unknown') {
				throw 'Unknown';
			}
			if (!isCallable(compareFn)) {
				handleRecoverableNativeException('TypeError', 'Compare funciton is not callable');
				return new UnknownType();
			}
			return compareFn.call(new UndefinedType(), [x, y]).value;
		}
		
		// Note: the spec says to always convert to a string and compare, but string comparisons don't work the same as
		// number comparisons in JavaScript, so we have to handle numbers specially (i.e. 1 < 10 !== '1' < '10')
		if (xType !== 'Number' || yType !== 'Number') {
		
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
			i,
			sortResult;
		
		if (leftIndex < rightIndex) {
			
			// Swap the pivot and right values
			swapValues(pivotIndex, rightIndex);
		
			// Sort the array into the two pivot arrays
			for (i = leftIndex; i < rightIndex; i++) {
				
				// Compare i and the store index, and swap if necessary
				sortResult = sortCompare(i, rightIndex);
				if (isNaN(sortResult)) {
					throw 'Unknown';
				} else if (sortResult < 0) {
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
	try {
		sort(0, len - 1);
	} catch(e) {
		var integerRegex = /^[0-9]*$/;
		if (e === 'Unknown') {
			this._getPropertyNames().forEach(function (propName) {
				if (integerRegex.test(propName)) {
					this._addProperty(propName, {
						value: new UnknownType(),
						writable: false,
						configurable: false,
						enumerable: true
					});
				}
			}.bind(this));
		} else {
			throw e;
		}
	}
	
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
	FunctionTypeBase.call(this, 2, className || 'Function');
}
util.inherits(ArrayProtoSpliceFunc, FunctionTypeBase);
ArrayProtoSpliceFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var start,
		deleteCount,
		o,
		a,
		len,
		relativeStart,
		actualStart,
		actualDeleteCount,
		k,
		from,
		to,
		items,
		itemCount;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-8
	start = args[0];
	deleteCount = args[1];
	o = toObject(thisVal);
	a = new ArrayType();
	len = toUint32(o.get('length')).value;
	relativeStart = toUint32(start).value;
	actualStart = relativeStart < 0 ? Math.max(len + relativeStart, 0) : Math.min(relativeStart, len);
	actualDeleteCount = Math.min(Math.max(toInteger(deleteCount).value, 0), len - actualStart);
	k = 0;
	
	// Step 9
	while (k < actualDeleteCount) {
		from = actualStart + k;
		if (o.hasProperty(from)) {
			a.defineOwnProperty(k, {
				value: o.get(from),
				writable: true,
				enumerable: true,
				configurable: true
			}, false, true);
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
				o.put(to, o.get(from), true, true);
			} else {
				o['delete'](to, true, true);
			}
			k++;
		}
		k = len;
		while (k > len - actualDeleteCount + itemCount) {
			o['delete'](k - 1, true);
			k--;
		}
	} else if (itemCount > actualDeleteCount) {
		k = len - actualDeleteCount;
		while (k > actualStart) {
			from = k + actualDeleteCount - 1;
			to = k + itemCount - 1;
			
			if (o.hasProperty(from)) {
				o.put(to, o.get(from), true, true);
			} else {
				o['delete'](to, true);
			}
			
			k--;
		}
	}
	
	// Step 14
	k = actualStart;
	
	// Step 15
	while (items.length) {
		o.put(k, items.shift(), true, true);
		k++;
	}
	
	// Step 16
	o._addProperty('length', {
		value: new NumberType(len - actualDeleteCount + itemCount),
		writable: true,
		enumerable: false,
		configurable: false
	});
	
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
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ArrayProtoUnshiftFunc, FunctionTypeBase);
ArrayProtoUnshiftFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o = toObject(thisVal),
		len = toUint32(o.get('length')).value,
		argCount = args.length,
		k = len,
		from,
		to,
		j,
		items;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-5
	o = toObject(thisVal);
	len = toUint32(o.get('length')).value;
	argCount = args.length;
	k = len;
		
	// Step 6
	while (k > 0) {
		from = k - 1;
		to = k + argCount - 1;
		
		if (o.hasProperty(from)) {
			o.put(to, o.get(from), true, true);
		} else {
			o['delete'](to, true, true);
		}
		
		k--;
	}
	
	// Step 7 and 8
	j = 0;
	items = args;
	
	// Step 9
	while (items.length) {
		o.put(j++, items.shift(), true, true);
	}
	
	// Step 10
	o._addProperty('length', {
		value: new NumberType(len + argCount),
		writable: true,
		enumerable: false,
		configurable: false
	});
	
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
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ArrayProtoIndexOfFunc, FunctionTypeBase);
ArrayProtoIndexOfFunc.prototype.call = function call(thisVal, args) {
	
	// Steps 1-3
	var searchElement = args[0],
		fromIndex = args[1],
		o = toObject(thisVal),
		len = toUint32(o.get('length')).value,
		n = 0,
		k,
		elementK;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-3
	searchElement = args[0];
	fromIndex = args[1];
	o = toObject(thisVal);
	len = toUint32(o.get('length')).value;
	n = 0;
		
	// Step 4
	if (len === 0) {
		return new NumberType(-1);
	}
	
	// Step 5
	if (fromIndex && type(fromIndex) !== 'Undefined') {
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
			if (type(elementK) === 'Unknown') {
				return new UnknownType();
			}
			if (strictEquals(searchElement, elementK)) {
				return new NumberType(k);
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
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(ArrayProtoLastIndexOfFunc, FunctionTypeBase);
ArrayProtoLastIndexOfFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var searchElement,
		fromIndex,
		o,
		len,
		n,
		k,
		elementK;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-3
	searchElement = args[0];
	fromIndex = args[1];
	o = toObject(thisVal);
	len = toUint32(o.get('length')).value;
	n = len - 1;
	
	// Step 4
	if (len === 0) {
		return new NumberType(-1);
	}
	
	// Step 5
	if (fromIndex && type(fromIndex) !== 'Undefined') {
		n = toInteger(fromIndex).value;
	}
	
	// Steps 6 and 7
	k = n >= 0 ? Math.min(n, len - 1) : len - Math.abs(n);
	
	// Step 8
	while (k >= 0) {
		if (o.hasProperty(k)) {
			elementK = o.get(k);
			if (type(elementK) === 'Unknown') {
				return new UnknownType();
			}
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
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ArrayProtoEveryFunc, FunctionTypeBase);
ArrayProtoEveryFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var callbackFn,
		thisArg,
		o,
		len,
		t,
		k;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-3
	callbackFn = args[0];
	thisArg = args[1];
	o = toObject(thisVal);
	len = toUint32(o.get('length')).value;
	k = 0;
	
	// Step 4
	if (!isCallable(callbackFn)) {
		handleRecoverableNativeException('TypeError', 'Callback function is not callable');
		return new UnknownType();
	}
	
	// Step 5
	t = callbackFn && type(callbackFn) === 'Undefined' ? callbackFn : new UndefinedType();
	
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
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ArrayProtoSomeFunc, FunctionTypeBase);
ArrayProtoSomeFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var callbackFn,
		thisArg,
		o,
		len,
		t,
		k;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-3
	callbackFn = args[0];
	thisArg = args[1];
	o = toObject(thisVal);
	len = toUint32(o.get('length')).value;
	k = 0;
	
	if (type(callbackFn) === 'Unknown' || type(thisArg) === 'Unknown') {
		return new UnknownType();
	}
	
	// Step 4
	if (!isCallable(callbackFn)) {
		handleRecoverableNativeException('TypeError', 'Callback function is not callable');
		return new UnknownType();
	}
	
	// Step 5
	t = callbackFn && type(callbackFn) === 'Undefined' ? callbackFn : new UndefinedType();
	
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
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ArrayProtoForEachFunc, FunctionTypeBase);
ArrayProtoForEachFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var callbackFn,
		thisArg,
		o,
		len,
		t,
		k;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-3
	callbackFn = args[0];
	thisArg = args[1];
	o = toObject(thisVal);
	len = toUint32(o.get('length')).value;
	k = 0;
	
	// Step 4
	if (!isCallable(callbackFn)) {
		handleRecoverableNativeException('TypeError', 'Callback function is not callable');
		return new UnknownType();
	}
	
	// Step 5
	t = callbackFn && type(callbackFn) === 'Undefined' ? callbackFn : new UndefinedType();
	
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
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ArrayProtoMapFunc, FunctionTypeBase);
ArrayProtoMapFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var callbackFn,
		thisArg,
		o,
		len,
		t,
		a,
		k;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-3
	callbackFn = args[0];
	thisArg = args[1];
	o = toObject(thisVal);
	len = toUint32(o.get('length')).value;
	k = 0;
	
	// Step 4
	if (!isCallable(callbackFn)) {
		handleRecoverableNativeException('TypeError', 'Callback function is not callable');
		return new UnknownType();
	}
	
	// Step 5
	t = callbackFn && type(callbackFn) === 'Undefined' ? callbackFn : new UndefinedType();
	
	// Step 6
	a = new ArrayType();
	a._addProperty('length', {
		value: new NumberType(len),
		writable: true,
		enumerable: false,
		configurable: false
	});
	
	// Step 8
	while (k < len) {
		if (o.hasProperty(k)) {
			a.defineOwnProperty(k, {
				value: callbackFn.call(t, [o.get(k), new NumberType(k), o]),
				writable: true,
				enumerable: true,
				configurable: true
			}, false, true);
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
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ArrayProtoFilterFunc, FunctionTypeBase);
ArrayProtoFilterFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var callbackFn,
		thisArg,
		o,
		len,
		t,
		a,
		k,
		to,
		kValue;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-3
	callbackFn = args[0];
	thisArg = args[1];
	o = toObject(thisVal);
	len = toUint32(o.get('length')).value;
	k = 0;
	to = 0;
	
	// Step 4
	if (!isCallable(callbackFn)) {
		handleRecoverableNativeException('TypeError', 'Callback function is not callable');
		return new UnknownType();
	}
	
	// Step 5
	t = callbackFn && type(callbackFn) === 'Undefined' ? callbackFn : new UndefinedType();
	
	// Step 6
	a = new ArrayType();
	a._addProperty('length', {
		value: new NumberType(len),
		writable: true,
		enumerable: false,
		configurable: false
	});
	
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
				}, false, true);
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
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ArrayProtoReduceFunc, FunctionTypeBase);
ArrayProtoReduceFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var callbackFn,
		initialValue,
		o,
		len,
		k,
		to,
		accumulator,
		kPresent,
		undef;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-3
	callbackFn = args[0];
	initialValue = args[1];
	o = toObject(thisVal);
	len = toUint32(o.get('length')).value;
	k = 0;
	to = 0;
	undef = new UndefinedType();
	
	// Step 4
	if (!isCallable(callbackFn)) {
		handleRecoverableNativeException('TypeError', 'Callback function is not callable');
		return new UnknownType();
	}
	
	// Step 5
	if (len === 0 && !initialValue) {
		handleRecoverableNativeException('TypeError', 'Missing initial value');
		return new UnknownType();
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
			handleRecoverableNativeException('TypeError', 'Missing property ' + k);
			return new UnknownType();
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
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ArrayReduceRightFunc, FunctionTypeBase);
ArrayReduceRightFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var callbackFn,
		initialValue,
		o,
		len,
		k,
		to,
		accumulator,
		kPresent,
		undef;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-3
	callbackFn = args[0];
	initialValue = args[1];
	o = toObject(thisVal);
	len = toUint32(o.get('length')).value;
	k = len - 1;
	to = 0;
	undef = new UndefinedType();
	
	// Step 4
	if (!isCallable(callbackFn)) {
		handleRecoverableNativeException('TypeError', 'Callback function is not callable');
		return new UnknownType();
	}
	
	// Step 5
	if (len === 0 && !initialValue) {
		handleRecoverableNativeException('TypeError', 'Missing initial value');
		return new UnknownType();
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
			handleRecoverableNativeException('TypeError', 'Missing property ' + k);
			return new UnknownType();
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
	
	// Object prototype methods
	addNonEnumerableProperty(this, 'valueOf', new ObjectProtoValueOfFunc(), false, true);
	addNonEnumerableProperty(this, 'hasOwnProperty', new ObjectProtoHasOwnPropertyFunc(), false, true);
	addNonEnumerableProperty(this, 'isPrototypeOf', new ObjectProtoIsPrototypeOfFunc(), false, true);
	addNonEnumerableProperty(this, 'propertyIsEnumerable', new ObjectProtoPropertyIsEnumerableFunc(), false, true);
	
	// Array prototype methods
	addNonEnumerableProperty(this, 'toString', new ArrayProtoToStringFunc(), false, true);
	addNonEnumerableProperty(this, 'toLocaleString', new ArrayProtoToLocaleStringFunc(), false, true);
	addNonEnumerableProperty(this, 'concat', new ArrayProtoConcatFunc(), false, true);
	addNonEnumerableProperty(this, 'join', new ArrayProtoJoinFunc(), false, true);
	addNonEnumerableProperty(this, 'pop', new ArrayProtoPopFunc(), false, true);
	addNonEnumerableProperty(this, 'push', new ArrayProtoPushFunc(), false, true);
	addNonEnumerableProperty(this, 'reverse', new ArrayProtoReverseFunc(), false, true);
	addNonEnumerableProperty(this, 'shift', new ArrayProtoShiftFunc(), false, true);
	addNonEnumerableProperty(this, 'slice', new ArrayProtoSliceFunc(), false, true);
	addNonEnumerableProperty(this, 'sort', new ArrayProtoSortFunc(), false, true);
	addNonEnumerableProperty(this, 'splice', new ArrayProtoSpliceFunc(), false, true);
	addNonEnumerableProperty(this, 'unshift', new ArrayProtoUnshiftFunc(), false, true);
	addNonEnumerableProperty(this, 'indexOf', new ArrayProtoIndexOfFunc(), false, true);
	addNonEnumerableProperty(this, 'lastIndexOf', new ArrayProtoLastIndexOfFunc(), false, true);
	addNonEnumerableProperty(this, 'every', new ArrayProtoEveryFunc(), false, true);
	addNonEnumerableProperty(this, 'some', new ArrayProtoSomeFunc(), false, true);
	addNonEnumerableProperty(this, 'forEach', new ArrayProtoForEachFunc(), false, true);
	addNonEnumerableProperty(this, 'map', new ArrayProtoMapFunc(), false, true);
	addNonEnumerableProperty(this, 'filter', new ArrayProtoFilterFunc(), false, true);
	addNonEnumerableProperty(this, 'reduce', new ArrayProtoReduceFunc(), false, true);
	addNonEnumerableProperty(this, 'reduceRight', new ArrayReduceRightFunc(), false, true);
}
util.inherits(ArrayPrototypeType, ObjectType);

/*global
util
FunctionTypeBase
areAnyUnknown
UnknownType
toString
ArrayType
NullType
NumberType
StringType
toBoolean
ObjectType
addNonEnumerableProperty
*/

/*****************************************
 *
 * RegExp Prototype Class
 *
 *****************************************/

/**
 * exec() prototype method. Note: here we wrap node's native exec method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.10.6.2 and https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/RegExp/exec
 */
function RegExpProtoExecFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(RegExpProtoExecFunc, FunctionTypeBase);
RegExpProtoExecFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var r,
		rValue,
		s,
		result,
		a,
		i,
		len;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Initialize values
	r = thisVal;
	rValue = r.value;
	s = toString(args[0]);
	a = new ArrayType();
	
	// Update lastIndex since it's writeable
	rValue.lastIndex = r.get('lastIndex').value;
	
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
	a.put('index', new NumberType(result.index), false, true);
	a.put('input', s, false, true);
	for (i = 0, len = result.length; i < len; i++) {
		a.put(i, new StringType(result[i]), false, true);
	}
	a.put('length', new NumberType(result.length), false, true);
	return a;
};

/**
 * test() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.10.6.3
 */
function RegExpProtoTestFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(RegExpProtoTestFunc, FunctionTypeBase);
RegExpProtoTestFunc.prototype.call = function call(thisVal, args) {
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	return toBoolean(RegExpProtoExecFunc.prototype.call(thisVal, args));
};

/**
 * toString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.10.6.4
 */
function RegExpProtoToStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(RegExpProtoToStringFunc, FunctionTypeBase);
RegExpProtoToStringFunc.prototype.call = function call(thisVal, args) {
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
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
	
	addNonEnumerableProperty(this, 'exec', new RegExpProtoExecFunc(), false, true);
	addNonEnumerableProperty(this, 'test', new RegExpProtoTestFunc(), false, true);
	addNonEnumerableProperty(this, 'toString', new RegExpProtoToStringFunc(), false, true);
}
util.inherits(RegExpPrototypeType, ObjectType);

/*global
util
FunctionTypeBase
areAnyUnknown
UnknownType
handleRecoverableNativeException
ObjectProtoToStringFunc
UndefinedType
isCallable
isType
isObject
toUint32
FunctionType
NumberType
throwTypeError
ObjectProtoToLocaleStringFunc
ObjectProtoValueOfFunc
ObjectProtoHasOwnPropertyFunc
ObjectProtoIsPrototypeOfFunc
ObjectProtoPropertyIsEnumerableFunc
addNonEnumerableProperty
*/

/*****************************************
 *
 * Function Prototype Class
 *
 *****************************************/

/**
 * toString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.2.4.2
 */
function FunctionProtoToStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(FunctionProtoToStringFunc, FunctionTypeBase);
FunctionProtoToStringFunc.prototype.call = function call(thisVal, args) {
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	if (thisVal.className !== 'Function') {
		handleRecoverableNativeException('TypeError', 'Cannot invoke non-function type');
		return new UnknownType();
	}
	return ObjectProtoToStringFunc.prototype.call.apply(this, arguments);
};

/**
 * apply() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.2.4.2
 */
function FunctionProtoApplyFunc(className) {
	FunctionTypeBase.call(this, 2, className || 'Function');
}
util.inherits(FunctionProtoApplyFunc, FunctionTypeBase);
FunctionProtoApplyFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var thisArg = args[0],
		argArray = args[1],
		len,
		argList = [],
		i = 0;
	
	if (!thisArg) {
		thisArg = new UndefinedType();
	}

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	if (!isCallable(thisVal)) {
		handleRecoverableNativeException('TypeError', 'Attempted to call non-callable value');
		return new UnknownType();
	}
	
	if (!argArray || isType(argArray, ['Undefined', 'Null'])) {
		return thisVal.call(thisArg, []);
	}
	
	if (!isObject(argArray)) {
		handleRecoverableNativeException('TypeError', 'Arguments value is not an object');
		return new UnknownType();
	}
	
	len = toUint32(argArray.get('length')).value;
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
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(FunctionProtoCallFunc, FunctionTypeBase);
FunctionProtoCallFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var thisArg = args[0],
		argList = [],
		i = 1,
		len = args.length;
	
	if (!thisArg) {
		thisArg = new UndefinedType();
	}

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	if (!isCallable(thisVal)) {
		handleRecoverableNativeException('TypeError', 'Attempted to call non-callable value');
		return new UnknownType();
	}
	
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
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(FunctionProtoBindFunc, FunctionTypeBase);
FunctionProtoBindFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var target = thisVal,
		thisArg = args[0],
		a = args.slice(1),
		f;
	
	if (!thisArg) {
		thisArg = new UndefinedType();
	}
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	if (!isCallable(target)) {
		handleRecoverableNativeException('TypeError', 'Attempted to call non-callable value');
		return new UnknownType();
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
			handleRecoverableNativeException('TypeError', 'Bind target does not have a constructor');
			return new UnknownType();
		}
		return target.construct(a.concat(extraArgs));
	};
	
	// Set the hasInstance method
	f.hasInstance = function hasInstance(v) {
		if (!target.hasInstance) {
			handleRecoverableNativeException('TypeError', 'Bind target does not have a hasInstance method');
			return new UnknownType();
		}
		return target.hasInstance(v);
	};
	
	// Set the length property
	f.put('length', new NumberType(target.className === 'Function' ?
		Math.max(0, target.get('length').value - a.length) : 0), false, true);
	
	// Set caller and arguments to thrower
	f.defineOwnProperty('caller', {
		get: throwTypeError,
		set: throwTypeError,
		enumerable: false,
		configurable: false
	}, false, true);
	f.defineOwnProperty('arguments', {
		get: throwTypeError,
		set: throwTypeError,
		enumerable: false,
		configurable: false
	}, false, true);
	
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
	FunctionTypeBase.call(this, 0, className || 'Function');
	
	// Object prototype methods
	addNonEnumerableProperty(this, 'toLocaleString', new ObjectProtoToLocaleStringFunc(), false, true);
	addNonEnumerableProperty(this, 'valueOf', new ObjectProtoValueOfFunc(), false, true);
	addNonEnumerableProperty(this, 'hasOwnProperty', new ObjectProtoHasOwnPropertyFunc(), false, true);
	addNonEnumerableProperty(this, 'isPrototypeOf', new ObjectProtoIsPrototypeOfFunc(), false, true);
	addNonEnumerableProperty(this, 'propertyIsEnumerable', new ObjectProtoPropertyIsEnumerableFunc(), false, true);
	
	// Function prototype methods
	addNonEnumerableProperty(this, 'toString', new FunctionProtoToStringFunc(), false, true);
	addNonEnumerableProperty(this, 'apply', new FunctionProtoApplyFunc(), false, true);
	addNonEnumerableProperty(this, 'call', new FunctionProtoCallFunc(), false, true);
	addNonEnumerableProperty(this, 'bind', new FunctionProtoBindFunc(), false, true);
}
util.inherits(FunctionPrototypeType, FunctionTypeBase);

/**
 * @classdesc The call method of function prototoypes
 *
 * @method
 * @see ECMA-262 Spec Chapter 15.3.4
 */
FunctionPrototypeType.prototype.call = function call() {
	return new UndefinedType();
};

/*global
util
FunctionTypeBase
areAnyUnknown
UnknownType
handleRecoverableNativeException
type
StringType
toString
addNonEnumerableProperty
*/

/*****************************************
 *
 * Error Prototype Class
 *
 *****************************************/

/**
 * toString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.11.4.4
 */
function ErrorProtoToStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(ErrorProtoToStringFunc, FunctionTypeBase);
ErrorProtoToStringFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o = thisVal,
		name,
		msg;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Step 2
	if (type(o) !== 'Object') {
		handleRecoverableNativeException('TypeError', 'Value is not an object');
		return new UnknownType();
	}
	
	// Steps 3 and 4
	name = o.get('name');
	if (type(name) === 'Undefined') {
		name = new StringType('Error');
	} else {
		name = toString(name);
	}
	
	// Steps 5 and 6 (and 7, which seems to be a copy-paste error, go figure)
	msg = o.get('message');
	if (type(msg) === 'Undefined') {
		msg = new StringType('');
	} else {
		msg = toString(msg);
	}
	
	// Steps 8-10
	if (!name.value) {
		return msg;
	} else if (!msg.value) {
		return name;
	} else {
		return new StringType(name.value + ': ' + msg.value);
	}
};

/**
 * @classdesc The prototype for Errors
 *
 * @constructor
 * @see ECMA-262 Spec Chapter 15.11.4
 */
exports.ErrorPrototypeType = ErrorPrototypeType;
function ErrorPrototypeType(errorType, className) {
	FunctionTypeBase.call(this, 0, className);
	this._errorType = errorType;
	addNonEnumerableProperty(this, 'toString', new ErrorProtoToStringFunc(), false, true);
}
util.inherits(ErrorPrototypeType, FunctionTypeBase);

/*global
util
FunctionTypeBase
StringType
NumberType
toNumber
ObjectType
addNonEnumerableProperty
*/

/*****************************************
 *
 * Date Prototype Class
 *
 *****************************************/

/**
 * toString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.2
 */
function DateProtoToStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoToStringFunc, FunctionTypeBase);
DateProtoToStringFunc.prototype.call = function call(thisVal) {
	return new StringType(thisVal._date.toString());
};

/**
 * toDateString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.3
 */
function DateProtoToDateStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoToDateStringFunc, FunctionTypeBase);
DateProtoToDateStringFunc.prototype.call = function call(thisVal) {
	return new StringType(thisVal._date.toDateString());
};

/**
 * toTimeString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.4
 */
function DateProtoToTimeStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoToTimeStringFunc, FunctionTypeBase);
DateProtoToTimeStringFunc.prototype.call = function call(thisVal) {
	return new StringType(thisVal._date.toTimeString());
};

/**
 * toLocaleString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.5
 */
function DateProtoToLocaleStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoToLocaleStringFunc, FunctionTypeBase);
DateProtoToLocaleStringFunc.prototype.call = function call(thisVal) {
	return new StringType(thisVal._date.toLocaleString());
};

/**
 * toLocaleDateString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.6
 */
function DateProtoToLocaleDateStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoToLocaleDateStringFunc, FunctionTypeBase);
DateProtoToLocaleDateStringFunc.prototype.call = function call(thisVal) {
	return new StringType(thisVal._date.toLocaleDateString());
};

/**
 * toLocaleTimeString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.7
 */
function DateProtoToLocaleTimeStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoToLocaleTimeStringFunc, FunctionTypeBase);
DateProtoToLocaleTimeStringFunc.prototype.call = function call(thisVal) {
	return new StringType(thisVal._date.toLocaleTimeString());
};

/**
 * valueOf() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.8
 */
function DateProtoValueOfFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoValueOfFunc, FunctionTypeBase);
DateProtoValueOfFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.valueOf());
};

/**
 * getTime() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.9
 */
function DateProtoGetTimeFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetTimeFunc, FunctionTypeBase);
DateProtoGetTimeFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getTime());
};

/**
 * getFullYear() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.10
 */
function DateProtoGetFullYearFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetFullYearFunc, FunctionTypeBase);
DateProtoGetFullYearFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getFullYear());
};

/**
 * getUTCFullYear() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.11
 */
function DateProtoGetUTCFullYearFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetUTCFullYearFunc, FunctionTypeBase);
DateProtoGetUTCFullYearFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getUTCFullYear());
};

/**
 * getMonth() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.12
 */
function DateProtoGetMonthFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetMonthFunc, FunctionTypeBase);
DateProtoGetMonthFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getMonth());
};

/**
 * getUTCMonth() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.13
 */
function DateProtoGetUTCMonthFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetUTCMonthFunc, FunctionTypeBase);
DateProtoGetUTCMonthFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getUTCMonth());
};

/**
 * getDate() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.14
 */
function DateProtoGetDateFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetDateFunc, FunctionTypeBase);
DateProtoGetDateFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getDate());
};

/**
 * getUTCDate() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.15
 */
function DateProtoGetUTCDateFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetUTCDateFunc, FunctionTypeBase);
DateProtoGetUTCDateFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getUTCDate());
};

/**
 * getDay() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.16
 */
function DateProtoGetDayFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetDayFunc, FunctionTypeBase);
DateProtoGetDayFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getDay());
};

/**
 * getUTCDay() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.17
 */
function DateProtoGetUTCDayFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetUTCDayFunc, FunctionTypeBase);
DateProtoGetUTCDayFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getUTCDay());
};

/**
 * getHours() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.18
 */
function DateProtoGetHoursFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetHoursFunc, FunctionTypeBase);
DateProtoGetHoursFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getHours());
};

/**
 * getUTCHours() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.19
 */
function DateProtoGetUTCHoursFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetUTCHoursFunc, FunctionTypeBase);
DateProtoGetUTCHoursFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getUTCHours());
};

/**
 * getMinutes() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.20
 */
function DateProtoGetMinutesFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetMinutesFunc, FunctionTypeBase);
DateProtoGetMinutesFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getMinutes());
};

/**
 * getUTCMinutes() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.21
 */
function DateProtoGetUTCMinutesFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetUTCMinutesFunc, FunctionTypeBase);
DateProtoGetUTCMinutesFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getUTCMinutes());
};

/**
 * getSeconds() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.22
 */
function DateProtoGetSecondsFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetSecondsFunc, FunctionTypeBase);
DateProtoGetSecondsFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getSeconds());
};

/**
 * getUTCSeconds() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.23
 */
function DateProtoGetUTCSecondsFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetUTCSecondsFunc, FunctionTypeBase);
DateProtoGetUTCSecondsFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getUTCSeconds());
};

/**
 * getMilliseconds() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.24
 */
function DateProtoGetMillisecondsFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetMillisecondsFunc, FunctionTypeBase);
DateProtoGetMillisecondsFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getMilliseconds());
};

/**
 * getUTCMilliseconds() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.25
 */
function DateProtoGetUTCMillisecondsFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetUTCMillisecondsFunc, FunctionTypeBase);
DateProtoGetUTCMillisecondsFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getUTCMilliseconds());
};

/**
 * getTimezoneOffset() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.26
 */
function DateProtoGetTimezoneOffsetFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetTimezoneOffsetFunc, FunctionTypeBase);
DateProtoGetTimezoneOffsetFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getTimezoneOffset());
};

/**
 * setTime() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.27
 */
function DateProtoSetTimeFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(DateProtoSetTimeFunc, FunctionTypeBase);
DateProtoSetTimeFunc.prototype.call = function call(thisVal, args) {
	var time = args[0];
	if (time) {
		time = toNumber(time).value;
	}
	return new NumberType(thisVal._date.setTime(time));
};

/**
 * setMilliseconds() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.28
 */
function DateProtoSetMillisecondsFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(DateProtoSetMillisecondsFunc, FunctionTypeBase);
DateProtoSetMillisecondsFunc.prototype.call = function call(thisVal, args) {
	var ms = args[0];
	if (ms) {
		ms = toNumber(ms).value;
	}
	return new NumberType(thisVal._date.setMilliseconds(ms));
};

/**
 * setUTCMilliseconds() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.29
 */
function DateProtoSetUTCMillisecondsFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(DateProtoSetUTCMillisecondsFunc, FunctionTypeBase);
DateProtoSetUTCMillisecondsFunc.prototype.call = function call(thisVal, args) {
	var ms = args[0];
	if (ms) {
		ms = toNumber(ms).value;
	}
	return new NumberType(thisVal._date.setUTCMilliseconds(ms));
};

/**
 * setSeconds() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.30
 */
function DateProtoSetSecondsFunc(className) {
	FunctionTypeBase.call(this, 2, className || 'Function');
}
util.inherits(DateProtoSetSecondsFunc, FunctionTypeBase);
DateProtoSetSecondsFunc.prototype.call = function call(thisVal, args) {
	var sec = args[0],
		ms = args[1];
	if (sec) {
		sec = toNumber(sec).value;
	}
	if (ms) {
		ms = toNumber(ms).value;
	}
	return new NumberType(thisVal._date.setSeconds(sec, ms));
};

/**
 * setUTCSeconds() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.31
 */
function DateProtoSetUTCSecondsFunc(className) {
	FunctionTypeBase.call(this, 2, className || 'Function');
}
util.inherits(DateProtoSetUTCSecondsFunc, FunctionTypeBase);
DateProtoSetUTCSecondsFunc.prototype.call = function call(thisVal, args) {
	var sec = args[0],
		ms = args[1];
	if (sec) {
		sec = toNumber(sec).value;
	}
	if (ms) {
		ms = toNumber(ms).value;
	}
	return new NumberType(thisVal._date.setUTCSeconds(sec, ms));
};

/**
 * setMinutes() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.32
 */
function DateProtoSetMinutesFunc(className) {
	FunctionTypeBase.call(this, 3, className || 'Function');
}
util.inherits(DateProtoSetMinutesFunc, FunctionTypeBase);
DateProtoSetMinutesFunc.prototype.call = function call(thisVal, args) {
	var min = args[0],
		sec = args[1],
		ms = args[2];
	if (min) {
		min = toNumber(min).value;
	}
	if (sec) {
		sec = toNumber(sec).value;
	}
	if (ms) {
		ms = toNumber(ms).value;
	}
	return new NumberType(thisVal._date.setMinutes(min, sec, ms));
};

/**
 * setUTCMinutes() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.33
 */
function DateProtoSetUTCMinutesFunc(className) {
	FunctionTypeBase.call(this, 3, className || 'Function');
}
util.inherits(DateProtoSetUTCMinutesFunc, FunctionTypeBase);
DateProtoSetUTCMinutesFunc.prototype.call = function call(thisVal, args) {
	var min = args[0],
		sec = args[1],
		ms = args[2];
	if (min) {
		min = toNumber(min).value;
	}
	if (sec) {
		sec = toNumber(sec).value;
	}
	if (ms) {
		ms = toNumber(ms).value;
	}
	return new NumberType(thisVal._date.setUTCMinutes(min, sec, ms));
};

/**
 * setHours() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.34
 */
function DateProtoSetHoursFunc(className) {
	FunctionTypeBase.call(this, 4, className || 'Function');
}
util.inherits(DateProtoSetHoursFunc, FunctionTypeBase);
DateProtoSetHoursFunc.prototype.call = function call(thisVal, args) {
	var hour = args[0],
		min = args[1],
		sec = args[2],
		ms = args[3];
	if (hour) {
		hour = toNumber(hour).value;
	}
	if (min) {
		min = toNumber(min).value;
	}
	if (sec) {
		sec = toNumber(sec).value;
	}
	if (ms) {
		ms = toNumber(ms).value;
	}
	return new NumberType(thisVal._date.setHours(hour, min, sec, ms));
};

/**
 * setUTCHours() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.35
 */
function DateProtoSetUTCHoursFunc(className) {
	FunctionTypeBase.call(this, 4, className || 'Function');
}
util.inherits(DateProtoSetUTCHoursFunc, FunctionTypeBase);
DateProtoSetUTCHoursFunc.prototype.call = function call(thisVal, args) {
	var hour = args[0],
		min = args[1],
		sec = args[2],
		ms = args[3];
	if (hour) {
		hour = toNumber(hour).value;
	}
	if (min) {
		min = toNumber(min).value;
	}
	if (sec) {
		sec = toNumber(sec).value;
	}
	if (ms) {
		ms = toNumber(ms).value;
	}
	return new NumberType(thisVal._date.setUTCHours(hour, min, sec, ms));
};

/**
 * setDate() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.36
 */
function DateProtoSetDateFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(DateProtoSetDateFunc, FunctionTypeBase);
DateProtoSetDateFunc.prototype.call = function call(thisVal, args) {
	var date = args[0];
	if (date) {
		date = toNumber(date).value;
	}
	return new NumberType(thisVal._date.setDate(date));
};

/**
 * setUTCDate() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.37
 */
function DateProtoSetUTCDateFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(DateProtoSetUTCDateFunc, FunctionTypeBase);
DateProtoSetUTCDateFunc.prototype.call = function call(thisVal, args) {
	var date = args[0];
	if (date) {
		date = toNumber(date).value;
	}
	return new NumberType(thisVal._date.setUTCDate(date));
};

/**
 * setMonth() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.38
 */
function DateProtoSetMonthFunc(className) {
	FunctionTypeBase.call(this, 2, className || 'Function');
}
util.inherits(DateProtoSetMonthFunc, FunctionTypeBase);
DateProtoSetMonthFunc.prototype.call = function call(thisVal, args) {
	var month = args[0],
		date = args[1];
	if (month) {
		month = toNumber(month).value;
	}
	if (date) {
		date = toNumber(date).value;
	}
	return new NumberType(thisVal._date.setMonth(month, date));
};

/**
 * setUTCMonth() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.39
 */
function DateProtoSetUTCMonthFunc(className) {
	FunctionTypeBase.call(this, 2, className || 'Function');
}
util.inherits(DateProtoSetUTCMonthFunc, FunctionTypeBase);
DateProtoSetUTCMonthFunc.prototype.call = function call(thisVal, args) {
	var month = args[0],
		date = args[1];
	if (month) {
		month = toNumber(month).value;
	}
	if (date) {
		date = toNumber(date).value;
	}
	return new NumberType(thisVal._date.setUTCMonth(month, date));
};

/**
 * setFullYear() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.40
 */
function DateProtoSetFullYearFunc(className) {
	FunctionTypeBase.call(this, 3, className || 'Function');
}
util.inherits(DateProtoSetFullYearFunc, FunctionTypeBase);
DateProtoSetFullYearFunc.prototype.call = function call(thisVal, args) {
	var year = args[0],
		month = args[1],
		date = args[2];
	if (year) {
		year = toNumber(year).value;
	}
	if (month) {
		month = toNumber(month).value;
	}
	if (date) {
		date = toNumber(date).value;
	}
	return new NumberType(thisVal._date.setFullYear(year, month, date));
};

/**
 * setUTCFullYear() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.41
 */
function DateProtoSetUTCFullYearFunc(className) {
	FunctionTypeBase.call(this, 3, className || 'Function');
}
util.inherits(DateProtoSetUTCFullYearFunc, FunctionTypeBase);
DateProtoSetUTCFullYearFunc.prototype.call = function call(thisVal, args) {
	var year = args[0],
		month = args[1],
		date = args[2];
	if (year) {
		year = toNumber(year).value;
	}
	if (month) {
		month = toNumber(month).value;
	}
	if (date) {
		date = toNumber(date).value;
	}
	return new StringType(thisVal._date.setUTCFullYear(year, month, date));
};

/**
 * toUTCString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.42
 */
function DateProtoToUTCStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoToUTCStringFunc, FunctionTypeBase);
DateProtoToUTCStringFunc.prototype.call = function call(thisVal) {
	return new StringType(thisVal._date.toUTCString());
};

/**
 * toISOString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.43
 */
function DateProtoToISOStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoToISOStringFunc, FunctionTypeBase);
DateProtoToISOStringFunc.prototype.call = function call(thisVal) {
	return new StringType(thisVal._date.toISOString());
};

/**
 * toJSON() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.44
 */
function DateProtoToJSONFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(DateProtoToJSONFunc, FunctionTypeBase);
DateProtoToJSONFunc.prototype.call = function call(thisVal) {
	return new StringType(thisVal._date.toJSON());
};

/**
 * @classdesc The prototype for Errors
 *
 * @constructor
 * @see ECMA-262 Spec Chapter 15.9.5
 */
exports.DatePrototypeType = DatePrototypeType;
function DatePrototypeType(className) {
	ObjectType.call(this, className);
	
	addNonEnumerableProperty(this, 'toString', new DateProtoToStringFunc(), false, true);
	addNonEnumerableProperty(this, 'toDateString', new DateProtoToDateStringFunc(), false, true);
	addNonEnumerableProperty(this, 'toTimeString', new DateProtoToTimeStringFunc(), false, true);
	addNonEnumerableProperty(this, 'toLocaleString', new DateProtoToLocaleStringFunc(), false, true);
	addNonEnumerableProperty(this, 'toLocaleDateString', new DateProtoToLocaleDateStringFunc(), false, true);
	addNonEnumerableProperty(this, 'toLocaleTimeString', new DateProtoToLocaleTimeStringFunc(), false, true);
	addNonEnumerableProperty(this, 'valueOf', new DateProtoValueOfFunc(), false, true);
	addNonEnumerableProperty(this, 'getTime', new DateProtoGetTimeFunc(), false, true);
	addNonEnumerableProperty(this, 'getFullYear', new DateProtoGetFullYearFunc(), false, true);
	addNonEnumerableProperty(this, 'getUTCFullYear', new DateProtoGetUTCFullYearFunc(), false, true);
	addNonEnumerableProperty(this, 'getMonth', new DateProtoGetMonthFunc(), false, true);
	addNonEnumerableProperty(this, 'getUTCMonth', new DateProtoGetUTCMonthFunc(), false, true);
	addNonEnumerableProperty(this, 'getDate', new DateProtoGetDateFunc(), false, true);
	addNonEnumerableProperty(this, 'getUTCDate', new DateProtoGetUTCDateFunc(), false, true);
	addNonEnumerableProperty(this, 'getDay', new DateProtoGetDayFunc(), false, true);
	addNonEnumerableProperty(this, 'getUTCDay', new DateProtoGetUTCDayFunc(), false, true);
	addNonEnumerableProperty(this, 'getHours', new DateProtoGetHoursFunc(), false, true);
	addNonEnumerableProperty(this, 'getUTCHours', new DateProtoGetUTCHoursFunc(), false, true);
	addNonEnumerableProperty(this, 'getMinutes', new DateProtoGetMinutesFunc(), false, true);
	addNonEnumerableProperty(this, 'getUTCMinutes', new DateProtoGetUTCMinutesFunc(), false, true);
	addNonEnumerableProperty(this, 'getSeconds', new DateProtoGetSecondsFunc(), false, true);
	addNonEnumerableProperty(this, 'getUTCSeconds', new DateProtoGetUTCSecondsFunc(), false, true);
	addNonEnumerableProperty(this, 'getMilliseconds', new DateProtoGetMillisecondsFunc(), false, true);
	addNonEnumerableProperty(this, 'getUTCMilliseconds', new DateProtoGetUTCMillisecondsFunc(), false, true);
	addNonEnumerableProperty(this, 'getTimezoneOffset', new DateProtoGetTimezoneOffsetFunc(), false, true);
	addNonEnumerableProperty(this, 'setTime', new DateProtoSetTimeFunc(), false, true);
	addNonEnumerableProperty(this, 'setMilliseconds', new DateProtoSetMillisecondsFunc(), false, true);
	addNonEnumerableProperty(this, 'setUTCMilliseconds', new DateProtoSetUTCMillisecondsFunc(), false, true);
	addNonEnumerableProperty(this, 'setSeconds', new DateProtoSetSecondsFunc(), false, true);
	addNonEnumerableProperty(this, 'setUTCSeconds', new DateProtoSetUTCSecondsFunc(), false, true);
	addNonEnumerableProperty(this, 'setMinutes', new DateProtoSetMinutesFunc(), false, true);
	addNonEnumerableProperty(this, 'setUTCMinutes', new DateProtoSetUTCMinutesFunc(), false, true);
	addNonEnumerableProperty(this, 'setHours', new DateProtoSetHoursFunc(), false, true);
	addNonEnumerableProperty(this, 'setUTCHours', new DateProtoSetUTCHoursFunc(), false, true);
	addNonEnumerableProperty(this, 'setDate', new DateProtoSetDateFunc(), false, true);
	addNonEnumerableProperty(this, 'setUTCDate', new DateProtoSetUTCDateFunc(), false, true);
	addNonEnumerableProperty(this, 'setMonth', new DateProtoSetMonthFunc(), false, true);
	addNonEnumerableProperty(this, 'setUTCMonth', new DateProtoSetUTCMonthFunc(), false, true);
	addNonEnumerableProperty(this, 'setFullYear', new DateProtoSetFullYearFunc(), false, true);
	addNonEnumerableProperty(this, 'setUTCFullYear', new DateProtoSetUTCFullYearFunc(), false, true);
	addNonEnumerableProperty(this, 'toUTCString', new DateProtoToUTCStringFunc(), false, true);
	addNonEnumerableProperty(this, 'toISOString', new DateProtoToISOStringFunc(), false, true);
	addNonEnumerableProperty(this, 'toJSON', new DateProtoToJSONFunc(), false, true);
}
util.inherits(DatePrototypeType, ObjectType);

/*global
util
FunctionTypeBase
areAnyUnknown
UnknownType
prototypes
addReadOnlyProperty
NumberType
toNumber
ObjectType
*/

/*****************************************
 *
 * Number Constructor
 *
 *****************************************/

/**
 * Number constructor function
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.7
 */
function NumberConstructor(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
	
	this.defineOwnProperty('prototype', {
		value: prototypes.Number
	}, false, true);

	addReadOnlyProperty(this, 'length', new NumberType(0), false, true);
	addReadOnlyProperty(this, 'MAX_VALUE', new NumberType(Number.MAX_VALUE), false, true);
	addReadOnlyProperty(this, 'MIN_VALUE', new NumberType(Number.MIN_VALUE), false, true);
	addReadOnlyProperty(this, 'NaN', new NumberType(NaN), false, true);
	addReadOnlyProperty(this, 'NEGATIVE_INFINITY', new NumberType(Number.NEGATIVE_INFINITY), false, true);
	addReadOnlyProperty(this, 'POSITIVE_INFINITY', new NumberType(Number.POSITIVE_INFINITY), false, true);
}
util.inherits(NumberConstructor, FunctionTypeBase);
NumberConstructor.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var value = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	return value ? toNumber(value) : new NumberType(0);
};
NumberConstructor.prototype.construct = function call(args) {
	
	// Variable declarations
	var value = args[0],
		obj;
	
	// Validate the parameters
	if (areAnyUnknown(args)) {
		return new UnknownType();
	}
	
	obj = new ObjectType();
	obj.className = 'Number';
	obj.primitiveValue = value ? toNumber(value).value : 0;
	
	Object.defineProperty(obj, 'objectPrototype', {
		get: function () {
			return prototypes.Number;
		},
		configurable: true
	});
		
	return obj;
};

/*global
util
FunctionTypeBase
areAnyUnknown
UnknownType
BooleanType
prototypes
toBoolean
ObjectType
*/

/*****************************************
 *
 * Boolean Constructor
 *
 *****************************************/

/**
 * Boolean constructor function
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.6
 */
function BooleanConstructor(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
	
	this.defineOwnProperty('prototype', {
		value: prototypes.Boolean
	}, false, true);
}
util.inherits(BooleanConstructor, FunctionTypeBase);
BooleanConstructor.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var value = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	return value ? toBoolean(value) : new BooleanType(false);
};
BooleanConstructor.prototype.construct = function call(args) {
	
	// Variable declarations
	var value = args[0],
		obj;
	
	// Validate the parameters
	if (areAnyUnknown(args)) {
		return new UnknownType();
	}
	
	obj = new ObjectType();
	obj.className = 'Boolean';
	obj.primitiveValue = value ? toBoolean(value).value : false;
	
	Object.defineProperty(obj, 'objectPrototype', {
		get: function () {
			return prototypes.Boolean;
		},
		configurable: true
	});
		
	return obj;
};

/*global
util
FunctionTypeBase
areAnyUnknown
UnknownType
prototypes
toUint16
StringType
toString
ObjectType
NumberType
*/

/*****************************************
 *
 * String Constructor
 *
 *****************************************/

/**
 * isArray() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.5.3.2
 */
function StringFromCharCodeFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(StringFromCharCodeFunc, FunctionTypeBase);
StringFromCharCodeFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var i = 0,
		len = args.length;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Convert the array to something we can apply()
	for(; i < len; i++) {
		args[i] = toUint16(args[i]).value;
	}
	
	// Use the built-in match method to perform the match
	return new StringType(String.fromCharCode.apply(this, args));
};

/**
 * String constructor function
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.5
 */
function StringConstructor(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
	
	this.defineOwnProperty('prototype', {
		value: prototypes.String
	}, false, true);
	
	this.put('fromCharCode', new StringFromCharCodeFunc(), false, true);
}
util.inherits(StringConstructor, FunctionTypeBase);
StringConstructor.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var value = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	return value ? toString(value) : new StringType('');
};
StringConstructor.prototype.construct = function call(args) {
	
	// Variable declarations
	var value = args[0],
		obj;
	
	// Validate the parameters
	if (areAnyUnknown(args)) {
		return new UnknownType();
	}
	
	obj = new ObjectType();
	obj.className = 'String';
	obj.primitiveValue = value ? toString(value).value : '';

	obj.defineOwnProperty('length', { value: new NumberType(obj.primitiveValue.length) }, false, true);
	
	Object.defineProperty(obj, 'objectPrototype', {
		get: function () {
			return prototypes.String;
		},
		configurable: true
	});
	
	return obj;
};

/*global
util
FunctionTypeBase
areAnyUnknown
UnknownType
BooleanType
prototypes
type
handleRecoverableNativeException
UndefinedType
toString
fromPropertyDescriptor
ArrayType
ObjectType
toPropertyDescriptor
toObject
isDataDescriptor
StringType
isType
*/

/*****************************************
 *
 * Object Constructor
 *
 *****************************************/

/**
 * getPrototypeOf() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectGetPrototypeOfFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ObjectGetPrototypeOfFunc, FunctionTypeBase);
ObjectGetPrototypeOfFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	if (type(o) !== 'Object') {
		handleRecoverableNativeException('TypeError', 'Value is not an object');
		return new UnknownType();
	}
	return o.objectPrototype ? o.objectPrototype : new UndefinedType();
};

/**
 * getOwnPropertyDescriptor() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectGetOwnPropertyDescriptorFunc(className) {
	FunctionTypeBase.call(this, 2, className || 'Function');
}
util.inherits(ObjectGetOwnPropertyDescriptorFunc, FunctionTypeBase);
ObjectGetOwnPropertyDescriptorFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o = args[0],
		p = args[1],
		name;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Step 1
	if (type(o) !== 'Object') {
		handleRecoverableNativeException('TypeError', 'Value is not an object');
		return new UnknownType();
	}
	
	// Step 2
	name = toString(p).value;
	
	// Steps 3 and 4
	return fromPropertyDescriptor(o.getOwnProperty(name));
};

/**
 * getOwnPropertyNames() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectGetOwnPropertyNamesFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ObjectGetOwnPropertyNamesFunc, FunctionTypeBase);
ObjectGetOwnPropertyNamesFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o = args[0],
		array,
		n = 0;

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	// Step 1
	if (type(o) !== 'Object') {
		handleRecoverableNativeException('TypeError', 'Value is not an object');
		return new UnknownType();
	}
	
	// Step 2
	array = new ArrayType();
	
	// Step 4
	o._getPropertyNames().forEach(function (name) {
		array.defineOwnProperty(n, {
			value: new StringType(name),
			writable: true,
			enumerable: true,
			configurable: true
		}, false, true);
		n++;
	});
	
	// Step 5
	return array;
};

/**
 * create() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectCreateFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(ObjectCreateFunc, FunctionTypeBase);
ObjectCreateFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o = args[0],
		properties = args[1],
		obj;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Step 1
	if (type(o) !== 'Object') {
		handleRecoverableNativeException('TypeError', 'Value is not an object');
		return new UnknownType();
	}
	
	// Step 2
	obj = new ObjectType();
	
	// Step 3
	obj.objectPrototype = o;
	
	// Step 4
	if (properties && type(properties) !== 'Undefined') {
		ObjectDefinePropertiesFunc.prototype.call(thisVal, [obj, properties]);
	}
	
	// Step 5
	return obj;
};

/**
 * defineProperties() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectDefinePropertyFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(ObjectDefinePropertyFunc, FunctionTypeBase);
ObjectDefinePropertyFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o = args[0],
		p = args[1],
		attributes = args[2],
		name,
		desc;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	// Step 1
	if (type(o) !== 'Object') {
		handleRecoverableNativeException('TypeError', 'Value is not an object');
		return new UnknownType();
	}
	
	// Step 2
	name = toString(p).value;
	
	// Step 3
	desc = toPropertyDescriptor(attributes);
	
	// Step 4
	o.defineOwnProperty(name, desc, true);
	
	// Step 5
	return o;
};

/**
 * defineProperties() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectDefinePropertiesFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(ObjectDefinePropertiesFunc, FunctionTypeBase);
ObjectDefinePropertiesFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o,
		properties,
		props,
		names,
		i,
		len,
		p;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	o = args[0];
	properties = args[1];
	props = toObject(properties);
	names = props._getPropertyNames();
	i = 0;
	len = names.length;
	
	// Step 1
	if (type(o) !== 'Object') {
		handleRecoverableNativeException('TypeError', 'Value is not an object');
		return new UnknownType();
	}
	
	// Steps 5 and 6
	for(; i < len; i++) {
		p = names[i];
		o.defineOwnProperty(p, toPropertyDescriptor(props.get(p)), true);
	}
	
	// Step 7
	return o;
};

/**
 * seal() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectSealFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(ObjectSealFunc, FunctionTypeBase);
ObjectSealFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o = args[0],
		desc;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	// Step 1
	if (type(o) !== 'Object') {
		handleRecoverableNativeException('TypeError', 'Value is not an object');
		return new UnknownType();
	}
	
	// Step 2
	o._getPropertyNames().forEach(function (p) {
		desc = o.getOwnProperty(p);
		desc.configurable = false;
		o.defineOwnProperty(p, desc, true);
	});
	
	// Step 3
	o.extensible = false;
	
	// Step 4
	return o;
};

/**
 * freeze() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectFreezeFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(ObjectFreezeFunc, FunctionTypeBase);
ObjectFreezeFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o = args[0],
		desc;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	// Step 1
	if (type(o) !== 'Object') {
		handleRecoverableNativeException('TypeError', 'Value is not an object');
		return new UnknownType();
	}
	
	// Step 2
	o._getPropertyNames().forEach(function (p) {
		desc = o.getOwnProperty(p);
		if (isDataDescriptor(desc)) {
			desc.writable = false;
		}
		desc.configurable = false;
		o.defineOwnProperty(p, desc, true);
	});
	
	// Step 3
	o.extensible = false;
	
	// Step 4
	return o;
};

/**
 * preventExtensions() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectPreventExtensionsFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(ObjectPreventExtensionsFunc, FunctionTypeBase);
ObjectPreventExtensionsFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	// Step 1
	if (type(o) !== 'Object') {
		handleRecoverableNativeException('TypeError', 'Value is not an object');
		return new UnknownType();
	}
	
	// Step 2
	o.extensible = false;
	
	// Step 3
	return o;
};

/**
 * isSealed() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectIsSealedFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(ObjectIsSealedFunc, FunctionTypeBase);
ObjectIsSealedFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	// Step 1
	if (type(o) !== 'Object') {
		handleRecoverableNativeException('TypeError', 'Value is not an object');
		return new UnknownType();
	}
	
	// Step 2
	o._getPropertyNames().forEach(function (p) {
		if (o.getOwnProperty(p).configurable) {
			return new BooleanType(false);
		}
	});
	
	// Step 3
	return new BooleanType(!o.extensible);
};

/**
 * isFrozen() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectIsFrozenFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(ObjectIsFrozenFunc, FunctionTypeBase);
ObjectIsFrozenFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o = args[0],
		desc;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	// Step 1
	if (type(o) !== 'Object') {
		handleRecoverableNativeException('TypeError', 'Value is not an object');
		return new UnknownType();
	}
	
	// Step 2
	o._getPropertyNames().forEach(function (p) {
		desc = o.getOwnProperty(p);
		if ((isDataDescriptor(desc) && desc.writable) || desc.configurable) {
			return new BooleanType(false);
		}
	});
	
	// Step 3
	return new BooleanType(!o.extensible);
};

/**
 * isExtensible() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectIsExtensibleFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(ObjectIsExtensibleFunc, FunctionTypeBase);
ObjectIsExtensibleFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	// Step 1
	if (type(o) !== 'Object') {
		handleRecoverableNativeException('TypeError', 'Value is not an object');
		return new UnknownType();
	}
	
	// Step 2
	return new BooleanType(o.extensible);
};

/**
 * keys() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.2.3.2
 */
function ObjectKeysFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(ObjectKeysFunc, FunctionTypeBase);
ObjectKeysFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o = args[0],
		array,
		index = 0;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	// Step 1
	if (type(o) !== 'Object') {
		handleRecoverableNativeException('TypeError', 'Value is not an object');
		return new UnknownType();
	}
	
	// Step 3
	array = new ArrayType();
	
	// Step 5
	o._getPropertyNames().forEach(function (p) {
		if (o._lookupProperty(p).enumerable) {
			array.defineOwnProperty(index, {
				value: new StringType(p),
				writable: true,
				enumerable: true,
				configurable: true
			}, false);
			index++;
		}
	});
	
	// Step 6
	return array;
};

/**
 * Object constructor function
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.2
 */
function ObjectConstructor(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
	
	this.defineOwnProperty('prototype', {
		value: prototypes.Object
	}, false, true);
	
	this.put('getPrototypeOf', new ObjectGetPrototypeOfFunc(), false, true);
	this.put('getOwnPropertyDescriptor', new ObjectGetOwnPropertyDescriptorFunc(), false, true);
	this.put('getOwnPropertyNames', new ObjectGetOwnPropertyNamesFunc(), false, true);
	this.put('create', new ObjectCreateFunc(), false, true);
	this.put('defineProperty', new ObjectDefinePropertyFunc(), false, true);
	this.put('defineProperties', new ObjectDefinePropertiesFunc(), false, true);
	this.put('seal', new ObjectSealFunc(), false, true);
	this.put('freeze', new ObjectFreezeFunc(), false, true);
	this.put('preventExtensions', new ObjectPreventExtensionsFunc(), false, true);
	this.put('isSealed', new ObjectIsSealedFunc(), false, true);
	this.put('isFrozen', new ObjectIsFrozenFunc(), false, true);
	this.put('isExtensible', new ObjectIsExtensibleFunc(), false, true);
	this.put('keys', new ObjectKeysFunc(), false, true);
}
util.inherits(ObjectConstructor, FunctionTypeBase);
ObjectConstructor.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var value = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Step 1
	if (!value || isType(value, ['Null', 'Undefined'])) {
		return new ObjectType();
	}
	
	// Step 2
	return toObject(value);
};
ObjectConstructor.prototype.construct = function call(args) {
	
	// Variable declarations
	var value = args[0];
	
	// Validate the parameters
	if (areAnyUnknown(args)) {
		return new UnknownType();
	}
	
	// Step 1
	if (value && (isType(value, ['Undefined', 'Null']))) {
		if (type(value) === 'Object') {
			return value;
		} else {
			return toObject(value);
		}
	}
	
	// Steps 3-8
	return new ObjectType();
};

/*global
util
FunctionTypeBase
areAnyUnknown
UnknownType
BooleanType
type
prototypes
ArrayType
toUint32
handleRecoverableNativeException
NumberType
*/

/*****************************************
 *
 * Array Constructor
 *
 *****************************************/

/**
 * isArray() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.4.3.2
 */
function ArrayIsArrayFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ArrayIsArrayFunc, FunctionTypeBase);
ArrayIsArrayFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var arg = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1 and 2
	return new BooleanType(type(arg) === 'Object' && arg.className === 'Array');
};

/**
 * Array constructor function
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.4
 */
function ArrayConstructor(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
	
	this.defineOwnProperty('prototype', {
		value: prototypes.Array
	}, false, true);
	
	this.put('isArray', new ArrayIsArrayFunc(), false, true);
}
util.inherits(ArrayConstructor, FunctionTypeBase);
ArrayConstructor.prototype.call = function call(thisVal, args) {
	return ArrayConstructor.prototype.construct.call(this, args);
};
ArrayConstructor.prototype.construct = function call(args) {
	
	// Variable declarations
	var array,
		len,
		i = 0;
	
	// Validate the parameters
	if (areAnyUnknown(args)) {
		return new UnknownType();
	}
	
	array = new ArrayType();
	if (args.length === 1) {
		len = args[0];
		if (type(len) === 'Number') {
			if (len.value === toUint32(len).value) {
				array._addProperty('length', {
					value: toUint32(len),
					writable: true,
					enumerable: false,
					configurable: false
				});
			} else {
				handleRecoverableNativeException('RangeError', 'Invalid length ' + len.value);
				return new UnknownType();
			}
		} else {
			array._addProperty('length', {
				value: new NumberType(1),
				writable: true,
				enumerable: false,
				configurable: false
			});
			array.put('0', len, true);
		}
	} else if (args.length > 1){
		len = args.length;
		array._addProperty('length', {
			value: new NumberType(len),
			writable: true,
			enumerable: false,
			configurable: false
		});
		for(; i < len; i++) {
			array.put(i, args[i], true);
		}
	}
	
	return array;
};

/*global
util
FunctionTypeBase
areAnyUnknown
UnknownType
prototypes
type
handleRecoverableNativeException
toString
RegExpType
StringType
*/

/*****************************************
 *
 * RegExp Constructor
 *
 *****************************************/

/**
 * RegExp constructor function
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.10
 */
function RegExpConstructor(className) {
	FunctionTypeBase.call(this, 2, className || 'Function');
	
	this.defineOwnProperty('prototype', {
		value: prototypes.RegExp
	}, false, true);
}
util.inherits(RegExpConstructor, FunctionTypeBase);
RegExpConstructor.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var pattern = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	if (pattern && type(pattern) === 'Object' && pattern.className === 'RegExp') {
		return pattern;
	}
	
	return RegExpConstructor.prototype.construct(args);
};
RegExpConstructor.prototype.construct = function call(args) {
	
	// Variable declarations
	var pattern = args[0] || new StringType(''),
		flags = args[1],
		p,
		f;
	
	// Validate the parameters
	if (areAnyUnknown(args)) {
		return new UnknownType();
	}
	
	// Parse the parameters
	if (type(pattern) === 'Object' && pattern.className === 'RegExp') {
		if (flags && type(flags) !== 'Undefined') {
			handleRecoverableNativeException('TypeError');
			return new UnknownType();
		}
		p = pattern._pattern;
		f = pattern._flags;
	} else {
		p = pattern && type(pattern) !== 'Undefined' ? toString(pattern).value : '';
		f = flags && type(flags) !== 'Undefined' ? toString(flags).value : '';
	}
	
	// Create the regex object
	return new RegExpType(p, f);
};

/*global
util
AST
Runtime
FunctionTypeBase
areAnyUnknown
UnknownType
prototypes
StringType
toString
handleRecoverableNativeException
FunctionType
RuleProcessor
*/

/*****************************************
 *
 * Function Constructor
 *
 *****************************************/

/**
 * Function constructor function
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.3
 */
function FunctionConstructor(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');

	this.defineOwnProperty('prototype', {
		value: prototypes.Function
	}, false, true);
}
util.inherits(FunctionConstructor, FunctionTypeBase);
FunctionConstructor.prototype.call = function call(thisVal, args) {
	return FunctionConstructor.prototype.construct.call(this, args);
};
FunctionConstructor.prototype.construct = function call(args) {

	// Variable declarations
	var argCount = args.length,
		p = '',
		body,
		k = 1,
		i;

	// Validate the parameters
	if (areAnyUnknown(args)) {
		return new UnknownType();
	}

	// Step 3
	if (argCount === 0) {
		body = new StringType();

	// Step 4
	} else if (argCount === 1) {
		body = args[0];

	// Step 5
	} else if (argCount > 1) {
		p = toString(args[0]).value;
		while (k < argCount - 1) {
			p += ',' + toString(args[k]).value;
			k++;
		}
		body = args[k];
	}

	// Step 6
	body = toString(body).value;

	// Step 7
	p = AST.parseString('function temp(' + p + '){}');
	if (p.syntaxError) {
		handleRecoverableNativeException('SyntaxError');
		return new UnknownType();
	}
	p = p.body[0].argnames;
	for (i = 0; i < p.length; i++) {
		p[i] = p[i].name;
	}

	// Step 8
	body = AST.parseString('function temp(){' + body + '}');
	if (body.syntaxError) {
		handleRecoverableNativeException('SyntaxError');
		return new UnknownType();
	}
	body = body.body[0];

	// Step 10
	return new FunctionType(p, body.body, Runtime.getModuleContext().lexicalEnvironment, RuleProcessor.isBlockStrict(body));
};

/*global
util
FunctionTypeBase
areAnyUnknown
UnknownType
prototypes
ObjectType
StringType
toString
type
*/

/*****************************************
 *
 * Error Constructor
 *
 *****************************************/

/**
 * Error constructor function
 *
 * @constructor
 * @see ECMA-262 Spec Chapter 15.11
 */
exports.ErrorConstructor = ErrorConstructor;
function ErrorConstructor(errorType, className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
	
	this.defineOwnProperty('prototype', {
		value: prototypes[errorType]
	}, false, true);
	
	this._errorType = errorType;
}
util.inherits(ErrorConstructor, FunctionTypeBase);
ErrorConstructor.prototype.call = function call(thisVal, args) {
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	return ErrorConstructor.prototype.construct.call(this, args);
};
ErrorConstructor.prototype.construct = function call(args) {
	
	// Variable declarations
	var errorType = this._errorType,
		err,
		message = args[0];
	
	// Validate the parameters
	if (areAnyUnknown(args)) {
		return new UnknownType();
	}
	
	err = new ObjectType();
	err.className = errorType;
	err.extensible = true;

	Object.defineProperty(err, 'objectPrototype', {
		get: function () {
			return prototypes[errorType];
		},
		configurable: true
	});

	err.put('name', new StringType(errorType), true);
	err.put('message', message && type(message) !== 'Undefined' ? toString(message) : new StringType(''), true);
	
	return err;
};

/*global
util
Runtime
FunctionTypeBase
UnknownType
prototypes
NumberType
StringType
type
toNumber
ObjectType
*/

/*****************************************
 *
 * Date Constructor
 *
 *****************************************/

/**
 * parse() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.4.2
 */
function DateParseFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateParseFunc, FunctionTypeBase);
DateParseFunc.prototype.call = function call() {
	return new UnknownType();
};

/**
 * UTC() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.4.3
 */
function DateUTCFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateUTCFunc, FunctionTypeBase);
DateUTCFunc.prototype.call = function call() {
	return new UnknownType();
};

/**
 * now() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.4.4
 */
function DateNowFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateNowFunc, FunctionTypeBase);
DateNowFunc.prototype.call = function call() {
	if (Runtime.options.exactMode) {
		return new NumberType(Date.now());
	} else {
		return new UnknownType();
	}
};

/**
 * Date constructor function
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9
 */
function DateConstructor(className) {
	FunctionTypeBase.call(this, 7, className || 'Function');
	
	this.defineOwnProperty('prototype', {
		value: prototypes.Date
	}, false, true);
	
	this.put('parse', new DateParseFunc(), false, true);
	this.put('UTC', new DateUTCFunc(), false, true);
	this.put('now', new DateNowFunc(), false, true);
}
util.inherits(DateConstructor, FunctionTypeBase);
DateConstructor.prototype.call = function call() {
	if (Runtime.options.exactMode) {
		return new StringType(Date());
	} else {
		return new UnknownType();
	}
};
DateConstructor.prototype.construct = function call(args) {
	var dateObj,
		internalDateObj,
		convertedArgs,
		i, len;
	if (Runtime.options.exactMode) {
		if (args.length === 0) {
			internalDateObj = new Date();
		} else if (args.length === 1){
			if (type(args[0]) === 'String') {
				internalDateObj = new Date(args[0].value);
			} else {
				internalDateObj = new Date(toNumber(args[0]).value);
			}
		} else {
			convertedArgs = [];
			for(i = 0, len = args.length; i < len; i++) {
				convertedArgs[i] = toNumber(args[i]).value;
			}
			switch(args.length) {
				case 2:
					internalDateObj = new Date(
						convertedArgs[0],
						convertedArgs[1]);
					break;
				case 3:
					internalDateObj = new Date(
						convertedArgs[0],
						convertedArgs[1],
						convertedArgs[2]);
					break;
				case 4:
					internalDateObj = new Date(
						convertedArgs[0],
						convertedArgs[1],
						convertedArgs[2],
						convertedArgs[3]);
					break;
				case 5:
					internalDateObj = new Date(
						convertedArgs[0],
						convertedArgs[1],
						convertedArgs[2],
						convertedArgs[3],
						convertedArgs[4]);
					break;
				case 6:
					internalDateObj = new Date(
						convertedArgs[0],
						convertedArgs[1],
						convertedArgs[2],
						convertedArgs[3],
						convertedArgs[4],
						convertedArgs[5]);
					break;
				case 7:
					internalDateObj = new Date(
						convertedArgs[0],
						convertedArgs[1],
						convertedArgs[2],
						convertedArgs[3],
						convertedArgs[4],
						convertedArgs[5],
						convertedArgs[6]);
					break;
			}
		}
		dateObj = new ObjectType();
		dateObj._date = internalDateObj;
		Object.defineProperty(dateObj, 'objectPrototype', {
			get: function () {
				return prototypes.Date;
			},
			configurable: true
		});
		return dateObj;
	} else {
		return new UnknownType();
	}
};

/*global
type
UnknownType
BooleanType
NumberType
StringType
ObjectType
UndefinedType
prototypes
handleRecoverableNativeException
throwNativeException
isType
isDefined
isDataDescriptor
*/

/*****************************************
 *
 * Type Conversion
 *
 *****************************************/

/**
 * ECMA-262 Spec: <em>The abstract operation ToPrimitive takes an input argument and an optional argument PreferredType.
 * The abstract operation ToPrimitive converts its input argument to a non-Object type. If an object is capable of
 * converting to more than one primitive type, it may use the optional hint PreferredType to favour that type.</em>
 *
 * @method
 * @name module:Base.toPrimitive
 * @param {module:Base.BaseType} input The value to convert
 * @param {String} preferredType The preferred type to convert to
 * @returns {{@link module:Base.BaseType}} The converted value
 * @see ECMA-262 Spec Chapter 9.1
 */
exports.toPrimitive = toPrimitive;
function toPrimitive(input, preferredType) {
	switch(type(input)) {
		case 'Object':
			return input.defaultValue(preferredType);
		case 'Unknown':
			return new UnknownType();
		default:
			return input;
	}
}

/**
 * ECMA-262 Spec: <em>The abstract operation ToBoolean converts its argument to a value of type Boolean</em>
 *
 * @method
 * @name module:Base.toBoolean
 * @param {module:Base.BaseType} input The value to convert
 * @returns {{@link module:Base.BooleanType}} The converted value
 * @see ECMA-262 Spec Chapter 9.2
 */
exports.toBoolean = toBoolean;
function toBoolean(input) {
	var newBoolean = new BooleanType();
	switch (type(input)) {
		case 'Undefined':
			newBoolean.value = false;
			break;
		case 'Null':
			newBoolean.value = false;
			break;
		case 'Boolean':
			newBoolean.value = input.value;
			break;
		case 'Number':
			newBoolean.value = !!input.value;
			break;
		case 'String':
			newBoolean.value = !!input.value;
			break;
		case 'Object':
			newBoolean.value = true;
			break;
		case 'Unknown':
			return new UnknownType();
	}
	return newBoolean;
}

/**
 * ECMA-262 Spec: <em>The abstract operation ToNumber converts its argument to a value of type Number</em>
 *
 * @method
 * @name module:Base.toNumber
 * @param {module:Base.BaseType} input The value to convert
 * @returns {{@link module:Base.NumberType}} The converted value
 * @see ECMA-262 Spec Chapter 9.3
 */
exports.toNumber = toNumber;
function toNumber(input) {
	var newNumber = new NumberType();
	switch (type(input)) {
		case 'Undefined':
			newNumber.value = NaN;
			break;
		case 'Null':
			newNumber.value = 0;
			break;
		case 'Boolean':
			newNumber.value = input.value ? 1 : 0;
			break;
		case 'Number':
			newNumber.value = input.value;
			break;
		case 'String':
			newNumber.value = +input.value;
			break;
		case 'Object':
			newNumber = toNumber(toPrimitive(input, 'Number'));
			break;
		case 'Unknown':
			return new UnknownType();
	}
	return newNumber;
}

/**
 * ECMA-262 Spec: <em>The abstract operation ToInteger converts its argument to an integral numeric value.</em>
 *
 * @method
 * @name module:Base.toInteger
 * @param {module:Base.BaseType} input The value to convert
 * @returns {{@link module:Base.NumberType}} The converted value
 * @see ECMA-262 Spec Chapter 9.4
 */
exports.toInteger = toInteger;
function toInteger(input) {
	var newNumber = toNumber(input),
		sign;
	if (type(newNumber) === 'Unknown') {
		return new UnknownType();
	} else if (isNaN(newNumber.value)) {
		newNumber.value = 0;
	} else {
		sign = newNumber.value < 0 ? -1 : 1;
		newNumber.value = sign * Math.floor(Math.abs(newNumber.value));
	}
	return newNumber;
}

/**
 * ECMA-262 Spec: <em>The abstract operation ToInt32 converts its argument to one of 2^32 integer values in the range
 * -2^31 through 2^31 - 1, inclusive.</em>
 *
 * @method
 * @name module:Base.toInt32
 * @param {module:Base.BaseType} input The value to convert
 * @returns {{@link module:Base.NumberType}} The converted value
 * @see ECMA-262 Spec Chapter 9.5
 */
exports.toInt32 = toInt32;
function toInt32(input) {
	var newNumber = toNumber(input),
		sign;
	if (type(newNumber) === 'Unknown') {
		return new UnknownType();
	} else if (isNaN(newNumber.value) || newNumber.value === Infinity || newNumber.value === -Infinity) {
		newNumber.value = 0;
	} else {
		sign = newNumber.value < 0 ? -1 : 1;
		newNumber.value = sign * Math.floor(Math.abs(newNumber.value)) % Math.pow(2, 32);
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
 * @name module:Base.toUint32
 * @param {module:Base.BaseType} input The value to convert
 * @returns {{@link module:Base.NumberType}} The converted value
 * @see ECMA-262 Spec Chapter 9.6
 */
exports.toUint32 = toUint32;
function toUint32(input) {
	var newNumber = toNumber(input),
		sign;
	if (type(newNumber) === 'Unknown') {
		return new UnknownType();
	} else if (isNaN(newNumber.value) || newNumber.value === Infinity || newNumber.value === -Infinity) {
		newNumber.value = 0;
	} else {
		sign = newNumber.value < 0 ? -1 : 1;
		newNumber.value = sign * Math.floor(Math.abs(newNumber.value)) % Math.pow(2, 32);
	}
	return newNumber;
}

/**
 * ECMA-262 Spec: <em>The abstract operation ToUint16 converts its argument to one of 2^16 integer values in the range 0
 * through 2^16 - 1, inclusive.</em>
 *
 * @method
 * @name module:Base.toUint16
 * @param {module:Base.BaseType} input The value to convert
 * @returns {{@link module:Base.NumberType}} The converted value
 * @see ECMA-262 Spec Chapter 9.7
 */
exports.toUint16 = toUint16;
function toUint16(input) {
	var newNumber = toNumber(input),
		sign;
	if (type(newNumber) === 'Unknown') {
		return new UnknownType();
	} else if (isNaN(newNumber.value) || newNumber.value === Infinity || newNumber.value === -Infinity) {
		newNumber.value = 0;
	} else {
		sign = newNumber.value < 0 ? -1 : 1;
		newNumber.value = sign * Math.floor(Math.abs(newNumber.value)) % Math.pow(2, 16);
	}
	return newNumber;
}

/**
 * ECMA-262 Spec: <em>The abstract operation ToString converts its argument to a value of type String</em>
 *
 * @method
 * @name module:Base.toString
 * @param {module:Base.BaseType} input The value to convert
 * @returns {{@link module:Base.StringType}} The converted value
 * @see ECMA-262 Spec Chapter 9.8
 */
exports.toString = toString;
function toString(input) {
	var newString;
	if (type(input) === 'Unknown') {
		newString = new UnknownType();
	} else if (type(input) === 'Object') {
		newString = toString(toPrimitive(input, 'String'));
	} else {
		newString = new StringType();
		newString.value = input.value + '';
	}
	return newString;
}

/**
 * ECMA-262 Spec: <em>The abstract operation ToObject converts its argument to a value of type Object</em>
 *
 * @method
 * @name module:Base.toObject
 * @param {module:Base.BaseType} input The value to convert
 * @returns {{@link module:Base.ObjectType}} The converted value
 * @see ECMA-262 Spec Chapter 9.9
 */
exports.toObject = toObject;
function toObject(input) {
	var newObject;
	switch (type(input)) {
		case 'Boolean':
			newObject = new ObjectType();
			newObject.className = 'Boolean';
			newObject.primitiveValue = input.value;
			
			Object.defineProperty(newObject, 'objectPrototype', {
				get: function () {
					return prototypes.Boolean;
				},
				configurable: true
			});
			
			return newObject;
		case 'Number':
			newObject = new ObjectType();
			newObject.className = 'Number';
			newObject.primitiveValue = input.value;
			
			Object.defineProperty(newObject, 'objectPrototype', {
				get: function () {
					return prototypes.Number;
				},
				configurable: true
			});
			
			return newObject;
		case 'String':
			newObject = new ObjectType();
			newObject.className = 'String';
			newObject.primitiveValue = input.value;
			
			Object.defineProperty(newObject, 'objectPrototype', {
				get: function () {
					return prototypes.String;
				},
				configurable: true
			});
			
			newObject._properties = input._properties;
			return newObject;
		case 'Object':
			return input;
		case 'Unknown':
			return new UnknownType();
		default:
			handleRecoverableNativeException('TypeError', 'Values of type ' + type(input) + ' cannot be converted to objects');
			return new UnknownType();
	}
}



/**
 * Converts a property descriptor to a generic object.
 *
 * @method
 * @name module:Base.fromPropertyDescriptor
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
	
		obj.defineOwnProperty('value', {
			value: desc.value || new UndefinedType(),
			writable: true,
			enumerable: true,
			configurable: true
		}, false, true);
		
		obj.defineOwnProperty('writable', {
			value: new BooleanType(desc.writable),
			writable: true,
			enumerable: true,
			configurable: true
		}, false, true);
		
	} else {
	
		obj.defineOwnProperty('get', {
			value: desc.get || new UndefinedType(),
			writable: true,
			enumerable: true,
			configurable: true
		}, false, true);
		
		obj.defineOwnProperty('set', {
			value: desc.set || new UndefinedType(),
			writable: true,
			enumerable: true,
			configurable: true
		}, false, true);
	}
	
	obj.defineOwnProperty('configurable', {
		value: new BooleanType(desc.configurable),
		writable: true,
		enumerable: true,
		configurable: true
	}, false, true);
	
	obj.defineOwnProperty('enumerable', {
		value: new BooleanType(desc.enumerable),
		writable: true,
		enumerable: true,
		configurable: true
	}, false, true);
	
	return obj;
}

/**
 * Converts a generic object to a property descriptor (think Object.defineProperty).
 *
 * @method
 * @name module:Base.toPropertyDescriptor
 * @param {Object} o The object to convert
 * @returns {{@link module:Base.DataPropertyDescriptor}|{@link module:Base.AccessorPropertyDescriptor}} The converted property descriptor
 * @see ECMA-262 Spec Chapter 8.10.5
 */
exports.toPropertyDescriptor = toPropertyDescriptor;
function toPropertyDescriptor(obj) {
	var desc = {},
		getter,
		setter;
	
	if (type(obj) === 'Unknown') {
		
		// Create a sensible default data property descriptor
		desc.value = obj;
		desc.writable = false;
		desc.enumerable = true;
		desc.configurable = false;
		
	} else if (type(obj) === 'Object') {
		
		// Parse through all of the options
		if (obj.hasProperty('enumerable')) {
			desc.enumerable = toBoolean(obj.get('enumerable')).value;
		}
		if (obj.hasProperty('configurable')) {
			desc.configurable = toBoolean(obj.get('configurable')).value;
		}
		if (obj.hasProperty('value')) {
			desc.value = obj.get('value');
		}
		if (obj.hasProperty('writable')) {
			desc.writable = toBoolean(obj.get('writable')).value;
		}
		if (obj.hasProperty('get')) {
			getter = obj.get('get');
			if (type(getter) !== 'Undefined' && type(getter) !== 'Unknown' && !isCallable(getter)) {
				throwNativeException('TypeError', 'get is not callable');
			}
			desc.get = getter;
		}
		if (obj.hasProperty('set')) {
			setter = obj.get('set');
			if (type(setter) !== 'Undefined' && type(setter) !== 'Unknown' && !isCallable(setter)) {
				throwNativeException('TypeError', 'set is not callable');
			}
			desc.set = setter;
		}
		if ((desc.get || desc.set) && (isDefined(desc.value) || isDefined(desc.writable))) {
			throwNativeException('TypeError', 'Property descriptors cannot contain both get/set and value/writable properties');
		}
	} else {
		throwNativeException('TypeError', 'Property descriptors must be objects');
	}
	
	return desc;
}

/**
 * ECMA-262 Spec: <em>The abstract operation CheckObjectCoercible throws an error if its argument is a value that cannot
 * be converted to an Object using ToObject.</em>
 *
 * @method
 * @name module:Base.checkObjectCoercible
 * @param {module:Base.BaseType} input The value to check if it's coercible
 * @see ECMA-262 Spec Chapter 9.10
 */
exports.checkObjectCoercible = checkObjectCoercible;
function checkObjectCoercible(input) {
	if (isType(input, ['Undefined', 'Null'])) {
		throwNativeException('TypeError', 'Invalid type: ' + type(input).toLowerCase());
	}
	return;
}

/**
 * ECMA-262 Spec: <em>The abstract operation IsCallable determines if its argument, which must be an ECMAScript
 * language value, is a callable function Object</em>
 *
 * @method
 * @name module:Base.isCallable
 * @param {module:Base.BaseType} input The value to check if it's callable
 * @returns {Boolean} Whether or not the object is callable
 * @see ECMA-262 Spec Chapter 9.11
 */
exports.isCallable = isCallable;
function isCallable(input) {
	if (type(input) === 'Object') {
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
 * @name module:Base.sameValue
 * @param {module:Base.BooleanType} x The first value to compare
 * @param {module:Base.BooleanType} y The second value to compare
 * @returns {Boolean} Whether or not the values are the same
 * @see ECMA-262 Spec Chapter 9.12
 */
exports.sameValue = sameValue;
function sameValue(x, y) {
	return x.value === y.value;
}

/**
 * The Strict Equality Comparison Algorithm
 *
 * @method
 * @name module:Base.strictEquals
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
		case 'Undefined':
		case 'Null': return true;
		case 'Boolean':
		case 'Number':
		case 'String': return x.value === y.value;
		case 'Object': return x === y;
	}
}

/**
 * The Abstract Equality Comparison Algorithm
 *
 * @method
 * @name module:Base.strictEquals
 * @param {moduel:Base.BaseType} x The first value to compare
 * @param {moduel:Base.BaseType} y The second value to compare
 * @returns {Boolean} Whether or not the two equals are strictly equal
 * @see ECMA-262 Spec Chapter 11.9.3
 */
exports.abstractEquality = abstractEquality;
function abstractEquality(x, y) {
	var typeX = type(x),
		typeY = type(y),
		xValue = x.value,
		yValue = y.value;
	
	// Step 1
	if (typeY === typeX) {
		if (typeX === 'Undefined' || typeX === 'Null') {
			return true;
		}
		if (typeX === 'Number') {
			if (isNaN(xValue) || isNaN(yValue)) {
				return false;
			}
			return xValue === yValue;
		}
		if (typeX === 'String') {
			return xValue === yValue;
		}
		if (typeX === 'Boolean') {
			return xValue === yValue;
		}
		return x === y;
	}
	
	// Step 2
	if (typeX === 'Undefined' && typeY === 'Null') {
		return true;
	}
	
	// Step 3
	if (typeX === 'Null' && typeY === 'Undefined') {
		return true;
	}
	
	// Step 4
	if (typeX === 'Number' && typeY === 'String') {
		return abstractEquality(x, toNumber(y));
	}
	
	// Step 5
	if (typeX === 'String' && typeY === 'Number') {
		return abstractEquality(toNumber(x), y);
	}
	
	// Step 6
	if (typeX === 'Boolean') {
		return abstractEquality(toNumber(x), y);
	}
	
	// Step 7
	if (typeY === 'Boolean') {
		return abstractEquality(x, toNumber(y));
	}
	
	// Step 8
	if (typeY === 'Object' && (typeX === 'String' || typeX === 'Number')) {
		return abstractEquality(x, toPrimitive(y));
	}
	
	// Step 8
	if (typeX === 'Object' && (typeY === 'String' || typeY === 'Number')) {
		return abstractEquality(toPrimitive(x), y);
	}
	
	// Step 9
	return false;
}

/*global
Runtime
RuleProcessor
AST
UnknownType
UndefinedType
handleRecoverableNativeException
type
ReferenceType
isDefined
ObjectType
FunctionType
DataPropertyDescriptor
isAccessorDescriptor
throwNativeException
NumberType
throwTypeError
toObject
*/

/*****************************************
 *
 * Lexical Environments and Contexts
 *
 *****************************************/

// ******** DeclarativeEnvironmentRecord Class ********

function bindingExists (bindings, name) {
	return Object.prototype.hasOwnProperty.call(bindings, name);
}

/**
 * @classdesc ECMA-262 Spec: <em>Declarative environment records are used to define the effect of ECMAScript language
 * syntactic elements such as FunctionDeclarations, VariableDeclarations, and Catch clauses that directly associate
 * identifier bindings with ECMAScript language values. Each declarative environment record is associated with an
 * ECMAScript program scope containing variable and/or function declarations. A declarative environment record binds the
 * set of identifiers defined by the declarations contained within its scope.</em>
 *
 * @constructor
 * @name module:Base.DeclarativeEnvironmentRecord
 * @see ECMA-262 Spec Chapter 10.2.1
 * @name module:Base.DeclarativeEnvironmentRecord
 */
function DeclarativeEnvironmentRecord() {
	this._bindings = {};
	this._ambiguousContext = false;
}

/**
 * ECMA-262 Spec: <em>The concrete environment record method HasBinding for declarative environment records simply
 * determines if the argument identifier is one of the identifiers bound by the record</em>
 *
 * @method
 * @name module:Base.DeclarativeEnvironmentRecord#hasBinding
 * @param {String} n The name of the binding
 * @returns {Boolean} Whether or not this environment record has the binding
 * @see ECMA-262 Spec Chapter 10.2.1.1.1
 */
DeclarativeEnvironmentRecord.prototype.hasBinding = function hasBinding(n) {
	return bindingExists(this._bindings, n);
};

/**
 * ECMA-262 Spec: <em>The concrete Environment Record method CreateMutableBinding for declarative environment records
 * creates a new mutable binding for the name n that is initialised to the value undefined. A binding must not already
 * exist in this Environment Record for n. If Boolean argument d is provided and has the value true the new binding is
 * marked as being subject to deletion.</em>
 *
 * @method
 * @name module:Base.DeclarativeEnvironmentRecord#createMutableBinding
 * @param {String} n The name of the binding
 * @param {Boolean} [d] Whether or not the binding can be deleted
 * @throws Thrown if the binding already exists
 * @see ECMA-262 Spec Chapter 10.2.1.1.2
 */
DeclarativeEnvironmentRecord.prototype.createMutableBinding = function createMutableBinding(n, d) {
	var bindings = this._bindings;
	if (bindingExists(bindings, n)) {
		throw new Error('Could not create mutable binding: binding "' + n + '" already exists');
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
 * @name module:Base.DeclarativeEnvironmentRecord#setMutableBinding
 * @param {String} n The name of the binding
 * @param {module:Base.BaseType} v The value to set on the binding
 * @param {Boolean} s Indicates strict mode, i.e. whether or not an error should be thrown if the binding is not mutable
 * @throws Thrown if the binding does not exist
 * @see ECMA-262 Spec Chapter 10.2.1.1.3
 */
DeclarativeEnvironmentRecord.prototype.setMutableBinding = function setMutableBinding(n, v, s) {
	var bindings = this._bindings;
	if (!bindingExists(bindings, n)) {
		throw new Error('Could not set mutable binding: binding "' + n + '" does not exist');
	}

	if (!bindings[n].isMutable) {
		if (s) {
			handleRecoverableNativeException('TypeError', 'Could not set binding: binding "' + n + '" is not mutable');
			bindings[n].value = new UnknownType();
		} else {
			return;
		}
	}

	if (type(v) === 'Unknown' || !this.getBindingValue(n)._isLocal() || Runtime.isAmbiguousBlock()) {
		bindings[n].value = new UnknownType();
	} else {
		bindings[n].value = v;
	}
};

/**
 * ECMA-262 Spec: <em>The concrete Environment Record method GetBindingValue for declarative environment records simply
 * returns the value of its bound identifier whose name is the value of the argument n. The binding must already exist.
 * If s is true and the binding is an uninitialised immutable binding throw a ReferenceError exception.</em>
 *
 * @method
 * @name module:Base.DeclarativeEnvironmentRecord#getBindingValue
 * @param {String} n The name of the binding
 * @param {Boolean} s Indicates strict mode, i.e. whether or not an error should be thrown if the binding has not been
 *		initialized
 * @returns {{@link module:Base.BaseType}} The value of the binding
 * @throws Thrown if the binding does not exist
 * @see ECMA-262 Spec Chapter 10.2.1.1.4
 */
DeclarativeEnvironmentRecord.prototype.getBindingValue = function getBindingValue(n, s) {

	var binding = this._bindings[n];
	if (!bindingExists(this._bindings, n)) {
		throw new Error('Could not get value: binding "' + n + '" does not exist');
	}

	if (s && !binding.isMutable && !binding.isInitialized) {
		handleRecoverableNativeException('ReferenceError', 'Could not get value: binding "' + n + '" has not been initialized');
		return new UnknownType();
	}

	return binding.value;
};

/**
 * ECMA-262 Spec: <em>The concrete Environment Record method DeleteBinding for declarative environment records can only
 * delete bindings that have been explicitly designated as being subject to deletion.</em>
 *
 * @method
 * @name module:Base.DeclarativeEnvironmentRecord#deleteBinding
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
 * @name module:Base.DeclarativeEnvironmentRecord#implicitThisValue
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
 * @name module:Base.DeclarativeEnvironmentRecord#createImmutableBinding
 * @param {String} n The name of the binding
 * @throws Thrown if the binding already exists
 * @see ECMA-262 Spec Chapter 10.2.1.1.7
 */
DeclarativeEnvironmentRecord.prototype.createImmutableBinding = function createImmutableBinding(n) {

	var bindings = this._bindings;
	if (bindingExists(bindings, n)) {
		throw new Error('Could not create immutable binding: binding "' + n + '" already exists');
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
 * @name module:Base.DeclarativeEnvironmentRecord#initializeImmutableBinding
 * @param {String} n The name of the binding
 * @param {module:Base.BaseType} v The value to initialize the binding to
 * @throws Thrown if the binding does not exist
 * @throws Thrown if the binding is not immutable or has already been initialized
 * @see ECMA-262 Spec Chapter 10.2.1.1.8
 */
DeclarativeEnvironmentRecord.prototype.initializeImmutableBinding = function initializeImmutableBinding(n, v) {

	var binding = this._bindings[n];
	if (!binding) {
		throw new Error('Could not initialize immutable value: binding "' + n + '" does not exist');
	}

	if (binding.isInitialized !== false) {
		throw new Error('Could not initialize immutable value: binding "' + n + '" has either been initialized already or is not an immutable value');
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
 * @name module:Base.ObjectEnvironmentRecord
 * @see ECMA-262 Spec Chapter 10.2.1
 * @name module:Base.ObjectEnvironmentRecord
 */
function ObjectEnvironmentRecord(bindingObject) {
	if (!bindingObject) {
		throw '';
	}
	this._bindingObject = bindingObject;
	this._ambiguousContext = false;
}

/**
 * ECMA-262 Spec: <em>The concrete Environment Record method HasBinding for object environment records determines if its
 * associated binding object has a property whose name is the value of the argument n</em>
 *
 * @method
 * @name module:Base.ObjectEnvironmentRecord#hasBinding
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
 * @name module:Base.ObjectEnvironmentRecord#createMutableBinding
 * @param {String} n The name of the binding
 * @param {Boolean} [d] Whether or not the binding can be deleted
 * @param {Boolean} suppressEvent Suppresses the 'propertySet' event (used when setting prototypes)
 * @throws Thrown if the binding already exists
 * @see ECMA-262 Spec Chapter 10.2.1.2.2
 */
ObjectEnvironmentRecord.prototype.createMutableBinding = function createMutableBinding(n, d, suppressEvent) {
	var bindingObject = this._bindingObject;
	if (bindingObject.hasProperty(n)) {
		throw new Error('Internal Error: could not create mutable binding: binding "' + n + '" already exists');
	}

	bindingObject.defineOwnProperty(n, {
		value: new UndefinedType(),
		writable: true,
		enumerable: true,
		configurable: !!d
	}, true, suppressEvent);
};

/**
 * ECMA-262 Spec: <em>The concrete Environment Record method SetMutableBinding for object environment records attempts
 * to set the value of the environment record‘s associated binding object‘s property whose name is the value of the
 * argument n to the value of argument V. A property named N should already exist but if it does not or is not currently
 * writable, error handling is determined by the value of the Boolean argument s.</em>
 *
 * @method
 * @param {String} n The name of the binding
 * @name module:Base.ObjectEnvironmentRecord#setMutableBinding
 * @param {module:Base.BaseType} v The value to set on the binding
 * @param {Boolean} s Indicates strict mode, i.e. whether or not an error should be thrown if the binding is not mutable
 * @param {Boolean} suppressEvent Suppresses the 'propertySet' event (used when setting prototypes)
 * @see ECMA-262 Spec Chapter 10.2.1.2.3
 */
ObjectEnvironmentRecord.prototype.setMutableBinding = function setMutableBinding(n, v, s, suppressEvent) {
	this._bindingObject.put(n, v, s, suppressEvent);
};

/**
 * ECMA-262 Spec: <em>The concrete Environment Record method SetMutableBinding for object environment records attempts
 * to set the value of the environment record‘s associated binding object‘s property whose name is the value of the
 * argument n to the value of argument v. A property named N should already exist but if it does not or is not currently
 * writable, error handling is determined by the value of the Boolean argument s.</em>
 *
 * @method
 * @name module:Base.ObjectEnvironmentRecord#getBindingValue
 * @param {String} n The name of the binding
 * @param {Boolean} s Indicates strict mode, i.e. whether or not an error should be thrown if the binding has not been
 *		initialized
 * @returns {{@link module:Base.BaseType}} The value of the binding
 * @see ECMA-262 Spec Chapter 10.2.1.2.4
 */
ObjectEnvironmentRecord.prototype.getBindingValue = function getBindingValue(n, s) {
	var bindingObject = this._bindingObject;
	if (!bindingObject.hasProperty(n)) {
		if (s) {
			handleRecoverableNativeException('ReferenceError', 'Property ' + n + ' does not exist');
			return new UnknownType();
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
 * @name module:Base.ObjectEnvironmentRecord#deleteBinding
 * @param {String} n The name of the binding
 * @returns {Boolean} Whether or not the binding has been deleted
 * @see ECMA-262 Spec Chapter 10.2.1.2.5
 */
ObjectEnvironmentRecord.prototype.deleteBinding = function deleteBinding(n) {
	return this._bindingObject['delete'](n, false);
};

/**
 * ECMA-262 Spec: <em>Object Environment Records return undefined as their ImplicitThisValue unless their provideThis
 * flag is true.</em>
 *
 * @method
 * @name module:Base.ObjectEnvironmentRecord#implicitThisValue
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
 * @name module:Base~LexicalEnvironment
 * @param {module:Base.DeclarativeEnvironmentRecord|module:Base.ObjectEnvironmentRecord} [envRec] The environment record
 *		to associate with the new lexical environment
 * @param {module:Base.LexicalEnvironment} [outer] The outer lexical environment
 * @property {module:Base.DeclarativeEnvironmentRecord|module:Base.ObjectEnvironmentRecord} envRec The environment
 *		record associated with this lexical environment
 * @property {module:Base.LexicalEnvironment|undefined} outer The outer lexical environment of this lexical environment,
 *		if it exists
 * @see ECMA-262 Spec Chapter 10.2
 * @name module:Base.LexicalEnvironment
 */
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
 * @name module:Base.getIdentifierReference
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
 * @name module:Base.newDeclarativeEnvironment
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
 * @name module:Base.newObjectEnvironment
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
 * @name module:Base.ExecutionContext
 * @property {module:Base.LexicalEnvironment} lexicalEnvironment ECMA-262 Spec: <em>Identifies the Lexical Environment
 *		used to resolve identifier references made by code within this execution context.</em>
 * @property {module:Base.LexicalEnvironment} variableEnvironment ECMA-262 Spec: <em>Identifies the Lexical Environment
 *		whose environment record holds bindings created by VariableStatements and FunctionDeclarations within this
 *		execution context.</em>
 * @property {module:Base.ObjectType} thisBinding ECMA-262 Spec: <em>The value associated with the this keyword within
 *		ECMAScript code associated with this execution context.</em>
 * @property {Boolean} strict Indicates whether or not this execution context is strict mode
 * @name module:Base.ExecutionContext
 */
function ExecutionContext(lexicalEnvironment, variableEnvironment, thisBinding, strict) {
	this.lexicalEnvironment = lexicalEnvironment;
	this.variableEnvironment = variableEnvironment;
	this.thisBinding = thisBinding;
	this.strict = isDefined(strict) ? strict : false;
	this._ambiguousBlock = 0;
}

// ******** Context Creation Methods ********

/**
 * @private
 */
function findDeclarations(ast, context) {
	var functions = [],
		variables = [];

	AST.walk(ast, [
		{
			nodeType: 'AST_Defun',
			callback: function(node) {
				var formalParameterList = [],
					i, len;
				for(i = 0, len = node.argnames.length; i < len; i++) {
					formalParameterList.push(node.argnames[i].name);
				}
				node._lastKnownContext = context;
				functions.push(node);
				Runtime.addFunction(node);
				return true;
			}
		},
		{
			nodeType: 'AST_Var',
			callback: function(node) {
				var i, len;
				for (i = 0, len = node.definitions.length; i < len; i++) {
					variables.push({
						variableName: node.definitions[i].name.name
					});
					if (node.definitions[i].value && node.definitions[i].value.className === 'AST_Function') {
						node.definitions[i].value._lastKnownContext = context;
						Runtime.addFunction(node.definitions[i].value);
					}
				}
				return true;
			}
		},
		{
			nodeType: 'AST_Const',
			callback: function(node) {
				var i, len;
				for (i = 0, len = node.definitions.length; i < len; i++) {
					variables.push({
						variableName: node.definitions[i].name.name
					});
				}
				return true;
			}
		},
		{
			nodeType: 'AST_Function',
			callback: function(node) {
				node._lastKnownContext = context;
				Runtime.addFunction(node);
				return true;
			}
		}
	]);

	return {
		functions: functions,
		variables: variables
	};
}

/**
 * Creates the global context
 *
 * @method
 * @name module:Base.createGlobalContext
 * @param {module:AST.node} ast The AST associated with this global context
 * @returns {module:Base.ExecutionContext} The new global execution context
 * @see ECMA-262 Spec Chapter 10.4.1 and Chapter 10.5
 */
exports.createGlobalContext = createGlobalContext;
function createGlobalContext(ast) {

	// Create the context
	var globalObject = new ObjectType(),
		env = newObjectEnvironment(globalObject),
		executionContext = new ExecutionContext(
			env,
			env,
			globalObject,
			false),
		result,
		configurableBindings = false,
		functions,
		variables,
		i, len,
		fn,
		fo,
		funcAlreadyDeclared,
		existingProp,
		descriptor,
		dn,
		varAlreadyDeclared;
	globalObject._closure = globalObject;
	Runtime.setGlobalObject(globalObject);
	Runtime.enterContext(executionContext);

	if (ast) {
		result = findDeclarations(ast, executionContext);
		functions = result.functions;
		variables = result.variables;
		env = executionContext.variableEnvironment.envRec;

		// Find all of the function declarations and bind them
		for (i = 0, len = functions.length; i < len; i++) {
			fn = functions[i].name.name;
			fo = functions[i].processRule();
			funcAlreadyDeclared = env.hasBinding(fn);

			if (!funcAlreadyDeclared) {
				env.createMutableBinding(fn, configurableBindings);
			} else if (env === Runtime.getGlobalContext().variableEnvironment.envRec) {
				existingProp = globalObject.getProperty(fn);
				if (existingProp.configurable) {
					descriptor = new DataPropertyDescriptor();
					descriptor.writable = true;
					descriptor.enumerable = true;
					descriptor.configurable = configurableBindings;
					globalObject.defineOwnProperty(fn, descriptor, true);
				} else if (isAccessorDescriptor(existingProp) || (existingProp.writable !== true &&
						existingProp.enumerable !== true)) {
					throwNativeException('TypeError', fn +
						' is not a valid identifier name because a non-writable identifier with that name already exists');
				}
			}

			env.setMutableBinding(fn, fo, false);
		}

		// Find all of the variable declarations and bind them
		for (i = 0, len = variables.length; i < len; i++) {
			dn = variables[i].variableName,
			varAlreadyDeclared = env.hasBinding(dn);

			if (!varAlreadyDeclared) {
				env.createMutableBinding(dn, configurableBindings);
				env.setMutableBinding(dn, new UndefinedType(), false);
			}
		}
	}

	// Return the context
	return executionContext;
}

/**
 * Creates a module context
 *
 * @method
 * @name module:Base.createGlobalContext
 * @param {module:AST.node} ast The AST associated with this global context
 * @returns {module:Base.ExecutionContext} The new global execution context
 * @see ECMA-262 Spec Chapter 10.4.1 and Chapter 10.5
 */
exports.createModuleContext = createModuleContext;
function createModuleContext(ast, strict, createExports, ambiguous) {

	// Create the context
	var globalObject = new ObjectType(),
		env = newObjectEnvironment(globalObject, Runtime.getGlobalContext().variableEnvironment),
		configurableBindings = false,
		executionContext = new ExecutionContext(
			env,
			env,
			globalObject,
			strict),
		len, i,
		functions, variables, result,
		fn, fo,
		funcAlreadyDeclared,
		existingProp,
		descriptor,
		dn,
		varAlreadyDeclared,
		exportsObject;
	env.envRec._ambiguousContext = !!ambiguous;
	Runtime.enterContext(executionContext);
	env = executionContext.variableEnvironment.envRec;

	result = findDeclarations(ast, executionContext);
	functions = result.functions;
	variables = result.variables;

	if (createExports) {
		exportsObject = new ObjectType(),
		globalObject.put('exports', exportsObject, false);
		env.createMutableBinding('module', true);
		env.setMutableBinding('module', globalObject);
	}

	// Find all of the function declarations and bind them
	for (i = 0, len = functions.length; i < len; i++) {
		fn = functions[i].name.name;
		fo = functions[i].processRule();
		funcAlreadyDeclared = env.hasBinding(fn);

		if (!funcAlreadyDeclared) {
			env.createMutableBinding(fn, configurableBindings);
		} else if (env === Runtime.getGlobalContext().variableEnvironment.envRec) {
			existingProp = globalObject.getProperty(fn);
			if (existingProp.configurable) {
				descriptor = new DataPropertyDescriptor();
				descriptor.writable = true;
				descriptor.enumerable = true;
				descriptor.configurable = configurableBindings;
				globalObject.defineOwnProperty(fn, descriptor, true);
			} else if (isAccessorDescriptor(existingProp) || (existingProp.writable !== true &&
					existingProp.enumerable !== true)) {
				throwNativeException('TypeError', fn +
					' is not a valid identifier name because a non-writable identifier with that name already exists');
			}
		}

		env.setMutableBinding(fn, fo, strict);
	}

	// Find all of the variable declarations and bind them
	for (i = 0, len = variables.length; i < len; i++) {
		dn = variables[i].variableName,
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
 * @name module:Base.createEvalContext
 * @param {module:Base.ExecutionContext|undefined} callingContext The context that is evaling code
 * @param {module:AST.node} code The code associated with this eval context
 * @returns {module:Base.ExecutionContext} The new eval execution context
 * @see ECMA-262 Spec Chapter 10.4.2 and Chapter 10.5
 */
exports.createEvalContext = createEvalContext;
function createEvalContext(callingContext, code, strict, isDirectEval) {

	var globalObject = Runtime.getGlobalObject(),
		executionContext,
		env,
		configurableBindings = true,
		len, i,
		result,
		functions,
		variables,
		fn,
		fo,
		funcAlreadyDeclared,
		existingProp,
		descriptor,
		dn,
		varAlreadyDeclared;

	// Create or set the execution context
	if (!callingContext || !isDirectEval) {
		callingContext = Runtime.getModuleContext();
	}
	executionContext = new ExecutionContext(
		callingContext.lexicalEnvironment,
		callingContext.variableEnvironment,
		callingContext.thisBinding,
		callingContext.strict || strict
	);
	Runtime.enterContext(executionContext);

	// Create the inner lexical environment if this is strict mode code
	if (executionContext.strict) {
		executionContext.variableEnvironment = executionContext.lexicalEnvironment =
			newDeclarativeEnvironment(executionContext.lexicalEnvironment);
	}

	// Bind the function and variable declarations to the global context
	env = executionContext.variableEnvironment.envRec;
	result = findDeclarations(code, executionContext);
	functions = result.functions;
	variables = result.variables;

	// Find all of the function declarations and bind them
	for (i = 0, len = functions.length; i < len; i++) {
		fn = functions[i].name.name;
		fo = functions[i].processRule();
		funcAlreadyDeclared = env.hasBinding(fn);

		if (!funcAlreadyDeclared) {
			env.createMutableBinding(fn, configurableBindings);
		} else if (env === Runtime.getGlobalContext().variableEnvironment.envRec) {
			existingProp = globalObject.getProperty(fn);
			if (existingProp.configurable) {
				descriptor = new DataPropertyDescriptor();
				descriptor.writable = true;
				descriptor.enumerable = true;
				descriptor.configurable = configurableBindings;
				globalObject.defineOwnProperty(fn, descriptor, true);
			} else if (isAccessorDescriptor(existingProp) || (existingProp.writable !== true &&
					existingProp.enumerable !== true)) {
				throwNativeException('TypeError', fn +
					' is not a valid identifier name because a non-writable identifier with that name already exists');
			}
		}

		env.setMutableBinding(fn, fo, executionContext.strict);
	}

	// Find all of the variable declarations and bind them
	for (i = 0, len = variables.length; i < len; i++) {
		dn = variables[i].variableName;
		varAlreadyDeclared = env.hasBinding(dn);

		if (!varAlreadyDeclared) {
			env.createMutableBinding(dn, configurableBindings);
			env.setMutableBinding(dn, new UndefinedType(), executionContext.strict);
		}
	}

	return executionContext;
}

/**
 * ECMA-262 Spec: <em>When control enters an execution context for function code, an arguments object is created unless
 * (as specified in 10.5) the identifier arguments occurs as an Identifier in the function‘s FormalParameterList or
 * occurs as the Identifier of a VariableDeclaration or FunctionDeclaration contained in the function code.</em>
 *
 * @method
 * @name module:Base.createArgumentsObject
 * @param {module:Base.FunctionType} func ECMA-262 Spec: <em>the function object whose code is to be evaluated</em>
 * @param {Array[String]} names ECMA-262 Spec: <em>a List containing the function‘s formal parameter names</em>
 * @param {Array[{@link module:Base.BaseType}]} args ECMA-262 Spec: <em>the actual arguments passed to the [[call]] internal method</em>
 * @param {module:Base.LexicalEnvironment} env ECMA-262 Spec: <em>the variable environment for the function code</em>
 * @param {Boolean} strict ECMA-262 Spec: <em>a Boolean that indicates whether or not the function code is strict code</em>
 * @returns {module:Base.ObjectType} The arguments object
 * @see ECMA-262 Spec Chapter 10.4.2 and Chapter 10.6
 * @name module:Base.createArgumentsObject
 */
function createArgumentsObject(func, names, args, env, strict) {
	var len = args.length,
		obj = new ObjectType(),
		map = new ObjectType(),
		mappedNames = [],
		indx = len - 1,
		val,
		name;

	obj.className = 'Arguments';
	obj.defineOwnProperty('length', {
		value: new NumberType(len),
		writable: true,
		enumerable: false,
		configurable: true
	}, false, true);

	while (indx >= 0) {
		val = args[indx];
		obj.defineOwnProperty(indx, {
			value: val,
			writable: true,
			enumerable: true,
			configurable: true
		}, false, true);
		if (indx < names.length) {
			name = names[indx];
			if (!strict && !bindingExists(mappedNames, name)) {
				mappedNames.push(name);
				map.defineOwnProperty(indx, {
					// Note: we have to do this crazy parse since returns aren't allowedin global scope
					get: new FunctionType([], AST.parseString('function temp () { return ' + name + '; }').body[0].body, env, true),
					set: new FunctionType([name + '_arg'], AST.parseString(name + ' = ' + name + '_arg;').body, env, true),
					configurable: true
				}, false, true);
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
				if (p === 'callee' && v.className === 'Function' && v.strict) {
					throwNativeException('TypeError', 'Invalid identifier ' + p);
				}
				return v;
			}
		};

		obj.getOwnProperty = function getOwnProperty(p) {
			var desc = ObjectType.prototype.getOwnProperty.call(obj, p),
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
				allowed = ObjectType.prototype.defineOwnProperty.call(obj, p, desc, throwFlag);

			if (!allowed) {
				if (throwFlag) {
					throwNativeException('TypeError', 'Cannot define property ' + p);
				}
				return false;
			}

			if (isMapped) {
				if (isAccessorDescriptor(desc)) {
					map['delete'](p, false);
				} else {
					if (desc.value) {
						map.put(p, desc.value, throwFlag, true);
					}
					if (desc.writable === false) {
						map['delete'](p, false);
					}
				}
			}
		};

		obj['delete'] = function (p, throwFlag) {
			var isMapped = map.getOwnProperty(p),
				result = ObjectType.prototype['delete'].call(obj, p, throwFlag);
			if (result && isMapped) {
				map['delete'](p, false);
			}
			return result;
		};
	}

	if (strict) {
		obj.defineOwnProperty('caller', {
			get: throwTypeError,
			set: throwTypeError,
			enumerable: false,
			configurable: false
		}, false, true);
		obj.defineOwnProperty('callee', {
			get: throwTypeError,
			set: throwTypeError,
			enumerable: false,
			configurable: false
		}, false, true);
	} else {
		obj.defineOwnProperty('callee', {
			value: func,
			writable: true,
			enumerable: false,
			configurable: true
		}, false, true);
	}

	return obj;
}

/**
 * Creates a function context
 *
 * @method
 * @name module:Base.createFunctionContext
 * @param {module:Base.ObjectType} functionObject The function object of the context to be created.
 * @param {module:Base.ObjectType} thisArg The object to bind the this pointer to
 * @param {Array} argumentsList The list of function arguments
 * @returns {module:Base.ExecutionContext} The new global execution context
 * @see ECMA-262 Spec Chapter 10.4.3 and Chapter 10.5
 */
exports.createFunctionContext = createFunctionContext;
function createFunctionContext(functionObject, thisArg, argumentsList, scope) {

	// Create the context
	var globalObject = Runtime.getGlobalObject(),
		env = newDeclarativeEnvironment(scope || functionObject.scope),
		configurableBindings = false,
		strict = functionObject.strict,
		executionContext,
		len, i,
		arg, argName,
		functions, variables, result,
		thisArgType = type(thisArg),
		thisBinding,
		fn,
		fo,
		funcAlreadyDeclared,
		existingProp,
		descriptor,
		argsObj,
		dn,
		varAlreadyDeclared;

	// Create the this binding
	if (functionObject.strict) {
		thisBinding = thisArg;
	} else if (thisArgType === 'Null' || thisArgType === 'Undefined') {
		thisBinding = Runtime.getModuleContext().thisBinding;
	} else if (thisArgType !== 'Object') {
		thisBinding = toObject(thisArg);
	} else {
		thisBinding = thisArg;
	}

	// Create the execution context and find declarations inside of it
	executionContext = new ExecutionContext(env, env, thisBinding, strict);
	executionContext.isFunctionContext = true;
	Runtime.enterContext(executionContext);
	env = executionContext.variableEnvironment.envRec;
	result = findDeclarations(AST.createBodyContainer(functionObject.code), executionContext);
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
		fn = functions[i].name.name;
		fo = functions[i].processRule();
		funcAlreadyDeclared = env.hasBinding(fn);

		if (!funcAlreadyDeclared) {
			env.createMutableBinding(fn, configurableBindings);
		} else if (env === Runtime.getGlobalContext().variableEnvironment.envRec) {
			existingProp = globalObject.getProperty(fn);
			if (existingProp.configurable) {
				descriptor = new DataPropertyDescriptor();
				descriptor.writable = true;
				descriptor.enumerable = true;
				descriptor.configurable = configurableBindings;
				globalObject.defineOwnProperty(fn, descriptor, true);
			} else if (isAccessorDescriptor(existingProp) || (existingProp.writable !== true &&
					existingProp.enumerable !== true)) {
				throwNativeException('TypeError', fn +
					' is not a valid identifier name because a non-writable identifier with that name already exists');
			}
		}

		env.setMutableBinding(fn, fo, strict);
	}

	// Initialize the arguments variable
	if (!env.hasBinding('arguments')) {
		argsObj = createArgumentsObject(functionObject, functionObject.formalParameters, argumentsList, executionContext.variableEnvironment, strict);
		if (strict) {
			env.createImmutableBinding('arguments');
			env.initializeImmutableBinding('arguments', argsObj);
		} else {
			env.createMutableBinding('arguments');
			env.setMutableBinding('arguments', argsObj, false);
		}
	}

	// Find all of the variable declarations and bind them
	for (i = 0, len = variables.length; i < len; i++) {
		dn = variables[i].variableName;
		varAlreadyDeclared = env.hasBinding(dn);

		if (!varAlreadyDeclared) {
			env.createMutableBinding(dn, configurableBindings);
			env.setMutableBinding(dn, new UndefinedType(), strict);
		}
	}

	// Return the context
	return executionContext;
}

/*global
AST
Runtime
RuleProcessor
FunctionTypeBase
util
areAnyUnknown
UnknownType
type
handleRecoverableNativeException
createEvalContext
UndefinedType
throwNativeException
toString
toInt32
NumberType
BooleanType
toNumber
StringType
ObjectType
addReadOnlyProperty
NullType
ArrayType
isCallable
toInteger
isUndefined
*/

/*****************************************
 *
 * Global methods and objects
 *
 *****************************************/

/**
 * eval method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.1.2.1
 */
function EvalFunction(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(EvalFunction, FunctionTypeBase);
EvalFunction.prototype.call = function call(thisVal, args, isDirectEval, filename) {

	// Variable declarations
	var x = args[0],
		ast,
		result;
	filename = filename || Runtime.getCurrentLocation().filename;

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	// Step 1
	if (type(x) !== 'String') {
		return x;
	}

	// Step 2
	ast = AST.parseString(x.value, filename);
	if (ast.syntaxError) {
		handleRecoverableNativeException('SyntaxError', ast.message, {
				filename: filename,
				line: ast.line,
				column: ast.col
			});
		return new UnknownType();
	}

	// Step 3
	createEvalContext(Runtime.getCurrentContext(), ast, RuleProcessor.isBlockStrict(ast), isDirectEval);

	// Step 4
	result = ast.processRule();

	// Step 5
	Runtime.exitContext();

	// Step 6
	if (result[0] === 'normal') {
		return result[1] ? result[1] : new UndefinedType();
	} else {
		if (result[1]) {
			if (result[1].className.match('Error$')) {
				throwNativeException(result[1].get('name'), result[1].get('message'));
			} else {
				throwNativeException('Error', toString(result[1]).value);
			}
		} else {
			throwNativeException('Error');
		}
	}
};

/**
 * parseInt method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.1.2.2
 */
function ParseIntFunction(className) {
	FunctionTypeBase.call(this, 2, className || 'Function');
}
util.inherits(ParseIntFunction, FunctionTypeBase);
ParseIntFunction.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var string,
		radix,
		s,
		r;

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	// Steps 1, 2, and 6
	string = args[0];
	radix = args[1];
	s = toString(string).value.trim();
	r = radix && type(radix) !== 'Undefined' ? toInt32(radix).value : 10;

	// Use the built-in method to perform the parseInt
	return new NumberType(parseInt(s, r));
};

/**
 * parseFloat method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.1.2.3
 */
function ParseFloatFunction(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ParseFloatFunction, FunctionTypeBase);
ParseFloatFunction.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var string,
		s;

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	// Steps 1 and 2
	string = args[0];
	s = toString(string).value.trim();

	// Use the built-in method to perform the parseFloat
	return new NumberType(parseFloat(s));
};

/**
 * isNaN method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.1.2.4
 */
function IsNaNFunction(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(IsNaNFunction, FunctionTypeBase);
IsNaNFunction.prototype.call = function call(thisVal, args) {

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	// Use the built-in method to perform the isNaN
	return new BooleanType(isNaN(toNumber(args[0]).value));
};

/**
 * isFinite method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.1.2.5
 */
function IsFiniteFunction(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(IsFiniteFunction, FunctionTypeBase);
IsFiniteFunction.prototype.call = function call(thisVal, args) {

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	// Use the built-in method to perform the isFinite
	return new BooleanType(isFinite(toNumber(args[0]).value));
};

/**
 * decodeURI method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.1.3.1
 */
function DecodeURIFunction(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(DecodeURIFunction, FunctionTypeBase);
DecodeURIFunction.prototype.call = function call(thisVal, args) {

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	// Use the built-in method to perform the decodeURI
	return new StringType(decodeURI(toString(args[0]).value));
};

/**
 * decodeURIComponent method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.1.3.2
 */
function DecodeURIComponentFunction(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(DecodeURIComponentFunction, FunctionTypeBase);
DecodeURIComponentFunction.prototype.call = function call(thisVal, args) {

	// Use the built-in method to perform the decodeURI
	return new StringType(decodeURIComponent(toString(args[0]).value));
};

/**
 * encodeURI method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.1.3.3
 */
function EncodeURIFunction(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(EncodeURIFunction, FunctionTypeBase);
EncodeURIFunction.prototype.call = function call(thisVal, args) {

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	// Use the built-in method to perform the decodeURI
	return new StringType(encodeURI(toString(args[0]).value));
};

/**
 * encodeURIComponent method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.1.3.4
 */
function EncodeURIComponentFunction(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(EncodeURIComponentFunction, FunctionTypeBase);
EncodeURIComponentFunction.prototype.call = function call(thisVal, args) {

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	// Use the built-in method to perform the decodeURI
	return new StringType(encodeURIComponent(toString(args[0]).value));
};

/*****************************************
 *
 * Chapter 15 - Global Objects
 *
 *****************************************/

// ******** Math Object ********

/**
 * abs() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.1
 */
function MathAbsFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(MathAbsFunc, FunctionTypeBase);
MathAbsFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var x = args[0];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	if (!x) {
		return new NumberType(NaN);
	} else {
		return new NumberType(Math.abs(toNumber(x).value));
	}
};

/**
 * acos() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.2
 */
function MathAcosFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(MathAcosFunc, FunctionTypeBase);
MathAcosFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var x = args[0];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	if (!x) {
		return new NumberType(NaN);
	} else {
		return new NumberType(Math.acos(toNumber(x).value));
	}
};

/**
 * asin() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.3
 */
function MathAsinFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(MathAsinFunc, FunctionTypeBase);
MathAsinFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var x = args[0];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	return new NumberType(x ? Math.asin(toNumber(x).value) : NaN);
};

/**
 * atan() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.4
 */
function MathAtanFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(MathAtanFunc, FunctionTypeBase);
MathAtanFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var x = args[0];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	if (!x) {
		return new NumberType(NaN);
	} else {
		return new NumberType(Math.atan(toNumber(x).value));
	}
};

/**
 * atan2() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.5
 */
function MathAtan2Func(className) {
	FunctionTypeBase.call(this, 2, className || 'Function');
}
util.inherits(MathAtan2Func, FunctionTypeBase);
MathAtan2Func.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var x = args[0];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	if (!x) {
		return new NumberType(NaN);
	} else {
		return new NumberType(Math.abs(toNumber(x).value));
	}
};

/**
 * ceil() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.6
 */
function MathCeilFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(MathCeilFunc, FunctionTypeBase);
MathCeilFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var x = args[0];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	if (!x) {
		return new NumberType(NaN);
	} else {
		return new NumberType(Math.ceil(toNumber(x).value));
	}
};

/**
 * cos() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.7
 */
function MathCosFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(MathCosFunc, FunctionTypeBase);
MathCosFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var x = args[0];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	if (!x) {
		return new NumberType(NaN);
	} else {
		return new NumberType(Math.cos(toNumber(x).value));
	}
};

/**
 * exp() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.8
 */
function MathExpFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(MathExpFunc, FunctionTypeBase);
MathExpFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var x = args[0];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	if (!x) {
		return new NumberType(NaN);
	} else {
		return new NumberType(Math.exp(toNumber(x).value));
	}
};

/**
 * floor() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.9
 */
function MathFloorFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(MathFloorFunc, FunctionTypeBase);
MathFloorFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var x = args[0];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	if (!x) {
		return new NumberType(NaN);
	} else if (type(x) === 'Unknown') {
		return new UnknownType();
	} else {
		return new NumberType(Math.floor(toNumber(x).value));
	}
};

/**
 * log() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.10
 */
function MathLogFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(MathLogFunc, FunctionTypeBase);
MathLogFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var x = args[0];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	if (!x) {
		return new NumberType(NaN);
	} else {
		return new NumberType(Math.log(toNumber(x).value));
	}
};

/**
 * max() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.11
 */
function MathMaxFunc(className) {
	FunctionTypeBase.call(this, 2, className || 'Function');
}
util.inherits(MathMaxFunc, FunctionTypeBase);
MathMaxFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var i = 0,
		len = args.length,
		value,
		values = [];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	for(; i < len; i++) {
		value = toNumber(args[i]);
		if (type(value) === 'Unknown') {
			return new UnknownType();
		}
		values.push(toNumber(value).value);
	}
	return new NumberType(Math.max.apply(this, values));
};

/**
 * min() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.12
 */
function MathMinFunc(className) {
	FunctionTypeBase.call(this, 2, className || 'Function');
}
util.inherits(MathMinFunc, FunctionTypeBase);
MathMinFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var i = 0,
		len = args.length,
		value,
		values = [];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	for(; i < len; i++) {
		value = toNumber(args[i]);
		if (type(value) === 'Unknown') {
			return new UnknownType();
		}
		values.push(toNumber(value).value);
	}
	return new NumberType(Math.min.apply(this, values));
};

/**
 * pow() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.13
 */
function MathPowFunc(className) {
	FunctionTypeBase.call(this, 2, className || 'Function');
}
util.inherits(MathPowFunc, FunctionTypeBase);
MathPowFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var x = args[0],
		y = args[1];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	if (!x || !y) {
		return new NumberType(NaN);
	} else {
		return new NumberType(Math.pow(toNumber(x).value, toNumber(y).value));
	}
};

/**
 * random() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.14
 */
function MathRandomFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(MathRandomFunc, FunctionTypeBase);
MathRandomFunc.prototype.call = function call() {
	return new UnknownType();
};

/**
 * round() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.15
 */
function MathRoundFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(MathRoundFunc, FunctionTypeBase);
MathRoundFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var x = args[0];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	if (!x) {
		return new NumberType(NaN);
	} else {
		return new NumberType(Math.round(toNumber(x).value));
	}
};

/**
 * sin() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.16
 */
function MathSinFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(MathSinFunc, FunctionTypeBase);
MathSinFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var x = args[0];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	if (!x) {
		return new NumberType(NaN);
	} else {
		return new NumberType(Math.sin(toNumber(x).value));
	}
};

/**
 * sqrt() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.17
 */
function MathSqrtFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(MathSqrtFunc, FunctionTypeBase);
MathSqrtFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var x = args[0];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	if (!x) {
		return new NumberType(NaN);
	} else {
		return new NumberType(Math.sqrt(toNumber(x).value));
	}
};

/**
 * tan() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8.2.17
 */
function MathTanFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(MathTanFunc, FunctionTypeBase);
MathTanFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var x = args[0];

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	if (!x) {
		return new NumberType(NaN);
	} else {
		return new NumberType(Math.tan(toNumber(x).value));
	}
};

/**
 * Math Object
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.8
 */
function MathObject(className) {
	ObjectType.call(this, className);

	// Properties
	addReadOnlyProperty(this, 'E', new NumberType(Math.E));
	addReadOnlyProperty(this, 'LN10', new NumberType(Math.LN10));
	addReadOnlyProperty(this, 'LN2', new NumberType(Math.LN2));
	addReadOnlyProperty(this, 'LOG2E', new NumberType(Math.LOG2E));
	addReadOnlyProperty(this, 'LOG10E', new NumberType(Math.LOG10E));
	addReadOnlyProperty(this, 'PI', new NumberType(Math.PI));
	addReadOnlyProperty(this, 'SQRT1_2', new NumberType(Math.SQRT1_2));
	addReadOnlyProperty(this, 'SQRT2', new NumberType(Math.SQRT2));

	// Methods
	this.put('abs', new MathAbsFunc(), false, true);
	this.put('acos', new MathAcosFunc(), false, true);
	this.put('asin', new MathAsinFunc(), false, true);
	this.put('atan', new MathAtanFunc(), false, true);
	this.put('atan2', new MathAtan2Func(), false, true);
	this.put('ceil', new MathCeilFunc(), false, true);
	this.put('cos', new MathCosFunc(), false, true);
	this.put('exp', new MathExpFunc(), false, true);
	this.put('floor', new MathFloorFunc(), false, true);
	this.put('log', new MathLogFunc(), false, true);
	this.put('max', new MathMaxFunc(), false, true);
	this.put('min', new MathMinFunc(), false, true);
	this.put('pow', new MathPowFunc(), false, true);
	this.put('random', new MathRandomFunc(), false, true);
	this.put('round', new MathRoundFunc(), false, true);
	this.put('sin', new MathSinFunc(), false, true);
	this.put('sqrt', new MathSqrtFunc(), false, true);
	this.put('tan', new MathTanFunc(), false, true);
}
util.inherits(MathObject, ObjectType);

// ******** JSON Object ********

/**
 * parse() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.12.2
 */
function JSONParseFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(JSONParseFunc, FunctionTypeBase);
JSONParseFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var text = args[0],
		reviver = args[1],
		nativeObject;

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	// Parse the code
	try {
		nativeObject = JSON.parse(toString(text).value);
	} catch(e) {
		handleRecoverableNativeException('SyntaxError', e.message);
		return new UnknownType();
	}

	// Convert the result into an object type
	function processObject(native) {
		var converted,
			p,
			child,
			i, len;

		function setProperty(k, v, obj) {
			if (reviver) {
				converted.put(k, v, true, true);
				v = reviver.call(obj, [k, v]);
				if (type(v) !== 'Undefined') {
					converted.put(k, v, true);
				} else {
					converted['delete'](k, false);
				}
			} else {
				converted.put(k, v, true, true);
			}
		}

		switch(typeof native) {
			case 'undefined':
				return new UndefinedType();
			case 'null':
				return new NullType();
			case 'string':
				return new StringType(native);
			case 'number':
				return new NumberType(native);
			case 'boolean':
				return new BooleanType(native);
			case 'object':
				if (Array.isArray(native)) {
					converted = new ArrayType();
					for(i = 0, len = native.length; i < len; i++) {
						child = processObject(native[i]);
						setProperty(i, child, converted);
					}
				} else {
					converted = new ObjectType();
					for(p in native) {
						setProperty(p, processObject(native[p]), converted);
					}
				}
				return converted;
		}
	}
	return processObject(nativeObject);
};

/**
 * parse() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.12.3
 */
function JSONStringifyFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(JSONStringifyFunc, FunctionTypeBase);
JSONStringifyFunc.prototype.call = function call(thisVal, args) {

	// Variable declarations
	var value = args[0],
		replacer = args[1],
		space = args[2],
		replacerFunction,
		propertyList,
		v,
		i, len,
		gap,
		stack = [],
		indent = '',
		wrapper,
		result;

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	function str(key, holder) {

		// Step 1
		var value = holder.get(key),
			toJSON;

		// Step 2
		if (type(value) === 'Object') {
			toJSON = value.get('toJSON');
			if (type(toJSON) === 'Unknown') {
				throw 'Unknown';
			}
			if (isCallable(toJSON)) {
				value = toJSON.call(value, [key]);
			}
		}

		// Step 3
		if (replacerFunction) {
			value = replacerFunction.call(holder, [key, value]);
		}

		// Step 4
		if (type(value) == 'Object') {
			if (value.className === 'Number') {
				value = toNumber(value);
			}
			if (value.className === 'String') {
				value = toString(value);
			}
			if (value.className === 'Boolean') {
				value = new BooleanType(value.primitiveValue);
			}
		}

		// Steps 5-7
		if (type(value) === 'Null') {
			return 'null';
		} else if (value.value === false) {
			return 'false';
		} else if (value.value === true) {
			return 'true';
		}

		// Step 8
		if (type(value) === 'String') {
			return quote(value.value);
		}

		// Step 9
		if (type(value) === 'Number') {
			if (isFinite(value.value)) {
				return toString(value).value;
			} else {
				return 'null';
			}
		}

		// Step 10
		if (type(value) === 'Unknown') {
			throw 'Unknown';
		}
		if (type(value) === 'Object' && isCallable(value)) {
			if (value.className === 'Array') {
				return ja(value);
			}
			return jo(value);
		}

		return undefined;
	}

	function quote(value) {
		return JSON.stringify(value);
	}

	function jo(value) {

		var stepBack = indent,
			k,
			p,
			i, len,
			partial = [],
			strP,
			member,
			final;

		// Step 1
		if (stack.indexOf(value) !== -1) {
			handleRecoverableNativeException('TypeError');
			throw 'Unknown';
		}

		// Step 2
		stack.push(value);

		// Step 4
		indent += gap;

		// Steps 5 and 6
		if (propertyList) {
			k = propertyList;
		} else {
			k = [];
			value._getPropertyNames().forEach(function (p) {
				if (value._lookupProperty(p).enumerable) {
					k.push(p);
				}
			});
		}

		// Step 8
		for(i = 0, len = k.length; i < len; i++) {
			p = k[i];
			strP = str(p, value);
			if (strP) {
				member = quote(p) + ':';
				if (gap) {
					member += space;
				}
				member += strP;
				partial.push(member);
			}
		}

		// Steps 9 and 10
		if (!partial) {
			final = '{}';
		} else {
			if (!gap) {
				final = '{' + partial.join(',') + '}';
			} else {
				final = '{\n' + indent + partial.join(',\n' + indent) + '\n' + stepBack + '}';
			}
		}

		// Step 11
		stack.pop();

		// Step 12
		indent = stepBack;

		// Step 12
		return final;
	}

	function ja(value) {

		var stepBack = indent,
			partial = [],
			len,
			index = 0,
			strP,
			final;

		// Step 1
		if (stack.indexOf(value) !== -1) {
			handleRecoverableNativeException('TypeError');
			throw 'Unknown';
		}

		// Step 2
		stack.push(value);

		// Step 4
		indent += gap;

		// Step 6
		len = value.get('length').value;

		// Step 8
		while (index < len) {
			strP = str(toString(new NumberType(index)).value, value);
			if (strP) {
				partial.push(strP);
			} else {
				partial.push('null');
			}
			index++;
		}

		// Steps 9 and 10
		if (!partial) {
			final = '[]';
		} else {
			if (!gap) {
				final = '[' + partial.join(',') + ']';
			} else {
				final = '[\n' + indent + partial.join(',\n' + indent) + '\n' + stepBack + ']';
			}
		}

		// Step 11
		stack.pop();

		// Step 12
		indent = stepBack;

		// Step 12
		return final;
	}

	// Parse the replacer argument, Step 4
	if (replacer && type(replacer) === 'Object') {
		if (isCallable(replacer)) {
			replacerFunction = replacer;
		} else if (replacer.className === 'Array') {
			propertyList = [];
			for(i = 0, len = toInteger(replacer.get('length')).value; i < len; i++) {
				v = replacer.get(i);
				if (v.className === 'String' || v.className === 'Number') {
					v = toString(v).value;
					if (propertyList.indexOf(v) === -1) {
						propertyList.push(v);
					}
				}
			}
		}
	}

	// Parse the space argument, steps 5-8
	if (space) {
		if (space.className === 'Number') {
			space = Math.min(10, toNumber(space).value);
			gap = (new Array(space)).join(' ');
		} else if (space.className === 'String') {
			gap = toString(space).value.substring(0, 9);
			space = space.value;
		} else {
			space = undefined;
			gap = '';
		}
	} else {
		gap = '';
	}

	// Step 10
	wrapper = new ObjectType();
	wrapper.defineOwnProperty('', {
		value: value,
		writable: true,
		enumerable: true,
		configurable: true
	}, false);

	// Step 11
	try {
		result = str('', wrapper);
	} catch(e) {
		if (e === 'Unknown') {
			return new UnknownType();
		} else {
			throw e;
		}
	}
	if (isUndefined(result)) {
		return new UndefinedType();
	} else {
		return new StringType(result);
	}
};

/**
 * JSON Object
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.12
 */
function JSONObject(className) {
	ObjectType.call(this, className);

	this.put('parse', new JSONParseFunc(), false, true);
	this.put('stringify', new JSONStringifyFunc(), false, true);
}
util.inherits(JSONObject, ObjectType);

/*global
Runtime
throwNativeException
prototypes
throwTypeError
addReadOnlyProperty
ObjectType
FunctionType
NumberType
UndefinedType
newObjectEnvironment
ExecutionContext
NumberPrototypeType
BooleanPrototypeType
StringPrototypeType
ObjectPrototypeType
ArrayPrototypeType
FunctionPrototypeType
RegExpPrototypeType
DatePrototypeType
ErrorPrototypeType
NumberConstructor
BooleanConstructor
StringConstructor
ObjectConstructor
ArrayConstructor
FunctionConstructor
RegExpConstructor
DateConstructor
ErrorConstructor
EvalFunction
ParseIntFunction
ParseFloatFunction
IsNaNFunction
IsFiniteFunction
DecodeURIFunction
DecodeURIComponentFunction
EncodeURIFunction
EncodeURIComponentFunction
MathObject
JSONObject
addNonEnumerableProperty
*/

/*****************************************
 *
 * VM Initialization
 *
 *****************************************/

/**
 * Injects the global objects into the global namespace
 *
 * @method
 * @name module:Base.init
 */
exports.init = init;
function init() {

	var globalObject = Runtime.getGlobalObject(),
		globalContext = Runtime.getGlobalContext(),
		globalObjects = {};

	function addObject(name, value) {
		globalObject.defineOwnProperty(name, {
			value: value,
			writable: true,
			enumerable: false,
			configurable: true
		}, false, true);
	}

	// Create the prototypes
	prototypes.Number = new NumberPrototypeType();
	prototypes.Boolean = new BooleanPrototypeType();
	prototypes.String = new StringPrototypeType();
	prototypes.Object = new ObjectPrototypeType();
	prototypes.Array = new ArrayPrototypeType();
	prototypes.Function = new FunctionPrototypeType();
	prototypes.RegExp = new RegExpPrototypeType();
	prototypes.Date = new DatePrototypeType();
	prototypes.Error = new ErrorPrototypeType('Error');
	prototypes.EvalError = new ErrorPrototypeType('EvalError');
	prototypes.RangeError = new ErrorPrototypeType('RangeError');
	prototypes.ReferenceError = new ErrorPrototypeType('ReferenceError');
	prototypes.SyntaxError = new ErrorPrototypeType('SyntaxError');
	prototypes.TypeError = new ErrorPrototypeType('TypeError');
	prototypes.URIError = new ErrorPrototypeType('URIError');

	// Set the error prototypes
	prototypes.EvalError.objectPrototype =
		prototypes.RangeError.objectPrototype =
		prototypes.ReferenceError.objectPrototype =
		prototypes.SyntaxError.objectPrototype =
		prototypes.TypeError.objectPrototype =
		prototypes.URIError.objectPrototype =
		prototypes.Error;

	// Create the global objects and set the constructors
	addNonEnumerableProperty(prototypes.Number, 'constructor', globalObjects.Number = new NumberConstructor(), false, true);
	addNonEnumerableProperty(prototypes.Boolean, 'constructor', globalObjects.Boolean = new BooleanConstructor(), false, true);
	addNonEnumerableProperty(prototypes.String, 'constructor', globalObjects.String = new StringConstructor(), false, true);
	addNonEnumerableProperty(prototypes.Object, 'constructor', globalObjects.Object = new ObjectConstructor(), false, true);
	addNonEnumerableProperty(prototypes.Array, 'constructor', globalObjects.Array = new ArrayConstructor(), false, true);
	addNonEnumerableProperty(prototypes.Function, 'constructor', globalObjects.Function = new FunctionConstructor(), false, true);
	addNonEnumerableProperty(prototypes.RegExp, 'constructor', globalObjects.RegExp = new RegExpConstructor(), false, true);
	addNonEnumerableProperty(prototypes.Date, 'constructor', globalObjects.Date = new DateConstructor(), false, true);
	addNonEnumerableProperty(prototypes.Error, 'constructor', globalObjects.Error = new ErrorConstructor('Error'), false, true);
	addNonEnumerableProperty(prototypes.EvalError, 'constructor', globalObjects.EvalError = new ErrorConstructor('EvalError'), false, true);
	addNonEnumerableProperty(prototypes.RangeError, 'constructor', globalObjects.RangeError = new ErrorConstructor('RangeError'), false, true);
	addNonEnumerableProperty(prototypes.ReferenceError, 'constructor', globalObjects.ReferenceError = new ErrorConstructor('ReferenceError'), false, true);
	addNonEnumerableProperty(prototypes.SyntaxError, 'constructor', globalObjects.SyntaxError = new ErrorConstructor('SyntaxError'), false, true);
	addNonEnumerableProperty(prototypes.TypeError, 'constructor', globalObjects.TypeError = new ErrorConstructor('TypeError'), false, true);
	addNonEnumerableProperty(prototypes.URIError, 'constructor', globalObjects.URIError = new ErrorConstructor('URIError'), false, true);

	// Create the throw type error
	throwTypeError = new FunctionType([], undefined, globalContext.lexicalEnvironment, globalContext.strict);
	throwTypeError.call = function () {
		throwNativeException('TypeError', '');
	};
	throwTypeError.extensible = false;

	// Properties
	addReadOnlyProperty(globalObject, 'NaN', new NumberType(NaN));
	addReadOnlyProperty(globalObject, 'Infinity', new NumberType(Infinity));
	addReadOnlyProperty(globalObject, 'undefined', new UndefinedType());

	// Methods
	addObject('eval', new EvalFunction());
	addObject('parseInt', new ParseIntFunction());
	addObject('parseFloat', new ParseFloatFunction());
	addObject('isNaN', new IsNaNFunction());
	addObject('isFinite', new IsFiniteFunction());
	addObject('decodeURI', new DecodeURIFunction());
	addObject('decodeURIComponent', new DecodeURIComponentFunction());
	addObject('encodeURI', new EncodeURIFunction());
	addObject('encodeURIComponent', new EncodeURIComponentFunction());

	// Types
	addObject('Object', globalObjects.Object);
	addObject('Function', globalObjects.Function);
	addObject('Array', globalObjects.Array);
	addObject('String', globalObjects.String);
	addObject('Boolean', globalObjects.Boolean);
	addObject('Number', globalObjects.Number);
	addObject('Date', globalObjects.Date);
	addObject('RegExp', globalObjects.RegExp);
	addObject('Error', globalObjects.Error);
	addObject('EvalError', globalObjects.EvalError);
	addObject('RangeError', globalObjects.RangeError);
	addObject('ReferenceError', globalObjects.ReferenceError);
	addObject('SyntaxError', globalObjects.SyntaxError);
	addObject('TypeError', globalObjects.TypeError);
	addObject('URIError', globalObjects.URIError);

	// Objects
	addObject('Math', new MathObject());
	addObject('JSON', new JSONObject());
}

/*global
Runtime
StringType
*/

/*****************************************
 *
 * Exception handling
 *
 *****************************************/

/**
 * Throws a native exception if exception recovery is turned off, else reports an error but doesn't actually throw
 * the exception.
 *
 * @method
 * @name module:Base.handleRecoverableNativeException
 * @param {String} exceptionType The type of exception, e.g. 'TypeError'
 * @param {String} message The exception message
 */
exports.handleRecoverableNativeException = handleRecoverableNativeException;
function handleRecoverableNativeException(exceptionType, message, location) {
	var exception;
	if (!Runtime.inTryCatch() && Runtime.options.nativeExceptionRecovery && !Runtime.options.exactMode) {
		exception = Runtime.getGlobalObject().get(exceptionType).construct([new StringType(message)]);
		location = location || Runtime.getCurrentLocation();
		exception.filename = location.filename;
		exception.line = location.line;
		exception.column = location.column;
		Runtime.reportError(exceptionType, 'An exception was thrown but not caught: ' + message, {
			description: 'Uncaught exception',
			exception: exception
		});
	} else {
		throwNativeException(exceptionType, message, location);
	}
}

/**
 * Throws a native exception. Due to the internal nature, we have to do a little tricker to get the result inserted into
 * the rule processing flow.
 *
 * @method
 * @name module:Base.throwNativeException
 * @param {String} exceptionType The type of exception, e.g. 'TypeError'
 * @param {String} message The exception message
 */
exports.throwNativeException = throwNativeException;
function throwNativeException (exceptionType, message, location) {
	throwException(Runtime.getGlobalObject().get(exceptionType).construct([new StringType(message)]), location);
}

/**
 * Throws a native exception. Due to the internal nature, we have to do a little trick to get the result inserted into
 * the rule processing flow.
 *
 * @method
 * @name module:Base.throwException
 * @param {String} exceptionType The type of exception, e.g. 'TypeError'
 * @param {String} message The exception message
 */
exports.throwException = throwException;
function throwException (exception, location) {
	var error;
	location = location || Runtime.getCurrentLocation();

	// Set the exception
	exception.filename = location.filename;
	exception.line = location.line;
	exception.column = location.column;
	exception.stackTrace = Runtime.getStackTrace();
	Runtime._exception = exception;

	error = new Error('VM exception flow controller');
	error.isCodeProcessorException = true;

	throw error;
}