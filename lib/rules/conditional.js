/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * The conditional (trinary) operator allows for conditional expressions
 * 
 * @module rules/conditional
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 11.12
 */

/**
 * @name module:rules/conditional.rule
 * @event
 * @property {String} ruleName The string "conditional"
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.BaseType} conditional The value of the conditional. Only available post-evaluation.
 * @property {module:Base.BaseType} result The result of evaluating the conditiona. Only available post-evaluation.
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
	
	var leftValue = Base.getValue(RuleProcessor.processRule(ast[1]));
		result;	
	if (Base.type(leftValue) === "Unknown") {
		result = new Base.UnknownType();
	} else if (Base.toBoolean(leftValue).value) {
		result = Base.getValue(RuleProcessor.processRule(ast[2]));
	} else {
		result = Base.getValue(RuleProcessor.processRule(ast[3]));
	}
	
	RuleProcessor.fireRuleEvent(ast, {
		conditional: leftValue,
		result: result
	}, true);
	return result;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);