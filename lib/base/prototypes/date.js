/*global
util
FunctionTypeBase
StringType
NumberType
toNumber
ObjectType
addNonEnumerableProperty
*/

/*****************************************
 *
 * Date Prototype Class
 *
 *****************************************/

/**
 * toString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.2
 */
function DateProtoToStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoToStringFunc, FunctionTypeBase);
DateProtoToStringFunc.prototype.call = function call(thisVal) {
	return new StringType(thisVal._date.toString());
};

/**
 * toDateString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.3
 */
function DateProtoToDateStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoToDateStringFunc, FunctionTypeBase);
DateProtoToDateStringFunc.prototype.call = function call(thisVal) {
	return new StringType(thisVal._date.toDateString());
};

/**
 * toTimeString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.4
 */
function DateProtoToTimeStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoToTimeStringFunc, FunctionTypeBase);
DateProtoToTimeStringFunc.prototype.call = function call(thisVal) {
	return new StringType(thisVal._date.toTimeString());
};

/**
 * toLocaleString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.5
 */
function DateProtoToLocaleStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoToLocaleStringFunc, FunctionTypeBase);
DateProtoToLocaleStringFunc.prototype.call = function call(thisVal) {
	return new StringType(thisVal._date.toLocaleString());
};

/**
 * toLocaleDateString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.6
 */
function DateProtoToLocaleDateStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoToLocaleDateStringFunc, FunctionTypeBase);
DateProtoToLocaleDateStringFunc.prototype.call = function call(thisVal) {
	return new StringType(thisVal._date.toLocaleDateString());
};

/**
 * toLocaleTimeString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.7
 */
function DateProtoToLocaleTimeStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoToLocaleTimeStringFunc, FunctionTypeBase);
DateProtoToLocaleTimeStringFunc.prototype.call = function call(thisVal) {
	return new StringType(thisVal._date.toLocaleTimeString());
};

/**
 * valueOf() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.8
 */
function DateProtoValueOfFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoValueOfFunc, FunctionTypeBase);
DateProtoValueOfFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.valueOf());
};

/**
 * getTime() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.9
 */
function DateProtoGetTimeFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetTimeFunc, FunctionTypeBase);
DateProtoGetTimeFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getTime());
};

/**
 * getFullYear() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.10
 */
function DateProtoGetFullYearFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetFullYearFunc, FunctionTypeBase);
DateProtoGetFullYearFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getFullYear());
};

/**
 * getUTCFullYear() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.11
 */
function DateProtoGetUTCFullYearFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetUTCFullYearFunc, FunctionTypeBase);
DateProtoGetUTCFullYearFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getUTCFullYear());
};

/**
 * getMonth() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.12
 */
function DateProtoGetMonthFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetMonthFunc, FunctionTypeBase);
DateProtoGetMonthFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getMonth());
};

/**
 * getUTCMonth() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.13
 */
function DateProtoGetUTCMonthFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetUTCMonthFunc, FunctionTypeBase);
DateProtoGetUTCMonthFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getUTCMonth());
};

/**
 * getDate() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.14
 */
function DateProtoGetDateFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetDateFunc, FunctionTypeBase);
DateProtoGetDateFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getDate());
};

/**
 * getUTCDate() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.15
 */
function DateProtoGetUTCDateFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetUTCDateFunc, FunctionTypeBase);
DateProtoGetUTCDateFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getUTCDate());
};

/**
 * getDay() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.16
 */
function DateProtoGetDayFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetDayFunc, FunctionTypeBase);
DateProtoGetDayFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getDay());
};

/**
 * getUTCDay() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.17
 */
function DateProtoGetUTCDayFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetUTCDayFunc, FunctionTypeBase);
DateProtoGetUTCDayFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getUTCDay());
};

/**
 * getHours() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.18
 */
function DateProtoGetHoursFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetHoursFunc, FunctionTypeBase);
DateProtoGetHoursFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getHours());
};

/**
 * getUTCHours() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.19
 */
function DateProtoGetUTCHoursFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetUTCHoursFunc, FunctionTypeBase);
DateProtoGetUTCHoursFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getUTCHours());
};

