/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

var path = require("path"),
	RuleProcessor = require("../RuleProcessor"),
	Context = require("../Context"),
	Runtime = require("../Runtime"),
	block = require("./block");

exports.processRule = function(ast) {
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
	var	tryBlock = ast[1],
		catchBlock = ast[2],
		finallyBlock = ast[3],
		b = block.processBlock(tryBlock),
		c,
		f,
		result;
		
	function evalCatch(param) {
		var identifier = catchBlock[0],
			currentContext = Runtime.getCurrentContext(),
			oldEnv = currentContext.lexicalEnvironment,
			catchEnv = Context.NewDeclarativeEnvironment(oldEnv);
		catchEnv.envRec.createMutableBinding(identifier);
		catchEnv.envRec.setMutableBinding(identifier, param, false);
		currentContext.lexicalEnvironment = catchEnv;
		result = block.processBlock(catchBlock[1]);
		currentContext.lexicalEnvironment = oldEnv;
	}
	
	if (catchBlock && tryBlock) {
		if (b[0] === "throw") {
			c = evalCatch(b[1]);
		} else {
			c = b;
		}
		f = block.processBlock(finallyBlock);
		if (f[0] === "normal") {
			result = c;
		} else {
			result = f;
		}
	} else if (catchBlock) {
		if (b[0] === "throw") {
			result = evalCatch(b[1]);
		} else {
			result = b;
		}
	} else if (tryBlock) {
		f = block.processBlock(finallyBlock);
		if (f[0] === "normal") {
			result = b;
		} else {
			result = f;
		}
	}
	
	RuleProcessor.fireRuleEvent(ast, {}, true);
	return result;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);