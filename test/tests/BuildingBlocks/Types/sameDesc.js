var path = require("path"),
	Types = require(path.join(require.main.exports.libPath, "Types")),
	assert = require("assert");

module.exports = [{
		name: "Same (empty objects)",
		testFunction: function() {
			return Types.sameDesc(new (function(){}), new (function(){}));
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Same (undefined)",
		testFunction: function() {
			return Types.sameDesc(undefined, undefined);
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Same (numbers)",
		testFunction: function() {
			return Types.sameDesc(10, 10);
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Same (strings)",
		testFunction: function() {
			return Types.sameDesc("foo", "foo");
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Same (non-empty objects)",
		testFunction: function() {
			return Types.sameDesc({
				foo: "bar",
				foo2: {
					bar: "bar"
				}
			}, {
				foo: "bar",
				foo2: {
					bar: "bar"
				}
			});
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Different (numbers)",
		testFunction: function() {
			return Types.sameDesc(10, 20);
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Different (strings)",
		testFunction: function() {
			return Types.sameDesc("foo", "bar");
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Different (different types)",
		testFunction: function() {
			return Types.sameDesc("foo", undefined);
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Different (non-empty objects, same fields, different values)",
		testFunction: function() {
			return Types.sameDesc({
				foo: "bar",
				foo2: {
					bar: "bar2"
				}
			}, {
				foo: "bar",
				foo2: {
					bar: "bar"
				}
			});
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Different (non-empty objects, different field names, same number of fields)",
		testFunction: function() {
			return Types.sameDesc({
				foo: "bar",
				foo2: {
					bar: "bar2"
				}
			}, {
				foo: "bar",
				foo2: {
					bar2: "bar"
				}
			});
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Different (non-empty objects, different fields)",
		testFunction: function() {
			return Types.sameDesc({
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
			});
		},
		props: {
			expectedReturnValue: false
		}
	}
];