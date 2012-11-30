/*global
util
FunctionTypeBase
areAnyUnknown
UnknownType
toObject
type
isCallable
ObjectProtoToStringFunc
toUint32
StringType
isType
handleRecoverableNativeException
ArrayType
NumberType
toString
UndefinedType
toInteger
strictEquals
BooleanType
toBoolean
ObjectType
ObjectProtoValueOfFunc
ObjectProtoHasOwnPropertyFunc
ObjectProtoIsPrototypeOfFunc
ObjectProtoPropertyIsEnumerableFunc
addNonEnumerableProperty
*/

/*****************************************
 *
 * Array Prototype Class
 *
 *****************************************/

/**
 * toString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.2
 */
function ArrayProtoToStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(ArrayProtoToStringFunc, FunctionTypeBase);
ArrayProtoToStringFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations,
	var array,
		func;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1 and 2
	array = toObject(thisVal);
	func = array.get('join');
	
	// Step 3
	if (type(func) === 'Unknown') {
		return new UnknownType();
	} else if (!isCallable(func)) {
		func = new ObjectProtoToStringFunc();
	}
	
	// Step 4
	return func.call(array, []);
};

/**
 * toLocaleString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.3
 */
function ArrayProtoToLocaleStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(ArrayProtoToLocaleStringFunc, FunctionTypeBase);
ArrayProtoToLocaleStringFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var array,
		len,
		separator,
		firstElement,
		r,
		func,
		elementObj,
		k,
		s,
		nextElement;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-4
	array = toObject(thisVal);
	len = toUint32(array.get('length')).value;
	separator = ',';
	k = 1;
	
	// Step 5
	if (len === 0) {
		return new StringType();
	}
	
	// Step 6
	firstElement = array.get(0);
	
	// Steps 7 and 8
	if (isType(firstElement, ['Undefined', 'Null'])) {
		r = '';
	} else {
		elementObj = toObject(firstElement);
		func = elementObj.get('toLocaleString');
		if (type(elementObj) === 'Unknown' || type(func) === 'Unknown') {
			return new UnknownType();
		}
		if (!isCallable(func)) {
			handleRecoverableNativeException('TypeError', 'toLocaleString is not callable');
			return new UnknownType();
		}
		r = func.call(elementObj, []).value;
	}
	
	// Step 10
	while (k < len) {
		s = r + separator;
		nextElement = array.get(k);
		if (isType(nextElement, ['Undefined', 'Null'])) {
			r = '';
		} else {
			elementObj = toObject(nextElement);
			func = elementObj.get('toLocaleString');
			if (type(elementObj) === 'Unknown' || type(func) === 'Unknown') {
				return new UnknownType();
			}
			if (!isCallable(func)) {
				handleRecoverableNativeException('TypeError', 'toLocaleString is not callable');
				return new UnknownType();
			}
			r = func.call(elementObj, []).value;
		}
		r = s + r;
		k++;
	}
	
	// Step 11
	return new StringType(r);
};

/**
 * concat() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.4
 */
function ArrayProtoConcatFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ArrayProtoConcatFunc, FunctionTypeBase);
ArrayProtoConcatFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o,
		a,
		n,
		items,
		e,
		k,
		len;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-4
	o = toObject(thisVal);
	a = new ArrayType();
	n = 0;
	items = [o].concat(args);
		
	// Step 5
	while (items.length) {
		
		// Step 5.a
		e = items.shift();
		
		if (e.className === 'Array') { // Step 5.b
			k = 0;
			len = e.get('length').value;
			while (k < len) {
				if (e.hasProperty(k)) {
					a.defineOwnProperty(n, {
						value: e.get(k),
						writable: true,
						enumerable: true,
						configurable: true
					}, false, true);
				}
				n++;
				k++;
			}
		} else { // Step 5.c
			a.defineOwnProperty(n, {
				value: e,
				writable: true,
				enumerable: true,
				configurable: true
			}, false, true);
			n++;
		}
	}
	
	// Why is length not set in the spec? Seems to be an omissions since other methods (like pop) do it.
	a._addProperty('length', {
		value: new NumberType(n),
		writable: true,
		enumerable: false,
		configurable: false
	});
	
	// Step 6
	return a;
};

