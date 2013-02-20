/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * This plugin finds the Titanium APIs that are used.
 *
 * @module plugins/TiAPIUsageFinder
 * @author Allen Yeung &lt;<a href='mailto:ayeung@appcelerator.com'>ayeung@appcelerator.com</a>&gt;
 */

var path = require('path'),
	Runtime = require(path.join(global.titaniumCodeProcessorLibDir, 'Runtime')),

	results = {
		global: {},
		file: {}
	};

// ******** Plugin API Methods ********

/**
 * Creates an instance of the Titanium Usage Finder plugin
 *
 * @classdesc Captures and keeps track of Titanium APIs that are used.
 *
 * @constructor
 * @name module:plugins/TiAPIUsageFinder
 */
module.exports = function () {

	function processReference(e) {
		var name = e.data.name,
			filename = e.filename;
		if (results.global[name]) {
			results.global[name]++;
		} else {
			results.global[name] = 1;
		}

		if (!results[filename]) {
			results[filename] = {};
		}
		if (results[filename][name]) {
			results[filename][name]++;
		} else {
			results[filename][name] = 1;
		}
	}

	Runtime.on('tiPropertyReferenced', processReference);
	Runtime.on('tiPropertySet', processReference);
};

/**
 * Initializes the plugin
 *
 * @method
 * @name module:plugins/TiAPIUsageFinder#init
 */
module.exports.prototype.init = function init() {};

/**
* Gets the results of the plugin
*
* @method
* @name module:plugins/TiAPIUsageFinder#getResults
* @returns {Object} A dictionary of the Titanium APIs that were used along with a count of how many times they were used.
*/
module.exports.prototype.getResults = function getResults() {
	return results;
};