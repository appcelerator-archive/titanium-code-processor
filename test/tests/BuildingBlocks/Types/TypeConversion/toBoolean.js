var path = require("path"),
	Types = require(path.join(require.main.exports.libPath, "Types")),
	assert = require("assert");

var trueBoolean = new Types.TypeBoolean(),
	falseBoolean = new Types.TypeBoolean();
trueBoolean.value = true;
falseBoolean.value = false;

module.exports = [{
		name: "Undefined",
		testFunction: function() {
			return Types.toBoolean(new Types.TypeUndefined());
		},
		props: {
			expectedReturnValue: falseBoolean
		}
	},{
		name: "Null",
		testFunction: function() {
			return Types.toBoolean(new Types.TypeNull());
		},
		props: {
			expectedReturnValue: falseBoolean
		}
	},{
		name: "Boolean, false",
		testFunction: function() {
			var bool = new Types.TypeBoolean();
			bool.value = false;
			return Types.toBoolean(bool);
		},
		props: {
			expectedReturnValue: falseBoolean
		}
	},{
		name: "Boolean, true",
		testFunction: function() {
			var bool = new Types.TypeBoolean();
			bool.value = true;
			return Types.toBoolean(bool);
		},
		props: {
			expectedReturnValue: trueBoolean
		}
	},{
		name: "Number, 0",
		testFunction: function() {
			var num = new Types.TypeNumber();
			num.value = 0;
			return Types.toBoolean(num);
		},
		props: {
			expectedReturnValue: falseBoolean
		}
	},{
		name: "Number, NaN",
		testFunction: function() {
			var num = new Types.TypeNumber();
			num.value = NaN;
			return Types.toBoolean(num);
		},
		props: {
			expectedReturnValue: falseBoolean
		}
	},{
		name: "Number, 100",
		testFunction: function() {
			var num = new Types.TypeNumber();
			num.value = 100;
			return Types.toBoolean(num);
		},
		props: {
			expectedReturnValue: trueBoolean
		}
	},{
		name: "String, empty",
		testFunction: function() {
			var	str = new Types.TypeString();
			str.value = "";
			return Types.toBoolean(str);
		},
		props: {
			expectedReturnValue: falseBoolean
		}
	},{
		name: "String, non-empty",
		testFunction: function() {
			var	str = new Types.TypeString();
			str.value = "hello";
			return Types.toBoolean(str);
		},
		props: {
			expectedReturnValue: trueBoolean
		}
	},{
		name: "Object",
		testFunction: function() {
			return Types.toBoolean(new Types.TypeObject());
		},
		props: {
			expectedReturnValue: trueBoolean
		}
	}
];