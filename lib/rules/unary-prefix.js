/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * A prefix operator (e.g. <code>!a</code>).
 * 
 * @module rules/unary-prefix
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 11.4
 */

/**
 * @name module:rules/unary-prefix.rule
 * @event
 * @property {String} ruleName The string 'call'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.BaseType} previousValue The previous value of the identifier. Only available post-evaluation.
 * @property {module:Base.BaseType} result The new value of the identifier. Only available post-evaluation.
 */

var path = require('path'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base'),
	Runtime = require('../Runtime');

/**
 * Do not call directly. Call {@link RuleProcessor.processRule} instead.
 * 
 * AST: [node-info, operator <string>, expression <ast>]
 * 
 * @private
 */
exports.processRule = processRule;
function processRule(ast) {
	
	var operator = ast[1],
		expr,
		result,
		newValue,
		oldValue,
		previousValue;

	RuleProcessor.fireRuleEvent(ast, {}, false);
	RuleProcessor.logRule('unary-prefix', operator);

	expr = RuleProcessor.processRule(ast[2]);
	previousValue = Base.type(expr) === 'Reference' && (Base.isUnresolvableReference(expr) ? undefined : Base.getValue(expr));
	if (Base.type(expr) === 'Reference' && !Base.isUnresolvableReference(expr) && Base.type(Base.getValue(expr)) === 'Unknown') {
		result = new Base.UnknownType();
	} else if (operator === 'delete') {
		if (Base.type(expr) !== 'Reference') {
			result = true;
		} else if (Base.isUnresolvableReference(expr)) {
			if (Base.isStrictReference(expr)) {
				Base.throwNativeException('ReferenceError', base.getReferencedName(expr) + ' is not resolvable');
			}
			result = true;
		} else if (Base.isPropertyReference(expr)) {
			result = Base.toObject(Base.getBase(expr))['delete'](Base.getReferencedName(expr), Base.isStrictReference(expr));
		} else {
			if (Base.isStrictReference(expr)) {
				Base.throwNativeException('SyntaxError', 'Invalid reference ' + base.getReferencedName(expr));
			}
			result = Base.getBase(expr).deleteBinding(Base.getReferencedName(expr));
		}
		result = new Base.BooleanType(result);
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
			result.value = result.value.toLowerCase();
			if (result.value === 'null') {
				result.value = 'object'; // No I'm not making this up, this is a real thing
			}
		}
	} else if (operator === '++' || operator === '--') {
		
		// Make sure ref is valid
		if (Base.type(expr) === 'Reference' && Base.isStrictReference(expr) && 
				!Base.type(Base.getBase(expr)) && 
				!~['eval', 'arguments'].indexOf(Base.getReferencedName(expr))) {
			Base.throwNativeException('ReferenceError', Base.getReferencedName(expr) + ' is not a valid identifier name');
		}
			
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
	
	RuleProcessor.fireRuleEvent(ast, {
		previousValue: previousValue,
		result: result
	}, true);
	
	return result;
}
RuleProcessor.registerRuleProcessor(path.basename(__filename, '.js'), exports);