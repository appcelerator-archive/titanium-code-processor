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
	FunctionTypeBase.call(this, 1, false, className || 'Function');
	
	this.defineOwnProperty('prototype', {
		value: prototypes[errorName]
	}, false, true);
	
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
	err.extensible = true;

	Object.defineProperty(err, 'objectPrototype', {
		get: function () {
			return prototypes['Error'];
		},
		configurable: true
	});

	err.put('name', new StringType(this._name), true);
	err.put('message', message && type(message) !== 'Undefined' ? toString(message) : new StringType(''), true);
	
	return err;
};
prototypes['Error'].put('constructor', globalObjects['Error'] = new ErrorConstructor(), false, true);
prototypes['EvalError'].put('constructor', globalObjects['EvalError'] = new ErrorConstructor(), false, true);
prototypes['RangeError'].put('constructor', globalObjects['RangeError'] = new ErrorConstructor(), false, true);
prototypes['ReferenceError'].put('constructor', globalObjects['ReferenceError'] = new ErrorConstructor(), false, true);
prototypes['SyntaxError'].put('constructor', globalObjects['SyntaxError'] = new ErrorConstructor(), false, true);
prototypes['TypeError'].put('constructor', globalObjects['Error'] = new ErrorConstructor(), false, true);
prototypes['URIError'].put('constructor', globalObjects['URIError'] = new ErrorConstructor(), false, true);