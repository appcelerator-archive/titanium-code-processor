var path = require("path"),
	Types = require(path.join(require.main.exports.libPath, "Types")),
	assert = require("assert");

module.exports = [{
		name: "Property does not exist",
		testFunction: function() {
			var obj = new Types.TypeObject();
			return obj.canPut("foo");
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Property does not exist, object has prototype",
		testFunction: function() {
			var parent = new Types.TypeObject(),
				obj = new Types.TypeObject();
			obj.objectPrototype = parent;
			return obj.canPut("foo");
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Property does not exist, object not extensible",
		testFunction: function() {
			var obj = new Types.TypeObject();
			obj.extensible = false;
			return obj.canPut("foo");
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Data Property exists, non-writable",
		testFunction: function() {
			var obj = new Types.TypeObject(),
				prop = new Types.TypeDataProperty();
			obj._properties["foo"] = prop;
			return obj.canPut("foo");
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Data Property exists, writable",
		testFunction: function() {
			var obj = new Types.TypeObject(),
				prop = new Types.TypeDataProperty();
			prop.writeable = true;
			obj._properties["foo"] = prop;
			return obj.canPut("foo");
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Accessor Property exists, no setter",
		testFunction: function() {
			var obj = new Types.TypeObject(),
				prop = new Types.TypeAccessorProperty();
			obj._properties["foo"] = prop;
			return obj.canPut("foo");
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Accessor Property exists, with setter",
		testFunction: function() {
			var obj = new Types.TypeObject(),
				prop = new Types.TypeAccessorProperty();
			prop.set = new Types.TypeObject();
			obj._properties["foo"] = prop;
			return obj.canPut("foo");
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Inherited Data Property exists, non-writable",
		testFunction: function() {
			var parent = new Types.TypeObject(),
				obj = new Types.TypeObject(),
				prop = new Types.TypeDataProperty();
			parent._properties["foo"] = prop;
			obj.objectPrototype = parent;
			return obj.canPut("foo");
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Inherited Data Property exists, writable",
		testFunction: function() {
			var parent = new Types.TypeObject(),
				obj = new Types.TypeObject(),
				prop = new Types.TypeDataProperty();
			prop.writeable = true;
			parent._properties["foo"] = prop;
			obj.objectPrototype = parent;
			return obj.canPut("foo");
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Inherited Accessor Property exists, no setter",
		testFunction: function() {
			var parent = new Types.TypeObject(),
				obj = new Types.TypeObject(),
				prop = new Types.TypeAccessorProperty();
			parent._properties["foo"] = prop;
			obj.objectPrototype = parent;
			return obj.canPut("foo");
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Inherited Accessor Property exists, with setter",
		testFunction: function() {
			var parent = new Types.TypeObject(),
				obj = new Types.TypeObject(),
				prop = new Types.TypeAccessorProperty();
			prop.set = new Types.TypeObject();
			parent._properties["foo"] = prop;
			obj.objectPrototype = parent;
			return obj.canPut("foo");
		},
		props: {
			expectedReturnValue: true
		}
	}
];