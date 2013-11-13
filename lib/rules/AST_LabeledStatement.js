/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A labelled statement
 *
 * @module rules/AST_LabeledStatement
 * @see ECMA-262 Spec Chapter 12.12
 */

/**
 * @name module:rules/AST_LabeledStatement.rule
 * @event
 * @property {string} ruleName The string 'AST_LabeledStatement'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {string} file The file that the rule begins on.
 * @property {number} line The line of the file where the rule begins on.
 * @property {number} column The column of the file where the rule begins on.
 * @property {boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {string} label The name of the label. Only available post-evaluation.
 * @property {Array} result The return tuple of evaluating the loop. Only available post-evaluation.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor');

AST.registerRuleProcessor('AST_LabeledStatement', function processRule() {

	var label,
		result;

	RuleProcessor.preProcess(this);

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_LabeledStatement', this.label.name);

	label = this.body._label = this.label.name;
	result = this.body.processRule();

	RuleProcessor.fireRuleEvent(this, {
		label: label,
		result: result
	}, true);

	RuleProcessor.postProcess(this);

	return result;
});