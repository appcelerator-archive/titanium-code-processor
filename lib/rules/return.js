/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * A return statement in a function.
 * 
 * @module rules/return
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 12.9
 */

/**
 * @name module:rules/return.rule
 * @event
 * @property {String} ruleName The string "call"
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.BaseType} result The return value. Only available post-evaluation.
 */

var path = require("path"),
	RuleProcessor = require("../RuleProcessor"),
	Base = require("../Base"),
	Exceptions = require("../Exceptions"),
	Runtime = require("../Runtime");

/**
 * Do not call directly. Call {@link RuleProcessor.processRule} instead.
 * 
 * AST: [node-info, value <ast | null>]
 * 
 * @private
 */
exports.processRule = processRule;
function processRule(ast) {
	
	var result;
	
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
	// Make sure we are in a function
	if (Runtime.contextStack.length < 3) {
		throw new Exceptions.SyntaxError();
	}
	
	result = ["return", new Base.UndefinedType(), undefined];
	if (ast[1]) {
		result[1] = Base.getValue(RuleProcessor.processRule(ast[1]));
	}
	
	RuleProcessor.fireRuleEvent(ast, {
		result: result
	}, true);
	
	return result;
}
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);