/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A while loop.
 *
 * @module rules/AST_While
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 12.6.2
 */

/**
 * @name module:rules/AST_While.rule
 * @event
 * @property {String} ruleName The string 'AST_While'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {Array} result The result of evaluating the loop. Results of statements are typically
 *		3-tuples (in the form of an array), with the first entry being the type of return (typically 'normal'), followed
 *		by two entries that are rule specific. Only available post-evaluation.
 * Only available post-evaluation.
 */
/**
 * @name module:rules/for.maxIterationsExceeded
 * @event
 * @property {String} ruleName The name of the loop type ('for')
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Runtime = require('../Runtime'),
	Base = require('../Base');

AST.registerRuleProcessor('AST_While', function processRule() {

	this._preProcess();

	var v,
		conditional = this.condition,
		body = this.body,
		stmt,
		result,
		testExprRef,
		loopIterations = 0,
		eventData,
		eventDescription;

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_While');

	if (!Runtime.options.evaluateLoops) {
		this._ambiguousBlock = true;
		Runtime.enterAmbiguousBlock();
		if (conditional) {
			Base.getValue(conditional.processRule());
		}
		result = body.processRule();
		Runtime.exitAmbiguousBlock();
	} else {
		while (true) {

			if (++loopIterations === Runtime.options.maxLoopIterations) {

				eventDescription = 'Maximum application loop iteration limit of ' + Runtime.options.maxLoopIterations +
					' reached, could not fully process code';
				eventData = {
					ruleName: this.className,
					ast: this
				};
				Runtime.fireEvent('maxIterationsExceeded', eventDescription, eventData);
				Runtime.reportWarning('maxIterationsExceeded', eventDescription, eventData);

				this._ambiguousBlock = true;
				Runtime.enterAmbiguousBlock();
				result = body.processRule();
				Runtime.exitAmbiguousBlock();
				break;
			}

			testExprRef = Base.getValue(conditional.processRule());
			if (Base.type(testExprRef) === 'Unknown') {
				this._ambiguousBlock = true;
				Runtime.enterAmbiguousBlock();
				result = body.processRule();
				Runtime.exitAmbiguousBlock();
				break;
			}
			if (!Base.toBoolean(testExprRef).value) {
				result = ['normal', v, undefined];
				break;
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
		}
	}

	RuleProcessor.fireRuleEvent(this, {
		result: result
	}, true);

	this._postProcess();

	return result;
});