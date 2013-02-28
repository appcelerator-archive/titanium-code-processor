/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * @module plugins/TiIncludeFinder
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */


var path = require('path'),
	Runtime = require(path.join(global.titaniumCodeProcessorLibDir, 'Runtime')),
	results = {
		resolved: [],
		unresolved: [],
		missing: []
	};

// ******** Plugin API Methods ********

/**
 * Creates an instance of the require provider plugin
 *
 * @classdesc Provides a CommonJS compliant require() implementation, based on Titanium Mobile's implementations
 *
 * @constructor
 * @name module:plugins/TiIncludeFinder
 */
module.exports = function () {
	Runtime.on('tiIncludeResolved', function(e) {
		results.resolved.push(e);
	});
	Runtime.on('tiIncludeUnresolved', function(e) {
		results.unresolved.push(e);
	});
	Runtime.on('tiIncludeMissing', function(e) {
		results.missing.push(e);
	});
};

/**
 * Initializes the plugin
 *
 * @method
 * @name module:plugins/TiIncludeFinder#init
 */
module.exports.prototype.init = function init() {};

/**
* Gets the results of the plugin
*
* @method
 * @name module:plugins/TiIncludeFinder#getResults
* @returns {Object} A dictionary with two array properties: <code>resolved</code> and <code>unresolved</code>. The
*		<code>resolved</code> array contains a list of resolved absolute paths to files that were required. The
*		<code>unresolved</code> array contains a list of unresolved paths, as passed in to the <code>require()</code>
*		method.
*/
module.exports.prototype.getResults = function getResults() {
	var resolved = results.resolved.length,
		unresolved = results.unresolved.length,
		missing = results.missing.length,
		summary = [];
	if (resolved) {
		summary.push(resolved + ' file' + (resolved === 1 ? '' : 's') + ' resolved');
	}
	if (unresolved) {
		summary.push(unresolved + ' file' + (unresolved === 1 ? '' : 's') + ' not resolved');
	}
	if (missing) {
		summary.push(missing + ' file' + (missing === 1 ? '' : 's') + ' missing');
	}
	if (summary.length) {
		if (summary.length > 1) {
			summary[summary.length - 1] = 'and ' + summary[summary.length - 1];
		}
		results.summary = summary.join(', ');
	} else {
		results.summary = 'No files included';
	}return results;
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

	var numIncludesResolved = results.resolved.length,
		numIncludesUnresolved = results.unresolved.length,
		numIncludesMissing = results.missing.length,
		resolved,
		unresolved,
		missing,
		template = {};

	if (numIncludesResolved) {
		resolved = {
			list: []
		};
		results.resolved.forEach(function (file) {
			resolved.list.push({
				name: file.data.name,
				path: file.data.path.replace(baseDirectory, ''),
				filename: file.filename.replace(baseDirectory, ''),
				line: file.line
			});
		});
	}

	if (numIncludesUnresolved) {
		unresolved = {
			list: []
		};
		results.unresolved.forEach(function (file) {
			unresolved.list.push({
				filename: file.filename.replace(baseDirectory, ''),
				line: file.line
			});
		});
	}

	if (numIncludesMissing) {
		missing = {
			list: []
		};
		results.missing.forEach(function (file) {
			missing.list.push({
				name: file.data.name,
				filename: file.filename.replace(baseDirectory, ''),
				line: file.line
			});
		});
	}

	template[entryFile] = {
		template: path.join(__dirname, '..', 'templates', 'tiApiIncludeFinderTemplate.html'),
		data: {
			numIncludesResolved: numIncludesResolved === 1 ? '1 file' : numIncludesResolved + ' files',
			numIncludesUnresolved: numIncludesUnresolved === 1 ? '1 file' : numIncludesUnresolved + ' files',
			numIncludesMissing: numIncludesMissing === 1 ? '1 file' : numIncludesMissing + ' files',
			resolved: resolved,
			unresolved: unresolved,
			missing: missing
		}
	};

	return template;
};
module.exports.prototype.displayName = 'Ti.includes';