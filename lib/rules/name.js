/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * A reference to a name. This rule is actually two ECMA-262 rules merged into one: literal references to undefined, 
 * null, true, false, and variable references.
 * 
 * @module rules/name
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapters 11.1.2 and 11.1.3
 */

/**
 * @name module:rules/name.rule
 * @event
 * @property {String} ruleName The string "call"
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.BaseType} result The value of the name. In the case of a literal reference, a new instance of
 *		the appropriate type is created. Only available post-evaluation.
 */

var path = require("path"),
	RuleProcessor = require("../RuleProcessor"),
	Base = require("../Base"),
	Runtime = require("../Runtime");

/**
 * Do not call directly. Call {@link RuleProcessor.processRule} instead.
 * 
 * AST: [node-info, name <string>]
 * 
 * @private
 */
exports.processRule = processRule;
function processRule(ast) {
	
	var name = ast[1],
		context = Runtime.getCurrentContext(),
		result;
	
	RuleProcessor.fireRuleEvent(ast, {}, false);
	RuleProcessor.logRule('name', name);
	
	if (name === "true" || name === "false") {
		result = new Base.BooleanType(name === "true" ? true : false);
	} else if (name === "undefined") {
		result = new Base.UndefinedType();
	} else if (name === "null") {
		result = new Base.NullType();
	} else if (name === "this") {
		result = context.thisBinding;
	} else {
		result = Base.getIdentifierReference(context.lexicalEnvironment, name, context.strict);
	}
	
	RuleProcessor.fireRuleEvent(ast, {
		result: result
	}, true);
	
	return result;
}
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);