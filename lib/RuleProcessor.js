/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * @module RuleProcessor
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var AST = require('./AST'),
	Runtime = require('./Runtime'),
	breakpoints = []; // Array of objects with four props: file, line, column, and node (which must be set to null)

// TODO: Remove me!
exports.registerRuleProcessor = function() {};

/**
 * Processes a node in the AST by linking up the node to a rule processor
 *
 * @method
 * @param {module:AST.node} ast The node representing the rule to process in the AST
 */
exports.processRule = processRule;
function processRule(ast) {

	// Some rules, such as 'toplevel' do not have in depth information, so we have to check for them here
	var result,
		filename = ast.start.file,
		line = ast.start.line,
		column = ast.start.col,
		i, len,
		breakpoint;

	// Make sure we haven't exceeded the time limit
	if (Runtime.executionTimeLimit && Runtime.executionTimeLimit < Date.now()) {
		throw new Error('Execution timeout exceeded');
	}

	// Store line and column numbers, if they exist
	Runtime.setCurrentLocation(filename, line, column);

	// Check if we are at a breakpoint
	for(i = 0, len = breakpoints.length; i < len; i++) {
		if (filename.indexOf(breakpoints[i].filename) !== -1 && line === breakpoints[i].line &&
				column === breakpoints[i].column && !breakpoints[i].node) {
			breakpoint = breakpoints[i];
			breakpoints[i].node = ast;
			break;
		}
	}
	if (breakpoint) {
		/*jshint debug: true*/
		debugger;
	}

	// If a rule processor was found, run it
	if (ast.processRule) {
		ast._visited = true;
		result = ast.processRule();
	} else {
		throw new Error('Internal Error: process rule function not defined for AST node');
	}

	// Clear the breakpoint
	if (breakpoint) {
		breakpoint.node = null;
	}

	// Check the stats
	if (Runtime._unknown) {
		ast._unknown = true;
		Runtime._unknown = false;
	}

	Runtime.exitCurrentLocation();

	return result;
}

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

	for (; i < len; i++) {
		try {
			v = processRule(astSet[i]);
		} catch(e) {
			for(j = i + 1; j < len; j++) {
				AST.walk(astSet[j], {
					'*': function(node, next) {
						node._skipped = true;
						next();
					}
				});
			}
			throw e;
		}
		if (v && v.length === 3 && v[0] !== 'normal') {
			result = v;
			for(j = i + 1; j < len; j++) {
				AST.walk(astSet[j], {
					'*': function(node, next) {
						node._skipped = true;
						next();
					}
				});
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
		'(' + location.file + ':' + location.line + ':' + location.column + ')');
}