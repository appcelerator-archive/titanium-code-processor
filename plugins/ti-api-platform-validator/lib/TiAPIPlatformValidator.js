/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * This plugin finds the Titanium APIs that are used.
 * 
 * @module plugins/TiAPIPlatformValidator
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var path = require('path'),
	Runtime = require(path.join(global.nodeCodeProcessorLibDir, 'Runtime')),
	
	results = {};

// ******** Plugin API Methods ********

/**
 * Creates an instance of the Titanium Usage Finder plugin
 * 
 * @classdesc Captures and keeps track of Titanium APIs that are used.
 * 
 * @constructor
 * @name module:plugins/TiAPIPlatformValidator
 */
module.exports = function (options) {
	
	var platform = options.platform;
	if (platform) {
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
	}
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