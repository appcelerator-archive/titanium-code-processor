/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Ti.Filesystem implementation
 *
 * @module plugins/TiApiProcessor/Ti/FileSystem
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
exports.getOverrides = function (options) {
	if (options.globalsOnly) {
		return [];
	}
	return [{
		regex: /^Titanium\.Filesystem\.resourcesDirectory$/,
		value: new Base.StringType('/')
	}];
};