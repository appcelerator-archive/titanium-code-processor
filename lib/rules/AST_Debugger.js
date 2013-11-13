/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * The 'debugger' keyword is used to trigger a breakpoint if a debugger is attached. Does nothing in this implementation.
 *
 * @module rules/AST_Debugger
 * @see ECMA-262 Spec Chapter 11.15
 */

/**
 * @name module:rules/AST_Debugger.rule
 * @event
 * @property {string} ruleName The string 'AST_Debugger'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {string} file The file that the rule begins on.
 * @property {number} line The line of the file where the rule begins on.
 * @property {number} column The column of the file where the rule begins on.
 * @property {boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor');

AST.registerRuleProcessor('AST_Debugger', function processRule() {

	var result = ['normal', undefined, undefined];

	RuleProcessor.preProcess(this);

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_Debugger');

	/*jshint debug: true*/
	debugger;

	RuleProcessor.fireRuleEvent(this, {}, true);

	RuleProcessor.postProcess(this, result);

	return result;
});