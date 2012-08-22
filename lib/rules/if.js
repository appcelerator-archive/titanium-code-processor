/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * An if or if/else statement
 * 
 * @module rules/if
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 12.5
 */

/**
 * @name module:rules/if.rule
 * @event
 * @property {String} ruleName The string "call"
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.BaseType} conditional The value of the conditional. Only available post-evaluation.
 * @property {Array} result The result of evaluating the block. Results of statements are typically 
 *		3-tuples (in the form of an array), with the first entry being the type of return (typically "normal"), followed
 *		by two entries that are rule specific. Only available post-evaluation.
 */

var path = require("path"),
	Base = require("../Base"),
	RuleProcessor = require("../RuleProcessor"),
	Runtime = require("../Runtime");

/**
 * Do not call directly. Call {@link RuleProcessor.processRule} instead.
 * 
 * @private
 */
exports.processRule = function processRule(ast) {
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
	var leftValue = Base.getValue(RuleProcessor.processRule(ast[1])),
		leftType = Base.type(leftValue),
		result;
	if (leftType === "Unknown") {
		Runtime.ambiguousCode++;
		RuleProcessor.processRule(ast[2]);
		if (ast[3]) {
			result = RuleProcessor.processRule(ast[3]);
		} else {
			result = ["normal", undefined, undefined];
		}
		Runtime.ambiguousCode--;
	} else if (Base.toBoolean(leftValue).value) {
		result = RuleProcessor.processRule(ast[2]);
	} else {
		if (ast[3]) {
			result = RuleProcessor.processRule(ast[3]);
		} else {
			result = ["normal", undefined, undefined];
		}
	}
	
	RuleProcessor.fireRuleEvent(ast, {
		conditional: leftValue,
		result: result
	}, true);
	return result;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);