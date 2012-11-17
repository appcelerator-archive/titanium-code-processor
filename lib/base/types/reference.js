/*global
util
Runtime
BaseType
isType
type
handleRecoverableNativeException
toObject
UnknownType
isUndefined
UndefinedType
isDataDescriptor
throwNativeException
isAccessorDescriptor
*/

/*****************************************
 *
 * Reference Type Class
 *
 *****************************************/

/**
 * @classdesc ECMA-262 Spec: <em>The Reference type is used to explain the behaviour of such operators as delete, typeof,
 * and the assignment operators. For example, the left-hand operand of an assignment is expected to produce a reference.
 * The behaviour of assignment could, instead, be explained entirely in terms of a case analysis on the syntactic form
 * of the left-hand operand of an assignment operator, but for one difficulty: function calls are permitted to return
 * references. This possibility is admitted purely for the sake of host objects. No built-in ECMAScript function
 * defined by this specification returns a reference and there is no provision for a user- defined function to return a
 * reference.</em>
 *
 * @constructor
 * @name module:Base.ReferenceType
 * @extends module:Base.BaseType
 * @see ECMA-262 Spec Chapter 8.7
 */
exports.ReferenceType = ReferenceType;
function ReferenceType(baseValue, referencedName, strictReference) {
	BaseType.call(this, 'Reference');
	this.type = 'Reference';
	this.baseValue = baseValue;
	this.referencedName = referencedName || '';
	this.strictReference = !!strictReference;
}
util.inherits(ReferenceType, BaseType);

/**
 * ECMA-262 Spec: <em>Returns the base value component of the supplied reference.</em>
 *
 * @method
 * @name module:Base.getBase
 * @param {module:Base.ReferenceType} v The reference to get the base of
 * @returns {{@link module:Base.BaseType}} The base value of the reference
 * @see ECMA-262 Spec Chapter 8.7
 */
exports.getBase = getBase;
function getBase(v) {
	return v.baseValue;
}

/**
 * ECMA-262 Spec: <em>Returns the referenced name component of the supplied reference.</em>
 *
 * @method
 * @name module:Base.getReferencedName
 * @param {module:Base.ReferenceType} v The reference to get the name of
 * @returns {String} The base value of the reference
 * @see ECMA-262 Spec Chapter 8.7
 */
exports.getReferencedName = getReferencedName;
function getReferencedName(v) {
	return v.referencedName;
}

/**
 * ECMA-262 Spec: <em>Returns the strict reference component of the supplied reference.</em>
 *
 * @method
 * @name module:Base.isStrictReference
 * @param {module:Base.ReferenceType} v The reference to check for strictness
 * @returns {Boolean} Whether or not the reference is a strict reference
 * @see ECMA-262 Spec Chapter 8.7
 */
exports.isStrictReference = isStrictReference;
function isStrictReference(v) {
	return v.strictReference;
}

/**
 * ECMA-262 Spec: <em>Returns true if the base value is a Boolean, String, or Number.</em>
 *
 * @method
 * @name module:Base.hasPrimitiveBase
 * @param {module:Base.ReferenceType} v The reference to check for a primitive base
 * @returns {Boolean} Whether or not the reference has a primitive base
 * @see ECMA-262 Spec Chapter 8.7
 */
exports.hasPrimitiveBase = hasPrimitiveBase;
function hasPrimitiveBase(v) {
	return isType(getBase(v), ['Number', 'String', 'Boolean']);
}

/**
 * ECMA-262 Spec: <em>Returns true if either the base value is an object or HasPrimitiveBase(V) is true; otherwise
 * returns false.</em>
 *
 * @method
 * @name module:Base.isPropertyReference
 * @param {module:Base.ReferenceType} v The reference to get the name of
 * @returns {Boolean} Whether or not the reference is a property reference
 * @see ECMA-262 Spec Chapter 8.7
 */
exports.isPropertyReference = isPropertyReference;
function isPropertyReference(v) {
	return hasPrimitiveBase(v) || type(getBase(v)) === 'Object';
}

