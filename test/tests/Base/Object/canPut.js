var path = require("path"),
	Base = require(path.join(require.main.exports.libPath, "Base")),
	assert = require("assert");

module.exports = [{
		name: "Property does not exist",
		testFunction: function() {
			var obj = new Base.TypeObject();
			return obj.canPut("foo");
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Property does not exist, object has prototype",
		testFunction: function() {
			var parent = new Base.TypeObject(),
				obj = new Base.TypeObject();
			obj.objectPrototype = parent;
			return obj.canPut("foo");
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Property does not exist, object not extensible",
		testFunction: function() {
			var obj = new Base.TypeObject();
			obj.extensible = false;
			return obj.canPut("foo");
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Data Property exists, non-writable",
		testFunction: function() {
			var obj = new Base.TypeObject(),
				prop = new Base.DataDescriptor();
			obj._properties["foo"] = prop;
			return obj.canPut("foo");
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Data Property exists, writable",
		testFunction: function() {
			var obj = new Base.TypeObject(),
				prop = new Base.DataDescriptor();
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
			var obj = new Base.TypeObject(),
				prop = new Base.AccessorDescriptor();
			obj._properties["foo"] = prop;
			return obj.canPut("foo");
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Accessor Property exists, with setter",
		testFunction: function() {
			var obj = new Base.TypeObject(),
				prop = new Base.AccessorDescriptor();
			prop.set = new Base.TypeObject();
			obj._properties["foo"] = prop;
			return obj.canPut("foo");
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Inherited Data Property exists, non-writable",
		testFunction: function() {
			var parent = new Base.TypeObject(),
				obj = new Base.TypeObject(),
				prop = new Base.DataDescriptor();
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
			var parent = new Base.TypeObject(),
				obj = new Base.TypeObject(),
				prop = new Base.DataDescriptor();
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
			var parent = new Base.TypeObject(),
				obj = new Base.TypeObject(),
				prop = new Base.AccessorDescriptor();
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
			var parent = new Base.TypeObject(),
				obj = new Base.TypeObject(),
				prop = new Base.AccessorDescriptor();
			prop.set = new Base.TypeObject();
			parent._properties["foo"] = prop;
			obj.objectPrototype = parent;
			return obj.canPut("foo");
		},
		props: {
			expectedReturnValue: true
		}
	}
];