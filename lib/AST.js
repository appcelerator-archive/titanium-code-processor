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
		e.filename = filename || '';
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