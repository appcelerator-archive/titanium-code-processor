/*global
util,
BaseType,
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
 * @constructor module:Base.NumberType
 * @extends module:Base.BaseType
 * @param {number} [initialValue] The initial value of the number. Defaults to 0 if omitted
 * @param {string} [className] The name of the class, such as 'String' or 'Object'
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
	this.value = typeof initialValue == 'undefined' ? 0 : initialValue;
}
util.inherits(NumberType, BaseType);