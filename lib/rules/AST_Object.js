	/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * ECMA-262 Spec: <em>An object initialiser is an expression describing the initialisation of an Object, written in a
 * form resembling a literal. It is a list of zero or more pairs of property names and associated values, enclosed in
 * curly braces. The values need not be literals; they are evaluated each time the object initialiser is evaluated.</em>
 *
 * @module rules/AST_Object
 * @see ECMA-262 Spec Chapter 11.1.5
 */

/**
 * @event module:rules/AST_Object.rule
 * @property {string} ruleName The string 'AST_Object'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {string} file The file that the rule begins on.
 * @property {number} line The line of the file where the rule begins on.
 * @property {number} column The column of the file where the rule begins on.
 * @property {boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {module:Base.ObjectType} result The newly created object instance. Only available post-evaluation.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base');

AST.registerRuleProcessor('AST_Object', function processRule() {

	RuleProcessor.preProcess(this);

	var obj = new Base.ObjectType(),
		i, len,
		prop,
		propId,
		previous,
		context = Base.getCurrentContext(),
		key;

	RuleProcessor.fireRuleEvent(this, {}, false);
	RuleProcessor.logRule('AST_Object');

	for (i = 0, len = this.properties.length; i < len; i++) {
		prop = this.properties[i];
		Base.setVisited(prop);

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
				Base.setVisited(prop.value);
				Base.setVisited(prop.value.name);
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
				Base.setVisited(prop.value);
				Base.setVisited(prop.value.name);
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
			Base.handleRecoverableNativeException('SyntaxError', 'Invalid property ' + propId);
			obj = new Base.UnknownType();
			break;
		}
		obj.defineOwnProperty(key, propId, false);
	}

	RuleProcessor.fireRuleEvent(this, {
		result: obj
	}, true);

	RuleProcessor.postProcess(this, obj);

	return obj;
});