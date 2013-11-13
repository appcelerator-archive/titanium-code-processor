/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * This rule represents the NaN "literal." Technically it's not a literal, just a property of the global object, but
 * Uglify treats it as a literal
 *
 * @module rules/AST_NaN
 * @see ECMA-262 Spec Chapter 15.1.1.2
 */

/**
 * @name module:rules/AST_NaN.rule
 * @event
 * @property {string} ruleName The string 'AST_NaN'
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

AST.registerRuleProcessor('AST_NaN', function processRule() {

	var result;

	RuleProcessor.preProcess(this);

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_NaN');

	result = new Base.NumberType(NaN);

	RuleProcessor.fireRuleEvent(this, {}, true);

	RuleProcessor.postProcess(this, result);

	return result;
});