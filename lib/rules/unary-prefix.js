/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

var path = require("path"),
	RuleProcessor = require("../RuleProcessor"),
	Base = require("../Base"),
	Context = require("../Context"),
	Exceptions = require("../Exceptions");

exports.processRule = function(ast) {
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
	var operator = ast[1],
		expr = RuleProcessor.processRule(ast[2]),
		result;
	if (operator === "delete") {
		if (Base.type(expr) !== "Reference") {
			result = true;
		} else if (Base.isUnresolvableReference(expr)) {
			if (Base.isStrictReference(expr)) {
				throw new Exceptions.ReferenceError();
			}
			result = true;
		} else if(Base.isPropertyReference(expr)) {
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
		if (type(expr) === "Reference" && Base.isUnresolvableReference(expr)) {
			result.value = "undefined";
		} else {
			if (type(expr) === "Reference") {
				expr = Base.getBase(expr);
			}
			result.value = Base.type(expr);
			result.value = result.value.toLowerCase();
		}
	} else if (operator === "++" || operator === "--") {
		
		// Make sure ref is valid
		if (Base.type(expr) === "Reference" && Base.isStrictReference(expr) && 
				!Base.type(Base.getBase(expr)) && 
				!~["eval", "arguments"].indexOf(Base.getReferencedName(expr))) {
			throw new Exceptions.ReferenceError();
		}
		
		var oldValue = Base.toNumber(Base.getValue(expr)),
			newValue = new Base.NumberType();
		if (operator === "++") {
			newValue.value = oldValue.value + 1;
		} else if (operator === "--") {
			newValue.value = oldValue.value - 1;
		} else {
			throw new Error("Internal Error: An unexpected operator '" + operator + "' was encountered in a unary expression.");
		}
		
		Base.putValue(expr, newValue);
		
		result = newValue;
	} else if (operator === "+") {
		result = new Base.NumberType();
		result.value = Base.toNumber(Base.getValue(expr)).value;
	} else if (operator === "-") {
		result = new Base.NumberType();
		result.value = -Base.toNumber(Base.getValue(expr)).value;
	} else if (operator === "~") {
		result = new Base.NumberType();
		result.value = ~Base.toInt32(Base.getValue(expr)).value;
	} else if (operator === "!") {
		result = new Base.NumberType();
		result.value = !Base.toBoolean(Base.getValue(expr)).value;
	} else {
		throw new Error("Internal Error: An unexpected operator '" + operator + "' was encountered in a unary expression.");
	}
	
	RuleProcessor.fireRuleEvent(ast, {}, true);
	return result;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);