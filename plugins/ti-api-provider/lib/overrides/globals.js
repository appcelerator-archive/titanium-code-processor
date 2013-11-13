/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * common globals implementations
 *
 * @module plugins/TiAPIProcessor
 */

var path = require('path'),

	Base = require(path.join(global.titaniumCodeProcessorLibDir, 'Base')),
	Runtime = require(path.join(global.titaniumCodeProcessorLibDir, 'Runtime'));

exports.getOverrides = function () {
	return [{
		regex: /^clearInterval$/,
		callFunction: Base.wrapNativeCall(function callFunction() {
			return new Base.UndefinedType();
		})
	},{
		regex: /^setInterval$/,
		callFunction: Base.wrapNativeCall(function callFunction(thisVal, args) {

			var func = args[0];

			// Make sure func is actually a function
			if (Base.type(func) !== 'Unknown') {
				if (func.className !== 'Function' || !Base.isCallable(func)) {
					Base.handleRecoverableNativeException('TypeError', 'A value that is not a function was passed to setInterval');
					return new Base.UnknownType();
				}

				// Call the function, discarding the result
				Runtime.queueFunction(func, new Base.UndefinedType(), [], true, Base.isSkippedMode());
			} else {
				Runtime.fireEvent('unknownCallback', 'An unknown value was passed to setInterval. Some source code may not be analyzed.');
			}

			return new Base.UnknownType();
		})
	},{
		regex: /^clearTimeout$/,
		callFunction: Base.wrapNativeCall(function callFunction() {
			return new Base.UndefinedType();
		})
	},{
		regex: /^setTimeout$/,
		callFunction: Base.wrapNativeCall(function callFunction(thisVal, args) {
			var func = args[0];

			// Make sure func is actually a function
			if (Base.type(func) !== 'Unknown') {
				if (func.className !== 'Function' || !Base.isCallable(func)) {
					Base.handleRecoverableNativeException('TypeError', 'A value that is not a function was passed to setTimeout');
					return new Base.UnknownType();
				}

				// Call the function, discarding the result
				Runtime.queueFunction(func, new Base.UndefinedType(), [], true, Base.isSkippedMode());
			} else {
				Runtime.fireEvent('unknownCallback', 'An unknown value was passed to setTimeout. Some source code may not be analyzed.');
			}

			return new Base.UnknownType();
		})
	},{
		regex: /^console\.debug$/,
		callFunction: consoleFunc('debug')
	},{
		regex: /^console\.error$/,
		callFunction: consoleFunc('error')
	},{
		regex: /^console\.info$/,
		callFunction: consoleFunc('info')
	},{
		regex: /^console\.log$/,
		callFunction: consoleFunc('log')
	},{
		regex: /^console\.warn$/,
		callFunction: consoleFunc('warn')
	}];
};

/**
 * console.*() method
 *
 * @private
 */
function consoleFunc(level) {
	return Base.wrapNativeCall(function callFunction(thisVal, args) {
		var message = [];
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
			Runtime.log('info', 'program output [' + level + ']: ' + message);
		}
		return new Base.UndefinedType();
	});
}
