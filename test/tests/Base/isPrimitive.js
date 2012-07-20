/* 
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.
 */

var path = require("path"),
	Base = require(path.join(require.main.exports.libPath, "Base")),
	assert = require("assert");

module.exports = [{
		name: "Number",
		testFunction: function() {
			return Base.isPrimitive(new Base.NumberType());
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "String",
		testFunction: function() {
			return Base.isPrimitive(new Base.StringType());
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Boolean",
		testFunction: function() {
			return Base.isPrimitive(new Base.BooleanType());
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Undefined",
		testFunction: function() {
			return Base.isPrimitive(new Base.UndefinedType());
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Null",
		testFunction: function() {
			return Base.isPrimitive(new Base.NullType());
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Unknown",
		testFunction: function() {
			return Base.isPrimitive(new Base.UnknownType());
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Object",
		testFunction: function() {
			return Base.isPrimitive(new Base.ObjectType());
		},
		props: {
			expectedReturnValue: false
		}
	}
];