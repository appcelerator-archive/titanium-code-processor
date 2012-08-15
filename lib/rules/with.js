/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

var path = require("path"),
	RuleProcessor = require("../RuleProcessor"),
	Runtime = require("../Runtime"),
	Exceptions = require("../Exceptions"),
	Base = require("../Base"),
	Context = require("../Context");

exports.processRule = function(ast) {
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
	var obj = Base.toObject(Base.getValue(RuleProcessor.processRule(ast[1]))),
		currentContext = Runtime.getCurrentContext(),
		oldEnv = currentContext.lexicalEnvironment,
		newEnv = Context.NewObjectEnvironment(obj, oldEnv),
		c;
	newEnv.provideThis = true;
	
	if (currentContext.strict) {
		throw new Exceptions.SyntaxError();
	}
	
	currentContext.lexicalEnvironment = newEnv;
	c = RuleProcessor.processRule(ast[2]);
	currentContext.lexicalEnvironment = oldEnv;
	
	RuleProcessor.fireRuleEvent(ast, {}, true);
	return c;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);