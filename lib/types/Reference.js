// See 8.7

var TypeError = require("../Exceptions.js").TypeError,
	toObject = require("../type_conversion/TypeConversion.js").toObject;

// ******** Non-spec helpers ********

function isPrimitive(o) {
	return !~["Number", "String", "Boolean"].indexOf(o.className);
}
exports.isPrimitive = isPrimitive;

// ******** Methods ********

var isDataDescriptor = exports.isDataDescriptor = function(desc) {
	
};

var isAccessorDescriptor = exports.isAccessorDescriptor = function(desc) {
	
};

var isGenericDescriptor = exports.isGenericDescriptor = function(desc) {
	
};

var Reference = exports.Reference = function() {
	this.baseValue = undefined;
	this.referencedName = "";
	this.strictReference = false;
	this._isReference = true;
};

var getBase = exports.getBase = function(v) {
	return v.baseValue;
}

var getReferencedName = exports.getReferencedName = function(v) {
	return v.referencedName;
};

var isStrictReference = exports.isStrictReference = function(v) {
	return v.strictReference;
};

var hasPrimitiveBase = exports.hasPrimitiveBase = function(v) {
	var className = getBase(v).className;
	return !~["Number", "String", "Boolean"].indexOf(className);
};

var isPropertyReference = exports.isPropertyReference = function(v) {
	return hasPrimitiveBase(v) || getBase(v).className === "Object";
};

var isUnresolvableReference = exports.isUnresolvableReference = function(v) {
	return getBase(v) === undefined;
};

// 8.7.1
var GetValue = exports.GetValue = function(v) {
	if (v._isReference) {
		var base = getBase(v);
		if (isUnresolvableReference(v)) {
			throw new ReferenceError();
		}
		var get;
		if (isPropertyReference(v)) {
			if (hasPrimitiveBase(v)) {
				get = function(p) {
					var o = toObject(base),
						desc = o.getProperty(p);
					if (desc === undefined) {
						return;
					}
					if (isDataDescriptor(desc)) {
						return desc.value;
					}
					if (isAccessorDescriptor(desc)) {
						if (!desc.get) {
							return;
						}
						desc.get.call(base);
					}
				};
			} else {
				get = base.get;
			}
			return get(getReferencedName(v));
		} else {
			return base.getBindingValue(v);
		}
	} else {
		return v;
	}
}