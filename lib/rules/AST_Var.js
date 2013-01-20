/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Variable initializations. Note that variable declarations are handled when entering a context, NOT when the rule is
 * processed.
 *
 * @module rules/AST_Var
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 * @see ECMA-262 Spec Chapter 12.2
 */

/**
 * @name module:rules/AST_Var.rule
 * @event
 * @property {String} ruleName The string 'AST_Var'
 * @property {module:AST.node} ast The AST node that is an instance of this rule
 * @property {String} file The file that the rule begins on.
 * @property {Integer} line The line of the file where the rule begins on.
 * @property {Integer} column The column of the file where the rule begins on.
 * @property {Boolean} processingComplete Indicates whether the rule has been processed yet or not. This can be used to
 *		determine if this is the pre-evalutation event or the post-evaluation event.
 * @property {Array[Object]} initializations The variables that were initialized. If a variable did not have an
 *		initializer, then it is not included in the array. Each entry in the array contains two properties: reference and
 *		value. Only available post-evaluation.
 * @property {module:Base.ReferenceType} initializations.reference The reference being initialized. Only available post-evaluation.
 * @property {module:Base.BaseType} initializations.value The value that the reference was initialized to. Only available post-evaluation.
 */

var AST = require('../AST'),
	RuleProcessor = require('../RuleProcessor'),
	Base = require('../Base'),
	Runtime = require('../Runtime');

function registerRule(ruleType) {

	AST.registerRuleProcessor(ruleType, function processRule() {

		this._preProcess();

		var children = this.definitions,
			name,
			i = 0,
			len = children.length,
			context = Runtime.getCurrentContext(),
			reference,
			value,
			initializations = [];

		RuleProcessor.fireRuleEvent(this, {}, false);
		RuleProcessor.logRule(ruleType);

		for (; i < len; i++) {
			name = children[i].name.name;
			children[i]._visited = true;
			children[i].name._visited = true;

			// Make sure the identifier is not a reserved word
			if (~['break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else',
					'enum', 'export', 'extends', 'false', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof',
					'new', 'null', 'return', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void',
					'while', 'with '].indexOf(name) || (context.strict && ~['implements', 'interface', 'let',
					'package', 'private', 'protected', 'public', 'static', 'yield', 'eval', 'arguments'].indexOf(name))) {
				Base.throwNativeException('SyntaxError', 'Invalid identifier name ' + name);
			}

			// Ininitialize the variable if it has an initializer
			if (children[i].value) {
				reference = Base.getIdentifierReference(context.lexicalEnvironment, name, context.strict);

				value = Base.getValue(children[i].value.processRule());
				Base.putValue(reference, value);

				initializations.push({
					reference: reference,
					value: value
				});
			}
		}

		RuleProcessor.fireRuleEvent(this, {
			initializations: initializations
		}, true);

		this._postProcess();

		return ['normal', undefined, undefined];
	});
}
registerRule('AST_Var');
registerRule('AST_Const');
