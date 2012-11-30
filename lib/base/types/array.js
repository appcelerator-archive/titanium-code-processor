/*global
util
ObjectType
prototypes
NumberType
positiveIntegerRegEx
*/

/*****************************************
 *
 * Array Type Class
 *
 *****************************************/

/**
 * @classdesc An array type.
 *
 * @constructor
 * @name module:Base.ArrayType
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
			return proto || prototypes.Array;
		},
		set: function (value) {
			proto = value;
		},
		configurable: true
	});
	
	this._addProperty('length', {
		value: new NumberType(0),
		writable: true,
		enumerable: false,
		configurable: false
	});
}
util.inherits(ArrayType, ObjectType);

/**
 * ECMA-262 Spec: <em>Creates or alters the named own property to have the state described by a Property Descriptor. The
 * flag controls failure handling.</em>
 *
 * @method
 * @name module:Base.ArrayType#defineOwnProperty
 * @param {String} p The name of the parameter to delete
 * @param {module:Base.DataPropertyDescriptor|module:Base.AccessorPropertyDescriptor} desc The descriptor for the property
 * @param {Boolean} throwFlag Whether or not to throw an exception on error (related to strict mode)
 * @param {Boolean} suppressEvent Suppresses the 'propertyDefined' event (used when setting prototypes)
 * @returns {Boolean} Indicates whether or not the property was defined successfully
 * @see ECMA-262 Spec Chapter 8.12.9 and 15.4.5.1
 */
ArrayType.prototype.defineOwnProperty = function defineOwnProperty(p) {
	
	var parsedP;
	
	// Call the parent method
	ObjectType.prototype.defineOwnProperty.apply(this, arguments);
	
	// Check if this is an integer, a.k.a. if we need to update the length
	if (positiveIntegerRegEx.test(p)) {
		parsedP = parseInt(p, 10);
		if (parsedP >= this.get('length').value) {
			this._addProperty('length', {
				value: new NumberType(parsedP + 1),
				writable: true,
				enumerable: false,
				configurable: false
			});
		}
	}
};