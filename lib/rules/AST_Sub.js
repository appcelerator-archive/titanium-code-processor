/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A reference to an object's property using brackets.
 *
 * @module rules/AST_Sub
 * @see ECMA-262 Spec Chapter 11.2.1
 */

/**
 * @event module:rules/AST_Sub.rule
 * @property {string} ruleName The string 'AST_Sub'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {string} file The file that the rule begins on.
 * @property {number} line The line of the file where the rule begins on.
 * @property {number} column The column of the file where the rule begins on.
 * @property {boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.ReferenceType} result The reference to the property. Call <code>Base.getValue(e.result)</code>
 *		to get the value of the reference. Only available post-evaluation.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base');

AST.registerRuleProcessor('AST_Sub', function processRule() {

	var baseValue,
		propertyNameString,
		result;

	RuleProcessor.preProcess(this);

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_Sub');

	// Get the base value and the property name
	baseValue = Base.getValue(this.expression.processRule());
	if (typeof this.property === 'string') {
		propertyNameString = this.property;
	} else {
		propertyNameString = Base.getValue(this.property.processRule());
		if (Base.type(propertyNameString) === 'Unknown') {
			result = new Base.UnknownType();
			RuleProcessor.fireRuleEvent(this, {
				result: result
			}, true);

			RuleProcessor.postProcess(this, result);

			return result;
		}
		propertyNameString = Base.toString(propertyNameString).value;
	}
	result = new Base.ReferenceType();

	// Check if this is an unknown and short-circuit it
	if (Base.type(baseValue) === 'Unknown') {
		result = new Base.UnknownType();
	} else {
		// Create the reference to the property
		if (Base.isType(baseValue, ['Undefined', 'Null'])) {
			Base.handleRecoverableNativeException('TypeError', 'Cannot read property "' + propertyNameString + '" of ' +
				Base.type(baseValue).toLowerCase());
			result = new Base.UnknownType();
		} else {
			result.baseValue = baseValue;
			result.referencedName = propertyNameString;
			result.strictReference = Base.getCurrentContext().strict;
		}
	}

	RuleProcessor.fireRuleEvent(this, {
		result: result
	}, true);

	RuleProcessor.postProcess(this, result);

	return result;
});