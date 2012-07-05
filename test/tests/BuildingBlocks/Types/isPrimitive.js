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
		name: "Number",
		test: function(runNextTest) {
			runNextTest(test(Types.isPrimitive(new Types.TypeNumber())));
		}
	},{
		name: "String",
		test: function(runNextTest) {
			runNextTest(test(Types.isPrimitive(new Types.TypeString())));
		}
	},{
		name: "Boolean",
		test: function(runNextTest) {
			runNextTest(test(Types.isPrimitive(new Types.TypeBoolean())));
		}
	},{
		name: "Undefined",
		test: function(runNextTest) {
			runNextTest(test(Types.isPrimitive(new Types.TypeUndefined())));
		}
	},{
		name: "Null",
		test: function(runNextTest) {
			runNextTest(test(Types.isPrimitive(new Types.TypeNull())));
		}
	},{
		name: "Unknown",
		test: function(runNextTest) {
			runNextTest(test(!Types.isPrimitive(new Types.TypeUnknown())));
		}
	},{
		name: "Object",
		test: function(runNextTest) {
			runNextTest(test(!Types.isPrimitive(new Types.TypeObject())));
		}
	},{
		name: "String Object",
		test: function(runNextTest) {
			runNextTest(test(!Types.isPrimitive(new Types.TypeStringObject())));
		}
	},{
		name: "Number Object",
		test: function(runNextTest) {
			runNextTest(test(!Types.isPrimitive(new Types.TypeNumberObject())));
		}
	},{
		name: "Boolean Object",
		test: function(runNextTest) {
			runNextTest(test(!Types.isPrimitive(new Types.TypeBooleanObject())));
		}
	}
];