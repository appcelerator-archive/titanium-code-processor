/* 
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.
 */

var path = require("path"),
	Base = require(path.join(require.main.exports.libPath, "Base")),
	assert = require("assert");

module.exports = [{
		name: "Undefined",
		testFunction: function() {
			return Base.isCallable(new Base.UndefinedType());
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Null",
		testFunction: function() {
			return Base.isCallable(new Base.NullType());
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Boolean",
		testFunction: function() {
			return Base.isCallable(new Base.BooleanType());
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Number",
		testFunction: function() {
			return Base.isCallable(new Base.NumberType());
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "String",
		testFunction: function() {
			var	str = new Base.StringType();
			str.call = function() {};
			return Base.isCallable(str);
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Non-callable Object",
		testFunction: function() {
			return Base.isCallable(new Base.ObjectType());
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Callable Object",
		testFunction: function() {
			var	obj = new Base.ObjectType();
			obj.call = function() {};
			return Base.isCallable(obj);
		},
		props: {
			expectedReturnValue: true
		}
	}
];