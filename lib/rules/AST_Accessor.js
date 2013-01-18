/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A function expression (function definitions are handled by {@link module:rules/defun}).
 *
 * @module rules/AST_Accessor
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 13
 */

/**
 * @name module:rules/AST_Accessor.rule
 * @event
 * @property {String} ruleName The string 'AST_Accessor'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.FunctionType} result The created function object. Only available post-evaluation.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base'),
	Runtime = require('../Runtime');

AST.registerRuleProcessor('AST_Accessor', function processRule() {

	this._preProcess();

	var formalParameterList = [],
		functionBody = this.body,
		context = Runtime.getCurrentContext(),
		strict = context.strict || RuleProcessor.isBlockStrict(this),
		functionObject;

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_Accessor');

	for(i = 0, len = this.argnames.length; i < len; i++) {
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
		functionObject = new Base.FunctionType(formalParameterList, functionBody, context.lexicalEnvironment, strict);
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

	this._postProcess();

	return functionObject;
});