/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A function call
 *
 * @module rules/AST_Call
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 11.2.3
 */

/**
 * @name module:rules/AST_Call.rule
 * @event
 * @property {String} ruleName The string 'AST_Call'
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

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base'),
	Runtime = require('../Runtime');

AST.registerRuleProcessor('AST_Call', function processRule() {

	this._preProcess();

	var ref,
		func,
		result,
		args = [],
		i, len,
		thisValue,
		eventDescription,
		eventData,
		argValue;

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_Call');

	// Process the function itself
	ref = this.expression.processRule();
	func = Base.getValue(ref);

	// Check if the value is unknown
	if (Base.type(func) === 'Unknown' || !Runtime.options.invokeMethods) {
		result = new Base.UnknownType();
	} else {

		// Update the recursion count
		if (++Runtime.recursionCount >= Runtime.options.maxRecursionLimit) {

			// Fire an event and report a warning
			eventDescription = 'Maximum application recursion limit of ' + Runtime.options.maxRecursionLimit +
				' reached, could not fully process code';
			eventData = {
				ruleName: this.className,
				ast: this
			};
			Runtime.fireEvent('maxRecusionLimitReached', eventDescription, eventData);
			Base.throwNativeException('RangeError', 'Maximum recursion depth reached');

		} else {

			// Process the arguments
			for (i = 0, len = this.args.length; i < len; i++) {
				argValue = Base.getValue(this.args[i].processRule());
				args.push(argValue);
			}

			// Make sure func is actually a function
			if (Base.type(func) === 'Unknown') {
				result = new Base.UnknownType();
			} else if (func.className !== 'Function') {
				Base.handleRecoverableNativeException('TypeError', Base.getReferencedName(ref) + ' is not a function');
				result = new Base.UnknownType();
			} else if (!Base.isCallable(func)) {
				Base.handleRecoverableNativeException('TypeError', Base.getReferencedName(ref) + ' is not callable');
				result = new Base.UnknownType();
			} else {

				// Determine the this value
				if (Base.type(ref) === 'Reference') {
					thisValue = Base.getBase(ref);
					if (!Base.isPropertyReference(ref)) {
						thisValue = thisValue.implicitThisValue();
					}
				} else {
					thisValue = new Base.UndefinedType();
				}

				// Update the argument closures
				for (i = 0; i < len; i++) {
					args[i]._updateClosure(func._closure);
				}

				// Call the function, checking if this is a direct call to eval
				result = func.call(thisValue, args, Base.getReferencedName(ref) === 'eval');
			}
		}
		Runtime.recursionCount--;
	}

	RuleProcessor.fireRuleEvent(this, {
		func: func,
		args: args,
		thisValue: thisValue,
		result: result
	}, true);

	this._postProcess();

	return result;
});