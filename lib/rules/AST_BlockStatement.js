/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A block is a collection of 0 or more statements.
 *
 * @module rules/AST_BlockStatement
 * @see ECMA-262 Spec Chapter 12.1
 */

/**
 * @event module:rules/AST_BlockStatement.rule
 * @property {string} ruleName The string 'AST_BlockStatement'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {string} file The file that the rule begins on.
 * @property {number} line The line of the file where the rule begins on.
 * @property {number} column The column of the file where the rule begins on.
 * @property {boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {Array} result The result of evaluating the block in the form of a return tuple
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor');

AST.registerRuleProcessor('AST_BlockStatement', function processRule() {

	var result;

	RuleProcessor.preProcess(this);

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_BlockStatement');

	result = RuleProcessor.processBlock(this.body);

	RuleProcessor.fireRuleEvent(this, {
		result: result
	}, true);

	RuleProcessor.postProcess(this);

	return result;
});