/**
 * getMinutes() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.20
 */
function DateProtoGetMinutesFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetMinutesFunc, FunctionTypeBase);
DateProtoGetMinutesFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getMinutes());
};

/**
 * getUTCMinutes() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.21
 */
function DateProtoGetUTCMinutesFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetUTCMinutesFunc, FunctionTypeBase);
DateProtoGetUTCMinutesFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getUTCMinutes());
};

/**
 * getSeconds() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.22
 */
function DateProtoGetSecondsFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetSecondsFunc, FunctionTypeBase);
DateProtoGetSecondsFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getSeconds());
};

/**
 * getUTCSeconds() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.23
 */
function DateProtoGetUTCSecondsFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetUTCSecondsFunc, FunctionTypeBase);
DateProtoGetUTCSecondsFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getUTCSeconds());
};

/**
 * getMilliseconds() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.24
 */
function DateProtoGetMillisecondsFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetMillisecondsFunc, FunctionTypeBase);
DateProtoGetMillisecondsFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getMilliseconds());
};

/**
 * getUTCMilliseconds() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.25
 */
function DateProtoGetUTCMillisecondsFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetUTCMillisecondsFunc, FunctionTypeBase);
DateProtoGetUTCMillisecondsFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getUTCMilliseconds());
};

/**
 * getTimezoneOffset() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.26
 */
function DateProtoGetTimezoneOffsetFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoGetTimezoneOffsetFunc, FunctionTypeBase);
DateProtoGetTimezoneOffsetFunc.prototype.call = function call(thisVal) {
	return new NumberType(thisVal._date.getTimezoneOffset());
};

/**
 * setTime() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.27
 */
function DateProtoSetTimeFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(DateProtoSetTimeFunc, FunctionTypeBase);
DateProtoSetTimeFunc.prototype.call = function call(thisVal, args) {
	var time = args[0];
	if (time) {
		time = toNumber(time).value;
	}
	return new NumberType(thisVal._date.setTime(time));
};

/**
 * setMilliseconds() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.28
 */
function DateProtoSetMillisecondsFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(DateProtoSetMillisecondsFunc, FunctionTypeBase);
DateProtoSetMillisecondsFunc.prototype.call = function call(thisVal, args) {
	var ms = args[0];
	if (ms) {
		ms = toNumber(ms).value;
	}
	return new NumberType(thisVal._date.setMilliseconds(ms));
};

/**
 * setUTCMilliseconds() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.29
 */
function DateProtoSetUTCMillisecondsFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(DateProtoSetUTCMillisecondsFunc, FunctionTypeBase);
DateProtoSetUTCMillisecondsFunc.prototype.call = function call(thisVal, args) {
	var ms = args[0];
	if (ms) {
		ms = toNumber(ms).value;
	}
	return new NumberType(thisVal._date.setUTCMilliseconds(ms));
};

/**
 * setSeconds() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.30
 */
function DateProtoSetSecondsFunc(className) {
	FunctionTypeBase.call(this, 2, className || 'Function');
}
util.inherits(DateProtoSetSecondsFunc, FunctionTypeBase);
DateProtoSetSecondsFunc.prototype.call = function call(thisVal, args) {
	var sec = args[0],
		ms = args[1];
	if (sec) {
		sec = toNumber(sec).value;
	}
	if (ms) {
		ms = toNumber(ms).value;
	}
	return new NumberType(thisVal._date.setSeconds(sec, ms));
};

/**
 * setUTCSeconds() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.31
 */
function DateProtoSetUTCSecondsFunc(className) {
	FunctionTypeBase.call(this, 2, className || 'Function');
}
util.inherits(DateProtoSetUTCSecondsFunc, FunctionTypeBase);
DateProtoSetUTCSecondsFunc.prototype.call = function call(thisVal, args) {
	var sec = args[0],
		ms = args[1];
	if (sec) {
		sec = toNumber(sec).value;
	}
	if (ms) {
		ms = toNumber(ms).value;
	}
	return new NumberType(thisVal._date.setUTCSeconds(sec, ms));
};

