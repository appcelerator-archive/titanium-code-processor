/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @module plugins/CommonGlobals
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var path = require('path'),
	util = require('util'),
	
	Base = require(path.join(global.nodeCodeProcessorLibDir, 'Base')),
	Runtime = require(path.join(global.nodeCodeProcessorLibDir, 'Runtime')),
	RuleProcessor = require(path.join(global.nodeCodeProcessorLibDir, 'RuleProcessor')),
	
	passThroughConsole = true;

// ******** Plugin API Methods ********

/**
 * Creates an instance of the require provider plugin
 * 
 * @classdesc Provides a CommonJS compliant require() implementation, based on Titanium Mobile's implementations
 * 
 * @constructor
 * @name module:plugins/CommonGlobals
 */
module.exports = function () {};

/**
 * Initializes the plugin
 * 
 * @method
 * @name module:plugins/CommonGlobals#init
 */
module.exports.prototype.init = function init() {
	
	var globalObject = Runtime.getGlobalObject(),
		stringObject = globalObject.get('String');
	
	function addObject(name, value, obj) {
		obj.defineOwnProperty(name, {
			value: value,
			writable: false,
			enumerable: true,
			configurable: true
		}, false, true);
	}

	addObject('L', new LFunc(), globalObject);
	addObject('alert', new AlertFunc(), globalObject);
	addObject('clearInterval', new ClearIntervalFunc(), globalObject);
	addObject('clearTimeout', new ClearTimeoutFunc(), globalObject);
	addObject('setInterval', new SetIntervalFunc(), globalObject);
	addObject('setTimeout', new SetTimeoutFunc(), globalObject);
	addObject('console', new ConsoleObject(), globalObject);
	
	addObject('format', new StringFunc(), stringObject);
	addObject('formatCurrency', new StringFunc(), stringObject);
	addObject('formatDate', new StringFunc(), stringObject);
	addObject('formatDecimal', new StringFunc(), stringObject);
	addObject('formatTime', new StringFunc(), stringObject);
};

/**
* Gets the results of the plugin
* 
* @method
 * @name module:plugins/CommonGlobals#getResults
* @returns {Object} An empty object
*/
module.exports.prototype.getResults = function getResults() {
	return {};
};

// ******** Console Object ********

/**
 * console.*() prototype method
 * 
 * @private
 */
function ConsoleFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(ConsoleFunc, Base.FunctionTypeBase);
ConsoleFunc.prototype.call = function call(thisVal, args) {
	if (passThroughConsole) {
		debugger;
		console.log('program output: ' + (function parseArgs() {
			var str = [];
			args.forEach(function (arg) {
				str.push(Base.toString(arg).value);
			});
			return str.join(' ');
		})());
	}
	return new Base.UndefinedType();
};

/**
 * Console Object
 * 
 * @private
 */
function ConsoleObject(className) {
	Base.ObjectType.call(this, className);
	
	this.put('debug', new ConsoleFunc(), false, true);
	this.put('error', new ConsoleFunc(), false, true);
	this.put('info', new ConsoleFunc(), false, true);
	this.put('log', new ConsoleFunc(), false, true);
	this.put('warn', new ConsoleFunc(), false, true);
}
util.inherits(ConsoleObject, Base.ObjectType);

/**
 * L method
 * 
 * @private
 */
function LFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(LFunc, Base.FunctionTypeBase);
LFunc.prototype.call = function call(thisVal, args) {
	return new Base.UnknownType();
};

/**
 * alert method
 * 
 * @private
 */
function AlertFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(AlertFunc, Base.FunctionTypeBase);
AlertFunc.prototype.call = function call(thisVal, args) {
	return new Base.UndefinedType();
};

/**
 * clearInterval method
 * 
 * @private
 */
function ClearIntervalFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(ClearIntervalFunc, Base.FunctionTypeBase);
ClearIntervalFunc.prototype.call = function call(thisVal, args) {
	return new Base.UndefinedType();
};

/**
 * clearTimeout method
 * 
 * @private
 */
function ClearTimeoutFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(ClearTimeoutFunc, Base.FunctionTypeBase);
ClearTimeoutFunc.prototype.call = function call(thisVal, args) {
	return new Base.UndefinedType();
};

/**
 * setInterval method
 * 
 * @private
 */
function SetIntervalFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(SetIntervalFunc, Base.FunctionTypeBase);
SetIntervalFunc.prototype.call = function call(thisVal, args) {
	
	var func = args[0],
		eventDescription,
		eventData,
		result;
	
	if (++Runtime.recursionCount === Runtime.options.maxRecursionLimit) {
		
		// Fire an event and report a warning
		eventDescription = 'Maximum application recursion limit of ' + Runtime.options.maxRecursionLimit + 
			' reached, could not fully process code';
		eventData = {
			ruleName: 'call'
		};
		Runtime.fireEvent('maxRecusionLimitReached', eventDescription, eventData);
		Runtime.reportWarning('maxRecusionLimitReached', eventDescription, eventData);
			
		// Set the result to unknown
		result = new Base.UnknownType();
		
	} else {
		
		// Make sure func is actually a function
		if (Base.type(func) !== 'Unknown') {
			if (func.className !== 'Function' || !Base.isCallable(func)) {
				Base.throwException('TypeError');
			}
				
			// Call the function, discarding the result
			Runtime.ambiguousCode++;
			func.call(new Base.UndefinedType(), args);
			Runtime.ambiguousCode--;
			result = new Base.UndefinedType();
		} else {
			result = new Base.UnknownType();
		}
	}
	Runtime.recursionCount--;
	
	return result;
};

/**
 * setTimeout method
 * 
 * @private
 */
function SetTimeoutFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(SetTimeoutFunc, Base.FunctionTypeBase);
SetTimeoutFunc.prototype.call = function call(thisVal, args) {
	
	var func = args[0],
		eventDescription,
		eventData,
		result;
	
	if (++Runtime.recursionCount === Runtime.options.maxRecursionLimit) {
		
		// Fire an event and report a warning
		eventDescription = 'Maximum application recursion limit of ' + Runtime.options.maxRecursionLimit + 
			' reached, could not fully process code';
		eventData = {
			ruleName: 'call'
		};
		Runtime.fireEvent('maxRecusionLimitReached', eventDescription, eventData);
		Runtime.reportWarning('maxRecusionLimitReached', eventDescription, eventData);
			
		// Set the result to unknown
		result = new Base.UnknownType();
		
	} else {
		
		// Make sure func is actually a function
		if (Base.type(func) !== 'Unknown') {
			if (func.className !== 'Function' || !Base.isCallable(func)) {
				Base.throwException('TypeError');
			}
				
			// Call the function, discarding the result
			Runtime.ambiguousCode++;
			func.call(new Base.UndefinedType(), args);
			Runtime.ambiguousCode--;
			result = new Base.UndefinedType();
		} else {
			result = new Base.UnknownType();
		}
	}
	Runtime.recursionCount--;
	
	return result;
};

/**
 * Non-standard string extension function
 * 
 * @private
 */
function StringFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(StringFunc, Base.FunctionTypeBase);
StringFunc.prototype.call = function call(thisVal, args) {
	return new Base.UndefinedType();
};
