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
		name: "Same (empty objects)",
		test: function(runNextTest) {
			runNextTest(test(Types.sameDesc(new (function(){}), new (function(){}))));
		}
	},{
		name: "Same (undefined)",
		test: function(runNextTest) {
			runNextTest(test(Types.sameDesc(undefined, undefined)));
		}
	},{
		name: "Same (numbers)",
		test: function(runNextTest) {
			runNextTest(test(Types.sameDesc(10, 10)));
		}
	},{
		name: "Same (strings)",
		test: function(runNextTest) {
			runNextTest(test(Types.sameDesc("foo", "foo")));
		}
	},{
		name: "Same (non-empty objects)",
		test: function(runNextTest) {
			runNextTest(test(Types.sameDesc({
				foo: "bar",
				foo2: {
					bar: "bar"
				}
			}, {
				foo: "bar",
				foo2: {
					bar: "bar"
				}
			})));
		}
	},{
		name: "Different (numbers)",
		test: function(runNextTest) {
			runNextTest(test(!Types.sameDesc(10, 20)));
		}
	},{
		name: "Different (strings)",
		test: function(runNextTest) {
			runNextTest(test(!Types.sameDesc("foo", "bar")));
		}
	},{
		name: "Different (different types)",
		test: function(runNextTest) {
			runNextTest(test(!Types.sameDesc("foo", undefined)));
		}
	},{
		name: "Different (non-empty objects, same fields, different values)",
		test: function(runNextTest) {
			runNextTest(test(!Types.sameDesc({
				foo: "bar",
				foo2: {
					bar: "bar2"
				}
			}, {
				foo: "bar",
				foo2: {
					bar: "bar"
				}
			})));
		}
	},{
		name: "Different (non-empty objects, different field names, same number of fields)",
		test: function(runNextTest) {
			runNextTest(test(!Types.sameDesc({
				foo: "bar",
				foo2: {
					bar: "bar2"
				}
			}, {
				foo: "bar",
				foo2: {
					bar2: "bar"
				}
			})));
		}
	},{
		name: "Different (non-empty objects, different fields)",
		test: function(runNextTest) {
			runNextTest(test(!Types.sameDesc({
				foo: "bar",
				foo2: {
					bar: "bar2"
				}
			}, {
				foo: "bar",
				foo2: {
					bar: "bar"
				},
				foo3: 10
			})));
		}
	}
];