/**
 * setMinutes() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.32
 */
function DateProtoSetMinutesFunc(className) {
	FunctionTypeBase.call(this, 3, className || 'Function');
}
util.inherits(DateProtoSetMinutesFunc, FunctionTypeBase);
DateProtoSetMinutesFunc.prototype.call = function call(thisVal, args) {
	var min = args[0],
		sec = args[1],
		ms = args[2];
	if (min) {
		min = toNumber(min).value;
	}
	if (sec) {
		sec = toNumber(sec).value;
	}
	if (ms) {
		ms = toNumber(ms).value;
	}
	return new NumberType(thisVal._date.setMinutes(min, sec, ms));
};

/**
 * setUTCMinutes() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.33
 */
function DateProtoSetUTCMinutesFunc(className) {
	FunctionTypeBase.call(this, 3, className || 'Function');
}
util.inherits(DateProtoSetUTCMinutesFunc, FunctionTypeBase);
DateProtoSetUTCMinutesFunc.prototype.call = function call(thisVal, args) {
	var min = args[0],
		sec = args[1],
		ms = args[2];
	if (min) {
		min = toNumber(min).value;
	}
	if (sec) {
		sec = toNumber(sec).value;
	}
	if (ms) {
		ms = toNumber(ms).value;
	}
	return new NumberType(thisVal._date.setUTCMinutes(min, sec, ms));
};

/**
 * setHours() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.34
 */
function DateProtoSetHoursFunc(className) {
	FunctionTypeBase.call(this, 4, className || 'Function');
}
util.inherits(DateProtoSetHoursFunc, FunctionTypeBase);
DateProtoSetHoursFunc.prototype.call = function call(thisVal, args) {
	var hour = args[0],
		min = args[1],
		sec = args[2],
		ms = args[3];
	if (hour) {
		hour = toNumber(hour).value;
	}
	if (min) {
		min = toNumber(min).value;
	}
	if (sec) {
		sec = toNumber(sec).value;
	}
	if (ms) {
		ms = toNumber(ms).value;
	}
	return new NumberType(thisVal._date.setHours(hour, min, sec, ms));
};

/**
 * setUTCHours() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.35
 */
function DateProtoSetUTCHoursFunc(className) {
	FunctionTypeBase.call(this, 4, className || 'Function');
}
util.inherits(DateProtoSetUTCHoursFunc, FunctionTypeBase);
DateProtoSetUTCHoursFunc.prototype.call = function call(thisVal, args) {
	var hour = args[0],
		min = args[1],
		sec = args[2],
		ms = args[3];
	if (hour) {
		hour = toNumber(hour).value;
	}
	if (min) {
		min = toNumber(min).value;
	}
	if (sec) {
		sec = toNumber(sec).value;
	}
	if (ms) {
		ms = toNumber(ms).value;
	}
	return new NumberType(thisVal._date.setUTCHours(hour, min, sec, ms));
};

/**
 * setDate() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.36
 */
function DateProtoSetDateFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(DateProtoSetDateFunc, FunctionTypeBase);
DateProtoSetDateFunc.prototype.call = function call(thisVal, args) {
	var date = args[0];
	if (date) {
		date = toNumber(date).value;
	}
	return new NumberType(thisVal._date.setDate(date));
};

/**
 * setUTCDate() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.37
 */
function DateProtoSetUTCDateFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(DateProtoSetUTCDateFunc, FunctionTypeBase);
DateProtoSetUTCDateFunc.prototype.call = function call(thisVal, args) {
	var date = args[0];
	if (date) {
		date = toNumber(date).value;
	}
	return new NumberType(thisVal._date.setUTCDate(date));
};

/**
 * setMonth() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.38
 */
function DateProtoSetMonthFunc(className) {
	FunctionTypeBase.call(this, 2, className || 'Function');
}
util.inherits(DateProtoSetMonthFunc, FunctionTypeBase);
DateProtoSetMonthFunc.prototype.call = function call(thisVal, args) {
	var month = args[0],
		date = args[1];
	if (month) {
		month = toNumber(month).value;
	}
	if (date) {
		date = toNumber(date).value;
	}
	return new NumberType(thisVal._date.setMonth(month, date));
};

