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
	Runtime = require('./Runtime'),
	astRegex = /^AST_/;

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
 * @param {String} file The full path to the file to parse
 * @returns {{@link module:AST.node}} The parsed AST
 */
exports.parse = parse;
function parse(file) {
	var ast = parseString(fs.readFileSync(file).toString(), file);
	if (!ast.syntaxError) {
		Runtime.setAST(ast, file);
	}
	return ast;
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
	var container = new uglify.AST_Toplevel();
	container.body = body;
	container.figure_out_scope();
	return container;
}

/**
 * Walk an AST, recieving callbacks for desired nodes.
 *
 * @method
 * @param {module:AST.node} ast The AST to walk
 * @param {Object[Function({@link module:AST.node}, Function)]} eventListeners An object containing the rules to listen
 *		for ('*' for all). Each key is the name of the rule to listen for and the value is the function to call. Each
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
 * Serializes the AST back to ECMAScript source code.
 *
 * @method
 * @param {module:AST.node} ast The AST to serialize
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
exports.serialize = serialize;
function serialize(ast, rules) {
	var serializedCode = '',
		styles = [],
		indentionLevel = 0,
		followingNewline = false,
		backgroundColors = [],
		fontColors = [],
		bold = 0,
		italic = 0;
	rules = rules || [];

	// Serialize
	function walkNode(node) {
		var name = node && (typeof node[0] === 'string' ? node[0] : node[0].name),
			subNode,
			rule,
			i, j, len,
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

		function appendData(data, newLine) {
			var i = 0;
			if (followingNewline) {
				for (; i < indentionLevel; i++) {
					serializedCode += '\t';
				}
				followingNewline = false;
			}
			serializedCode += data;
			if (newLine) {
				serializedCode += '\n';
				followingNewline = true;
			}
		}

		function generateColor(color, colorList) {
			var i = 0, len = colorList.length,
				alpha = 0.5;
			for (; i < len; i++) {
				color[0] = alpha * colorList[i][0] + (1 - alpha) * color[0];
				color[1] = alpha * colorList[i][1] + (1 - alpha) * color[1];
				color[2] = alpha * colorList[i][2] + (1 - alpha) * color[2];
			}
			return color;
		}

		// Sanity check
		if (!node) {
			return;
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
		styles.push({
			start: serializedCode.length,
			italic: !!italic || localItalic,
			bold: !!bold || localBold,
			fontColor: generateColor([0, 0, 0], fontColors.concat(localFontColors)),
			backgroundColor: generateColor([1, 1, 1], backgroundColors.concat(localBackgroundColors))
		});

		// Each node is a little different when it comes to children, so we have to handle them on a case-by-case basis
		switch (name) {
			case 'array':
				appendData('[');
				if (node[1]) {
					for(i = 0, len = node[1].length; i < len; i++) {
						walkNode(node[1][i]);
						if (i < len - 1) {
							appendData(', ');
						}
					}
				}
				appendData(']');
				break;
			case 'assign':
				walkNode(node[2]);
				appendData(' ');
				if (typeof node[1] === 'string') {
					appendData(node[1]);
				}
				appendData('= ');
				walkNode(node[3]);
				break;
			case 'atom':
				appendData(node[1]);
				return;
			case 'binary':
				appendData('(');
				walkNode(node[2]);
				appendData(' ' + node[1] + ' ');
				walkNode(node[3]);
				appendData(')');
				break;
			case 'block':
				if (node[1] && node[1].length) {
					indentionLevel++;
					appendData('{', true);
					for(i = 0, len = node[1].length; i < len; i++) {
						walkNode(node[1][i]);
					}
					indentionLevel--;
					appendData('}', true);
				} else {
					appendData('{}', true);
				}
				break;
			case 'break':
				appendData('break' + (node[1] ? ' ' + node[1] : '') + ';', true);
				break;
			case 'call':
				walkNode(node[1]);
				appendData('(');
				if (node[2]) {
					for(i = 0, len = node[2].length; i < len; i++) {
						walkNode(node[2][i]);
						if (i < len - 1) {
							appendData(', ');
						}
					}
				}
				appendData(')');
				break;
			case 'conditional':
				appendData('(');
				walkNode(node[1]);
				appendData(' ? ');
				walkNode(node[2]);
				appendData(' : ');
				walkNode(node[3]);
				appendData(')');
				break;
			case 'const':
				appendData('const ');
				if (node[1]) {
					for (i = 0, len = node[1].length; i < len; i++) {
						appendData(node[1][i][0]);
						if (node[1][i][1]) {
							appendData(' = ');
							walkNode(node[1][i][1]);
						}
						if (i < len - 1) {
							appendData(', ');
						}
					}
				}
				appendData(';', true);
				break;
			case 'continue':
				appendData('continue' + (node[1] ? ' ' + node[1] : '') + ';', true);
				break;
			case 'debugger':
			appendData('debugger;', true);
				break;
			case 'defun':
				appendData('function ' + node[1] + '(');
				for (i = 0, len = node[2].length; i < len; i++) {
					appendData(node[2][i]);
					if (i < len - 1) {
						appendData(', ');
					}
				}
				if (node[3] && node[3].length) {
					indentionLevel++;
					appendData(') {', true);
					for(i = 0, len = node[3].length; i < len; i++) {
						walkNode(node[3][i]);
					}
					indentionLevel--;
					appendData('}', true);
				} else {
					appendData(') {}', true);
				}
				break;
			case 'directive':
				appendData(node[1]);
				break;
			case 'do':
				appendData('do ');
				walkNode(node[2]);
				appendData('while (');
				walkNode(node[1]);
				appendData(');', true);
				break;
			case 'dot':
				walkNode(node[1]);
				appendData('.');
				if (typeof node[2] !== 'string') {
					walkNode(node[2]);
				} else {
					appendData(node[2]);
				}
				break;
			case 'for-in':
				appendData('for (');
				if ((node[1][0].start && node[1][0].start.name === 'var') || node[1][0] === 'var') {
					appendData('var ');
				}
				walkNode(node[2]);
				appendData(' in ');
				walkNode(node[3]);
				appendData(') ');
				walkNode(node[4]);
				break;
			case 'for':
				appendData('for (');
				if (node[1]) {
					walkNode(node[1]);
					if (!(node[1][0].start && node[1][0].start.name === 'var') && node[1][0] !== 'var') {
						appendData('; ');
					}
				} else {
					appendData('; ');
				}
				walkNode(node[2]);
				appendData('; ');
				walkNode(node[3]);
				appendData(') ');
				walkNode(node[4]);
				break;
			case 'function':
				appendData('function ' + (node[1] ? node[1] : '') + '(');
				for (i = 0, len = node[2].length; i < len; i++) {
					appendData(node[2][i]);
					if (i < len - 1) {
						appendData(', ');
					}
				}
				if (node[3] && node[3].length) {
					indentionLevel++;
					appendData(') {', true);
					for(i = 0, len = node[3].length; i < len; i++) {
						walkNode(node[3][i]);
					}
					indentionLevel--;
					appendData('}');
				} else {
					appendData(') {}');
				}
				break;
			case 'if':
				appendData('if (');
				walkNode(node[1]);
				appendData(') ');
				walkNode(node[2]);
				if (node[3]) {
					appendData(' else ');
					walkNode(node[3]);
				}
				break;
			case 'label':
				appendData(node[1] + ': ');
				walkNode(node[2]);
				break;
			case 'name':
				appendData(node[1]);
				break;
			case 'new':
				appendData('new ');
				walkNode(node[1]);
				appendData('(');
				if (node[2]) {
					for(i = 0, len = node[2].length; i < len; i++) {
						walkNode(node[2][i]);
						if (i < len - 1) {
							appendData(', ');
						}
					}
				}
				appendData(')');
				break;
			case 'num':
				appendData(node[1]);
				break;
			case 'object':
				indentionLevel++;
				appendData('{', true);
				if (node[1]) {
					for(i = 0, len = node[1].length; i < len; i++) {
						if (node[1][i][2] === 'get') {
							if (node[1][i][1][3] && node[1][i][1][3].length) {
								indentionLevel++;
								appendData('get ' + node[1][i][0] + '() {');
								for(j = 0, len = node[1][i][1][3].length; j < len; j++) {
									walkNode(node[1][i][1][3][j]);
								}
								indentionLevel--;
								appendData('}');
							} else {
								appendData('get ' + node[1][i][0] + '() {}');
							}
						} else if (node[1][i][2] === 'set') {
							if (node[1][i][1][3] && node[1][i][1][3].length) {
								indentionLevel++;
								appendData('set ' + node[1][i][0] + '() {', true);
								for(j = 0, len = node[1][i][1][3].length; j < len; j++) {
									walkNode(node[1][i][1][3][j]);
								}
								indentionLevel--;
								appendData('}');
							} else {
								appendData('set ' + node[1][i][0] + '() {}');
							}
						} else {
							appendData(node[1][i][0] + ': ');
						}
						if (i < len - 1) {
							appendData(',', true);
						} else {
							indentionLevel--;
							appendData('', true);
						}
					}
				}
				appendData('}');
				break;
			case 'regexp':
				appendData('/' + node[1] + '/' + (node[2] ? node[2] : ''));
				break;
			case 'return':
				if (node[1]) {
					appendData('return ');
					walkNode(node[1]);
					appendData(';', true);
				} else {
					appendData('return;', true);
				}
				break;
			case 'seq':
				walkNode(node[1]);
				appendData(',');
				walkNode(node[2]);
				break;
			case 'stat':
				walkNode(node[1]);
				appendData(';', true);
				break;
			case 'string':
				appendData('"' + node[1] + '"');
				break;
			case 'sub':
				walkNode(node[1]);
				appendData('[');
				if (typeof node[2] !== 'string') {
					walkNode(node[2]);
				} else {
					appendData(node[2]);
				}
				appendData(']');
				break;
			case 'switch':
				appendData('switch (');
				walkNode(node[1]);
				indentionLevel++;
				appendData(') {', true);
				for(i = 0, len = node[2].length; i < len; i++) {
					subNode = node[2][i];
					if (subNode[0]) {
						appendData('case ');
						walkNode(subNode[0]);
					} else {
						appendData('default');
					}
					subNode = subNode[1];
					if (subNode && subNode.length) {
						indentionLevel++;
						appendData(':', true);
						for(j = 0; j < subNode.length; j++) {
							walkNode(subNode[j]);
						}
						indentionLevel--;
					} else {
						appendData(':', true);
					}
				}
				indentionLevel--;
				appendData('}', true);
				break;
			case 'throw':
				appendData('throw ');
				walkNode(node[1]);
				appendData(';', true);
				break;
			case 'toplevel':
				if (node[1]) {
					for(i = 0, len = node[1].length; i < len; i++) {
						walkNode(node[1][i]);
					}
				}
				break;
			case 'try':

				appendData('try {', true);
				indentionLevel++;
				if (node[1]) {
					for(i = 0, len = node[1].length; i < len; i++) {
						walkNode(node[1][i]);
					}
				}
				indentionLevel--;
				appendData('}');
				if (node[2]) {
					appendData(' catch (' + node[2][0] + ') {', true);
					indentionLevel++;
					if (node[2][1]) {
						for(i = 0, len = node[2][1].length; i < len; i++) {
							walkNode(node[2][1][i]);
						}
					}
					indentionLevel--;
					appendData('}', !node[3]);
				}
				if (node[3]) {
					appendData(' finally {', true);
					indentionLevel++;
					if (node[3]) {
						for(i = 0, len = node[3].length; i < len; i++) {
							walkNode(node[3][i]);
						}
					}
					indentionLevel--;
					appendData('}', true);
				}
				break;
			case 'unary-postfix':
				appendData('(');
				walkNode(node[2]);
				appendData(')' + node[1]);
				break;
			case 'unary-prefix':
				appendData(node[1] + '(');
				walkNode(node[2]);
				appendData(')');
				break;
			case 'var':
				appendData('var ');
				if (node[1]) {
					for(i = 0, len = node[1].length; i < len; i++) {
						appendData(node[1][i][0]);
						if (node[1][i][1]) {
							appendData(' = ');
							walkNode(node[1][i][1]);
						}
						if (i < len - 1) {
							appendData(', ');
						}
					}
				}
				appendData(';', true);
				break;
			case 'while':
				appendData('while (');
				walkNode(node[1]);
				appendData(') ');
				walkNode(node[2]);
				break;
			case 'with':
				appendData('with (');
				walkNode(node[1]);
				appendData(') ');
				walkNode(node[2]);
				break;
			default: // This should never execute. If it does, it means it's a bug in this lib
				throw new Error('Internal error: unknown node ' + name);
		}

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
		if (previousStyle) {
			styles.push({
				start: serializedCode.length,
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
	}
	walkNode(ast);
	return {
		serializedCode: serializedCode,
		styles: styles
	};
}