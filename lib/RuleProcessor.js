/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @module RuleProcessor
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var Runtime = require('./Runtime'),
	Exceptions = require('./Exceptions'),
	ruleProcessors = {};

/**
 * Processes a node in the AST by linking up the node to a rule processor
 * 
 * @method
 * @param {module:AST.node} ast The node representing the rule to process in the AST
 */ 
exports.processRule = processRule;
function processRule(ast) {

	// Some rules, such as 'toplevel' do not have in depth information, so we have to check for them here
	var ruleName = getRuleName(ast),
		locationStored = false,
		result;
	
	// Make sure we haven't exceeded the time limit
	if (Runtime.executionTimeLimit && Runtime.executionTimeLimit < Date.now()) {
		throw new Exceptions.Error('Execution timeout exceeded');
	}
	
	// Store line and column numbers, if they exist
	if (typeof ast[0] !== 'string') {
		Runtime.locationStack.push({
			line: ast[0].start.line, 
			column: ast[0].start.col
		});
		locationStored = true;
	} else if (ast[0] === 'toplevel') {
		Runtime.locationStack.push({
			line: 0, 
			column: 0
		});
		locationStored = true;
	}
	
	// If a rule processor was found, run it
	if (ruleProcessors[ruleName]) {
		result = ruleProcessors[ruleName].processRule(ast);
	} else {
		throw new Error('Internal Error: no rule processor exists for rule ' + ruleName);
	}
	
	if (locationStored) {
		Runtime.locationStack.pop();
	}
	
	return result;
}

/**
 * Process a set of AST nodes
 * 
 * @private
 */
exports.processBlock = processBlock;
function processBlock(astSet) {
	
	var i = 0,
		len = astSet ? astSet.length : 0,
		result = ["normal", undefined, undefined],
		v;
	
	for (; i < len; i++) {
		v = processRule(astSet[i]);
		if (v && v.length === 3 && v[0] !== "normal") {
			result = v;
			break;
		}
		if (v[1]) {
			result[1] = v[1];
		}
		result[2] = v[2];
	}
	return result;
}

/**
 * Processes a node in the AST by linking up the node to a rule processor
 * 
 * @method
 * @param {String} name The name of the rule that this processor will handle
 * @param {Function} handler The function to be called to process the rule
 */ 
exports.registerRuleProcessor = registerRuleProcessor;
function registerRuleProcessor(ruleName, handler) {
	if (ruleName in ruleProcessors) {
		throw new Error('Internal Error: attempted to register processoor for rule ' + ruleName + ', but one already exists.');
	}
	ruleProcessors[ruleName] = handler;
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
	Runtime.fireEvent('rule', 'Rule ' + data.ruleName + ' was encountered', data);
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
	return typeof ast[0] === 'string' ? ast[0] : ast[0].name;
}

/**
 * Logs a rule 
 * 
 * @method
 * @param {String} ruleName The name of the rule
 */
exports.logRule = logRule;
function logRule(ruleName, data) {
	var location = Runtime.getCurrentLocation();
	Runtime.log('trace', 'Processing rule ' + ruleName + ': ' + (data ? data + ' ': '') + 
		'(' + Runtime.getCurrentFile() + ':' + location.line + ':' + location.column + ')');
}