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
			runNextTest(test(obj.getProperty("foo"), undefined));
		}
	},{
		name: "Property does not exist, object has prototype",
		test: function(runNextTest) {
			var parent = new Types.TypeObject(),
				obj = new Types.TypeObject();
			obj.objectPrototype = parent;
			runNextTest(test(obj.getProperty("foo"), undefined));
		}
	},{
		name: "Data Property",
		test: function(runNextTest) {
			var obj = new Types.TypeObject(),
				prop = new Types.TypeDataProperty();
			obj._properties["foo"] = prop;
			runNextTest(test(obj.getProperty("foo"), prop));
		}
	},{
		name: "Accessor Property",
		test: function(runNextTest) {
			var obj = new Types.TypeObject(),
				prop = new Types.TypeAccessorProperty();
			obj._properties["foo"] = prop;
			runNextTest(test(obj.getProperty("foo"), prop));
		}
	},{
		name: "Inherited Data Property",
		test: function(runNextTest) {
			var parent = new Types.TypeObject(),
				obj = new Types.TypeObject(),
				prop = new Types.TypeDataProperty();
			parent._properties["foo"] = prop;
			obj.objectPrototype = parent;
			runNextTest(test(obj.getProperty("foo"), prop));
		}
	},{
		name: "Inherited Accessor Property",
		test: function(runNextTest) {
			var parent = new Types.TypeObject(),
				obj = new Types.TypeObject(),
				prop = new Types.TypeAccessorProperty();
			parent._properties["foo"] = prop;
			obj.objectPrototype = parent;
			runNextTest(test(obj.getProperty("foo"), prop));
		}
	}
];