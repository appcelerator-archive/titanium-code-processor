var path = require("path"),
	Types = require(path.join(require.main.exports.libPath, "Types")),
	assert = require("assert");

var enumerableProp = new Types.TypeDataProperty(),
	configurableProp = new Types.TypeDataProperty(),
	obj = new Types.TypeObject();

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

function deepEqual(a, b) {
	try {
		assert.deepEqual(a, b);
		return true;
	} catch(e) {
		return false;
	}
}

module.exports = [{
		name: "Description is undefined",
		testFunction: function() {
			return Types.fromPropertyDescriptor();
		},
		props: {
			expectedReturnValue: new Types.TypeUndefined()
		}
	},{
		name: "Data Property",
		testFunction: function() {
			var desc = new Types.TypeDataProperty(),
				valueProp = new Types.TypeDataProperty(),
				writeableProp = new Types.TypeDataProperty();
			
			desc.value = new Types.TypeNumber();
			desc.value.value = 10;
			
			valueProp.value = desc.value;
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
			
			return Types.fromPropertyDescriptor(desc);
		},
		props: {
			expectedReturnValue: obj
		}
	},{
		name: "Accessor Property",
		testFunction: function() {
			debugger;
			var desc = new Types.TypeAccessorProperty(),
				getProp = new Types.TypeDataProperty(),
				setProp = new Types.TypeDataProperty();
			
			desc.set = new Types.TypeObject();
			
			getProp.value = desc.get;
			getProp.writeable = true;
			getProp.enumerable = true;
			getProp.configurable = true;
			
			setProp.value = desc.set;
			setProp.writeable = true;
			setProp.enumerable = true;
			setProp.configurable = true;
			
			delete obj._properties["value"];
			delete obj._properties["writeable"];
			obj._properties["enumerable"] = enumerableProp;
			obj._properties["configurable"] = configurableProp;
			obj._properties["get"] = getProp;
			obj._properties["set"] = setProp;
			
			
			return Types.fromPropertyDescriptor(desc);
		},
		props: {
			expectedReturnValue: obj
		}
	}
];