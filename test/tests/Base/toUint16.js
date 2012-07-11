var path = require("path"),
	Base = require(path.join(require.main.exports.libPath, "Base")),
	assert = require("assert");

var numResult = new Base.TypeNumber();

module.exports = [{
		name: "Undefined",
		testFunction: function() {
			numResult.value = 0;
			return Base.toUint16(new Base.TypeUndefined());
		},
		props: {
			expectedReturnValue: numResult
		}
	},{
		name: "Null",
		testFunction: function() {
			numResult.value = 0;
			return Base.toUint16(new Base.TypeNull());
		},
		props: {
			expectedReturnValue: numResult
		}
	},{
		name: "Boolean, false",
		testFunction: function() {
			var bool = new Base.TypeBoolean();
			bool.value = false;
			numResult.value = 0;
			return Base.toUint16(bool);
		},
		props: {
			expectedReturnValue: numResult
		}
	},{
		name: "Boolean, true",
		testFunction: function() {
			var bool = new Base.TypeBoolean();
			bool.value = true;
			numResult.value = 1;
			return Base.toUint32(bool);
		},
		props: {
			expectedReturnValue: numResult
		}
	},{
		name: "Number, 0",
		testFunction: function() {
			var num = new Base.TypeNumber();
			num.value = 0;
			numResult.value = 0;
			return Base.toUint16(num);
		},
		props: {
			expectedReturnValue: numResult
		}
	},{
		name: "Number, NaN",
		testFunction: function() {
			var num = new Base.TypeNumber();
			num.value = NaN;
			numResult.value = 0;
			return Base.toUint16(num);
		},
		props: {
			expectedReturnValue: numResult
		}
	},{
		name: "Number, 3.14159",
		testFunction: function() {
			var num = new Base.TypeNumber();
			num.value = 3.14159;
			numResult.value = 3;
			return Base.toUint16(num);
		},
		props: {
			expectedReturnValue: numResult
		}
	},{
		name: "Number, infinity",
		testFunction: function() {
			var num = new Base.TypeNumber();
			num.value = Infinity;
			numResult.value = 0;
			return Base.toUint16(num);
		},
		props: {
			expectedReturnValue: numResult
		}
	},{
		name: "Number, -infinity",
		testFunction: function() {
			var num = new Base.TypeNumber();
			num.value = -Infinity;
			numResult.value = 0;
			return Base.toUint16(num);
		},
		props: {
			expectedReturnValue: numResult
		}
	},{
		name: "Number, 0xFFFFFFFFFFFF",
		testFunction: function() {
			var num = new Base.TypeNumber();
			num.value = 0xFFFFFFFFFFFF;
			numResult.value = 0xFFFF;
			return Base.toUint16(num);
		},
		props: {
			expectedReturnValue: numResult
		}
	},{
		name: "String, empty",
		testFunction: function() {
			var	str = new Base.TypeString();
			str.value = "";
			numResult.value = 0;
			return Base.toUint16(str);
		},
		props: {
			expectedReturnValue: numResult
		}
	},{
		name: "String, non-empty",
		testFunction: function() {
			var	str = new Base.TypeString();
			str.value = " 100.45";
			numResult.value = 100;
			return Base.toUint16(str);
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