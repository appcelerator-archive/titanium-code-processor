/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * @module RuleProcessor
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var AST = require('./AST'),
	Runtime = require('./Runtime');
/**
 * Process a set of AST nodes
 *
 * @method
 * @param {Array[{@link module:AST.node}]} astSet The set of AST nodes to process
 */
exports.processBlock = processBlock;
function processBlock(astSet) {

	var i = 0, j,
		len = astSet ? astSet.length : 0,
		result = ['normal', undefined, undefined],
		v;

	function skippedNodeCallback (node) {
		node._skipped = true;
	}

	for (; i < len; i++) {
		try {
			v = astSet[i].processRule();
		} catch(e) {
			for(j = i + 1; j < len; j++) {
				AST.walk(astSet[j], [
					{
						callback: skippedNodeCallback
					}
				]);
			}
			throw e;
		}
		if (v && v.length === 3 && v[0] !== 'normal') {
			result = v;
			for(j = i + 1; j < len; j++) {
				AST.walk(astSet[j], [
					{
						callback: skippedNodeCallback
					}
				]);
			}
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
 * Determines whether or not a block is strict
 *
 * @method
 * @param {Array[{@link module:AST.node}]} astSet The set to check for strict mode on
 * @returns {Boolean} Whether or not the block is strict
 */
exports.isBlockStrict = isBlockStrict;
function isBlockStrict(ast) {
	var i, len;
	for(i = 0, len = ast.directives.length; i < len; i++) {
		if (ast.directives[i] === 'use strict') {
			return true;
		}
	}
	return false;
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
	data.ruleName = ast.className;
	data.ast = ast;
	data.processingComplete = processingComplete;
	Runtime.fireEvent('rule', 'Rule ' + data.ruleName + ' was encountered', data);
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
		'(' + location.filename + ':' + location.line + ':' + location.column + ')');
}