/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * This rule represents the true literal
 *
 * @module rules/AST_False
 * @see ECMA-262 Spec Chapter 11.1.3
 */

/**
 * @event module:rules/AST_False.rule
 * @property {string} ruleName The string 'AST_False'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {string} file The file that the rule begins on.
 * @property {number} line The line of the file where the rule begins on.
 * @property {number} column The column of the file where the rule begins on.
 * @property {boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base');

AST.registerRuleProcessor('AST_False', function processRule() {

	var result;

	RuleProcessor.preProcess(this);

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_False');

	result = new Base.BooleanType(false);

	RuleProcessor.fireRuleEvent(this, {}, true);

	RuleProcessor.postProcess(this, result);

	return result;
});