/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A for-in statement
 *
 * @module rules/AST_ForIn
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 12.6.4
 */

/**
 * @name module:rules/AST_ForIn.rule
 * @event
 * @property {String} ruleName The string 'AST_ForIn'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.BaseType} enumerableObject The object being enumerated over. Only available post-evaluation.
 * @property {Array} result The result of evaluating the loop. Results of statements are typically
 *		3-tuples (in the form of an array), with the first entry being the type of return (typically 'normal'), followed
 *		by two entries that are rule specific. Only available post-evaluation.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base'),
	Runtime = require('../Runtime');

AST.registerRuleProcessor('AST_ForIn', function processRule() {

	this._preProcess();

	var varRef,
		experValue,
		experValueType,
		obj,
		pVal,
		v,
		stmt,
		result,
		loopIterations,
		eventDescription,
		eventData,
		propNames,
		prop,
		i, len,
		context = Runtime.getCurrentContext(),
		getRef = function () {
			return varRef ? varRef : this.init.processRule();
		}.bind(this);

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_ForIn');

	// If it's a var dec, it only gets processed once at the beginning
	if (this.name) {
		this.init.processRule();
		varRef = Base.getIdentifierReference(context.lexicalEnvironment, this.name.name, context.strict);
	}

	experValue = Base.getValue(this.object.processRule());
	experValueType = Base.type(experValue);
	result = ['normal', undefined, undefined];
	loopIterations = 0;

	if (experValueType === 'Unknown' || !Runtime.options.evaluateLoops) {
		this._ambiguousBlock = true;
		Runtime.enterAmbiguousBlock();
		Base.putValue(getRef(), new Base.UnknownType());
		result = this.body.processRule();
		Runtime.exitAmbiguousBlock();
	} else if (experValueType !== 'Undefined' && experValueType !== 'Null') {
		obj = Base.toObject(experValue);
		outerLoop: while(obj) {
			propNames = obj._getPropertyNames();
			for(i = 0, len = propNames.length; i < len; i++) {
				prop = obj._lookupProperty(propNames[i]);
				if (++loopIterations === Runtime.options.maxLoopIterations) {

					eventDescription = 'Maximum application loop iteration limit of ' + Runtime.options.maxLoopIterations +
						' reached, could not fully process code';
					eventData = {
						ruleName: this.className,
						ast: this
					};
					Runtime.fireEvent('maxIterationsExceeded', eventDescription, eventData);
					Runtime.reportWarning('maxIterationsExceeded', eventDescription, eventData);

					this._ambiguousBlock = true;
					Runtime.enterAmbiguousBlock();
					Base.putValue(getRef(), new Base.UnknownType());
					result = this.body.processRule();
					Runtime.exitAmbiguousBlock();
				} else if (prop && prop.enumerable) {
					pVal = new Base.StringType(propNames[i]);
					Base.putValue(getRef(), pVal);
					stmt = this.body.processRule();
					if (stmt[1]) {
						v = stmt[1];
					}
					if (stmt[0] === 'continue') {
						if (stmt[2] && stmt[2] !== this._label) {
							result = stmt;
							break outerLoop;
						}
					} else if (stmt[0] === 'break') {
						if (stmt[2] && stmt[2] !== this._label) {
							result = stmt;
						} else {
							result = ['normal', v, undefined];
						}
						result = stmt;
						break outerLoop;
					} else if (stmt[0] !== 'normal') {
						result = stmt;
						break outerLoop;
					}
				}
			}
			if (obj !== obj.objectPrototype) {
				obj = obj.objectPrototype;
			} else {
				obj = undefined;
			}
		}
	}

	RuleProcessor.fireRuleEvent(this, {
		enumerableObject: experValue,
		result: result
	}, true);

	this._postProcess();

	return result;
});