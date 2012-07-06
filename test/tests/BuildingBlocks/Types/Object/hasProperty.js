var path = require("path"),
	Types = require(path.join(require.main.exports.libPath, "Types")),
	assert = require("assert");

var parent,
	obj,
	dataProp = new Types.TypeDataProperty(),
	accessorProp = new Types.TypeAccessorProperty();
	
function reset(prop, inherit) {
	obj = new Types.TypeObject();
	if (inherit) {
		parent = new Types.TypeObject();
		obj.objectPrototype = parent;
		parent._properties["foo"] = prop;
	} else {
		obj._properties["foo"] = prop;
	}
}

module.exports = [{
		name: "Property does not exist",
		testFunction: function() {
			reset(undefined, false);
			return obj.hasProperty("foo");
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Property does not exist, object has prototype",
		testFunction: function() {
			reset(undefined, true);
			return obj.hasProperty("foo");
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Data Property",
		testFunction: function() {
			reset(dataProp, false);
			return obj.hasProperty("foo");
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Accessor Property",
		testFunction: function() {
			reset(accessorProp, false);
			return obj.hasProperty("foo");
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Inherited Data Property",
		testFunction: function() {
			reset(dataProp, true);
			return obj.hasProperty("foo");
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Inherited Accessor Property",
		testFunction: function() {
			reset(accessorProp, true);
			return obj.hasProperty("foo");
		},
		props: {
			expectedReturnValue: true
		}
	}
];