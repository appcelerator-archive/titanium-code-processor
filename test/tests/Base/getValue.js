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