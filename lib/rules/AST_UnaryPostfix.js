/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A postfix operator (e.g. <code>i++</code>)
 *
 * @module rules/AST_UnaryPostfix
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 11.3
 */

/**
 * @name module:rules/AST_UnaryPostfix.rule
 * @event
 * @property {String} ruleName The string 'AST_UnaryPostfix'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.BaseType} previousValue The previous value of the identifier. Only available post-evaluation.
 * @property {module:Base.BaseType} result The new value of the identifier. Only available post-evaluation.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base'),
	Runtime = require('../Runtime');

AST.registerRuleProcessor('AST_UnaryPostfix', function processRule() {

	this._preProcess();

	var operator = this.operator,
		context,
		lhs,
		oldValue,
		newValue;

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_UnaryPostfix', operator);

	context = Runtime.getCurrentContext();
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

	this._postProcess();

	return oldValue;
});