/**
 * join() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.5
 */
function ArrayProtoJoinFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ArrayProtoJoinFunc, FunctionTypeBase);
ArrayProtoJoinFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var separator,
		o,
		len,
		sep,
		r,
		element0,
		k,
		s,
		element,
		next;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-3
	separator = args[0];
	o = toObject(thisVal);
	len = toUint32(o.get('length')).value;
	k = 1;
	
	// Steps 4 and 5
	if (!separator || type(separator) === 'Undefined') {
		sep = ',';
	} else {
		sep = toString(separator).value;
	}
	
	// Step 6
	if (len === 0) {
		return new StringType();
	}
	
	// Step 7
	element0 = o.get(0);
	
	// Step 8
	if (isType(element0, ['Undefined', 'Null'])) {
		r = '';
	} else {
		r = toString(element0).value;
	}
	
	// Step 10
	while (k < len) {
		s = r + sep;
		element = o.get(k);
		if (isType(element, ['Undefined', 'Null'])) {
			next = '';
		} else {
			next = toString(element).value;
		}
		r = s + next;
		k++;
	}
	
	// Step 11
	return new StringType(r);
};

/**
 * pop() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.6
 */
function ArrayProtoPopFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(ArrayProtoPopFunc, FunctionTypeBase);
ArrayProtoPopFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o,
		len,
		indx,
		element;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-3
	o = toObject(thisVal);
	len = toUint32(o.get('length')).value;
	
	// Steps 4 and 5
	if (len === 0) {
		o._addProperty('length', {
			value: new NumberType(0),
			writable: true,
			enumerable: false,
			configurable: false
		});
		return new UndefinedType();
	} else {
		indx = len - 1;
		element = o.get(indx);
		o['delete'](indx, true);
		o._addProperty('length', {
			value: new NumberType(indx),
			writable: true,
			enumerable: false,
			configurable: false
		});
		return element;
	}
};

/**
 * push() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.7
 */
function ArrayProtoPushFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ArrayProtoPushFunc, FunctionTypeBase);
ArrayProtoPushFunc.prototype.call = function call(thisVal, args) {
	
	// Steps 1-4
	var o,
		n,
		items,
		lengthNumber;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-4
	o = toObject(thisVal);
	n = toUint32(o.get('length')).value;
	items = args;
	lengthNumber = new NumberType();
		
	// Step 5
	while (items.length) {
		o.put(n++, items.shift(), true, true);
	}
	
	// Step 6
	lengthNumber.value = n;
	o._addProperty('length', {
		value: lengthNumber,
		writable: true,
		enumerable: false,
		configurable: false
	});
	
	// Step 7
	return lengthNumber;
};

/**
 * reverse() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.8
 */
function ArrayProtoReverseFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(ArrayProtoReverseFunc, FunctionTypeBase);
ArrayProtoReverseFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o,
		len,
		upper,
		middle,
		lower,
		upperValue,
		lowerValue,
		lowerExists,
		upperExists;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-5
	o = toObject(thisVal);
	len = toUint32(o.get('length')).value;
	middle = Math.floor(len / 2);
	lower = 0;
		
	// Step 6
	while (lower !== middle) {
		upper = len - lower - 1;
		
		lowerValue = o.get(lower);
		upperValue = o.get(upper);
		
		lowerExists = o.hasProperty(lower);
		upperExists = o.hasProperty(upper);
		
		if (lowerExists && upperExists) {
			o.put(lower, upperValue, true, true);
			o.put(upper, lowerValue, true, true);
		} else if (upperExists) {
			o.put(lower, upperValue, true, true);
			o['delete'](upper, true);
		} else if (lowerExists) {
			o['delete'](o, lower);
			o.put(upper, lowerValue, true, true);
		}
		
		lower++;
	}
	
	// Step 7
	return o;
};

/**
 * shift() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.9
 */
function ArrayProtoShiftFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(ArrayProtoShiftFunc, FunctionTypeBase);
ArrayProtoShiftFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o,
		len,
		first,
		k,
		from,
		to;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-3
	o = toObject(thisVal);
	len = toUint32(o.get('length')).value;
	k = 1;
	
	// Step 4
	if (len === 0) {
		o._addProperty('length', {
			value: new NumberType(0),
			writable: true,
			enumerable: false,
			configurable: false
		});
		return new UndefinedType();
	}
	
	// Step 5
	first = o.get(0);
	
	// Step 7
	while (k < len) {
		from = k;
		to = k - 1;
		
		if (o.hasProperty(from)) {
			o.put(to, o.get(from), true, true);
		} else {
			o['delete'](to, true);
		}
		k++;
	}
	
	// Step 8
	o['delete'](len - 1, true);
	
	// Step 9
	o._addProperty('length', {
		value: new NumberType(len - 1),
		writable: true,
		enumerable: false,
		configurable: false
	});
	
	// Step 10
	return first;
};

/**
 * slice() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.10
 */
function ArrayProtoSliceFunc(className) {
	FunctionTypeBase.call(this, 2, className || 'Function');
}
util.inherits(ArrayProtoSliceFunc, FunctionTypeBase);
ArrayProtoSliceFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var start,
		end,
		o,
		a,
		len,
		relativeStart,
		k,
		relativeEnd,
		finalVal,
		n;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-9
	start = args[0] || new NumberType(0);
	end = args[1];
	o = toObject(thisVal);
	a = new ArrayType();
	len = toUint32(o.get('length')).value;
	relativeStart = toInteger(start).value;
	k = relativeStart < 0 ? Math.max(len + relativeStart, 0) : Math.min(relativeStart, len);
	relativeEnd = !end || type(end) === 'Undefined' ? len : toInteger(end).value;
	finalVal = relativeEnd < 0 ? Math.max(len + relativeEnd, 0) : Math.min(relativeEnd, len);
	n = 0;
	
	// Step 10
	while (k < finalVal) {
		if (o.hasProperty(k)) {
			a.defineOwnProperty(n, {
				value: o.get(k),
				writable: true,
				enumerable: true,
				configurable: true
			}, false, true);
		}
		k++;
		n++;
	}
	
	// Step 11
	return a;
};

/**
 * sort() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.11
 */
function ArrayProtoSortFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(ArrayProtoSortFunc, FunctionTypeBase);
ArrayProtoSortFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var compareFn,
		o,
		len,
		changes;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	compareFn = args[0];
	o = toObject(thisVal);
	len = toUint32(o.get('length')).value;
	changes = true;
	
	function swapValues(j, k) {
		var jValue,
			kValue;
		
		// Pull the values out of the array, if they exist
		if (o.hasProperty(j)) {
			jValue = o.get(j);
			o['delete'](j, true);
		}
		if (o.hasProperty(k)) {
			kValue = o.get(k);
			o['delete'](k, true);
		}
		
		// Put the values back into the array in their swapped positions
		if (jValue) {
			o.put(k, jValue, true, true);
		}
		if (kValue) {
			o.put(j, kValue, true, true);
		}
	}
	
	// SortCompare algorithm
	function sortCompare(j, k) {
		
		// Steps 3 and 4
		var hasj = o.hasProperty(j),
			hask = o.hasProperty(k),
			x,
			y,
			xType,
			yType,
			xVal,
			yVal;
		
		// Steps 5-7
		if (!hasj && !hask) {
			return 0;
		}
		if (!hasj) {
			return 1;
		}
		if (!hask) {
			return -1;
		}
		
		// Steps 8 and 9
		x = o.get(j);
		y = o.get(k);
		xType = type(x);
		yType = type(y);
		
		// Steps 10-12
		if (xType === 'Unknown' || yType === 'Unknown') {
			return NaN;
		}
		if (xType === 'Undefined' && yType === 'Undefined') {
			return 0;
		}
		if (xType === 'Undefined') {
			return 1;
		}
		if (yType === 'Undefined') {
			return -1;
		}
		
		// Step 13
		if (compareFn && type(compareFn) !== 'Undefined') {
			if (type(compareFn) === 'Unknown') {
				throw 'Unknown';
			}
			if (!isCallable(compareFn)) {
				handleRecoverableNativeException('TypeError', 'Compare funciton is not callable');
				return new UnknownType();
			}
			return compareFn.call(new UndefinedType(), [x, y]).value;
		}
		
		// Note: the spec says to always convert to a string and compare, but string comparisons don't work the same as
		// number comparisons in JavaScript, so we have to handle numbers specially (i.e. 1 < 10 !== '1' < '10')
		if (xType !== 'Number' || yType !== 'Number') {
		
			// Steps 14 and 15
			x = toString(x);
			y = toString(y);
		}
		xVal = x.value;
		yVal = y.value;
		
		// Steps 16-18
		if (xVal < yVal) {
			return -1;
		}
		if (xVal > yVal) {
			return 1;
		}
		return 0;
	}
	
	// In-place quicksort algorithm
	function sort(leftIndex, rightIndex) {
		var storeIndex = leftIndex,
			pivotIndex = Math.floor((rightIndex - leftIndex) / 2) + leftIndex,
			i,
			sortResult;
		
		if (leftIndex < rightIndex) {
			
			// Swap the pivot and right values
			swapValues(pivotIndex, rightIndex);
		
			// Sort the array into the two pivot arrays
			for (i = leftIndex; i < rightIndex; i++) {
				
				// Compare i and the store index, and swap if necessary
				sortResult = sortCompare(i, rightIndex);
				if (isNaN(sortResult)) {
					throw 'Unknown';
				} else if (sortResult < 0) {
					swapValues(i, storeIndex);
					storeIndex++;
				}
			}
		
			// Swap the pivot back into place and return its index
			swapValues(storeIndex, rightIndex);
			
			// Sort the left and right sides of the pivot
			sort(leftIndex, storeIndex - 1);
			sort(storeIndex + 1, rightIndex);
		}
	}
	
	// Sort the array
	try {
		sort(0, len - 1);
	} catch(e) {
		var integerRegex = /^[0-9]*$/;
		if (e === 'Unknown') {
			this._getPropertyNames().forEach(function (propName) {
				if (integerRegex.test(propName)) {
					this._addProperty(propName, {
						value: new UnknownType(),
						writable: false,
						configurable: false,
						enumerable: true
					});
				}
			}.bind(this));
		} else {
			throw e;
		}
	}
	
	// Return the sorted object
	return o;
};

/**
 * splice() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.12
 */
function ArrayProtoSpliceFunc(className) {
	FunctionTypeBase.call(this, 2, className || 'Function');
}
util.inherits(ArrayProtoSpliceFunc, FunctionTypeBase);
ArrayProtoSpliceFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var start,
		deleteCount,
		o,
		a,
		len,
		relativeStart,
		actualStart,
		actualDeleteCount,
		k,
		from,
		to,
		items,
		itemCount;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-8
	start = args[0];
	deleteCount = args[1];
	o = toObject(thisVal);
	a = new ArrayType();
	len = toUint32(o.get('length')).value;
	relativeStart = toUint32(start).value;
	actualStart = relativeStart < 0 ? Math.max(len + relativeStart, 0) : Math.min(relativeStart, len);
	actualDeleteCount = Math.min(Math.max(toInteger(deleteCount).value, 0), len - actualStart);
	k = 0;
	
	// Step 9
	while (k < actualDeleteCount) {
		from = actualStart + k;
		if (o.hasProperty(from)) {
			a.defineOwnProperty(k, {
				value: o.get(from),
				writable: true,
				enumerable: true,
				configurable: true
			}, false, true);
		}
		k++;
	}
	
	// Steps 10 and 11
	items = args.slice(2);
	itemCount = items.length;
	
	// Steps 12 and 13
	if (itemCount < actualDeleteCount) {
		k = actualStart;
		while (k < len - actualDeleteCount) {
			from = k + actualDeleteCount;
			to = k + itemCount;
			
			if (o.hasProperty(from)) {
				o.put(to, o.get(from), true, true);
			} else {
				o['delete'](to, true, true);
			}
			k++;
		}
		k = len;
		while (k > len - actualDeleteCount + itemCount) {
			o['delete'](k - 1, true);
			k--;
		}
	} else if (itemCount > actualDeleteCount) {
		k = len - actualDeleteCount;
		while (k > actualStart) {
			from = k + actualDeleteCount - 1;
			to = k + itemCount - 1;
			
			if (o.hasProperty(from)) {
				o.put(to, o.get(from), true, true);
			} else {
				o['delete'](to, true);
			}
			
			k--;
		}
	}
	
	// Step 14
	k = actualStart;
	
	// Step 15
	while (items.length) {
		o.put(k, items.shift(), true, true);
		k++;
	}
	
	// Step 16
	o._addProperty('length', {
		value: new NumberType(len - actualDeleteCount + itemCount),
		writable: true,
		enumerable: false,
		configurable: false
	});
	
	// Step 17
	return a;
};

