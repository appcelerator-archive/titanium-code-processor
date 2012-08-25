/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * A for loop
 * 
 * @module rules/for
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 12.6.3
 */

/**
 * @name module:rules/for.rule
 * @event
 * @property {String} ruleName The string "call"
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {Array} result The result of evaluating the loop. Results of statements are typically 
 *		3-tuples (in the form of an array), with the first entry being the type of return (typically "normal"), followed
 *		by two entries that are rule specific. Only available post-evaluation.
 */

var path = require("path"),
	RuleProcessor = require("../RuleProcessor"),
	Runtime = require("../Runtime"),
	Base = require("../Base");

/**
 * Do not call directly. Call {@link RuleProcessor.processRule} instead.
 * 
 * @private
 */
exports.processRule = function processRule(ast) {
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
	var conditional = ast[2],
		testExprRef,
		iteration = ast[3],
		body = ast[4],
		v,
		result = ["normal", undefined, undefined];
	
	if (ast[1]) {
		RuleProcessor.processRule(ast[1]);
	}
	
	if (Runtime.ambiguousCode || !Runtime.options.evaluateLoops) {
		Runtime.ambiguousCode++;
		if (conditional) {
			Base.getValue(RuleProcessor.processRule(conditional));
		}
		if (iteration) {
			Base.getValue(RuleProcessor.processRule(iteration));
		}
		result = RuleProcessor.processRule(body);
		Runtime.ambiguousCode--;
	}
	
	while (true) {
	
		testExprRef = conditional && Base.getValue(RuleProcessor.processRule(conditional));
		if (testExprRef) {
			if (Base.type(testExprRef) === "Unknown") {
				Runtime.ambiguousCode++;
				result = RuleProcessor.processRule(body);
				Runtime.ambiguousCode--;
				break;
			}
			if (!Base.toBoolean(testExprRef).value) {
				break;
			}
		}
		
		stmt = RuleProcessor.processRule(body);
		if (stmt[1]) {
			v = stmt[1];
		}
		if (stmt[0] === "continue") {
			if (stmt[2] && stmt[2] !== ast[0].label) {
				result = stmt;
				break;
			}
		} else if (stmt[0] === "break") {
			if (stmt[2] && stmt[2] !== ast[0].label) {
				result = stmt;
			} else {
				result = ["normal", v, undefined];
			}
			break;
		} else if (stmt[0] !== "normal") {
			result = stmt;
			break;
		}
		if (iteration) {
			Base.getValue(RuleProcessor.processRule(iteration));
		}
	}
	
	RuleProcessor.fireRuleEvent(ast, {
		result: result
	}, true);
	return result;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);