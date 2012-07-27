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
	
	RuleProcessor.processRule(ast[1]);
	
	RuleProcessor.fireRuleEvent(ast, {}, true);
	return ["normal", undefined, undefined];
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);