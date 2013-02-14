/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * The top level statement in a file. The ECMA-262 sdec calls this the 'Program' rule.
 *
 * @module rules/AST_Toplevel
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 14
 */

/**
 * @name module:rules/AST_Toplevel.rule
 * @event
 * @property {String} ruleName The string 'AST_Toplevel'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {Array} result The result of evaluating the block. Results of statements are typically
 *		3-tuples (in the form of an array), with the first entry being the type of return (typically 'normal'), followed
 *		by two entries that are rule specific. Only available post-evaluation.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor');

AST.registerRuleProcessor('AST_Toplevel', function processRule() {

	this._preProcess();

	var result = ['normal', undefined, undefined],
		children = this.body;

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_Toplevel');

	// Process the rule, if there are any children
	if (children.length) {
		result = RuleProcessor.processBlock(children);
	}

	RuleProcessor.fireRuleEvent(this, {
		result: result
	}, true);

	this._postProcess();

	return result;
});