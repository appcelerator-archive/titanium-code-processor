var path = require("path"),
	Base = require(path.join(require.main.exports.libPath, "Base")),
	assert = require("assert");

var dataProp = new Base.TypeDataProperty(),
	accessorProp = new Base.TypeAccessorProperty();
	enumerableProp = new Base.TypeDataProperty(),
	configurableProp = new Base.TypeDataProperty();

enumerableProp.value = new Base.TypeBoolean();
enumerableProp.value.value = false;
enumerableProp.writeable = true;
enumerableProp.enumerable = true;
enumerableProp.configurable = true;

configurableProp.value = new Base.TypeBoolean();
configurableProp.value.value = false;
configurableProp.writeable = true;
configurableProp.enumerable = true;
configurableProp.configurable = true;

module.exports = [{
		name: "Obj is not actually object",
		testFunction: function() {
			return Base.toPropertyDescriptor(new Base.TypeUndefined());
		},
		props: {
			expectedException: "TypeError"
		}
	},{
		name: "Obj describes a data descriptor",
		testFunction: function() {
			var obj = new Base.TypeObject(),
				valueProp = new Base.TypeDataProperty(),
				writeableProp = new Base.TypeDataProperty();
			
			dataProp.value = new Base.TypeNumber();
			dataProp.value.value = 10;
			
			valueProp.value = dataProp.value;
			valueProp.writeable = true;
			valueProp.enumerable = true;
			valueProp.configurable = true;
			
			writeableProp.value = new Base.TypeBoolean();
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
			var obj = new Base.TypeObject(),
				getProp = new Base.TypeDataProperty(),
				setProp = new Base.TypeDataProperty();
			
			setProp.value = accessorProp.set = new Base.TypeObject();
			setProp.value.call = {};
			setProp.writeable = true;
			setProp.enumerable = true;
			setProp.configurable = true;
			
			getProp.value = accessorProp.get = new Base.TypeUndefined();
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
			var obj = new Base.TypeObject(),
				getProp = new Base.TypeDataProperty(),
				setProp = new Base.TypeDataProperty();
			
			setProp.value = accessorProp.set = new Base.TypeObject();
			setProp.writeable = true;
			setProp.enumerable = true;
			setProp.configurable = true;
			
			getProp.value = accessorProp.get = new Base.TypeUndefined();
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
			var obj = new Base.TypeObject(),
				getProp = new Base.TypeDataProperty(),
				setProp = new Base.TypeDataProperty();
			
			setProp.value = accessorProp.set = new Base.TypeUndefined();
			setProp.writeable = true;
			setProp.enumerable = true;
			setProp.configurable = true;
			
			getProp.value = accessorProp.get = new Base.TypeObject();
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
			var obj = new Base.TypeObject(),
				writeableProp = new Base.TypeDataProperty(),
				setProp = new Base.TypeDataProperty();
			
			setProp.value = accessorProp.set = new Base.TypeUndefined();
			setProp.writeable = true;
			setProp.enumerable = true;
			setProp.configurable = true;
			
			writeableProp.value = new Base.TypeBoolean();
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


