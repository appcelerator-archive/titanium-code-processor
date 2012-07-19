/* 
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.
 */

var path = require("path"),
	Base = require(path.join(require.main.exports.libPath, "Base")),
	assert = require("assert");

var strResult = new Base.TypeString()

module.exports = [{
		name: "Undefined",
		testFunction: function() {
			strResult.value = "undefined";
			return Base.toString(new Base.TypeUndefined());
		},
		props: {
			expectedReturnValue: strResult
		}
	},{
		name: "Null",
		testFunction: function() {
			strResult.value = "null";
			return Base.toString(new Base.TypeNull());
		},
		props: {
			expectedReturnValue: strResult
		}
	},{
		name: "Boolean, false",
		testFunction: function() {
			var bool = new Base.TypeBoolean();
			bool.value = false;
			strResult.value = "false";
			return Base.toString(bool);
		},
		props: {
			expectedReturnValue: strResult
		}
	},{
		name: "Boolean, true",
		testFunction: function() {
			var bool = new Base.TypeBoolean();
			bool.value = true;
			strResult.value = "true";
			return Base.toString(bool);
		},
		props: {
			expectedReturnValue: strResult
		}
	},{
		name: "Number, 0",
		testFunction: function() {
			var num = new Base.TypeNumber();
			num.value = 0;
			strResult.value = "0";
			return Base.toString(num);
		},
		props: {
			expectedReturnValue: strResult
		}
	},{
		name: "Number, NaN",
		testFunction: function() {
			var num = new Base.TypeNumber();
			num.value = NaN;
			strResult.value = "NaN";
			return Base.toString(num);
		},
		props: {
			expectedReturnValue: strResult
		}
	},{
		name: "Number, 100.5e-20",
		testFunction: function() {
			var num = new Base.TypeNumber();
			num.value = 1.005e-20;
			strResult.value = "1.005e-20";
			return Base.toString(num);
		},
		props: {
			expectedReturnValue: strResult
		}
	},{
		name: "String, empty",
		testFunction: function() {
			var	str = new Base.TypeString();
			str.value = "";
			strResult.value = "";
			return Base.toString(str);
		},
		props: {
			expectedReturnValue: strResult
		}
	},{
		name: "String, non-empty",
		testFunction: function() {
			var	str = new Base.TypeString();
			str.value = "hello";
			strResult.value = "hello";
			return Base.toString(str);
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