/**
 * setUTCMonth() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.39
 */
function DateProtoSetUTCMonthFunc(className) {
	FunctionTypeBase.call(this, 2, className || 'Function');
}
util.inherits(DateProtoSetUTCMonthFunc, FunctionTypeBase);
DateProtoSetUTCMonthFunc.prototype.call = function call(thisVal, args) {
	var month = args[0],
		date = args[1];
	if (month) {
		month = toNumber(month).value;
	}
	if (date) {
		date = toNumber(date).value;
	}
	return new NumberType(thisVal._date.setUTCMonth(month, date));
};

/**
 * setFullYear() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.40
 */
function DateProtoSetFullYearFunc(className) {
	FunctionTypeBase.call(this, 3, className || 'Function');
}
util.inherits(DateProtoSetFullYearFunc, FunctionTypeBase);
DateProtoSetFullYearFunc.prototype.call = function call(thisVal, args) {
	var year = args[0],
		month = args[1],
		date = args[2];
	if (year) {
		year = toNumber(year).value;
	}
	if (month) {
		month = toNumber(month).value;
	}
	if (date) {
		date = toNumber(date).value;
	}
	return new NumberType(thisVal._date.setFullYear(year, month, date));
};

/**
 * setUTCFullYear() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.41
 */
function DateProtoSetUTCFullYearFunc(className) {
	FunctionTypeBase.call(this, 3, className || 'Function');
}
util.inherits(DateProtoSetUTCFullYearFunc, FunctionTypeBase);
DateProtoSetUTCFullYearFunc.prototype.call = function call(thisVal, args) {
	var year = args[0],
		month = args[1],
		date = args[2];
	if (year) {
		year = toNumber(year).value;
	}
	if (month) {
		month = toNumber(month).value;
	}
	if (date) {
		date = toNumber(date).value;
	}
	return new StringType(thisVal._date.setUTCFullYear(year, month, date));
};

/**
 * toUTCString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.42
 */
function DateProtoToUTCStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoToUTCStringFunc, FunctionTypeBase);
DateProtoToUTCStringFunc.prototype.call = function call(thisVal) {
	return new StringType(thisVal._date.toUTCString());
};

/**
 * toISOString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.43
 */
function DateProtoToISOStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(DateProtoToISOStringFunc, FunctionTypeBase);
DateProtoToISOStringFunc.prototype.call = function call(thisVal) {
	return new StringType(thisVal._date.toISOString());
};

/**
 * toJSON() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.44
 */
function DateProtoToJSONFunc(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');
}
util.inherits(DateProtoToJSONFunc, FunctionTypeBase);
DateProtoToJSONFunc.prototype.call = function call(thisVal) {
	return new StringType(thisVal._date.toJSON());
};

/**
 * @classdesc The prototype for Errors
 *
 * @constructor
 * @see ECMA-262 Spec Chapter 15.9.5
 */
