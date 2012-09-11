/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * This plugin finds the deprecated Titanium APIs that are used.
 * 
 * @module plugin/TiAPIDeprecationFinder
 * @author Allen Yeung &lt;<a href="mailto:ayeung@appcelerator.com">ayeung@appcelerator.com</a>&gt;
 */
 
var path = require("path"),
	Runtime = require(path.join(global.nodeCodeProcessorLibDir, "Runtime")),
	
	results = {};

// ******** Plugin API Methods ********

/**
 * Creates an instance of the Ti Deprecation Finder plugin
 * 
 * @classdesc Finds all of the deprecated Titanium APIs that are used.
 * 
 * @constructor
 */
module.exports = function (cli) {
	Runtime.on("tiPropReferenced", function(e) {
		var name = e.data.api.join(".");

		if (e.data.deprecated) {
			// TODO: Change deprecated message when we have the 'deprecated since' info from jsca
			Runtime.reportWarning("deprecatedTiPropReferenced", "'" + name + "' has been deprecated");

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
 */
module.exports.prototype.init = function init() {};

/**
* Gets the results of the plugin
* 
* @method
* @returns {Object} A dictionary of the deprecated Titanium APIs that were used along with a count of how many times they were used.
*/
module.exports.prototype.getResults = function getResults() {
	return results;
};