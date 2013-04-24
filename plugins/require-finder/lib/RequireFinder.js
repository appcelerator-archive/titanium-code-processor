/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * @module plugins/RequireFinder
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */


var path = require('path'),
	Runtime = require(path.join(global.titaniumCodeProcessorLibDir, 'Runtime')),
	CodeProcessorUtils = require(path.join(global.titaniumCodeProcessorLibDir, 'CodeProcessorUtils')),

	pluralize = CodeProcessorUtils.pluralize,

	results,
	renderData;

// ******** Helper Methods ********

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

function generateRenderData() {
	var numRequiresResolved = results.resolved.length,
		numRequiresUnresolved = results.unresolved.length,
		numRequiresMissing = results.missing.length,
		numRequiresSkipped = results.skipped.length,
		resolved,
		unresolved,
		missing,
		skipped,
		baseDirectory = path.dirname(Runtime.getEntryPointFile()) + path.sep;

	if (numRequiresResolved) {
		resolved = {
			list: []
		};
		results.resolved.forEach(function (module) {
			resolved.list.push({
				name: module.data.name,
				path: module.data.path.replace(baseDirectory, ''),
				filename: module.filename.replace(baseDirectory, ''),
				line: module.line
			});
		});
	}

	if (numRequiresUnresolved) {
		unresolved = {
			list: []
		};
		results.unresolved.forEach(function (module) {
			unresolved.list.push({
				filename: module.filename.replace(baseDirectory, ''),
				line: module.line
			});
		});
	}

	if (numRequiresMissing) {
		missing = {
			list: []
		};
		results.missing.forEach(function (module) {
			missing.list.push({
				name: module.data.name,
				filename: module.filename.replace(baseDirectory, ''),
				line: module.line
			});
		});
	}

	if (numRequiresSkipped) {
		skipped = {
			list: []
		};
		results.skipped.forEach(function (module) {
			skipped.list.push({
				name: module.data.name,
				filename: module.filename.replace(baseDirectory, ''),
				line: module.line
			});
		});
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
 * @method
 * @name module:plugins/RequireFinder#init
 * @param {Object} options The plugin options
 * @param {Array[Dependency Instance]} dependencies The dependant plugins of this plugin
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
* Gets the results of the plugin
*
* @method
 * @name module:plugins/RequireFinder#getResults
* @returns {Object} A dictionary with two array properties: <code>resolved</code> and <code>unresolved</code>. The
*		<code>resolved</code> array contains a list of resolved absolute paths to files that were required. The
*		<code>unresolved</code> array contains a list of unresolved paths, as passed in to the <code>require()</code>
*		method.
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
 * @return {Object} The information for generating the template(s). Each template is defined as a key-value pair in the
 *		object, with the key being the name of the file, without a path. Two keys are expected: template is the path to
 *		the mustache template (note the name of the file must be unique, irrespective of path) and data is the
 *		information to dump into the template
 */
exports.getResultsPageData = function getResultsPageData(entryFile) {
	var template = {};

	template[entryFile] = {
		template: path.join(__dirname, '..', 'templates', 'requireFinderTemplate.html'),
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
