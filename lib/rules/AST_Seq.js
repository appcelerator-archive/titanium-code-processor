/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * The comma operator. This operator is called the sequence operator in UglifyJS, but is called the comma operator in
 * the ECMA-262 spec.
 *
 * @module rules/AST_Seq
 * @see ECMA-262 Spec Chapter
 */

/**
 * @event module:rules/AST_Seq.rule
 * @property {string} ruleName The string 'AST_Seq'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {string} file The file that the rule begins on.
 * @property {number} line The line of the file where the rule begins on.
 * @property {number} column The column of the file where the rule begins on.
 * @property {boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:base.BaseType} result The value of the last expression in the comma separated expression pair.
 *		Only available post-evaluation.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base');

AST.registerRuleProcessor('AST_Seq', function processRule() {

	var result;

	RuleProcessor.preProcess(this);

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_Seq');

	// Note: Base.getValue() can have side-effects, so it must be called even though we don't use the value
	Base.getValue(this.car.processRule());
	result = Base.getValue(this.cdr.processRule());

	RuleProcessor.fireRuleEvent(this, {
		result: result
	}, true);

	RuleProcessor.postProcess(this);

	return result;
});