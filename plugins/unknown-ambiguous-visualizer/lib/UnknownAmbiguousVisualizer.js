/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * @module plugins/AnalysisCoverageVisualizer
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */


var path = require('path'),
	fs = require('fs'),
	existsSync = fs.existsSync || path.existsSync,

	wrench = require('wrench'),

	AST = require(path.join(global.nodeCodeProcessorLibDir, 'AST')),
	Runtime = require(path.join(global.nodeCodeProcessorLibDir, 'Runtime')),
	results = {
		details: {},
		numAbiguousBlockNodes: 0,
		numAbiguousContextNodes: 0,
		numUnknownNodes: 0,
		numTotalNodes: 0
	};

// ******** Plugin API Methods ********

/**
 * Creates an instance of the require provider plugin
 *
 * @classdesc Provides a CommonJS compliant require() implementation, based on Titanium Mobile's implementations
 *
 * @constructor
 * @name module:plugins/AnalysisCoverageVisualizer
 */
module.exports = function () {
	Runtime.on('projectProcessingEnd', function() {
		var astSet = Runtime.getASTSet(),
			id,
			inputDir = path.dirname(Runtime.getEntryPointFile()),
			inputSource,
			outputDir = path.resolve(path.join(inputDir, '..', 'analysis', 'unknown-ambiguous-visualizer')),
			outputFilePath,
			annotationData;

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
						property: '_unknown',
						value: true,
						italic: true,
						bold: true,
						fontColor: [0, 1, 0]
					},{
						property: '_ambiguousBlock',
						value: true,
						backgroundColor: [1, 0.5, 0.5]
					},{
						property: '_ambiguousContext',
						value: true,
						backgroundColor: [0.5, 0.5, 1]
					}
				]);
				fs.writeFileSync(outputFilePath + '.js', inputSource = fs.readFileSync(id).toString());
				fs.writeFileSync(outputFilePath + '.json', JSON.stringify(annotationData, false, '\t'));
				fs.writeFileSync(outputFilePath + '.html',
					AST.generateAnnotatedHTML(inputSource, annotationData,
						'/*\nLegend:\nUnknown Value Generated\nAmbiguous Context\nAmbiguous Block\nAmbiguous Block and Context\n*/\n', [{
							start: 0,
							bold: false,
							italic: false,
							fontColor: [0, 0, 0],
							backgroundColor: [1, 1, 1]
						}, {
							start: 11,
							bold: true,
							italic: true,
							fontColor: [0, 0.75, 0],
							backgroundColor: [1, 1, 1]
						}, {
							start: 35,
							bold: false,
							italic: false,
							fontColor: [0, 0, 0],
							backgroundColor: [0.75, 0.75, 1]
						}, {
							start: 52,
							bold: false,
							italic: false,
							fontColor: [0, 0, 0],
							backgroundColor: [1, 0.75, 0.75]
						}, {
							start: 68,
							bold: false,
							italic: false,
							fontColor: [0, 0, 0],
							backgroundColor: [0.75, 0.625, 0.875]
						}, {
							start: 97,
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
 * @name module:plugins/AnalysisCoverageVisualizer#init
 */
module.exports.prototype.init = function init() {};

/**
* Gets the results of the plugin
*
* @method
 * @name module:plugins/AnalysisCoverageVisualizer#getResults
* @returns {Object} A dictionary with two array properties: <code>resolved</code> and <code>unresolved</code>. The
*		<code>resolved</code> array contains a list of resolved absolute paths to files that were required. The
*		<code>unresolved</code> array contains a list of unresolved paths, as passed in to the <code>require()</code>
*		method.
*/
module.exports.prototype.getResults = function getResults() {
	return results;
};