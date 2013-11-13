/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A throw statement.
 *
 * @module rules/AST_Throw
 * @see ECMA-262 Spec Chapter
 */

/**
 * @event module:rules/AST_Throw.rule
 * @property {string} ruleName The string 'AST_Throw'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {string} file The file that the rule begins on.
 * @property {number} line The line of the file where the rule begins on.
 * @property {number} column The column of the file where the rule begins on.
 * @property {boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {Array} result The return tuple of evaluating the throw statement. Only available post-evaluation.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base');

AST.registerRuleProcessor('AST_Throw', function processRule() {

	var result;

	RuleProcessor.preProcess(this);

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_Throw');

	result = ['throw', Base.getValue(this.value.processRule()), undefined];
	RuleProcessor.fireRuleEvent(this, {
		result: result
	}, true);

	try {
		Base.throwException(result[1]);
	} finally {
		RuleProcessor.postProcess(this, result);
	}
});