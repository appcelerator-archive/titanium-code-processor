/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A for loop
 *
 * @module rules/AST_For
 * @see ECMA-262 Spec Chapter 12.6.3
 */

/**
 * @event module:rules/AST_For.rule
 * @property {string} ruleName The string 'AST_For'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {string} file The file that the rule begins on.
 * @property {number} line The line of the file where the rule begins on.
 * @property {number} column The column of the file where the rule begins on.
 * @property {boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {Array} result The return tuple of evaluating the loop. Only available post-evaluation.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Runtime = require('../Runtime'),
	Base = require('../Base');

AST.registerRuleProcessor('AST_For', function processRule() {

	var conditional = this.condition,
		testExprRef,
		iteration = this.step,
		body = this.body,
		v,
		result = ['normal', undefined, undefined],
		loopIterations = 0,
		eventDescription,
		stmt,
		context = Base.getCurrentContext();

	RuleProcessor.preProcess(this);

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_For');

	if (this.init) {
		this.init.processRule();
	}

	if (!Runtime.options.evaluateLoops) {
		this._ambiguousBlock = true;
		Base.enterAmbiguousBlock();
		if (conditional) {
			Base.getValue(conditional.processRule());
		}
		if (iteration) {
			Base.getValue(iteration.processRule());
		}
		result = body.processRule();
		if (result[0] === 'return') {
			context._returnIsUnknown = true;
			context.lexicalEnvironment.envRec._ambiguousContext = true;
			result = ['normal', undefined, undefined];
		}
		Base.exitAmbiguousBlock();
	} else {
		while (true) {

			if (++loopIterations === Runtime.options.maxLoopIterations) {

				eventDescription = 'Maximum application loop iteration limit of ' + Runtime.options.maxLoopIterations +
					' reached, could not fully process code';
				Runtime.fireEvent('maxIterationsExceeded', eventDescription);
				Runtime.reportError('maxIterationsExceeded', eventDescription, RuleProcessor.getStackTrace());

				this._ambiguousBlock = true;
				Base.enterAmbiguousBlock();
				result = body.processRule();
				if (result[0] === 'return') {
					context._returnIsUnknown = true;
					context.lexicalEnvironment.envRec._ambiguousContext = true;
					result = ['normal', undefined, undefined];
				}
				Base.exitAmbiguousBlock();
				break;
			}

			testExprRef = conditional && Base.getValue(conditional.processRule());
			if (testExprRef) {
				if (Base.type(testExprRef) === 'Unknown') {
					this._ambiguousBlock = true;
					Base.enterAmbiguousBlock();
					result = body.processRule();
					if (result[0] === 'return') {
						context._returnIsUnknown = true;
						context.lexicalEnvironment.envRec._ambiguousContext = true;
						result = ['normal', undefined, undefined];
					}
					Base.exitAmbiguousBlock();
					if (loopIterations == 1 && iteration) { // The loop did not run, so mark as skipped
						// TODO: need to set values in iteration, etc steps to unknown
						Base.processInSkippedMode(iteration.processRule.bind(iteration));
					}
					break;
				}
				if (!Base.toBoolean(testExprRef).value) {
					if (loopIterations == 1) { // The loop did not run, so mark as skipped
						// TODO: need to set values in iteration, etc steps to unknown
						if (iteration) {
							Base.processInSkippedMode(iteration.processRule.bind(iteration), body.processRule.bind(body));
						} else {
							Base.processInSkippedMode(body.processRule.bind(body));
						}
					}
					break;
				}
			}

			stmt = body.processRule();
			if (stmt[1]) {
				v = stmt[1];
			}
			if (stmt[0] === 'continue') {
				if (stmt[2] && stmt[2] !== this._label) {
					result = stmt;
					break;
				}
			} else if (stmt[0] === 'break') {
				if (stmt[2] && stmt[2] !== this._label) {
					result = stmt;
				} else {
					result = ['normal', v, undefined];
				}
				break;
			} else if (stmt[0] !== 'normal') {
				result = stmt;
				break;
			}
			if (iteration) {
				Base.getValue(iteration.processRule());
			}
		}
	}

	RuleProcessor.fireRuleEvent(this, {
		result: result
	}, true);

	RuleProcessor.postProcess(this);

	return result;
});