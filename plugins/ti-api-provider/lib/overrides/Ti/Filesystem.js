/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Ti.Filesystem implementation
 *
 * @module plugins/TiAPIProcessor
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var path = require('path'),

	Base = require(path.join(global.titaniumCodeProcessorLibDir, 'Base'));

exports.getOverrides = function (options) {
	if (options.globalsOnly) {
		return [];
	}
	return [{
		regex: /^Titanium\.Filesystem\.resourcesDirectory$/,
		value: new Base.StringType('/')
	}];
};