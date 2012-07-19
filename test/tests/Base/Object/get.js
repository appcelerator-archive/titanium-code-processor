/* 
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.
 */

var path = require("path"),
	Base = require(path.join(require.main.exports.libPath, "Base")),
	assert = require("assert");

var parent,
	obj,
	undef = new Base.TypeUndefined(),
	value = new Base.TypeNumber(),
	dataProp = new Base.DataPropertyDescriptor(),
	accessorProp = new Base.AccessorPropertyDescriptor();
value.value = 10;
dataProp.value = value;
	
function reset(prop, inherit) {
	obj = new Base.TypeObject();
	if (inherit) {
		parent = new Base.TypeObject();
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
			/*reset(Base.AccessorPropertyDescriptor, false);
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
			/*reset(Base.AccessorPropertyDescriptor, true);
			return obj.get("foo");*/
			console.log("IMPLEMENT ME");
		},
		props: {
			expectedReturnValue: value
		}
	}
];