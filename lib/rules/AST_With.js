/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A with statement.
 *
 * @module rules/AST_With
 * @see ECMA-262 Spec Chapter 12.10
 */

/**
 * @event module:rules/AST_With.rule
 * @property {string} ruleName The string 'AST_With'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {string} file The file that the rule begins on.
 * @property {number} line The line of the file where the rule begins on.
 * @property {number} column The column of the file where the rule begins on.
 * @property {boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.ObjectType} contextObject The object used to create the lexical context. Only available
 *		post-evaluation.
 * @property {Array} result The return tuple of evaluating the with block. Only available post-evaluation.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base');

AST.registerRuleProcessor('AST_With', function processRule() {

	var obj,
		currentContext,
		oldEnv,
		newEnv,
		c;

	RuleProcessor.preProcess(this);

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_With');

	obj = Base.toObject(Base.getValue(this.expression.processRule()));
	if (Base.type(obj) === 'Unknown') {
		this.expression._unknown = true;
	}
	currentContext = Base.getCurrentContext();
	oldEnv = currentContext.lexicalEnvironment;
	newEnv = Base.newObjectEnvironment(obj, oldEnv);
	newEnv.provideThis = true;

	if (currentContext.strict) {
		Base.throwNativeException('SyntaxError', 'With is not allowed in strict mode');
	}

	currentContext.lexicalEnvironment = newEnv;
	try {
		c = this.body.processRule();
	} finally {
		currentContext.lexicalEnvironment = oldEnv;
	}

	RuleProcessor.fireRuleEvent(this, {
		contextObject: obj,
		result: c
	}, true);

	RuleProcessor.postProcess(this);

	return c;
});