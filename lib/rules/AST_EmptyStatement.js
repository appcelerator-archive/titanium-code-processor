/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * An empty statement, a.k.a. an extra semicolon
 *
 * @module rules/AST_EmptyStatement
 * @see ECMA-262 Spec Chapter 11.15
 */

/**
 * @name module:rules/AST_EmptyStatement.rule
 * @event
 * @property {string} ruleName The string 'AST_EmptyStatement'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {string} file The file that the rule begins on.
 * @property {number} line The line of the file where the rule begins on.
 * @property {number} column The column of the file where the rule begins on.
 * @property {boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor');

AST.registerRuleProcessor('AST_EmptyStatement', function processRule() {

	RuleProcessor.preProcess(this);

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_EmptyStatement');
	RuleProcessor.fireRuleEvent(this, {}, true);

	RuleProcessor.postProcess(this);

	return ['normal', undefined, undefined];
});