/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * Function definition.
 * 
 * @module rules/defun
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 13
 */

/**
 * @name module:rules/defun.rule
 * @event
 * @property {String} ruleName The string "defun"
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {String} identifier The function identifier. Only available post-evaluation.
 * @property {Array[String]} formalParameterList The list of parameters. Only available post-evaluation.
 * @property {Boolean} strict Indicates if the function is a strict mode function. Only available post-evaluation.
 * @property {module:Base.FunctionType} functionObject The function object. Only available post-evaluation.
 */

var path = require("path"),
	RuleProcessor = require("../RuleProcessor"),
	Base = require("../Base"),
	Runtime = require("../Runtime");

/**
 * Do not call directly. Call {@link RuleProcessor.processRule} instead.
 * 
 * @private
 */
exports.processRule = processRule;
function processRule(ast) {
	
	var identifier,
		formalParameterList,
		functionBody,
		context,
		strict,
		functionObject,
		i;
	
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
	identifier = ast[1];
	formalParameterList = ast[2];
	functionBody = ast[3];
	context = Runtime.getCurrentContext();
	strict = context.strict || !!(functionBody[0] && functionBody[0][0].name === "directive" && functionBody[0][1] === "use strict");
	
	if (strict) {
		if (identifier === "eval" || identifier === "arguments") {
			throw new Exceptions.SyntaxError();
		}
		for (i = 0, len = formalParameterList.length; i < len; i++) {
			if (formalParameterList[i] === "eval" || formalParameterList[i] === "arguments") {
				throw new Exceptions.SyntaxError();
			}
		}
	}
		
	functionObject = new Base.FunctionType(formalParameterList, functionBody, context.lexicalEnvironment, strict);
	
	RuleProcessor.fireRuleEvent(ast, {
		identifier: identifier,
		formalParameterList: formalParameterList,
		strict: strict,
		functionObject: functionObject
	}, true);
	
	return functionObject;
}
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);