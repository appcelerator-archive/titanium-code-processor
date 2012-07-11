var path = require("path"),
	Base = require(path.join(require.main.exports.libPath, "Base")),
	assert = require("assert");

var enumerableProp = new Base.TypeDataProperty(),
	configurableProp = new Base.TypeDataProperty(),
	obj = new Base.TypeObject();

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
			return Base.fromPropertyDescriptor();
		},
		props: {
			expectedReturnValue: new Base.TypeUndefined()
		}
	},{
		name: "Data Property",
		testFunction: function() {
			var desc = new Base.TypeDataProperty(),
				valueProp = new Base.TypeDataProperty(),
				writeableProp = new Base.TypeDataProperty();
			
			desc.value = new Base.TypeNumber();
			desc.value.value = 10;
			
			valueProp.value = desc.value;
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
			
			return Base.fromPropertyDescriptor(desc);
		},
		props: {
			expectedReturnValue: obj
		}
	},{
		name: "Accessor Property",
		testFunction: function() {
			var desc = new Base.TypeAccessorProperty(),
				getProp = new Base.TypeDataProperty(),
				setProp = new Base.TypeDataProperty();
			
			desc.set = new Base.TypeObject();
			
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
			
			
			return Base.fromPropertyDescriptor(desc);
		},
		props: {
			expectedReturnValue: obj
		}
	}
];