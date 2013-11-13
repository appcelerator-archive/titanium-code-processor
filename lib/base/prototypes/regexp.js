/*global
util,
FunctionTypeBase,
areAnyUnknown,
UnknownType,
toString,
ArrayType,
NullType,
NumberType,
StringType,
BooleanType,
toBoolean,
ObjectType,
addNonEnumerableProperty,
addReadOnlyProperty,
handleRecoverableNativeException,
type,
wrapNativeCall
*/

/*****************************************
 *
 * RegExp Prototype Class
 *
 *****************************************/

/**
 * exec() prototype method. Note: here we wrap node's native exec method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.10.6.2 and https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/RegExp/exec
 */
function RegExpProtoExecFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(RegExpProtoExecFunc, FunctionTypeBase);
RegExpProtoExecFunc.prototype.callFunction = wrapNativeCall(function callFunction(thisVal, args) {

	// Variable declarations
	var r,
		rValue,
		s,
		result,
		a,
		i,
		len;

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	// Make sure this is a regexp object
	if (type(thisVal) !== 'Object' || thisVal.className !== 'RegExp') {
		handleRecoverableNativeException('TypeError', 'exec must be called on a RegExp object');
		return new UnknownType();
	}

	// Initialize values
	r = thisVal;
	rValue = r.value;
	s = toString(args[0]);
	a = new ArrayType();

	// Update lastIndex since it's writeable
	rValue.lastIndex = r.get('lastIndex').value;

	// Update the regexp object
	r._refreshRegExpFromProperties();

	// Perform the exec
	result = r.value.exec(s.value);

	// Update the regexp object
	r._refreshPropertiesFromRegExp();

	// Check for no match
	if (result === null) {
		return new NullType();
	}

	// Create the results array
	a.put('index', new NumberType(result.index), false, true);
	a.put('input', s, false, true);
	for (i = 0, len = result.length; i < len; i++) {
		a.put(i, new StringType(result[i]), false, true);
	}
	a.put('length', new NumberType(result.length), false, true);
	return a;
});

/**
 * test() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.10.6.3
 */
function RegExpProtoTestFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(RegExpProtoTestFunc, FunctionTypeBase);
RegExpProtoTestFunc.prototype.callFunction = wrapNativeCall(function callFunction(thisVal, args) {

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	return toBoolean(RegExpProtoExecFunc.prototype.callFunction(thisVal, args));
});

/**
 * toString() prototype method
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.10.6.4
 */
function RegExpProtoToStringFunc(className) {
	FunctionTypeBase.call(this, 0, className || 'Function');
}
util.inherits(RegExpProtoToStringFunc, FunctionTypeBase);
RegExpProtoToStringFunc.prototype.callFunction = wrapNativeCall(function callFunction(thisVal, args) {

	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}

	return new StringType(thisVal.value.toString());
});

/**
 * @classdesc The prototype for RegExps
 *
 * @constructor module:Base.RegExpPrototypeType
 * @see ECMA-262 Spec Chapter 15.10.6
 */
exports.RegExpPrototypeType = RegExpPrototypeType;
function RegExpPrototypeType(className) {
	ObjectType.call(this, className);

	addNonEnumerableProperty(this, 'exec', new RegExpProtoExecFunc());
	addNonEnumerableProperty(this, 'test', new RegExpProtoTestFunc());
	addNonEnumerableProperty(this, 'toString', new RegExpProtoToStringFunc());

	addReadOnlyProperty(this, 'source', new StringType('(?:)'));
	addReadOnlyProperty(this, 'global', new BooleanType(false));
	addReadOnlyProperty(this, 'ignoreCase', new BooleanType(false));
	addReadOnlyProperty(this, 'multiline', new BooleanType(false));
	addReadOnlyProperty(this, 'lastIndex', new NumberType(0));
}
util.inherits(RegExpPrototypeType, ObjectType);