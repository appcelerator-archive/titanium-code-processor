/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A with statement.
 *
 * @module rules/AST_With
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 12.10
 */

/**
 * @name module:rules/AST_With.rule
 * @event
 * @property {String} ruleName The string 'AST_With'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.ObjectType} contextObject The object used to create the lexical context. Only available
 *		post-evaluation.
 * @property {Array} result The result of evaluating the with block. Results of statements are typically
 *		3-tuples (in the form of an array), with the first entry being the type of return (typically 'normal'), followed
 *		by two entries that are rule specific. Only available post-evaluation.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Runtime = require('../Runtime'),
	Base = require('../Base');

AST.registerRuleProcessor('AST_With', function processRule() {

	this._preProcess();

	var obj,
		currentContext,
		oldEnv,
		newEnv,
		c;

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_With');

	obj = Base.toObject(Base.getValue(this.expression.processRule()));
	currentContext = Runtime.getCurrentContext();
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

	this._postProcess();

	return c;
});