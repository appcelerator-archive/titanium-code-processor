/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * This rule represents the undefined "literal." Technically it's not a literal, just a property of the global object,
 * but Uglify treats it as a literal, kinda. There is a rule definition, but it seems like it is ignored in favor of
 * AST_SymbolRef (which is technically the correct thing to do). Just in case, we support both formats.
 *
 * @module rules/AST_Undefined
 * @see ECMA-262 Spec Chapter 15.1.1.3
 */

/**
 * @name module:rules/AST_Undefined.rule
 * @event
 * @property {string} ruleName The string 'AST_Undefined'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {string} file The file that the rule begins on.
 * @property {number} line The line of the file where the rule begins on.
 * @property {number} column The column of the file where the rule begins on.
 * @property {boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base');

AST.registerRuleProcessor('AST_Undefined', function processRule() {

	var result;

	RuleProcessor.preProcess(this);

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_Undefined');

	result = new Base.UndefinedType();

	RuleProcessor.fireRuleEvent(this, {}, true);

	RuleProcessor.postProcess(this, result);

	return result;
});