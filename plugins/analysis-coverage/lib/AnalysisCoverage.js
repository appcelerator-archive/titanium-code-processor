/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @module plugins/AnalysisCoverage
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

 
var path = require('path'),
	Runtime = require(path.join(global.nodeCodeProcessorLibDir, 'Runtime')),
	AST = require(path.join(global.nodeCodeProcessorLibDir, 'AST')),
	results = {
		details: {},
		numNodesVisited: 0, 
		numTotalNodes: 0
	};

// ******** Plugin API Methods ********

/**
 * Creates an instance of the require provider plugin
 * 
 * @classdesc Provides a CommonJS compliant require() implementation, based on Titanium Mobile's implementations
 * 
 * @constructor
 * @name module:plugins/AnalysisCoverage
 */
module.exports = function () {
	Runtime.on('processingComplete', function() {
		var astSet = Runtime.getASTSet(),
			id,
			unnamedRegex = /^@unnamed_ast_/,
			result;
		for (id in astSet) {
			result = results.details[id] = {
				numNodesVisited: 0,
				numTotalNodes: 0
			}
			AST.walk(astSet[id], { 
				'*': function(node, next) {
					if (node._visited) {
						result.numNodesVisited++;
						results.numNodesVisited++;
					}
					result.numNodesVisited++;
					results.numTotalNodes++;
					next();
				}
			});
		}
	});
};

/**
 * Initializes the plugin
 * 
 * @method
 * @name module:plugins/AnalysisCoverage#init
 */
module.exports.prototype.init = function init() {};

/**
* Gets the results of the plugin
* 
* @method
 * @name module:plugins/AnalysisCoverage#getResults
* @returns {Object} A dictionary with two array properties: <code>resolved</code> and <code>unresolved</code>. The
*		<code>resolved</code> array contains a list of resolved absolute paths to files that were required. The
*		<code>unresolved</code> array contains a list of unresolved paths, as passed in to the <code>require()</code>
*		method.
*/
module.exports.prototype.getResults = function getResults() {
	return results;
};