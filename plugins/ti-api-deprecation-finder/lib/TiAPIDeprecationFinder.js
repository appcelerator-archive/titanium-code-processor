/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * This plugin finds the deprecated Titanium APIs that are used.
 * 
 * @module plugins/TiAPIDeprecationFinder
 * @author Allen Yeung &lt;<a href='mailto:ayeung@appcelerator.com'>ayeung@appcelerator.com</a>&gt;
 */
 
var path = require('path'),
	Runtime = require(path.join(global.nodeCodeProcessorLibDir, 'Runtime')),
	
	results = {};

// ******** Plugin API Methods ********

/**
 * Creates an instance of the Ti Deprecation Finder plugin
 * 
 * @classdesc Finds all of the deprecated Titanium APIs that are used.
 * 
 * @constructor
 * @name module:plugins/TiAPIDeprecationFinder
 */
module.exports = function () {
	Runtime.on('tiPropertyReferenced', function(e) {
		var name = e.data.name;

		if (e.data.node.deprecated) {
			// TODO: Change deprecated message when we have the 'deprecated since' info from jsca
			Runtime.reportWarning('deprecatedTiPropertyReferenced', '"' + name + '" has been deprecated', {
				property: name
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
 * @name module:plugins/TiAPIDeprecationFinder#init
 */
module.exports.prototype.init = function init() {};

/**
* Gets the results of the plugin
* 
* @method
 * @name module:plugins/TiAPIDeprecationFinder#getResults
* @returns {Object} A dictionary of the deprecated Titanium APIs that were used along with a count of how many times they were used.
*/
module.exports.prototype.getResults = function getResults() {
	return results;
};