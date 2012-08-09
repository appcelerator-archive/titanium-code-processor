/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * Parses the supplied code into an AST
 * 
 * @module AST
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

var fs = require("fs"),
	uglify = require("uglify-js"),
	Messaging = require("./Messaging");

// ******** AST API methods ********

/**
 * A node in the AST, as specified by UglifyJS.
 * 
 * @name module:AST.node
 * @see {@link http://marijnhaverbeke.nl/parse-js/as.txt}
 */

/**
 * Parses code into an AST.
 * 
 * @method
 * @param {String} file The full path to the file to parse
 * @returns {{@link module:AST.node}} The parsed AST
 */
exports.parse = function parse(file) {
	var code = fs.readFileSync(file).toString();
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