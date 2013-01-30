/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * This plugin finds the Titanium APIs that are used that are not supported on the current platform
 *
 * @module plugins/TiAPIPlatformValidator
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var path = require('path'),
	Runtime = require(path.join(global.titaniumCodeProcessorLibDir, 'Runtime')),

	results = {},

	platformList = ['android', 'mobileweb', 'iphone', 'ios', 'ipad'];

// ******** Plugin API Methods ********

/**
 * Creates an instance of the Titanium Platform Validator plugin
 *
 * @classdesc Captures and keeps track of Titanium APIs that are used.
 *
 * @constructor
 * @name module:plugins/TiAPIPlatformValidator
 */
module.exports = function (options) {

	var platform = options && options.platform;

	if (!platform) {
		console.error('ti-api-platform-validator plugin requires the "platform" option');
		process.exit(1);
	}
	if (platformList.indexOf(platform) === -1) {
		console.error('"' + platform + '" is not a valid platform for the ti-api-platform-validator plugin');
		process.exit(1);
	}

	Runtime.on('tiPropertyReferenced', function(e) {
		var platformList = e.data.node.userAgents,
			i = 0,
			len = platformList.length,
			isSupported = false,
			name = e.data.name;

		for(; i < len; i++) {
			if (platform === platformList[i].platform) {
				isSupported = true;
			}
		}
		if (!isSupported) {
			Runtime.reportWarning('invalidPlatformReferenced', 'Property "' + name +
				'" is not supported on ' + platform, {
					property: name,
					platform: platform
				});

			if (results[name]) {
				results[name] += 1;
			} else {
				results[name] = 1;
			}
		}
	});
};

/**
 * Initializes the plugin
 *
 * @method
 * @name module:plugins/TiAPIPlatformValidator#init
 */
module.exports.prototype.init = function init() {};

/**
* Gets the results of the plugin
*
* @method
 * @name module:plugins/TiAPIPlatformValidator#getResults
* @returns {Object} A dictionary of the Titanium APIs that were used along with a count of how many times they were used.
*/
module.exports.prototype.getResults = function getResults() {
	return results;
};