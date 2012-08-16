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
	Runtime = require("../Runtime"),
	Exceptions = require("../Exceptions");

exports.processRule = function(ast) {
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
	var operator = ast[1],
		context = Runtime.getCurrentContext(),
		leftReference = RuleProcessor.processRule(ast[2]),
		leftValue = Base.getValue(leftReference),
		leftType = Base.type(leftValue),
		rightReference = RuleProcessor.processRule(ast[3]),
		rightValue = Base.getValue(rightReference),
		rightType = Base.type(rightValue),
		result = rightValue;
	
	// Check if the value cannot be calculated properly
	if (leftType === "Unknown" || rightType === "Unknown" || Runtime.ambiguousCode) {
		result = new Base.UnknownType();
		Base.putValue(leftReference, result);
	} else {
	
		// Make sure leftReference is valid
		if (Base.type(leftReference) === "Reference" && Base.isStrictReference(leftReference) && 
				!Base.type(Base.getBase(leftReference)) && 
				!~["eval", "arguments"].indexOf(Base.getReferencedName(leftReference))) {
			throw new Exceptions.ReferenceError();
		}
		
		// Calculate the value by faking a binary rule, if it needs to be calculated
		if (typeof operator === "string") {
			if (~["*", "/", "%", "-", "<<", ">>", ">>>", "&", "|", "^"].indexOf(operator)) {
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
					case "<<": 
						result.value = Base.toInt32(leftValue).value << (Base.toUint32(rightValue).value & 0x1F);
						break;
					case ">>": 
						result.value = Base.toInt32(leftValue).value >> (Base.toUint32(rightValue).value & 0x1F);
						break;
					case ">>>": 
						result.value = Base.toUint32(leftValue).value >>> (Base.toUint32(rightValue).value & 0x1F);
						break;
					case "&": 
						result.value = Base.toInt32(leftValue).value & (Base.toInt32(rightValue).value);
						break;
					case "|": 
						result.value = Base.toInt32(leftValue).value | (Base.toInt32(rightValue).value);
						break;
					case "^": 
						result.value = Base.toInt32(leftValue).value ^ (Base.toInt32(rightValue).value);
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
			} else if (~["<", ">", "<=", ">=", "instanceof", "in", "==", "===", "!=", "!=="].indexOf(operator)) {
				
				var leftPrimitive = Base.toPrimitive(leftValue),
					rightPrimitive = Base.toPrimitive(rightValue);
				result = new Base.BooleanType();
				switch(operator) {
					case "<": 
						result.value = leftPrimitive.value < rightPrimitive.value;
						break;
					case ">": 
						result.value = leftPrimitive.value > rightPrimitive.value;
						break;
					case "<=": 
						result.value = leftPrimitive.value <= rightPrimitive.value;
						break;
					case ">=": 
						result.value = leftPrimitive.value >= rightPrimitive.value;
						break;
					case "isntanceof":
						if (Base.type(rightValue) !== "Object" || !rightValue.hasInstance) {
							throw new Exceptions.TypeError();
						}
						result.value = rightValue.hasInstance(leftValue);
						break;
					case "in": 
						if (Base.type(rightValue) !== "Object") {
							throw new Exceptions.TypeError();
						}
						result.value = rightValue.hasProperty(Base.toString(leftValue).value);
						break;
					case "==": 
						result.value = leftPrimitive.value == rightPrimitive.value;
						break;
					case "===": 
						result.value = leftPrimitive.value === rightPrimitive.value;
						break;
					case "!=": 
						result.value = leftPrimitive.value != rightPrimitive.value;
						break;
					case "!==": 
						result.value = leftPrimitive.value !== rightPrimitive.value;
						break;
				}
			} else if (operator === "&&") {
				if (!Base.toBoolean(leftValue).value) {
					result = leftValue;
				} else {
					result = rightValue;
				}
			} else if (operator === "||") {
				if (Base.toBoolean(leftValue).value) {
					result = leftValue;
				} else {
					result = rightValue;
				}
			} else {
				throw new Error("Internal Error: An unexpected operator '" + operator + "' was encountered in a binary expression.");
			}
		}
		
		Base.putValue(leftReference, result);
	}
	
	RuleProcessor.fireRuleEvent(ast, {}, true);
	
	return result;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);