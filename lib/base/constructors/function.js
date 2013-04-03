/*global
util,
AST,
Runtime,
FunctionTypeBase,
areAnyUnknown,
UnknownType,
prototypes,
StringType,
toString,
handleRecoverableNativeException,
FunctionType,
RuleProcessor,
wrapNativeCall
*/

/*****************************************
 *
 * Function Constructor
 *
 *****************************************/

/**
 * Function constructor function
 *
 * @private
 * @see ECMA-262 Spec Chapter 15.3
 */
function FunctionConstructor(className) {
	FunctionTypeBase.call(this, 1, className || 'Function');

	this.defineOwnProperty('prototype', {
		value: prototypes.Function
	}, false, true);
}
util.inherits(FunctionConstructor, FunctionTypeBase);
FunctionConstructor.prototype.callFunction = wrapNativeCall(function callFunction(thisVal, args) {
	return FunctionConstructor.prototype.construct.call(this, args);
});
FunctionConstructor.prototype.construct = wrapNativeCall(function construct(args) {

	// Variable declarations
	var argCount = args.length,
		p = '',
		body,
		k = 1,
		i;

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
	if (p.syntaxError) {
		handleRecoverableNativeException('SyntaxError', p.message);
		return new UnknownType();
	}
	p = p.body[0].argnames;
	for (i = 0; i < p.length; i++) {
		p[i] = p[i].name;
	}

	// Step 8
	body = AST.parseString('function temp(){' + body + '}');
	if (body.syntaxError) {
		handleRecoverableNativeException('SyntaxError', p.message);
		return new UnknownType();
	}
	body = body.body[0];

	// Step 10
	return new FunctionType(p, body, Runtime.getModuleContext().lexicalEnvironment, RuleProcessor.isBlockStrict(body));
}, true);