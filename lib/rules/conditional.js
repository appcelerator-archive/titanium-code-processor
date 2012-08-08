/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

var path = require("path"),
	RuleProcessor = require("../RuleProcessor"),
	Base = require("../Base");

exports.processRule = function(ast) {
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
	var leftValue = Base.getValue(RuleProcessor.processRule(ast[1]));
		result;	
	if (Base.type(leftValue) === "Unknown") {
		result = new Base.UnknownType();
	} else if (Base.toBoolean().value) {
		result = Base.getValue(RuleProcessor.processRule(ast[2]));
	} else {
		result = Base.getValue(RuleProcessor.processRule(ast[3]));
	}
	
	RuleProcessor.fireRuleEvent(ast, {}, true);
	return result;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);