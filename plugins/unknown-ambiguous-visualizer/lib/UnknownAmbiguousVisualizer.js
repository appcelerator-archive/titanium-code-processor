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

	AST = require(path.join(global.titaniumCodeProcessorLibDir, 'AST')),
	Runtime = require(path.join(global.titaniumCodeProcessorLibDir, 'Runtime')),
	results = {
		numAbiguousBlockNodes: 0,
		numAbiguousContextNodes: 0,
		numUnknownNodes: 0,
		numTotalNodes: 0,
		annotationData: {}
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
module.exports = function (options) {
	Runtime.on('projectProcessingEnd', function() {
		var astSet = Runtime.getASTSet(),
			id,
			annotationStyle,
			styles,
			outputDir,
			inputDir = path.dirname(Runtime.getEntryPointFile()),
			inputSource,
			outputFilePath,
			annotationData;

		// Calculate the output directory
		outputDir = options && options.outputDirectory;
		if (outputDir) {
			if (options.timestampOutputDirectory) {
				outputDir += '.' + (new Date()).toISOString();
			}
			if (existsSync(outputDir)) {
				wrench.rmdirSyncRecursive(outputDir);
			}
		}

		function alphaBlend(color1, color2, def) {
			if (color1 && color2) {
				return [
					color1[0] * 0.5 + color2[0] * 0.5,
					color1[1] * 0.5 + color2[1] * 0.5,
					color1[2] * 0.5 + color2[2] * 0.5
				];
			} else {
				return color1 || color2 || def;
			}
		}

		// Calculate the styles
		styles = options && options.styles;
		if (styles) {
			annotationStyle = [{
					property: '_unknown',
					value: true,
					bold: styles.unknown.bold,
					italic: styles.unknown.italic,
					fontColor: [
						styles.unknown.fontColor.r,
						styles.unknown.fontColor.g,
						styles.unknown.fontColor.b
						],
					backgroundColor: [
						styles.unknown.backgroundColor.r,
						styles.unknown.backgroundColor.g,
						styles.unknown.backgroundColor.b
					]
				},{
					property: '_ambiguousBlock',
					value: true,
					bold: styles.ambiguousBlock.bold,
					italic: styles.ambiguousBlock.italic,
					fontColor: [
						styles.ambiguousBlock.fontColor.r,
						styles.ambiguousBlock.fontColor.g,
						styles.ambiguousBlock.fontColor.b
						],
					backgroundColor: [
						styles.ambiguousBlock.backgroundColor.r,
						styles.ambiguousBlock.backgroundColor.g,
						styles.ambiguousBlock.backgroundColor.b
					]
				},{
					property: '_ambiguousContext',
					value: true,
					bold: styles.ambiguousContext.bold,
					italic: styles.ambiguousContext.italic,
					fontColor: [
						styles.ambiguousContext.fontColor.r,
						styles.ambiguousContext.fontColor.g,
						styles.ambiguousContext.fontColor.b
						],
					backgroundColor: [
						styles.ambiguousContext.backgroundColor.r,
						styles.ambiguousContext.backgroundColor.g,
						styles.ambiguousContext.backgroundColor.b
					]
				}
			];
		} else {
			annotationStyle = [{
					property: '_unknown',
					value: true,
					bold: true,
					italic: true,
					fontColor: [0, 0.5, 0]
				},{
					property: '_ambiguousBlock',
					value: true,
					bold: false,
					italic: false,
					backgroundColor: [1, 0.5, 0.5]
				},{
					property: '_ambiguousContext',
					value: true,
					bold: false,
					italic: false,
					backgroundColor: [0.5, 0.5, 1]
				}
			];
		}

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
							'/*\nLegend:\nUnknown Value Generated\nAmbiguous Context\nAmbiguous Block\nAmbiguous Block and Context\n*/\n', [{
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
								start: 35,
								bold: annotationStyle[1].bold,
								italic: annotationStyle[1].italic,
								fontColor: annotationStyle[1].fontColor,
								backgroundColor: annotationStyle[1].backgroundColor
							}, {
								start: 52,
								bold: annotationStyle[2].bold,
								italic: annotationStyle[2].italic,
								fontColor: annotationStyle[2].fontColor,
								backgroundColor: annotationStyle[2].backgroundColor
							}, {
								start: 68,
								bold: annotationStyle[1].bold || annotationStyle[2].bold,
								italic: annotationStyle[1].italic || annotationStyle[2].italic,
								fontColor: alphaBlend(annotationStyle[1].fontColor, annotationStyle[2].fontColor, [0, 0, 0]),
								backgroundColor: alphaBlend(annotationStyle[1].backgroundColor, annotationStyle[2].backgroundColor, [1, 1, 1])
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