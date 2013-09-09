/**
 * <p>Copyright (c) 2012-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Unit tests the cloning capabilities of the code processor
 *
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */
/*global describe, it*/

var path = require('path'),

	should = require('should'),

	Base = require(path.join(__dirname, '..', 'lib', 'Base')),
	AST = require(path.join(__dirname, '..', 'lib', 'AST'));

require(path.join(__dirname, '..', 'lib', 'CodeProcessor')); // Called to prime rules, etc

describe('Cloning', function () {

	Base.init();

	function compareLexicalEnvironments(original, cloned) {
		var p;
		if (original.outer) {
			should.exist(cloned.outer, 'Cloned lexical environment should have an outer lexical environment');
		} else {
			should.not.exist(cloned.outer, 'Cloned lexical environment should not have an outer lexical environment');
		}
		if (original.envRec instanceof Base.DeclarativeEnvironmentRecord) {
			should.ok(cloned.envRec instanceof Base.DeclarativeEnvironmentRecord, 'Cloned environment record should be a declarative environment record');
			should.ok(Object.keys(original.envRec._bindings).length === Object.keys(cloned.envRec._bindings).length,
				'Cloned envrionment record should have the same number of bindings as the original');
			for (p in original.envRec._bindings) {
				should.exist(cloned.envRec._bindings[p], 'Cloned envrionment record should have binding "' + p + '"');
				compareValues(original.envRec._bindings[p], cloned.envRec._bindings[p]);
			}
		} else {
			should.ok(cloned.envRec instanceof Base.ObjectEnvironmentRecord, 'Cloned environment record should be an object environment record');
			compareValues(original.envRec._bindingObject, cloned.envRec._bindingObject);
		}
		if (original.outer) {
			compareLexicalEnvironments(original.outer, cloned.outer);
		}
	}

	function compareContexts(original, cloned) {
		compareLexicalEnvironments(original.lexicalEnvironment , cloned.lexicalEnvironment);
		compareLexicalEnvironments(original.variableEnvironment , cloned.variableEnvironment);
		compareValues(original.thisBinding, cloned.thisBinding);
		should.strictEqual(original.strict, cloned.strict, 'Cloned contexts should have the same strict mode flag');
		should.strictEqual(original._ambiguousBlock, cloned._ambiguousBlock, 'Cloned contexts should have the same ambiguous block semaphore values');
	}

	var comparedValues = [];
	function compareValues(original, cloned) {
		if (!original && !cloned) {
			return;
		}
		if (!original) {
			should.not.exist(cloned, 'Cloned value should not exist');
		} else {
			should.exist(cloned, 'Cloned value should exist');
		}
		if (comparedValues.indexOf(original) != -1) {
			return;
		}
		comparedValues.push(original);
		var type = Base.type(original),
			i, len;
		should.notStrictEqual(original, cloned, 'Cloned values should be separate instances');
		should.equal(original.className, cloned.className, 'Cloned values should have the same class name');
		should.equal(Base.type(original), Base.type(cloned), 'Cloned values should have the same type');

		if (type == 'Boolean' || type == 'String') {
			should.strictEqual(original.value, cloned.value, 'Cloned primitives should have the same value');
		}
		if (type == 'String') {
			should.ok(Base.strictEquals(original._lookupProperty('length').value,
				cloned._lookupProperty('length').value), 'Cloned strings should have the same length');
		}
		if (type == 'Number') {
			if (isNaN(original.value)) {
				should.ok(isNaN(cloned.value), 'Cloned primitives should have the same value');
			} else {
				should.strictEqual(original.value, cloned.value, 'Cloned primitives should have the same value');
			}
		}
		if (type == 'Object') {
			should.strictEqual(original.extensible, cloned.extensible,
				'Cloned objects should have the same extensible flag value');
			compareValues(original.objectPrototype, cloned.objectPrototype);
			should.equal(original._properties.length, cloned._properties.length,
				'Cloned objects should have the same number of properties');
			for (i = 0, len = original._properties.length; i < len; i++) {
				compareDescriptors(original._properties[i], cloned._properties[i]);
			}
		}
	}

	function compareDescriptors(original, cloned) {
		if (Base.isDataDescriptor(original)) {
			should.ok(Base.isDataDescriptor(cloned), 'Descriptor type mismatch');
			compareValues(original.value, cloned.value);
			should.strictEqual(original.writable, cloned.writable, 'Descriptor writable flag mismatch');
			should.strictEqual(original.configurable, cloned.configurable, 'Descriptor configurable flag mismatch');
			should.strictEqual(original.enumerable, cloned.enumerable, 'Descriptor enumerable flag mismatch');
		} else {
			should.ok(Base.isAccessorDescriptor(cloned), 'Descriptor type mismatch');
			should.ok(compareValues(original.get, cloned.get), 'Descriptor getter mismatch');
			should.ok(compareValues(original.set, cloned.set), 'Descriptor setter mismatch');
			should.strictEqual(original.configurable, cloned.configurable, 'Descriptor configurable flag mismatch');
			should.strictEqual(original.enumerable, cloned.enumerable, 'Descriptor enumerable flag mismatch');
		}
	}

	it('should clone undefined', function () {
		var original = new Base.UndefinedType(),
			cloner = new Base.Cloner(),
			cloned = cloner.cloneValue(original);
		compareValues(original, cloned);
	});

	it('should clone null', function () {
		var original = new Base.NullType(),
			cloner = new Base.Cloner(),
			cloned = cloner.cloneValue(original);
		compareValues(original, cloned);
	});

	it('should clone a boolean', function () {
		var original = new Base.BooleanType(true),
			cloner = new Base.Cloner(),
			cloned = cloner.cloneValue(original);
		compareValues(original, cloned);
	});

	it('should clone a number', function () {
		var original = new Base.NumberType(170),
			cloner = new Base.Cloner(),
			cloned = cloner.cloneValue(original);
		compareValues(original, cloned);
	});

	it('should clone a string', function () {
		var original = new Base.StringType('Hello World'),
			cloner = new Base.Cloner(),
			cloned = cloner.cloneValue(original);
		compareValues(original, cloned);
	});

	it('should clone an object', function () {
		var original = new Base.ObjectType(),
			cloner = new Base.Cloner(),
			cloned;
		original.defineOwnProperty('foo', {
			value: new Base.StringType('fooval'),
			writable: true,
			configurable: true,
			enumerable: false
		}, false, true);
		cloned = cloner.cloneValue(original);
		compareValues(original, cloned);
	});

	it('should clone a function', function () {
		var original = new Base.FunctionType([], AST.parseString('function foo() { return 42; }'), Base.getGlobalContext().lexicalEnvironment, false),
			cloner = new Base.Cloner(),
			cloned;
		original.defineOwnProperty('foo', {
			value: new Base.StringType('fooval'),
			writable: true,
			configurable: true,
			enumerable: false
		}, false, true);
		cloned = cloner.cloneValue(original);
		compareValues(original, cloned);
		compareValues(original.callFunction(new Base.UndefinedType(), []), cloned.callFunction(new Base.UndefinedType(), []));
	});

	it('should clone an array', function () {
		var original = new Base.ArrayType(),
			cloner = new Base.Cloner(),
			cloned;
		original.put('0', new Base.NumberType(42));
		original.put('1', new Base.StringType('Hello World'));
		original.put('2', new Base.BooleanType(false));
		cloned = cloner.cloneValue(original);
		compareValues(original, cloned);
	});

	it('should clone a regex', function () {
		var original = new Base.RegExpType('^hi', 'g'),
			cloner = new Base.Cloner(),
			cloned = cloner.cloneValue(original);
		compareValues(original, cloned);
		compareValues(original.get('exec').callFunction(new Base.UndefinedType(), [new Base.StringType('hihihi')]),
			cloned.get('exec').callFunction(new Base.UndefinedType(), [new Base.StringType('hihihi')]));
	});

	it('should clone an error', function () {
		var errorConstructor = Base.getGlobalObject().get('RangeError'),
			original = errorConstructor.construct(new Base.UndefinedType(), [ new Base.StringType('This is a range error') ]),
			cloner = new Base.Cloner(),
			cloned = cloner.cloneValue(original);
		compareValues(original, cloned);
	});

	it('should clone an unknown type', function () {
		var original = new Base.UnknownType(),
			cloner = new Base.Cloner(),
			cloned = cloner.cloneValue(original);
		compareValues(original, cloned);
	});

	it('should clone a module context', function () {
		var original = Base.createModuleContext(AST.parseString('var x = 10; module.exports.y = 20;'), false, true, false),
			cloner = new Base.Cloner(),
			cloned = cloner.cloneContext(original),
			globalLexicalEnvironment = cloned.lexicalEnvironment.outer.envRec;
		compareContexts(original, cloned);

		// Quick test to make sure that we don't have duplicates of objects referenced multiple times
		should.strictEqual(globalLexicalEnvironment.getBindingValue('JSON', false).get('stringify').objectPrototype,
			globalLexicalEnvironment.getBindingValue('JSON', false).get('parse').objectPrototype);
	});

	it('should clone a function context', function () {
		var functionObject = new Base.FunctionType([], AST.parseString('function foo() { return 42; }'), Base.getGlobalContext().lexicalEnvironment, false),
			original = Base.createFunctionContext(functionObject, new Base.UndefinedType(), [], Base.getGlobalContext().lexicalEnvironment),
			cloner = new Base.Cloner(),
			cloned = cloner.cloneContext(original);
		compareContexts(original, cloned);
	});
});
