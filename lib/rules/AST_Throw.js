/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A throw statement.
 *
 * @module rules/AST_Throw
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter
 */

/**
 * @name module:rules/AST_Throw.rule
 * @event
 * @property {String} ruleName The string 'AST_Throw'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {Array} result The result of evaluating the throw statement. Results of throw statements are 3-tuples (in the
 *		form of an array), with the first entry being 'throw', the second being the value of the throw, and the third
 *		being undefined. Only available post-evaluation.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base');

AST.registerRuleProcessor('AST_Throw', function processRule() {

	this._preProcess();

	var result;

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_Throw');

	result = ['throw', Base.getValue(this.value.processRule()), undefined];
	RuleProcessor.fireRuleEvent(this, {
		result: result
	}, true);

	this._postProcess();

	Base.throwException(result[1]);
});