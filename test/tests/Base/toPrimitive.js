var path = require("path"),
	Base = require(path.join(require.main.exports.libPath, "Base")),
	assert = require("assert");
	
var booleanResult = new Base.TypeBoolean(),
	numberResult = new Base.TypeNumber(),
	stringResult = new Base.TypeString();

module.exports = [{
		name: "Undefined",
		testFunction: function() {
			return Base.toPrimitive(new Base.TypeUndefined());
		},
		props: {
			expectedReturnValue: new Base.TypeUndefined()
		}
	},{
		name: "Null",
		testFunction: function() {
			return Base.toPrimitive(new Base.TypeNull());
		},
		props: {
			expectedReturnValue: new Base.TypeNull()
		}
	},{
		name: "Boolean, false",
		testFunction: function() {
			var bool = new Base.TypeBoolean();
			booleanResult.value = bool.value = false;
			return Base.toPrimitive(bool);
		},
		props: {
			expectedReturnValue: booleanResult
		}
	},{
		name: "Boolean, true",
		testFunction: function() {
			var bool = new Base.TypeBoolean();
			booleanResult.value = bool.value = true;
			return Base.toPrimitive(bool);
		},
		props: {
			expectedReturnValue: booleanResult
		}
	},{
		name: "Number, 0",
		testFunction: function() {
			var num = new Base.TypeNumber();
			numberResult.value = num.value = 0;
			return Base.toPrimitive(num);
		},
		props: {
			expectedReturnValue: numberResult
		}
	},{
		name: "Number, 3.14159",
		testFunction: function() {
			var num = new Base.TypeNumber();
			numberResult.value = num.value = 3.14159;
			return Base.toPrimitive(num);
		},
		props: {
			expectedReturnValue: numberResult
		}
	},{
		name: "Number, infinity",
		testFunction: function() {
			var num = new Base.TypeNumber();
			numberResult.value = num.value = Infinity;
			return Base.toPrimitive(num);
		},
		props: {
			expectedReturnValue: numberResult
		}
	},{
		name: "String, empty",
		testFunction: function() {
			var	str = new Base.TypeString();
			stringResult.value = str.value = "";
			return Base.toPrimitive(str);
		},
		props: {
			expectedReturnValue: stringResult
		}
	},{
		name: "String, non-empty",
		testFunction: function() {
			var	str = new Base.TypeString();
			stringResult.value = str.value = " 100.45";
			return Base.toPrimitive(str);
		},
		props: {
			expectedReturnValue: stringResult
		}
	},{
		name: "Object",
		testFunction: function() {
			console.log("IMPLEMENT ME");
		},
		props: {
			expectedReturnValue: true
		}
	}
];