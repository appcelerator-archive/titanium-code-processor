var path = require("path"),
	Types = require(path.join(require.main.exports.libPath, "Types")),
	assert = require("assert");

var parent,
	obj,
	dataProp1,
	dataProp2,
	accessorProp1,
	accessorProp2,
	number = new Types.TypeNumber(),
	undef = new Types.TypeUndefined();
number.value = 10;
	
function reset(inherit) {
	obj = new Types.TypeObject();
	dataProp1 = new Types.TypeDataProperty();
	dataProp2 = new Types.TypeDataProperty();
	accessorProp1 = new Types.TypeAccessorProperty();
	accessorProp2 = new Types.TypeAccessorProperty();
	if (inherit) {
		parent = new Types.TypeObject();
		obj.objectPrototype = parent;
	}
}

function deepEqual(a, b) {
	try {
		assert.deepEqual(a, b);
		return true;
	} catch(e) {
		return false;
	}
}

module.exports = [

	// Step 1
	{
		name: "Property does not exist, object not extensible (i.e. canPut() is false), throw is false",
		testFunction: function() {
			reset(false);
			obj.extensible = false;
			return obj.put("foo", number, false);
		},
		props: {
			expectedReturnValue: undefined,
			postEvaluation: function() {
				return !obj._properties["foo"];
			}
		}
	},{
		name: "Property does not exist, object not extensible (i.e. canPut() is false), throw is true",
		testFunction: function() {
			reset(false);
			obj.extensible = false;
			return obj.put("foo", number, true);
		},
		props: {
			expectedException: "TypeError"
		}
	},
	
	// Step 3
	{
		name: "Property exists, old prop is data, canPut() is true",
		testFunction: function() {
			reset(false);
			dataProp1.configurable = true;
			dataProp1.writeable = true;
			dataProp1.enumerable = true;
			obj._properties["foo"] = dataProp1;
			return obj.put("foo", number, false);
		},
		props: {
			expectedReturnValue: undefined,
			postEvaluation: function() {
				return deepEqual(obj._properties["foo"], {
					configurable: true,
					enumerable: true,
					writeable: true,
					value: number
				});
			}
		}
	},{
		name: "Property exists, old prop is data, object is not configurable (i.e. put fails silently)",
		testFunction: function() {
			reset(false);
			dataProp1.configurable = false;
			obj._properties["foo"] = dataProp1;
			return obj.put("foo", number, false);
		},
		props: {
			expectedReturnValue: undefined,
			postEvaluation: function() {
				return deepEqual(obj._properties["foo"], dataProp1);
			}
		}
	},
	
	// Step 5
	{
		name: "Property exists, old prop is accessor, set is undefined, throw is false",
		testFunction: function() {
			reset(false);
			obj._properties["foo"] = accessorProp1;
			return obj.put("foo", number, false);
		},
		props: {
			expectedReturnValue: undefined,
			postEvaluation: function() {
				return deepEqual(obj._properties["foo"], accessorProp1);
			}
		}
	},{
		name: "Property exists, old prop is accessor, set is undefined, throw is true",
		testFunction: function() {
			reset(false);
			obj._properties["foo"] = accessorProp1;
			return obj.put("foo", number, true);
		},
		props: {
			expectedException: "TypeError"
		}
	},{
		name: "Property inherited from parent, old prop is accessor, set is undefined, throw is true",
		testFunction: function() {
			reset(true);
			parent._properties["foo"] = accessorProp1;
			return obj.put("foo", number, true);
		},
		props: {
			expectedException: "TypeError"
		}
	},{
		name: "Property exists, old prop is accessor, with setter",
		testFunction: function() {
			console.log("IMPLEMENT ME");
		},
		props: {
			expectedReturnValue: true
		}
	},{
		name: "Property exists, old prop is inherited accessor, with setter",
		testFunction: function() {
			console.log("IMPLEMENT ME");
		},
		props: {
			expectedReturnValue: true
		}
	},
	
	// Step 6
	{
		name: "Property does not exist, object is extensible",
		testFunction: function() {
			reset(false);
			return obj.put("foo", number, false);
		},
		props: {
			expectedReturnValue: undefined,
			postEvaluation: function() {
				return deepEqual(obj._properties["foo"], {
					writeable: true,
					enumerable: true,
					configurable: true,
					value: number
				});
			}
		}
	}
];