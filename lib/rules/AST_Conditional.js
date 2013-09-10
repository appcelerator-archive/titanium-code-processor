/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * The conditional (trinary) operator allows for conditional expressions
 *
 * @module rules/AST_Conditional
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 11.12
 */

/**
 * @name module:rules/AST_Conditional.rule
 * @event
 * @property {String} ruleName The string 'AST_Conditional'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.BaseType} conditional The value of the conditional. Only available post-evaluation.
 * @property {module:Base.BaseType} result The result of evaluating the conditiona. Only available post-evaluation.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base');

AST.registerRuleProcessor('AST_Conditional', function processRule() {

	var leftValue,
		result;

	RuleProcessor.preProcess(this);

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_Conditional');

	leftValue = Base.getValue(this.condition.processRule());

	if (Base.type(leftValue) === 'Unknown') {
		this._ambiguousBlock = true;
		this.condition._unknown = true;
		Base.enterAmbiguousBlock();
		Base.getValue(this.consequent.processRule());
		Base.getValue(this.alternative.processRule());
		result = new Base.UnknownType();
		Base.exitAmbiguousBlock();
	} else if (Base.toBoolean(leftValue).value) {
		result = Base.getValue(this.consequent.processRule());
		Base.enterSkippedMode();
		this.alternative.processRule();
		Base.exitSkippedMode();
	} else {
		result = Base.getValue(this.alternative.processRule());
		Base.enterSkippedMode();
		this.consequent.processRule();
		Base.exitSkippedMode();
	}

	RuleProcessor.fireRuleEvent(this, {
		conditional: leftValue,
		result: result
	}, true);

	RuleProcessor.postProcess(this, result);

	return result;
});