/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * A throw statement.
 * 
 * @module rules/throw
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 
 */

/**
 * @name module:rules/throw.rule
 * @event
 * @property {String} ruleName The string 'call'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {Array} result The result of evaluating the throw statement. Results of throw statements are 3-tuples (in the 
 *		form of an array), with the first entry being 'throw', the second being the value of the throw, and the third
 *		being undefined. Only available post-evaluation.
 */

var path = require('path'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base');

/**
 * Do not call directly. Call {@link RuleProcessor.processRule} instead.
 * 
 * AST: [node-info, value <ast>]
 * 
 * @private
 */
exports.processRule = processRule;
function processRule(ast) {
	
	var result;
	
	RuleProcessor.fireRuleEvent(ast, {}, false);
	RuleProcessor.logRule('throw');
	
	result = ['throw', Base.getValue(RuleProcessor.processRule(ast[1])), undefined];
	RuleProcessor.fireRuleEvent(ast, {
		result: result
	}, true);
	
	Base.throwException(result[1]);
}
RuleProcessor.registerRuleProcessor(path.basename(__filename, '.js'), exports);