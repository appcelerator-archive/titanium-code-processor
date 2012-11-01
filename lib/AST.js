/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * Parses the supplied code into an AST
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
	return parseString(fs.readFileSync(file).toString());
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
		var name = typeof node[0] === 'string' ? node[0] : node[0].name,
			handler = eventListeners[name] || eventListeners['*'],
			result;

		function processChildren() {
			var i, len;
			function processNodeSet(nodeSet) {
				for(i = 0, len = nodeSet.length; i < len; i++) {
					walkNode(nodeSet[i]);
				}
			}

			// Each node is a little different when it comes to children, so we have to handle them on a case-by-case basis
			switch (name) {
				case 'array':
					processNodeSet(node[1]);
					return;
				case 'assign':
					walkNode(node[2]);
					return walkNode(node[3]);
				case 'atom':
					return;
				case 'binary':
					walkNode(node[2]);
					walkNode(node[3]);
					return;
				case 'block':
					processNodeSet(node[1]);
					return;
				case 'break':
					return;
				case 'call':
					walkNode(node[1]);
					processNodeSet(node[2]);
					return;
				case 'conditional':
					walkNode(node[1]);
					walkNode(node[2]);
					walkNode(node[3]);
					return;
				case 'continue':
					return;
				case 'debugger':
					return;
				case 'defun':
					processNodeSet(node[3]);
					return;
				case 'directive':
					return;
				case 'do':
					walkNode(node[1]);
					walkNode(node[2]);
					return;
				case 'dot':
					walkNode(node[1]);
					walkNode(node[2]);
					return;
				case 'for-in':
					walkNode(node[1]);
					walkNode(node[2]);
					walkNode(node[3]);
					walkNode(node[4]);
					return;
				case 'for':
					walkNode(node[1]);
					walkNode(node[2]);
					walkNode(node[3]);
					walkNode(node[4]);
					return;
				case 'function':
					processNodeSet(node[3]);
					return;
				case 'if':
					walkNode(node[1]);
					walkNode(node[2]);
					walkNode(node[3]);
					return;
				case 'label':
					walkNode(node[2]);
					return;
				case 'name':
					return;
				case 'new':
					walkNode(node[1]);
					processNodeSet(node[2]);
					return;
				case 'num':
					return;
				case 'object':
					node[1].forEach(function(prop) {
						walkNode(prop[1]);
					});
					return;
				case 'regexp':
					return;
				case 'return':
					walkNode(node[1]);
					return;
				case 'seq':
					walkNode(node[1]);
					walkNode(node[2]);
					return;
				case 'stat':
					return walkNode(node[1]);
				case 'string':
					return;
				case 'sub':
					walkNode(node[1]);
					walkNode(node[2]);
					return;
				case 'switch':
					walkNode(node[1]);
					node[2].forEach(function(switchCase) {
						walkNode(switchCase[0]);
						processNodeSet(switchCase[1]);
					});
					return;
				case 'throw':
					walkNode(node[1]);
					return;
				case 'toplevel':
					processNodeSet(node[1]);
					return;
				case 'try':
					processNodeSet(node[1]);
					node[2] && processNodeSet(node[2][1]);
					processNodeSet(node[3]);
					return;
				case 'unary-postfix':
					walkNode(node[2]);
					return;
				case 'unary-prefix':
					walkNode(node[2]);
					return;
				case 'var':
					node[1].forEach(function(init) {
						init[1] && walkNode(init[1]);
					});
					return;
				case 'while':
					walkNode(node[1], node[2]);
					return;
				case 'with':
					walkNode(node[1], node[2]);
					return;
				default: // This should never execute. If it does, it means it's a bug in this lib
					throw new Error('Internal error: unknown node ' + name);
			}
		}
		
		// Call the event handler, if it exists
		if (handler) {
			handler(node, function(callback) {
				result = processChildren();
				callback && callback(result);
			});
			return result;
		} else {
			return processChildren();
		}
	}
	walkNode(ast);
}