/*****************************************
 *
 * String Prototype Class
 *
 *****************************************/

/**
 * toString() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.2
 */
function StringProtoToStringFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(StringProtoToStringFunc, FunctionTypeBase);
StringProtoToStringFunc.prototype.call = function call(thisVal, args) {
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	if (thisVal.className !== "String") {
		throwNativeException('TypeError', 'Value is not a string');
	}
	return new StringType(this.value);
};

/**
 * valueOf() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.3
 */
function StringProtoValueOfFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(StringProtoValueOfFunc, FunctionTypeBase);
StringProtoValueOfFunc.prototype.call = function call(thisVal, args) {
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	if (thisVal.className !== "String") {
		throwNativeException('TypeError', 'Value is not a string');
	}
	if (thisVal.hasOwnProperty('primitiveValue')) {
		return new StringType(thisVal.primitiveValue);
	} else {
		return new StringType(thisVal.value);
	}
};

/**
 * charAt() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.4
 */
function StringProtoCharAtFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(StringProtoCharAtFunc, FunctionTypeBase);
StringProtoCharAtFunc.prototype.call = function call(thisVal, args) {
	
	var pos = args[0],
		s,
		position;
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal);
	
	// Step 3
	position = toInteger(pos);
	
	// Steps 4-6
	return new StringType(s.value.charAt(position.value));
};

/**
 * charCodeAt() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.5
 */
function StringProtoCharCodeAtFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(StringProtoCharCodeAtFunc, FunctionTypeBase);
StringProtoCharCodeAtFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var pos = args[0],
		s,
		position;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal);
	
	// Step 3
	position = toInteger(pos);
	
	// Steps 4-6
	return new StringType(s.value.charCodeAt(position.value));
};

/**
 * concat() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.6
 */
function StringProtoConcatFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(StringProtoConcatFunc, FunctionTypeBase);
StringProtoConcatFunc.prototype.call = function call(thisVal, args) {
	
	var s,
		i = 0,
		len = args.length;
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Step 3 (deep copy args and convert to values)
	args = [].concat(args);
	for (; i < len; i++) {
		args[i] = toString(args[i]).value;
	}
	
	// Steps 4-6
	return new StringType(s.concat.apply(s, args));
};

/**
 * indexOf() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.7
 */
function StringProtoIndexOfFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(StringProtoIndexOfFunc, FunctionTypeBase);
StringProtoIndexOfFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var searchString = args[0],
		position = args[2],
		s,
		searchStr,
		pos;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Step 3
	searchStr = toString(searchString).value;
	
	// Step 4
	pos = isDefined(position) ? toInteger(position).value : 0;
	
	// Steps 5-8
	return new NumberType(s.indexOf(searchStr, pos));
};

/**
 * lastIndexOf() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.8
 */
function StringProtoLastIndexOfFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(StringProtoLastIndexOfFunc, FunctionTypeBase);
StringProtoLastIndexOfFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var searchString = args[0],
		position = args[2],
		s,
		searchStr,
		pos;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Step 3
	searchStr = toString(searchString).value;
	
	// Step 4
	pos = isDefined(position) ? toNumber(position).value : undefined;
	
	// Steps 5-8
	return new NumberType(s.lastIndexOf(searchStr, pos));
	
};

/**
 * localeCompare() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.9
 */
function StringProtoLocaleCompareFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(StringProtoLocaleCompareFunc, FunctionTypeBase);
StringProtoLocaleCompareFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var that = args[0],
		s;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Step 3
	that = toString(that).value;
	
	return new NumberType(s.localeCompare(that));
};

/**
 * match() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.10
 */
function StringProtoMatchFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(StringProtoMatchFunc, FunctionTypeBase);
StringProtoMatchFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var regexp = args[0],
		s,
		rx,
		result,
		a,
		i,
		len;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Steps 3 and 4
	if (regexp && regexp.className === "RegExp") {
		rx = regexp;
	} else {
		if (!regexp || type(regexp) === "Undefined") {
			rx = new RegExpType("", "");
		} else {
			rx = new RegExpType(toString(regexp).value, "");
		}
	}
	
	// Update the regexp object
	rx._refreshRegExpFromProperties();
	
	// Use the built-in match method to perform the match
	result = s.match(rx.value);
	
	// Update the regexp object
	rx._refreshPropertiesFromRegExp();
	
	// Check for no match
	if (result === null) {
		return new NullType();
	}
	
	// Create the results array
	a = new ArrayType();
	a.put("index", new NumberType(result.index), false, true);
	a.put("input", rx, false, true);
	for (i = 0, len = result.length; i < len; i++) {
		a.put(i, new StringType(result[i]), false, true);
	}
	a.put("length", new NumberType(result.length), false, true);
	return a;
};

