var path = require("path"),
	Types = require(path.join(require.main.exports.libPath, "Types")),
	assert = require("assert");

module.exports = [{
		name: "Undefined",
		testFunction: function() {
			return Types.checkObjectCoercible(new Types.TypeUndefined());
		},
		props: {
			expectedException: "TypeError"
		}
	},{
		name: "Null",
		testFunction: function() {
			return Types.checkObjectCoercible(new Types.TypeNull());
		},
		props: {
			expectedException: "TypeError"
		}
	},{
		name: "Boolean",
		testFunction: function() {
			return Types.checkObjectCoercible(new Types.TypeBoolean());
		},
		props: {
			expectedReturnValue: undefined
		}
	},{
		name: "Number",
		testFunction: function() {
			return Types.checkObjectCoercible(new Types.TypeNumber());
		},
		props: {
			expectedReturnValue: undefined
		}
	},{
		name: "String",
		testFunction: function() {
			return Types.checkObjectCoercible(new Types.TypeString());
		},
		props: {
			expectedReturnValue: undefined
		}
	},{
		name: "Object",
		testFunction: function() {
			return Types.checkObjectCoercible(new Types.TypeObject());
		},
		props: {
			expectedReturnValue: undefined
		}
	}
];