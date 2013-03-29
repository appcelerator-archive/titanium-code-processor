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
	Runtime = require(path.join(global.titaniumCodeProcessorLibDir, 'Runtime'));

exports.getOverrides = function () {
	var consoleObject = Runtime.getGlobalObject().get('console'),
		debug = consoleObject.get('debug'),
		error = consoleObject.get('error'),
		info = consoleObject.get('info'),
		log = consoleObject.get('log'),
		warn = consoleObject.get('warn');
	return [{
		regex: /^Titanium\.API\.debug$/,
		call: function call(thisVal, args) {
			return debug.call(thisVal, args);
		}
	},{
		regex: /^Titanium\.API\.error$/,
		call: function call(thisVal, args) {
			return error.call(thisVal, args);
		}
	},{
		regex: /^Titanium\.API\.info$/,
		call: function call(thisVal, args) {
			return info.call(thisVal, args);
		}
	},{
		regex: /^Titanium\.API\.log$/,
		call: function call(thisVal, args) {
			return log.call(thisVal, args);
		}
	},{
		regex: /^Titanium\.API\.warn$/,
		call: function call(thisVal, args) {
			return warn.call(thisVal, args);
		}
	}];
};