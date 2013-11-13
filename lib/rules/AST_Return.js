/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A return statement in a function.
 *
 * @module rules/AST_Return
 * @see ECMA-262 Spec Chapter 12.9
 */

/**
 * @event module:rules/AST_Return.rule
 * @property {string} ruleName The string 'AST_Return'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {string} file The file that the rule begins on.
 * @property {number} line The line of the file where the rule begins on.
 * @property {number} column The column of the file where the rule begins on.
 * @property {boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.BaseType} result The return value. Only available post-evaluation.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base');

AST.registerRuleProcessor('AST_Return', function processRule() {

	var result;

	RuleProcessor.preProcess(this);

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_Return');

	// Make sure we are in a function
	if (!Base.inFunctionContext()) {
		Base.handleRecoverableNativeException('SyntaxError', 'Return must be called from within a function');
		result = new Base.UnknownType();
	} else {
		result = ['return', new Base.UndefinedType(), undefined];
		if (this.value) {
			result[1] = Base.getValue(this.value.processRule());
		}
	}

	RuleProcessor.fireRuleEvent(this, {
		result: result
	}, true);

	RuleProcessor.postProcess(this, result);

	return result;
});