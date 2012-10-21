/*****************************************
 *
 * Error Constructor
 *
 *****************************************/

/**
 * Error constructor function
 * 
 * @constructor
 * @see ECMA-262 Spec Chapter 15.11
 */
exports.ErrorConstructor = ErrorConstructor;
function ErrorConstructor(errorName, className) {
	FunctionTypeBase.call(this, 0, false, className || 'Function');
	this._name = errorName;
}
util.inherits(ErrorConstructor, FunctionTypeBase);
ErrorConstructor.prototype.call = function call(thisVal, args) {
	
	// Validate the parameters
	if (areAnyUnknown((args || []).concat(thisVal))) {
		return new UnknownType();
	}
	
	return ErrorConstructor.prototype.construct(args);
};
ErrorConstructor.prototype.construct = function call(args) {
	
	// Variable declarations
	var err,
		message = args[0];
	
	// Validate the parameters
	if (areAnyUnknown(args)) {
		return new UnknownType();
	}
	
	err = new ObjectType();
	err.className = 'Error';
	err.objectPrototype = new ErrorPrototypeType();
	err.extensible = true;

	err.put('name', new StringType(this._name), true);
	err.put('message', message && type(message) !== 'Undefined' ? toString(message) : new StringType(''), true);
	
	return err;
};
prototypes['Error'].put('constructor', globalObjects['Error'] = new ErrorConstructor());
globalObjects['EvalError'] = new ErrorConstructor();
globalObjects['RangeError'] = new ErrorConstructor();
globalObjects['ReferenceError'] = new ErrorConstructor();
globalObjects['SyntaxError'] = new ErrorConstructor();
globalObjects['TypeError'] = new ErrorConstructor();
globalObjects['URIError'] = new ErrorConstructor();