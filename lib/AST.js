/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Provides various methods for creating and working with ASTs
 *
 * @module AST
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var fs = require('fs'),
	uglify = require('uglify-js'),
	Runtime = require('./Runtime');

// ******** Uglify extensions and modifications ********

uglify.AST_Node.warn_function = function () {}; // Prevent warnings from being printed

uglify.AST_Node.prototype._preProcess = function() {

	// Some rules do not have location information, so we have to check for them here and use the previous information otherwise
	var currentLocation = Runtime.getCurrentLocation(),
		start = this.start,
		filename = (start && start.file) || currentLocation.filename,
		line = (start && start.line) || currentLocation.line,
		column = (start && start.col) || currentLocation.column;

	// Make sure we haven't exceeded the time limit
	if (Runtime.executionTimeLimit && Runtime.executionTimeLimit < Date.now()) {
		throw new Error('Execution timeout exceeded');
	}

	// Store line and column numbers, if they exist
	Runtime.setCurrentLocation(filename, line, column);

	this._visited = true;
};

uglify.AST_Node.prototype._postProcess = function() {
	if (Runtime._unknown) {
		this._unknown = true;
		Runtime._unknown = false;
	}
	Runtime.exitCurrentLocation();
};

// ******** AST API methods ********

/**
 * A node in the AST, as specified by UglifyJS.
 *
 * @name module:AST.node
 * @see {@link http://marijnhaverbeke.nl/parse-js/as.txt}
 */

/**
 * Parses code in the specified file into an AST.
 *
 * @method
 * @param {String} filename The full path to the file to parse
 * @returns {{@link module:AST.node}} The parsed AST
 */
exports.parse = parse;
function parse(filename) {
	return parseString(fs.readFileSync(filename).toString(), filename);
}

/**
 * Parses code in the supplied string into an AST
 *
 * @method
 * @param {String} src The source code to parse
 * @returns {{@link module:AST.node}} The parsed AST
 */
exports.parseString = parseString;
function parseString(src, filename) {
	var ast;
	try {
		ast = uglify.parse(src, {
			filename: filename
		});
		ast.figure_out_scope();
		if (filename) {
			Runtime.setAST(ast, filename);
		}
		return ast;
	} catch (e) {
		e.syntaxError = true;
		return e;
	}
}

/**
 * Processes a node in the AST by linking up the node to a rule processor
 *
 * @method
 * @param {String} name The name of the rule that this processor will handle
 * @param {Function} handler The function to be called to process the rule
 */
exports.registerRuleProcessor = registerRuleProcessor;
function registerRuleProcessor(className, handler) {
	if (uglify[className].processRule) {
		throw new Error('Internal Error: attempted to register processoor for class ' + className + ', but one already exists.');
	}
	uglify[className].prototype.processRule = handler;
	uglify[className].prototype.className = className;
}

/**
 * Creates a valid AST node (toplevel) that contains the body of nodes for easy use in other parts of the code processor
 *
 * @method
 * @param {Array[{@link module:AST.node}]} body The body to insert into a new container
 */
exports.createBodyContainer = createBodyContainer;
function createBodyContainer(body) {
	var container = uglify.parse('');
	container.body = body;
	return container;
}

/**
 * Walk an AST, recieving callbacks for desired nodes.
 *
 * @method
 * @param {module:AST.node} ast The AST to walk
 * @param {Object[Function({@link module:AST.node}, Function)]} eventListeners An object containing the rules to listen
 *		for. Each key is the name of the rule to listen for and the value is the function to call. Each
 *		callback function takes two parameters: the AST node and a 'next' function. Calling this function will cause the
 *		children of the node to be processed. Not calling the 'next' function will cause the children to be skipped.
 */
exports.walk = walk;
function walk (ast, eventListeners) {
	eventListeners = eventListeners || [];
	ast.walk(new uglify.TreeWalker(function(node) {
		var i,
			len,
			eventListener,
			cancelDescend = false;
		for (i = 0, len = eventListeners.length; i < len; i++) {
			eventListener = eventListeners[i];
			if (!eventListener.nodeType) {
				cancelDescend = cancelDescend || eventListener.callback && eventListener.callback(node);
			} else if (node instanceof uglify[eventListener.nodeType]) {
				cancelDescend = cancelDescend || eventListener.callback && eventListener.callback(node);
			}
		}
		return cancelDescend;
	}));
}

