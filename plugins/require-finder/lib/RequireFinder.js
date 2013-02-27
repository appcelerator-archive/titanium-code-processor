/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * @module plugins/RequireFinder
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */


var path = require('path'),
	Runtime = require(path.join(global.titaniumCodeProcessorLibDir, 'Runtime')),
	results = {
		resolved: [],
		unresolved: [],
		missing: [],
		skipped: []
	};

// ******** Plugin API Methods ********

/**
 * Creates an instance of the require provider plugin
 *
 * @classdesc Provides a CommonJS compliant require() implementation, based on Titanium Mobile's implementations
 *
 * @constructor
 * @name module:plugins/RequireFinder
 */
module.exports = function () {
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
};

/**
 * Initializes the plugin
 *
 * @method
 * @name module:plugins/RequireFinder#init
 */
module.exports.prototype.init = function init() {};

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
module.exports.prototype.getResults = function getResults() {
	var resolved = results.resolved.length,
		unresolved = results.unresolved.length,
		missing = results.missing.length,
		skipped = results.skipped.length,
		summary = [];
	if (resolved) {
		summary.push(resolved + ' module' + (resolved === 1 ? '' : 's') + ' resolved');
	}
	if (unresolved) {
		summary.push(unresolved + ' module' + (unresolved === 1 ? '' : 's') + ' not resolved');
	}
	if (missing) {
		summary.push(missing + ' module' + (missing === 1 ? '' : 's') + ' missing');
	}
	if (skipped) {
		summary.push(skipped + ' native module' + (skipped === 1 ? '' : 's') + ' skipped');
	}
	if (summary.length) {
		if (summary.length > 1) {
			summary[summary.length - 1] = 'and ' + summary[summary.length - 1];
		}
		results.summary = summary.join(', ');
	} else {
		results.summary = 'No modules required';
	}
	return results;
};

/**
 * Generates the results HTML page
 *
 * @method
 * @param {String} path The path to the file to write
 * @param {String} headerIndex The index of this header item, to be passed into render
 * @return {String} the HTML content summarizing the results
 */
module.exports.prototype.getResultsPageData = function getResultsPageData(baseDirectory) {

	var numRequiresResolved = results.resolved.length,
		numRequiresUnresolved = results.unresolved.length,
		numRequiresMissing = results.missing.length,
		numRequiresSkipped = results.skipped.length,
		resolved,
		unresolved,
		missing,
		skipped;

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

	return {
		template: path.join(__dirname, '..', 'templates', 'requireFinderTemplate.html'),
		data: {
			numRequiresResolved: numRequiresResolved === 1 ? '1 module' : numRequiresResolved + ' modules',
			numRequiresUnresolved: numRequiresUnresolved === 1 ? '1 module' : numRequiresUnresolved + ' modules',
			numRequiresMissing: numRequiresMissing === 1 ? '1 module' : numRequiresMissing + ' modules',
			numRequiresSkipped: numRequiresSkipped + ' native module' + (numRequiresSkipped === 1 ? '' : 's'),
			resolved: resolved,
			unresolved: unresolved,
			missing: missing,
			skipped: skipped
		}
	};
};
module.exports.prototype.displayName = 'Require Finder';