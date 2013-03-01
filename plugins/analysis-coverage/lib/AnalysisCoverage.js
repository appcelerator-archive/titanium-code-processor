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
	options = options || {};
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
		results.filesSkipped.forEach(function(file) {
			AST.parse(file); // Parse the file to add it to the list of unprocessed files remaining
		});
		results.numFilesVisited = Runtime.getProcessedFilesList().length;
		results.numFilesSkipped = results.filesSkipped.length;
		results.numTotalFiles = results.filesSkipped.length + results.numFilesVisited;

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

		// Create the summary report
		results.summary = (100 * (results.numNodesVisited + results.numNodesSkipped) / results.numTotalNodes).toFixed(1) +
			'% of the project\'s source code was analyzed';

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
			numNodesVisited: result.numNodesVisited,
			numNodesSkipped: result.numNodesSkipped,
			numTotalNodes: result.numTotalNodes
		});
	});

	if (results.filesSkipped.length) {
		filesSkipped = {
			filesSkippedList: []
		};
		results.filesSkipped.forEach(function (file) {
			filesSkipped.filesSkippedList.push({
				filename: file.replace(baseDirectory, '')
			});
		});
	}

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
		template: path.join(__dirname, '..', 'templates', 'analysisCoverageTemplate.html'),
		data: {
			numFilesVisited: results.numFilesVisited,
			numTotalFiles: results.numTotalFiles,
			filesPercentage: (100 * results.numFilesVisited / results.numTotalFiles).toFixed(1),
			numNodesVisited: results.numNodesVisited,
			numTotalNodes: results.numTotalNodes,
			nodesPercentage: (100 * (results.numNodesVisited + results.numNodesSkipped) / results.numTotalNodes).toFixed(1),
			nodeCoverage: {
				nodeList: nodeList
			},
			filesSkipped: filesSkipped,
			visualization: visualizationDataLocation,
			files: visualizationEntries,
			defaultLink: defaultLink
		}
	};

	return template;
};
module.exports.prototype.displayName = 'Analysis Coverage';