/**
 * ECMA-262 Spec: <em>Returns true if the base value is undefined and false otherwise.</em>
 *
 * @method
 * @name module:Base.isUnresolvableReference
 * @param {module:Base.ReferenceType} v The reference to get the name of
 * @returns {Boolean} Whether or not the reference is an unresolvable reference
 * @see ECMA-262 Spec Chapter 8.7
 */
exports.isUnresolvableReference = isUnresolvableReference;
function isUnresolvableReference(v) {
	return type(getBase(v)) === 'Undefined';
}

/**
 * Gets the value pointed to by the supplied reference.
 *
 * @method
 * @name module:Base.getValue
 * @param {module:Base.ReferenceType} v The reference to get
 * @returns {{@link module:Base.BaseType}|{@link module:Base.UndefinedType}} The value pointed to by the reference, or
 *		UndefinedType if the value could not be retrieved
 * @see ECMA-262 Spec Chapter 8.7.1
 */
exports.getValue = getValue;
function getValue(v) {
	
	var base,
		get,
		getThisObj = this;
	
	if (type(v) !== 'Reference') {
		return v;
	}
	if (isUnresolvableReference(v)) {
		handleRecoverableNativeException('ReferenceError', 'Cannot dereference ' + v.referencedName + ' of undefined');
		return new UnknownType();
	}
	
	base = getBase(v);
	if (isPropertyReference(v)) {
		if (hasPrimitiveBase(v)) {
			get = function get(p) {
				var o = toObject(base),
					desc = o.getProperty(p);
				if (isUndefined(desc)) {
					return new UndefinedType();
				}
				if (isDataDescriptor(desc)) {
					return desc.value;
				} else {
					if (!desc.get) {
						return new UndefinedType();
					}
					return desc.get.call(base);
				}
			};
		} else {
			get = base.get;
			getThisObj = base;
		}
		return get.call(getThisObj, getReferencedName(v));
	} else {
		return base.getBindingValue(getReferencedName(v), isStrictReference(v));
	}
}

/**
 * Puts the supplied value in the reference
 *
 * @method
 * @name module:Base.putValue
 * @param {module:Base.ReferenceType} v The reference to put the value to
 * @param {module:Base.BaseType} w The value to set
 * @see ECMA-262 Spec Chapter 8.7.2
 */
exports.putValue = putValue;
function putValue(v, w) {

	var base,
		put,
		putThisObj = this;
		
	if (type(v) !== 'Reference') {
		throwNativeException('ReferenceError', 'Attempted to put a value to a non-reference');
	}
	
	base = getBase(v);
	if (isUnresolvableReference(v)) {
		if (isStrictReference(v)) {
			throwNativeException('ReferenceError', v.referencedName + ' is not resolvable');
		}
		Runtime.getGlobalObject().put(getReferencedName(v), w, false);
		Runtime.fireEvent('undeclaredGlobalVariableCreated', 'Automatically creating global variable ' + v.referencedName, {
			name: v.referencedName
		});
	} else if (isPropertyReference(v)) {
		if (hasPrimitiveBase(v)) {
			put = function put(p, w, throwFlag) {
				var o = toObject(base),
					desc,
					canPutP = o.canPut(p);
				if (canPutP === 'Unknown') {
					o.defineOwnProperty({
						value: new UnknownType(),
						writable: false,
						configurable: false,
						enumerable: true
					});
					return;
				}
				if (!canPutP || isDataDescriptor(o.getOwnProperty(p))) {
					if (throwFlag) {
						handleRecoverableNativeException('TypeError', 'Could not put ' + v.referencedName);
					}
					return;
				}
				desc = o.getProperty(p);
				if (isAccessorDescriptor(desc)) {
					desc.setter.call(base, w);
				} else if (throwFlag) {
					handleRecoverableNativeException('TypeError', 'Could not put ' + v.referencedName);
				}
			};
		} else {
			put = base.put;
			putThisObj = base;
		}
		put.call(putThisObj, getReferencedName(v), w, isStrictReference(v));
	} else {
		base.setMutableBinding(getReferencedName(v), w, isStrictReference(v));
	}
}