/*global
util,
NumberType,
ObjectType,
prototypes,
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
 * @param {string} [initialValue] The initial value of the number. Defaults to '' if omitted
 * @param {string} [className] The name of the class, such as 'String' or 'Object'
 * @see ECMA-262 Spec Chapter 8.4
 */
exports.StringType = StringType;
function StringType(initialValue, className) {

	var proto;

	var value;
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
	this.value = typeof initialValue == 'undefined' ? '' : initialValue;
}
util.inherits(StringType, BaseType);

/**
 * @private
 * From the spec 15.5.5.2
 */
StringType.prototype._lookupProperty = function _lookupProperty(p) {
	var current = BaseType.prototype._lookupProperty.call(this, p),
		index;
	if (current) {
		return current;
	}

	// Step 5
	index = +p;

	// Step 4
	if (Math.abs(index) + '' !== p) {
		return;
	}

	// Step 7
	if (index >= this.value.length) {
		return;
	}

	// Steps 8-9
	return {
		value: new StringType(this.value[index]),
		enumerable: true,
		writable: true,
		configurable: true
	};
};

/**
 * @private
 */
StringType.prototype._getPropertyNames = function _getPropertyNames() {
	var props = [],
		val = this.value,
		i, len;
	for (i = 0, len = val.length; i < len; i++) {
		props.push(i.toString());
	}
	return props.concat(BaseType.prototype._getPropertyNames.call(this));
};