/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Function definition.
 *
 * @module rules/AST_Defun
 * @see ECMA-262 Spec Chapter 13
 */

/**
 * @event module:rules/AST_Defun.rule
 * @property {string} ruleName The string 'AST_Defun'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {string} file The file that the rule begins on.
 * @property {number} line The line of the file where the rule begins on.
 * @property {number} column The column of the file where the rule begins on.
 * @property {boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor');

AST.registerRuleProcessor('AST_Defun', function processRule() {

	RuleProcessor.preProcess(this);
	this._localVisualization = true;

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_Debugger');

	// Do nothing because this rule is handled at context creation time

	RuleProcessor.fireRuleEvent(this, {}, true);

	RuleProcessor.postProcess(this);

	return ['normal', undefined, undefined];
});