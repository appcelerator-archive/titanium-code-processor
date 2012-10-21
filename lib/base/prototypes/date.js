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
function DateProtoToStringFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoToStringFunc, FunctionTypeBase);
DateProtoToStringFunc.prototype.call = function call(thisVal, args) {
	return new StringType(this._date.toString());
};

/**
 * toDateString() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.3
 */
function DateProtoToDateStringFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoToDateStringFunc, FunctionTypeBase);
DateProtoToDateStringFunc.prototype.call = function call(thisVal, args) {
	return new StringType(this._date.toDateString());
};

/**
 * toTimeString() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.4
 */
function DateProtoToTimeStringFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoToTimeStringFunc, FunctionTypeBase);
DateProtoToTimeStringFunc.prototype.call = function call(thisVal, args) {
	return new StringType(this._date.toTimeString());
};

/**
 * toLocaleString() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.5
 */
function DateProtoToLocaleStringFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoToLocaleStringFunc, FunctionTypeBase);
DateProtoToLocaleStringFunc.prototype.call = function call(thisVal, args) {
	return new StringType(this._date.toLocaleString());
};

/**
 * toLocaleDateString() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.6
 */
function DateProtoToLocaleDateStringFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoToLocaleDateStringFunc, FunctionTypeBase);
DateProtoToLocaleDateStringFunc.prototype.call = function call(thisVal, args) {
	return new StringType(this._date.toLocaleDateString());
};

/**
 * toLocaleTimeString() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.7
 */
function DateProtoToLocaleTimeStringFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoToLocaleTimeStringFunc, FunctionTypeBase);
DateProtoToLocaleTimeStringFunc.prototype.call = function call(thisVal, args) {
	return new StringType(this._date.toLocaleTimeString());
};

/**
 * valueOf() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.8
 */
function DateProtoValueOfFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoValueOfFunc, FunctionTypeBase);
DateProtoValueOfFunc.prototype.call = function call(thisVal, args) {
	return new NumberType(this._date.valueOf());
};

/**
 * getTime() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.9
 */
function DateProtoGetTimeFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetTimeFunc, FunctionTypeBase);
DateProtoGetTimeFunc.prototype.call = function call(thisVal, args) {
	return new NumberType(this._date.getTime());
};

/**
 * getFullYear() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.10
 */
function DateProtoGetFullYearFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetFullYearFunc, FunctionTypeBase);
DateProtoGetFullYearFunc.prototype.call = function call(thisVal, args) {
	return new NumberType(this._date.getFullYear());
};

/**
 * getUTCFullYear() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.11
 */
function DateProtoGetUTCFullYearFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetUTCFullYearFunc, FunctionTypeBase);
DateProtoGetUTCFullYearFunc.prototype.call = function call(thisVal, args) {
	return new NumberType(this._date.getUTCFullYear());
};

/**
 * getMonth() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.12
 */
function DateProtoGetMonthFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetMonthFunc, FunctionTypeBase);
DateProtoGetMonthFunc.prototype.call = function call(thisVal, args) {
	return new NumberType(this._date.getMonth());
};

/**
 * getUTCMonth() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.13
 */
function DateProtoGetUTCMonthFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetUTCMonthFunc, FunctionTypeBase);
DateProtoGetUTCMonthFunc.prototype.call = function call(thisVal, args) {
	return new NumberType(this._date.getUTCMonth());
};

/**
 * getDate() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.14
 */
function DateProtoGetDateFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetDateFunc, FunctionTypeBase);
DateProtoGetDateFunc.prototype.call = function call(thisVal, args) {
	return new NumberType(this._date.getDate());
};

/**
 * getUTCDate() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.15
 */
function DateProtoGetUTCDateFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetUTCDateFunc, FunctionTypeBase);
DateProtoGetUTCDateFunc.prototype.call = function call(thisVal, args) {
	return new NumberType(this._date.getUTCDate());
};

/**
 * getDay() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.16
 */
function DateProtoGetDayFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetDayFunc, FunctionTypeBase);
DateProtoGetDayFunc.prototype.call = function call(thisVal, args) {
	return new NumberType(this._date.getDay());
};

/**
 * getUTCDay() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.17
 */
function DateProtoGetUTCDayFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetUTCDayFunc, FunctionTypeBase);
DateProtoGetUTCDayFunc.prototype.call = function call(thisVal, args) {
	return new NumberType(this._date.getUTCDay());
};

/**
 * getHours() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.18
 */
function DateProtoGetHoursFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetHoursFunc, FunctionTypeBase);
DateProtoGetHoursFunc.prototype.call = function call(thisVal, args) {
	return new NumberType(this._date.getHours());
};

/**
 * getUTCHours() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.19
 */
function DateProtoGetUTCHoursFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetUTCHoursFunc, FunctionTypeBase);
DateProtoGetUTCHoursFunc.prototype.call = function call(thisVal, args) {
	return new NumberType(this._date.getUTCHours());
};

/**
 * getMinutes() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.20
 */
function DateProtoGetMinutesFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetMinutesFunc, FunctionTypeBase);
DateProtoGetMinutesFunc.prototype.call = function call(thisVal, args) {
	return new NumberType(this._date.getMinutes());
};

/**
 * getUTCMinutes() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.21
 */
function DateProtoGetUTCMinutesFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetUTCMinutesFunc, FunctionTypeBase);
DateProtoGetUTCMinutesFunc.prototype.call = function call(thisVal, args) {
	return new NumberType(this._date.getUTCMinutes());
};

/**
 * getSeconds() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.22
 */
function DateProtoGetSecondsFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetSecondsFunc, FunctionTypeBase);
DateProtoGetSecondsFunc.prototype.call = function call(thisVal, args) {
	return new NumberType(this._date.getSeconds());
};

/**
 * getUTCSeconds() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.23
 */
function DateProtoGetUTCSecondsFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetUTCSecondsFunc, FunctionTypeBase);
DateProtoGetUTCSecondsFunc.prototype.call = function call(thisVal, args) {
	return new NumberType(this._date.getUTCSeconds());
};

/**
 * getMilliseconds() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.24
 */
function DateProtoGetMillisecondsFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetMillisecondsFunc, FunctionTypeBase);
DateProtoGetMillisecondsFunc.prototype.call = function call(thisVal, args) {
	return new NumberType(this._date.getMilliseconds());
};

/**
 * getUTCMilliseconds() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.25
 */
function DateProtoGetUTCMillisecondsFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetUTCMillisecondsFunc, FunctionTypeBase);
DateProtoGetUTCMillisecondsFunc.prototype.call = function call(thisVal, args) {
	return new NumberType(this._date.getUTCMilliseconds());
};

/**
 * getTimezoneOffset() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.26
 */
function DateProtoGetTimezoneOffsetFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoGetTimezoneOffsetFunc, FunctionTypeBase);
DateProtoGetTimezoneOffsetFunc.prototype.call = function call(thisVal, args) {
	return new NumberType(this._date.getTimezoneOffset());
};

/**
 * setTime() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.27
 */
function DateProtoSetTimeFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(1), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoSetTimeFunc, FunctionTypeBase);
DateProtoSetTimeFunc.prototype.call = function call(thisVal, args) {
	var time = args[0];
	if (time) {
		time = toNumber(time).value;
	}
	return new NumberType(this._date.setTime(time));
};

/**
 * setMilliseconds() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.28
 */
function DateProtoSetMillisecondsFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(1), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoSetMillisecondsFunc, FunctionTypeBase);
DateProtoSetMillisecondsFunc.prototype.call = function call(thisVal, args) {
	var ms = args[0];
	if (ms) {
		ms = toNumber(ms).value;
	}
	return new NumberType(this._date.setMilliseconds(ms));
};

/**
 * setUTCMilliseconds() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.29
 */
function DateProtoSetUTCMillisecondsFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(1), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoSetUTCMillisecondsFunc, FunctionTypeBase);
DateProtoSetUTCMillisecondsFunc.prototype.call = function call(thisVal, args) {
	var ms = args[0];
	if (ms) {
		ms = toNumber(ms).value;
	}
	return new NumberType(this._date.setUTCMilliseconds(ms));
};

/**
 * setSeconds() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.30
 */
function DateProtoSetSecondsFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(2), false, true);
	this._date = internalDateObj;
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
	return new NumberType(this._date.setSeconds(sec, ms));
};

/**
 * setUTCSeconds() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.31
 */
function DateProtoSetUTCSecondsFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(2), false, true);
	this._date = internalDateObj;
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
	return new NumberType(this._date.setUTCSeconds(sec, ms));
};

/**
 * setMinutes() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.32
 */
function DateProtoSetMinutesFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(3), false, true);
	this._date = internalDateObj;
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
	return new NumberType(this._date.setMinutes(min, sec, ms));
};

/**
 * setUTCMinutes() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.33
 */
function DateProtoSetUTCMinutesFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(3), false, true);
	this._date = internalDateObj;
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
	return new NumberType(this._date.setUTCMinutes(min, sec, ms));
};

/**
 * setHours() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.34
 */
function DateProtoSetHoursFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(4), false, true);
	this._date = internalDateObj;
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
	return new NumberType(this._date.setHours(hour, min, sec, ms));
};

/**
 * setUTCHours() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.35
 */
function DateProtoSetUTCHoursFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(4), false, true);
	this._date = internalDateObj;
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
	return new NumberType(this._date.setUTCHours(hour, min, sec, ms));
};

/**
 * setDate() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.36
 */
function DateProtoSetDateFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(1), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoSetDateFunc, FunctionTypeBase);
DateProtoSetDateFunc.prototype.call = function call(thisVal, args) {
	var date = args[0];
	if (date) {
		date = toNumber(dt).value;
	}
	return new NumberType(this._date.setDate(date));
};

/**
 * setUTCDate() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.37
 */
function DateProtoSetUTCDateFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(1), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoSetUTCDateFunc, FunctionTypeBase);
DateProtoSetUTCDateFunc.prototype.call = function call(thisVal, args) {
	var date = args[0];
	if (date) {
		date = toNumber(dt).value;
	}
	return new NumberType(this._date.setUTCDate(date));
};

/**
 * setMonth() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.38
 */
function DateProtoSetMonthFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(2), false, true);
	this._date = internalDateObj;
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
	return new NumberType(this._date.setMonth(month, date));
};

/**
 * setUTCMonth() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.39
 */
function DateProtoSetUTCMonthFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(2), false, true);
	this._date = internalDateObj;
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
	return new NumberType(this._date.setUTCMonth(month, date));
};

/**
 * setFullYear() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.40
 */
function DateProtoSetFullYearFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(3), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoSetFullYearFunc, FunctionTypeBase);
DateProtoSetFullYearFunc.prototype.call = function call(thisVal, args) {
	var year = args[0]
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
	return new NumberType(this._date.setFullYear(year, month, date));
};

/**
 * setUTCFullYear() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.41
 */
function DateProtoSetUTCFullYearFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(3), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoSetUTCFullYearFunc, FunctionTypeBase);
DateProtoSetUTCFullYearFunc.prototype.call = function call(thisVal, args) {
	var year = args[0]
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
	return new StringType(this._date.setUTCFullYear(year, month, date));
};

/**
 * toUTCString() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.42
 */
function DateProtoToUTCStringFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoToUTCStringFunc, FunctionTypeBase);
DateProtoToUTCStringFunc.prototype.call = function call(thisVal, args) {
	return new StringType(this._date.toUTCString());
};

/**
 * toISOString() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.43
 */
function DateProtoToISOStringFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoToISOStringFunc, FunctionTypeBase);
DateProtoToISOStringFunc.prototype.call = function call(thisVal, args) {
	return new StringType(this._date.toISOString());
};

/**
 * toJSON() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.5.44
 */
function DateProtoToJSONFunc(internalDateObj, className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(1), false, true);
	this._date = internalDateObj;
}
util.inherits(DateProtoToJSONFunc, FunctionTypeBase);
DateProtoToJSONFunc.prototype.call = function call(thisVal, args) {
	return new StringType(this._date.toJSON());
};

/**
 * @classdesc The prototype for Errors
 * 
 * @constructor
 * @see ECMA-262 Spec Chapter 15.9.5
 */
