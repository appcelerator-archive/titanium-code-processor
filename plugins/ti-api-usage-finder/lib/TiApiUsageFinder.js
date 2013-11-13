/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * This plugin finds the Titanium APIs that are used.
 *
 * @module plugins/TiAPIUsageFinder
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
		numAPIs = Object.keys(results.global).length,
		numInstances = 0,
		api;
	if (numAPIs) {
		for (api in results.global) {
			numInstances += results.global[api];
		}
		summary = pluralize('%s distinct API is', '%s distinct APIs are', numAPIs) + ' used ' +
			pluralize('%s time', '%s times', numInstances);
	} else {
		summary = 'No Titanium APIs are used';
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
	var numAPIs = Object.keys(results.global).length,
		baseDirectory = Runtime.sourceInformation.projectDir + path.sep,
		numInstances = 0,
		api,
		file,
		fileEntry,
		summary,
		apiSummary,
		list,
		apiByFile;

	function apiComparator(a, b) {
		return a.api.toUpperCase().localeCompare(b.api.toUpperCase());
	}

	if (numAPIs) {
		apiSummary = {
			list: []
		};
		apiByFile = {
			list: []
		};
		list = apiSummary.list;
		for (api in results.global) {
			list.push({
				api: api,
				numReferences: results.global[api]
			});
			numInstances += results.global[api];
		}
		list.sort(apiComparator);

		list = apiByFile.list;
		for (file in results.file) {
			list.push({
				filename: file.replace(baseDirectory, ''),
				list: fileEntry = []
			});
			for (api in results.file[file]) {
				fileEntry.push({
					api: api,
					numReferences: results.file[file][api]
				});
			}
			fileEntry.sort(apiComparator);
		}
		if (numAPIs === 1) {
			numAPIs = '1 distinct API is';
		} else {
			numAPIs = numAPIs + ' distinct APIs are';
		}
		if (numInstances === 1) {
			numInstances = '1 time';
		} else {
			numInstances = numInstances + ' times';
		}
		summary = {
			numAPIs: numAPIs,
			numInstances: numInstances
		};
	}

	renderData = {
		pluginDisplayName: exports.displayName,
		summary: summary,
		apiSummary: apiSummary,
		apiByFile: apiByFile
	};
}

// ******** Plugin API Methods ********

/**
 * Initializes the plugin
 *
 * @method
 * @name module:plugins/TiAPIUsageFinder#init
 * @param {Object} options The plugin options
 * @param {Array.<Object>} dependencies The dependant plugins of this plugin
 */
exports.init = function init() {
	function processReference(e) {
		var name = e.data.name,
			filename = Runtime.mapLocation(e).filename;
		if (results.global[name]) {
			results.global[name]++;
		} else {
			results.global[name] = 1;
		}

		if (!results.file[filename]) {
			results.file[filename] = {};
		}
		if (results.file[filename][name]) {
			results.file[filename][name]++;
		} else {
			results.file[filename][name] = 1;
		}
	}

	results = {
		global: {},
		file: {},
		summary: ''
	};

	Runtime.on('tiPropertyReferenced', processReference);
	Runtime.on('tiPropertySet', processReference);

	Runtime.on('projectProcessingEnd', function () {
		generateResultsData();
		generateRenderData();
	});
};

/**
* Gets the results of the plugin
*
* @method
* @name module:plugins/TiAPIUsageFinder#getResults
* @returns {Object} A dictionary of the Titanium APIs that were used along with a count of how many times they were used.
*/
exports.getResults = function getResults() {
	return results;
};

/**
 * Generates the results template data to be rendered
 *
 * @method
 * @param {String} entryFile The path to the entrypoint file for this plugin. The template returned MUST have this value
 *		as one of the entries in the template
 * @return {module:CodeProcessor.pluginResultsPageData} The information for generating the template(s)
 */
exports.getResultsPageData = function getResultsPageData(entryFile) {
	var template = {};

	template[entryFile] = {
		template: path.join(__dirname, '..', 'templates', 'tiApiUsageFinderTemplate.html'),
		data: renderData
	};

	return template;
};

/**
 * Renders the results data to a log-friendly string
 *
 * @param {module:CodeProcessor.arrayGen} arrayGen Log-friendly table generator
 * @return {String} The rendered data
 */
exports.renderLogOutput = function renderLogOutput(arrayGen) {
	var resultsToLog,
		i, len;

	if (renderData.summary) {
		resultsToLog = renderData.summary.numAPIs + ' used ' + renderData.summary.numInstances;
	} else {
		resultsToLog = 'No Titanium APIs are used in the project';
	}
	if (renderData.apiSummary) {
		resultsToLog += '\n\nAPIs Used\n';
		resultsToLog += arrayGen(['API', 'Num References'], renderData.apiSummary.list, ['api', 'numReferences']);
	}
	if (renderData.apiByFile) {
		resultsToLog += '\n\nAPIs Used by File';
		for (i = 0, len = renderData.apiByFile.list.length; i < len; i++) {
			resultsToLog += '\n\n' + renderData.apiByFile.list[i].filename + '\n';
			resultsToLog += arrayGen(['API', 'Num References'], renderData.apiByFile.list[i].list, ['api', 'numReferences']);
		}
	}

	return resultsToLog;
};
