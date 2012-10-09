/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * An assignment is one including the '=' symbol and and optional compound operator, such as '+='
 * 
 * @module rules/assign
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 11.13
 */

/**
 * @name module:rules/assign.rule
 * @event
 * @property {String} ruleName The string "assign"
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {String} operator The assignment operator, e.g. '=', '+=', etc. Only available post-evaluation.
 * @property {module:Base.ReferenceType} lhs The LHS being assigned to. Only available post-evaluation.
 * @property {module:Base.BaseType} rhs The value of the RHS being assigned to the LHS. Only available post-evaluation.
 */

var path = require("path"),
	RuleProcessor = require("../RuleProcessor"),
	Base = require("../Base"),
	Runtime = require("../Runtime"),
	Exceptions = require("../Exceptions");

/**
 * Do not call directly. Call {@link RuleProcessor.processRule} instead.
 * 
 * AST: [node-info, operator <string | true if no operator>, lhs <ast>, rhs <ast>]
 * 
 * @private
 */
exports.processRule = processRule;
function processRule(ast) {
	
	var operator,
		context,
		leftReference,
		leftValue,
		leftType,
		rightReference,
		rightValue,
		rightType,
		leftPrimitive,
		rightPrimitive,
		result;
	
	RuleProcessor.fireRuleEvent(ast, {}, false);
	operator = ast[1],
	context = Runtime.getCurrentContext();
	leftReference = RuleProcessor.processRule(ast[2]);
	leftValue = Base.getValue(leftReference);
	leftType = Base.type(leftValue);
	rightReference = RuleProcessor.processRule(ast[3]);
	rightValue = Base.getValue(rightReference);
	rightType = Base.type(rightValue);
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
			throw new Exceptions.ReferenceError('Invalid reference ' + Base.getReferencedName(leftReference));
		}
		
		// Calculate the value by faking a binary rule, if it needs to be calculated
		if (typeof operator === "string") {
			leftPrimitive = Base.toPrimitive(leftValue);
			rightPrimitive = Base.toPrimitive(rightValue);
			if (~["*", "/", "%", "-", "<<", ">>", ">>>", "&", "|", "^"].indexOf(operator)) {
				result = new Base.NumberType();
				switch (operator) {
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
				if (Base.type(leftPrimitive) === "String" || Base.type(rightPrimitive) === "String") {
					result = new Base.StringType(Base.toString(leftValue).value + Base.toString(rightValue).value);
				} else {
					result = new Base.NumberType(Base.toNumber(leftValue).value + Base.toNumber(rightValue).value);
				}
			} else if (~["<", ">", "<=", ">=", "instanceof", "in", "==", "===", "!=", "!=="].indexOf(operator)) {
				
				result = new Base.BooleanType();
				switch (operator) {
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
							throw new Exceptions.TypeError(Base.getReferencedName(rightReference) + 
								' is not an object or does not have a hasInstance method');
						}
						result.value = rightValue.hasInstance(leftValue);
						break;
					case "in": 
						if (Base.type(rightValue) !== "Object") {
							throw new Exceptions.TypeError(Base.getReferencedName(rightReference) + ' is not an object');
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
	
	RuleProcessor.fireRuleEvent(ast, {
		operator: operator,
		lhs: leftReference,
		rhs: rightValue
	}, true);
	
	return result;
}
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);