/**
 * replace() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.11
 */
function StringProtoReplaceFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(2), false, true);
}
util.inherits(StringProtoReplaceFunc, FunctionTypeBase);
StringProtoReplaceFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var searchValue = args[0],
		replaceValue = args[1],
		s,
		rx,
		result;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Get the native searchValue
	if (searchValue.className !== "RegExp") {
		searchValue = toString(searchValue);
	} else {
		searchValue._refreshRegExpFromProperties();
	}
	searchValue = searchValue.value;
	
	// Run the built-in replace method
	if (isCallable(replaceValue)) {
		result = new StringType(s.replace(searchValue, function () {
			var args = [
					new StringType(arguments[0]) // match
				],
				i = 1,
				len = arguments.length - 2;
			
			// Push the matches into the arguments
			for (; i < len; i++) {
				args.push(new StringType(arguments[i]));
			}

			// Push the offset and the string into the arguments
			args.push(new NumberType(arguments[arguments.length - 2])); 
			args.push(new StringType(arguments[arguments.length - 1]));
			
			// Call the callback method
			return toString(replaceValue.call(new UndefinedType(), args)).value;
		}));
	} else {
		result = new StringType(s.replace(searchValue, toString(replaceValue).value));
	}

	// Update the regexp object
	if (searchValue.className === "RegExp") {
		rx._refreshPropertiesFromRegExp();
	}
	
	return result;
};

/**
 * search() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.12
 */
function StringProtoSearchFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(1), false, true);
}
util.inherits(StringProtoSearchFunc, FunctionTypeBase);
StringProtoSearchFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var regexp = args[0],
		string,
		rx,
		result;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	string = toString(thisVal).value;
	
	// Steps 3 and 4
	if (regexp && regexp.className === "RegExp") {
		rx = regexp;
	} else {
		if (!regexp || type(regexp) === "Undefined") {
			rx = new RegExpType("", "");
		} else {
			rx = new RegExpType(toString(regexp).value, "");
		}
	}
	
	// Update the regexp object
	rx._refreshRegExpFromProperties();
	
	// Use the built-in method to perform the match
	result = string.search(rx.value);
	
	// Update the regexp object
	rx._refreshPropertiesFromRegExp();
	
	return new NumberType(result);
};

/**
 * slice() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.13
 */
function StringProtoSliceFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(2), false, true);
}
util.inherits(StringProtoSliceFunc, FunctionTypeBase);
StringProtoSliceFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var start = args[0],
		end = args[1],
		s;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Step 4
	start = toInteger(start).value;
	
	// Step 5
	end = isDefined(end) ? toInteger(end).value : s.length;
	
	// Use the built-in method to perform the slice
	return new StringType(s.slice(start, end));
};

/**
 * split() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.14
 */
function StringProtoSplitFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(2), false, true);
}
util.inherits(StringProtoSplitFunc, FunctionTypeBase);
StringProtoSplitFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var separator = args[0],
		limit = args[1],
		s,
		result,
		a,
		i,
		len;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Convert the separator into a form the native method can use
	if (!separator || type(separator) === "Undefined") {
		separator = undefined;
	} else if (separator.className === "RegExp"){
		separator = separator.value;
	} else {
		separator = toString(separator).value;
	}
	
	// Convert the limit into a form the native method can use
	if (!limit || type(limit) === "Undefined") {
		limit = undefined;
	} else {
		limit = toUint32(limit).value;
	}
	
	// Call the split method
	result = s.split(separator, limit);
	
	// Convert the results and return them
	a = new ArrayType();
	for (i = 0, len = result.length; i < len; i++) {
		a.put(i, new StringType(result[i]), false, true);
	}
	return a;
};

