var path = require("path"),
	Base = require(path.join(require.main.exports.libPath, "Base")),
	assert = require("assert");

module.exports = [{
		name: "Data",
		testFunction: function() {
			return Base.isGenericDescriptor(new Base.TypeDataProperty());
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Accessor",
		testFunction: function() {
			return Base.isGenericDescriptor(new Base.TypeAccessorProperty());
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Generic",
		testFunction: function() {
			return Base.isGenericDescriptor({
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
			return Base.isGenericDescriptor();
		},
		props: {
			expectedReturnValue: false
		}
	}
];