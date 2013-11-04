/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Function definition.
 *
 * @module rules/AST_Defun
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 13
 */

/**
 * @name module:rules/AST_Defun.rule
 * @event
 * @property {String} ruleName The string 'AST_Defun'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {String} identifier The function identifier. Only available post-evaluation.
 * @property {Array.<String>} formalParameterList The list of parameters. Only available post-evaluation.
 * @property {Boolean} strict Indicates if the function is a strict mode function. Only available post-evaluation.
 * @property {module:Base.FunctionType} functionObject The function object. Only available post-evaluation.
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