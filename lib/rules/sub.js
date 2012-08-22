/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * A reference to an object's property using brackets.
 * 
 * @module rules/sub
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 11.2.1
 */

/**
 * @name module:rules/sub.rule
 * @event
 * @property {String} ruleName The string "call"
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.ReferenceType} result The reference to the property. Call <code>Base.getValue(e.result)</code>
 *		to get the value of the reference. Only available post-evaluation.
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
exports.processRule = function(ast) {
	RuleProcessor.fireRuleEvent(ast, {}, false);
	debugger;
	// Get the base value and the property name
	var baseValue = Base.getValue(RuleProcessor.processRule(ast[1])),
		propertyNameString = typeof ast[2] === "string" ? ast[2] : Base.toString(Base.getValue(RuleProcessor.processRule(ast[2]))).value,
		result = new Base.ReferenceType();
	
	// Check if this is an unknown and short-circuit it
	if (Base.type(baseValue) === "Unknown") {
		result = new Base.UnknownType();
	} else {
		// Create the reference to the property
		Base.checkObjectCoercible(baseValue);
		result.baseValue = baseValue;
		result.referencedName = propertyNameString;
		result.strictReference = Runtime.getCurrentContext().strict;
	}
	
	RuleProcessor.fireRuleEvent(ast, {
		result: result
	}, true);
	return result;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);