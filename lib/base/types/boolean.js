/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Definition for the boolean type
 *
 * @module base/types/boolean
 */
/*global
util,
BaseType,
prototypes
*/

/*****************************************
 *
 * Boolean Type Class
 *
 *****************************************/

/**
 * @classdesc A boolean type.
 *
 * @constructor module:base/types/boolean.BooleanType
 * @extends module:base.BaseType
 * @param {boolean} [initialValue] The initial value of the number. Defaults to false if omitted
 * @param {string} [className] The name of the class, such as 'String' or 'Object'
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
	this.value = typeof initialValue == 'undefined' ? false : initialValue;
}
util.inherits(BooleanType, BaseType);