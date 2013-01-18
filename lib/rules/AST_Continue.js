/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * The continue statement is used to skip the rest of a loop and continue with the next iteration
 *
 * @module rules/AST_Continue
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 12.7
 */

/**
 * @name module:rules/AST_Continue.rule
 * @event
 * @property {String} ruleName The string 'AST_Continue'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {Array} result The result of evaluating the continue. The result is a 3-tuple consisting of
 *		['continue', label if supplied or undefined, undefined]. Only available post-evaluation.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor');

AST.registerRuleProcessor('AST_Continue', function processRule() {

	this._preProcess();

	var result = ['continue', undefined, this.label ? this.label.name : undefined];

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_Continue', result[2]);

	RuleProcessor.fireRuleEvent(this, {
		result: result
	}, true);

	this._postProcess();

	return result;
});