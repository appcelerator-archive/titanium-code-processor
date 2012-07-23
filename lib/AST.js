/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * Parses the supplied code into an AST
 * 
 * @module AST
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

uglify = require("uglify-js"),

/**
 * Represents a single node in the AST that corresponds directly to a rule in the ECMA-262 spec.
 * 
 * @name module:AST.node
 * @object
 * @property {String} name The name of the rule from the ECMA-262 spec, e.g. "FunctionDeclaration."
 * @property {String} file The file that the node was parsed from
 * @property {Number} line The line number that the node was parsed on
 * @property {Number} column The column number that the node was parsed on
 * @property {Array[{@link module:AST.node}]} children The child nodes of this node, array can be empty
 * @property {module:AST.node|null} parent The parent node of this node
 */

/**
 * Parses code into an AST.
 * 
 * @method
 * @param {String} code The code to parse
 * @returns {{@link module:AST.node}} The parsed AST
 */
exports.parse = function parse(code) {
	try {
		return uglify.parser.parse(code, false, true);
	} catch (e) {
		Messaging.log("error", "Parse error: " + e.message);
		Messaging.fireEvent("parseError", {
			message: e.message,
			file: file,
			line: e.line,
			col: e.col
		});
		return;
	}
};

/**
 * Minify the AST
 * 
 * @method
 * @param {module:AST.parseNode} ast The AST to minify
 * @returns {{@link module:AST.node}} The minified AST
 */
exports.minify = function minify(ast) {

};

/**
 * Serializes the AST back to ECMAScript source code.
 * 
 * @method
 * @param {module:AST.node} ast The AST to serialize
 * @returns {String} The serialized AST
 */
exports.serialize = function serialize(ast) {

};