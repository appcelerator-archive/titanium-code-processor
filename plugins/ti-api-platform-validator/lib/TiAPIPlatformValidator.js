/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * This plugin finds the Titanium APIs that are used.
 * 
 * @module plugin/TiAPIPlatformValidator
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

var path = require("path"),
	Runtime = require(path.join(global.nodeCodeProcessorLibDir, "Runtime")),
	
	results = {};

// ******** Plugin API Methods ********

/**
 * Creates an instance of the Titanium Usage Finder plugin
 * 
 * @classdesc Captures and keeps track of Titanium APIs that are used.
 * 
 * @constructor
 */
module.exports = function (cli) {
	
	var osname = cli.env.osname;
	
	Runtime.on("tiPropReferenced", function(e) {
		var platformList = e.data.platforms,
			i = 0,
			len = platformList ? platformList.length : 0,
			isSupported = false,
			name = e.data.api.join(".");
		if (len) {
			for(; i < len; i++) {
				if (osname === platformList[i].platform) {
					isSupported = true;
				}
			}
			if (!isSupported) {
				Runtime.reportWarning("invalidPlatformReferenced", "Property '" + name + 
					"' is not supported on " + osname);

				if (results[name]) {
					results[name] += 1;
				} else {
					results[name] = 1;
				}
			}
		}
	});
};

/**
 * Initializes the plugin
 * 
 * @method
 */
module.exports.prototype.init = function init() {};

/**
* Gets the results of the plugin
* 
* @method
* @returns {Object} A dictionary of the Titanium APIs that were used along with a count of how many times they were used.
*/
module.exports.prototype.getResults = function getResults() {
	return results;
};