/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

var path = require("path"),
	RuleProcessor = require("../RuleProcessor"),
	Base = require("../Base"),
	Runtime = require("../Runtime");

exports.processRule = function(ast) {
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
	// Get the base value and the property name
	var baseValue = Base.getValue(RuleProcessor.processRule(ast[1])),
		propertyNameString = typeof ast[2] === "string" ? ast[2] : Base.toString(Base.getValue(RuleProcessor.processRule(ast[2]))).value,
		result = new Base.ReferenceType();
	
	// Check if this is an unknown and short-circuit it
	if (Base.type(baseValue) === "Unknown") {
		result = new Base.UnknownType();
	} else {	
		// Create the reference to the property
		Base.checkObjectCoercible(baseValue);
		result.baseValue = baseValue;
		result.referencedName = propertyNameString;
		result.strictReference = Runtime.getCurrentContext().strict;	
	}
	
	RuleProcessor.fireRuleEvent(ast, {}, true);
	return result;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);