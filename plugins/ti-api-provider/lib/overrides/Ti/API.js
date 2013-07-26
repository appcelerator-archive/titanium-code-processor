/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Ti.API implementation
 *
 * @module plugins/TiAPIProcessor
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @author Chris Williams &lt;<a href='mailto:cwilliams@appcelerator.com'>cwilliams@appcelerator.com</a>&gt;
 */

var path = require('path'), util = require('util'), Runtime = require(path.join(global.titaniumCodeProcessorLibDir, 'Runtime')), Base = require(path.join(global.titaniumCodeProcessorLibDir, 'Base'));

exports.getOverrides = function() {
	return [{
		regex : /^Titanium\.API\.debug$/,
		callFunction : consoleFunc('debug')
	}, {
		regex : /^Titanium\.API\.error$/,
		callFunction : consoleFunc('error')
	}, {
		regex : /^Titanium\.API\.info$/,
		callFunction : consoleFunc('info')
	}, {
		regex : /^Titanium\.API\.log$/,
		callFunction : consoleFunc('log')
	}, {
		regex : /^Titanium\.API\.warn$/,
		callFunction : consoleFunc('warn')
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
