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
			runNextTest(test(obj.getOwnProperty("foo"), undefined));
		}
	},{
		name: "Data Property",
		test: function(runNextTest) {
			var obj = new Types.TypeObject(),
				prop = new Types.TypeDataProperty();
			prop.value = new Types.TypeBoolean();
			prop.value.value = true;
			obj._properties["foo"] = prop;
			runNextTest(test(obj.getOwnProperty("foo"), prop));
		}
	},{
		name: "Accessor Property",
		test: function(runNextTest) {
			var obj = new Types.TypeObject(),
				prop = new Types.TypeAccessorProperty();
			obj._properties["foo"] = prop;
			runNextTest(test(obj.getOwnProperty("foo"), prop));
		}
	}
];