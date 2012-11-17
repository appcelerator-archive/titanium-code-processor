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