/**
 * unshift() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.13
 */
function ArrayProtoUnshiftFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ArrayProtoUnshiftFunc, FunctionTypeBase);
ArrayProtoUnshiftFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var o = toObject(thisVal),
		len = toUint32(o.get('length')).value,
		argCount = args.length,
		k = len,
		from,
		to,
		j,
		items;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-5
	o = toObject(thisVal);
	len = toUint32(o.get('length')).value;
	argCount = args.length;
	k = len;
		
	// Step 6
	while (k > 0) {
		from = k - 1;
		to = k + argCount - 1;
		
		if (o.hasProperty(from)) {
			o.put(to, o.get(from), true, true);
		} else {
			o['delete'](to, true, true);
		}
		
		k--;
	}
	
	// Step 7 and 8
	j = 0;
	items = args;
	
	// Step 9
	while (items.length) {
		o.put(j++, items.shift(), true, true);
	}
	
	// Step 10
	o._addProperty('length', {
		value: new NumberType(len + argCount),
		writable: true,
		enumerable: false,
		configurable: false
	});
	
	// Step 11
	return new NumberType(len + argCount);
};

/**
 * indexOf() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.14
 */
function ArrayProtoIndexOfFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ArrayProtoIndexOfFunc, FunctionTypeBase);
ArrayProtoIndexOfFunc.prototype.call = function call(thisVal, args) {
	
	// Steps 1-3
	var searchElement = args[0],
		fromIndex = args[1],
		o = toObject(thisVal),
		len = toUint32(o.get('length')).value,
		n = 0,
		k,
		elementK;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-3
	searchElement = args[0];
	fromIndex = args[1];
	o = toObject(thisVal);
	len = toUint32(o.get('length')).value;
	n = 0;
		
	// Step 4
	if (len === 0) {
		return new NumberType(-1);
	}
	
	// Step 5
	if (fromIndex && type(fromIndex) !== 'Undefined') {
		n = toInteger(fromIndex).value;
	}
	
	// Step 6
	if (n >= len) {
		return new NumberType(-1);
	}
	
	// Steps 7 and 8
	k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
	
	// Step 9
	while (k < len) {
		if (o.hasProperty(k)) {
			elementK = o.get(k);
			if (type(elementK) === 'Unknown') {
				return new UnknownType();
			}
			if (strictEquals(searchElement, elementK)) {
				return new NumberType(k);
			}
		}
		k++;
	}
	
	// Step 10
	return new NumberType(-1);
};

/**
 * indexOf() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.15
 */
function ArrayProtoLastIndexOfFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(ArrayProtoLastIndexOfFunc, FunctionTypeBase);
ArrayProtoLastIndexOfFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var searchElement,
		fromIndex,
		o,
		len,
		n,
		k,
		elementK;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-3
	searchElement = args[0];
	fromIndex = args[1];
	o = toObject(thisVal);
	len = toUint32(o.get('length')).value;
	n = len - 1;
	
	// Step 4
	if (len === 0) {
		return new NumberType(-1);
	}
	
	// Step 5
	if (fromIndex && type(fromIndex) !== 'Undefined') {
		n = toInteger(fromIndex).value;
	}
	
	// Steps 6 and 7
	k = n >= 0 ? Math.min(n, len - 1) : len - Math.abs(n);
	
	// Step 8
	while (k >= 0) {
		if (o.hasProperty(k)) {
			elementK = o.get(k);
			if (type(elementK) === 'Unknown') {
				return new UnknownType();
			}
			if (strictEquals(searchElement, elementK)) {
				return new NumberType (k);
			}
		}
		k--;
	}
	
	// Step 9
	return new NumberType(-1);
};

