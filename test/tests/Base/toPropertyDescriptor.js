/* 
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.
 */

var path = require("path"),
	Base = require(path.join(require.main.exports.libPath, "Base")),
	assert = require("assert");

var dataProp = new Base.DataPropertyDescriptor(),
	accessorProp = new Base.AccessorPropertyDescriptor();
	enumerableProp = new Base.DataPropertyDescriptor(),
	configurableProp = new Base.DataPropertyDescriptor();

enumerableProp.value = new Base.BooleanType();
enumerableProp.value.value = false;
enumerableProp.writeable = true;
enumerableProp.enumerable = true;
enumerableProp.configurable = true;

configurableProp.value = new Base.BooleanType();
configurableProp.value.value = false;
configurableProp.writeable = true;
configurableProp.enumerable = true;
configurableProp.configurable = true;

module.exports = [{
		name: "Obj is not actually object",
		testFunction: function() {
			return Base.toPropertyDescriptor(new Base.UndefinedType());
		},
		props: {
			expectedException: "TypeError"
		}
	},{
		name: "Obj describes a data descriptor",
		testFunction: function() {
			var obj = new Base.ObjectType(),
				valueProp = new Base.DataPropertyDescriptor(),
				writeableProp = new Base.DataPropertyDescriptor();
			
			dataProp.value = new Base.NumberType();
			dataProp.value.value = 10;
			
			valueProp.value = dataProp.value;
			valueProp.writeable = true;
			valueProp.enumerable = true;
			valueProp.configurable = true;
			
			writeableProp.value = new Base.BooleanType();
			writeableProp.value.value = false;
			writeableProp.writeable = true;
			writeableProp.enumerable = true;
			writeableProp.configurable = true;
			
			obj._properties["enumerable"] = enumerableProp;
			obj._properties["configurable"] = configurableProp;
			obj._properties["value"] = valueProp;
			obj._properties["writeable"] = writeableProp;
			
			return Base.toPropertyDescriptor(obj);
		},
		props: {
			expectedReturnValue: dataProp
		}
	},{
		name: "Obj describes an accessor descriptor",
		testFunction: function() {
			var obj = new Base.ObjectType(),
				getProp = new Base.DataPropertyDescriptor(),
				setProp = new Base.DataPropertyDescriptor();
			
			setProp.value = accessorProp.set = new Base.ObjectType();
			setProp.value.call = {};
			setProp.writeable = true;
			setProp.enumerable = true;
			setProp.configurable = true;
			
			getProp.value = accessorProp.get = new Base.UndefinedType();
			getProp.writeable = true;
			getProp.enumerable = true;
			getProp.configurable = true;
			
			obj._properties["enumerable"] = enumerableProp;
			obj._properties["configurable"] = configurableProp;
			obj._properties["get"] = getProp;
			obj._properties["set"] = setProp;
			
			return Base.toPropertyDescriptor(obj);
		},
		props: {
			expectedReturnValue: accessorProp
		}
	},{
		name: "Obj describes an accessor descriptor, non-callable setter",
		testFunction: function() {
			var obj = new Base.ObjectType(),
				getProp = new Base.DataPropertyDescriptor(),
				setProp = new Base.DataPropertyDescriptor();
			
			setProp.value = accessorProp.set = new Base.ObjectType();
			setProp.writeable = true;
			setProp.enumerable = true;
			setProp.configurable = true;
			
			getProp.value = accessorProp.get = new Base.UndefinedType();
			getProp.writeable = true;
			getProp.enumerable = true;
			getProp.configurable = true;
			
			obj._properties["enumerable"] = enumerableProp;
			obj._properties["configurable"] = configurableProp;
			obj._properties["get"] = getProp;
			obj._properties["set"] = setProp;
			
			return Base.toPropertyDescriptor(obj);
		},
		props: {
			expectedException: "TypeError"
		}
	},{
		name: "Obj describes an accessor descriptor, non-callable getter",
		testFunction: function() {
			var obj = new Base.ObjectType(),
				getProp = new Base.DataPropertyDescriptor(),
				setProp = new Base.DataPropertyDescriptor();
			
			setProp.value = accessorProp.set = new Base.UndefinedType();
			setProp.writeable = true;
			setProp.enumerable = true;
			setProp.configurable = true;
			
			getProp.value = accessorProp.get = new Base.ObjectType();
			getProp.writeable = true;
			getProp.enumerable = true;
			getProp.configurable = true;
			
			obj._properties["enumerable"] = enumerableProp;
			obj._properties["configurable"] = configurableProp;
			obj._properties["get"] = getProp;
			obj._properties["set"] = setProp;
			
			return Base.toPropertyDescriptor(obj);
		},
		props: {
			expectedException: "TypeError"
		}
	},{
		name: "Obj describes an amalgamation of accessor and data descriptor",
		testFunction: function() {
			var obj = new Base.ObjectType(),
				writeableProp = new Base.DataPropertyDescriptor(),
				setProp = new Base.DataPropertyDescriptor();
			
			setProp.value = accessorProp.set = new Base.UndefinedType();
			setProp.writeable = true;
			setProp.enumerable = true;
			setProp.configurable = true;
			
			writeableProp.value = new Base.BooleanType();
			writeableProp.value.value = false;
			writeableProp.writeable = true;
			writeableProp.enumerable = true;
			writeableProp.configurable = true;
			
			obj._properties["enumerable"] = enumerableProp;
			obj._properties["configurable"] = configurableProp;
			obj._properties["writeable"] = writeableProp;
			obj._properties["set"] = setProp;
			
			return Base.toPropertyDescriptor(obj);
		},
		props: {
			expectedException: "TypeError"
		}
	}
];


