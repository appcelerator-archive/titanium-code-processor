/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * A prefix operator (e.g. <code>!a</code>).
 * 
 * @module rules/unary-prefix
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 11.4
 */

/**
 * @name module:rules/unary-prefix.rule
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
	Exceptions = require("../Exceptions"),
	Runtime = require("../Runtime");

/**
 * Do not call directly. Call {@link RuleProcessor.processRule} instead.
 * 
 * @private
 */
exports.processRule = processRule;
function processRule(ast) {
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
	var operator = ast[1],
		expr = RuleProcessor.processRule(ast[2]),
		result,
		newValue;
	if (Base.type(Base.getValue(expr)) === "Unknown") {
		result = new Base.UnknownType();
	} else if (operator === "delete") {
		if (Base.type(expr) !== "Reference") {
			result = true;
		} else if (Base.isUnresolvableReference(expr)) {
			if (Base.isStrictReference(expr)) {
				throw new Exceptions.ReferenceError();
			}
			result = true;
		} else if (Base.isPropertyReference(expr)) {
			result = Base.toObject(Base.getBase(expr))["delete"](Base.getReferencedName(expr), Base.isStrictReference(expr));
		} else {
			if (Base.isStrictReference(expr)) {
				throw new Exceptions.SyntaxError();
			}
			result = Base.getBase(expr).deleteBinding(Base.getReferencedName(expr));
		}
	} else if (operator === "void") {
		Base.getValue(expr); // Must be called even though it isn't used because of the possibility of side-effects
		result = new Base.UndefinedType();
	} else if (operator === "typeof") {
		result = new Base.StringType();
		if (Base.type(expr) === "Reference" && Base.isUnresolvableReference(expr)) {
			result.value = "undefined";
		} else {
			expr = Base.getValue(expr);
			result.value = Base.type(expr);
			result.value = result.value.toLowerCase();
		}
	} else if (operator === "++" || operator === "--") {
		
		// Check if the value cannot be calculated properly
		if (Runtime.ambiguousCode) {
			newValue = new Base.UnknownType();
		} else {
		
			// Make sure ref is valid
			if (Base.type(expr) === "Reference" && Base.isStrictReference(expr) && 
					!Base.type(Base.getBase(expr)) && 
					!~["eval", "arguments"].indexOf(Base.getReferencedName(expr))) {
				throw new Exceptions.ReferenceError();
			}
			
			var oldValue = Base.toNumber(Base.getValue(expr));
			newValue = new Base.NumberType();
			if (operator === "++") {
				newValue.value = oldValue.value + 1;
			} else if (operator === "--") {
				newValue.value = oldValue.value - 1;
			} else {
				throw new Error("Internal Error: An unexpected operator '" + operator + "' was encountered in a unary expression.");
			}
		}
		
		Base.putValue(expr, newValue);
		
		result = newValue;
	} else if (operator === "+") {
		result = new Base.NumberType(Base.toNumber(Base.getValue(expr)).value);
	} else if (operator === "-") {
		result = new Base.NumberType(-Base.toNumber(Base.getValue(expr)).value);
	} else if (operator === "~") {
		result = new Base.NumberType(~Base.toInt32(Base.getValue(expr)).value);
	} else if (operator === "!") {
		result = new Base.NumberType(!Base.toBoolean(Base.getValue(expr)).value);
	} else {
		throw new Error("Internal Error: An unexpected operator '" + operator + "' was encountered in a unary expression.");
	}
	
	RuleProcessor.fireRuleEvent(ast, {
		previousValue: Base.getValue(expr),
		result: result
	}, true);
	return result;
}
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);