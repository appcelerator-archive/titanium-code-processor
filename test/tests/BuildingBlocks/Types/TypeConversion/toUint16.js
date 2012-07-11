var path = require("path"),
	Types = require(path.join(require.main.exports.libPath, "Types")),
	assert = require("assert");

var numResult = new Types.TypeNumber();

module.exports = [{
		name: "Undefined",
		testFunction: function() {
			numResult.value = 0;
			return Types.toUint16(new Types.TypeUndefined());
		},
		props: {
			expectedReturnValue: numResult
		}
	},{
		name: "Null",
		testFunction: function() {
			numResult.value = 0;
			return Types.toUint16(new Types.TypeNull());
		},
		props: {
			expectedReturnValue: numResult
		}
	},{
		name: "Boolean, false",
		testFunction: function() {
			var bool = new Types.TypeBoolean();
			bool.value = false;
			numResult.value = 0;
			return Types.toUint16(bool);
		},
		props: {
			expectedReturnValue: numResult
		}
	},{
		name: "Boolean, true",
		testFunction: function() {
			var bool = new Types.TypeBoolean();
			bool.value = true;
			numResult.value = 1;
			return Types.toUint32(bool);
		},
		props: {
			expectedReturnValue: numResult
		}
	},{
		name: "Number, 0",
		testFunction: function() {
			var num = new Types.TypeNumber();
			num.value = 0;
			numResult.value = 0;
			return Types.toUint16(num);
		},
		props: {
			expectedReturnValue: numResult
		}
	},{
		name: "Number, NaN",
		testFunction: function() {
			var num = new Types.TypeNumber();
			num.value = NaN;
			numResult.value = 0;
			return Types.toUint16(num);
		},
		props: {
			expectedReturnValue: numResult
		}
	},{
		name: "Number, 3.14159",
		testFunction: function() {
			var num = new Types.TypeNumber();
			num.value = 3.14159;
			numResult.value = 3;
			return Types.toUint16(num);
		},
		props: {
			expectedReturnValue: numResult
		}
	},{
		name: "Number, infinity",
		testFunction: function() {
			var num = new Types.TypeNumber();
			num.value = Infinity;
			numResult.value = 0;
			return Types.toUint16(num);
		},
		props: {
			expectedReturnValue: numResult
		}
	},{
		name: "Number, -infinity",
		testFunction: function() {
			var num = new Types.TypeNumber();
			num.value = -Infinity;
			numResult.value = 0;
			return Types.toUint16(num);
		},
		props: {
			expectedReturnValue: numResult
		}
	},{
		name: "Number, 0xFFFFFFFFFFFF",
		testFunction: function() {
			var num = new Types.TypeNumber();
			num.value = 0xFFFFFFFFFFFF;
			numResult.value = 0xFFFF;
			return Types.toUint16(num);
		},
		props: {
			expectedReturnValue: numResult
		}
	},{
		name: "String, empty",
		testFunction: function() {
			var	str = new Types.TypeString();
			str.value = "";
			numResult.value = 0;
			return Types.toUint16(str);
		},
		props: {
			expectedReturnValue: numResult
		}
	},{
		name: "String, non-empty",
		testFunction: function() {
			var	str = new Types.TypeString();
			str.value = " 100.45";
			numResult.value = 100;
			return Types.toUint16(str);
		},
		props: {
			expectedReturnValue: numResult
		}
	},{
		name: "Object",
		testFunction: function() {
			console.log("IMPLEMENT ME");
		},
		props: {
			expectedReturnValue: numResult
		}
	}
];