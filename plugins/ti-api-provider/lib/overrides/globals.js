/**
 * <p>Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * common globals implementations
 *
 * @module plugins/TiAPIProcessor
 * @author Chris Williams &lt;<a href='mailto:cwilliams@appcelerator.com'>cwilliams@appcelerator.com</a>&gt;
 */

var path = require('path'),
	util = require('util'),

	Base = require(path.join(global.titaniumCodeProcessorLibDir, 'Base')),
	Runtime = require(path.join(global.titaniumCodeProcessorLibDir, 'Runtime'));

exports.getOverrides = function (options) {
	return [{
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
		regex: /^Global\.console\.debug$/,
		callFunction: consoleFunc('debug')
	},{
		regex: /^Global\.console\.error$/,
		callFunction: consoleFunc('error')
	},{
		regex: /^Global\.console\.info$/,
		callFunction: consoleFunc('info')
	},{
		regex: /^Global\.console\.log$/,
		callFunction: consoleFunc('log')
	},{
		regex: /^Global\.console\.warn$/,
		callFunction: consoleFunc('warn')
	},{
		regex: /^Global\.String\.format$/,
		callFunction: Base.wrapNativeCall(function callFunction(thisVal, args) {
			return new Base.UnknownType();
		})
	}];
};

/**
 * console.*() method
 *
 * @private
 */
function consoleFunc(type) {
	var _type = type;
	return Base.wrapNativeCall(function callFunction(thisVal, args) {
		var level = this._type, message = [];
		args.forEach(function(arg) {
			if (Base.type(arg) === 'Unknown') {
				message.push('<Unknown value>');
			} else {
				message.push(Base.toString(arg).value);
			}
		});
		message = message.join(' ');
		Runtime.fireEvent('consoleOutput', message, {
			level : level,
			message : message
		});
		if (Runtime.options.logConsoleCalls) {
			Runtime.log('info', 'program output [' + this._type + ']: ' + message);
		}
		return new Base.UndefinedType();
	});
}
