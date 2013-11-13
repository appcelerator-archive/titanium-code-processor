/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A directive statement, namely 'use strict'. Note: there isn't an actual directive rule in the ECMA-262 spec
 *
 * @module rules/AST_Directive
 */

/**
 * @event module:rules/AST_Directive.rule
 * @property {string} ruleName The string 'AST_Directive'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {string} file The file that the rule begins on.
 * @property {number} line The line of the file where the rule begins on.
 * @property {number} column The column of the file where the rule begins on.
 * @property {boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.StringType} result The directive. Only available post-evaluation.
 */

var AST = require('../AST'),
	Base = require('../Base'),
	RuleProcessor = require('../RuleProcessor');

AST.registerRuleProcessor('AST_Directive', function processRule() {

	var result = ['normal', undefined, undefined],
		value;

	RuleProcessor.preProcess(this);

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_Directive', this.value);

	// This rule is not actually invoked directly, but is used instead in rules like 'AST_Toplevel' so we do nothing interesting here.

	result[1] = value = new Base.StringType(this.value);

	RuleProcessor.fireRuleEvent(this, {
		result: value
	}, true);

	RuleProcessor.postProcess(this, result);

	return result;
});