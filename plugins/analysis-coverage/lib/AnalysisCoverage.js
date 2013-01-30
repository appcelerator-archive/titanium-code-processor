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

	Runtime = require(path.join(global.titaniumCodeProcessorLibDir, 'Runtime')),
	AST = require(path.join(global.titaniumCodeProcessorLibDir, 'AST')),
	results = {
		details: {},
		filesSkipped: [],
		numTotalFiles: 0,
		numFilesSkipped: 0,
		numNodesVisited: 0,
		numNodesSkipped: 0,
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
module.exports = function (options) {
	Runtime.on('projectProcessingEnd', function() {
		var astSet = Runtime.getASTSet(),
			id,
			result,
			outputDir,
			inputDir = path.dirname(Runtime.getEntryPointFile()),
			inputSource,
			styles,
			outputFilePath,
			annotationStyle,
			annotationData;

		function nodeVisitedCallback (node) {
			if (node._visited) {
				result.numNodesVisited++;
				results.numNodesVisited++;
			} else if (node._skipped) {
				result.numNodesSkipped++;
				results.numNodesSkipped++;
			} else {
				node._unvisited = true;
			}
			result.numTotalNodes++;
			results.numTotalNodes++;
		}

		// Analyze the files
		results.filesSkipped = Runtime.getUnprocessedFilesList();
		results.numTotalFiles = results.filesSkipped + Runtime.getProcessedFilesList().length;
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

		if (options && options.visualization) {

			// Calculate the output directory
			outputDir = options.visualization.outputDirectory;
			if (outputDir) {
				if (options.visualization.timestampOutputDirectory) {
					outputDir += '.' + (new Date()).toISOString();
				}
				if (existsSync(outputDir)) {
					wrench.rmdirSyncRecursive(outputDir);
				}
			}

			// Calculate the styles
			styles = options.visualization.styles;
			if (styles) {
				annotationStyle = [{
						property: '_visited',
						value: true,
						local: true,
						bold: styles.visited.bold,
						italic: styles.visited.italic,
						fontColor: [
							styles.visited.fontColor.r,
							styles.visited.fontColor.g,
							styles.visited.fontColor.b
							],
						backgroundColor: [
							styles.visited.backgroundColor.r,
							styles.visited.backgroundColor.g,
							styles.visited.backgroundColor.b
						]
					},{
						property: '_skipped',
						value: true,
						local: true,
						bold: styles.skipped.bold,
						italic: styles.skipped.italic,
						fontColor: [
							styles.skipped.fontColor.r,
							styles.skipped.fontColor.g,
							styles.skipped.fontColor.b
							],
						backgroundColor: [
							styles.skipped.backgroundColor.r,
							styles.skipped.backgroundColor.g,
							styles.skipped.backgroundColor.b
						]
					},{
						property: '_unvisited',
						value: true,
						local: true,
						bold: styles.unvisited.bold,
						italic: styles.unvisited.italic,
						fontColor: [
							styles.unvisited.fontColor.r,
							styles.unvisited.fontColor.g,
							styles.unvisited.fontColor.b
							],
						backgroundColor: [
							styles.unvisited.backgroundColor.r,
							styles.unvisited.backgroundColor.g,
							styles.unvisited.backgroundColor.b
						]
					}
				];
			} else {
				annotationStyle = [{
						property: '_visited',
						value: true,
						local: true,
						bold: false,
						italic: false,
						fontColor: [0, 0, 0],
						backgroundColor: [0.5, 1, 0.5]
					},{
						property: '_skipped',
						value: true,
						local: true,
						bold: false,
						italic: false,
						fontColor: [0, 0, 0],
						backgroundColor: [0.5, 0.5, 1]
					},{
						property: '_unvisited',
						value: true,
						local: true,
						bold: false,
						italic: false,
						fontColor: [0, 0, 0],
						backgroundColor: [1, 0.5, 0.5]
					}
				];
			}

			// Annotate the data
			results.annotationData = {};
			for (id in astSet) {
				if (existsSync(id)) {

					// Calculate the annotation data
					results.annotationData[id] = annotationData = AST.generateAnnotations(astSet[id], annotationStyle);

					// Write the results to file, if requested
					if (outputDir) {
						outputFilePath = path.join(outputDir, path.relative(inputDir, id));
						if (!existsSync(path.dirname(outputFilePath))) {
							wrench.mkdirSyncRecursive(path.dirname(outputFilePath));
						}
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
									bold: annotationStyle[0].bold,
									italic: annotationStyle[0].italic,
									fontColor: annotationStyle[0].fontColor,
									backgroundColor: annotationStyle[0].backgroundColor
								}, {
									start: 24,
									bold: annotationStyle[1].bold,
									italic: annotationStyle[1].italic,
									fontColor: annotationStyle[1].fontColor,
									backgroundColor: annotationStyle[1].backgroundColor
								}, {
									start: 37,
									bold: annotationStyle[2].bold,
									italic: annotationStyle[2].italic,
									fontColor: annotationStyle[2].fontColor,
									backgroundColor: annotationStyle[2].backgroundColor
								}, {
									start: 51,
									bold: false,
									italic: false,
									fontColor: [0, 0, 0],
									backgroundColor: [1, 1, 1]
								}]
							));
					}
				}
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