/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Provides various methods for creating and working with ASTs
 *
 * @module AST
 */

var fs = require('fs'),
	uglify = require('uglify-js'),
	Runtime = require('./Runtime');

// ******** Uglify extensions and modifications ********

uglify.AST_Node.warn_function = function () {}; // Prevent warnings from being printed

// ******** AST API methods ********

/**
 * A node in the AST, as specified by UglifyJS 2
 *
 * @typedef {Object} module:AST.node
 * @see {@link http://lisperator.net/uglifyjs/ast}
 */

/**
 * Parses code in the specified file into an AST
 *
 * @method module:AST.parse
 * @param {string} filename The full path to the file to parse
 * @return {module:AST.node} The parsed AST
 */
exports.parse = parse;
function parse(filename) {
	return parseString(fs.readFileSync(filename).toString(), filename);
}

/**
 * Parses code in the supplied string into an AST
 *
 * @method module:AST.parseString
 * @param {string} src The source code to parse
 * @return {module:AST.node} The parsed AST
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
 * @callback module:AST.ruleProcessorCallback
 * @return {(module:RuleProcessor.returnTuple | module:base.BaseType)} The result of the rule, either a value or a return tuple
 */
/**
 * Registers an AST rule processor by adding a "processRule" function and "className" property to each Uglify AST type
 *
 * @method module:AST.registerRuleProcessor
 * @param {string} name The name of the rule that this processor will handle
 * @param {module:AST.ruleProcessorCallback} handler The function to be called to process the rule
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
 * Creates a valid AST node (toplevel) that contains the set of supplied nodes for easy use in other parts of the code processor
 *
 * @method module:AST.createBodyContainer
 * @param {Array.<module:AST.node>} body The body to insert into the new container
 */
exports.createBodyContainer = createBodyContainer;
function createBodyContainer(body) {
	var container = uglify.parse('');
	container.body = body;
	return container;
}

/**
 * Each callback function takes two parameters: the AST node and a 'next' function. Calling this function will cause the
 * children of the node to be processed. Not calling the 'next' function will cause the children to be skipped.
 *
 * @callback module:AST.walkCallback
 * @param {module:AST.node} node The AST node that was encountered
 * @param {Function} next Calling the next function will cause the walker to descend into this node's children
 */
/**
 * Walk an AST, recieving callbacks for desired nodes.
 *
 * @method module:AST.walk
 * @param {module:AST.node} ast The AST to walk
 * @param {Object.<string, module:AST.walkCallback>} eventListeners An object containing the rules to listen
 *		for. Each key is the name of the rule to listen for and the value is the function to call.
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