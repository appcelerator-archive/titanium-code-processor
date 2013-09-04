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

	describe('Cloning undefined', function () {

		var original = new Base.UndefinedType(),
			cloned = Base.cloneValue(original);

		it('should be a separate instance', function () {
			should.notStrictEqual(original, cloned);
		});

		it('should be an undefined class', function () {
			should.equal(original.className, cloned.className);
		});

		it('should be an undefined type', function () {
			should.equal(Base.type(original), Base.type(cloned));
		});
	});

	describe('Cloning null', function () {

		var original = new Base.NullType(),
			cloned = Base.cloneValue(original);

		it('should be a separate instance', function () {
			should.notStrictEqual(original, cloned);
		});

		it('should be a null class', function () {
			should.strictEqual(original.className, cloned.className);
		});

		it('should be a null type', function () {
			should.strictEqual(Base.type(original), Base.type(cloned));
		});
	});

	describe('Cloning a boolean', function () {

		var original = new Base.BooleanType(true),
			cloned = Base.cloneValue(original);

		it('should be a separate instance', function () {
			should.notStrictEqual(original, cloned);
		});

		it('should be a boolean class', function () {
			should.strictEqual(original.className, cloned.className);
		});

		it('should be a boolean type', function () {
			should.strictEqual(Base.type(original), Base.type(cloned));
		});

		it('should have the same value', function () {
			should.strictEqual(original.value, cloned.value);
		});
	});

	describe('Cloning a number', function () {

		var original = new Base.NumberType(170),
			cloned = Base.cloneValue(original);

		it('should be a separate instance', function () {
			should.notStrictEqual(original, cloned);
		});

		it('should be a number class', function () {
			should.strictEqual(original.className, cloned.className);
		});

		it('should be a number type', function () {
			should.strictEqual(Base.type(original), Base.type(cloned));
		});

		it('should have the same value', function () {
			should.strictEqual(original.value, cloned.value);
		});
	});
});
