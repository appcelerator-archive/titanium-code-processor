/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A binary expression is one that consists of a left operand, an operator, and a right operand. Both mathematical and
 * logical operators are covered by this rule
 *
 * @module rules/AST_Binary
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 11.5-11.9
 */

/**
 * @name module:rules/AST_Binary.rule
 * @event
 * @property {String} ruleName The string 'AST_Binary'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {String} operator The operator, e.g. '+', '==', etc. Only available post-evaluation.
 * @property {module:Base.BaseType} leftOperand The left operand. Only available post-evaluation.
 * @property {module:Base.BaseType} rightOperand The right operand. Only available post-evaluation.
 * @property {module:Base.ArrayType} result The result of evaluating the expression. Only available post-evaluation.
 */

var RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base'),
	AST = require('../AST');

AST.registerRuleProcessor('AST_Binary', function processRule() {

	this._preProcess();

	var operator = this.operator,
		leftValue,
		leftPrimitive,
		rightValue,
		rightPrimitive,
		result;

	function skippedNodeCallback (node) {
		node._skipped = true;
	}

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_Binary');
	leftValue = Base.getValue(this.left.processRule());

	if (Base.type(leftValue) === 'Unknown') {
		result = new Base.UnknownType();
		AST.walk(this.right, [
			{
				callback: skippedNodeCallback
			}
		]);
	} else if (~['*', '/', '%', '-', '<<', '>>', '>>>', '&', '|', '^'].indexOf(operator)) {
		result = new Base.NumberType();
		rightValue = Base.getValue(this.right.processRule());
		if (Base.type(rightValue) === 'Unknown') {
			result = new Base.UnknownType();
		} else {
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
		}
	} else if (operator === '+') {
		leftPrimitive = Base.toPrimitive(leftValue);
		rightValue = Base.getValue(this.right.processRule());
		if (Base.type(rightValue) === 'Unknown') {
			result = new Base.UnknownType();
		} else {
			rightPrimitive = Base.toPrimitive(rightValue);
			if (Base.type(Base.toPrimitive(leftPrimitive)) === 'String' || Base.type(Base.toPrimitive(rightPrimitive)) === 'String') {
				result = new Base.StringType(Base.toString(leftPrimitive).value + Base.toString(rightPrimitive).value);
			} else {
				result = new Base.NumberType(Base.toNumber(leftPrimitive).value + Base.toNumber(rightPrimitive).value);
			}
		}
	} else if (~['<', '>', '<=', '>=', '==', '===', '!=', '!=='].indexOf(operator)) {

		result = new Base.BooleanType();
		rightValue = Base.getValue(this.right.processRule());
		if (Base.type(rightValue) === 'Unknown') {
			result = new Base.UnknownType();
		} else {
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
		}
	} else if (operator === 'instanceof') {
		result = new Base.BooleanType();
		rightValue = Base.getValue(this.right.processRule());
		if (Base.type(rightValue) === 'Unknown') {
			result = new Base.UnknownType();
		} else {
			if (Base.type(rightValue) !== 'Object' || !rightValue.hasInstance) {
				Base.handleRecoverableNativeException('TypeError', 'Expression is not an object or does not have a hasInstance method');
				result = new Base.UnknownType();
			} else {
				result.value = rightValue.hasInstance(leftValue);
			}
		}
	} else if (operator === 'in') {
		result = new Base.BooleanType();
		rightValue = Base.getValue(this.right.processRule());
		if (Base.type(rightValue) === 'Unknown') {
			result = new Base.UnknownType();
		} else {
			if (Base.type(rightValue) !== 'Object') {
				Base.handleRecoverableNativeException('TypeError', 'Expression is not an object');
				result = new Base.UnknownType();
			} else {
				result.value = rightValue.hasProperty(Base.toString(leftValue).value);
			}
		}
	} else if (operator === '&&') {
		if (!Base.toBoolean(leftValue).value) {
			result = leftValue;
			AST.walk(this.right, [
				{
					callback: skippedNodeCallback
				}
			]);
		} else {
			result = rightValue = Base.getValue(this.right.processRule());
		}
	} else if (operator === '||') {
		if (Base.toBoolean(leftValue).value) {
			result = leftValue;
			AST.walk(this.right, [
				{
					callback: skippedNodeCallback
				}
			]);
		} else {
			result = rightValue = Base.getValue(this.right.processRule());
		}
	} else {
		throw new Error('Internal Error: An unexpected operator "' + operator + '" was encountered in a binary expression.');
	}

	RuleProcessor.fireRuleEvent(this, {
		operator: operator,
		leftOperand: leftValue,
		rightOperand: rightValue,
		result: result
	}, true);

	this._postProcess();

	return result;
});