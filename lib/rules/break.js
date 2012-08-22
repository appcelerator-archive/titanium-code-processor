/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * The break statement causes execution to exit the current block, if the block can contain a break statement.
 * 
 * @module rules/break
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 12.8
 */

/**
 * @name module:rules/break.rule
 * @event
 * @property {String} ruleName The string "break"
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {Array} result The result of evaluating the break. The result is a 3-tuple consisting of 
 *		["break", label if supplied or undefined, undefined]. Only available post-evaluation.
 */

var path = require("path"),
	RuleProcessor = require("../RuleProcessor");

/**
 * Do not call directly. Call {@link RuleProcessor.processRule} instead.
 * 
 * @private
 */
exports.processRule = function(ast) {
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
	var result = ["break", undefined, undefined];
	if (ast[1]) {
		result[2] = ast[1];
	}
	
	RuleProcessor.fireRuleEvent(ast, {
		result: result
	}, true);
	
	return result;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);