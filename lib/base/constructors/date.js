/*****************************************
 *
 * Date Constructor
 *
 *****************************************/

/**
 * parse() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.4.2
 */
function DateParseFunc(className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
}
util.inherits(DateParseFunc, FunctionTypeBase);
DateParseFunc.prototype.call = function call(thisVal, args) {
	return new UnknownType();
};

/**
 * UTC() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.4.3
 */
function DateUTCFunc(className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
}
util.inherits(DateUTCFunc, FunctionTypeBase);
DateUTCFunc.prototype.call = function call(thisVal, args) {
	return new UnknownType();
};

/**
 * now() prototype method
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9.4.4
 */
function DateNowFunc(className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
}
util.inherits(DateNowFunc, FunctionTypeBase);
DateNowFunc.prototype.call = function call(thisVal, args) {
	if (Runtime.options.exactMode) {
		return new NumberType(Date.now());
	} else {
		return new UnknownType();
	}
};

/**
 * Date constructor function
 * 
 * @private
 * @see ECMA-262 Spec Chapter 15.9
 */
function DateConstructor(className) {
	ObjectType.call(this, className || 'Function');
	this.put('length', new NumberType(0), false, true);
	
	this.put('parse', new DateParseFunc(), false, true);
	this.put('UTC', new DateUTCFunc(), false, true);
	this.put('now', new DateNowFunc(), false, true);
}
util.inherits(DateConstructor, FunctionTypeBase);
DateConstructor.prototype.call = function call(thisVal, args) {
	if (Runtime.options.exactMode) {
		return new StringType(Date());
	} else {
		return new UnknownType();
	}
};
DateConstructor.prototype.construct = function call(args) {
	var dateObj,
		internalDateObj,
		param,
		convertedArgs,
		i, len;
	if (Runtime.options.exactMode) {
		if (args.length === 0) {
			internalDateObj = new Date();
		} else if (args.length === 1){
			if (type(args[0]) === "String") {
				internalDateObj = new Date(args[0].value);
			} else {
				internalDateObj = new Date(toNumber(args[0]).value);
			}
		} else {
			convertedArgs = [];
			for(i = 0, len = args.length; i < len; i++) {
				convertedArgs[i] = toNumber(args[i]).value
			}
			switch(args.length) {
				case 2: 
					internalDateObj = new Date(
						convertedArgs[0], 
						convertedArgs[1]); 
					break;
				case 3: 
					internalDateObj = new Date(
						convertedArgs[0], 
						convertedArgs[1], 
						convertedArgs[2]); 
					break;
				case 4: 
					internalDateObj = new Date(
						convertedArgs[0], 
						convertedArgs[1], 
						convertedArgs[2], 
						convertedArgs[3]); 
					break;
				case 5: 
					internalDateObj = new Date(
						convertedArgs[0], 
						convertedArgs[1], 
						convertedArgs[2], 
						convertedArgs[3], 
						convertedArgs[4]); 
					break;
				case 6: 
					internalDateObj = new Date(
						convertedArgs[0], 
						convertedArgs[1], 
						convertedArgs[2], 
						convertedArgs[3], 
						convertedArgs[4], 
						convertedArgs[5]); 
					break;
				case 7: 
					internalDateObj = new Date(
						convertedArgs[0], 
						convertedArgs[1], 
						convertedArgs[2], 
						convertedArgs[3], 
						convertedArgs[4], 
						convertedArgs[5], 
						convertedArgs[6]); 
					break;
			}
		}
		dateObj = new ObjectType();
		dateObj.objectPrototype = new DatePrototypeType(internalDateObj);
		return dateObj;
	} else {
		return new UnknownType();
	}
};
GlobalObjects['Date'] = new DateConstructor();