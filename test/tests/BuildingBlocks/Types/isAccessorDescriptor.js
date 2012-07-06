var path = require("path"),
	Types = require(path.join(require.main.exports.libPath, "Types")),
	assert = require("assert");

module.exports = [{
		name: "Data",
		testFunction: function() {
			return Types.isAccessorDescriptor(new Types.TypeDataProperty());
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Accessor",
		testFunction: function() {
			return Types.isAccessorDescriptor(new Types.TypeAccessorProperty());
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Generic",
		testFunction: function() {
			return Types.isAccessorDescriptor({
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
			return Types.isAccessorDescriptor();
		},
		props: {
			expectedReturnValue: false
		}
	}
];