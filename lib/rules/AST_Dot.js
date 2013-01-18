/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A reference to an object's property using the dot operator.
 *
 * @module rules/AST_Dot
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 11.2.1
 */

/**
 * @name module:rules/AST_Dot.rule
 * @event
 * @property {String} ruleName The string 'call'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.ReferenceType} result The reference to the property. Call <code>Base.getValue(e.result)</code>
 *		to get the value of the reference. Only available post-evaluation.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base'),
	Runtime = require('../Runtime');

AST.registerRuleProcessor('AST_Dot', function processRule() {

	this._preProcess();

	var baseValue,
		propertyNameString = this.property,
		result;

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_Dot');

	// Get the base value and the property name
	baseValue = Base.getValue(this.expression.processRule());
	result = new Base.ReferenceType();

	// Check if this is an unknown and short-circuit it
	if (Base.type(baseValue) === 'Unknown') {
		result = new Base.UnknownType();
	} else if (Base.isType(baseValue, ['Undefined', 'Null'])) {
		Base.handleRecoverableNativeException('TypeError', 'Cannot dereference property "' + propertyNameString + '" of ' +
			Base.type(baseValue).toLowerCase());
		result = new Base.UnknownType();
	} else {
		result.baseValue = baseValue;
		result.referencedName = propertyNameString;
		result.strictReference = Runtime.getCurrentContext().strict;
	}

	RuleProcessor.fireRuleEvent(this, {
		result: result
	}, true);

	this._postProcess();

	return result;
});