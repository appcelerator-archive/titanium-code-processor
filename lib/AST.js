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
	util = require('util');

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
	Runtime.setAST(ast, file);
	walk(ast, {
		'*': function(node, next) {
			node._filename = file;
			next();
		}
	});

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
function parseString(src) {
	try {
		return uglify.parser.parse(src, false, true);
	} catch (e) {
		Runtime.log('error', 'Parse error: ' + e.message);
		Runtime.reportError('parseError',  'Parse error: ' + e.message, {
			message: e.message
		});
		Runtime.fireEvent('parseError',  'Parse error: ' + e.message, {
			message: e.message
		});
	}
}

/**
 * Minify the AST
 * 
 * @method
 * @param {module:AST.parseNode} ast The AST to minify
 * @returns {{@link module:AST.node}} The minified AST
 */
exports.minify = minify;
function minify(ast) {
	throw new Error('Not implemented yet');
}

/**
 * Serializes the AST back to ECMAScript source code.
 * 
 * @method
 * @param {module:AST.node} ast The AST to serialize
 * @returns {String} The serialized AST
 */
exports.serialize = serialize;
function serialize(ast) {
	throw new Error('Not implemented yet');
}

/**
 * Walk an AST
 * 
 * @method
 * @param {module:AST.node} ast The AST to walk
 * @param {Dictionary[function]} eventListeners The rule names to listen for, or '*' for all
 */
exports.walk = walk;
function walk (ast, eventListeners) {
	
	function walkNode(node) {
		if (!node) {
			return;
		}

		var name = typeof node[0] === 'string' ? node[0] : node[0].name,
			handler = eventListeners[name] || eventListeners['*'],
			result;

		function processChildren() {
			var i, len;
			function processNodeSet(nodeSet) {
				if (!nodeSet) {
					return;
				}
				for(i = 0, len = nodeSet.length; i < len; i++) {
					walkNode(nodeSet[i]);
				}
			}

			// Each node is a little different when it comes to children, so we have to handle them on a case-by-case basis
			switch (name) {
				case 'array':
					processNodeSet(node[1]);
					break;
				case 'assign':
					walkNode(node[2]);
					walkNode(node[3]);
					break;
				case 'atom':
					return;
				case 'binary':
					walkNode(node[2]);
					walkNode(node[3]);
					break;
				case 'block':
					processNodeSet(node[1]);
					break;
				case 'break':
					break;
				case 'call':
					walkNode(node[1]);
					processNodeSet(node[2]);
					break;
				case 'conditional':
					walkNode(node[1]);
					walkNode(node[2]);
					walkNode(node[3]);
					break;
				case 'const':
					node[1].forEach(function(init) {
						init[1] && walkNode(init[1]);
					});
					break;
				case 'continue':
					break;
				case 'debugger':
					break;
				case 'defun':
					processNodeSet(node[3]);
					break;
				case 'directive':
					break;
				case 'do':
					walkNode(node[1]);
					walkNode(node[2]);
					break;
				case 'dot':
					walkNode(node[1]);
					if (typeof node[2] !== 'string') {
						walkNode(node[2]);
					}
					break;
				case 'for-in':
					walkNode(node[1]);
					walkNode(node[2]);
					walkNode(node[3]);
					walkNode(node[4]);
					break;
				case 'for':
					walkNode(node[1]);
					walkNode(node[2]);
					walkNode(node[3]);
					walkNode(node[4]);
					break;
				case 'function':
					processNodeSet(node[3]);
					break;
				case 'if':
					walkNode(node[1]);
					walkNode(node[2]);
					walkNode(node[3]);
					break;
				case 'label':
					walkNode(node[2]);
					break;
				case 'name':
					break;
				case 'new':
					walkNode(node[1]);
					processNodeSet(node[2]);
					break;
				case 'num':
					break;
				case 'object':
					node[1].forEach(function(prop) {
						walkNode(prop[1]);
					});
					break;
				case 'regexp':
					break;
				case 'return':
					walkNode(node[1]);
					break;
				case 'seq':
					walkNode(node[1]);
					walkNode(node[2]);
					break;
				case 'stat':
					walkNode(node[1]);
					break;
				case 'string':
					break;
				case 'sub':
					walkNode(node[1]);
					walkNode(node[2]);
					break;
				case 'switch':
					walkNode(node[1]);
					node[2].forEach(function(switchCase) {
						walkNode(switchCase[0]);
						processNodeSet(switchCase[1]);
					});
					break;
				case 'throw':
					walkNode(node[1]);
					break;
				case 'toplevel':
					processNodeSet(node[1]);
					break;
				case 'try':
					processNodeSet(node[1]);
					node[2] && processNodeSet(node[2][1]);
					processNodeSet(node[3]);
					break;
				case 'unary-postfix':
					walkNode(node[2]);
					break;
				case 'unary-prefix':
					walkNode(node[2]);
					break;
				case 'var':
					node[1].forEach(function(init) {
						init[1] && walkNode(init[1]);
					});
					break;
				case 'while':
					walkNode(node[1], node[2]);
					break;
				case 'with':
					walkNode(node[1], node[2]);
					break;
				default: // This should never execute. If it does, it means it's a bug in this lib
					throw new Error('Internal error: unknown node ' + name);
			}
		}
		
		// Call the event handler, if it exists
		if (handler) {
			handler(node, function(callback) {
				processChildren();
				callback && callback();
			});
		} else {
			processChildren();
		}
	}
	walkNode(ast);
}