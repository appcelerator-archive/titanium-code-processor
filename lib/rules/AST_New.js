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
	Base = require('../Base');

AST.registerRuleProcessor('AST_New', function processRule() {

	var context,
		constructor,
		args = [],
		result,
		i,
		len;

	RuleProcessor.preProcess(this);

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_New');

	context = Base.getCurrentContext();
	constructor = Base.getValue(this.expression.processRule());

	// Check if this is an unknown and short-circuit it
	if (Base.type(constructor) === 'Unknown') {
		result = new Base.UnknownType();

		// Process the arguments, even though they won't be used, just to make sure they are visited
		for (i = 0, len = this.args.length; i < len; i++) {
			Base.getValue(this.args[i].processRule());
		}
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

		// Store the jump
		if (constructor._location) {
			this._jumps = this._jumps || {};
			this._jumps[constructor._location.filename + ':' + constructor._location.line] = {
				filename: constructor._location.filename,
				line: constructor._location.line
			};
		}
	}

	RuleProcessor.fireRuleEvent(this, {
		result: result
	}, true);

	RuleProcessor.postProcess(this, result);

	return result;
});