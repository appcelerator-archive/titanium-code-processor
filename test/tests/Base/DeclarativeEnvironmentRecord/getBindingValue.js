/* 
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.
 */

var path = require("path"),
	Base = require(path.join(require.main.exports.libPath, "Base")),
	assert = require("assert");

module.exports = [{
		name: "TEST SUITE NOT DEFINED",
		testFunction: function() {
			console.log("IMPLEMENT ENTIRE TEST SUITE");
		},
		props: {
			expectedReturnValue: true
		}
	}
];