/**
 * Takes serialized code and annotates it in HTML format. The input should be the output from {@link module:AST.serialize}
 *
 * @param {String} serializedCode The (unannotated) serialized code
 * @param {Array[Object]} styles The list of styles to apply
 * @returns {String} The annotated code in HTML format
 */
exports.generateAnnotatedHTML = generateAnnotatedHTML;
function generateAnnotatedHTML(code, codeStyles, header, headerStyles) {
	function generate(data, styles) {
		var i = styles.length - 1,
			style,
			start,
			end;
		function getHexColor(num) {
			num = Math.round(num * 255).toString(16);
			if (num.length === 1) {
				num = '0' + num;
			}
			return num;
		}
		for(; i >= 0; i--) {
			style = styles[i];
			start = style.start;
			end = styles[i + 1] ? styles[i + 1].start : data.length;
			data = data.slice(0, start) +
				'<span style="' +
					(style.bold ? 'font-weight:bold;' : '') +
					(style.italic ? 'font-style:italic;' : '') +
					(style.fontColor ? 'color:#' +
						getHexColor(style.fontColor[0]) +
						getHexColor(style.fontColor[1]) +
						getHexColor(style.fontColor[2]) + ';' : '') +
					(style.backgroundColor ? 'background-color:#' +
						getHexColor(style.backgroundColor[0]) +
						getHexColor(style.backgroundColor[1]) +
						getHexColor(style.backgroundColor[2]) + ';' : '') +
				'">' +
				data.slice(start, end)
					.replace('<', ' &lt;')
					.replace('>', '&gt;') +
				'</span>' +
				data.slice(end);
		}
		return data;
	}
	return '<!DOCTYPE html>\n<html>\n<body>\n' +
		(header && headerStyles ? '<pre>\n' + generate(header, headerStyles) + '</pre>\n' : '') +
		'<pre>\n' + generate(code, codeStyles) + '</pre>\n</body></html>';
}

/**
 * Generates annotations for the AST
 *
 * @method
 * @param {module:AST.node} ast The AST to annotate
 * @param {Array[Object]} rules The style rules to apply
 * @param {String} rules.property The property name to query
 * @param {any} rules.value The value of the property to apply the style for
 * @param {Object} rules.style The style rules to apply
 * @param {Boolean} rules.style.bold Whether or not to bold the text
 * @param {Boolean} rules.style.italic Whether or not to italicize the text
 * @param {Array[Number]} rules.style.fontColor The color of the font, in RGB-ordered array format,
 *		with values being floats between 0 and 1
 * @param {Array[Number]} rules.style.fontColor The color of the background, in RGB-ordered array format,
 *		with values being floats between 0 and 1
 * @returns {Object} The serialized AST and styles
 */
