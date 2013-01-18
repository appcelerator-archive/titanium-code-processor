/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * An if or if/else statement
 *
 * @module rules/AST_If
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 12.5
 */

/**
 * @name module:rules/AST_If.rule
 * @event
 * @property {String} ruleName The string 'AST_If'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.BaseType} conditional The value of the conditional. Only available post-evaluation.
 * @property {Array} result The result of evaluating the block. Results of statements are typically
 *		3-tuples (in the form of an array), with the first entry being the type of return (typically 'normal'), followed
 *		by two entries that are rule specific. Only available post-evaluation.
 */

var Base = require('../Base'),
	AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Runtime = require('../Runtime');

AST.registerRuleProcessor('AST_If', function processRule() {

	this._preProcess();

	var leftValue,
		result;

	function skippedNodeCallback (node) {
		node._skipped = true;
	}

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_If');

	leftValue = Base.getValue(this.condition.processRule());

	if (Base.type(leftValue) === 'Unknown') {
		this._ambiguousBlock = true;
		Runtime.enterAmbiguousBlock();
		this.body.processRule();
		if (this.alternative) {
			result = this.alternative.processRule();
		} else {
			result = ['normal', undefined, undefined];
		}
		Runtime.exitAmbiguousBlock();
	} else if (Base.toBoolean(leftValue).value) {
		result = this.body.processRule();
		if (this.alternative) {
			AST.walk(this.alternative, [
				{
					callback: skippedNodeCallback
				}
			]);
		}
	} else {
		AST.walk(this.body, [
			{
				callback: skippedNodeCallback
			}
		]);
		if (this.alternative) {
			result = this.alternative.processRule();
		} else {
			result = ['normal', undefined, undefined];
		}
	}

	RuleProcessor.fireRuleEvent(this, {
		conditional: leftValue,
		result: result
	}, true);

	this._postProcess();

	return result;
});