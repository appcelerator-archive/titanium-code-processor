/*****************************************
 *
 * Function Constructor
 *
 *****************************************/

/*global

util
AST
Runtime

FunctionTypeBase
areAnyUnknown
UnknownType
prototypes
StringType
toString
handleRecoverableNativeException
FunctionType
RuleProcessor
*/

/**
 * Function constructor function
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.3
 */
function FunctionConstructor(className) {
	FunctionTypeBase.call(this, 1, false, className || 'Function');
	
	this.defineOwnProperty('prototype', {
		value: prototypes.Function
	}, false, true);
}
util.inherits(FunctionConstructor, FunctionTypeBase);
FunctionConstructor.prototype.call = function call(thisVal, args) {
	return FunctionConstructor.prototype.construct.call(this, args);
};
FunctionConstructor.prototype.construct = function call(args) {
	
	// Variable declarations
	var argCount = args.length,
		p = '',
		body,
		k = 1;
	
	// Validate the parameters
	if (areAnyUnknown(args)) {
		return new UnknownType();
	}
	
	// Step 3
	if (argCount === 0) {
		body = new StringType();

	// Step 4
	} else if (argCount === 1) {
		body = args[0];
		
	// Step 5
	} else if (argCount > 1) {
		p = toString(args[0]).value;
		while (k < argCount - 1) {
			p += ',' + toString(args[k]).value;
			k++;
		}
		body = args[k];
	}
	
	// Step 6
	body = toString(body).value;
	
	// Step 7
	p = AST.parseString('function temp(' + p + '){}');
	if (!p) {
		handleRecoverableNativeException('SyntaxError');
		return new UnknownType();
	}
	p = p[1][0][2];
	
	// Step 8
	body = AST.parseString('function temp(){' + body + '}');
	if (!body) {
		handleRecoverableNativeException('SyntaxError');
		return new UnknownType();
	}
	body = body[1][0][3];
	
	// Step 10
	return new FunctionType(p, body, Runtime.getModuleContext().lexicalEnvironment, RuleProcessor.isBlockStrict(body));
};