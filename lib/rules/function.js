/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A function expression (function definitions are handled by {@link module:rules/defun}).
 *
 * @module rules/function
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 13
 */

/**
 * @name module:rules/function.rule
 * @event
 * @property {String} ruleName The string 'call'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.FunctionType} result The created function object. Only available post-evaluation.
 */

var path = require('path'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base'),
	Runtime = require('../Runtime');

/**
 * Do not call directly. Call {@link RuleProcessor.processRule} instead.
 *
 * AST: [node-info, identifier <string | null>, formalParameterList <array[string]>, functionBody <array[ast]>]
 *
 * @private
 */
exports.processRule = processRule;
function processRule(ast) {
	
	var identifier = ast[1],
		formalParameterList = ast[2],
		functionBody = ast[3],
		context = Runtime.getCurrentContext(),
		strict = context.strict || RuleProcessor.isBlockStrict(functionBody),
		functionObject,
		funcEnv;
	
	RuleProcessor.fireRuleEvent(ast, {}, false);
	RuleProcessor.logRule('function', identifier);
	
	try {
		if (strict) {
			if (identifier === 'eval' || identifier === 'arguments') {
				Base.handleRecoverableNativeException('SyntaxError', identifier + ' is not a valid identifier name');
				throw 'Unknown';
			}
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
		if (identifier) {
			funcEnv = new Base.newDeclarativeEnvironment(context.lexicalEnvironment);
			funcEnv.envRec.createImmutableBinding(identifier);
			functionObject = new Base.FunctionType(formalParameterList, functionBody, funcEnv, strict);
			funcEnv.envRec.initializeImmutableBinding(identifier, functionObject);
		} else {
			functionObject = new Base.FunctionType(formalParameterList, functionBody, context.lexicalEnvironment, strict);
		}
	} catch(e) {
		if (e === 'Unknown') {
			functionObject = new Base.UnknownType();
		} else {
			throw e;
		}
	}
	
	RuleProcessor.fireRuleEvent(ast, {
		result: functionObject
	}, true);
	
	return functionObject;
}
RuleProcessor.registerRuleProcessor(path.basename(__filename, '.js'), exports);