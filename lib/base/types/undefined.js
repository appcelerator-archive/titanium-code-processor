/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Definition for the undefined type
 *
 * @module base/types/undefined
 */
/*global
util,
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
 * @constructor module:base/types/undefined.UndefinedType
 * @extends module:base.BaseType
 * @param {string} [className] The name of the class, such as 'String' or 'Object'
 * @see ECMA-262 Spec Chapter 8.1
 */
exports.UndefinedType = UndefinedType;
function UndefinedType(className) {
	BaseType.call(this, className || 'Undefined');
	this.type = 'Undefined';
}
util.inherits(UndefinedType, BaseType);