/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * The 'debugger' keyword is used to trigger a breakpoint if a debugger is attached. Does nothing in this implementation.
 *
 * @module rules/AST_Debugger
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 11.15
 */

/**
 * @name module:rules/AST_Debugger.rule
 * @event
 * @property {String} ruleName The string 'AST_Debugger'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor');

AST.registerRuleProcessor('AST_Debugger', function processRule() {

	this._preProcess();

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_Debugger');

	/*jshint debug: true*/
	debugger;

	RuleProcessor.fireRuleEvent(this, {}, true);

	this._postProcess();

	return ['normal', undefined, undefined];
});