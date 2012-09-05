/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @module plugins/RequireFinder
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

 
var results = {
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
 * @param {Object} libs A dictionary containing useful libs from {@link module:CodeProcessor} so they don't have to be
 *		required()'d individually using brittle hard-coded paths.
 */
module.exports = function (libs) {
	libs.Messaging.on("requireUnresolved", function(e) {
		results.unresolved.push(e.name);
	});
	libs.Messaging.on("requireResolved", function(e) {
		results.resolved.push(e.name);
	});
	libs.Messaging.on("requireMissing", function(e) {
		results.missing.push(e.name);
	});
};

/**
* Gets the results of the plugin
* 
* @method
* @returns {Object} A dictionary with two array properties: <code>resolved</code> and <code>unresolved</code>. The
*		<code>resolved</code> array contains a list of resolved absolute paths to files that were required. The
*		<code>unresolved</code> array contains a list of unresolved paths, as passed in to the <code>require()</code>
*		method.
*/
module.exports.prototype.getResults = function getResults() {
	return results;
};