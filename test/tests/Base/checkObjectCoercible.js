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
			return Base.checkObjectCoercible(new Base.UndefinedType());
		},
		props: {
			expectedException: "TypeError"
		}
	},{
		name: "Null",
		testFunction: function() {
			return Base.checkObjectCoercible(new Base.NullType());
		},
		props: {
			expectedException: "TypeError"
		}
	},{
		name: "Boolean",
		testFunction: function() {
			return Base.checkObjectCoercible(new Base.BooleanType());
		},
		props: {
			expectedReturnValue: undefined
		}
	},{
		name: "Number",
		testFunction: function() {
			return Base.checkObjectCoercible(new Base.NumberType());
		},
		props: {
			expectedReturnValue: undefined
		}
	},{
		name: "String",
		testFunction: function() {
			return Base.checkObjectCoercible(new Base.StringType());
		},
		props: {
			expectedReturnValue: undefined
		}
	},{
		name: "Object",
		testFunction: function() {
			return Base.checkObjectCoercible(new Base.ObjectType());
		},
		props: {
			expectedReturnValue: undefined
		}
	}
];