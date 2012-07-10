var path = require("path"),
	Types = require(path.join(require.main.exports.libPath, "Types")),
	assert = require("assert");

module.exports = [{
		name: "Undefined",
		testFunction: function() {
			return Types.isCallable(new Types.TypeUndefined());
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Null",
		testFunction: function() {
			return Types.isCallable(new Types.TypeNull());
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Boolean",
		testFunction: function() {
			return Types.isCallable(new Types.TypeBoolean());
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Number",
		testFunction: function() {
			return Types.isCallable(new Types.TypeNumber());
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "String",
		testFunction: function() {
			var	str = new Types.TypeString();
			str.call = function() {};
			return Types.isCallable(str);
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Non-callable Object",
		testFunction: function() {
			return Types.isCallable(new Types.TypeObject());
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Callable Object",
		testFunction: function() {
			var	obj = new Types.TypeObject();
			obj.call = function() {};
			return Types.isCallable(obj);
		},
		props: {
			expectedReturnValue: true
		}
	}
];