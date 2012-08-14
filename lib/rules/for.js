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
	
	var exprRef = ast[1] && RuleProcessor.processRule(ast[1]),
		conditional = ast[2],
		iteration = ast[3],
		body = ast[4],
		v,
		result;
	exprRef && Base.getValue(exprRef);
	while(true) {
		if(conditional && !Base.toBoolean(Base.getValue(RuleProcessor.processRule(conditional))).value) {
			break;
		}
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
		if (iteration) {
			Base.getValue(RuleProcessor.processRule(iteration));
		}
	}
	
	RuleProcessor.fireRuleEvent(ast, {}, true);
	return result;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);