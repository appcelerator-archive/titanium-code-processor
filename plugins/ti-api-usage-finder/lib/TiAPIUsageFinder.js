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
		file: {},
		summary: ''
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

		if (!results.file[filename]) {
			results.file[filename] = {};
		}
		if (results.file[filename][name]) {
			results.file[filename][name]++;
		} else {
			results.file[filename][name] = 1;
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
	var summary,
		numAPIs = Object.keys(results.global).length,
		numInstances = 0,
		api;
	if (numAPIs) {
		for (api in results.global) {
			numInstances += results.global[api];
		}
		summary = (numAPIs === 1 ? '1 distinct API is' : numAPIs + ' distinct APIs are') + ' used ' +
			(numInstances === 1 ? '1 time' : numInstances + ' times');
	} else {
		summary = 'No Titanium APIs are used';
	}
	results.summary = summary;
	return results;
};

/**
 * Generates the results template data to be rendered
 *
 * @method
 * @param {String} entryFile The path to the entrypoint file for this plugin. The template returned MUST have this value
 *		as one of the entries in the template
 * @param {String} baseDirectory The base directory of the code, useful for shortening paths
 * @return {Object} The information for generating the template(s). Each template is defined as a key-value pair in the
 *		object, with the key being the name of the file, without a path. Two keys are expected: template is the path to
 *		the mustache template (note the name of the file must be unique, irrespective of path) and data is the
 *		information to dump into the template
 */
module.exports.prototype.getResultsPageData = function getResultsPageData(entryFile, baseDirectory) {
	var numAPIs = Object.keys(results.global).length,
		numInstances = 0,
		api,
		file,
		fileEntry,
		summary,
		apiSummary,
		apiByFile,
		template = {};

	if (numAPIs) {
		apiSummary = {
			list: []
		};
		apiByFile = {
			files: []
		};
		for (api in results.global) {
			apiSummary.list.push({
				api: api,
				numReferences: results.global[api]
			});
			numInstances += results.global[api];
		}
		for (file in results.file) {
			apiByFile.files.push({
				filename: file.replace(baseDirectory, ''),
				list: fileEntry = []
			});
			for (api in results.file[file]) {
				fileEntry.push({
					api: api,
					numReferences: results.file[file][api]
				});
			}
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

	template[entryFile] = {
		template: path.join(__dirname, '..', 'templates', 'tiApiUsageFinderTemplate.html'),
		data: {
			summary: summary,
			apiSummary: apiSummary,
			apiByFile: apiByFile
		}
	};

	return template;
};
module.exports.prototype.displayName = 'API Usage';