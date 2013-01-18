/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A directive statement, namely 'use strict'. Note: there isn't an actual directive rule in the ECMA-262 spec
 *
 * @module rules/AST_Directive
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

/**
 * @name module:rules/AST_Directive.rule
 * @event
 * @property {String} ruleName The string 'AST_Directive'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.StringType} result The directive. Only available post-evaluation.
 */

var AST = require('../AST'),
	Base = require('../Base'),
	RuleProcessor = require('../RuleProcessor');

AST.registerRuleProcessor('AST_Directive', function processRule() {

	this._preProcess();

	var value;

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_Directive', this.value);

	// This rule is not actually invoked directly, but is used instead in rules like 'AST_Toplevel' so we do nothing interesting here.

	value = new Base.StringType(this.value);

	RuleProcessor.fireRuleEvent(this, {
		result: value
	}, true);

	this._postProcess();

	return ['normal', value, undefined];
});