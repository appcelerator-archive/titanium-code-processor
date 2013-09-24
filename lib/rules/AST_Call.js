/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A function call
 *
 * @module rules/AST_Call
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 11.2.3
 */

/**
 * @name module:rules/AST_Call.rule
 * @event
 * @property {String} ruleName The string 'AST_Call'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.FunctionType} func The function to be called. Only available post-evaluation.
 * @property {Array[{@link module:Base.BaseType}]} args The function arguments. Only available post-evaluation.
 * @property {module:Base.BaseType} thisValue The value of 'this' inside the function. Only available post-evaluation.
 * @property {module:Base.BaseType} result The result of the function call. Only available post-evaluation.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base'),
	Runtime = require('../Runtime');

AST.registerRuleProcessor('AST_Call', function processRule() {

	var ref,
		func,
		alternateFuncs,
		result,
		args = [],
		alternateArgs = [],
		arg,
		i, ilen, j, jlen, k, p,
		thisValue,
		location = Runtime.getCurrentLocation(),
		keys,
		skippedSets = [],
		skippedArgSet,
		skippedArgSets = [],
		lockedArgs,
		indices,
		self = this;

	RuleProcessor.preProcess(this);

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_Call');

	// Process the function itself
	ref = this.expression.processRule();
	func = Base.getValue(ref);
	alternateFuncs = Base.getValue(ref, true);

	function callFunc(func, args, thisValue, runInSkippedMode) {

		var result,
			eventDescription,
			eventData;

		// Check if this is an unknown and short-circuit it
		if (Base.type(func) === 'Unknown') {
			result = new Base.UnknownType();
		} else if (func.className !== 'Function') {
			Base.handleRecoverableNativeException('TypeError', Base.getReferencedName(ref) + ' is not a function');
			result = new Base.UnknownType();
		} else if (!Base.isCallable(func)) {
			Base.handleRecoverableNativeException('TypeError', Base.getReferencedName(ref) + ' is not callable');
			result = new Base.UnknownType();
		} else {
			if (runInSkippedMode) {
				Base.enterSkippedMode();
			}
			RuleProcessor.enterCall();

			// Update the recursion count
			if (++Runtime.recursionCount >= Runtime.options.maxRecursionLimit) {
				RuleProcessor.setRecursionExitPoint();

				// Fire an event and report a warning
				eventDescription = 'Maximum application recursion limit of ' + Runtime.options.maxRecursionLimit +
					' reached, could not fully process code';
				eventData = {
					ruleName: self.className,
					ast: self
				};
				Runtime.fireEvent('maxRecusionLimitReached', eventDescription, eventData);
				Base.throwNativeException('RangeError', 'Maximum callstack size exceeded');
			}

			// Call the function, checking if this is a direct call to eval
			try {
				result = func.callFunction(thisValue, args, {
					isDirectEval: Base.getReferencedName(ref) === 'eval',
					isAmbiguousContext: Base.isAmbiguousBlock()
				});
			} catch (e) {
				if (RuleProcessor.isRecursionExitPoint()) {
					Runtime.log('debug', 'Recovering from callstack exceeded exception at ' + location.filename + ':' + location.line);
					RuleProcessor.clearRecursionExitPoint();
					Runtime.reportError('uncaughtException', Base.getsExceptionMessage(Runtime._exception));
					Runtime._exception = undefined;
					result = new Base.UnknownType();
				} else if (!runInSkippedMode || !e.isCodeProcessorException) {
					throw e;
				}
			} finally {
				// Store the jump
				if (func._location) {
					self._jumpDestinations = self._jumpDestinations || {};
					self._jumpDestinations[func._location.filename + ':' + func._location.line] = {
						filename: func._location.filename,
						line: func._location.line
					};
				}
				if (func._ast) {
					func._ast._jumpSources = func._ast._jumpSources || {};
					func._ast._jumpSources[location.filename + ':' + location.line] = {
						filename: location.filename,
						line: location.line
					};
				}

				Runtime.recursionCount--;
				if (runInSkippedMode) {
					Base.exitSkippedMode();
				}
				RuleProcessor.exitCall();
			}
		}

		return runInSkippedMode ? new Base.UnknownType() : result;
	}

		// Process the arguments
	for (i = 0, ilen = this.args.length; i < ilen; i++) {
		arg = this.args[i].processRule();
		args.push(Base.getValue(arg));
		alternateArgs.push(Base.getValue(arg, true));
		alternateArgs[alternateArgs.length - 1][0] = args[args.length - 1];
	}

	for (i = 0, ilen = alternateArgs.length; i < ilen; i++) {
		for (p in alternateArgs[i]) {
			if (skippedSets.indexOf(p) == -1) {
				skippedSets.push(p);
			}
		}
	}
	skippedSets = skippedSets.sort();
	for (i = 1, ilen = skippedSets.length; i < ilen; i++) {

		lockedArgs = [];
		for (j = 0, jlen = alternateArgs.length; j < jlen; j++) {
			if (alternateArgs[j][skippedSets[i]]) {
				lockedArgs[j] = alternateArgs[j][skippedSets[i]];
			}
		}

		indices = [];
		for (j = 0, jlen = alternateArgs.length; j < jlen; j++) {
			if (!lockedArgs[j]) {
				k = i + 1;
				while (!alternateArgs[j][skippedSets[--k]]);
				indices[j] = k;
			}
		}

		indexUpdateLoop: while(true) {
			skippedArgSets.push(skippedArgSet = []);
			for (j = 0, jlen = alternateArgs.length; j < jlen; j++) {
				if (lockedArgs[j]) {
					skippedArgSet.push(lockedArgs[j]);
				} else {
					skippedArgSet.push(alternateArgs[j][skippedSets[indices[j]]]);
				}
			}
			if (!indices.length) {
				break;
			}
			for (j = 0, jlen = indices.length; j < jlen; j++) {
				if (typeof indices[j] != 'undefined') {
					if (skippedSets[indices[j]] == '0') {
						if (j == jlen - 1) {
							break indexUpdateLoop;
						}
						k = i + 1;
						while (!alternateArgs[j][skippedSets[--k]]);
						indices[j] = k;
					} else {
						k = indices[j];
						while (!alternateArgs[j][skippedSets[--k]]);
						indices[j] = k;
						break;
					}
				}
			}
		}
	}

	// Determine the this value
	if (Base.type(ref) === 'Reference') {
		thisValue = Base.getBase(ref);
		if (!Base.isPropertyReference(ref)) {
			thisValue = thisValue.implicitThisValue();
		}
	} else {
		thisValue = new Base.UndefinedType();
	}

	// Update the argument closures
	for (i = 0, ilen = args.length; i < ilen; i++) {
		args[i]._updateClosure(func._closure);
	}

	// Call the primary function
	result = callFunc(func, args, thisValue);

	// Call the alternate functions/args in skipped mode
	for (j = 0, jlen = skippedArgSets.length; j < jlen; j++) {
		callFunc(func, skippedArgSets[j], thisValue, true);
	}
	keys = Object.keys(alternateFuncs);
	for (i = 0, ilen = keys.length; i < ilen; i++) {
		callFunc(alternateFuncs[keys[i]], args, true);
		for (j = 0, jlen = skippedArgSets.length; j < jlen; j++) {
			callFunc(alternateFuncs[keys[i]], skippedArgSets[j], thisValue, true);
		}
	}

	RuleProcessor.fireRuleEvent(this, {
		func: func,
		args: args,
		thisValue: thisValue,
		result: result
	}, true);

	RuleProcessor.postProcess(this, result);

	return result;
});