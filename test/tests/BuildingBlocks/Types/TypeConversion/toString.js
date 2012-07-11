var path = require("path"),
	Types = require(path.join(require.main.exports.libPath, "Types")),
	assert = require("assert");

var strResult = new Types.TypeString()

module.exports = [{
		name: "Undefined",
		testFunction: function() {
			strResult.value = "undefined";
			return Types.toString(new Types.TypeUndefined());
		},
		props: {
			expectedReturnValue: strResult
		}
	},{
		name: "Null",
		testFunction: function() {
			strResult.value = "null";
			return Types.toString(new Types.TypeNull());
		},
		props: {
			expectedReturnValue: strResult
		}
	},{
		name: "Boolean, false",
		testFunction: function() {
			var bool = new Types.TypeBoolean();
			bool.value = false;
			strResult.value = "false";
			return Types.toString(bool);
		},
		props: {
			expectedReturnValue: strResult
		}
	},{
		name: "Boolean, true",
		testFunction: function() {
			var bool = new Types.TypeBoolean();
			bool.value = true;
			strResult.value = "true";
			return Types.toString(bool);
		},
		props: {
			expectedReturnValue: strResult
		}
	},{
		name: "Number, 0",
		testFunction: function() {
			var num = new Types.TypeNumber();
			num.value = 0;
			strResult.value = "0";
			return Types.toString(num);
		},
		props: {
			expectedReturnValue: strResult
		}
	},{
		name: "Number, NaN",
		testFunction: function() {
			var num = new Types.TypeNumber();
			num.value = NaN;
			strResult.value = "NaN";
			return Types.toString(num);
		},
		props: {
			expectedReturnValue: strResult
		}
	},{
		name: "Number, 100.5e-20",
		testFunction: function() {
			var num = new Types.TypeNumber();
			num.value = 1.005e-20;
			strResult.value = "1.005e-20";
			return Types.toString(num);
		},
		props: {
			expectedReturnValue: strResult
		}
	},{
		name: "String, empty",
		testFunction: function() {
			var	str = new Types.TypeString();
			str.value = "";
			strResult.value = "";
			return Types.toString(str);
		},
		props: {
			expectedReturnValue: strResult
		}
	},{
		name: "String, non-empty",
		testFunction: function() {
			var	str = new Types.TypeString();
			str.value = "hello";
			strResult.value = "hello";
			return Types.toString(str);
		},
		props: {
			expectedReturnValue: strResult
		}
	},{
		name: "Object",
		testFunction: function() {
			console.log("IMPLEMENT ME");
		},
		props: {
			expectedReturnValue: strResult
		}
	}
];