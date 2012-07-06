var path = require("path"),
	Types = require(path.join(require.main.exports.libPath, "Types")),
	assert = require("assert");

var parent,
	obj,
	undef = new Types.TypeUndefined(),
	value = new Types.TypeNumber(),
	dataProp = new Types.TypeDataProperty(),
	accessorProp = new Types.TypeAccessorProperty();
value.value = 10;
dataProp.value = value;
	
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
			return obj.get("foo");
		},
		props: {
			expectedReturnValue: undef
		}
	},{
		name: "Property does not exist, object has prototype",
		testFunction: function() {
			reset(undefined, true);
			return obj.get("foo");
		},
		props: {
			expectedReturnValue: undef
		}
	},{
		name: "Data Property",
		testFunction: function() {
			reset(dataProp, false);
			return obj.get("foo");
		},
		props: {
			expectedReturnValue: value
		}
	},{
		name: "Accessor Property, no getter",
		testFunction: function() {
			reset(accessorProp, false);
			return obj.get("foo");
		},
		props: {
			expectedReturnValue: undef
		}
	},{
		name: "Accessor Property, with getter",
		testFunction: function() {
			/*reset(Types.TypeAccessorProperty, false);
			return obj.get("foo");*/
			console.log("IMPLEMENT ME");
		},
		props: {
			expectedReturnValue: value
		}
	},{
		name: "Inherited Data Property",
		testFunction: function() {
			reset(dataProp, true);
			return obj.get("foo");
		},
		props: {
			expectedReturnValue: value
		}
	},{
		name: "Inherited Accessor Property, no getter",
		testFunction: function() {
			reset(accessorProp, true);
			return obj.get("foo");
		},
		props: {
			expectedReturnValue: undef
		}
	},{
		name: "Inherited Accessor Property, with getter",
		testFunction: function() {
			/*reset(Types.TypeAccessorProperty, true);
			return obj.get("foo");*/
			console.log("IMPLEMENT ME");
		},
		props: {
			expectedReturnValue: value
		}
	}
];