/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Ti.UI.Window implementation
 *
 * @module plugins/TiAPIProcessor
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var path = require('path'),

	Base = require(path.join(global.titaniumCodeProcessorLibDir, 'Base')),
	Runtime = require(path.join(global.titaniumCodeProcessorLibDir, 'Runtime'));

exports.getOverrides = function () {
	return [{
		regex: /^Titanium\.UI\.Window\.open$/,
		callFunction: Base.wrapNativeCall(function callFunction(thisVal) {
			var requireFunction = Runtime.getGlobalObject().get('require'),
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