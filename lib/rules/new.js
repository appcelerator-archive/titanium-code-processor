/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * Instantiation of a new object via the "new" keyword.
 * 
 * @module rules/new
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 11.2.2
 */

/**
 * @name module:rules/new.rule
 * @event
 * @property {String} ruleName The string "call"
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.BaseType} result The newly instantiated object. Only available post-evaluation.
 */

var path = require("path"),
	RuleProcessor = require("../RuleProcessor"),
	Base = require("../Base"),
	Exceptions = require("../Exceptions"),
	Runtime = require("../Runtime");

/**
 * Do not call directly. Call {@link RuleProcessor.processRule} instead.
 * 
 * AST: [node-info, function <ast>, arguments <array[ast]>]
 * 
 * @private
 */
exports.processRule = processRule;
function processRule(ast) {
	
	var context,
		constructor,
		args = [],
		result,
		i,
		len;

	RuleProcessor.fireRuleEvent(ast, {}, false);
	RuleProcessor.logRule('new');
	
	context = Runtime.getCurrentContext();
	constructor = Base.getValue(RuleProcessor.processRule(ast[1]));
		
	// Check if this is an unknown and short-circuit it
	if (Base.type(constructor) === "Unknown") {
		result = new Base.UnknownType();
	} else {
		// Make sure that this is really a constructor
		if (constructor.className !== "Function" || !constructor.construct) {
			throw new Exceptions.TypeError('Attempted to instantaite a non-constructor');
		}
		
		// Process the arguments
		for (i = 0, len = ast[2].length; i < len; i++) {
			args.push(Base.getValue(RuleProcessor.processRule(ast[2][i])));
		}
		
		// Invoke the constructor
		result = constructor.construct(args);
	}
	
	RuleProcessor.fireRuleEvent(ast, {
		result: result
	}, true);
	
	return result;
}
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);