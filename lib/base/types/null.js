/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Definition for the null type
 *
 * @module base/types/null
 */
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
 * @classdesc A null type.
 *
 * @constructor module:base/types/null.NullType
 * @extends module:base.BaseType
 * @param {string} [className] The name of the class, such as 'String' or 'Object'
 * @see ECMA-262 Spec Chapter 8.2
 */
exports.NullType = NullType;
function NullType(className) {
	BaseType.call(this, className || 'Null');
	this.type = 'Null';
	this.value = null;
}
util.inherits(NullType, BaseType);