/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

var path = require("path"),
	RuleProcessor = require("../RuleProcessor"),
	Base = require("../Base"),
	Exceptions = require("../Exceptions"),
	Runtime = require("../Runtime");

exports.processRule = function(ast) {
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
	var context = Runtime.getCurrentContext(),
		constructor = Base.getValue(RuleProcessor.processRule(ast[1])),
		args = [],
		result;
	
	// Check if this is an unknown and short-circuit it
	if (Base.type(constructor) === "Unknown") {
		result = new Base.UnknownType();
	} else {
		// Make sure that this is really a constructor
		if (Base.type(constructor) !== "Function" || !constructor.construct) {
			throw new Exceptions.TypeError();
		}
		
		// Process the arguments
		for(i = 0, len = ast[2].length; i < len; i++) {
			args.push(Base.getValue(RuleProcessor.processRule(ast[2][i])));
		}
		
		// Invoke the constructor
		result = constructor.construct(args);
	}
	
	RuleProcessor.fireRuleEvent(ast, {}, true);
	return result;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);