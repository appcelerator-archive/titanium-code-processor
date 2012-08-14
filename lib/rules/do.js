/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

var path = require("path"),
	RuleProcessor = require("../RuleProcessor"),
	Base = require("../base");

exports.processRule = function(ast) {
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
	var v,
		conditional = ast[1],
		body = ast[2],
		stmt,
		result = ["normal", v, undefined];
	
	while(true) {
		stmt = RuleProcessor.processRule(body);
		if (stmt[1]) {
			v = stmt[1];
		}
		if (stmt[0] === "continue") {
			if (stmt[2] && stmt[2] !== ast[0].label) {
				result = stmt;
				break;
			}
		} else if (stmt[0] === "break") {
			if (stmt[2] && stmt[2] !== ast[0].label) {
				result = stmt;
			} else {
				result = ["normal", v, undefined];
			}
			break;
		} else if(stmt[0] !== "normal") {
			result = stmt;
			break;
		}
		if(!Base.toBoolean(Base.getValue(RuleProcessor.processRule(conditional))).value) {
			break;
		}
	}
	
	RuleProcessor.fireRuleEvent(ast, {}, true);
	return result;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);