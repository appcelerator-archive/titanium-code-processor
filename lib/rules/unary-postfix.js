/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * A postfix operator (e.g. <code>i++</code>)
 * 
 * @module rules/unary-postfix
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 11.3
 */

/**
 * @name module:rules/unary-postfix.rule
 * @event
 * @property {String} ruleName The string "call"
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.BaseType} previousValue The previous value of the identifier. Only available post-evaluation.
 * @property {module:Base.BaseType} result The new value of the identifier. Only available post-evaluation.
 */

var path = require("path"),
	RuleProcessor = require("../RuleProcessor"),
	Base = require("../Base"),
	Runtime = require("../Runtime"),
	Exceptions = require("../Exceptions");

/**
 * Do not call directly. Call {@link RuleProcessor.processRule} instead.
 * 
 * AST: [node-info, operator <string>, lhs <ast>]
 * 
 * @private
 */
exports.processRule = processRule;
function processRule(ast) {
	
	var operator = ast[1],
		context,
		lhs,
		oldValue,
		newValue;
	
	RuleProcessor.fireRuleEvent(ast, {}, false);
	RuleProcessor.logRule('unary-postfix', operator);

	context = Runtime.getCurrentContext();
	lhs = RuleProcessor.processRule(ast[2]);
	
	// Check if the value cannot be calculated properly
	if (Base.type(Base.getValue(lhs)) === "Unknown" || Base.type(lhs) === "Unknown") {
		newValue = new Base.UnknownType();
	} else {
		// Make sure lhs is valid
		if (Base.type(lhs) === "Reference" && Base.isStrictReference(lhs) && 
				!Base.type(Base.getBase(lhs)) && 
				!~["eval", "arguments"].indexOf(Base.getReferencedName(lhs))) {
			throw new Exceptions.ReferenceError(Base.getReferencedName(lhs) + ' is not a valid identifier name');
		}
		
		// Calculate the new value
		oldValue = Base.toNumber(Base.getValue(lhs));
		newValue = new Base.NumberType();
		if (operator === "++") {
			newValue.value = oldValue.value + 1;
		} else if (operator === "--") {
			newValue.value = oldValue.value - 1;
		} else {
			throw new Error("Internal Error: An unexpected operator '" + operator + "' was encountered in a unary post-fix expression.");
		}
	}
	
	Base.putValue(lhs, newValue);
	
	RuleProcessor.fireRuleEvent(ast, {
		previousValue: Base.getValue(lhs),
		result: newValue
	}, true);
	
	return newValue;
}
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);