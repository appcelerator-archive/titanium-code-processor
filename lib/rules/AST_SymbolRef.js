/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A reference to a value (i.e. an identifier that isn't part of a declaration)
 *
 * @module rules/AST_SymbolRef
 * @see ECMA-262 Spec Chapter 11.1.2
 */

/**
 * @name module:rules/AST_SymbolRef.rule
 * @event
 * @property {string} ruleName The string 'AST_SymbolRef'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {string} file The file that the rule begins on.
 * @property {number} line The line of the file where the rule begins on.
 * @property {number} column The column of the file where the rule begins on.
 * @property {boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.BaseType} result The value of the reference. Only available post-evaluation.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base');

AST.registerRuleProcessor('AST_SymbolRef', function processRule() {

	RuleProcessor.preProcess(this);

	var name = this.name,
		context = Base.getCurrentContext(),
		result;

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_SymbolRef', name);

	result = Base.getIdentifierReference(context.lexicalEnvironment, name, context.strict);

	RuleProcessor.fireRuleEvent(this, {
		result: result
	}, true);

	RuleProcessor.postProcess(this, result);

	return result;
});