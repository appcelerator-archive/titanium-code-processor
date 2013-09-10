/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * @module RuleProcessor
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var AST = require('./AST'),
	Runtime = require('./Runtime'),
	trace,
	cycle,
	cycleLocation,
	cycleCount,
	traceLocation = 0,
	throwNativeException;

/**
 * Preprocess a rule
 *
 * @method
 * @param {Array[{@link module:AST.node}]} astSet The set of AST nodes to process
 */
exports.preProcess = preProcess;
function preProcess(ast) {

	// Some rules do not have location information, so we have to check for them here and use the previous information otherwise
	var currentLocation = Runtime.getCurrentLocation(),
		start = ast.start,
		filename = (start && start.file) || currentLocation.filename,
		line = (start && start.line) || currentLocation.line,
		column = (start && start.col) || currentLocation.column,
		previousTraceEntryLocation,
		Base = require('./Base');

	// Make sure we haven't exceeded the time limit
	if (Runtime.executionTimeLimit && Runtime.executionTimeLimit < Date.now()) {
		throwNativeException('RangeError', 'Execution timeout exceeded');
	}

	// Store line and column numbers, if they exist
	Runtime.setCurrentLocation(filename, line, column);

	// Add to the trace and look for cycles
	if (!trace) {
		trace = new Array(Runtime.options.cycleDetectionStackSize);
	}
	if (cycle) {
		if (ast === cycle[cycleLocation]) {
			cycleLocation++;
			if (cycleLocation === cycle.length) {
				cycleCount++;
				if (cycleCount > Runtime.options.maxCycles) {
					throwNativeException('RangeError', 'The maximum number of cycles was detected');
				}
				cycleLocation = 0;
			}
		} else {
			cycle = undefined;
		}
	} else {
		previousTraceEntryLocation = trace.indexOf(ast);
		if (previousTraceEntryLocation !== -1) {
			if (previousTraceEntryLocation < traceLocation) {
				cycle = trace.slice(previousTraceEntryLocation, traceLocation);
			} else {
				cycle = trace.slice(previousTraceEntryLocation).concat(trace.slice(0, traceLocation));
			}
			cycleCount = 1;
			cycleLocation = 1;
		}
	}
	trace[traceLocation] = ast;
	traceLocation++;
	if (traceLocation === trace.length) {
		traceLocation = 0;
	}

	Base.setVisited(ast);
}

/**
 * Post process a rule
 *
 * @method
 * @param {Array[{@link module:AST.node}]} ast The set of AST nodes to process
 */
exports.postProcess = postProcess;
function postProcess(ast, returnValue) {
	returnValue = Array.isArray(returnValue) ? returnValue[1] : returnValue;
	ast._unknown = ast._unknown || !!(returnValue && returnValue.type === 'Unknown');
	Runtime.exitCurrentLocation();
}

/**
 * Sets the native throw exception method, to break a cyclical dep with Base
 *
 * @method
 * @param {Array[{@link module:AST.node}]} ast The set of AST nodes to process
 */
exports.setThrowNativeException = setThrowNativeException;
function setThrowNativeException(value) {
	throwNativeException = value;
}

/**
 * Process a set of AST nodes
 *
 * @method
 * @param {Array[{@link module:AST.node}]} astSet The set of AST nodes to process
 */
exports.processBlock = processBlock;
function processBlock(astSet) {

	var i, len,
		result = ['normal', undefined, undefined],
		v,
		Base = require('./Base');

	for (i = 0, len = astSet ? astSet.length : 0; i < len; i++) {
		try {
			v = astSet[i].processRule();
		} catch(e) {
			Base.enterSkippedMode();
			processBlock(astSet.slice(i + 1));
			Base.exitSkippedMode();
			throw e;
		}
		if (v && v.length === 3 && v[0] !== 'normal') {
			result = v;
			Base.enterSkippedMode();
			processBlock(astSet.slice(i + 1));
			Base.exitSkippedMode();
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
	for (i = 0, len = ast.directives.length; i < len; i++) {
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