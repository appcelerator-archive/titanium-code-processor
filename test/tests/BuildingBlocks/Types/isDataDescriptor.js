var path = require("path"),
	Types = require(path.join(require.main.exports.libPath, "Types")),
	assert = require("assert");

module.exports = [{
		name: "Data",
		testFunction: function() {
			return Types.isDataDescriptor(new Types.TypeDataProperty());
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Accessor",
		testFunction: function() {
			return Types.isDataDescriptor(new Types.TypeAccessorProperty());
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Generic",
		testFunction: function() {
			return Types.isDataDescriptor({
				enumerable: false,
				configurable: false
			});
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Undefined",
		testFunction: function() {
			return Types.isDataDescriptor();
		},
		props: {
			expectedReturnValue: false
		}
	}
];