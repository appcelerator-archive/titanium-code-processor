/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Definition for the reference pseudo-type
 *
 * @module base/types/reference
 */
/*global
util,
Runtime,
BaseType,
isType,
type,
handleRecoverableNativeException,
toObject,
UnknownType,
UndefinedType,
isDataDescriptor,
throwNativeException,
isAccessorDescriptor,
getGlobalObject
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
 * @constructor module:base/types/reference.ReferenceType
 * @extends module:base.BaseType
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
 * @method module:base/types/reference.getBase
 * @param {module:base/types/reference.ReferenceType} v The reference to get the base of
 * @return {module:base.BaseType} The base value of the reference
 * @see ECMA-262 Spec Chapter 8.7
 */
exports.getBase = getBase;
function getBase(v) {
	return v.baseValue;
}

/**
 * ECMA-262 Spec: <em>Returns the referenced name component of the supplied reference.</em>
 *
 * @method module:base/types/reference.getReferencedName
 * @param {module:base/types/reference.ReferenceType} v The reference to get the name of
 * @return {string} The base value of the reference
 * @see ECMA-262 Spec Chapter 8.7
 */
exports.getReferencedName = getReferencedName;
function getReferencedName(v) {
	return v.referencedName;
}

/**
 * ECMA-262 Spec: <em>Returns the strict reference component of the supplied reference.</em>
 *
 * @method module:base/types/reference.isStrictReference
 * @param {module:base/types/reference.ReferenceType} v The reference to check for strictness
 * @return {boolean} Whether or not the reference is a strict reference
 * @see ECMA-262 Spec Chapter 8.7
 */
exports.isStrictReference = isStrictReference;
function isStrictReference(v) {
	return v.strictReference;
}

/**
 * ECMA-262 Spec: <em>Returns true if the base value is a Boolean, String, or Number.</em>
 *
 * @method module:base/types/reference.hasPrimitiveBase
 * @param {module:base/types/reference.ReferenceType} v The reference to check for a primitive base
 * @return {boolean} Whether or not the reference has a primitive base
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
 * @method module:base/types/reference.isPropertyReference
 * @param {module:base/types/reference.ReferenceType} v The reference to get the name of
 * @return {boolean} Whether or not the reference is a property reference
 * @see ECMA-262 Spec Chapter 8.7
 */
exports.isPropertyReference = isPropertyReference;
function isPropertyReference(v) {
	return hasPrimitiveBase(v) || type(getBase(v)) === 'Object';
}

/**
 * ECMA-262 Spec: <em>Returns true if the base value is undefined and false otherwise.</em>
 *
 * @method module:base/types/reference.isUnresolvableReference
 * @param {module:base/types/reference.ReferenceType} v The reference to get the name of
 * @return {boolean} Whether or not the reference is an unresolvable reference
 * @see ECMA-262 Spec Chapter 8.7
 */
exports.isUnresolvableReference = isUnresolvableReference;
function isUnresolvableReference(v) {
	return type(getBase(v)) === 'Undefined';
}

/**
 * Gets the value pointed to by the supplied reference.
 *
 * @method module:base/types/reference.getValue
 * @param {module:base/types/reference.ReferenceType} v The reference to get
 * @return {(module:base.BaseType | module:base/types/undefined.UndefinedType)} The value pointed to by the reference, or
 *		UndefinedType if the value could not be retrieved
 * @see ECMA-262 Spec Chapter 8.7.1
 */
exports.getValue = getValue;
function getValue(v, alternate) {

	var base,
		get,
		getThisObj = this,
		set;

	if (type(v) !== 'Reference') {
		return alternate ? {} : v;
	}
	if (isUnresolvableReference(v)) {
		handleRecoverableNativeException('ReferenceError', '"' + v.referencedName + '" is not defined');
		return alternate ? { 1: new UnknownType() } : new UnknownType();
	}

	base = getBase(v);
	if (isPropertyReference(v)) {
		if (hasPrimitiveBase(v)) {
			get = function get(p, alternate) {
				var o = toObject(base),
					desc = o.getProperty(p, alternate);
				if (typeof desc == 'undefined') {
					return alternate ? {} : new UndefinedType();
				}
				function lookup(desc) {
					if (isDataDescriptor(desc)) {
						return desc.value;
					} else {
						return (desc.get && desc.get.className !== 'Undefined' && desc.get.callFunction(this)) || new UndefinedType();
					}
				}
				if (alternate) {
					set = {};
					for (p in desc) {
						set[p] = lookup(desc[p]);
					}
					return set;
				} else {
					return lookup(desc);
				}
			};
		} else {
			get = base.get;
			getThisObj = base;
		}
		return get.call(getThisObj, getReferencedName(v), alternate);
	} else {
		return base.getBindingValue(getReferencedName(v), isStrictReference(v), alternate);
	}
}

/**
 * Puts the supplied value in the reference
 *
 * @method module:base/types/reference.putValue
 * @param {module:base/types/reference.ReferenceType} v The reference to put the value to
 * @param {module:base.BaseType} w The value to set
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
		getGlobalObject().put(getReferencedName(v), w, false);
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
					desc.setter.callFunction(base, [w]);
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