var path = require("path"),
	Base = require(path.join(require.main.exports.libPath, "Base")),
	assert = require("assert");

var parent,
	obj,
	prop;

function reset(inherit) {
	obj = new Base.TypeObject();
	prop = new Base.DataPropertyDescriptor();
	if (inherit) {
		parent = new Base.TypeObject();
		obj.objectPrototype = parent;
	}
}

module.exports = [{
		name: "Property does not exist",
		testFunction: function() {
			reset(false);
			return obj["delete"]("foo", false);
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Property exists on parent",
		testFunction: function() {
			reset(true);
			parent._properties["foo"] = prop;
			return obj["delete"]("foo", false);
		},
		props: {
			expectedReturnValue: true,
			postEvaluation: function() {
				return !!parent._properties["foo"];
			}
		}
	},{
		name: "Property exists, prop is configurable",
		testFunction: function() {
			reset(false);
			prop.configurable = true;
			obj._properties["foo"] = prop;
			return obj["delete"]("foo", false);
		},
		props: {
			expectedReturnValue: true,
			postEvaluation: function() {
				return !obj._properties["foo"];
			}
		}
	},{
		name: "Property exists, prop is not configurable, throw is false",
		testFunction: function() {
			reset(false);
			prop.configurable = false;
			obj._properties["foo"] = prop;
			return obj["delete"]("foo", false);
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Property exists, prop is not configurable, throw is false",
		testFunction: function() {
			reset(false);
			prop.configurable = false;
			obj._properties["foo"] = prop;
			return obj["delete"]("foo", true);
		},
		props: {
			expectedException: "TypeError"
		}
	}
];