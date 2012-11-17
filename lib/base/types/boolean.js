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