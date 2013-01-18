/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A prefix operator (e.g. <code>!a</code>).
 *
 * @module rules/AST_UnaryPrefix
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 11.4
 */

/**
 * @name module:rules/AST_UnaryPrefix.rule
 * @event
 * @property {String} ruleName The string 'AST_UnaryPrefix'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.BaseType} previousValue The previous value of the identifier. Only available post-evaluation.
 * @property {module:Base.BaseType} result The new value of the identifier. Only available post-evaluation.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base');

AST.registerRuleProcessor('AST_UnaryPrefix', function processRule() {

	this._preProcess();

	var operator = this.operator,
		expr,
		result,
		newValue,
		oldValue,
		previousValue;

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_UnaryPrefix', operator);

	expr = this.expression.processRule();
	previousValue = Base.type(expr) === 'Reference' && (Base.isUnresolvableReference(expr) ? undefined : Base.getValue(expr));
	if (Base.type(expr) === 'Reference' && !Base.isUnresolvableReference(expr) && Base.type(Base.getValue(expr)) === 'Unknown') {
		result = new Base.UnknownType();
	} else if (operator === 'delete') {
		if (Base.type(expr) !== 'Reference') {
			result = new Base.BooleanType(true);
		} else if (Base.isUnresolvableReference(expr)) {
			if (Base.isStrictReference(expr)) {
				Base.handleRecoverableNativeException('ReferenceError', Base.getReferencedName(expr) + ' is not resolvable');
				result = new Base.UnknownType();
			} else {
				result = new Base.BooleanType(true);
			}
		} else if (Base.isPropertyReference(expr)) {
			result = new Base.BooleanType(Base.toObject(Base.getBase(expr))['delete'](Base.getReferencedName(expr),
				Base.isStrictReference(expr)));
		} else {
			if (Base.isStrictReference(expr)) {
				Base.handleRecoverableNativeException('SyntaxError', 'Invalid reference ' + Base.getReferencedName(expr));
				result = new Base.UnknownType();
			} else {
				result = new Base.BooleanType(Base.getBase(expr).deleteBinding(Base.getReferencedName(expr)));
			}
		}
	} else if (operator === 'void') {
		Base.getValue(expr); // Must be called even though it isn't used because of the possibility of side-effects
		result = new Base.UndefinedType();
	} else if (operator === 'typeof') {
		result = new Base.StringType();
		if (Base.type(expr) === 'Reference' && Base.isUnresolvableReference(expr)) {
			result.value = 'undefined';
		} else {
			expr = Base.getValue(expr);
			result.value = Base.type(expr);
			switch(result.value) {
				case 'Null':
					result.value = 'object'; // No I'm not making this up, this is a real thing
					break;
				case 'Object':
					if (expr.call) {
						result.value = 'function';
					} else {
						result.value = 'object';
					}
					break;
				default:
					result.value = result.value.toLowerCase();
			}
		}
	} else if (operator === '++' || operator === '--') {

		// Make sure ref is valid
		if (Base.type(expr) === 'Reference' && Base.isStrictReference(expr) &&
				!Base.type(Base.getBase(expr)) &&
				~['eval', 'arguments'].indexOf(Base.getReferencedName(expr))) {
			Base.handleRecoverableNativeException('SyntaxError', Base.getReferencedName(expr) + ' is not a valid identifier name');
			result = new Base.UnknownType();
		} else {
			oldValue = Base.toNumber(Base.getValue(expr));
			newValue = new Base.NumberType();
			if (operator === '++') {
				newValue.value = oldValue.value + 1;
			} else if (operator === '--') {
				newValue.value = oldValue.value - 1;
			} else {
				throw new Error('Internal Error: An unexpected operator "' + operator + '" was encountered in a unary expression.');
			}

			Base.putValue(expr, newValue);

			result = newValue;
		}
	} else if (operator === '+') {
		result = new Base.NumberType(Base.toNumber(Base.getValue(expr)).value);
	} else if (operator === '-') {
		result = new Base.NumberType(-Base.toNumber(Base.getValue(expr)).value);
	} else if (operator === '~') {
		result = new Base.NumberType(~Base.toInt32(Base.getValue(expr)).value);
	} else if (operator === '!') {
		result = new Base.BooleanType(!Base.toBoolean(Base.getValue(expr)).value);
	} else {
		throw new Error('Internal Error: An unexpected operator "' + operator + '" was encountered in a unary expression.');
	}

	RuleProcessor.fireRuleEvent(this, {
		previousValue: previousValue,
		result: result
	}, true);

	this._postProcess();

	return result;
});