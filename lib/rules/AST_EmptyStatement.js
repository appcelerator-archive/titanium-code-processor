/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * An empty statement, a.k.a. an extra semicolon
 *
 * @module rules/AST_EmptyStatement
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 11.15
 */

/**
 * @name module:rules/AST_EmptyStatement.rule
 * @event
 * @property {String} ruleName The string 'AST_EmptyStatement'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor');

AST.registerRuleProcessor('AST_EmptyStatement', function processRule() {

	this._preProcess();

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_EmptyStatement');
	RuleProcessor.fireRuleEvent(this, {}, true);

	this._postProcess();

	return ['normal', undefined, undefined];
});