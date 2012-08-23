/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * Variable initializations. Note that variable declarations are handled when entering a context, NOT when the rule is
 * processed.
 * 
 * @module rules/var
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 12.2
 */

/**
 * @name module:rules/var.rule
 * @event
 * @property {String} ruleName The string "call"
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {Array[Object]} initializations The variables that were initialized. If a variable did not have an 
 *		initializer, then it is not included in the array. Each entry in the array contains two properties: reference and 
 *		value. Only available post-evaluation.
 * @property {module:Base.ReferenceType} initializations.reference The reference being initialized. Only available post-evaluation.
 * @property {module:Base.BaseType} initializations.value The value that the reference was initialized to. Only available post-evaluation.
 */

var path = require("path"),
	RuleProcessor = require("../RuleProcessor"),
	Base = require("../Base"),
	Context = require("../Context"),
	Runtime = require("../Runtime");

/**
 * Do not call directly. Call {@link RuleProcessor.processRule} instead.
 * 
 * @private
 */
exports.processRule = function processRule(ast) {
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
	var children = ast[1],
		i = 0,
		len = children.length,
		context = Runtime.getCurrentContext(),
		reference,
		value,
		initializations = [];
	for (; i < len; i++) {
		if (children[i][1]) {
			reference = Context.getIdentifierReference(context.lexicalEnvironment, children[i][0], context.strict);
			value = Runtime.ambiguousCode ? new Base.UnknownType() : Base.getValue(RuleProcessor.processRule(children[i][1]));
			Base.putValue(reference, value);
			initializations.push({
				reference: reference,
				value: value
			});
		}
	}
	
	RuleProcessor.fireRuleEvent(ast, {
		initializations: initializations
	}, true);
	return ["normal", undefined, undefined];
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);