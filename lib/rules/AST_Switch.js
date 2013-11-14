/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A switch statement.
 *
 * @module rules/AST_Switch
 * @see ECMA-262 Spec Chapter 12.11
 */

/**
 * @event module:rules/AST_Switch.rule
 * @property {string} ruleName The string 'AST_Switch'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {string} file The file that the rule begins on.
 * @property {number} line The line of the file where the rule begins on.
 * @property {number} column The column of the file where the rule begins on.
 * @property {boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:base.BaseType} clauseSelector The value of the clause selector. Only available post-evaluation.
 * @property {Array} result The return tuple of evaluating the loop. Only available post-evaluation.
 */

var RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base'),
	AST = require('../AST');

AST.registerRuleProcessor('AST_Switch', function processRule() {

	var input,
		result,
		a = this.body,
		b,
		defaultClause,
		defaultClauseIndex,
		c = a[0],
		r,
		v,
		cIndex = 0,
		i, j, len,
		searching = true,
		found = false,
		foundInB = false,
		clauseSelector,
		context = Base.getCurrentContext();

	RuleProcessor.preProcess(this);

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_Switch');

	input = Base.getValue(this.expression.processRule());

	// If we can't process the switch, then we simply process all cases
	if (Base.type(input) === 'Unknown') {
		this._ambiguousBlock = true;
		this.expression._unknown = true;
		Base.enterAmbiguousBlock();
		for (i = 0, len = this.body.length; i < len; i++) {
			Base.setVisited(this.body[i]);
			this.body[i].expression && this.body[i].expression.processRule();
			result = RuleProcessor.processBlock(this.body[i].body);
		}
		if (result[0] === 'return') {
			context._returnIsUnknown = true;
			context.lexicalEnvironment.envRec._ambiguousContext = true;
			result = ['normal', undefined, undefined];
		}
		Base.exitAmbiguousBlock();
	} else {

		// Find the default case and slice the cases up to match the actual ECMA spec rules
		for (i = 0, len = a.length; i < len; i++) {
			if (!a[i].expression) {
				if (defaultClause) {
					Base.throwNativeException('SyntaxError', 'Multiple default clauses are not allowed');
				}
				defaultClause = a[i];
				defaultClauseIndex = i;
			}
		}

		if (defaultClause) {
			b = a.slice(defaultClauseIndex + 1);
			a = a.slice(0, defaultClauseIndex);

			returnLoop:
			while (true) {
				// Step 5
				aLoop:
				while (true) {
					c = a[cIndex++];
					if (!c) {
						break aLoop;
					}
					clauseSelector = Base.getValue(c.expression.processRule());
					if (!found) {
						if (Base.strictEquals(input, clauseSelector)) {
							found = true;
						}
					}
					if (found && c.body) {
						for (i = 0, len = c.body.length; i < len; i++) {
							r = c.body[i].processRule();
							if (r[1]) {
								v = r[1];
							}
							if (r[0] !== 'normal') {
								result = [r[0], v, r[2]];
								break returnLoop;
							}
						}
					}
				}
				// Step 7
				cIndex = 0;
				if (!found) {
					bLoop:
					while (!foundInB) {
						c = b[cIndex++];
						if (!c) {
							break bLoop;
						}
						clauseSelector = Base.getValue(c.expression.processRule());
						if (Base.strictEquals(input, clauseSelector)) {
							foundInB = true;
							if (c.body) {
								for (i = 0, len = c.body.length; i < len; i++) {
									r = c.body[i].processRule();
									if (r[1]) {
										v = r[1];
									}
									if (r[0] !== 'normal') {
										result = [r[0], v, r[2]];
										break returnLoop;
									}
								}
							}
						}
					}
				}
				// Step 8
				if (!foundInB && defaultClause.body) {
					for (i = 0, len = defaultClause.body.length; i < len; i++) {
						r = defaultClause.body[i].processRule();
						if (r[1]) {
							v = r[1];
						}
						if (r[0] !== 'normal') {
							result = [r[0], v, r[2]];
							break returnLoop;
						}
					}
				}
				// Step 9
				while (true) {
					c = b[cIndex++];
					if (!c) {
						result = ['normal', undefined, undefined];
						break returnLoop;
					}
					if (c.body) {
						for (i = 0, len = c.body.length; i < len; i++) {
							r = c.body[i].processRule();
							if (r[1]) {
								v = r[1];
							}
							if (r[0] !== 'normal') {
								result = [r[0], v, r[2]];
								break returnLoop;
							}
						}
					}
				}
				break returnLoop;
			}

		} else {
			caseLoop:
			while (true) {
				c = a[cIndex++];
				if (searching) {
					if (!c) {
						result = ['normal', v, undefined];
						break caseLoop;
					}
					clauseSelector = Base.getValue(c.expression.processRule());
					if (Base.strictEquals(input, clauseSelector)) {
						searching = false;
						for (i = 0, len = c.body.length; i < len; i++) {
							r = c.body[i].processRule();
							if (r[0] !== 'normal') {
								result = r;
								break caseLoop;
							}
							v = r[1];
						}
					}
				} else if (c) {
					if (c.body) {
						for (i = 0, len = c.body.length; i < len; i++) {
							r = c.body[i].processRule();
							if (r[1]) {
								v = r[1];
							}
							if (r[0] !== 'normal') {
								result = [r[0], v, r[2]];
								break caseLoop;
							}
						}
					}
				} else {
					result = ['normal', v, undefined];
					break caseLoop;
				}
			}
		}

		// Mark all the skipped nodes as skipped. It's just easier to do it after the fact
		a = this.body;
		Base.processInSkippedMode(function () {
			for (i = 0, len = a.length; i < len; i++) {
				Base.setVisited(a[i]);
				if (a[i].expression && !a[i].expression._visited) {
					a[i].expression.processRule();
				}
				if (a[i].body && a[i].body[0] && !a[i].body[0]._visited) {
					for (j = 0; j < a[i].body.length; j++) {
						a[i].body[j].processRule();
					}
				}
			}
		});
	}

	if (result[0] === 'break' && (!result[2] || this.expression.label === result[2])) {
		result = ['normal', result[1], undefined];
	}

	RuleProcessor.fireRuleEvent(this, {
		clauseSelector: clauseSelector,
		result: result
	}, true);

	RuleProcessor.postProcess(this);

	return result;
});