/*global
Runtime
throwNativeException
prototypes
throwTypeError
addReadOnlyProperty
ObjectType
FunctionType
NumberType
UndefinedType
newObjectEnvironment
ExecutionContext
NumberPrototypeType
BooleanPrototypeType
StringPrototypeType
ObjectPrototypeType
ArrayPrototypeType
FunctionPrototypeType
RegExpPrototypeType
DatePrototypeType
ErrorPrototypeType
NumberConstructor
BooleanConstructor
StringConstructor
ObjectConstructor
ArrayConstructor
FunctionConstructor
RegExpConstructor
DateConstructor
ErrorConstructor
EvalFunction
ParseIntFunction
ParseFloatFunction
IsNaNFunction
IsFiniteFunction
DecodeURIFunction
DecodeURIComponentFunction
EncodeURIFunction
EncodeURIComponentFunction
MathObject
JSONObject
addNonEnumerableProperty
*/

/*****************************************
 *
 * VM Initialization
 *
 *****************************************/

/**
 * Injects the global objects into the global namespace
 *
 * @method
 * @name module:Base.init
 */
exports.init = init;
function init() {

	var globalObject = Runtime.getGlobalObject(),
		globalContext = Runtime.getGlobalContext(),
		globalObjects = {};

	function addObject(name, value) {
		globalObject.defineOwnProperty(name, {
			value: value,
			writable: true,
			enumerable: false,
			configurable: true
		}, false, true);
	}

	// Create the prototypes
	prototypes.Number = new NumberPrototypeType();
	prototypes.Boolean = new BooleanPrototypeType();
	prototypes.String = new StringPrototypeType();
	prototypes.Object = new ObjectPrototypeType();
	prototypes.Array = new ArrayPrototypeType();
	prototypes.Function = new FunctionPrototypeType();
	prototypes.RegExp = new RegExpPrototypeType();
	prototypes.Date = new DatePrototypeType();
	prototypes.Error = new ErrorPrototypeType('Error');
	prototypes.EvalError = new ErrorPrototypeType('EvalError');
	prototypes.RangeError = new ErrorPrototypeType('RangeError');
	prototypes.ReferenceError = new ErrorPrototypeType('ReferenceError');
	prototypes.SyntaxError = new ErrorPrototypeType('SyntaxError');
	prototypes.TypeError = new ErrorPrototypeType('TypeError');
	prototypes.URIError = new ErrorPrototypeType('URIError');

	// Set the error prototypes
	prototypes.EvalError.objectPrototype =
		prototypes.RangeError.objectPrototype =
		prototypes.ReferenceError.objectPrototype =
		prototypes.SyntaxError.objectPrototype =
		prototypes.TypeError.objectPrototype =
		prototypes.URIError.objectPrototype =
		prototypes.Error;

	// Create the global objects and set the constructors
	addNonEnumerableProperty(prototypes.Number, 'constructor', globalObjects.Number = new NumberConstructor(), false, true);
	addNonEnumerableProperty(prototypes.Boolean, 'constructor', globalObjects.Boolean = new BooleanConstructor(), false, true);
	addNonEnumerableProperty(prototypes.String, 'constructor', globalObjects.String = new StringConstructor(), false, true);
	addNonEnumerableProperty(prototypes.Object, 'constructor', globalObjects.Object = new ObjectConstructor(), false, true);
	addNonEnumerableProperty(prototypes.Array, 'constructor', globalObjects.Array = new ArrayConstructor(), false, true);
	addNonEnumerableProperty(prototypes.Function, 'constructor', globalObjects.Function = new FunctionConstructor(), false, true);
	addNonEnumerableProperty(prototypes.RegExp, 'constructor', globalObjects.RegExp = new RegExpConstructor(), false, true);
	addNonEnumerableProperty(prototypes.Date, 'constructor', globalObjects.Date = new DateConstructor(), false, true);
	addNonEnumerableProperty(prototypes.Error, 'constructor', globalObjects.Error = new ErrorConstructor('Error'), false, true);
	addNonEnumerableProperty(prototypes.EvalError, 'constructor', globalObjects.EvalError = new ErrorConstructor('EvalError'), false, true);
	addNonEnumerableProperty(prototypes.RangeError, 'constructor', globalObjects.RangeError = new ErrorConstructor('RangeError'), false, true);
	addNonEnumerableProperty(prototypes.ReferenceError, 'constructor', globalObjects.ReferenceError = new ErrorConstructor('ReferenceError'), false, true);
	addNonEnumerableProperty(prototypes.SyntaxError, 'constructor', globalObjects.SyntaxError = new ErrorConstructor('SyntaxError'), false, true);
	addNonEnumerableProperty(prototypes.TypeError, 'constructor', globalObjects.TypeError = new ErrorConstructor('TypeError'), false, true);
	addNonEnumerableProperty(prototypes.URIError, 'constructor', globalObjects.URIError = new ErrorConstructor('URIError'), false, true);

	// Create the throw type error
	throwTypeError = new FunctionType([], undefined, globalContext.lexicalEnvironment, globalContext.strict);
	throwTypeError.call = function () {
		throwNativeException('TypeError', '');
	};
	throwTypeError.extensible = false;

	// Properties
	addReadOnlyProperty(globalObject, 'NaN', new NumberType(NaN));
	addReadOnlyProperty(globalObject, 'Infinity', new NumberType(Infinity));
	addReadOnlyProperty(globalObject, 'undefined', new UndefinedType());

	// Methods
	addObject('eval', new EvalFunction());
	addObject('parseInt', new ParseIntFunction());
	addObject('parseFloat', new ParseFloatFunction());
	addObject('isNaN', new IsNaNFunction());
	addObject('isFinite', new IsFiniteFunction());
	addObject('decodeURI', new DecodeURIFunction());
	addObject('decodeURIComponent', new DecodeURIComponentFunction());
	addObject('encodeURI', new EncodeURIFunction());
	addObject('encodeURIComponent', new EncodeURIComponentFunction());

	// Types
	addObject('Object', globalObjects.Object);
	addObject('Function', globalObjects.Function);
	addObject('Array', globalObjects.Array);
	addObject('String', globalObjects.String);
	addObject('Boolean', globalObjects.Boolean);
	addObject('Number', globalObjects.Number);
	addObject('Date', globalObjects.Date);
	addObject('RegExp', globalObjects.RegExp);
	addObject('Error', globalObjects.Error);
	addObject('EvalError', globalObjects.EvalError);
	addObject('RangeError', globalObjects.RangeError);
	addObject('ReferenceError', globalObjects.ReferenceError);
	addObject('SyntaxError', globalObjects.SyntaxError);
	addObject('TypeError', globalObjects.TypeError);
	addObject('URIError', globalObjects.URIError);

	// Objects
	addObject('Math', new MathObject());
	addObject('JSON', new JSONObject());
}