/**
 * substring() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.15
 */
function StringProtoSubstringFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(2), false, true);
}
util.inherits(StringProtoSubstringFunc, FunctionTypeBase);
StringProtoSubstringFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var start = args[0],
		end = args[1],
		s;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Step 4
	start = toInteger(start).value;
	
	// Step 5
	end = isDefined(end) ? toInteger(end).value : s.length;
	
	// Use the built-in method to perform the substring
	return new StringType(s.substring(start, end));
};

/**
 * toLowerCase() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.16
 */
function StringProtoToLowerCaseFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(StringProtoToLowerCaseFunc, FunctionTypeBase);
StringProtoToLowerCaseFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var s;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Use the built-in method to perform the toLowerCase
	return new StringType(s.toLowerCase());
	
};

/**
 * toLocaleLowerCase() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.17
 */
function StringProtoToLocaleLowerCaseFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(StringProtoToLocaleLowerCaseFunc, FunctionTypeBase);
StringProtoToLocaleLowerCaseFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var s;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Use the built-in method to perform the toLowerCase
	return new StringType(s.toLocaleLowerCase());
};

/**
 * toUpperCase() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.18
 */
function StringProtoToUpperCaseFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(StringProtoToUpperCaseFunc, FunctionTypeBase);
StringProtoToUpperCaseFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var s;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Use the built-in method to perform the toLowerCase
	return new StringType(s.toUpperCase());
};

/**
 * toLocaleUpperCase() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.19
 */
function StringProtoToLocaleUpperCaseFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(StringProtoToLocaleUpperCaseFunc, FunctionTypeBase);
StringProtoToLocaleUpperCaseFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var s;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Use the built-in method to perform the toLowerCase
	return new StringType(s.toLocaleUpperCase());
};

/**
 * trim() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.5.4.20
 */
function StringProtoTrimFunc(className) {
	ObjectType.call(this, className || "Function");
	this.put("length", new NumberType(0), false, true);
}
util.inherits(StringProtoTrimFunc, FunctionTypeBase);
StringProtoTrimFunc.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var s;
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	// Step 1
	checkObjectCoercible(thisVal);
	
	// Step 2
	s = toString(thisVal).value;
	
	// Use the built-in method to perform the toLowerCase
	return new StringType(s.trim());
};

/**
 * @classdesc The prototype for Strings
 * 
 * @constructor
 * @see ECMA-262 Spec Chapter 15.5.4
 */
exports.StringPrototypeType = StringPrototypeType;
function StringPrototypeType(className) {
	ObjectType.call(this, className);
	
	this.put("constructor", GlobalObjects['String'], false, true);
	
	this.put("toString", new StringProtoToStringFunc(), false, true);
	this.put("valueOf", new StringProtoValueOfFunc(), false, true);
	this.put("charAt", new StringProtoCharAtFunc(), false, true);
	this.put("charCodeAt", new StringProtoCharCodeAtFunc(), false, true);
	this.put("concat", new StringProtoConcatFunc(), false, true);
	this.put("indexOf", new StringProtoIndexOfFunc(), false, true);
	this.put("lastIndexOf", new StringProtoLastIndexOfFunc(), false, true);
	this.put("localeCompare", new StringProtoLocaleCompareFunc(), false, true);
	this.put("match", new StringProtoMatchFunc(), false, true);
	this.put("replace", new StringProtoReplaceFunc(), false, true);
	this.put("search", new StringProtoSearchFunc(), false, true);
	this.put("slice", new StringProtoSliceFunc(), false, true);
	this.put("split", new StringProtoSplitFunc(), false, true);
	this.put("substring", new StringProtoSubstringFunc(), false, true);
	this.put("toLowerCase", new StringProtoToLowerCaseFunc(), false, true);
	this.put("toLocaleLowerCase", new StringProtoToLocaleLowerCaseFunc(), false, true);
	this.put("toUpperCase", new StringProtoToUpperCaseFunc(), false, true);
	this.put("toLocaleUpperCase", new StringProtoToLocaleUpperCaseFunc(), false, true);
	this.put("trim", new StringProtoTrimFunc(), false, true);	
}
util.inherits(StringPrototypeType, ObjectType);