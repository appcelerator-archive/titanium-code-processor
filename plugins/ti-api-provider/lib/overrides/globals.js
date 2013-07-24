/**
 * <p>Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * common globals implementations
 *
 * @module plugins/TiAPIProcessor
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var path = require('path'),
	util = require('util'),

	Base = require(path.join(global.titaniumCodeProcessorLibDir, 'Base')),
	Runtime = require(path.join(global.titaniumCodeProcessorLibDir, 'Runtime'));

exports.getOverrides = function (options) {
	return [{
		regex: /^Global\.L$/,
		callFunction: Base.wrapNativeCall(function callFunction() {
			return new Base.UnknownType();
		})
	},{
		regex: /^Global\.alert$/,
		callFunction: Base.wrapNativeCall(function callFunction() {
			return new Base.UndefinedType();
		})
	},{
		regex: /^Global\.clearInterval$/,
		callFunction: Base.wrapNativeCall(function callFunction() {
			return new Base.UndefinedType();
		})
	},{
		regex: /^Global\.clearTimeout$/,
		callFunction: Base.wrapNativeCall(function callFunction() {
			return new Base.UndefinedType();
		})
	},{
		regex: /^Global\.setInterval$/,
		callFunction: Base.wrapNativeCall(function callFunction(thisVal, args) {
		
			var func = args[0];
		
			// Make sure func is actually a function
			if (Base.type(func) !== 'Unknown') {
				if (func.className !== 'Function' || !Base.isCallable(func)) {
					Base.handleRecoverableNativeException('TypeError', 'A value that is not a function was passed to setInterval');
					return new Base.UnknownType();
				}
		
				// Call the function, discarding the result
				Runtime.queueFunction(func, new Base.UndefinedType(), [], true);
			} else {
				Runtime.fireEvent('unknownCallback', 'An unknown value was passed to setInterval. Some source code may not be analyzed.');
			}
		
			return new Base.UnknownType();
		})
	},{
		regex: /^Global\.setTimeout$/,
		callFunction: Base.wrapNativeCall(function callFunction(thisVal, args) {
			var func = args[0];
		
			// Make sure func is actually a function
			if (Base.type(func) !== 'Unknown') {
				if (func.className !== 'Function' || !Base.isCallable(func)) {
					Base.handleRecoverableNativeException('TypeError', 'A value that is not a function was passed to setTimeout');
					return new Base.UnknownType();
				}
		
				// Call the function, discarding the result
				Runtime.queueFunction(func, new Base.UndefinedType(), [], true);
			} else {
				Runtime.fireEvent('unknownCallback', 'An unknown value was passed to setTimeout. Some source code may not be analyzed.');
			}
		
			return new Base.UnknownType();
		})
	},{
		regex: /^Global\.console$/,
		obj: new ConsoleObject()
	},{
		regex: /^Global\.console\.debug$/,
		callFunction: new ConsoleFunc('debug').callFunction
	},{
		regex: /^Global\.console\.error$/,
		callFunction: new ConsoleFunc('error').callFunction
	},{
		regex: /^Global\.console\.info$/,
		callFunction: new ConsoleFunc('info').callFunction
	},{
		regex: /^Global\.console\.log$/,
		callFunction: new ConsoleFunc('log').callFunction
	},{
		regex: /^Global\.console\.warn$/,
		callFunction: new ConsoleFunc('warn')
	},{
		regex: /^Global\.String\.format$/,
		callFunction: Base.wrapNativeCall(function callFunction() {
			return new Base.UndefinedType();
		})
	},{
		regex: /^Global\.String\.formatCurrency$/,
		callFunction: Base.wrapNativeCall(function callFunction() {
			return new Base.UndefinedType();
		})
	},{
		regex: /^Global\.String\.formatDate$/,
		callFunction: Base.wrapNativeCall(function callFunction() {
			return new Base.UndefinedType();
		})
	},{
		regex: /^Global\.String\.formatDecimal$/,
		callFunction: Base.wrapNativeCall(function callFunction() {
			return new Base.UndefinedType();
		})
	},{
		regex: /^Global\.String\.formatTime$/,
		callFunction: Base.wrapNativeCall(function callFunction() {
			return new Base.UndefinedType();
		})
	}];
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
ConsoleFunc.prototype.callFunction = Base.wrapNativeCall(function callFunction(thisVal, args) {
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
});

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
