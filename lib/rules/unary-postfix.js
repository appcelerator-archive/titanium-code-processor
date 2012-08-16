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
	Runtime = require("../Runtime");

exports.processRule = function(ast) {
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
	var operator = ast[1],
		context = Runtime.getCurrentContext(),
		lhs = RuleProcessor.processRule(ast[2]);
	
	// Check if the value cannot be calculated properly
	if (Base.type(Base.getValue(lhs)) === "Unknown" || Runtime.ambiguousCode) {
		newValue = new Base.UnknownType();
	} else {
		// Make sure lhs is valid
		if (Base.type(lhs) === "Reference" && Base.isStrictReference(lhs) && 
				!Base.type(Base.getBase(lhs)) && 
				!~["eval", "arguments"].indexOf(Base.getReferencedName(lhs))) {
			throw new Exceptions.ReferenceError();
		}
		
		// Calculate the new value
		var oldValue = Base.toNumber(Base.getValue(lhs)),
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
	
	RuleProcessor.fireRuleEvent(ast, {}, true);
	
	return newValue;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);