/* 
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.
 */

var path = require("path"),
	Base = require(path.join(require.main.exports.libPath, "Base")),
	assert = require("assert");

var booleanObject = new Base.ObjectType(),
	numberObject = new Base.ObjectType(),
	stringObject = new Base.ObjectType(),
	obj = new Base.ObjectType();

module.exports = [{
		name: "Undefined",
		testFunction: function() {
			return Base.toObject(new Base.UndefinedType());
		},
		props: {
			expectedException: "TypeError"
		}
	},{
		name: "Null",
		testFunction: function() {
			return Base.toObject(new Base.NullType());
		},
		props: {
			expectedException: "TypeError"
		}
	},{
		name: "Boolean, false",
		testFunction: function() {
			var bool = new Base.BooleanType();
			booleanObject.primitiveValue = bool.value = false;
			return Base.toObject(bool);
		},
		props: {
			expectedReturnValue: booleanObject
		}
	},{
		name: "Boolean, true",
		testFunction: function() {
			var bool = new Base.BooleanType();
			booleanObject.primitiveValue = bool.value = true;
			return Base.toObject(bool);
		},
		props: {
			expectedReturnValue: booleanObject
		}
	},{
		name: "Number, 0",
		testFunction: function() {
			var num = new Base.NumberType();
			numberObject.primitiveValue = num.value = 0;
			return Base.toObject(num);
		},
		props: {
			expectedReturnValue: numberObject
		}
	},{
		name: "Number, 3.14159",
		testFunction: function() {
			var num = new Base.NumberType();
			numberObject.primitiveValue = num.value = 3.14159;
			return Base.toObject(num);
		},
		props: {
			expectedReturnValue: numberObject
		}
	},{
		name: "Number, infinity",
		testFunction: function() {
			var num = new Base.NumberType();
			numberObject.primitiveValue = num.value = Infinity;
			return Base.toObject(num);
		},
		props: {
			expectedReturnValue: numberObject
		}
	},{
		name: "String, empty",
		testFunction: function() {
			var	str = new Base.StringType();
			stringObject.primitiveValue = str.value = "";
			return Base.toObject(str);
		},
		props: {
			expectedReturnValue: stringObject
		}
	},{
		name: "String, non-empty",
		testFunction: function() {
			var	str = new Base.StringType();
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