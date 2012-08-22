/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * A block is a collection of 0 or more statements.
 * 
 * @module rules/block
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 12.1
 */

/**
 * @name module:rules/block.rule
 * @event
 * @property {String} ruleName The string "block"
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
exports.processRule = function(ast) {
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
	result = exports.processBlock(ast[1]);
	
	RuleProcessor.fireRuleEvent(ast, {
		result: result
	}, true);
	return result;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);

/**
 * Do not call directly. This is a helper method for other rules to use.
 * 
 * @private
 */
exports.processBlock = function(ast) {
	var i = 0,
		len = ast ? ast.length : 0,
		result = ["normal", undefined, undefined],
		v;
	for(; i < len; i++) {
		v = RuleProcessor.processRule(ast[i]);
		if (v.length === 3 && v[0] !== "normal") {
			result = v;
			break;
		}
		if (v[1]) {
			result[1] = v[1];
		}
		result[2] = v[2];
	}
	return result;
}