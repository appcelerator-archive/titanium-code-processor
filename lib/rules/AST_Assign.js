/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * An assignment is one including the '=' symbol and and optional compound operator, such as '+='
 *
 * @module rules/AST_Assign
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 11.13
 */

/**
 * @name module:rules/AST_Assign.rule
 * @event
 * @property {String} ruleName The string 'AST_Assign'
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

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base'),
	Runtime = require('../Runtime');

AST.registerRuleProcessor('AST_Assign', function processRule() {

	this._preProcess();

	var operator,
		context,
		leftReference,
		leftValue,
		leftPrimitive,
		rightReference,
		rightValue,
		rightPrimitive,
		result;

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_Assign', this.operator);

	operator = this.operator.replace('=', ''),
	context = Runtime.getCurrentContext();
	leftReference = this.left.processRule();
	rightReference = this.right.processRule();
	rightValue = Base.getValue(rightReference);
	result = rightValue;

	// Check if the value cannot be calculated properly
	if (Base.type(leftReference) === 'Unknown') {
		result = new Base.UnknownType();
	} else if (Base.type(rightValue) === 'Unknown') {
		result = new Base.UnknownType();
		Base.putValue(leftReference, result);
	} else if (Base.type(leftReference) === 'Reference' && Base.isStrictReference(leftReference) &&
			!Base.type(Base.getBase(leftReference)) &&
			~['eval', 'arguments'].indexOf(Base.getReferencedName(leftReference))) {
		Base.handleRecoverableNativeException('SyntaxError', 'Invalid reference ' + Base.getReferencedName(leftReference));
		result = new Base.UnknownType();
	} else {

		// Calculate the value by faking a binary rule, if it needs to be calculated
		if (operator) {
			leftValue = Base.getValue(leftReference);
			if (Base.type(leftValue) === 'Unknown') {
				result = new Base.UnknownType();
			} else if (~['*', '/', '%', '-', '<<', '>>', '>>>', '&', '|', '^'].indexOf(operator)) {
				result = new Base.NumberType();
				switch (operator) {
					case '*':
						result.value = Base.toNumber(leftValue).value * Base.toNumber(rightValue).value;
						break;
					case '/':
						result.value = Base.toNumber(leftValue).value / Base.toNumber(rightValue).value;
						break;
					case '%':
						result.value = Base.toNumber(leftValue).value % Base.toNumber(rightValue).value;
						break;
					case '-':
						result.value = Base.toNumber(leftValue).value - Base.toNumber(rightValue).value;
						break;
					case '<<':
						result.value = Base.toInt32(leftValue).value << (Base.toUint32(rightValue).value & 0x1F);
						break;
					case '>>':
						result.value = Base.toInt32(leftValue).value >> (Base.toUint32(rightValue).value & 0x1F);
						break;
					case '>>>':
						result.value = Base.toUint32(leftValue).value >>> (Base.toUint32(rightValue).value & 0x1F);
						break;
					case '&':
						result.value = Base.toInt32(leftValue).value & (Base.toInt32(rightValue).value);
						break;
					case '|':
						result.value = Base.toInt32(leftValue).value | (Base.toInt32(rightValue).value);
						break;
					case '^':
						result.value = Base.toInt32(leftValue).value ^ (Base.toInt32(rightValue).value);
						break;
				}
			} else if (operator === '+') {
				leftPrimitive = Base.toPrimitive(leftValue);
				rightPrimitive = Base.toPrimitive(rightValue);
				if (Base.type(leftPrimitive) === 'String' || Base.type(rightPrimitive) === 'String') {
					result = new Base.StringType(Base.toString(leftPrimitive).value + Base.toString(rightPrimitive).value);
				} else {
					result = new Base.NumberType(Base.toNumber(leftPrimitive).value + Base.toNumber(rightPrimitive).value);
				}
			} else if (~['<', '>', '<=', '>=', 'instanceof', 'in', '==', '===', '!=', '!=='].indexOf(operator)) {

				result = new Base.BooleanType();
				switch (operator) {
					case '<':
						result.value = Base.toPrimitive(leftValue).value < Base.toPrimitive(rightValue).value;
						break;
					case '>':
						result.value = Base.toPrimitive(leftValue).value > Base.toPrimitive(rightValue).value;
						break;
					case '<=':
						result.value = Base.toPrimitive(leftValue).value <= Base.toPrimitive(rightValue).value;
						break;
					case '>=':
						result.value = Base.toPrimitive(leftValue).value >= Base.toPrimitive(rightValue).value;
						break;
					case 'isntanceof':
						if (Base.type(rightValue) !== 'Object' || !rightValue.hasInstance) {
							Base.handleRecoverableNativeException('TypeError', Base.getReferencedName(rightReference) +
								' is not an object or does not have a hasInstance method');
							result = new Base.UnknownType();
						} else {
							result.value = rightValue.hasInstance(leftValue);
						}
						break;
					case 'in':
						if (Base.type(rightValue) !== 'Object') {
							Base.handleRecoverableNativeException('TypeError', Base.getReferencedName(rightReference) + ' is not an object');
							result = new Base.UnknownType();
						} else {
							result.value = rightValue.hasProperty(Base.toString(leftValue).value);
						}
						break;
					case '==':
						result.value = Base.abstractEquality(leftValue, rightValue);
						break;
					case '===':
						result.value = Base.strictEquals(leftValue, rightValue);
						break;
					case '!=':
						result.value = !Base.abstractEquality(leftValue, rightValue);
						break;
					case '!==':
						result.value = !Base.strictEquals(leftValue, rightValue);
						break;

				}
			} else if (operator === '&&') {
				if (!Base.toBoolean(leftValue).value) {
					result = leftValue;
				} else {
					result = rightValue;
				}
			} else if (operator === '||') {
				if (Base.toBoolean(leftValue).value) {
					result = leftValue;
				} else {
					result = rightValue;
				}
			} else {
				throw new Error('Internal Error: An unexpected operator "' + operator + '" was encountered in a binary expression.');
			}
		}

		Base.putValue(leftReference, result);
	}

	this._postProcess();

	RuleProcessor.fireRuleEvent(this, {
		operator: operator,
		lhs: leftReference,
		rhs: rightValue
	}, true);

	return result;
});