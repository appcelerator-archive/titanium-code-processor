/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

var path = require("path"),
	RuleProcessor = require("../RuleProcessor");

exports.processRule = function(ast) {
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
	var identifier = ast[1],
		formalParameterList = ast[2],
		functionBody = ast[3],
		context = Runtime.getCurrentContext(),
		strict = context.strict || !!(functionBody[0] && functionBody[0][0].name === "directive" && functionBody[0][1] === "use strict"),
		functionObject;
	
	if (strict) {
		if (identifier === "eval" || identifier === "arguments") {
			throw new Exceptions.SyntaxError();
		}
		for (var i = 0, len = formalParameterList.length; i < len; i++) {
			if (formalParameterList[i] === "eval" || formalParameterList[i] === "arguments") {
				throw new Exceptions.SyntaxError();
			}
		}
	}
		
	functionObject = new Context.FunctionType(formalParameterList, functionBody, context.lexicalEnvironment, strict);
	
	RuleProcessor.fireRuleEvent(ast, {}, true);
	return functionObject;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);