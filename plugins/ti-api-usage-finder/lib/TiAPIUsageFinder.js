/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * This plugin finds the Titanium APIs that are used.
 * 
 * @module plugin/TiAPIUsageFinder
 * @author Allen Yeung &lt;<a href="mailto:ayeung@appcelerator.com">ayeung@appcelerator.com</a>&gt;
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
 * @param {Object} libs A dictionary containing useful libs from {@link module:CodeProcessor} so they don't have to be
 *		required()'d individually using brittle hard-coded paths.
 */
module.exports = function (cli) {
	Runtime.on("tiPropReferenced", function(e) {
		var name = e.data.fullName;
		if (results[name]) {
			results[name] += 1;
		} else {
			results[name] = 1;
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