/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A function expression that's for a get/set accessor
 *
 * @module rules/AST_Accessor
 * @see ECMA-262 Spec Chapter 13
 */

/**
 * @event module:rules/AST_Accessor.rule
 * @property {string} ruleName The string 'AST_Accessor'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {string} file The file that the rule begins on.
 * @property {number} line The line of the file where the rule begins on.
 * @property {number} column The column of the file where the rule begins on.
 * @property {boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.FunctionType} result The created function object. Only available post-evaluation.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base');

AST.registerRuleProcessor('AST_Accessor', function processRule() {

	RuleProcessor.preProcess(this);

	var formalParameterList = [],
		context = Base.getCurrentContext(),
		strict = context.strict || RuleProcessor.isBlockStrict(this),
		functionObject;

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_Accessor');

	for (i = 0, len = this.argnames.length; i < len; i++) {
		formalParameterList.push(this.argnames[i].name);
	}

	try {
		if (strict) {
			for (var i = 0, len = formalParameterList.length; i < len; i++) {
				if (formalParameterList[i] === 'eval' || formalParameterList[i] === 'arguments') {
					Base.handleRecoverableNativeException('SyntaxError', formalParameterList[i] + ' is not a valid identifier name');
					throw 'Unknown';
				}
				if (formalParameterList.indexOf(formalParameterList[i], i + 1) !== -1) {
					Base.handleRecoverableNativeException('SyntaxError', 'Duplicate parameter names are not allowed in strict mode');
					throw 'Unknown';
				}
			}
		}
		functionObject = new Base.FunctionType(formalParameterList, this, context.lexicalEnvironment, strict);
	} catch(e) {
		if (e === 'Unknown') {
			functionObject = new Base.UnknownType();
		} else {
			throw e;
		}
	}

	RuleProcessor.fireRuleEvent(this, {
		result: functionObject
	}, true);

	RuleProcessor.postProcess(this, functionObject);

	return functionObject;
});