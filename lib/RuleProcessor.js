/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @module RuleProcessor
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

var Messaging = require("./Messaging"),
	Runtime = require("./Runtime"),
	ruleProcessors = {};

/**
 * Processes a node in the AST by linking up the node to a rule processor
 * 
 * @method
 * @param {module:AST.node} ast The node representing the rule to process in the AST
 */ 
exports.processRule = processRule;
function processRule(ast) {

	// Some rules, such as "toplevel" do not have in depth information, so we have to check for them here
	var ruleName = getRuleName(ast);
	
	// If a rule processor was found, run it
	if (ruleProcessors[ruleName]) {
		return ruleProcessors[ruleName].processRule(ast);
	} else {
		throw new Error("Internal Error: no rule processor exists for rule '" + ruleName + "'");
	}
}

/**
 * Processes a node in the AST by linking up the node to a rule processor
 * 
 * @method
 * @param {String} name The name of the rule that this processor will handle
 * @param {Function} handler The function to be called to process the rule
 */ 
exports.registerRuleProcessor = registerRuleProcessor;
function registerRuleProcessor(name, handler) {
	if (name in ruleProcessors) {
		throw new Error("Internal Error: attempted to register processoor for rule '" + name + "', but one already exists.");
	}
	ruleProcessors[name] = handler;
}

/**
 * Creates a rule event from the given ast and data. It's basically a special purpose mixin.
 * 
 * @method
 * @param {module:AST.node} ast The ast associated with the event that will be queried for the base event information
 * @param {Object} data The data to mixin the base event information in to. This object is modified
 * @param {Boolean} processingComplete Indicates if this rule has been processed or not. Useful for doing pre vs post
 *		order traversals. Note: every rule fires a rule event twice, once before processing has begun and once after
 *		processing has completed, as indicated by this property.
 */
exports.fireRuleEvent = fireRuleEvent;
function fireRuleEvent(ast, data, processingComplete) {
	createRuleEventInfo(ast, data);
	data.processingComplete = processingComplete;
	Messaging.fireEvent("rule", data);
}

/**
 * Adds common rule event info to the supplied data
 * 
 * @method
 * @param {module:AST.node} ast The ast for the rule
 * @param {Object} data The data to store the base rule info into
 * @returns {Object} The modified data
 */
exports.createRuleEventInfo = createRuleEventInfo;
function createRuleEventInfo(ast, data) {
	data.ruleName = getRuleName(ast);
	data.ast = ast;	
	data.file = Runtime.getCurrentFile();
	data.line = ast[0].start ? ast[0].start.line : "not available";
	data.column = ast[0].start ? ast[0].start.col : "not available";
	return data;
}

/**
 * Gets the name of the rule of the supplied ast node.
 * 
 * @method
 * @param {module:AST.node} ast The ast to get the name of
 * @returns {String} The name of the node
 */
exports.getRuleName = getRuleName;
function getRuleName(ast) {
	return typeof ast[0] === "string" ? ast[0] : ast[0].name;
}