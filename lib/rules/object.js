	/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * ECMA-262 Spec: <em>An object initialiser is an expression describing the initialisation of an Object, written in a 
 * form resembling a literal. It is a list of zero or more pairs of property names and associated values, enclosed in 
 * curly braces. The values need not be literals; they are evaluated each time the object initialiser is evaluated.</em>
 * 
 * @module rules/object
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 11.1.5
 */

/**
 * @name module:rules/object.rule
 * @event
 * @property {String} ruleName The string 'call'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.ObjectType} result The newly created object instance. Only available post-evaluation.
 */

var path = require('path'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base'),
	Runtime = require('../Runtime');

/**
 * Do not call directly. Call {@link RuleProcessor.processRule} instead.
 * 
 * AST: [node-info, properties <array[tuple[name <string>, gettersetter or value <ast>, getset <'get' | 'set' | null>]]]
 * 
 * @private
 */
exports.processRule = processRule;
function processRule(ast) {
	
	var obj = new Base.ObjectType(),
		i = 0,
		len = ast[1].length,
		prop,
		propId,
		previous,
		context = Runtime.getCurrentContext();
	
	RuleProcessor.fireRuleEvent(ast, {}, false);
	RuleProcessor.logRule('object');
	
	for (; i < len; i++) {
		prop = ast[1][i];
		
		if (prop[2]) {
			propId = {
				enumerable: true,
				configurable: true
			};
			propId[prop[2]] = RuleProcessor.processRule(prop[1]);
			if (propId[prop[2]].className !== 'Function') {
				propId[prop[2]] = undefined;
			}
		} else {
			propId = {
				value: RuleProcessor.processRule(prop[1]),
				writable: true,
				enumerable: true,
				configurable: true
			};
		}
		previous = obj.getOwnProperty(prop[0]);
		if (previous && (context.strict && Base.isDataDescriptor(previous)) || 
				(Base.isDataDescriptor(previous) && Base.isAccessorDescriptor(propId)) || 
				(Base.isAccessorDescriptor(previous) && Base.isDataDescriptor(propId)) ||
				(Base.isAccessorDescriptor(previous) && Base.isAccessorDescriptor(propId)) && 
					((previous.get && propId.get) || (previous.set && propId.set))) {
			Base.throwNativeException('SyntaxError');
		}
		obj.defineOwnProperty(prop[0], propId, false);
	}
	
	RuleProcessor.fireRuleEvent(ast, {
		result: obj
	}, true);
	
	return obj;
}
RuleProcessor.registerRuleProcessor(path.basename(__filename, '.js'), exports);