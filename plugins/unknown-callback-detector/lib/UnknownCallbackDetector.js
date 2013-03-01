/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * @module plugins/UnknownCallbackDetector
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var path = require('path'),
	Runtime = require(path.join(global.titaniumCodeProcessorLibDir, 'Runtime')),
	results = {
		unknownCallbacks: []
	};

// ******** Plugin API Methods ********

/**
 * Creates an instance of the require provider plugin
 *
 * @classdesc Provides a CommonJS compliant require() implementation, based on Titanium Mobile's implementations
 *
 * @constructor
 * @name module:plugins/UnknownCallbackDetector
 */
module.exports = function () {
	Runtime.on('unknownCallback', function(e) {
		results.unknownCallbacks.push(e);
	});
};

/**
 * Initializes the plugin
 *
 * @method
 * @name module:plugins/UnknownCallbackDetector#init
 */
module.exports.prototype.init = function init() {};

/**
* Gets the results of the plugin
*
* @method
 * @name module:plugins/UnknownCallbackDetector#getResults
* @returns {Array[Object]} An array of locations
*/
module.exports.prototype.getResults = function getResults() {
	var summary,
		numUnknownCallbacks = results.unknownCallbacks.length;
	if (numUnknownCallbacks) {
		summary = (numUnknownCallbacks === 1 ? '1 unknown callback was' : numUnknownCallbacks + ' unknown callbacks were') + ' detected';
	} else {
		summary = 'No unknown callbacks were detected';
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
	var numUnknownCallbacks = results.unknownCallbacks.length,
		unknownCallbacks,
		i, len,
		template = {};

	if (numUnknownCallbacks) {
		unknownCallbacks = {
			summary: (numUnknownCallbacks === 1 ? '1 unknown callback was' : numUnknownCallbacks + ' unknown callbacks were') + ' detected',
			list: []
		};
		for (i = 0, len = results.unknownCallbacks.length; i < len; i++) {
			unknownCallbacks.list.push({
				filename: results.unknownCallbacks[i].filename.replace(baseDirectory, ''),
				line: results.unknownCallbacks[i].line
			});
		}
	}

	template[entryFile] = {
		template: path.join(__dirname, '..', 'templates', 'tiApiUnknownCallbackDetectorTemplate.html'),
		data: {
			unknownCallbacks: unknownCallbacks
		}
	};

	return template;
};
module.exports.prototype.displayName = 'Unknown Callbacks';