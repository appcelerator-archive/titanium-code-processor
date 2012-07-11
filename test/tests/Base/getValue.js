var path = require("path"),
	Base = require(path.join(require.main.exports.libPath, "Base")),
	assert = require("assert");

module.exports = [{
		name: "Type is not a reference",
		testFunction: function() {
			return Base.getValue(new Base.TypeBoolean());
		},
		props: {
			expectedReturnValue: new Base.TypeBoolean()
		}
	},{
		name: "Reference is unresolvable",
		testFunction: function() {
			return Base.getValue(new Base.TypeReference());
		},
		props: {
			expectedException: "ReferenceError"
		}
	},{
		name: "Reference has primitive base",
		testFunction: function() {
			var ref = new Base.TypeReference();
			ref.baseValue = new Base.TypeNumber();
			debugger;
			return Base.getValue(ref);
		},
		props: {
			expectedReturnValue: new Base.TypeNumber()
		}
	}
];