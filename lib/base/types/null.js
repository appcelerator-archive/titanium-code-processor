/*global
util,
BaseType
*/

/*****************************************
 *
 * Null Type Class
 *
 *****************************************/

/**
 * Clones an null value
 *
 * @method
 * @param {module:Base.NullType} source The null value to clone
 */
exports.cloneNull = cloneNull;
function cloneNull() {
	return new NullType();
}

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