exports.DatePrototypeType = DatePrototypeType;
function DatePrototypeType(internalDateObj, className) {
	ObjectType.call(this, className);
	
	this.put('constructor', new DateConstructor(internalDateObj), false, true);
	this.put('toString', new DateProtoToStringFunc(internalDateObj), false, true);
	this.put('toDateString', new DateProtoToDateStringFunc(internalDateObj), false, true);
	this.put('toTimeString', new DateProtoToTimeStringFunc(internalDateObj), false, true);
	this.put('toLocaleString', new DateProtoToLocaleStringFunc(internalDateObj), false, true);
	this.put('toLocaleDateString', new DateProtoToLocaleDateStringFunc(internalDateObj), false, true);
	this.put('toLocaleTimeString', new DateProtoToLocaleTimeStringFunc(internalDateObj), false, true);
	this.put('valueOf', new DateProtoValueOfFunc(internalDateObj), false, true);
	this.put('getTime', new DateProtoGetTimeFunc(internalDateObj), false, true);
	this.put('getFullYear', new DateProtoGetFullYearFunc(internalDateObj), false, true);
	this.put('getUTCFullYear', new DateProtoGetUTCFullYearFunc(internalDateObj), false, true);
	this.put('getMonth', new DateProtoGetMonthFunc(internalDateObj), false, true);
	this.put('getUTCMonth', new DateProtoGetUTCMonthFunc(internalDateObj), false, true);
	this.put('getDate', new DateProtoGetDateFunc(internalDateObj), false, true);
	this.put('getUTCDate', new DateProtoGetUTCDateFunc(internalDateObj), false, true);
	this.put('getDay', new DateProtoGetDayFunc(internalDateObj), false, true);
	this.put('getUTCDay', new DateProtoGetUTCDayFunc(internalDateObj), false, true);
	this.put('getHours', new DateProtoGetHoursFunc(internalDateObj), false, true);
	this.put('getUTCHours', new DateProtoGetUTCHoursFunc(internalDateObj), false, true);
	this.put('getMinutes', new DateProtoGetMinutesFunc(internalDateObj), false, true);
	this.put('getUTCMinutes', new DateProtoGetUTCMinutesFunc(internalDateObj), false, true);
	this.put('getSeconds', new DateProtoGetSecondsFunc(internalDateObj), false, true);
	this.put('getUTCSeconds', new DateProtoGetUTCSecondsFunc(internalDateObj), false, true);
	this.put('getMilliseconds', new DateProtoGetMillisecondsFunc(internalDateObj), false, true);
	this.put('getUTCMilliseconds', new DateProtoGetUTCMillisecondsFunc(internalDateObj), false, true);
	this.put('getTimezoneOffset', new DateProtoGetTimezoneOffsetFunc(internalDateObj), false, true);
	this.put('setTime', new DateProtoSetTimeFunc(internalDateObj), false, true);
	this.put('setMilliseconds', new DateProtoSetMillisecondsFunc(internalDateObj), false, true);
	this.put('setUTCMilliseconds', new DateProtoSetUTCMillisecondsFunc(internalDateObj), false, true);
	this.put('setSeconds', new DateProtoSetSecondsFunc(internalDateObj), false, true);
	this.put('setUTCSeconds', new DateProtoSetUTCSecondsFunc(internalDateObj), false, true);
	this.put('setMinutes', new DateProtoSetMinutesFunc(internalDateObj), false, true);
	this.put('setUTCMinutes', new DateProtoSetUTCMinutesFunc(internalDateObj), false, true);
	this.put('setHours', new DateProtoSetHoursFunc(internalDateObj), false, true);
	this.put('setUTCHours', new DateProtoSetUTCHoursFunc(internalDateObj), false, true);
	this.put('setDate', new DateProtoSetDateFunc(internalDateObj), false, true);
	this.put('setUTCDate', new DateProtoSetUTCDateFunc(internalDateObj), false, true);
	this.put('setMonth', new DateProtoSetMonthFunc(internalDateObj), false, true);
	this.put('setUTCMonth', new DateProtoSetUTCMonthFunc(internalDateObj), false, true);
	this.put('setFullYear', new DateProtoSetFullYearFunc(internalDateObj), false, true);
	this.put('setUTCFullYear', new DateProtoSetUTCFullYearFunc(internalDateObj), false, true);
	this.put('toUTCString', new DateProtoToUTCStringFunc(internalDateObj), false, true);
	this.put('toISOString', new DateProtoToISOStringFunc(internalDateObj), false, true);
	this.put('toJSON', new DateProtoToJSONFunc(internalDateObj), false, true);
}
util.inherits(DatePrototypeType, ObjectType);