/**
 * every() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.16
 */
function ArrayProtoEveryFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ArrayProtoEveryFunc, FunctionTypeBase);
ArrayProtoEveryFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var callbackFn,
		thisArg,
		o,
		len,
		t,
		k;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-3
	callbackFn = args[0];
	thisArg = args[1];
	o = toObject(thisVal);
	len = toUint32(o.get('length')).value;
	k = 0;
	
	// Step 4
	if (!isCallable(callbackFn)) {
		handleRecoverableNativeException('TypeError', 'Callback function is not callable');
		return new UnknownType();
	}
	
	// Step 5
	t = callbackFn && type(callbackFn) === 'Undefined' ? callbackFn : new UndefinedType();
	
	// Step 7
	while (k < len) {
		if (o.hasProperty(k) && !toBoolean(callbackFn.call(t, [o.get(k), new NumberType(k), o])).value) {
			return new BooleanType(false);
		}
		k++;
	}
	
	// Step 8
	return new BooleanType(true);
};

/**
 * some() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.17
 */
function ArrayProtoSomeFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ArrayProtoSomeFunc, FunctionTypeBase);
ArrayProtoSomeFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var callbackFn,
		thisArg,
		o,
		len,
		t,
		k;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-3
	callbackFn = args[0];
	thisArg = args[1];
	o = toObject(thisVal);
	len = toUint32(o.get('length')).value;
	k = 0;
	
	if (type(callbackFn) === 'Unknown' || type(thisArg) === 'Unknown') {
		return new UnknownType();
	}
	
	// Step 4
	if (!isCallable(callbackFn)) {
		handleRecoverableNativeException('TypeError', 'Callback function is not callable');
		return new UnknownType();
	}
	
	// Step 5
	t = callbackFn && type(callbackFn) === 'Undefined' ? callbackFn : new UndefinedType();
	
	// Step 7
	while (k < len) {
		if (o.hasProperty(k) && toBoolean(callbackFn.call(t, [o.get(k), new NumberType(k), o])).value) {
			return new BooleanType(true);
		}
		k++;
	}
	
	// Step 8
	return new BooleanType(false);
};

/**
 * forEach() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.18
 */
function ArrayProtoForEachFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ArrayProtoForEachFunc, FunctionTypeBase);
ArrayProtoForEachFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var callbackFn,
		thisArg,
		o,
		len,
		t,
		k;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-3
	callbackFn = args[0];
	thisArg = args[1];
	o = toObject(thisVal);
	len = toUint32(o.get('length')).value;
	k = 0;
	
	// Step 4
	if (!isCallable(callbackFn)) {
		handleRecoverableNativeException('TypeError', 'Callback function is not callable');
		return new UnknownType();
	}
	
	// Step 5
	t = callbackFn && type(callbackFn) === 'Undefined' ? callbackFn : new UndefinedType();
	
	// Step 7
	while  (k < len) {
		if (o.hasProperty(k)) {
			callbackFn.call(t, [o.get(k), new NumberType(k), o]);
		}
		k++;
	}
	
	// Step 8
	return new UndefinedType();
};

/**
 * map() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.19
 */
function ArrayProtoMapFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ArrayProtoMapFunc, FunctionTypeBase);
ArrayProtoMapFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var callbackFn,
		thisArg,
		o,
		len,
		t,
		a,
		k;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-3
	callbackFn = args[0];
	thisArg = args[1];
	o = toObject(thisVal);
	len = toUint32(o.get('length')).value;
	k = 0;
	
	// Step 4
	if (!isCallable(callbackFn)) {
		handleRecoverableNativeException('TypeError', 'Callback function is not callable');
		return new UnknownType();
	}
	
	// Step 5
	t = callbackFn && type(callbackFn) === 'Undefined' ? callbackFn : new UndefinedType();
	
	// Step 6
	a = new ArrayType();
	a._addProperty('length', {
		value: new NumberType(len),
		writable: true,
		enumerable: false,
		configurable: false
	});
	
	// Step 8
	while (k < len) {
		if (o.hasProperty(k)) {
			a.defineOwnProperty(k, {
				value: callbackFn.call(t, [o.get(k), new NumberType(k), o]),
				writable: true,
				enumerable: true,
				configurable: true
			}, false, true);
		}
		k++;
	}
	
	// Step 9
	return a;
};

