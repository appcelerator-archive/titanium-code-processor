/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * This plugin finds the deprecated Titanium APIs that are used.
 * 
 * @module TiDeprecationFinder
 * @author Allen Yeung &lt;<a href="mailto:ayeung@appcelerator.com">ayeung@appcelerator.com</a>&gt;
 */
 
var results = {};

// ******** Plugin API Methods ********

/**
 * Creates an instance of the Ti Deprecation Finder plugin
 * 
 * @classdesc Finds all of the deprecated Titanium APIs that are used.
 * 
 * @constructor
 * @param {Object} libs A dictionary containing useful libs from {@link module:CodeProcessor} so they don't have to be
 *		required()'d individually using brittle hard-coded paths.
 */
module.exports = function (libs) {
	libs.Messaging.on("deprecatedTiPropReferenced", function(e) {
		if (results[e.name]) {
			results[e.name] += 1;
		} else {
			results[e.name] = 1;
		}
	});
};

/**
* Gets the results of the plugin
* 
* @method
* @returns {Object} A dictionary of the deprecated Titanium APIs that were used along with a count of how many times they were used.
*/
module.exports.prototype.getResults = function getResults() {
	return results;
};