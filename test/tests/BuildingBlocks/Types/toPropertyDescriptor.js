var path = require("path"),
	Types = require(path.join(require.main.exports.libPath, "Types")),
	assert = require("assert");

var dataProp = new Types.TypeDataProperty(),
	accessorProp = new Types.TypeAccessorProperty();
	enumerableProp = new Types.TypeDataProperty(),
	configurableProp = new Types.TypeDataProperty();

enumerableProp.value = new Types.TypeBoolean();
enumerableProp.value.value = false;
enumerableProp.writeable = true;
enumerableProp.enumerable = true;
enumerableProp.configurable = true;

configurableProp.value = new Types.TypeBoolean();
configurableProp.value.value = false;
configurableProp.writeable = true;
configurableProp.enumerable = true;
configurableProp.configurable = true;

module.exports = [{
		name: "Obj is not actually object",
		testFunction: function() {
			return Types.toPropertyDescriptor(new Types.TypeUndefined());
		},
		props: {
			expectedException: "TypeError"
		}
	},{
		name: "Obj describes a data descriptor",
		testFunction: function() {
			var obj = new Types.TypeObject(),
				valueProp = new Types.TypeDataProperty(),
				writeableProp = new Types.TypeDataProperty();
			
			dataProp.value = new Types.TypeNumber();
			dataProp.value.value = 10;
			
			valueProp.value = dataProp.value;
			valueProp.writeable = true;
			valueProp.enumerable = true;
			valueProp.configurable = true;
			
			writeableProp.value = new Types.TypeBoolean();
			writeableProp.value.value = false;
			writeableProp.writeable = true;
			writeableProp.enumerable = true;
			writeableProp.configurable = true;
			
			obj._properties["enumerable"] = enumerableProp;
			obj._properties["configurable"] = configurableProp;
			obj._properties["value"] = valueProp;
			obj._properties["writeable"] = writeableProp;
			
			return Types.toPropertyDescriptor(obj);
		},
		props: {
			expectedReturnValue: dataProp
		}
	},{
		name: "Obj describes an accessor descriptor",
		testFunction: function() {
			var obj = new Types.TypeObject(),
				getProp = new Types.TypeDataProperty(),
				setProp = new Types.TypeDataProperty();
			
			setProp.value = accessorProp.set = new Types.TypeObject();
			setProp.value.call = {};
			setProp.writeable = true;
			setProp.enumerable = true;
			setProp.configurable = true;
			
			getProp.value = accessorProp.get = new Types.TypeUndefined();
			getProp.writeable = true;
			getProp.enumerable = true;
			getProp.configurable = true;
			
			obj._properties["enumerable"] = enumerableProp;
			obj._properties["configurable"] = configurableProp;
			obj._properties["get"] = getProp;
			obj._properties["set"] = setProp;
			
			debugger;
			return Types.toPropertyDescriptor(obj);
		},
		props: {
			expectedReturnValue: accessorProp
		}
	},{
		name: "Obj describes an accessor descriptor, non-callable setter",
		testFunction: function() {
			var obj = new Types.TypeObject(),
				getProp = new Types.TypeDataProperty(),
				setProp = new Types.TypeDataProperty();
			
			setProp.value = accessorProp.set = new Types.TypeObject();
			setProp.writeable = true;
			setProp.enumerable = true;
			setProp.configurable = true;
			
			getProp.value = accessorProp.get = new Types.TypeUndefined();
			getProp.writeable = true;
			getProp.enumerable = true;
			getProp.configurable = true;
			
			obj._properties["enumerable"] = enumerableProp;
			obj._properties["configurable"] = configurableProp;
			obj._properties["get"] = getProp;
			obj._properties["set"] = setProp;
			
			debugger;
			return Types.toPropertyDescriptor(obj);
		},
		props: {
			expectedException: "TypeError"
		}
	},{
		name: "Obj describes an accessor descriptor, non-callable getter",
		testFunction: function() {
			var obj = new Types.TypeObject(),
				getProp = new Types.TypeDataProperty(),
				setProp = new Types.TypeDataProperty();
			
			setProp.value = accessorProp.set = new Types.TypeUndefined();
			setProp.writeable = true;
			setProp.enumerable = true;
			setProp.configurable = true;
			
			getProp.value = accessorProp.get = new Types.TypeObject();
			getProp.writeable = true;
			getProp.enumerable = true;
			getProp.configurable = true;
			
			obj._properties["enumerable"] = enumerableProp;
			obj._properties["configurable"] = configurableProp;
			obj._properties["get"] = getProp;
			obj._properties["set"] = setProp;
			
			debugger;
			return Types.toPropertyDescriptor(obj);
		},
		props: {
			expectedException: "TypeError"
		}
	},{
		name: "Obj describes an amalgamation of accessor and data descriptor",
		testFunction: function() {
			var obj = new Types.TypeObject(),
				writeableProp = new Types.TypeDataProperty(),
				setProp = new Types.TypeDataProperty();
			
			setProp.value = accessorProp.set = new Types.TypeUndefined();
			setProp.writeable = true;
			setProp.enumerable = true;
			setProp.configurable = true;
			
			writeableProp.value = new Types.TypeBoolean();
			writeableProp.value.value = false;
			writeableProp.writeable = true;
			writeableProp.enumerable = true;
			writeableProp.configurable = true;
			
			obj._properties["enumerable"] = enumerableProp;
			obj._properties["configurable"] = configurableProp;
			obj._properties["writeable"] = writeableProp;
			obj._properties["set"] = setProp;
			
			debugger;
			return Types.toPropertyDescriptor(obj);
		},
		props: {
			expectedException: "TypeError"
		}
	}
];


