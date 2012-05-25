/**
 * Tests if "it" is a specific "type". If type is omitted, then it will return the type.
 *
 * @ private
 * @function
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
 * @ private
 * @function
 * @param it the variable to test
 * @returns {Boolean} Whether or not "it" is not undefined
 */
exports.isDef = function isDef(it) {
	return !is(it, "Undefined");
}

/**
 * Capitalizes the first letter in the string
 *
 * @private
 * @function
 * @param {String} str The string to capitalize
 * @return {String} The capitalized string
 */
exports.capitalize = function capitalize(str) {
	return str.substring(0,1).toUpperCase() + str.substring(1);
}

/**
 * Creates a {@link JSValue}. Note: optional values must be kept in order
 *
 * @private
 * @function
 * @param {String|undefined} [type] The type of the value, a.k.a. the result of calling {@link is} on <code>type</code>. Pass in
 * 		<code>undefined</code> if the type cannot be resolved.
 * @param {any} [value] The value, if it is available.
 * @param {String} [name] The name of the value, if one exists
 */
exports.createValue = function createValue(type, value, name) {
	if (!type) {
		type = "@unknown";
	}
	return {
		type: type,
		value: value,
		name: name,
		toString: function() {
			return "<" + this.type + ">" + this.value;
		}
	};
}