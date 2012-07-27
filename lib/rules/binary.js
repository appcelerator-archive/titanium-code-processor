/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

var path = require("path"),
	RuleProcessor = require("../RuleProcessor"),
	Base = require("../Base");

exports.processRule = function(ast) {
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
	var operator = ast[1],
		leftValue = Base.getValue(RuleProcessor.processRule(ast[2])),
		leftType = Base.type(leftValue),
		rightValue = Base.getValue(RuleProcessor.processRule(ast[3])),
		rightType = Base.type(rightValue),
		result;
	
	if (leftType === "Unknown" || rightType === "Unknown") {
		result = new Base.UnknownType();
	} else if (~["*", "/", "%", "-"].indexOf(operator)) {
		result = new Base.NumberType();
		switch(operator) {
			case "*": 
				result.value = Base.toNumber(leftValue).value * Base.toNumber(rightValue).value; 
				break;
			case "/": 
				result.value = Base.toNumber(leftValue).value / Base.toNumber(rightValue).value; 
				break;
			case "%": 
				result.value = Base.toNumber(leftValue).value % Base.toNumber(rightValue).value; 
				break;
			case "-": 
				result.value = Base.toNumber(leftValue).value - Base.toNumber(rightValue).value; 
				break;
		}
	} else if (operator === "+") {
		var leftPrimitive = Base.toPrimitive(leftValue),
			rightPrimitive = Base.toPrimitive(rightValue);
		
		if (Base.type(leftPrimitive) === "String" || Base.type(rightPrimitive) === "String") {
			result = new Base.StringType();
			result.value = Base.toString(leftValue).value + Base.toString(rightValue).value;
		} else {
			result = new Base.NumberType();
			result.value = Base.toNumber(leftValue).value + Base.toNumber(rightValue).value;
		}
	}
	
	// TODO:
	// << >> >>>
	// < > <= >= instanceof in
	// == != === !== 
	// & | ^
	// && || 
	
	RuleProcessor.fireRuleEvent(ast, {}, true);
	return result;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);