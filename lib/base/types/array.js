/*****************************************
 *
 * Array Type Class
 *
 *****************************************/

/**
 * @classdesc An array type.
 * 
 * @constructor
 * @extends module:Base.ObjectType
 * @param {String} [className] The name of the class, such as 'String' or 'Object'
 * @see ECMA-262 Spec Chapters 11.1.4 and 15.4
 */
exports.ArrayType = ArrayType;
function ArrayType(className) {
	
	var proto;
	
	ObjectType.call(this, className || 'Array');
	
	Object.defineProperty(this, 'objectPrototype', {
		get: function () {
			return proto || prototypes['Array'];
		},
		set: function (value) {
			proto = value;
		},
		configurable: true
	});
	
	this.put('length', new NumberType(0), true, true);
}
util.inherits(ArrayType, ObjectType);

ArrayType.prototype.defineOwnProperty = function defineOwnProperty(p) {
	
	var parsedP;
	
	// Call the parent method
	ObjectType.prototype.defineOwnProperty.apply(this, arguments);
	
	// Check if this is an integer, a.k.a. if we need to update the length
	if (positiveIntegerRegEx.test(p) && !Runtime.ambiguousCode) {
		parsedP = parseInt(p);
		if (parsedP >= this.get('length').value) {
			this.put('length', new NumberType(parsedP + 1), true, true);
		}
	}
};