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
	Runtime = require(path.join(global.titaniumCodeProcessorLibDir, 'Runtime')),
	Base = require(path.join(global.titaniumCodeProcessorLibDir, 'Base'));

exports.getOverrides = function () {
	var consoleObject = Runtime.getGlobalObject().get('console'),
		debug = consoleObject.get('debug'),
		error = consoleObject.get('error'),
		info = consoleObject.get('info'),
		log = consoleObject.get('log'),
		warn = consoleObject.get('warn');
	return [{
		regex: /^Titanium\.API\.debug$/,
		callFunction: Base.wrapNativeCall(function callFunction(thisVal, args) {
			return debug.callFunction(thisVal, args);
		})
	},{
		regex: /^Titanium\.API\.error$/,
		callFunction: Base.wrapNativeCall(function callFunction(thisVal, args) {
			return error.callFunction(thisVal, args);
		})
	},{
		regex: /^Titanium\.API\.info$/,
		callFunction: Base.wrapNativeCall(function callFunction(thisVal, args) {
			return info.callFunction(thisVal, args);
		})
	},{
		regex: /^Titanium\.API\.log$/,
		callFunction: Base.wrapNativeCall(function callFunction(thisVal, args) {
			return log.callFunction(thisVal, args);
		})
	},{
		regex: /^Titanium\.API\.warn$/,
		callFunction: Base.wrapNativeCall(function callFunction(thisVal, args) {
			return warn.callFunction(thisVal, args);
		})
	}];
};