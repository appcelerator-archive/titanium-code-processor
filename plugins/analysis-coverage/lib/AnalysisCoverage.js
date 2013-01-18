/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * @module plugins/AnalysisCoverage
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */


var path = require('path'),
	fs = require('fs'),
	existsSync = fs.existsSync || path.existsSync,

	wrench = require('wrench'),

	Runtime = require(path.join(global.nodeCodeProcessorLibDir, 'Runtime')),
	AST = require(path.join(global.nodeCodeProcessorLibDir, 'AST')),
	results = {
		details: {},
		filesSkipped: [],
		numTotalFiles: 0,
		numFilesSkipped: 0,
		numNodesVisited: 0,
		numNodesSkipped: 0,
		numTotalNodes: 0
	},
	jsRegex = /\.js$/;

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
	Runtime.on('projectProcessingEnd', function() {
		var astSet = Runtime.getASTSet(),
			id,
			result,
			inputDir = path.dirname(Runtime.getEntryPointFile()),
			inputSource,
			outputDir = path.resolve(path.join(inputDir, '..', 'analysis', 'analysis-coverage')),
			outputFilePath,
			annotationData;

		function nodeVisitedCallback (node) {
			if (node._visited) {
				result.numNodesVisited++;
				results.numNodesVisited++;
			} else if (node._skipped) {
				result.numNodesSkipped++;
				results.numNodesSkipped++;
			}
			result.numTotalNodes++;
			results.numTotalNodes++;
		}

		// Analyze the files
		results.filesSkipped = Runtime.getUnprocessedFilesList();
		results.numTotalFiles = results.filesSkipped + Runtime.getProcessedFilesList();
		results.numFilesSkipped = results.filesSkipped.length;

		// Analyze the ASTs
		for (id in astSet) {
			result = results.details[id] = {
				numNodesVisited: 0,
				numNodesSkipped: 0,
				numTotalNodes: 0
			};
			AST.walk(astSet[id], [
				{
					callback: nodeVisitedCallback
				}
			]);
		}

		if (existsSync(outputDir)) {
			wrench.rmdirSyncRecursive(outputDir);
		}
		for (id in astSet) {
			if (existsSync(id)) {
				outputFilePath = path.join(outputDir, path.relative(inputDir, id));
				if (!existsSync(path.dirname(outputFilePath))) {
					wrench.mkdirSyncRecursive(path.dirname(outputFilePath));
				}
				annotationData = AST.generateAnnotations(astSet[id], [{
						property: '_visited',
						value: true,
						backgroundColor: [0.5, 1, 0.5],
						local: true
					},{
						property: '_skipped',
						value: true,
						backgroundColor: [0.5, 0.5, 1],
						local: true
					}
				]);
				fs.writeFileSync(outputFilePath + '.js', inputSource = fs.readFileSync(id).toString());
				fs.writeFileSync(outputFilePath + '.json', JSON.stringify(annotationData, false, '\t'));
				fs.writeFileSync(outputFilePath + '.html',
					AST.generateAnnotatedHTML(inputSource, annotationData,
						'/*\nLegend:\nVisited Node\nSkipped Node\nUnvisited Node\n*/\n', [{
							start: 0,
							bold: false,
							italic: false,
							fontColor: [0, 0, 0],
							backgroundColor: [1, 1, 1]
						}, {
							start: 11,
							bold: false,
							italic: false,
							fontColor: [0, 0, 0],
							backgroundColor: [0.75, 1, 0.75]
						}, {
							start: 24,
							bold: false,
							italic: false,
							fontColor: [0, 0, 0],
							backgroundColor: [0.75, 0.75, 1]
						}, {
							start: 37,
							bold: false,
							italic: false,
							fontColor: [0, 0, 0],
							backgroundColor: [1, 1, 1]
						}]
					));
			}
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