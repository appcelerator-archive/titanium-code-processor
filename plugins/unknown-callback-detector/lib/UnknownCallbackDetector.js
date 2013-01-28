/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * @module plugins/UnknownCallbackDetector
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var path = require('path'),
	Runtime = require(path.join(global.titaniumCodeProcessorLibDir, 'Runtime')),
	results = [];

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
		results.push(e);
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
	return results;
};