/*****************************************
 *
 * String Type Class
 *
 *****************************************/

/**
 * @classdesc A string type.
 * 
 * @constructor
 * @extends module:Base.BaseType
 * @param {String} [initialValue] The initial value of the number. Defaults to '' if omitted
 * @param {String} [className] The name of the class, such as 'String' or 'Object'
 * @see ECMA-262 Spec Chapter 8.4
 */
exports.StringType = StringType;
function StringType(initialValue, className) {
	
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
	this.type = 'String';
	this.value = isUndefined(initialValue) ? '' : initialValue;
	this.objectPrototype = new StringPrototypeType();
}
util.inherits(StringType, BaseType);