var path = require("path"),
	Types = require(path.join(require.main.exports.libPath, "Types")),
	assert = require("assert");

module.exports = [{
		name: "Default Value",
		testFunction: function() {
			console.log("IMPLEMENT ENTIRE TEST SUITE");
		},
		props: {
			expectedReturnValue: true
		}
	}
];