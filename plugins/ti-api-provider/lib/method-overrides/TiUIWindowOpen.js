/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Ti.UI.Window.open implementation
 *
 * @module plugins/TiAPIProcessor
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var path = require('path'),

	Base = require(path.join(global.titaniumCodeProcessorLibDir, 'Base')),
	Runtime = require(path.join(global.titaniumCodeProcessorLibDir, 'Runtime'));

exports.init = function () {
	return {
		regex: /^Titanium\.UI.Window.open$/,
		call: function call(thisVal) {
			var requireFunction = Runtime.getGlobalObject().get('require'),
				urlValue = thisVal.get('url');
			if (requireFunction && urlValue) {
				requireFunction.call(new Base.UndefinedType(), [urlValue]);
			}
			return new Base.UndefinedType();
		}
	};
};