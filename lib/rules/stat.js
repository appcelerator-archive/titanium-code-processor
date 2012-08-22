/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * A single statement. This rule is an abstract rule not covered directly by a section in the spec.
 * 
 * @module rules/stat
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

/**
 * @name module:rules/stat.rule
 * @event
 * @property {String} ruleName The string "call"
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {Array} result The result of evaluating the block. Results of statements are typically 
 *		3-tuples (in the form of an array), with the first entry being the type of return (typically "normal"), followed
 *		by two entries that are rule specific. Only available post-evaluation.
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
	
	var result = RuleProcessor.processRule(ast[1]);
	
	RuleProcessor.fireRuleEvent(ast, {
		result: result
	}, true);
	return result;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);