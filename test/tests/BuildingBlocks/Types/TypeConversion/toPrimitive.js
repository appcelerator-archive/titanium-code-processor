var path = require("path"),
	Types = require(path.join(require.main.exports.libPath, "Types")),
	assert = require("assert");
	
var booleanResult = new Types.TypeBoolean(),
	numberResult = new Types.TypeNumber(),
	stringResult = new Types.TypeString();

module.exports = [{
		name: "Undefined",
		testFunction: function() {
			return Types.toPrimitive(new Types.TypeUndefined());
		},
		props: {
			expectedReturnValue: new Types.TypeUndefined()
		}
	},{
		name: "Null",
		testFunction: function() {
			return Types.toPrimitive(new Types.TypeNull());
		},
		props: {
			expectedReturnValue: new Types.TypeNull()
		}
	},{
		name: "Boolean, false",
		testFunction: function() {
			var bool = new Types.TypeBoolean();
			booleanResult.value = bool.value = false;
			return Types.toPrimitive(bool);
		},
		props: {
			expectedReturnValue: booleanResult
		}
	},{
		name: "Boolean, true",
		testFunction: function() {
			var bool = new Types.TypeBoolean();
			booleanResult.value = bool.value = true;
			return Types.toPrimitive(bool);
		},
		props: {
			expectedReturnValue: booleanResult
		}
	},{
		name: "Number, 0",
		testFunction: function() {
			var num = new Types.TypeNumber();
			numberResult.value = num.value = 0;
			return Types.toPrimitive(num);
		},
		props: {
			expectedReturnValue: numberResult
		}
	},{
		name: "Number, 3.14159",
		testFunction: function() {
			var num = new Types.TypeNumber();
			numberResult.value = num.value = 3.14159;
			return Types.toPrimitive(num);
		},
		props: {
			expectedReturnValue: numberResult
		}
	},{
		name: "Number, infinity",
		testFunction: function() {
			var num = new Types.TypeNumber();
			numberResult.value = num.value = Infinity;
			return Types.toPrimitive(num);
		},
		props: {
			expectedReturnValue: numberResult
		}
	},{
		name: "String, empty",
		testFunction: function() {
			var	str = new Types.TypeString();
			stringResult.value = str.value = "";
			return Types.toPrimitive(str);
		},
		props: {
			expectedReturnValue: stringResult
		}
	},{
		name: "String, non-empty",
		testFunction: function() {
			var	str = new Types.TypeString();
			stringResult.value = str.value = " 100.45";
			return Types.toPrimitive(str);
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