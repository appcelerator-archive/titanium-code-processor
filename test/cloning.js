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

	Base = require(path.join(__dirname, '..', 'lib', 'Base'));

describe('Cloning', function () {

	it('should clone undefined', function () {
		var original = new Base.UndefinedType(),
			cloned = Base.cloneValue(original);
		should.notStrictEqual(original, cloned, 'Cloned values should be separate instances');
		should.equal(original.className, cloned.className, 'Cloned values should have the same class name');
		should.equal(Base.type(original), Base.type(cloned), 'Cloned values should have the same type');
	});

	it('should clone null', function () {
		var original = new Base.NullType(),
			cloned = Base.cloneValue(original);
		should.notStrictEqual(original, cloned, 'Cloned values should be separate instances');
		should.strictEqual(original.className, cloned.className, 'Cloned values should have the same class name');
		should.strictEqual(Base.type(original), Base.type(cloned), 'Cloned values should have the same type');
	});

	it('should clone a boolean', function () {
		var original = new Base.BooleanType(true),
			cloned = Base.cloneValue(original);
		should.notStrictEqual(original, cloned, 'Cloned values should be separate instances');
		should.strictEqual(original.className, cloned.className, 'Cloned values should have the same class name');
		should.strictEqual(Base.type(original), Base.type(cloned), 'Cloned values should have the same type');
		should.strictEqual(original.value, cloned.value, 'Cloned primitives should have the same value');
	});

	it('should clone a number', function () {
		var original = new Base.NumberType(170),
			cloned = Base.cloneValue(original);
		should.notStrictEqual(original, cloned, 'Cloned values should be separate instances');
		should.strictEqual(original.className, cloned.className, 'Cloned values should have the same class name');
		should.strictEqual(Base.type(original), Base.type(cloned), 'Cloned values should have the same type');
		should.strictEqual(original.value, cloned.value, 'Cloned primitives should have the same value');
	});

	it('should clone a string', function () {
		var original = new Base.StringType('Hello World'),
			cloned = Base.cloneValue(original);
		should.notStrictEqual(original, cloned, 'Cloned values should be separate instances');
		should.strictEqual(original.className, cloned.className, 'Cloned values should have the same class name');
		should.strictEqual(Base.type(original), Base.type(cloned), 'Cloned values should have the same type');
		should.strictEqual(original.value, cloned.value, 'Cloned primitives should have the same value');
		should.ok(Base.strictEquals(original._lookupProperty('length').value,
			cloned._lookupProperty('length').value), 'Cloned strings should have the same length');
	});
});
