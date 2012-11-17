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