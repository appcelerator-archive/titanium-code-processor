/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * This plugin finds the deprecated Titanium APIs that are used.
 *
 * @module plugins/TiApiDeprecationFinder
 * @author Bryan Hughes <bhughes@appcelerator.com>
 * @author Allen Yeung <ayeung@appcelerator.com>
 */

var path = require('path'),
	Runtime = require(path.join(global.titaniumCodeProcessorLibDir, 'Runtime')),
	CodeProcessorUtils = require(path.join(global.titaniumCodeProcessorLibDir, 'CodeProcessorUtils')),

	pluralize = CodeProcessorUtils.pluralize,

	results,
	renderData;

// ******** Helper Methods ********

/**
 * Generates the raw results data for this plugin
 *
 * @private
 */
function generateResultsData() {
	var summary,
		numDeprecatedAPIs = Object.keys(results.deprecatedAPIs).length;

	// Generate the results data
	if (numDeprecatedAPIs) {
		summary = pluralize('%s deprecated API is', '%s deprecated APIs are', numDeprecatedAPIs) + ' used';
	} else {
		summary = 'No deprecated APIs are used';
	}
	results.summary = summary;
}

/**
 * Generates the render data for this plugin. This is typically an abstracted version of the raw results, carefully
 * modified to match the requirements of the render templates
 *
 * @private
 */
function generateRenderData() {
	var numDeprecatedAPIs = Object.keys(results.deprecatedAPIs).length,
		deprecatedAPIs,
		numDeprecatedAPIReferences = 0,
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
				numReferences: Object.keys(results.deprecatedAPIs[deprecatedAPI].locations).length,
				numInstances: results.deprecatedAPIs[deprecatedAPI].numInstances
			});
			numDeprecatedAPIInstances += results.deprecatedAPIs[deprecatedAPI].numInstances;
			numDeprecatedAPIReferences += Object.keys(results.deprecatedAPIs[deprecatedAPI].locations).length;
		}
		if (numDeprecatedAPIs === 1) {
			numDeprecatedAPIs = '1 deprecated API is';
		} else {
			numDeprecatedAPIs = numDeprecatedAPIs + ' deprecated APIs are';
		}
		if (numDeprecatedAPIReferences === 1) {
			numDeprecatedAPIReferences = '1 place';
		} else {
			numDeprecatedAPIReferences = numDeprecatedAPIReferences + ' places';
		}
		if (numDeprecatedAPIInstances === 1) {
			numDeprecatedAPIInstances = '1 time';
		} else {
			numDeprecatedAPIInstances = numDeprecatedAPIInstances + ' times';
		}
	}
	renderData = {
		pluginDisplayName: exports.displayName,
		numAPIs: numDeprecatedAPIs,
		numReferences: numDeprecatedAPIReferences,
		numInstances: numDeprecatedAPIInstances,
		deprecatedAPIs: deprecatedAPIs
	};
}

// ******** Plugin API Methods ********

/**
 * Initializes the plugin
 *
 * @method
 * @param {Object} options The plugin options
 * @param {Array.<Object>} dependencies The dependant plugins of this plugin
 */
exports.init = function init() {
	results = {
		deprecatedAPIs: {}
	};
	Runtime.on('tiPropertyReferenced', function (e) {
		var name = e.data.name,
			location = e.filename + ':' + e.line + ':' + e.column,
			deprecatedAPIInfo;

		if (e.data.node.deprecated) {
			// TODO: Change deprecated message when we have the 'deprecated since' info from jsca
			Runtime.reportWarning('deprecatedTiPropertyReferenced', '"' + name + '" has been deprecated', {
				property: name
			});

			deprecatedAPIInfo = results.deprecatedAPIs[name];
			if (deprecatedAPIInfo) {
				deprecatedAPIInfo.numInstances++;
				if (deprecatedAPIInfo.locations.hasOwnProperty(location)) {
					deprecatedAPIInfo.locations[location]++;
				} else {
					deprecatedAPIInfo.locations[location] = 1;
				}
			} else {
				results.deprecatedAPIs[name] = {
					numInstances: 1,
					locations: {}
				};
				results.deprecatedAPIs[name].locations[location] = 1;
			}
		}
	});
	Runtime.on('projectProcessingEnd', function () {
		generateResultsData();
		generateRenderData();
	});
};

/**
* Gets the results of the plugin
*
* @method
* @returns {Object} A dictionary of the deprecated Titanium APIs that were used along with a count of how many times
*		they were used. The API name is the key and the count is the value.
*/
exports.getResults = function getResults() {
	return results;
};

/**
 * Generates the results template data to be rendered
 *
 * @method
 * @param {string} entryFile The path to the entrypoint file for this plugin. The template returned MUST have this value
 *		as one of the entries in the template
 * @return {module:CodeProcessor.pluginResultsPageData} The information for generating the template(s)
 */
exports.getResultsPageData = function getResultsPageData(entryFile) {
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
 * @param {module:CodeProcessor.arrayGen} arrayGen Log-friendly table generator
 * @return {string} The rendered data
 */
exports.renderLogOutput = function renderLogOutput(arrayGen) {
	var resultsToLog;
	if (renderData.deprecatedAPIs) {
		resultsToLog = renderData.numAPIs + ' used ' + renderData.numInstances + '\n\nDeprecated APIs Used\n';
		resultsToLog += arrayGen(['API', 'Num References', 'Num Instances'], renderData.deprecatedAPIs.list, ['api', 'numReferences', 'numInstances']);
	} else {
		resultsToLog = 'No deprecated APIs are used in the project';
	}
	return resultsToLog;
};
