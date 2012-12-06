/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * @module plugins/RequireFinder
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

 
var path = require('path'),
	fs = require('fs'),
	existsSync = fs.existsSync || path.existsSync,
	
	wrench = require('wrench'),
	
	AST = require(path.join(global.nodeCodeProcessorLibDir, 'AST')),
	Runtime = require(path.join(global.nodeCodeProcessorLibDir, 'Runtime')),
	RuleProcessor = require(path.join(global.nodeCodeProcessorLibDir, 'RuleProcessor')),
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
 * @name module:plugins/RequireFinder
 */
module.exports = function () {
	Runtime.on('processingComplete', function() {
		var astSet = Runtime.getASTSet(),
			id,
			result,
			originalCode,
			annotatedCode,
			inputDir = path.dirname(Runtime.getEntryPointFile()),
			outputDir = path.resolve(path.join(inputDir, '..', 'analysis', 'unknown-ambiguous-visualizer')),
			outputFilePath,
			annotations,
			currentLine,
			currentColumn,
			startLine, endLine,
			startColumn, endColumn;

		function analyzeNode(node, next) {
			var insertionLocation;

			function getLocation(annotationNode) {
				var i, len,
					location;
				if ((startLine > annotationNode.startLine ||
						(startLine === annotationNode.startLine && startColumn >= annotationNode.startColumn)) &&
						(endLine < annotationNode.endLine ||
						(endLine === annotationNode.endLine && endColumn <= annotationNode.endColumn))) {
					for (i = 0, len = annotationNode.children.length; i < len; i++) {
						location = getLocation(annotationNode.children[i]);
						if (location) {
							return location;
						}
					}
					return annotationNode;
				}
			}

			if (node[0].start) {
				startLine = node[0].start.line;
				endLine = node[0].end.line;
				startColumn = node[0].start.col;
				endColumn = node[0].end.col;
			}
			insertionLocation = getLocation(annotations) || annotations;
			insertionLocation.children.push({
				startLine: startLine,
				endLine: endLine,
				startColumn: startColumn,
				endColumn: endColumn,
				ambiguousBlock: node._ambiguousBlock,
				ambiguousContext: node._ambiguousContext,
				unknown: node._unknown,
				children: []
			});

			if (node._ambiguousBlock) {
				result.numAbiguousBlockNodes++;
				results.numAbiguousBlockNodes++;
			}
			if (node._ambiguousContext) {
				result.numAbiguousContextNodes++;
				results.numAbiguousContextNodes++;
			}
			if (node._unknown) {
				result.numUnknownNodes++;
				results.numUnknownNodes++;
			}
			results.numTotalNodes++;
			next();
		}

		function writeBlock(annotation) {
			var i, len,
				child;

			// Set the colors
			if (annotation.ambiguousBlock && annotation.ambiguousContext) {
				annotatedCode += '{\\cb8 ';
			} else if (annotation.ambiguousBlock) {
				annotatedCode += '{\\cb4 ';
			} else if (annotation.ambiguousContext) {
				annotatedCode += '{\\cb6 ';
			}
			if (annotation.unknown) {
				annotatedCode += '{\\cf2 \\b ';
			}

			// Write the children
			for(i = 0, len = annotation.children.length; i < len; i++) {
				child = annotation.children[i];
				if (currentLine < child.startLine) {
					while(currentColumn < originalCode[currentLine].length) {
						annotatedCode += originalCode[currentLine][currentColumn++];
					}
					currentLine++;
					currentColumn = 0;
					annotatedCode += '\\line\n';
					while(currentLine < child.startLine) {
						annotatedCode += originalCode[currentLine++] + '\\line\n';
					}
				}
				while(currentColumn < child.startColumn) {
					annotatedCode += originalCode[currentLine][currentColumn++];
				}
				writeBlock(child);
			}

			// Write the trailing information
			if (currentLine < annotation.endLine) {
				while(currentColumn < originalCode[currentLine].length) {
					annotatedCode += originalCode[currentLine][currentColumn++];
				}
				currentLine++;
				currentColumn = 0;
				annotatedCode += '\\line\n';
				while(currentLine < annotation.endLine) {
					annotatedCode += originalCode[currentLine++] + '\\line\n';
				}
			}
			while(currentColumn <= annotation.endColumn) {
				annotatedCode += originalCode[currentLine][currentColumn++];
			}

			// End the colors
			if (annotation.unknown) {
				annotatedCode += '\\b0}';
			}
			if (annotation.ambiguousBlock || annotation.ambiguousContext) {
				annotatedCode += '}';
			}
		}

		// Analyze the ASTs (each id is a filename or random ID if not a file)
		if (existsSync(outputDir)) {
			wrench.rmdirSyncRecursive(outputDir);
		}
		for (id in astSet) {
			if (existsSync(id)) {
				originalCode = fs.readFileSync(id).toString().replace(/\{/g, '\\{').replace(/\}/g, '\\}').replace(/\r\n/g, '\n').split('\n'); // Convert windows line endings to unix
				outputFilePath = path.join(outputDir, path.relative(inputDir, id));
				if (!existsSync(path.dirname(outputFilePath))) {
					wrench.mkdirSyncRecursive(path.dirname(outputFilePath));
				}

				// Create the annotation data
				result = results.details[id] = {
					numAbiguousBlockNodes: 0,
					numAbiguousContextNodes: 0,
					numUnknownNodes: 0,
					numTotalNodes: 0
				};
				annotations = {
					startLine: 0,
					endLine: originalCode.length - 1,
					startColumn: 0,
					endColumn: originalCode[originalCode.length - 1].length - 1,
					children: []
				};
				startLine = 0;
				endLine = annotations.endLine;
				startColumn = 0;
				endColumn = annotations.endColumn;
				AST.walk(astSet[id], {
					'*': analyzeNode
				});
				fs.writeFileSync(outputFilePath + '.json', JSON.stringify(annotations, false, '\t'));
				console.log(AST.serialize(astSet[id]));

				// Visualize the annotation data
				currentLine = 0;
				currentColumn = 0;
				annotatedCode = '';
				writeBlock(annotations);
				fs.writeFileSync(outputFilePath + '.rtf', '{\\rtf1\\ansi\n' +
					'{\\colortbl;' +
						'\\red255\\green0\\blue0;' +
						'\\red0\\green128\\blue0;' +
						'\\red0\\green0\\blue255;' +
						'\\red255\\green200\\blue200;' +
						'\\red200\\green255\\blue200;' +
						'\\red200\\green200\\blue255;' +
						'\\red255\\green255\\blue200;' +
						'\\red255\\green200\\blue255;' +
						'\\red200\\green255\\blue255;' +
					'}\n' +
					'/*\\line\n' +
					'Legend:\\line\n' +
					'{\\cf2 \\b unknown value \\b0}\\line\n' +
					'{\\cb4 ambiguous block}\\line\n' +
					'{\\cb6 ambiguous context}\\line\n' +
					'{\\cb8 ambiguous context and block}\\line\n' +
					'*/\\line\n' +
					annotatedCode + '\n}');
			}
		}
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