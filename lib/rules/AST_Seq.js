/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * The comma operator. This operator is called the sequence operator in UglifyJS, but is called the comma operator in
 * the ECMA-262 spec.
 *
 * @module rules/AST_Seq
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter
 */

/**
 * @name module:rules/AST_Seq.rule
 * @event
 * @property {String} ruleName The string 'call'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.BaseType} result The value of the last expression in the comma separated expression pair.
 *		Only available post-evaluation.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base');

AST.registerRuleProcessor('AST_Seq', function processRule() {

	this._preProcess();

	var result;

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_Seq');

	// Note: Base.getValue() can have side-effects, so it must be called even though we don't use the value
	Base.getValue(this.car.processRule());
	result = Base.getValue(this.cdr.processRule());

	RuleProcessor.fireRuleEvent(this, {
		result: result
	}, true);

	this._postProcess();

	return result;
});