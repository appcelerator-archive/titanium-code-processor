/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A labelled statement
 *
 * @module rules/AST_LabeledStatement
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 12.12
 */

/**
 * @name module:rules/AST_LabeledStatement.rule
 * @event
 * @property {String} ruleName The string 'AST_LabeledStatement'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {String} label The name of the label. Only available post-evaluation.
 * @property {Array} result The result of evaluating the loop. Results of statements are typically
 *		3-tuples (in the form of an array), with the first entry being the type of return (typically 'normal'), followed
 *		by two entries that are rule specific. Only available post-evaluation.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor');

AST.registerRuleProcessor('AST_LabeledStatement', function processRule() {

	this._preProcess();

	var label,
		result;

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_LabeledStatement', this.label.name);

	label = this.body._label = this.label.name;
	result = this.body.processRule();

	RuleProcessor.fireRuleEvent(this, {
		label: label,
		result: result
	}, true);

	this._postProcess();

	return result;
});