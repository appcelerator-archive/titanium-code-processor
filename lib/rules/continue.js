/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * The continue statement is used to skip the rest of a loop and continue with the next iteration
 * 
 * @module rules/continue
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 12.7
 */

/**
 * @name module:rules/continue.rule
 * @event
 * @property {String} ruleName The string "continue"
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {Array} result The result of evaluating the continue. The result is a 3-tuple consisting of 
 *		["continue", label if supplied or undefined, undefined]. Only available post-evaluation.
 */

var path = require("path"),
	RuleProcessor = require("../RuleProcessor");

/**
 * Do not call directly. Call {@link RuleProcessor.processRule} instead.
 * 
 * @private
 */
exports.processRule = function processRule(ast) {
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
	var result = ["continue", undefined, ast[1] ? ast[1] : undefined];
	
	RuleProcessor.fireRuleEvent(ast, {
		result: result
	}, true);
	return result;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);