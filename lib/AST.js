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
 * Parses code in the specified file into an AST.
 * 
 * @method
 * @param {String} file The full path to the file to parse
 * @returns {{@link module:AST.node}} The parsed AST
 */
exports.parse = parse;
function parse(file) {
	return parseString(fs.readFileSync(file).toString(), file);
}

/**
 * Parses code in the supplied string into an AST
 * 
 * @method
 * @param {String} src The source code to parse
 * @returns {{@link module:AST.node}} The parsed AST
 */
exports.parseString = parseString;
function parseString(src, file) {
	try {
		return uglify.parser.parse(src, false, true);
	} catch (e) {
		error = {
			description: "Parse error: " + e.message,
			file: file || "not available",
			line: e.line,
			column: e.col
		};
		Messaging.reportError(error);
		Messaging.log("error", "Parse error: " + JSON.stringify(error));
		Messaging.fireEvent("parseError", error);
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

}