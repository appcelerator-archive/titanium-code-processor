/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Instantiation of a new object via the 'new' keyword.
 *
 * @module rules/AST_New
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 11.2.2
 */

/**
 * @name module:rules/AST_New.rule
 * @event
 * @property {String} ruleName The string 'AST_New'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.BaseType} result The newly instantiated object. Only available post-evaluation.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base'),
	Runtime = require('../Runtime');

AST.registerRuleProcessor('AST_New', function processRule() {

	var context,
		constructor,
		ref,
		alternateConstructors,
		arg,
		args = [],
		alternateArgs = [],
		result,
		i, ilen, j, jlen, k, p,
		skippedSets = [],
		skippedArgSet,
		skippedArgSets = [],
		lockedArgs,
		indices,
		keys,
		self = this;

	RuleProcessor.preProcess(this);

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_New');

	context = Base.getCurrentContext();
	ref = this.expression.processRule();
	constructor = Base.getValue(ref);
	alternateConstructors = Base.getValue(ref, true);

	function runFunc(func, args, runInSkippedMode) {

		var eventDescription,
			location = Runtime.getCurrentLocation();

		RuleProcessor.enterCall();

		// Update the recursion count
		if (RuleProcessor.checkForInfiniteRecursion()) {

			// Fire an event and report a warning
			eventDescription = 'Possible infinite recursion detected, could not fully process code';
			Runtime.fireEvent('maxRecusionLimitReached', eventDescription);
			Base.throwNativeException('RangeError', 'Possible infinite recursion detected');
		}

		// Invoke the constructor
		try {
			result = func.construct(args);
		} catch (e) {
			if (RuleProcessor.isRecursionExitPoint()) {
				Runtime.log('debug', 'Recovering from recursion exception at ' + location.filename + ':' + location.line);
				RuleProcessor.clearRecursionExitPoint();
				Runtime.reportError('uncaughtException', Base.getsExceptionMessage(Runtime._exception), RuleProcessor.getStackTrace());
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

			RuleProcessor.exitCall();
		}
		return result;
	}

	function callConstructor(func, args, runInSkippedMode) {

		var result;

		// Check if this is an unknown and short-circuit it
		if (Base.type(func) === 'Unknown') {
			result = new Base.UnknownType();
		} else if (func.className !== 'Function' || !func.construct) {
			Base.handleRecoverableNativeException('TypeError', 'Attempted to instantaite a non-constructor');
			result = new Base.UnknownType();
		} else if (!Base.isCallable(func)) {
			Base.handleRecoverableNativeException('TypeError', Base.getReferencedName(ref) + ' is not callable');
			result = new Base.UnknownType();
		} else {
			if (runInSkippedMode) {
				if (func._ast && func._ast.start.file && !Runtime.isFileBlacklisted(func._ast.start.file)) {
					Base.processInSkippedMode(runFunc.bind(this, func, args, runInSkippedMode));
				}
			} else {
				result = runFunc(func, args, runInSkippedMode);
			}
		}
		return result;
	}

	if (Base.type(ref) == 'Reference' && Base.isUnresolvableReference(ref)) {
		result = new Base.UnknownType();
	} else {

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

		// Update the argument closures
		for (i = 0, ilen = args.length; i < ilen; i++) {
			args[i]._updateClosure(constructor._closure);
		}

		// Call the primary function
		result = callConstructor(constructor, args);

		// Call the alternate functions/args in skipped mode
		for (j = 0, jlen = skippedArgSets.length; j < jlen; j++) {
			callConstructor(constructor, skippedArgSets[j], true);
		}
		keys = Object.keys(alternateConstructors);
		for (i = 0, ilen = keys.length; i < ilen; i++) {
			callConstructor(alternateConstructors[keys[i]], args, true);
			for (j = 0, jlen = skippedArgSets.length; j < jlen; j++) {
				callConstructor(alternateConstructors[keys[i]], skippedArgSets[j], true);
			}
		}
	}

	RuleProcessor.fireRuleEvent(this, {
		result: result
	}, true);

	RuleProcessor.postProcess(this, result);

	return result;
});