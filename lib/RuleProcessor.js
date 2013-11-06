/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Provides helper methods for processing rules
 *
 * @module RuleProcessor
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var Runtime = require('./Runtime'),
	trace,
	cycle,
	cycleLocation,
	cycleCount,
	callLocationStack = [],
	traceLocation = 0,
	throwNativeException,
	recursionExitPoint = -1;

/**
 * Preprocess a rule. This method does things like updating the location stack, checking for execution timeout errors,
 * checking for cycle errors, etc.
 *
 * @method
 * @param {module:AST.node} astSet The AST node to preprocess
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

	// Store line and column numbers, if they exist
	Runtime.setCurrentLocation(filename, line, column);

	// Make sure we haven't exceeded the time limit
	if (Runtime.executionTimeLimit && Runtime.executionTimeLimit < Date.now()) {
		throwNativeException('RangeError', 'Execution timeout exceeded');
	}

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
 * @param {module:AST.node} ast The AST node to process
 * @param {(Array | Base.BaseType)} returnValue The return value, either a JS value or a return tuple
 */
exports.postProcess = postProcess;
function postProcess(ast, returnValue) {
	returnValue = Array.isArray(returnValue) ? returnValue[1] : returnValue;
	ast._unknown = ast._unknown || !!(returnValue && returnValue.type === 'Unknown');
	Runtime.exitCurrentLocation();
}

/**
 * Enters a function call by pushing the function information on the call stack
 *
 * @method
 */
exports.enterCall = enterCall;
function enterCall() {
	var currentLocation = Runtime.getCurrentLocation();
	callLocationStack.push(currentLocation.filename + ':' + currentLocation.line + ':' + currentLocation.column);
}

/**
 * Exits a function call by popping the call stack
 *
 * @method
 */
exports.exitCall = exitCall;
function exitCall() {
	callLocationStack.pop();
}

/**
 * Gets the current call stack trace, with the location of the current rule on top of the stack (like you see in debuggers)
 *
 * @method
 * @returns {Array.<string>} An array of stack trace locations
 */
exports.getStackTrace = getStackTrace;
function getStackTrace() {
	var currentLocation = Runtime.getCurrentLocation();
	return callLocationStack.concat([currentLocation.filename + ':' + currentLocation.line + ':' + currentLocation.column]);
}

/**
 * Returns whether or not this function is a recursion exit point (i.e. where it gets out of the recursive call)
 *
 * @method
 * @returns {boolean} Whether or not this is a recursive exit point. Returns false if not in a recursive call.
 */
exports.isRecursionExitPoint = isRecursionExitPoint;
function isRecursionExitPoint() {
	return !!callLocationStack.length && (recursionExitPoint == callLocationStack.length - 1);
}

/**
 * Checks the callstack to see if it looks like we're stuck in infinite recursion
 *
 * @method
 * @returns {boolean} Whether or not we think we are infinitely recursing
 */