exports.DatePrototypeType = DatePrototypeType;
function DatePrototypeType(className) {
	ObjectType.call(this, className);
	
	addNonEnumerableProperty(this, 'toString', new DateProtoToStringFunc(), false, true);
	addNonEnumerableProperty(this, 'toDateString', new DateProtoToDateStringFunc(), false, true);
	addNonEnumerableProperty(this, 'toTimeString', new DateProtoToTimeStringFunc(), false, true);
	addNonEnumerableProperty(this, 'toLocaleString', new DateProtoToLocaleStringFunc(), false, true);
	addNonEnumerableProperty(this, 'toLocaleDateString', new DateProtoToLocaleDateStringFunc(), false, true);
	addNonEnumerableProperty(this, 'toLocaleTimeString', new DateProtoToLocaleTimeStringFunc(), false, true);
	addNonEnumerableProperty(this, 'valueOf', new DateProtoValueOfFunc(), false, true);
	addNonEnumerableProperty(this, 'getTime', new DateProtoGetTimeFunc(), false, true);
	addNonEnumerableProperty(this, 'getFullYear', new DateProtoGetFullYearFunc(), false, true);
	addNonEnumerableProperty(this, 'getUTCFullYear', new DateProtoGetUTCFullYearFunc(), false, true);
	addNonEnumerableProperty(this, 'getMonth', new DateProtoGetMonthFunc(), false, true);
	addNonEnumerableProperty(this, 'getUTCMonth', new DateProtoGetUTCMonthFunc(), false, true);
	addNonEnumerableProperty(this, 'getDate', new DateProtoGetDateFunc(), false, true);
	addNonEnumerableProperty(this, 'getUTCDate', new DateProtoGetUTCDateFunc(), false, true);
	addNonEnumerableProperty(this, 'getDay', new DateProtoGetDayFunc(), false, true);
	addNonEnumerableProperty(this, 'getUTCDay', new DateProtoGetUTCDayFunc(), false, true);
	addNonEnumerableProperty(this, 'getHours', new DateProtoGetHoursFunc(), false, true);
	addNonEnumerableProperty(this, 'getUTCHours', new DateProtoGetUTCHoursFunc(), false, true);
	addNonEnumerableProperty(this, 'getMinutes', new DateProtoGetMinutesFunc(), false, true);
	addNonEnumerableProperty(this, 'getUTCMinutes', new DateProtoGetUTCMinutesFunc(), false, true);
	addNonEnumerableProperty(this, 'getSeconds', new DateProtoGetSecondsFunc(), false, true);
	addNonEnumerableProperty(this, 'getUTCSeconds', new DateProtoGetUTCSecondsFunc(), false, true);
	addNonEnumerableProperty(this, 'getMilliseconds', new DateProtoGetMillisecondsFunc(), false, true);
	addNonEnumerableProperty(this, 'getUTCMilliseconds', new DateProtoGetUTCMillisecondsFunc(), false, true);
	addNonEnumerableProperty(this, 'getTimezoneOffset', new DateProtoGetTimezoneOffsetFunc(), false, true);
	addNonEnumerableProperty(this, 'setTime', new DateProtoSetTimeFunc(), false, true);
	addNonEnumerableProperty(this, 'setMilliseconds', new DateProtoSetMillisecondsFunc(), false, true);
	addNonEnumerableProperty(this, 'setUTCMilliseconds', new DateProtoSetUTCMillisecondsFunc(), false, true);
	addNonEnumerableProperty(this, 'setSeconds', new DateProtoSetSecondsFunc(), false, true);
	addNonEnumerableProperty(this, 'setUTCSeconds', new DateProtoSetUTCSecondsFunc(), false, true);
	addNonEnumerableProperty(this, 'setMinutes', new DateProtoSetMinutesFunc(), false, true);
	addNonEnumerableProperty(this, 'setUTCMinutes', new DateProtoSetUTCMinutesFunc(), false, true);
	addNonEnumerableProperty(this, 'setHours', new DateProtoSetHoursFunc(), false, true);
	addNonEnumerableProperty(this, 'setUTCHours', new DateProtoSetUTCHoursFunc(), false, true);
	addNonEnumerableProperty(this, 'setDate', new DateProtoSetDateFunc(), false, true);
	addNonEnumerableProperty(this, 'setUTCDate', new DateProtoSetUTCDateFunc(), false, true);
	addNonEnumerableProperty(this, 'setMonth', new DateProtoSetMonthFunc(), false, true);
	addNonEnumerableProperty(this, 'setUTCMonth', new DateProtoSetUTCMonthFunc(), false, true);
	addNonEnumerableProperty(this, 'setFullYear', new DateProtoSetFullYearFunc(), false, true);
	addNonEnumerableProperty(this, 'setUTCFullYear', new DateProtoSetUTCFullYearFunc(), false, true);
	addNonEnumerableProperty(this, 'toUTCString', new DateProtoToUTCStringFunc(), false, true);
	addNonEnumerableProperty(this, 'toISOString', new DateProtoToISOStringFunc(), false, true);
	addNonEnumerableProperty(this, 'toJSON', new DateProtoToJSONFunc(), false, true);
}
util.inherits(DatePrototypeType, ObjectType);