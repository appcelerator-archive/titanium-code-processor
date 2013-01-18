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
/**
 * @name module:rules/AST_Do.maxIterationsExceeded
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

AST.registerRuleProcessor('AST_Do', function processRule() {

	this._preProcess();

	var v,
		conditional = this.condition,
		body = this.body,
		stmt,
		result = ['normal', v, undefined],
		testExprRef,
		loopIterations = 0,
		eventDescription,
		eventData;

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_Do');

	if (!Runtime.options.evaluateLoops) {
		Runtime.enterAmbiguousBlock();
		this._ambiguousBlock = true;
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
				this._ambiguousBlock = true;
				Runtime.enterAmbiguousBlock();
				result = body.processRule();
				Runtime.exitAmbiguousBlock();
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

	this._postProcess();

	return result;
});