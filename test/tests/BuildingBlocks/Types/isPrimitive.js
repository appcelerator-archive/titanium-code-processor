var path = require("path"),
	Types = require(path.join(require.main.exports.libPath, "Types")),
	assert = require("assert");

module.exports = [{
		name: "Number",
		testFunction: function() {
			return Types.isPrimitive(new Types.TypeNumber());
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "String",
		testFunction: function() {
			return Types.isPrimitive(new Types.TypeString());
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Boolean",
		testFunction: function() {
			return Types.isPrimitive(new Types.TypeBoolean());
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Undefined",
		testFunction: function() {
			return Types.isPrimitive(new Types.TypeUndefined());
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Null",
		testFunction: function() {
			return Types.isPrimitive(new Types.TypeNull());
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Unknown",
		testFunction: function() {
			return Types.isPrimitive(new Types.TypeUnknown());
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Object",
		testFunction: function() {
			return Types.isPrimitive(new Types.TypeObject());
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "String Object",
		testFunction: function() {
			return Types.isPrimitive(new Types.TypeStringObject());
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Number Object",
		testFunction: function() {
			return Types.isPrimitive(new Types.TypeNumberObject());
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Boolean Object",
		testFunction: function() {
			return Types.isPrimitive(new Types.TypeBooleanObject());
		},
		props: {
			expectedReturnValue: false
		}
	}
];