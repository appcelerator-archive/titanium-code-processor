/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * This module contains helper functions borrowed from Titanium Mobile Web 
 * {@link https://github.com/appcelerator/titanium_mobile}
 * 
 * @module TiUtil
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

/**
 * Tests if "it" is a specific "type". If type is omitted, then it will return the type.
 *
 * @method
 * @param it the variable to test
 * @param {String} [type] the type to test against, e.g. "String"
 * @returns {Boolean|String} The type of "it" if "type" was not supplied, else true or false if "it" is of type "type."
 */
function is(it, type) {
	var t = Object.prototype.toString.call(it),
		v = it === undefined ? "Undefined" : t.substring(8, t.length - 1);
	return type ? type === v : v;
}
exports.is = is;

/**
 * Tests if "it" is not undefined
 *
 * @method
 * @param it the variable to test
 * @returns {Boolean} Whether or not "it" is not undefined
 */
exports.isDef = function isDef(it) {
	return it !== undefined;
}

/**
 * Capitalizes the first letter in the string
 *
 * @method
 * @param {String} str The string to capitalize
 * @returns {String} The capitalized string
 */
exports.capitalize = function capitalize(str) {
	return str.substring(0,1).toUpperCase() + str.substring(1);
}