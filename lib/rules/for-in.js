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
	
	var init = ast[1] && RuleProcessor.processRule(ast[1]),
		experValue = Base.getValue(RuleProcessor.processRule(ast[3])),
		experValueType = Base.type(experValue),
		obj,
		p,
		pVal,
		v,
		stmt,
		result = ["normal", undefined, undefined];
	
	if (experValueType !== "Undefined" && experValueType !== "Null") {
		obj = Base.toObject(experValue);
		for(p in obj._properties) {
			if (obj._properties[p].enumerable) {
				pVal = new Base.StringType();
				pVal.value = p;
				Base.putValue(RuleProcessor.processRule(ast[2]), pVal);
				stmt = RuleProcessor.processRule(ast[4]);
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
			}
		}
	}
	
	RuleProcessor.fireRuleEvent(ast, {}, true);
	
	return result;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);