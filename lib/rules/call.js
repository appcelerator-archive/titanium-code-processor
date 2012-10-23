/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * A function call
 * 
 * @module rules/call
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 11.2.3
 */

/**
 * @name module:rules/call.rule
 * @event
 * @property {String} ruleName The string 'call'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.FunctionType} func The function to be called. Only available post-evaluation.
 * @property {Array[{@link module:Base.BaseType}]} args The function arguments. Only available post-evaluation.
 * @property {module:Base.BaseType} thisValue The value of 'this' inside the function. Only available post-evaluation.
 * @property {module:Base.BaseType} result The result of the function call. Only available post-evaluation.
 */

var path = require('path'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base'),
	Runtime = require('../Runtime');

/**
 * Do not call directly. Call {@link RuleProcessor.processRule} instead.
 * 
 * AST: [node-info, name <ast>, arguments <array[ast]>]
 * 
 * @private
 */
exports.processRule = processRule;
function processRule(ast) {
	
	var ref,
		func,
		result,
		args,
		i, len,
		thisValue,
		eventDescription,
		eventData;
	
	RuleProcessor.fireRuleEvent(ast, {}, false);
	RuleProcessor.logRule('call');
	
	ref = RuleProcessor.processRule(ast[1]);
	func = Base.getValue(ref);
	args = [];
	i = 0, len = ast[2].length;
	
	// Check if the value is unknown
	if (Base.type(func) === 'Unknown' || !Runtime.options.invokeMethods) {
		result = new Base.UnknownType();
	} else {
		
		// Update the recursion count
		if (++Runtime.recursionCount === Runtime.options.maxRecursionLimit) {
		
			// Fire an event and report a warning
			eventDescription = 'Maximum application recursion limit of ' + Runtime.options.maxRecursionLimit + 
				' reached, could not fully process code';
			eventData = RuleProcessor.createRuleEventInfo(ast, {});
			Runtime.fireEvent('maxRecusionLimitReached', eventDescription, eventData);
			Runtime.reportWarning('maxRecusionLimitReached', eventDescription, eventData);
			
			// Set the result to unknown
			result = new Base.UnknownType();
		
		} else {
			
			// Process the arguments
			for (; i < len; i++) {
				args.push(Base.getValue(RuleProcessor.processRule(ast[2][i])));
			}
			
			// Make sure func is actually a function
			if (Base.type(func) === 'Unknown') {
				result = new Base.UnknownType();
			} else {
				if (func.className !== 'Function' || !Base.isCallable(func)) {
					Base.throwException('TypeError', Base.getReferencedName(ref) + ' is not callable');
				}
		
				// Determine the this value
				if (Base.type(ref) === 'Reference') {
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
		}
		Runtime.recursionCount--;
	}
	
	RuleProcessor.fireRuleEvent(ast, {
		func: func,
		args: args,
		thisValue: thisValue,
		result: result
	}, true);
	
	return result;
}
RuleProcessor.registerRuleProcessor(path.basename(__filename, '.js'), exports);