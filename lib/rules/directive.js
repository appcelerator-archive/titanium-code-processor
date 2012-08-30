/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * A directive statement, namely "use strict". Note: there isn't an actual directive rule in the ECMA-262 spec
 * 
 * @module rules/directive
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

/**
 * @name module:rules/directive.rule
 * @event
 * @property {String} ruleName The string "defun"
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.StringType} result The directive. Only available post-evaluation.
 */

var path = require("path"),
	Base = require("../Base"),
	RuleProcessor = require("../RuleProcessor");

/**
 * Do not call directly. Call {@link RuleProcessor.processRule} instead.
 * 
 * @private
 */
exports.processRule = function processRule(ast) {
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
	// This rule is not actually invoked directly, but is used instead in rules like "toplevel" so we do nothing interesting here.
	
	var value = new Base.StringType(ast[1]);
	
	RuleProcessor.fireRuleEvent(ast, {
		result: value
	}, true);
	
	return ["normal", value, undefined];
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);