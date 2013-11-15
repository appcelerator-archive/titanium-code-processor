/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Ti.API implementation
 *
 * @module plugins/TiApiProvider/Ti/API
 */

var path = require('path'),

	Base = require(path.join(global.titaniumCodeProcessorLibDir, 'Base'));

/**
 * Gets the set of overrides defined in this file
 *
 * @method module:plugins/TiApiProvider/Ti/API.getOverrides
 * @param  {Object} options The options passed to the Ti API provider plugin
 * @return {Array.<module:plugins/TiApiProvider.override>} The list of overrides
 */
exports.getOverrides = function (options) {
	if (options.globalsOnly) {
		return [];
	}
	var globalObject = Base.getGlobalObject();
	return [{
		regex: /^Titanium\.API\.debug$/,
		callFunction: Base.wrapNativeCall(function callFunction(thisVal, args) {
			return globalObject.get('console').get('debug').callFunction(thisVal, args);
		})
	},{
		regex: /^Titanium\.API\.error$/,
		callFunction: Base.wrapNativeCall(function callFunction(thisVal, args) {
			return globalObject.get('console').get('error').callFunction(thisVal, args);
		})
	},{
		regex: /^Titanium\.API\.info$/,
		callFunction: Base.wrapNativeCall(function callFunction(thisVal, args) {
			return globalObject.get('console').get('info').callFunction(thisVal, args);
		})
	},{
		regex: /^Titanium\.API\.log$/,
		callFunction: Base.wrapNativeCall(function callFunction(thisVal, args) {
			return globalObject.get('console').get('log').callFunction(thisVal, args);
		})
	},{
		regex: /^Titanium\.API\.warn$/,
		callFunction: Base.wrapNativeCall(function callFunction(thisVal, args) {
			return globalObject.get('console').get('warn').callFunction(thisVal, args);
		})
	}];
};