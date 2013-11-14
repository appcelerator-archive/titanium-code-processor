/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * This plugin finds all files that were included via <code>Ti.include()</code>
 *
 * @module plugins/TiApiIncludeFinder
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
	var resolved = results.resolved.length,
		unresolved = results.unresolved.length,
		missing = results.missing.length,
		summary = [];
	if (resolved) {
		summary.push(pluralize('%s file', '%s files', resolved) + ' resolved');
	}
	if (unresolved) {
		summary.push(pluralize('%s file', '%s files', unresolved) + ' not resolved');
	}
	if (missing) {
		summary.push(pluralize('%s file', '%s files', missing) + ' missing');
	}
	if (summary.length) {
		if (summary.length > 1) {
			summary[summary.length - 1] = 'and ' + summary[summary.length - 1];
		}
		results.summary = summary.join(', ');
	} else {
		results.summary = 'No files included';
	}
}

/**
 * Generates the render data for this plugin. This is typically an abstracted version of the raw results, carefully
 * modified to match the requirements of the render templates
 *
 * @private
 */
function generateRenderData() {
	var numIncludesResolved = results.resolved.length,
		numIncludesUnresolved = results.unresolved.length,
		numIncludesMissing = results.missing.length,
		resolved,
		unresolved,
		missing,
		baseDirectory = Runtime.sourceInformation.projectDir + path.sep,
		list;

	function locationComparator(a, b) {
		var fileCompare = a.filename.toUpperCase().localeCompare(b.filename.toUpperCase());
		return fileCompare === 0 ? a.line - b.line : fileCompare;
	}

	if (numIncludesResolved) {
		resolved = {
			list: []
		};
		list = resolved.list;
		results.resolved.forEach(function (file) {
			var mappedLocation = Runtime.mapLocation(file);
			list.push({
				name: file.data.name,
				path: file.data.path.replace(baseDirectory, ''),
				filename: mappedLocation.filename.replace(baseDirectory, ''),
				line: mappedLocation.line
			});
		});
		list.sort(locationComparator);
	}

	if (numIncludesUnresolved) {
		unresolved = {
			list: []
		};
		list = unresolved.list;
		results.unresolved.forEach(function (file) {
			var mappedLocation = Runtime.mapLocation(file);
			list.push({
				filename: mappedLocation.filename.replace(baseDirectory, ''),
				line: mappedLocation.line
			});
		});
		list.sort(locationComparator);
	}

	if (numIncludesMissing) {
		missing = {
			list: []
		};
		list = missing.list;
		results.missing.forEach(function (file) {
			var mappedLocation = Runtime.mapLocation(file);
			list.push({
				name: file.data.name,
				filename: mappedLocation.filename.replace(baseDirectory, ''),
				line: mappedLocation.line
			});
		});
		list.sort(locationComparator);
	}

	renderData = {
		pluginDisplayName: exports.displayName,
		numIncludesResolved: pluralize('%s file', '%s files', numIncludesResolved),
		numIncludesUnresolved: pluralize('%s file', '%s files', numIncludesUnresolved),
		numIncludesMissing: pluralize('%s file', '%s files', numIncludesMissing),
		resolved: resolved,
		unresolved: unresolved,
		missing: missing
	};
}

// ******** Plugin API Methods ********

/**
 * Initializes the plugin
 *
 * @method module:plugins/TiApiIncludeFinder.init
 */
exports.init = function init() {
	results = {
		resolved: [],
		unresolved: [],
		missing: []
	};
	Runtime.on('tiIncludeResolved', function(e) {
		results.resolved.push(e);
	});
	Runtime.on('tiIncludeUnresolved', function(e) {
		results.unresolved.push(e);
	});
	Runtime.on('tiIncludeMissing', function(e) {
		results.missing.push(e);
	});
	Runtime.on('projectProcessingEnd', function () {
		generateResultsData();
		generateRenderData();
	});
};

/**
 * @typedef {Object} module:plugins/TiApiIncludeFinder.resolvedResult
 * @extends module:Runtime.eventObject
 * @property {string} name The name (after conversion to a string) passed to the include call
 * @property {string} path The full path to the file that was included
 */
/**
 * @typedef {Object} module:plugins/TiApiIncludeFinder.unresolvedResult
 * @extends module:Runtime.eventObject
 */
/**
 * @typedef {Object} module:plugins/TiApiIncludeFinder.missingResult
 * @extends module:Runtime.eventObject
 * @property {string} name The name (after conversion to a string) passed to the include call
 */
/**
 * @typedef {Object} module:plugins/TiApiIncludeFinder.results
 * @property {string} summary A short summary of the results
 * @property {Array.<module:plugins/TiApiIncludeFinder.resolvedResult>} resolved A list of the
 *		<code>Ti.include()</code> calls that were resolved
 * @property {Array.<module:plugins/TiApiIncludeFinder.unresolvedResult>} unresolved A list of the
 *		<code>Ti.include()</code> calls without a name that can be resolved
 * @property {Array.<module:plugins/TiApiIncludeFinder.missingResult>} missing A list of the
 *		<code>Ti.include()</code> calls that were resolved, but could not be found
 */
/**
* Gets the results of the plugin
*
* @method module:plugins/TiApiIncludeFinder.getResults
* @return {module:plugins/TiApiIncludeFinder.results} The list of resolved and unresolved <code>Ti.include()</code> calls
*/
exports.getResults = function getResults() {
	return results;
};

/**
 * Generates the results template data to be rendered
 *
 * @method module:plugins/TiApiIncludeFinder.getResultsPageData
 * @param {string} entryFile The path to the entrypoint file for this plugin. The template returned MUST have this value
 *		as one of the entries in the template
 * @return {module:CodeProcessor.pluginResultsPageData} The information for generating the template(s)
 */
exports.getResultsPageData = function getResultsPageData(entryFile) {
	var template = {};

	template[entryFile] = {
		template: path.join(__dirname, '..', 'templates', 'tiApiIncludeFinderTemplate.html'),
		data: renderData
	};

	return template;
};

/**
 * Renders the results data to a log-friendly string
 *
 * @method module:plugins/TiApiIncludeFinder.renderLogOutput
 * @param {module:CodeProcessor.arrayGen} arrayGen Log-friendly table generator
 * @return {string} The rendered data
 */
exports.renderLogOutput = function renderLogOutput(arrayGen) {
	var resultsToLog = renderData.numIncludesResolved + ' resolved\n' +
		renderData.numIncludesUnresolved + ' unresolved\n' +
		renderData.numIncludesMissing + ' missing';
	if (renderData.resolved) {
		resultsToLog += '\n\nResolved Files\n';
		resultsToLog += arrayGen(['File', 'Line', 'Name', 'Resolved Path'], renderData.resolved.list, ['filename', 'line', 'name', 'path']);
	}
	if (renderData.unresolved) {
		resultsToLog += '\n\nUnresolved Files\n';
		resultsToLog += arrayGen(['File', 'Line'], renderData.unresolved.list, ['filename', 'line']);
	}
	if (renderData.missing) {
		resultsToLog += '\n\nMissing Files\n';
		resultsToLog += arrayGen(['File', 'Line', 'Name'], renderData.missing.list, ['filename', 'line', 'name']);
	}
	return resultsToLog;
};
