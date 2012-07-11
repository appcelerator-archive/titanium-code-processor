var path = require("path"),
	Types = require(path.join(require.main.exports.libPath, "Types")),
	assert = require("assert");

var booleanObject = new Types.TypeBooleanObject(),
	numberObject = new Types.TypeNumberObject(),
	stringObject = new Types.TypeStringObject(),
	obj = new Types.TypeObject();

module.exports = [{
		name: "Undefined",
		testFunction: function() {
			return Types.toObject(new Types.TypeUndefined());
		},
		props: {
			expectedException: "TypeError"
		}
	},{
		name: "Null",
		testFunction: function() {
			return Types.toObject(new Types.TypeNull());
		},
		props: {
			expectedException: "TypeError"
		}
	},{
		name: "Boolean, false",
		testFunction: function() {
			var bool = new Types.TypeBoolean();
			booleanObject.primitiveValue = bool.value = false;
			return Types.toObject(bool);
		},
		props: {
			expectedReturnValue: booleanObject
		}
	},{
		name: "Boolean, true",
		testFunction: function() {
			var bool = new Types.TypeBoolean();
			booleanObject.primitiveValue = bool.value = true;
			return Types.toObject(bool);
		},
		props: {
			expectedReturnValue: booleanObject
		}
	},{
		name: "Number, 0",
		testFunction: function() {
			var num = new Types.TypeNumber();
			numberObject.primitiveValue = num.value = 0;
			return Types.toObject(num);
		},
		props: {
			expectedReturnValue: numberObject
		}
	},{
		name: "Number, 3.14159",
		testFunction: function() {
			var num = new Types.TypeNumber();
			numberObject.primitiveValue = num.value = 3.14159;
			return Types.toObject(num);
		},
		props: {
			expectedReturnValue: numberObject
		}
	},{
		name: "Number, infinity",
		testFunction: function() {
			var num = new Types.TypeNumber();
			numberObject.primitiveValue = num.value = Infinity;
			return Types.toObject(num);
		},
		props: {
			expectedReturnValue: numberObject
		}
	},{
		name: "String, empty",
		testFunction: function() {
			var	str = new Types.TypeString();
			stringObject.primitiveValue = str.value = "";
			return Types.toObject(str);
		},
		props: {
			expectedReturnValue: stringObject
		}
	},{
		name: "String, non-empty",
		testFunction: function() {
			var	str = new Types.TypeString();
			stringObject.primitiveValue = str.value = " 100.45";
			return Types.toObject(str);
		},
		props: {
			expectedReturnValue: stringObject
		}
	},{
		name: "Object",
		testFunction: function() {
			obj.call = {};
			return Types.toObject(obj);
		},
		props: {
			expectedReturnValue: obj
		}
	}
];