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

	Base.init();

	function compareValues(original, cloned) {
		if (!original && !cloned) {
			return;
		}
		var type = Base.type(original),
			i, len;
		should.notStrictEqual(original, cloned, 'Cloned values should be separate instances');
		should.equal(original.className, cloned.className, 'Cloned values should have the same class name');
		should.equal(Base.type(original), Base.type(cloned), 'Cloned values should have the same type');

		if (type == 'Boolean' || type == 'Number' || type == 'String') {
			should.strictEqual(original.value, cloned.value, 'Cloned primitives should have the same value');
		}
		if (type == 'String') {
			should.ok(Base.strictEquals(original._lookupProperty('length').value,
				cloned._lookupProperty('length').value), 'Cloned strings should have the same length');
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
			cloned = Base.cloneValue(original);
		compareValues(original, cloned);
	});

	it('should clone null', function () {
		var original = new Base.NullType(),
			cloned = Base.cloneValue(original);
		compareValues(original, cloned);
	});

	it('should clone a boolean', function () {
		var original = new Base.BooleanType(true),
			cloned = Base.cloneValue(original);
		compareValues(original, cloned);
	});

	it('should clone a number', function () {
		var original = new Base.NumberType(170),
			cloned = Base.cloneValue(original);
		compareValues(original, cloned);
	});

	it('should clone a string', function () {
		var original = new Base.StringType('Hello World'),
			cloned = Base.cloneValue(original);
		compareValues(original, cloned);
	});

	it('should clone an object', function () {
		var original = new Base.ObjectType(),
			cloned;
		original.defineOwnProperty('foo', {
			value: new Base.StringType('fooval'),
			writable: true,
			configurable: true,
			enumerable: false
		}, false, true);
		cloned = Base.cloneValue(original);
		compareValues(original, cloned);
	});
});
