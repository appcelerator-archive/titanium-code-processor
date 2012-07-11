var path = require("path"),
	Base = require(path.join(require.main.exports.libPath, "Base")),
	assert = require("assert");

var booleanObject = new Base.TypeBooleanObject(),
	numberObject = new Base.TypeNumberObject(),
	stringObject = new Base.TypeStringObject(),
	obj = new Base.TypeObject();

module.exports = [{
		name: "Undefined",
		testFunction: function() {
			return Base.toObject(new Base.TypeUndefined());
		},
		props: {
			expectedException: "TypeError"
		}
	},{
		name: "Null",
		testFunction: function() {
			return Base.toObject(new Base.TypeNull());
		},
		props: {
			expectedException: "TypeError"
		}
	},{
		name: "Boolean, false",
		testFunction: function() {
			var bool = new Base.TypeBoolean();
			booleanObject.primitiveValue = bool.value = false;
			return Base.toObject(bool);
		},
		props: {
			expectedReturnValue: booleanObject
		}
	},{
		name: "Boolean, true",
		testFunction: function() {
			var bool = new Base.TypeBoolean();
			booleanObject.primitiveValue = bool.value = true;
			return Base.toObject(bool);
		},
		props: {
			expectedReturnValue: booleanObject
		}
	},{
		name: "Number, 0",
		testFunction: function() {
			var num = new Base.TypeNumber();
			numberObject.primitiveValue = num.value = 0;
			return Base.toObject(num);
		},
		props: {
			expectedReturnValue: numberObject
		}
	},{
		name: "Number, 3.14159",
		testFunction: function() {
			var num = new Base.TypeNumber();
			numberObject.primitiveValue = num.value = 3.14159;
			return Base.toObject(num);
		},
		props: {
			expectedReturnValue: numberObject
		}
	},{
		name: "Number, infinity",
		testFunction: function() {
			var num = new Base.TypeNumber();
			numberObject.primitiveValue = num.value = Infinity;
			return Base.toObject(num);
		},
		props: {
			expectedReturnValue: numberObject
		}
	},{
		name: "String, empty",
		testFunction: function() {
			var	str = new Base.TypeString();
			stringObject.primitiveValue = str.value = "";
			return Base.toObject(str);
		},
		props: {
			expectedReturnValue: stringObject
		}
	},{
		name: "String, non-empty",
		testFunction: function() {
			var	str = new Base.TypeString();
			stringObject.primitiveValue = str.value = " 100.45";
			return Base.toObject(str);
		},
		props: {
			expectedReturnValue: stringObject
		}
	},{
		name: "Object",
		testFunction: function() {
			obj.call = {};
			return Base.toObject(obj);
		},
		props: {
			expectedReturnValue: obj
		}
	}
];