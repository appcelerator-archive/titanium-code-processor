/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
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
 */
/*global
throwNativeException
*/

var util = require('util'),

	Runtime = require('./Runtime'),
	RuleProcessor = require('./RuleProcessor'),
	AST = require('./AST'),

	throwTypeError,

	positiveIntegerRegEx = /^\d*$/,

	prototypes = {};

require('es6-shim');

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
 * @method module:Base.isPrimitive
 * @private
 * @param {module:Base.BaseType} o The value to check
 * @returns {boolean} Whether or not the value is a primitive
 */
function isPrimitive(o) {
	return !!~['Number', 'String', 'Boolean', 'Undefined', 'Null'].indexOf(o && o.className);
}

/**
 * Checks if the given value is an object type (Object, Function, Array, etc)
 *
 * @method module:Base.isObject
 * @private
 * @param {module:Base.BaseType} o The value to check
 * @returns {boolean} Whether or not the value is a primitive
 */
function isObject(o) {
	return !isPrimitive(o);
}

/**
 * Checks if two values are the same
 *
 * @method module:Base.sameValue
 * @private
 * @param {module:Base.BaseType} x The first type
 * @param {module:Base.BaseType} y The second type
 * @returns {boolean} Whether or not the values are the same
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
 * @method module:Base.areAnyUnknown
 * @private
 * @param {Array.<module:Base.BaseType>} values The values to check for unknown
 * @param {boolean} Whether or not any of the supplied values are unknown
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
 * Adds a read-only prop to an object
 *
 * @method module:Base.addReadOnlyProperty
 * @private
 * @param {module:Base.BaseType} obj The object to add the property to
 * @param {string} name The name of the property
 * @param {module:Base.BaseType} value The value of the new property
 */
function addReadOnlyProperty(obj, name, value) {
	obj.defineOwnProperty(name, { value: value }, false, true);
}

/**
 * Adds a non-enumerable but writable prop to an object
 *
 * @method module:Base.addNonEnumerableProperty
 * @private
 * @param {module:Base.BaseType} obj The object to add the property to
 * @param {string} name The name of the property
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
 * @method module:Base.type
 * @param {module:Base.BaseType} t The value to check
 * @returns {string} The type of the value, one of 'Undefined', 'Null', 'Number', 'String', 'Boolean', 'Object',
 *		'Reference', 'Unknown'.
 */
exports.type = type; // We do the exports first to get docgen to recognize the function properly
function type(t) {
	return t.type;
}

/**
 * Checks if the supplied value is one of the supplied types.
 *
 * @method module:Base.isType
 * @param {module:Base.baseType} value The value to check
 * @param {(string | Array.<string>)} types The types to check against
 * @returns {boolean} Whether or not the value is one of the types
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
 * @constructor module:Base.BaseType
 * @extends module:Runtime.Evented
 * @param {string} className The name of the class, such as 'String' or 'Object'
 */
exports.BaseType = BaseType;
function BaseType(className) {
	Runtime.Evented.call(this);
	this.className = className;
	this._closure = getCurrentContext();
}
util.inherits(BaseType, Runtime.Evented);

/**
 * Checks if this value is local to an ambiguous context (always true if not in an ambiguous context)
 *
 * @private
 */
BaseType.prototype._isLocal = function () {
	var lexicalEnvironment = getCurrentContext().lexicalEnvironment,
		targetLexicalEnvironment = this._closure.lexicalEnvironment;
	while (lexicalEnvironment) {
		if (targetLexicalEnvironment === lexicalEnvironment) {
			return true;
		} else if (lexicalEnvironment.envRec._ambiguousContext) {
			return false;
		}
		lexicalEnvironment = lexicalEnvironment.outer;
	}
	return true;
};

/**
 * @private
 */
BaseType.prototype._isSkippedLocal = function () {
	var contextStack = getContextStack(),
		targetLexicalEnvironment = this._closure.lexicalEnvironment,
		i;
	for (i = contextStack.length - 1; i >= 0; i--) {
		if (targetLexicalEnvironment === contextStack[i].lexicalEnvironment) {
			return true;
		} else if (contextStack[i].lexicalEnvironment.envRec._skippedModeStack.length) {
			return false;
		}
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
BaseType.prototype._lookupProperty = function (p, alternate) {
	var i, len;
	p = p.toString();
	for (i = 0, len = this._properties.length; i < len; i++) {
		if (this._properties[i].name === p) {
			return alternate ? this._properties[i].alternateValues : this._properties[i].value;
		}
	}
};

/**
 * Adds a property
 *
 * @private
 */
BaseType.prototype._addProperty = function (p, desc) {
	var entry,
		i, len;
	p = p.toString();
	for (i = 0, len = this._properties.length; i < len; i++) {
		if (this._properties[i].name === p) {
			entry =this._properties[i];
			break;
		}
	}
	if (!entry) {
		entry = {
			value: new UndefinedType(),
			alternateValues: {},
			name: p
		};
		this._properties.push(entry);
	}
	if (isLocalSkippedMode() || !this._isSkippedLocal()) {
		entry.alternateValues[getSkippedSection()] = desc;
	} else {
		entry.value = desc;
	}
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
		if (this._properties[i].name === p) {
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
		properties[i] = this._properties[i].name;
	}
	return properties;
};