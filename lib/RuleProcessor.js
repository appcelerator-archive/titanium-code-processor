/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @module Program
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */
 
var Messaging = require("./Messaging"),
	ruleProcessors = {};

/**
 * Processes a node in the AST by linking up the node to a rule processor
 * 
 * @method
 * @param {module:AST.node} ast The node representing the rule to process in the AST
 */ 
exports.processRule = function processRule(ast) {

	// Some rules, such as "toplevel" do not have in depth information, so we have to check for them here
	var ruleName = typeof ast[0] === "string" ? ast[0] : ast[0].name;
	
	// If a rule processor was found, run it
	if (ruleProcessors[ruleName]) {
		ruleProcessors[ruleName](ast);
	} else {
		throw new Error("Internal Error: no rule processor exists for rule '" + ruleName + "'");
	}
};

/**
 * Processes a node in the AST by linking up the node to a rule processor
 * 
 * @method
 * @param {String} name The name of the rule that this processor will handle
 * @param {Function} handler The function to be called to process the rule
 */ 
exports.registerRuleProcessor = function registerRuleProcessor(name, handler) {
	if (name in ruleProcessors) {
		throw new Error("Internal Error: attempted to register processoor for rule '" + name + "', but one already exists.");
		return;
	}
	ruleProcessors[name] = handler;
};

/**
 * Creates a rule event from the given ast and data. It's basically a special purpose mixin.
 * 
 * @method
 * @param {module:AST.node} ast The ast associated with the event that will be queried for the base event information
 * @param {Object} data The data to mixin the base event information in to. This object is modified
 */
exports.fireRuleEvent = function createRuleEvent(ast, data) {
	if (typeof ast[0] === "string") {
		ast[0] = {
			start: {
				line: 0,
				col: 0
			},
			name: ast[0]
		};
	}

	data.ruleName = ast[0].name;
	data.ast = ast;
	data.line = ast[0].start.line;
	data.column = ast[0].start.col;
	
	Messaging.fireEvent("rule", data);
}