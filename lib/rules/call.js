/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

var path = require("path"),
	RuleProcessor = require("../RuleProcessor"),
	Base = require("../Base"),
	Runtime = require("../Runtime"),
	Exceptions = require("../Exceptions");

exports.processRule = function(ast) {
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
	var ref = RuleProcessor.processRule(ast[1]),
		func = Base.getValue(ref),
		result,
		args = [],
		i = 0, len = ast[2].length,
		thisValue;
	
	// Process the arguments
	for(; i < len; i++) {
		args.push(Base.getValue(RuleProcessor.processRule(ast[2][i])));
	}
		
	// Make sure funct is actually a function
	if (Base.type(func) !== "Function" || !Base.isCallable(func)) {
		throw new Exceptions.TypeError();
	}
	
	// Determine the this value
	if (Base.type(ref) === "Reference") {
		thisValue = Base.getBase(ref);
		if (!Base.isPropertyReference(ref)) {
			thisValue = thisValue.implicitThisValue();
		}
	} else {
		thisValue = new Base.UndefinedType();
	}
	
	// Call the function
	result = func.call(thisValue, args);
	
	RuleProcessor.fireRuleEvent(ast, {}, true);
	
	return result;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);