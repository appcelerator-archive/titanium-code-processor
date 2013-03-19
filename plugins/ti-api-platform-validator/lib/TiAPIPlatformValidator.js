/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * This plugin finds the Titanium APIs that are used that are not supported on the current platform
 *
 * @module plugins/TiAPIPlatformValidator
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var path = require('path'),
	Runtime = require(path.join(global.titaniumCodeProcessorLibDir, 'Runtime')),

	results,
	renderData;

// ******** Helper Methods ********

function generateResultsData() {
	var summary,
		numInvalidAPIs = Object.keys(results.invalidAPIs).length;
	if (numInvalidAPIs) {
		summary = (numInvalidAPIs === 1 ? '1 platform API is' : numInvalidAPIs + ' platform APIs are') + ' used incorrectly';
	} else {
		summary = 'No platform specific APIs are used incorrectly';
	}
	results.summary = summary;
}

function generateRenderData() {
	var invalidAPIs,
		numInvalidAPIs = Object.keys(results.invalidAPIs).length,
		numInvalidAPIInstances = 0,
		invalidAPI;

	if (numInvalidAPIs) {
		invalidAPIs = {
			list: []
		};
		for (invalidAPI in results.invalidAPIs) {
			invalidAPIs.list.push({
				api: invalidAPI,
				numReferences: results.invalidAPIs[invalidAPI]
			});
			numInvalidAPIInstances += results.invalidAPIs[invalidAPI];
		}
		if (numInvalidAPIs === 1) {
			numInvalidAPIs = '1 platform-specific API is';
		} else {
			numInvalidAPIs = numInvalidAPIs + ' platform-specific APIs are';
		}
		if (numInvalidAPIInstances === 1) {
			numInvalidAPIInstances = '1 time';
		} else {
			numInvalidAPIInstances = numInvalidAPIInstances + ' times';
		}
	}

	renderData = {
		pluginDisplayName: this.displayName,
		numAPIs: numInvalidAPIs,
		numInstances: numInvalidAPIInstances,
		invalidAPIs: invalidAPIs
	};
}

// ******** Plugin API Methods ********

/**
 * Creates an instance of the Titanium Platform Validator plugin
 *
 * @classdesc Captures and keeps track of Titanium APIs that are used.
 *
 * @constructor
 * @name module:plugins/TiAPIPlatformValidator
 */
module.exports = function (options, dependencies) {

	var i, len,
		platform;
	for (i = 0, len = dependencies.length; i < len; i++) {
		if (dependencies[i].name === 'ti-api-provider') {
			platform = dependencies[i].platform;
		}
	}

	results = {
		summary: '',
		invalidAPIs: {}
	};

	Runtime.on('tiPropertyReferenced', function(e) {
		var platformList = e.data.node.userAgents,
			i = 0,
			len = platformList.length,
			isSupported = false,
			name = e.data.name;

		for(; i < len; i++) {
			if (platform === platformList[i].platform) {
				isSupported = true;
			}
		}
		if (!isSupported) {
			Runtime.reportWarning('invalidPlatformReferenced', 'Property "' + name +
				'" is not supported on ' + platform, {
					property: name,
					platform: platform
				});

			if (results.invalidAPIs[name]) {
				results.invalidAPIs[name] += 1;
			} else {
				results.invalidAPIs[name] = 1;
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
 * @name module:plugins/TiAPIPlatformValidator#init
 */
module.exports.prototype.init = function init() {};

/**
* Gets the results of the plugin
*
* @method
 * @name module:plugins/TiAPIPlatformValidator#getResults
* @returns {Object} A dictionary of the Titanium APIs that were used along with a count of how many times they were used.
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
		template: path.join(__dirname, '..', 'templates', 'tiApiPlatformValidatorTemplate.html'),
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

	if (renderData.invalidAPIs) {
		resultsToLog = renderData.numAPIs + ' used ' + renderData.numInstances + '\n\nInvalid Platform-Specific API References\n';
		resultsToLog += arrayGen(['API', 'Num References'], renderData.invalidAPIs.list, ['api', 'numReferences']);
	} else {
		resultsToLog = 'No platform specific APIs are used incorrectly in the project';
	}

	return resultsToLog;
};
