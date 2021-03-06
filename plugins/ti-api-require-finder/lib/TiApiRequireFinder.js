/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * This plugin finds all of the files that were included via <code>require()</code>
 *
 * @module plugins/TiApiRequireFinder
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
		skipped = results.skipped.length,
		summary = [];
	if (resolved) {
		summary.push(pluralize('%s module', '%s modules', resolved) + ' resolved');
	}
	if (unresolved) {
		summary.push(pluralize('%s module', '%s modules', unresolved) + ' not resolved');
	}
	if (missing) {
		summary.push(pluralize('%s module', '%s modules', missing) + ' missing');
	}
	if (skipped) {
		summary.push(pluralize('%s module', '%s modules', skipped) + ' skipped');
	}
	if (summary.length) {
		if (summary.length > 1) {
			summary[summary.length - 1] = 'and ' + summary[summary.length - 1];
		}
		results.summary = summary.join(', ');
	} else {
		results.summary = 'No modules required';
	}
}

/**
 * Generates the render data for this plugin. This is typically an abstracted version of the raw results, carefully
 * modified to match the requirements of the render templates
 *
 * @private
 */
function generateRenderData() {
	var numRequiresResolved = results.resolved.length,
		numRequiresUnresolved = results.unresolved.length,
		numRequiresMissing = results.missing.length,
		numRequiresSkipped = results.skipped.length,
		resolved,
		unresolved,
		missing,
		skipped,
		baseDirectory = Runtime.sourceInformation.projectDir + path.sep,
		list;

	function locationComparator(a, b) {
		var fileCompare = a.filename.toUpperCase().localeCompare(b.filename.toUpperCase());
		return fileCompare === 0 ? a.line - b.line : fileCompare;
	}

	if (numRequiresResolved) {
		resolved = {
			list: []
		};
		list = resolved.list;
		results.resolved.forEach(function (module) {
			var mappedLocation = Runtime.mapLocation(module);
			list.push({
				name: module.data.name,
				path: module.data.path.replace(baseDirectory, ''),
				filename: mappedLocation.filename.replace(baseDirectory, ''),
				line: mappedLocation.line
			});
		});
		list.sort(locationComparator);
	}

	if (numRequiresUnresolved) {
		unresolved = {
			list: []
		};
		list = unresolved.list;
		results.unresolved.forEach(function (module) {
			var mappedLocation = Runtime.mapLocation(module);
			list.push({
				filename: mappedLocation.filename.replace(baseDirectory, ''),
				line: mappedLocation.line
			});
		});
		list.sort(locationComparator);
	}

	if (numRequiresMissing) {
		missing = {
			list: []
		};
		list = missing.list;
		results.missing.forEach(function (module) {
			var mappedLocation = Runtime.mapLocation(module);
			list.push({
				name: module.data.name,
				filename: mappedLocation.filename.replace(baseDirectory, ''),
				line: mappedLocation.line
			});
		});
		list.sort(locationComparator);
	}

	if (numRequiresSkipped) {
		skipped = {
			list: []
		};
		list = skipped.list;
		results.skipped.forEach(function (module) {
			var mappedLocation = Runtime.mapLocation(module);
			list.push({
				name: module.data.name,
				filename: mappedLocation.filename.replace(baseDirectory, ''),
				line: mappedLocation.line
			});
		});
		list.sort(locationComparator);
	}

	renderData = {
		pluginDisplayName: exports.displayName,
		numRequiresResolved: pluralize('%s module', '%s modules', numRequiresResolved),
		numRequiresUnresolved: pluralize('%s module', '%s modules', numRequiresUnresolved),
		numRequiresMissing: pluralize('%s module', '%s modules', numRequiresMissing),
		numRequiresSkipped: pluralize('%s native module', '%s native modules', numRequiresSkipped),
		resolved: resolved,
		unresolved: unresolved,
		missing: missing,
		skipped: skipped
	};
}

/**
 * Initializes the plugin
 *
 * @method module:plugins/TiApiRequireFinder.init
 * @param {Object} options The plugin options
 * @param {Array.<Object>} dependencies The dependant plugins of this plugin
 */
