var path = require("path"),
	Types = require(path.join(require.main.exports.libPath, "Types")),
	Exceptions = require(path.join(require.main.exports.libPath, "Exceptions.js"));

module.exports = [{
		name: "Property does not exist, extensible is false, throw is false",
		testFunction: function() {
			var obj = new Types.TypeObject(),
				prop = new Types.TypeDataProperty;
			obj.extensible = false;
			return obj.defineOwnProperty("foo", prop, false);
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Property does not exist, extensible is false, throw is true",
		testFunction: function() {
			var obj = new Types.TypeObject(),
				prop = new Types.TypeDataProperty;
			obj.extensible = false;
			return obj.defineOwnProperty("foo", prop, true);
		},
		props: {
			expectedException: "TypeError"
		}
	},
];