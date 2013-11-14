/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A postfix operator (e.g. <code>i++</code>)
 *
 * @module rules/AST_UnaryPostfix
 * @see ECMA-262 Spec Chapter 11.3
 */

/**
 * @event module:rules/AST_UnaryPostfix.rule
 * @property {string} ruleName The string 'AST_UnaryPostfix'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {string} file The file that the rule begins on.
 * @property {number} line The line of the file where the rule begins on.
 * @property {number} column The column of the file where the rule begins on.
 * @property {boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:base.BaseType} previousValue The previous value of the identifier. Only available post-evaluation.
 * @property {module:base.BaseType} result The new value of the identifier. Only available post-evaluation.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base');

AST.registerRuleProcessor('AST_UnaryPostfix', function processRule() {

	var operator = this.operator,
		context,
		lhs,
		oldValue,
		newValue;

	RuleProcessor.preProcess(this);

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_UnaryPostfix', operator);

	context = Base.getCurrentContext();
	lhs = this.expression.processRule();
	oldValue = Base.toNumber(Base.getValue(lhs));

	// Check if the value cannot be calculated properly
	if (Base.type(oldValue) === 'Unknown') {
		newValue = new Base.UnknownType();
	} else if (Base.type(lhs) === 'Reference' && Base.isStrictReference(lhs) &&
			!Base.type(Base.getBase(lhs)) &&
			~['eval', 'arguments'].indexOf(Base.getReferencedName(lhs))) {
		Base.handleRecoverableNativeException('SyntaxError', Base.getReferencedName(lhs) + ' is not a valid identifier name');
		newValue = new Base.UnknownType();
	} else {

		// Calculate the new value
		newValue = new Base.NumberType();
		if (operator === '++') {
			newValue.value = oldValue.value + 1;
		} else if (operator === '--') {
			newValue.value = oldValue.value - 1;
		} else {
			throw new Error('Internal Error: An unexpected operator "' + operator + '" was encountered in a unary post-fix expression.');
		}
	}

	Base.putValue(lhs, newValue);

	RuleProcessor.fireRuleEvent(this, {
		previousValue: Base.getValue(lhs),
		result: newValue
	}, true);

	RuleProcessor.postProcess(this, oldValue);

	return oldValue;
});