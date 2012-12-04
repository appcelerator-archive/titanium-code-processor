/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A switch statement.
 *
 * @module rules/switch
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 12.11
 */

/**
 * @name module:rules/switch.rule
 * @event
 * @property {String} ruleName The string 'call'
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

var path = require('path'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base'),
	Runtime = require('../Runtime'),
	AST = require('../AST');

/**
 * Do not call directly. Call {@link RuleProcessor.processRule} instead.
 *
 * AST: [node-info, selector <ast>, cases <array[tuple[<value <ast | null (default)>, body <array[ast]>]]>]
 *
 * @private
 */
exports.processRule = processRule;
function processRule(ast) {
	
	var input,
		result,
		a = ast[2],
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
	
	RuleProcessor.fireRuleEvent(ast, {}, false);
	RuleProcessor.logRule('switch');
	
	input = Base.getValue(RuleProcessor.processRule(ast[1]));
	clauseSelector = Base.getValue(RuleProcessor.processRule(c[0]));
	
	// If we can't process the switch, then we simply process all cases
	if (Base.type(clauseSelector) === 'Unknown') {
		Runtime.enterAmbiguousBlock();
		for (i = 0, len = ast[2].length; i < len; i++) {
			result = RuleProcessor.processRule(ast[2][i][0]);
			result = RuleProcessor.processBlock(ast[2][i][1]);
		}
		Runtime.exitAmbiguousBlock();
	} else {

		// Find the default case and slice the cases up to match the actual ECMA spec rules
		for (; i < len; i++) {
			if (!a[i][0]) {
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
		}
		
		if (defaultClause) {
			returnLoop:
			while (true) {
				// Step 5
				aLoop:
				while (true) {
					c = a[cIndex++];
					if (!c) {
						break aLoop;
					}
					clauseSelector = Base.getValue(RuleProcessor.processRule(c[0]));
					if (!found) {
						if (Base.strictEquals(input, clauseSelector)) {
							found = true;
						}
					}
					if (found && c[1]) {
						for (i = 0, len = c[1].length; i < len; i++) {
							r = RuleProcessor.processRule(c[1][i]);
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
						clauseSelector = Base.getValue(RuleProcessor.processRule(c[0]));
						if (Base.strictEquals(input, clauseSelector)) {
							foundInB = true;
							if (c[1]) {
								for (i = 0, len = c[1].length; i < len; i++) {
									r = RuleProcessor.processRule(c[1][i]);
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
				if (!foundInB && defaultClause[1]) {
					for (i = 0, len = defaultClause[1].length; i < len; i++) {
						r = RuleProcessor.processRule(defaultClause[1][i]);
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
					if (c[1]) {
						for (i = 0, len = c[1].length; i < len; i++) {
							r = RuleProcessor.processRule(c[1][i]);
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
					clauseSelector = Base.getValue(RuleProcessor.processRule(c[0]));
					if (Base.strictEquals(input, clauseSelector)) {
						searching = false;
						for (i = 0, len = c[1].length; i < len; i++) {
							r = RuleProcessor.processRule(c[1][i]);
							if (r[0] !== 'normal') {
								result = r;
								break caseLoop;
							}
							v = r[1];
						}
					}
				} else if (c) {
					if (c[1]) {
						for (i = 0, len = c[1].length; i < len; i++) {
							r = RuleProcessor.processRule(c[1][i]);
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
		a = ast[2];
		for (i = 0, len = a.length; i < len; i++) {
			if (a[i][0] && !a[i][0]._visited) {
				AST.walk(a[i][0], {
					'*': function (node, next) {
						node._skipped = true;
						next();
					}
				});
			}
			if (a[i][1] && a[i][1][0] && !a[i][1][0]._visited) {
				for(j = 0; j < a[i][1].length; j++) {
					AST.walk(a[i][1][j], {
						'*': function (node, next) {
							node._skipped = true;
							next();
						}
					});
				}
			}
		}
	}
		
	if (result[0] === 'break' && (!result[2] || ast[0].label === result[2])) {
		result = ['normal', result[1], undefined];
	}
	
	RuleProcessor.fireRuleEvent(ast, {
		clauseSelector: clauseSelector,
		result: result
	}, true);
	
	return result;
}
RuleProcessor.registerRuleProcessor(path.basename(__filename, '.js'), exports);