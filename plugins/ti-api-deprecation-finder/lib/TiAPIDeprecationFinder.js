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

	results,
	renderData;

// ******** Helper Methods ********

function generateResultsData() {
	var summary,
		numDeprecatedAPIs = Object.keys(results.deprecatedAPIs).length;

	// Generate the results data
	if (numDeprecatedAPIs) {
		summary = (numDeprecatedAPIs === 1 ? '1 deprecated API is' : numDeprecatedAPIs + ' deprecated APIs are') + ' used';
	} else {
		summary = 'No deprecated APIs are used';
	}
	results.summary = summary;
}

function generateRenderData() {
	var numDeprecatedAPIs = Object.keys(results.deprecatedAPIs).length,
		deprecatedAPIs,
		numDeprecatedAPIInstances = 0,
		deprecatedAPI;

	// Generate the render data
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
	renderData = {
		pluginDisplayName: this.displayName,
		numAPIs: numDeprecatedAPIs,
		numInstances: numDeprecatedAPIInstances,
		deprecatedAPIs: deprecatedAPIs
	};
}

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
	results = {
		deprecatedAPIs: {}
	};
	Runtime.on('tiPropertyReferenced', function (e) {
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
	Runtime.on('projectProcessingEnd', function () {
		generateResultsData();
		generateRenderData();
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

/**
 * Generates the results template data to be rendered
 *
 * @method
 * @param {String} entryFile The path to the entrypoint file for this plugin. The template returned MUST have this value
 *		as one of the entries in the template
 * @return {Object} The information for generating the template(s). Each template is defined as a key-value pair in the
 *		object, with the key being the name of the file, without a path. Two keys are expected: template is the path to
 *		the mustache template (note the name of the file must be unique, irrespective of path) and data is the
 *		information to dump into the template
 */
module.exports.prototype.getResultsPageData = function getResultsPageData(entryFile) {
	var template = {};

	template[entryFile] = {
		template: path.join(__dirname, '..', 'templates', 'tiApiDeprecationFinderTemplate.html'),
		data: renderData
	};

	return template;
};

/**
 * Renders the results data to a log-friendly string
 *
 * @param {Function} arrayGen Log-friendly table generator
 * @return {String} The rendered data
 */
module.exports.prototype.renderLogOutput = function (arrayGen) {
	var resultsToLog;
	if (renderData.deprecatedAPIs) {
		resultsToLog = renderData.numAPIs + ' used ' + renderData.numInstances + '\n\nDeprecated APIs Used\n';
		resultsToLog += arrayGen(['API', 'Num References'], renderData.deprecatedAPIs.list, ['api', 'numReferences']);
	} else {
		resultsToLog = 'No deprecated APIs are used in the project';
	}
	return resultsToLog;
};
