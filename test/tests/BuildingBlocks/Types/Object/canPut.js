var path = require("path"),
	Types = require(path.join(require.main.exports.libPath, "Types")),
	assert = require("assert");

function test(value) {
	try {
		assert.ok(value);
		return true;
	} catch(e) {
		return false;
	}
}

module.exports = [{
		name: "Property does not exist",
		test: function(runNextTest) {
			var obj = new Types.TypeObject();
			runNextTest(test(obj.canPut("foo")));
		}
	},{
		name: "Property does not exist, object has prototype",
		test: function(runNextTest) {
			var parent = new Types.TypeObject(),
				obj = new Types.TypeObject();
			obj.objectPrototype = parent;
			runNextTest(test(obj.canPut("foo")));
		}
	},{
		name: "Property does not exist, object not extensible",
		test: function(runNextTest) {
			var obj = new Types.TypeObject();
			obj.extensible = false;
			runNextTest(test(!obj.canPut("foo")));
		}
	},{
		name: "Data Property exists, non-writable",
		test: function(runNextTest) {
			var obj = new Types.TypeObject(),
				prop = new Types.TypeDataProperty();
			obj._properties["foo"] = prop;
			runNextTest(test(!obj.canPut("foo")));
		}
	},{
		name: "Data Property exists, writable",
		test: function(runNextTest) {
			var obj = new Types.TypeObject(),
				prop = new Types.TypeDataProperty();
			prop.writeable = true;
			obj._properties["foo"] = prop;
			runNextTest(test(obj.canPut("foo")));
		}
	},{
		name: "Accessor Property exists, no setter",
		test: function(runNextTest) {
			var obj = new Types.TypeObject(),
				prop = new Types.TypeAccessorProperty();
			obj._properties["foo"] = prop;
			runNextTest(test(!obj.canPut("foo")));
		}
	},{
		name: "Accessor Property exists, with setter",
		test: function(runNextTest) {
			var obj = new Types.TypeObject(),
				prop = new Types.TypeAccessorProperty();
			prop.set = new Types.TypeObject();
			obj._properties["foo"] = prop;
			runNextTest(test(obj.canPut("foo")));
		}
	},{
		name: "Inherited Data Property exists, non-writable",
		test: function(runNextTest) {
			var parent = new Types.TypeObject(),
				obj = new Types.TypeObject(),
				prop = new Types.TypeDataProperty();
			parent._properties["foo"] = prop;
			obj.objectPrototype = parent;
			runNextTest(test(!obj.canPut("foo")));
		}
	},{
		name: "Inherited Data Property exists, writable",
		test: function(runNextTest) {
			var parent = new Types.TypeObject(),
				obj = new Types.TypeObject(),
				prop = new Types.TypeDataProperty();
			prop.writeable = true;
			parent._properties["foo"] = prop;
			obj.objectPrototype = parent;
			runNextTest(test(obj.canPut("foo")));
		}
	},{
		name: "Inherited Accessor Property exists, no setter",
		test: function(runNextTest) {
			var parent = new Types.TypeObject(),
				obj = new Types.TypeObject(),
				prop = new Types.TypeAccessorProperty();
			parent._properties["foo"] = prop;
			obj.objectPrototype = parent;
			debugger;
			runNextTest(test(!obj.canPut("foo")));
		}
	},{
		name: "Inherited Accessor Property exists, with setter",
		test: function(runNextTest) {
			var parent = new Types.TypeObject(),
				obj = new Types.TypeObject(),
				prop = new Types.TypeAccessorProperty();
			prop.set = new Types.TypeObject();
			parent._properties["foo"] = prop;
			obj.objectPrototype = parent;
			runNextTest(test(obj.canPut("foo")));
		}
	}
];