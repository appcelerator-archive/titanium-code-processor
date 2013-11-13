/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Ti.APP implementation
 *
 * @module plugins/TiAPIProcessor
 */

var path = require('path'),
	Base = require(path.join(global.titaniumCodeProcessorLibDir, 'Base'));

exports.getOverrides = function (options) {
	if (options.globalsOnly) {
		return [];
	}
	return [{
		regex: /^Titanium\.App\.Properties$/,
		obj: new Base.UnknownType() // Force to unknown, even though it has a type in the docs
	}];
};