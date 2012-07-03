var path = require("path"),
	Types = require(path.join(require.main.exports.libPath, "Types")),
	assert = require("assert");


function test(value) {
	try {
		assert.ok(value);
		console.log("\tPassed");
		return true;
	} catch(e) {
		console.log("\tFailed\n" + e);
		return false;
	}
}

module.exports = [{
		name: "Data",
		test: function(runNextTest) {
			runNextTest(test(Types.isDataDescriptor(new Types.TypeDataProperty())));
		}
	},{
		name: "Accessor",
		test: function(runNextTest) {
			runNextTest(test(!Types.isDataDescriptor(new Types.TypeAccessorProperty())));
		}
	},{
		name: "Generic",
		test: function(runNextTest) {
			runNextTest(test(!Types.isDataDescriptor({
				enumerable: false,
				configurable: false
			})));
		}
	},{
		name: "Undefined",
		test: function(runNextTest) {
			runNextTest(test(!Types.isDataDescriptor()));
		}
	}
];