exports.generateAnnotations = generateAnnotations;
function generateAnnotations(ast, rules) {
	var styles = [],
		backgroundColors = [],
		fontColors = [],
		bold = 0,
		i, j, len,
		temp,
		italic = 0;
	rules = rules || [];

	ast.walk(new uglify.TreeWalker(function (node, descend) {

		var rule,
			colorExists,
			appliedBold = 0,
			localBold,
			appliedItalic = 0,
			localItalic,
			appliedFontColors = [],
			localFontColors = [],
			appliedBackgroundColors = [],
			localBackgroundColors = [],
			previousStyle;

		function generateColor(colorList) {
			var i = 1, len = colorList.length,
				alpha = 0.5,
				color = [colorList[0][0], colorList[0][1], colorList[0][2]];
			for (; i < len; i++) {
				color[0] = alpha * colorList[i][0] + (1 - alpha) * color[0];
				color[1] = alpha * colorList[i][1] + (1 - alpha) * color[1];
				color[2] = alpha * colorList[i][2] + (1 - alpha) * color[2];
			}
			return color;
		}

		// Determine the style info
		for(i = 0, len = rules.length; i < len; i++) {
			rule = rules[i];
			if (node[rule.property] === rule.value) {
				if (rule.bold) {
					if (rule.local) {
						localBold = true;
					} else {
						bold++;
						appliedBold++;
					}
				}
				if (rule.italic) {
					if (rule.local) {
						localItalic = true;
					} else {
						italic++;
						appliedItalic++;
					}
				}
				if (rule.fontColor) {
					if (rule.local) {
						localFontColors.push(rule.fontColor);
					} else {
						colorExists = false;
						appliedFontColors.push(rule.fontColor);
						for(j = 0; j < fontColors.length; j++) {
							if (fontColors[j][0] === rule.fontColor[0] &&
									fontColors[j][1] === rule.fontColor[1] &&
									fontColors[j][2] === rule.fontColor[2]) {
								colorExists = true;
								fontColors[j][3]++;
								break;
							}
						}
						if (!colorExists) {
							fontColors.push(rule.fontColor.concat([1]));
						}
					}
				}
				if (rule.backgroundColor) {
					if (rule.local) {
						localBackgroundColors.push(rule.backgroundColor);
					} else {
						colorExists = false;
						appliedBackgroundColors.push(rule.backgroundColor);
						for(j = 0; j < backgroundColors.length; j++) {
							if (backgroundColors[j][0] === rule.backgroundColor[0] &&
									backgroundColors[j][1] === rule.backgroundColor[1] &&
									backgroundColors[j][2] === rule.backgroundColor[2]) {
								colorExists = true;
								backgroundColors[j][3]++;
								break;
							}
						}
						if (!colorExists) {
							backgroundColors.push(rule.backgroundColor.concat([1]));
						}
					}
				}
			}
		}

		// Generate the style
		previousStyle = styles[styles.length - 1];
		localFontColors = fontColors.concat(localFontColors);
		localBackgroundColors = backgroundColors.concat(localBackgroundColors);
		if (node.start) {
			styles.push({
				start: node.start.pos,
				italic: !!italic || localItalic,
				bold: !!bold || localBold,
				fontColor: localFontColors.length ? generateColor(localFontColors) : [0, 0, 0],
				backgroundColor: localBackgroundColors.length ? generateColor(localBackgroundColors) : [1, 1, 1]
			});
		}

		// Process the child nodes
		descend();

		// Remove the node styles
		italic -= appliedItalic;
		bold -= appliedBold;
		for(i = 0, len = appliedFontColors.length; i < len; i++) {
			for(j = 0; j < fontColors.length; j++) {
				if (fontColors[j][0] === appliedFontColors[i][0] &&
						fontColors[j][1] === appliedFontColors[i][1] &&
						fontColors[j][2] === appliedFontColors[i][2]) {
					fontColors[j][3]--;
					if (!fontColors[j][3]) {
						fontColors.splice(j, 1);
					}
				}
			}
		}
		for(i = 0, len = appliedBackgroundColors.length; i < len; i++) {
			for(j = 0; j < backgroundColors.length; j++) {
				if (backgroundColors[j][0] === appliedBackgroundColors[i][0] &&
						backgroundColors[j][1] === appliedBackgroundColors[i][1] &&
						backgroundColors[j][2] === appliedBackgroundColors[i][2]) {
					backgroundColors[j][3]--;
					if (!backgroundColors[j][3]) {
						backgroundColors.splice(j, 1);
					}
				}
			}
		}

		// Generate the old style
		if (previousStyle && node.end) {
			styles.push({
				start: node.end.endpos,
				italic: previousStyle.italic,
				bold: previousStyle.bold,
				fontColor: [
					previousStyle.fontColor[0],
					previousStyle.fontColor[1],
					previousStyle.fontColor[2]
				],
				backgroundColor: [
					previousStyle.backgroundColor[0],
					previousStyle.backgroundColor[1],
					previousStyle.backgroundColor[2]
				]
			});
		}

		return true;
	}));
	for(i = 0; i < styles.length - 1; i++) {
		for(j = i + 1; j < styles.length; j++) {
			if (styles[i].start > styles[j].start) {
				temp = styles[i];
				styles[i] = styles[j];
				styles[j] = temp;
			}
		}
	}
	if (ast.end) {
		while (styles[styles.length - 1].start >= ast.end.endpos) { // Extra nodes at the end are usually generated
			styles.pop();
		}
	}
	return styles;
}