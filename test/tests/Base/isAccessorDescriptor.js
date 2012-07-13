var path = require("path"),
	Base = require(path.join(require.main.exports.libPath, "Base")),
	assert = require("assert");

module.exports = [{
		name: "Data",
		testFunction: function() {
			return Base.isAccessorDescriptor(new Base.DataDescriptor());
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Accessor",
		testFunction: function() {
			return Base.isAccessorDescriptor(new Base.AccessorDescriptor());
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Generic",
		testFunction: function() {
			return Base.isAccessorDescriptor({
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
			return Base.isAccessorDescriptor();
		},
		props: {
			expectedReturnValue: false
		}
	}
];