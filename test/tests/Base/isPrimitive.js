var path = require("path"),
	Base = require(path.join(require.main.exports.libPath, "Base")),
	assert = require("assert");

module.exports = [{
		name: "Number",
		testFunction: function() {
			return Base.isPrimitive(new Base.TypeNumber());
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "String",
		testFunction: function() {
			return Base.isPrimitive(new Base.TypeString());
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Boolean",
		testFunction: function() {
			return Base.isPrimitive(new Base.TypeBoolean());
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Undefined",
		testFunction: function() {
			return Base.isPrimitive(new Base.TypeUndefined());
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Null",
		testFunction: function() {
			return Base.isPrimitive(new Base.TypeNull());
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Unknown",
		testFunction: function() {
			return Base.isPrimitive(new Base.TypeUnknown());
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Object",
		testFunction: function() {
			return Base.isPrimitive(new Base.TypeObject());
		},
		props: {
			expectedReturnValue: false
		}
	}
];