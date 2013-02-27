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
	Runtime = require(path.join(global.titaniumCodeProcessorLibDir, 'Runtime')),

	results = {
		summary: '',
		deprecatedAPIs: {}
	};

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

			if (results.deprecatedAPIs[name]) {
				results.deprecatedAPIs[name] += 1;
			} else {
				results.deprecatedAPIs[name] = 1;
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
	var summary,
		numDeprecatedAPIs = Object.keys(results.deprecatedAPIs).length;
	if (numDeprecatedAPIs) {
		summary = (numDeprecatedAPIs === 1 ? '1 deprecated API is' : numDeprecatedAPIs + ' deprecated APIs are') + ' used in the project';
	} else {
		summary = 'No deprecated APIs are used in the project, hooray!';
	}
	results.summary = summary;
	return results;
};

/**
 * Generates the results HTML page
 *
 * @method
 * @param {String} path The path to the file to write
 * @param {String} headerIndex The index of this header item, to be passed into render
 * @return {String} the HTML content summarizing the results
 */
module.exports.prototype.getResultsPageData = function getResultsPageData() {
	var deprecatedAPIs,
		numDeprecatedAPIs = Object.keys(results.deprecatedAPIs).length,
		numDeprecatedAPIInstances = 0,
		deprecatedAPI;
	if (numDeprecatedAPIs) {
		deprecatedAPIs = {
			list: []
		};
		for (deprecatedAPI in results.deprecatedAPIs) {
			deprecatedAPIs.list.push({
				api: deprecatedAPI,
				numReferences: results.deprecatedAPIs[deprecatedAPI]
			});
			numDeprecatedAPIInstances += results.deprecatedAPIs[deprecatedAPI];
		}
		if (numDeprecatedAPIs === 1) {
			numDeprecatedAPIs = '1 deprecated API is';
		} else {
			numDeprecatedAPIs = numDeprecatedAPIs + ' deprecated APIs are';
		}
		if (numDeprecatedAPIInstances === 1) {
			numDeprecatedAPIInstances = '1 time';
		} else {
			numDeprecatedAPIInstances = numDeprecatedAPIInstances + ' times';
		}
	}
	return {
		template: path.join(__dirname, '..', 'templates', 'tiApiDeprecationFinderTemplate.html'),
		data: {
			numAPIs: numDeprecatedAPIs,
			numInstances: numDeprecatedAPIInstances,
			deprecatedAPIs: deprecatedAPIs
		}
	};
};
module.exports.prototype.displayName = 'Deprecated APIs';