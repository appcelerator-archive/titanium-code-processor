var path = require("path"),
	Base = require(path.join(require.main.exports.libPath, "Base")),
	assert = require("assert");

var trueBoolean = new Base.TypeBoolean(),
	falseBoolean = new Base.TypeBoolean();
trueBoolean.value = true;
falseBoolean.value = false;

module.exports = [{
		name: "Undefined",
		testFunction: function() {
			return Base.toBoolean(new Base.TypeUndefined());
		},
		props: {
			expectedReturnValue: falseBoolean
		}
	},{
		name: "Null",
		testFunction: function() {
			return Base.toBoolean(new Base.TypeNull());
		},
		props: {
			expectedReturnValue: falseBoolean
		}
	},{
		name: "Boolean, false",
		testFunction: function() {
			var bool = new Base.TypeBoolean();
			bool.value = false;
			return Base.toBoolean(bool);
		},
		props: {
			expectedReturnValue: falseBoolean
		}
	},{
		name: "Boolean, true",
		testFunction: function() {
			var bool = new Base.TypeBoolean();
			bool.value = true;
			return Base.toBoolean(bool);
		},
		props: {
			expectedReturnValue: trueBoolean
		}
	},{
		name: "Number, 0",
		testFunction: function() {
			var num = new Base.TypeNumber();
			num.value = 0;
			return Base.toBoolean(num);
		},
		props: {
			expectedReturnValue: falseBoolean
		}
	},{
		name: "Number, NaN",
		testFunction: function() {
			var num = new Base.TypeNumber();
			num.value = NaN;
			return Base.toBoolean(num);
		},
		props: {
			expectedReturnValue: falseBoolean
		}
	},{
		name: "Number, 100",
		testFunction: function() {
			var num = new Base.TypeNumber();
			num.value = 100;
			return Base.toBoolean(num);
		},
		props: {
			expectedReturnValue: trueBoolean
		}
	},{
		name: "String, empty",
		testFunction: function() {
			var	str = new Base.TypeString();
			str.value = "";
			return Base.toBoolean(str);
		},
		props: {
			expectedReturnValue: falseBoolean
		}
	},{
		name: "String, non-empty",
		testFunction: function() {
			var	str = new Base.TypeString();
			str.value = "hello";
			return Base.toBoolean(str);
		},
		props: {
			expectedReturnValue: trueBoolean
		}
	},{
		name: "Object",
		testFunction: function() {
			return Base.toBoolean(new Base.TypeObject());
		},
		props: {
			expectedReturnValue: trueBoolean
		}
	}
];