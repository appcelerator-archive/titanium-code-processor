/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * A while loop.
 * 
 * @module rules/while
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 12.6.2
 */

/**
 * @name module:rules/while.rule
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
 * Only available post-evaluation.
 */
/**
 * @name module:rules/for.maxIterationsExceeded
 * @event
 * @property {String} ruleName The name of the loop type ("for")
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 */

var path = require("path"),
	RuleProcessor = require("../RuleProcessor"),
	Runtime = require("../Runtime"),
	Base = require("../base");

/**
 * Do not call directly. Call {@link RuleProcessor.processRule} instead.
 * 
 * @private
 */
exports.processRule = processRule;
function processRule(ast) {
	
	var v,
		conditional = ast[1],
		body = ast[2],
		stmt,
		result,
		testExprRef,
		loopIterations = 0,
		eventData;
	
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
	if (Runtime.ambiguousCode || !Runtime.options.evaluateLoops) {
		Runtime.ambiguousCode++;
		if (conditional) {
			Base.getValue(RuleProcessor.processRule(conditional));
		}
		result = RuleProcessor.processRule(body);
		Runtime.ambiguousCode--;
	} else {
		while (true) {
			
			if (++loopIterations === Runtime.options.maxLoopIterations) {
				
				eventDescription = "Maximum application loop iteration limit of " + Runtime.options.maxLoopIterations + 
					" reached, could not fully process code";
				eventData = RuleProcessor.createRuleEventInfo(ast, {});
				Runtime.fireEvent("maxIterationsExceeded", eventDescription, eventData);
				Runtime.reportWarning("maxIterationsExceeded", eventDescription, eventData);
				
				Runtime.ambiguousCode++;
				result = RuleProcessor.processRule(body);
				Runtime.ambiguousCode--;
				break;
			}
			
			testExprRef = Base.getValue(RuleProcessor.processRule(conditional));
			if (Base.type(testExprRef) === "Unknown") {
				Runtime.ambiguousCode++;
				result = RuleProcessor.processRule(body);
				Runtime.ambiguousCode--;
				break;
			}
			if (!Base.toBoolean(testExprRef).value) {
				result = ["normal", v, undefined];
				break;
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
		}
	}
	
	RuleProcessor.fireRuleEvent(ast, {
		result: result
	}, true);
	
	return result;
}
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);