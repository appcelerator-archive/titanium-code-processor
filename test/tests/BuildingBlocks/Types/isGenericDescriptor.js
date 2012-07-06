var path = require("path"),
	Types = require(path.join(require.main.exports.libPath, "Types")),
	assert = require("assert");

module.exports = [{
		name: "Data",
		testFunction: function() {
			return Types.isGenericDescriptor(new Types.TypeDataProperty());
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Accessor",
		testFunction: function() {
			return Types.isGenericDescriptor(new Types.TypeAccessorProperty());
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Generic",
		testFunction: function() {
			return Types.isGenericDescriptor({
				enumerable: false,
				configurable: false
			});
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Undefined",
		testFunction: function() {
			return Types.isGenericDescriptor();
		},
		props: {
			expectedReturnValue: false
		}
	}
];