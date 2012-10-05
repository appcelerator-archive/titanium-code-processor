/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * The top level statement in a file. The ECMA-262 sdec calls this the "Program" rule.
 * 
 * @module rules/toplevel
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 14
 */

/**
 * @name module:rules/toplevel.rule
 * @event
 * @property {String} ruleName The string "call"
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {Array} result The result of evaluating the block. Results of statements are typically 
 *		3-tuples (in the form of an array), with the first entry being the type of return (typically "normal"), followed
 *		by two entries that are rule specific. Only available post-evaluation.
 */

var path = require("path"),
	RuleProcessor = require("../RuleProcessor"),
	Runtime = require("../Runtime"),
	Base = require("../Base"),
	block = require("./block");

/**
 * Do not call directly. Call {@link RuleProcessor.processRule} instead.
 * 
 * AST: [node-info, statements <array[ast]>]
 * 
 * @private
 */
exports.processRule = processRule;
function processRule(ast) {
	
	// If the file contains no text, then length is 0 and we don't need to process it
	var result = ["normal", undefined, undefined],
		_module,
		_exports,
		children = ast[1],
		strict,
		context,
		envRec;
	
	RuleProcessor.fireRuleEvent(ast, {}, false);
			
	if (ast[1].length) {
	
		// Create the context, checking for strict mode
		strict = children[0][0].name === "directive" && children[0][1] === "use strict";
		context = Base.createGlobalContext(ast, strict);
		envRec = context.lexicalEnvironment.envRec;
		if (!ast.useCurrentContext) {
			Runtime.contextStack.push(context);
		}
		
		if (ast.createExports) {
			_module = new Base.ObjectType(),
			_exports = new Base.ObjectType(),
			
			_module.put("exports", _exports, false);
			
			envRec.createMutableBinding("module", true);
			envRec.setMutableBinding("module", _module);
			envRec.createMutableBinding("exports", true);
			envRec.setMutableBinding("exports", _exports);
		}
		
		// Evaluate the children
		result = block.processBlock(children);
		
		if (!ast.useCurrentContext) {
			Runtime.contextStack.pop();
		}
		if (ast.createExports) {
			result[1] = _module.get("exports");
		}
	}
	
	RuleProcessor.fireRuleEvent(ast, {
		result: result
	}, true);
	
	return result;
}
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);