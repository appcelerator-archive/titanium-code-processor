/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Instantiation of a new object via the 'new' keyword.
 *
 * @module rules/AST_New
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 11.2.2
 */

/**
 * @name module:rules/AST_New.rule
 * @event
 * @property {String} ruleName The string 'AST_New'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.BaseType} result The newly instantiated object. Only available post-evaluation.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base'),
	Runtime = require('../Runtime');

AST.registerRuleProcessor('AST_New', function processRule() {

	this._preProcess();

	var context,
		constructor,
		args = [],
		result,
		i,
		len;

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_New');

	context = Runtime.getCurrentContext();
	constructor = Base.getValue(this.expression.processRule());

	// Check if this is an unknown and short-circuit it
	if (Base.type(constructor) === 'Unknown') {
		result = new Base.UnknownType();
	} else if (constructor.className !== 'Function' || !constructor.construct) {
		Base.handleRecoverableNativeException('TypeError', 'Attempted to instantaite a non-constructor');
		result = new Base.UnknownType();
	} else {

		// Process the arguments
		for (i = 0, len = this.args.length; i < len; i++) {
			args.push(Base.getValue(this.args[i].processRule()));
		}

		// Invoke the constructor
		result = constructor.construct(args);
	}

	RuleProcessor.fireRuleEvent(this, {
		result: result
	}, true);

	this._postProcess();

	return result;
});