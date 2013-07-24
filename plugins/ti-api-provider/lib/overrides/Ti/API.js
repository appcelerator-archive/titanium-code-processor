/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Ti.API implementation
 *
 * @module plugins/TiAPIProcessor
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var path = require('path'),
	util = require('util'),
	Runtime = require(path.join(global.titaniumCodeProcessorLibDir, 'Runtime')),
	Base = require(path.join(global.titaniumCodeProcessorLibDir, 'Base'));

exports.getOverrides = function () {
	return [{
		regex: /^Titanium\.API\.debug$/,
		callFunction: new ConsoleFunc('debug').callFunction
	},{
		regex: /^Titanium\.API\.error$/,
		callFunction: new ConsoleFunc('error').callFunction
	},{
		regex: /^Titanium\.API\.info$/,
		callFunction: new ConsoleFunc('info').callFunction
	},{
		regex: /^Titanium\.API\.log$/,
		callFunction: new ConsoleFunc('log').callFunction
	},{
		regex: /^Titanium\.API\.warn$/,
		callFunction: new ConsoleFunc('warn').callFunction
	}];
};

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