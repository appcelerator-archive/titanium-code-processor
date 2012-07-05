var path = require("path"),
	Types = require(path.join(require.main.exports.libPath, "Types")),
	assert = require("assert");

function test(value, expected) {
	try {
		assert.deepEqual(value, expected);
		return true;
	} catch(e) {
		return false;
	}
}

module.exports = [{
		name: "Property does not exist",
		test: function(runNextTest) {
			var obj = new Types.TypeObject();
			runNextTest(test(obj.get("foo"), undefined));
		}
	},{
		name: "Property does not exist, object has prototype",
		test: function(runNextTest) {
			var parent = new Types.TypeObject(),
				obj = new Types.TypeObject();
			obj.objectPrototype = parent;
			runNextTest(test(obj.get("foo"), undefined));
		}
	},{
		name: "Data Property",
		test: function(runNextTest) {
			var obj = new Types.TypeObject(),
				prop = new Types.TypeDataProperty();
			prop.value = new Types.TypeNumber();
			prop.value.value = 10;
			obj._properties["foo"] = prop;
			runNextTest(test(obj.get("foo"), prop.value));
		}
	},{
		name: "Accessor Property, no getter",
		test: function(runNextTest) {
			var obj = new Types.TypeObject(),
				prop = new Types.TypeAccessorProperty();
			obj._properties["foo"] = prop;
			runNextTest(test(obj.get("foo"), new Types.TypeUndefined()));
		}
	},{
		name: "Accessor Property, with getter",
		test: function(runNextTest) {
			/*var obj = new Types.TypeObject(),
				prop = new Types.TypeAccessorProperty();
			obj._properties["foo"] = prop;
			runNextTest(test(obj.get("foo"), prop));*/
			console.log("IMPLEMENT ME");
			runNextTest();
		}
	},{
		name: "Inherited Data Property",
		test: function(runNextTest) {
			var parent = new Types.TypeObject(),
				obj = new Types.TypeObject(),
				prop = new Types.TypeDataProperty();
			prop.value = new Types.TypeNumber();
			prop.value.value = 10;
			parent._properties["foo"] = prop;
			obj.objectPrototype = parent;
			runNextTest(test(obj.get("foo"), prop.value));
		}
	},{
		name: "Inherited Accessor Property, no getter",
		test: function(runNextTest) {
			var parent = new Types.TypeObject(),
				obj = new Types.TypeObject(),
				prop = new Types.TypeAccessorProperty();
			parent._properties["foo"] = prop;
			obj.objectPrototype = parent;
			runNextTest(test(obj.get("foo"), new Types.TypeUndefined()));
		}
	},{
		name: "Inherited Accessor Property, with getter",
		test: function(runNextTest) {
			/*var parent = new Types.TypeObject(),
				obj = new Types.TypeObject(),
				prop = new Types.TypeAccessorProperty();
			parent._properties["foo"] = prop;
			obj.objectPrototype = parent;
			runNextTest(test(obj.get("foo"), prop));*/
			console.log("IMPLEMENT ME");
			runNextTest();
		}
	}
];