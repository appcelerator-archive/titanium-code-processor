var path = require("path"),
	Base = require(path.join(require.main.exports.libPath, "Base")),
	assert = require("assert");

module.exports = [{
		name: "Data",
		testFunction: function() {
			return Base.isDataDescriptor(new Base.DataPropertyDescriptor());
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Accessor",
		testFunction: function() {
			return Base.isDataDescriptor(new Base.AccessorPropertyDescriptor());
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Generic",
		testFunction: function() {
			return Base.isDataDescriptor({
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
			return Base.isDataDescriptor();
		},
		props: {
			expectedReturnValue: false
		}
	}
];