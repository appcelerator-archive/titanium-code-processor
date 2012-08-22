/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * The "debugger" keyword is used to trigger a breakpoint if a debugger is attached. Does nothing in this implementation.
 * 
 * @module rules/debugger
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 11.15
 */

/**
 * @name module:rules/debugger.rule
 * @event
 * @property {String} ruleName The string "debugger"
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
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
	
	// Since there is no debugger, we ignore this rule
	
	RuleProcessor.fireRuleEvent(ast, {}, true);
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);