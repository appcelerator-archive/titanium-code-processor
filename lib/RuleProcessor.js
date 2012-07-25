/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @module Program
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */
 
var ruleProcessors = {};
 
exports.processRule = function processRule(code) {

	// Some rules, such as "toplevel" do not have in depth information, so we have to check for them here
	var ruleName = typeof code[0] === "string" ? code[0] : code[0][1];
	
	// If a rule processor was found, run it
	if (ruleProcessors[ruleName]) {
		ruleProcessors[ruleName](code);
	} else {
		throw new Error("Internal Error: no rule processor exists for rule '" + ruleName + "'");
	}
};
 
exports.registerRuleProcessor = function registerRuleProcessor(name, handler) {
	if (name in ruleProcessors) {
		throw new Error("Internal Error: attempted to register processoor for rule '" + name + "', but one already exists.");
		return;
	}
	ruleProcessors[name] = handler;
};