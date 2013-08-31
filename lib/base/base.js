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

RuleProcessor.setThrowNativeException(throwNativeException);

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
 * Checks if two values are the same
 *
 * @method
 * @private
 * @param {module:Base.BaseType} x The first type
 * @param {module:Base.BaseType} y The second type
 * @returns {Boolean} Whether or not the values are the same
 */
function sameValue(x, y) {
	if (typeof x === 'undefined' && typeof y === 'undefined') {
		return true;
	}
	if (typeof x === 'undefined' || typeof y === 'undefined') {
		return false;
	}
	if (x.type !== y.type) {
		return false;
	}
	if (x.type === 'Undefined' || x.type === 'Null') {
		return true;
	}
	if (x.type === 'Boolean' || x.type === 'Number' || x.type === 'String') {
		return x.value === y.value;
	}
	return x === y;
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
	var i, len;
	for (i = 0, len = values.length; i < len; i++) {
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

/**
 * Clones an arbitrary value
 *
 * @method
 * @param {module:Base.ObjectType} source The value to clone
 */
exports.cloneValue = cloneValue;
function cloneValue(source) {
	throw new Error('Not Implemented');
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
	var i, len;
	p = p.toString();
	for (i = 0, len = this._properties.length; i < len; i++) {
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
	var i, len;
	p = p.toString();
	for (i = 0, len = this._properties.length; i < len; i++) {
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
	var i, len,
		properties = [];
	for (i = 0, len = this._properties.length; i < len; i++) {
		properties[i] = this._properties[i]._name;
	}
	return properties;
};