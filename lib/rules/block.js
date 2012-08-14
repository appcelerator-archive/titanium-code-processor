/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

var path = require("path"),
	RuleProcessor = require("../RuleProcessor");

exports.processRule = function(ast) {
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
	result = exports.processBlock(ast[1]);
	
	RuleProcessor.fireRuleEvent(ast, {}, true);
	return result;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);

exports.processBlock = function(ast) {
	var i = 0,
		len = ast ? ast.length : 0,
		result = ["normal", undefined, undefined];
	for(; i < len; i++) {
		result = RuleProcessor.processRule(ast[i]);
		if (result[0] !== "normal") {
			break;
		}
	}
	return result;
}