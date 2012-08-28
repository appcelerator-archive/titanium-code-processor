/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * A function call
 * 
 * @module rules/call
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 11.2.3
 */

/**
 * @name module:rules/call.rule
 * @event
 * @property {String} ruleName The string "call"
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.FunctionType} func The function to be called. Only available post-evaluation.
 * @property {Array[{@link module:Base.BaseType}]} args The function arguments. Only available post-evaluation.
 * @property {module:Base.BaseType} thisValue The value of "this" inside the function. Only available post-evaluation.
 * @property {module:Base.BaseType} result The result of the function call. Only available post-evaluation.
 */

var path = require("path"),
	RuleProcessor = require("../RuleProcessor"),
	Base = require("../Base"),
	Runtime = require("../Runtime"),
	Exceptions = require("../Exceptions");

/**
 * Do not call directly. Call {@link RuleProcessor.processRule} instead.
 * 
 * @private
 */
exports.processRule = function processRule(ast) {
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
	var ref = RuleProcessor.processRule(ast[1]),
		func = Base.getValue(ref),
		result,
		args = [],
		i = 0, len = ast[2].length,
		thisValue;
	
	// Check if the value is unknown
	if (Base.type(func) === "Unknown") {
		result = new Base.UnknownType();
	} else {
		// Process the arguments
		for (; i < len; i++) {
			args.push(Base.getValue(RuleProcessor.processRule(ast[2][i])));
		}
			
		// Make sure funct is actually a function
		if (Base.type(func) !== "Function" || !Base.isCallable(func)) {
			throw new Exceptions.TypeError();
		}
		
		// Determine the this value
		if (Base.type(ref) === "Reference") {
			thisValue = Base.getBase(ref);
			if (!Base.isPropertyReference(ref)) {
				thisValue = thisValue.implicitThisValue();
			}
		} else {
			thisValue = new Base.UndefinedType();
		}
		
		// Call the function
		result = func.call(thisValue, args);
	}
	
	RuleProcessor.fireRuleEvent(ast, {
		func: func,
		args: args,
		thisValue: thisValue,
		result: result
	}, true);
	
	return result;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);