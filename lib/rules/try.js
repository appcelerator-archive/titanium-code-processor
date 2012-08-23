/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * A try statement.
 * 
 * @module rules/try
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 12.14
 */

/**
 * @name module:rules/try.rule
 * @event
 * @property {String} ruleName The string "call"
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {{@link module:Base.BaseType} | undefined} exception The exception, if one was thrown, else undefined. 
 *		Only available post-evaluation.
 */

var path = require("path"),
	RuleProcessor = require("../RuleProcessor"),
	Context = require("../Context"),
	Runtime = require("../Runtime"),
	block = require("./block");

/**
 * Do not call directly. Call {@link RuleProcessor.processRule} instead.
 * 
 * @private
 */
exports.processRule = function processRule(ast) {
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
	var	tryBlock = ast[1],
		catchBlock = ast[2],
		finallyBlock = ast[3],
		b = block.processBlock(tryBlock),
		c,
		f,
		result,
		exception;
		
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
		exception = param;
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
	
	RuleProcessor.fireRuleEvent(ast, {
		exception: exception,
		result: result
	}, true);
	return result;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);