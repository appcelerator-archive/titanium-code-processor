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
			return Base.checkObjectCoercible(new Base.TypeUndefined());
		},
		props: {
			expectedException: "TypeError"
		}
	},{
		name: "Null",
		testFunction: function() {
			return Base.checkObjectCoercible(new Base.TypeNull());
		},
		props: {
			expectedException: "TypeError"
		}
	},{
		name: "Boolean",
		testFunction: function() {
			return Base.checkObjectCoercible(new Base.TypeBoolean());
		},
		props: {
			expectedReturnValue: undefined
		}
	},{
		name: "Number",
		testFunction: function() {
			return Base.checkObjectCoercible(new Base.TypeNumber());
		},
		props: {
			expectedReturnValue: undefined
		}
	},{
		name: "String",
		testFunction: function() {
			return Base.checkObjectCoercible(new Base.TypeString());
		},
		props: {
			expectedReturnValue: undefined
		}
	},{
		name: "Object",
		testFunction: function() {
			return Base.checkObjectCoercible(new Base.TypeObject());
		},
		props: {
			expectedReturnValue: undefined
		}
	}
];