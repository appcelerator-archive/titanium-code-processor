/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * @module plugins/RequireFinder
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

 
var path = require('path'),
	Runtime = require(path.join(global.nodeCodeProcessorLibDir, 'Runtime')),
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
	return results;
};