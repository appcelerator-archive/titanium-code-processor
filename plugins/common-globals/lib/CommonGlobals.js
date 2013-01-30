/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * @module plugins/CommonGlobals
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var path = require('path'),
	util = require('util'),

	Base = require(path.join(global.titaniumCodeProcessorLibDir, 'Base')),
	Runtime = require(path.join(global.titaniumCodeProcessorLibDir, 'Runtime'));

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
function ConsoleFunc(type, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
	this._type = type;
}
util.inherits(ConsoleFunc, Base.FunctionTypeBase);
ConsoleFunc.prototype.call = function call(thisVal, args) {
	var level = this._type,
		message = [];
	args.forEach(function (arg) {
		if (Base.type(arg) === 'Unknown') {
			message.push('<Unknown value>');
		} else {
			message.push(Base.toString(arg).value);
		}
	});
	message = message.join(' ');
	Runtime.fireEvent('consoleOutput', message, {
		level: level,
		message: message
	});
	if (Runtime.options.logConsoleCalls) {
		Runtime.log('info', 'program output [' + this._type + ']: ' + message);
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

	this.put('debug', new ConsoleFunc('debug'), false, true);
	this.put('error', new ConsoleFunc('error'), false, true);
	this.put('info', new ConsoleFunc('info'), false, true);
	this.put('log', new ConsoleFunc('log'), false, true);
	this.put('warn', new ConsoleFunc('warn'), false, true);
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
LFunc.prototype.call = function call() {
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
AlertFunc.prototype.call = function call() {
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
ClearIntervalFunc.prototype.call = function call() {
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
ClearTimeoutFunc.prototype.call = function call() {
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

	var func = args[0];

	// Make sure func is actually a function
	if (Base.type(func) !== 'Unknown') {
		if (func.className !== 'Function' || !Base.isCallable(func)) {
			Base.handleRecoverableNativeException('TypeError');
			return new Base.UnknownType();
		}

		// Call the function, discarding the result
		Runtime.queueFunction(func, new Base.UndefinedType(), [], true);
	} else {
		Runtime.fireEvent('unknownCallback', 'An unknown value was passed to setInterval. Some source code may not be analyzed.');
	}

	return new Base.UndefinedType();
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
	var func = args[0];

	// Make sure func is actually a function
	if (Base.type(func) !== 'Unknown') {
		if (func.className !== 'Function' || !Base.isCallable(func)) {
			Base.handleRecoverableNativeException('TypeError');
			return new Base.UnknownType();
		}

		// Call the function, discarding the result
		Runtime.queueFunction(func, new Base.UndefinedType(), [], true);
	} else {
		Runtime.fireEvent('unknownCallback', 'An unknown value was passed to setTimeout. Some source code may not be analyzed.');
	}

	return new Base.UndefinedType();
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
StringFunc.prototype.call = function call() {
	return new Base.UndefinedType();
};