exports.init = function init() {
	results = {
		resolved: [],
		unresolved: [],
		missing: [],
		skipped: []
	};
	Runtime.on('requireUnresolved', function(e) {
		results.unresolved.push(e);
	});
	Runtime.on('requireResolved', function(e) {
		results.resolved.push(e);
	});
	Runtime.on('requireMissing', function(e) {
		results.missing.push(e);
	});
	Runtime.on('requireSkipped', function(e) {
		results.skipped.push(e);
	});
	Runtime.on('projectProcessingEnd', function () {
		generateResultsData();
		generateRenderData();
	});
};

/**
 * @typedef {Object} module:plugins/TiApiRequireFinder.resolvedResult
 * @extends module:Runtime.eventObject
 * @property {string} name The name (after conversion to a string) passed to the include call
 * @property {string} path The full path to the file that was included
 */
/**
 * @typedef {Object} module:plugins/TiApiRequireFinder.unresolvedResult
 * @extends module:Runtime.eventObject
 */
/**
 * @typedef {Object} module:plugins/TiApiRequireFinder.missingResult
 * @extends module:Runtime.eventObject
 * @property {string} name The name (after conversion to a string) passed to the include call
 */
/**
 * @typedef {Object} module:plugins/TiApiRequireFinder.skippedResult
 * @extends module:Runtime.eventObject
 * @property {string} name The name (after conversion to a string) passed to the include call
 */
/**
 * @typedef {Object} module:plugins/TiApiRequireFinder.results
 * @property {string} summary A short summary of the results
 * @property {Array.<module:plugins/TiApiRequireFinder.resolvedResult>} resolved A list of the
 *		<code>require()</code> calls that were resolved
 * @property {Array.<module:plugins/TiApiRequireFinder.unresolvedResult>} unresolved A list of the
 *		<code>require()</code> calls without a name that can be resolved
 * @property {Array.<module:plugins/TiApiRequireFinder.missingResult>} missing A list of the
 *		<code>require()</code> calls that were resolved, but could not be found
 * @property {Array.<module:plugins/TiApiRequireFinder.skippedResult>} skipped A list of the
 *		<code>require()</code> calls that were skipped because they are native modules
 */
/**
* Gets the results of the plugin
*
* @method module:plugins/TiApiRequireFinder.getResults
* @return {module:plugins/TiApiRequireFinder.results} The results
*/
exports.getResults = function getResults() {
	return results;
};

/**
 * Generates the results template data to be rendered
 *
 * @method module:plugins/TiApiRequireFinder.getResultsPageData
 * @param {string} entryFile The path to the entrypoint file for this plugin. The template returned MUST have this value
 *		as one of the entries in the template
 * @return {module:CodeProcessor.pluginResultsPageData} The information for generating the template(s)
 */
exports.getResultsPageData = function getResultsPageData(entryFile) {
	var template = {};

	template[entryFile] = {
		template: path.join(__dirname, '..', 'templates', 'tiApiRequireFinderTemplate.html'),
		data: renderData
	};

	return template;
};

/**
 * Renders the results data to a log-friendly string
 *
 * @method module:plugins/TiApiRequireFinder.renderLogOutput
 * @param {module:CodeProcessor.arrayGen} arrayGen Log-friendly table generator
 * @return {string} The rendered data
 */
exports.renderLogOutput = function (arrayGen) {
	var resultsToLog = renderData.numRequiresResolved + ' resolved\n' +
		renderData.numRequiresUnresolved + ' unresolved\n' +
		renderData.numRequiresMissing + ' missing\n' +
		renderData.numRequiresSkipped + ' skipped';

	if (renderData.resolved) {
		resultsToLog += '\n\nResolved Modules\n';
		resultsToLog += arrayGen(['File', 'Line', 'Name', 'Resolved Path'], renderData.resolved.list, ['filename', 'line', 'name', 'path']);
	}
	if (renderData.unresolved) {
		resultsToLog += '\n\nUnresolved Modules\n';
		resultsToLog += arrayGen(['File', 'Line'], renderData.unresolved.list, ['filename', 'line']);
	}
	if (renderData.missing) {
		resultsToLog += '\n\nMissing Modules\n';
		resultsToLog += arrayGen(['File', 'Line', 'Name'], renderData.missing.list, ['filename', 'line', 'name']);
	}
	if (renderData.skipped) {
		resultsToLog += '\n\nSkipped Native Modules\n';
		resultsToLog += arrayGen(['File', 'Line', 'Name'], renderData.skipped.list, ['filename', 'line', 'name']);
	}

	return resultsToLog;
};
