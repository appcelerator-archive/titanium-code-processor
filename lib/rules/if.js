/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

var path = require("path"),
	Base = require("../Base"),
	RuleProcessor = require("../RuleProcessor"),
	Runtime = require("../Runtime");

exports.processRule = function(ast) {
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
	var leftValue = Base.getValue(RuleProcessor.processRule(ast[1])),
		leftType = Base.type(leftValue),
		result;
	if (leftType === "Unknown" || rightType === "Unknown") {
		Runtime.ambiguousCode++;
		RuleProcessor.processRule(ast[2]);
		if (ast[3]) {
			result = RuleProcessor.processRule(ast[3]);
		} else {
			result = ["normal", undefined, undefined];
		}
		Runtime.ambiguousCode--;
	} else if (leftValue.value) {
		result = RuleProcessor.processRule(ast[2]);
	} else if (!leftValue.value) {
		if (ast[3]) {
			result = RuleProcessor.processRule(ast[3]);
		} else {
			result = ["normal", undefined, undefined];
		}
	}
	
	RuleProcessor.fireRuleEvent(ast, {}, true);
	return result;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);