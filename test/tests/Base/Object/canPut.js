/* 
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.
 */

var path = require("path"),
	Base = require(path.join(require.main.exports.libPath, "Base")),
	assert = require("assert");

module.exports = [{
		name: "Property does not exist",
		testFunction: function() {
			var obj = new Base.ObjectType();
			return obj.canPut("foo");
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Property does not exist, object has prototype",
		testFunction: function() {
			var parent = new Base.ObjectType(),
				obj = new Base.ObjectType();
			obj.objectPrototype = parent;
			return obj.canPut("foo");
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Property does not exist, object not extensible",
		testFunction: function() {
			var obj = new Base.ObjectType();
			obj.extensible = false;
			return obj.canPut("foo");
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Data Property exists, non-writable",
		testFunction: function() {
			var obj = new Base.ObjectType(),
				prop = new Base.DataPropertyDescriptor();
			obj._properties["foo"] = prop;
			return obj.canPut("foo");
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Data Property exists, writable",
		testFunction: function() {
			var obj = new Base.ObjectType(),
				prop = new Base.DataPropertyDescriptor();
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
			var obj = new Base.ObjectType(),
				prop = new Base.AccessorPropertyDescriptor();
			obj._properties["foo"] = prop;
			return obj.canPut("foo");
		},
		props: {
			expectedReturnValue: false
		}
	},{
		name: "Accessor Property exists, with setter",
		testFunction: function() {
			var obj = new Base.ObjectType(),
				prop = new Base.AccessorPropertyDescriptor();
			prop.set = new Base.ObjectType();
			obj._properties["foo"] = prop;
			return obj.canPut("foo");
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Inherited Data Property exists, non-writable",
		testFunction: function() {
			var parent = new Base.ObjectType(),
				obj = new Base.ObjectType(),
				prop = new Base.DataPropertyDescriptor();
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
			var parent = new Base.ObjectType(),
				obj = new Base.ObjectType(),
				prop = new Base.DataPropertyDescriptor();
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
			var parent = new Base.ObjectType(),
				obj = new Base.ObjectType(),
				prop = new Base.AccessorPropertyDescriptor();
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
			var parent = new Base.ObjectType(),
				obj = new Base.ObjectType(),
				prop = new Base.AccessorPropertyDescriptor();
			prop.set = new Base.ObjectType();
			parent._properties["foo"] = prop;
			obj.objectPrototype = parent;
			return obj.canPut("foo");
		},
		props: {
			expectedReturnValue: true
		}
	}
];