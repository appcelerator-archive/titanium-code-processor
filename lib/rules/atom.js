/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * This rule represents "true", "false", "null", and "undefined" (perhaps others?). It doesn't actually correspond to
 * any real rules in the ECMA spec.
 * 
 * @module rules/atom
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

/**
 * @name module:rules/atom.rule
 * @event
 * @property {String} ruleName The string "atom"
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.BaseType} result The atom that was created. Only available post-evaluation.
 */

var path = require("path"),
	RuleProcessor = require("../RuleProcessor"),
	Base = require("../Base");

/**
 * Do not call directly. Call {@link RuleProcessor.processRule} instead.
 * 
 * @private
 */
exports.processRule = function(ast) {
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
	var name = ast[1],
		result;
	if (name === "true" || name === "false") {
		result = new Base.BooleanType();
		result.value = name === "true" ? true : false;
	} else if (name === "undefined") {
		result = new Base.UndefinedType();
	} else if (name === "null") {
		result = new Base.NullType();
	} else {
		throw new Error("Internal Error: atom of type " + name + " is unrecognized.");
	}
	
	RuleProcessor.fireRuleEvent(ast, {
		result: result
	}, true);
	return result;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);