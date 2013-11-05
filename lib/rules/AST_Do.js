/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A do-while loop
 *
 * @module rules/AST_Do
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 12.6.1
 */

/**
 * @name module:rules/AST_Do.rule
 * @event
 * @property {String} ruleName The string 'AST_Do'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {Array} result The result of evaluating the do-while loop. Results of statements are typically
 *		3-tuples (in the form of an array), with the first entry being the type of return (typically 'normal'), followed
 *		by the value of the last
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Runtime = require('../Runtime'),
	Base = require('../Base');

AST.registerRuleProcessor('AST_Do', function processRule() {

	var v,
		conditional = this.condition,
		body = this.body,
		stmt,
		result = ['normal', undefined, undefined],
		testExprRef,
		loopIterations = 0,
		eventDescription,
		context = Base.getCurrentContext();

	RuleProcessor.preProcess(this);

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_Do');

	if (!Runtime.options.evaluateLoops) {
		Base.enterAmbiguousBlock();
		this._ambiguousBlock = true;
		if (conditional) {
			if (Base.getValue(conditional.processRule())) {
				conditional._unknown = true;
			}
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
				Runtime.reportError('maxIterationsExceeded', eventDescription);

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

			stmt = body.processRule();
			if (stmt[1]) {
				v = stmt[1];
				result = ['normal', v, undefined];
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

			testExprRef = Base.getValue(conditional.processRule());
			if (Base.type(testExprRef) === 'Unknown') {
				conditional._unknown = true;
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
			if (!Base.toBoolean(testExprRef).value) {
				break;
			}
		}
	}

	RuleProcessor.fireRuleEvent(this, {
		result: result
	}, true);

	RuleProcessor.postProcess(this);

	return result;
});