/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A switch statement.
 *
 * @module rules/AST_Switch
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 12.11
 */

/**
 * @name module:rules/AST_Switch.rule
 * @event
 * @property {String} ruleName The string 'AST_Switch'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.BaseType} clauseSelector The value of the clause selector. Only available post-evaluation.
 * @property {Array} result The result of evaluating the loop. Results of statements are typically
 *		3-tuples (in the form of an array), with the first entry being the type of return (typically 'normal'), followed
 *		by two entries that are rule specific. Only available post-evaluation.
 * Only available post-evaluation.
 */

var RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base'),
	Runtime = require('../Runtime'),
	AST = require('../AST');

AST.registerRuleProcessor('AST_Switch', function processRule() {

	this._preProcess();

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
		i = 0, j, len = a.length,
		searching = true,
		found = false,
		foundInB = false,
		clauseSelector;

	function skippedNodeCallback (node) {
		node._skipped = true;
	}

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_Switch');

	input = Base.getValue(this.expression.processRule());

	// If we can't process the switch, then we simply process all cases
	if (Base.type(input) === 'Unknown') {
		this._ambiguousBlock = true;
		Runtime.enterAmbiguousBlock();
		for (i = 0, len = this.body.length; i < len; i++) {
			this.body[i].expression && this.body[i].expression.processRule();
			result = RuleProcessor.processBlock(this.body[i].body);
		}
		Runtime.exitAmbiguousBlock();
	} else {

		// Find the default case and slice the cases up to match the actual ECMA spec rules
		for (; i < len; i++) {
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
		for (i = 0, len = a.length; i < len; i++) {
			a[i]._visited = true;
			if (a[i].expression && !a[i].expression._visited) {
				AST.walk(a[i].expression, [
					{
						callback: skippedNodeCallback
					}
				]);
			}
			if (a[i].body && a[i].body[0] && !a[i].body[0]._visited) {
				for(j = 0; j < a[i].body.length; j++) {
					AST.walk(a[i].body[j], [
						{
							callback: skippedNodeCallback
						}
					]);
				}
			}
		}
	}

	if (result[0] === 'break' && (!result[2] || this.expression.label === result[2])) {
		result = ['normal', result[1], undefined];
	}

	RuleProcessor.fireRuleEvent(this, {
		clauseSelector: clauseSelector,
		result: result
	}, true);

	this._postProcess();

	return result;
});