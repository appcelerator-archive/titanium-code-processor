/*global
util
Runtime
BaseType
*/

/*****************************************
 *
 * Unknown Type Class
 *
 *****************************************/

/**
 * @classdesc Represents an unknown type. Types are considered to be 'unknown' if their value cannot be determined at
 * compile time and are unique to this implementation. There is no equivalent in the ECMA-262 spec.
 *
 * @constructor
 * @name module:Base.UnknownType
 * @param {String} [className] The name of the class, such as 'String' or 'Object'
 * @extends module:Base.BaseType
 */
exports.UnknownType = UnknownType;
function UnknownType(className) {
	var currentLocation = Runtime.getCurrentLocation();
	if (Runtime.options.exactMode) {
		throw new Error('Attempted to instantiate an unknown type in exact mode at ' + currentLocation.filename + ':' +
			currentLocation.line);
	}
	Runtime._unknown = true;
	BaseType.call(this, className || 'Unknown');
	this.type = 'Unknown';
}
util.inherits(UnknownType, BaseType);