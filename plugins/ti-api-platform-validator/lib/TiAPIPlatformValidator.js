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

	results = {
		summary: '',
		invalidAPIs: {}
	},

	platformList = ['android', 'mobileweb', 'iphone', 'ios', 'ipad'];

// ******** Plugin API Methods ********

/**
 * Creates an instance of the Titanium Platform Validator plugin
 *
 * @classdesc Captures and keeps track of Titanium APIs that are used.
 *
 * @constructor
 * @name module:plugins/TiAPIPlatformValidator
 */
module.exports = function (options) {

	var platform = options && options.platform;

	if (!platform) {
		console.error('ti-api-platform-validator plugin requires the "platform" option');
		process.exit(1);
	}
	if (platformList.indexOf(platform) === -1) {
		console.error('"' + platform + '" is not a valid platform for the ti-api-platform-validator plugin');
		process.exit(1);
	}

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
	var summary,
		numInvalidAPIs = Object.keys(results.invalidAPIs).length;
	if (numInvalidAPIs) {
		summary = (numInvalidAPIs === 1 ? '1 platform API is' : numInvalidAPIs + ' platform APIs are') + ' used incorrectly';
	} else {
		summary = 'No platform specific APIs are used incorrectly';
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
module.exports.prototype.getResultsPageData = function getResultsPageData(entryFile) {
	var invalidAPIs,
		numInvalidAPIs = Object.keys(results.invalidAPIs).length,
		numInvalidAPIInstances = 0,
		invalidAPI,
		template = {};

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
			numInvalidAPIs = '1 deprecated API is';
		} else {
			numInvalidAPIs = numInvalidAPIs + ' deprecated APIs are';
		}
		if (numInvalidAPIInstances === 1) {
			numInvalidAPIInstances = '1 time';
		} else {
			numInvalidAPIInstances = numInvalidAPIInstances + ' times';
		}
	}

	template[entryFile] = {
		template: path.join(__dirname, '..', 'templates', 'tiApiPlatformValidatorTemplate.html'),
		data: {
			numAPIs: numInvalidAPIs,
			numInstances: numInvalidAPIInstances,
			invalidAPIs: invalidAPIs
		}
	};

	return template;
};
module.exports.prototype.displayName = 'Platform Validation';