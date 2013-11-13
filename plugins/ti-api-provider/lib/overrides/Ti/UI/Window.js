/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Ti.UI.Window implementation
 *
 * @module plugins/TiApiProcessor/Ti/UI/Window
 */

var path = require('path'),

	Base = require(path.join(global.titaniumCodeProcessorLibDir, 'Base'));

/**
 * Gets the set of overrides defined in this file
 *
 * @method
 * @param  {Object} options The options passed to the Ti API provider plugin
 * @return {Array.<module:plugins/TiApiProcessor.override>} The list of overrides
 */
exports.getOverrides = function () {
	return [{
		regex: /^Titanium\.UI\.Window\.open$/,
		callFunction: Base.wrapNativeCall(function callFunction(thisVal) {
			var requireFunction = Base.getGlobalObject().get('require'),
				urlValue = thisVal.get('url');
			if (requireFunction && urlValue && Base.type(urlValue) !== 'Undefined' && Base.type(urlValue) !== 'Null') {
				requireFunction.callFunction(new Base.UndefinedType(), [urlValue]);
			}
			return new Base.UndefinedType();
		})
	},{
		regex: /^Titanium\.UI\.Window\.url$/,
		value: new Base.UndefinedType()
	}];
};