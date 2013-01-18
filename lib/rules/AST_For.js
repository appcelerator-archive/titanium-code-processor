/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A for loop
 *
 * @module rules/AST_For
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 12.6.3
 */

/**
 * @name module:rules/AST_For.rule
 * @event
 * @property {String} ruleName The string 'AST_For'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {Array} result The result of evaluating the loop. Results of statements are typically
 *		3-tuples (in the form of an array), with the first entry being the type of return (typically 'normal'), followed
 *		by two entries that are rule specific. Only available post-evaluation.
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

AST.registerRuleProcessor('AST_For', function processRule() {

	this._preProcess();

	var conditional = this.condition,
		testExprRef,
		iteration = this.step,
		body = this.body,
		v,
		result = ['normal', undefined, undefined],
		loopIterations = 0,
		eventData,
		eventDescription,
		stmt;

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_For');

	if (this.init) {
		this.init.processRule();
	}

	if (!Runtime.options.evaluateLoops) {
		this._ambiguousBlock = true;
		Runtime.enterAmbiguousBlock();
		if (conditional) {
			Base.getValue(conditional.processRule());
		}
		if (iteration) {
			Base.getValue(iteration.processRule());
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

			testExprRef = conditional && Base.getValue(conditional.processRule());
			if (testExprRef) {
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

	this._postProcess();

	return result;
});