exports.checkForInfiniteRecursion = checkForInfiniteRecursion;
function checkForInfiniteRecursion() {
	var counter = 0,
		before,
		after,
		isInfiniteRecursion,
		i, len,
		replacedRegex = /^\*/;

	function replaceAll(string, search, value) {
		while(string.indexOf(search) != -1) {
			string = string.replace(search, value);
		}
		return string;
	}

	// Find cycles via Brent's Algorithm: http://en.wikipedia.org/wiki/Cycle_detection#Brent.27s_algorithm
	function brent(sequence) {
		var power = 1,
			lam = 1,
			tortoise = 0,
			hare = 1,
			mu,
			cycle;

		while(sequence[tortoise] != sequence[hare]) {
			if (power == lam) {
				tortoise = hare;
				power *= 2;
				lam = 0;
			}
			hare++;
			lam++;
		}

		mu = 0;
		tortoise = 0;
		hare = lam;
		while(sequence[tortoise] != sequence[hare]) {
			tortoise++;
			hare++;
			mu++;
		}
		if (tortoise == sequence.length) {
			return sequence;
		}

		cycle = sequence.slice(tortoise, hare).join('?');

		if (/^\*[0-9]*$/.test(cycle)) {
			return sequence;
		}
		return brent(replaceAll(sequence.join('?'), cycle, '*' + counter++).split('?'));
	}

	// Looks for repeated sequences and merges them into a single identifier
	function mergeRepeated(sequence) {
		var cycleLength,
			cycle,
			replacements = {};
		for (var i = 0; i < sequence.length; i++) {
			cycleLength = 0;
			while(sequence[i + ++cycleLength] == sequence[i]);
			if (cycleLength > 1) {
				cycle = sequence.slice(i, i + cycleLength).join('?');
				if (!replacements[cycle]) {
					replacements[cycle] = '*' + counter++;
				}
				sequence = replaceAll(sequence.join('?'), cycle, replacements[cycle]).split('?');
			}
			if (cycleLength > Runtime.options.maxRecursionLimit) {
				isInfiniteRecursion = true;
			}
		}
		return sequence;
	}

	// Deep clone the array since we will be modifying it
	before = [].concat(callLocationStack);

	// Alternate between Brent's method and merging repeated values until there are no more changes
	while(true) {
		after = brent(before);
		if (before.join('?') == after.join('?')) {
			break;
		}
		before = after;

		after = mergeRepeated(before);
		if (after === true) {
			break;
		}
		if (before.join('?') == after.join('?')) {
			break;
		}
		before = after;
	}

	if (isInfiniteRecursion) {
		for (i = 0, len = after.length; i < len; i++) {
			if (replacedRegex.test(after[i])) {
				recursionExitPoint = i;
				return true;
			}
		}
		recursionExitPoint = -1;
	}
	return false;
}

/**
 * Tells whether or not we are in the process of unrolling a recursive call
 *
 * @method
 * @returns {boolean} Whether or not we are in a recursion unroll
 */
exports.inRecursionUnroll = inRecursionUnroll;
function inRecursionUnroll() {
	return recursionExitPoint != -1;
}

/**
 * Clears the recursion exit point
 *
 * @method
 */
exports.clearRecursionExitPoint = clearRecursionExitPoint;
function clearRecursionExitPoint() {
	recursionExitPoint = -1;
}

/**
 * Sets the native throw exception method, used to break a cyclical dep with Base (hacky but necessary)
 *
 * @method
 * @param {module:Base.BaseType} value The native exception
 */
exports.setThrowNativeException = setThrowNativeException;
function setThrowNativeException(value) {
	throwNativeException = value;
}

/**
 * Process a set of AST nodes, taking into account return and throw statements
 *
 * @method
 * @param {Array.<module:AST.node>} astSet The set of AST nodes to process
 * @returns {Array} The return tuple from the AST set
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
			if (!inRecursionUnroll()) {
				Base.processInSkippedMode(processBlock.bind(null, astSet.slice(i + 1)));
			}
			throw e;
		}
		if (v && v.length === 3 && v[0] !== 'normal') {
			result = v;
			Base.processInSkippedMode(processBlock.bind(null, astSet.slice(i + 1)));
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
 * @param {Array.<module:AST.node>} astSet The set to check for strict mode on
 * @returns {boolean} Whether or not the block is strict
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
 * Fires a rule event from the given ast and data. It's basically a special purpose mixin for events
 *
 * @method
 * @param {module:AST.node} ast The ast associated with the event that will be queried for the base event information
 * @param {Object} data The data to mixin the base event information in to. This object is modified
 * @param {boolean} processingComplete Indicates if this rule has been processed or not. Useful for doing pre vs post
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
 * @returns {string} The name of the node
 */
exports.getRuleName = getRuleName;
function getRuleName(ast) {
	return typeof ast[0] === 'string' ? ast[0] : ast[0].name;
}

/**
 * Logs a rule
 *
 * @method
 * @param {string} ruleName The name of the rule
 */
exports.logRule = logRule;
function logRule(ruleName, data) {
	var location = Runtime.getCurrentLocation();
	Runtime.log('trace', 'Processing rule ' + ruleName + ': ' + (data ? data + ' ': '') +
		'(' + location.filename + ':' + location.line + ':' + location.column + ')');
}