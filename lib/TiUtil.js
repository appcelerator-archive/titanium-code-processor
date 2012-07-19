/**
 * This module contains helper functions borrowed from Titanium Mobile Web 
 * {@link https://github.com/appcelerator/titanium_mobile}
 * 
 * @module TiUtil
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
	var t = it === void 0 ? "" : ({}).toString.call(it),
		m = t.match(/^\[object (.+)\]$/),
		v = m ? m[1] : "Undefined";
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
	return !is(it, "Undefined");
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