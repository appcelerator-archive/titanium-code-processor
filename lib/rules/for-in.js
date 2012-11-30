/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * A for-in statement
 *
 * @module rules/for-in
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 12.6.4
 */

/**
 * @name module:rules/for-in.rule
 * @event
 * @property {String} ruleName The string 'call'
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

var path = require('path'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base'),
	Runtime = require('../Runtime');

/**
 * Do not call directly. Call {@link RuleProcessor.processRule} instead.
 *
 * AST: [node-info, initialization <ast>, iterator <ast>, iterationObject <ast>, body <ast>]
 *
 * @private
 */
exports.processRule = processRule;
function processRule(ast) {
	
	var init,
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
		i, len;
	
	RuleProcessor.fireRuleEvent(ast, {}, false);
	RuleProcessor.logRule('for-in');
	
	init = ast[1] && RuleProcessor.processRule(ast[1]);
	experValue = Base.getValue(RuleProcessor.processRule(ast[3]));
	experValueType = Base.type(experValue);
	result = ['normal', undefined, undefined];
	loopIterations = 0;
	
	if (experValueType === 'Unknown' || !Runtime.options.evaluateLoops) {
		Runtime.enterAmbiguousBlock();
		Base.putValue(RuleProcessor.processRule(ast[2]), new Base.UnknownType());
		result = RuleProcessor.processRule(ast[4]);
		Runtime.exitAmbiguousBlock();
	} else if (experValueType !== 'Undefined' && experValueType !== 'Null') {
		obj = Base.toObject(experValue);
		while(obj) {
			propNames = obj._getPropertyNames();
			for(i = 0, len = propNames.length; i < len; i++) {
				prop = obj._lookupProperty(propNames[i]);
				if (++loopIterations === Runtime.options.maxLoopIterations) {
					
					eventDescription = 'Maximum application loop iteration limit of ' + Runtime.options.maxLoopIterations +
						' reached, could not fully process code';
					eventData = RuleProcessor.createRuleEventInfo(ast, {});
					Runtime.fireEvent('maxIterationsExceeded', eventDescription, eventData);
					Runtime.reportWarning('maxIterationsExceeded', eventDescription, eventData);
					
					Runtime.enterAmbiguousBlock();
					Base.putValue(RuleProcessor.processRule(ast[2]), new Base.UnknownType());
					result = RuleProcessor.processRule(ast[4]);
					Runtime.exitAmbiguousBlock();
				} else if (prop && prop.enumerable) {
					pVal = new Base.StringType(propNames[i]);
					Base.putValue(RuleProcessor.processRule(ast[2]), pVal);
					stmt = RuleProcessor.processRule(ast[4]);
					if (stmt[1]) {
						v = stmt[1];
					}
					if (stmt[0] === 'continue') {
						if (stmt[2] && stmt[2] !== ast[0].label) {
							return stmt;
						}
					} else if (stmt[0] === 'break') {
						if (stmt[2] && stmt[2] !== ast[0].label) {
							result = stmt;
						} else {
							result = ['normal', v, undefined];
						}
						return result;
					} else if (stmt[0] !== 'normal') {
						return stmt;
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
	
	RuleProcessor.fireRuleEvent(ast, {
		enumerableObject: experValue,
		result: result
	}, true);
	
	return result;
}
RuleProcessor.registerRuleProcessor(path.basename(__filename, '.js'), exports);