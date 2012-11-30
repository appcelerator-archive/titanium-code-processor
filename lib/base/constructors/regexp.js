/*global
util
FunctionTypeBase
areAnyUnknown
UnknownType
prototypes
type
handleRecoverableNativeException
toString
RegExpType
StringType
*/

/*****************************************
 *
 * RegExp Constructor
 *
 *****************************************/

/**
 * RegExp constructor function
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.10
 */
function RegExpConstructor(className) {
	FunctionTypeBase.call(this, 2, className || 'Function');
	
	this.defineOwnProperty('prototype', {
		value: prototypes.RegExp
	}, false, true);
}
util.inherits(RegExpConstructor, FunctionTypeBase);
RegExpConstructor.prototype.call = function call(thisVal, args) {
	
	// Variable declarations
	var pattern = args[0];
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	if (pattern && type(pattern) === 'Object' && pattern.className === 'RegExp') {
		return pattern;
	}
	
	return RegExpConstructor.prototype.construct(args);
};
RegExpConstructor.prototype.construct = function call(args) {
	
	// Variable declarations
	var pattern = args[0] || new StringType(''),
		flags = args[1],
		p,
		f;
	
	// Validate the parameters
	if (areAnyUnknown(args)) {
		return new UnknownType();
	}
	
	// Parse the parameters
	if (type(pattern) === 'Object' && pattern.className === 'RegExp') {
		if (flags && type(flags) !== 'Undefined') {
			handleRecoverableNativeException('TypeError');
			return new UnknownType();
		}
		p = pattern._pattern;
		f = pattern._flags;
	} else {
		p = pattern && type(pattern) !== 'Undefined' ? toString(pattern).value : '';
		f = flags && type(flags) !== 'Undefined' ? toString(flags).value : '';
	}
	
	// Create the regex object
	return new RegExpType(p, f);
};