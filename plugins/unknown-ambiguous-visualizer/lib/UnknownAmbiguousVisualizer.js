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
		details: {}
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
	options = options || {};
	Runtime.on('projectProcessingEnd', function() {
		var astSet = Runtime.getASTSet(),
			id,
			annotationStyle,
			styles,
			outputDir,
			inputDir = path.dirname(Runtime.getEntryPointFile()),
			inputSource,
			outputFilePath,
			annotationData,
			result;

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

		function nodeVisitedCallback (node) {
			if (node._unknown) {
				result.numUnknownNodes++;
				results.numUnknownNodes++;
			}
			if (node._ambiguousBlock) {
				result.numAbiguousBlockNodes++;
				results.numAbiguousBlockNodes++;
			}
			if (node._ambiguousContext) {
				result.numAbiguousContextNodes++;
				results.numAbiguousContextNodes++;
			}
			result.numTotalNodes++;
			results.numTotalNodes++;
		}

		// Analyze the ASTs
		for (id in astSet) {
			result = results.details[id] = {
				numUnknownNodes: 0,
				numAbiguousBlockNodes: 0,
				numAbiguousContextNodes: 0,
				numTotalNodes: 0
			};
			AST.walk(astSet[id], [
				{
					callback: nodeVisitedCallback
				}
			]);
		}

		// Create the summary report
		results.summary = (100 * results.numUnknownNodes / results.numTotalNodes).toFixed(1) +
			'% of the project\'s source code is not knowable at compile time';


		if (options.visualization) {
			// Calculate the output directory
			results.visualizationDataLocation = outputDir = options.visualization.outputDirectory;
			if (outputDir) {
				if (options.visualization.timestampOutputDirectory) {
					outputDir += '.' + (new Date()).toISOString();
				}
				if (existsSync(outputDir)) {
					wrench.rmdirSyncRecursive(outputDir);
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
					annotationData = AST.generateAnnotations(astSet[id], annotationStyle);

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
	var nodeList = [],
		filesSkipped,
		template = {},
		visualizationFiles,
		i, len,
		htmlRegex = /\.html$/,
		visualizationEntries = [],
		isDefault = true,
		defaultLink,
		file,
		isFolder,
		visualizationDataLocation = path.resolve(results.visualizationDataLocation);

	// Calculate the node list
	Object.keys(results.details).forEach(function(id) {
		var result = results.details[id];
		nodeList.push({
			filename: id.replace(baseDirectory, ''),
			numUnknownNodes: result.numUnknownNodes,
			numAbiguousBlockNodes: result.numAbiguousBlockNodes,
			numAbiguousContextNodes: result.numAbiguousContextNodes,
			numTotalNodes: result.numAbiguousContextNodes
		});
	});

	if (visualizationDataLocation) {
		visualizationFiles = wrench.readdirSyncRecursive(visualizationDataLocation).sort();
		for (i = 0, len = visualizationFiles.length; i < len; i++) {
			file = path.join(visualizationDataLocation, visualizationFiles[i]);
			isFolder = fs.statSync(file).isDirectory();
			if (htmlRegex.test(file)) {
				if (isDefault) {
					defaultLink = file;
				}
			} else if (!isFolder) {
				continue;
			}
			visualizationEntries.push({
				id: file,
				isFolder: isFolder,
				isDefault: !isFolder && isDefault,
				name: new Array(file.replace(visualizationDataLocation, '').split(path.sep).length - 1).join('&nbsp;&nbsp;&nbsp;') + path.basename(file)
			});
			if (isDefault) {
				isDefault = false;
			}
		}
	}

	template[entryFile] = {
		template: path.join(__dirname, '..', 'templates', 'unknownAmbiguousVisualizerTemplate.html'),
		data: {
			numUnknownNodes: results.numUnknownNodes === 1 ? '1 node is' : results.numUnknownNodes + ' nodes are',
			numAbiguousBlockNodes: results.numAbiguousBlockNodes === 1 ? '1 node is' : results.numAbiguousBlockNodes + ' nodes are',
			numAbiguousContextNodes: results.numAbiguousContextNodes === 1 ? '1 node is' : results.numAbiguousContextNodes + ' nodes are',
			numTotalNodes: results.numTotalNodes === 1 ? '1 node' : results.numTotalNodes + ' nodes',
			nodeCoverage: {
				nodeList: nodeList
			},
			visualization: visualizationDataLocation,
			files: visualizationEntries,
			defaultLink: defaultLink
		}
	};

	return template;
};
module.exports.prototype.displayName = 'Unknown Visualizer';