/**
 * filter() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.20
 */
function ArrayProtoFilterFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ArrayProtoFilterFunc, FunctionTypeBase);
ArrayProtoFilterFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var callbackFn,
		thisArg,
		o,
		len,
		t,
		a,
		k,
		to,
		kValue;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-3
	callbackFn = args[0];
	thisArg = args[1];
	o = toObject(thisVal);
	len = toUint32(o.get('length')).value;
	k = 0;
	to = 0;
	
	// Step 4
	if (!isCallable(callbackFn)) {
		handleRecoverableNativeException('TypeError', 'Callback function is not callable');
		return new UnknownType();
	}
	
	// Step 5
	t = callbackFn && type(callbackFn) === 'Undefined' ? callbackFn : new UndefinedType();
	
	// Step 6
	a = new ArrayType();
	a._addProperty('length', {
		value: new NumberType(len),
		writable: true,
		enumerable: false,
		configurable: false
	});
	
	// Step 9
	while (k < len) {
		if (o.hasProperty(k)) {
			kValue = o.get(k);
			if (toBoolean(callbackFn.call(t, [kValue, new NumberType(k), o])).value) {
				a.defineOwnProperty(to, {
					value: kValue,
					writable: true,
					enumerable: true,
					configurable: true
				}, false, true);
				to++;
			}
		}
		k++;
	}
	
	// Step 10
	return a;
};

/**
 * reduce() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.21
 */
function ArrayProtoReduceFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ArrayProtoReduceFunc, FunctionTypeBase);
ArrayProtoReduceFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var callbackFn,
		initialValue,
		o,
		len,
		k,
		to,
		accumulator,
		kPresent,
		undef;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-3
	callbackFn = args[0];
	initialValue = args[1];
	o = toObject(thisVal);
	len = toUint32(o.get('length')).value;
	k = 0;
	to = 0;
	undef = new UndefinedType();
	
	// Step 4
	if (!isCallable(callbackFn)) {
		handleRecoverableNativeException('TypeError', 'Callback function is not callable');
		return new UnknownType();
	}
	
	// Step 5
	if (len === 0 && !initialValue) {
		handleRecoverableNativeException('TypeError', 'Missing initial value');
		return new UnknownType();
	}
	
	// Steps 7 and 8
	if (initialValue) {
		accumulator = initialValue;
	} else {
		kPresent = false;
		while (!kPresent && k < len) {
			kPresent = o.hasProperty(k);
			if (kPresent) {
				accumulator = o.get(k);
			}
			k++;
		}
		if (!kPresent) {
			handleRecoverableNativeException('TypeError', 'Missing property ' + k);
			return new UnknownType();
		}
	}
	
	// Step 9
	while (k < len) {
		if (o.hasProperty(k)) {
			accumulator = callbackFn.call(undef, [accumulator, o.get(k), new NumberType(k), o]);
		}
		k++;
	}
	
	// Step 10
	return accumulator;
};

/**
 * reduceRight() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.4.4.22
 */
function ArrayReduceRightFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(ArrayReduceRightFunc, FunctionTypeBase);
ArrayReduceRightFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var callbackFn,
		initialValue,
		o,
		len,
		k,
		to,
		accumulator,
		kPresent,
		undef;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Steps 1-3
	callbackFn = args[0];
	initialValue = args[1];
	o = toObject(thisVal);
	len = toUint32(o.get('length')).value;
	k = len - 1;
	to = 0;
	undef = new UndefinedType();
	
	// Step 4
	if (!isCallable(callbackFn)) {
		handleRecoverableNativeException('TypeError', 'Callback function is not callable');
		return new UnknownType();
	}
	
	// Step 5
	if (len === 0 && !initialValue) {
		handleRecoverableNativeException('TypeError', 'Missing initial value');
		return new UnknownType();
	}
	
	// Steps 7 and 8
	if (initialValue) {
		accumulator = initialValue;
	} else {
		kPresent = false;
		while (!kPresent && k >= 0) {
			kPresent = o.hasProperty(k);
			if (kPresent) {
				accumulator = o.get(k);
			}
			k--;
		}
		if (!kPresent) {
			handleRecoverableNativeException('TypeError', 'Missing property ' + k);
			return new UnknownType();
		}
	}
	
	// Step 9
	while (k >= 0) {
		if (o.hasProperty(k)) {
			accumulator = callbackFn.call(undef, [accumulator, o.get(k), new NumberType(k), o]);
		}
		k--;
	}
	
	// Step 10
	return accumulator;
};

/**
 * @classdesc The prototype for Arrays
 *
 * @constructor
 * @see ECMA-262 Spec Chapter 15.4.4
 */
exports.ArrayPrototypeType = ArrayPrototypeType;
function ArrayPrototypeType(className) {
	ObjectType.call(this, className);
	
	// Object prototype methods
	addNonEnumerableProperty(this, 'valueOf', new ObjectProtoValueOfFunc(), false, true);
	addNonEnumerableProperty(this, 'hasOwnProperty', new ObjectProtoHasOwnPropertyFunc(), false, true);
	addNonEnumerableProperty(this, 'isPrototypeOf', new ObjectProtoIsPrototypeOfFunc(), false, true);
	addNonEnumerableProperty(this, 'propertyIsEnumerable', new ObjectProtoPropertyIsEnumerableFunc(), false, true);
	
	// Array prototype methods
	addNonEnumerableProperty(this, 'toString', new ArrayProtoToStringFunc(), false, true);
	addNonEnumerableProperty(this, 'toLocaleString', new ArrayProtoToLocaleStringFunc(), false, true);
	addNonEnumerableProperty(this, 'concat', new ArrayProtoConcatFunc(), false, true);
	addNonEnumerableProperty(this, 'join', new ArrayProtoJoinFunc(), false, true);
	addNonEnumerableProperty(this, 'pop', new ArrayProtoPopFunc(), false, true);
	addNonEnumerableProperty(this, 'push', new ArrayProtoPushFunc(), false, true);
	addNonEnumerableProperty(this, 'reverse', new ArrayProtoReverseFunc(), false, true);
	addNonEnumerableProperty(this, 'shift', new ArrayProtoShiftFunc(), false, true);
	addNonEnumerableProperty(this, 'slice', new ArrayProtoSliceFunc(), false, true);
	addNonEnumerableProperty(this, 'sort', new ArrayProtoSortFunc(), false, true);
	addNonEnumerableProperty(this, 'splice', new ArrayProtoSpliceFunc(), false, true);
	addNonEnumerableProperty(this, 'unshift', new ArrayProtoUnshiftFunc(), false, true);
	addNonEnumerableProperty(this, 'indexOf', new ArrayProtoIndexOfFunc(), false, true);
	addNonEnumerableProperty(this, 'lastIndexOf', new ArrayProtoLastIndexOfFunc(), false, true);
	addNonEnumerableProperty(this, 'every', new ArrayProtoEveryFunc(), false, true);
	addNonEnumerableProperty(this, 'some', new ArrayProtoSomeFunc(), false, true);
	addNonEnumerableProperty(this, 'forEach', new ArrayProtoForEachFunc(), false, true);
	addNonEnumerableProperty(this, 'map', new ArrayProtoMapFunc(), false, true);
	addNonEnumerableProperty(this, 'filter', new ArrayProtoFilterFunc(), false, true);
	addNonEnumerableProperty(this, 'reduce', new ArrayProtoReduceFunc(), false, true);
	addNonEnumerableProperty(this, 'reduceRight', new ArrayReduceRightFunc(), false, true);
}
util.inherits(ArrayPrototypeType, ObjectType);