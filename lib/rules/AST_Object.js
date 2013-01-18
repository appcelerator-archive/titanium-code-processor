	/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * ECMA-262 Spec: <em>An object initialiser is an expression describing the initialisation of an Object, written in a
 * form resembling a literal. It is a list of zero or more pairs of property names and associated values, enclosed in
 * curly braces. The values need not be literals; they are evaluated each time the object initialiser is evaluated.</em>
 *
 * @module rules/AST_Object
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 11.1.5
 */

/**
 * @name module:rules/AST_Object.rule
 * @event
 * @property {String} ruleName The string 'AST_Object'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.ObjectType} result The newly created object instance. Only available post-evaluation.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base'),
	Runtime = require('../Runtime');

AST.registerRuleProcessor('AST_Object', function processRule() {

	this._preProcess();

	var obj = new Base.ObjectType(),
		i = 0,
		len = this.properties.length,
		prop,
		propId,
		previous,
		context = Runtime.getCurrentContext(),
		key;

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_Object');

	for (; i < len; i++) {
		prop = this.properties[i];
		prop._visited = true;

		switch(prop.TYPE) {
			case 'ObjectKeyVal':
				propId = {
					value: Base.getValue(prop.value.processRule()),
					writable: true,
					enumerable: true,
					configurable: true
				};
				key = prop.key;
				break;
			case 'ObjectSetter':
				propId = {
					enumerable: true,
					configurable: true,
					set: Base.getValue(prop.value.processRule())
				};
				if (propId.set.className !== 'Function') {
					propId.set = undefined;
				}
				key = prop.value.name.name;
				prop.value._visited = true;
				prop.value.name._visited = true;
				break;
			case 'ObjectGetter':
				propId = {
					enumerable: true,
					configurable: true,
					get: Base.getValue(prop.value.processRule())
				};
				if (propId.get.className !== 'Function') {
					propId.get = undefined;
				}
				prop.value._visited = true;
				prop.value.name._visited = true;
				key = prop.value.name.name;
				break;
		}

		previous = obj.getOwnProperty(key);
		if (previous &&
				((context.strict && Base.isDataDescriptor(previous) && Base.isDataDescriptor(propId)) ||
				(Base.isDataDescriptor(previous) && Base.isAccessorDescriptor(propId)) ||
				(Base.isAccessorDescriptor(previous) && Base.isDataDescriptor(propId)) ||
				(Base.isAccessorDescriptor(previous) && Base.isAccessorDescriptor(propId) &&
					((previous.get && propId.get) || (previous.set && propId.set))))) {
			Base.handleRecoverableNativeException('SyntaxError');
			obj = new Base.UnknownType();
			break;
		}
		obj.defineOwnProperty(key, propId, false);
	}

	RuleProcessor.fireRuleEvent(this, {
		result: obj
	}, true);

	this._postProcess();

	return obj;
});