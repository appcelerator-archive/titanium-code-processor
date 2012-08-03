/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

var path = require("path"),
	RuleProcessor = require("../RuleProcessor"),
	Base = require("../Base"),
	Context = require("../Context"),
	Runtime = require("../Runtime"),
	Exceptions = require("../Exceptions");

exports.processRule = function(ast) {
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
	var context = Runtime.getCurrentContext(),
		ref,
		result,
		func,
		args = [],
		i, len,
		thisValue;
	if (ast[1][0] === "name") {
		var ref = Context.getIdentifierReference(context.lexicalEnvironment, ast[1][1], context.strict);
		func = Base.getValue(ref);
		
		// Make sure this is a function
		if (Base.type(func) !== "Function" || !Base.isCallable(func)) {
			throw new Exceptions.TypeError();
		}
		
		// Determine the this value
		if (Base.type(ref) === "Reference") {
			thisValue = Base.getBase(ref);
			if (!Base.isPropertyReference(ref)) {
				thisValue = thisValue.implicitThisValue();
			}
		} else {
			thisValue = new Base.UndefinedType();
		}
		
		// Process the arguments
		for(i = 0, len = ast[2].length; i < len; i++) {
			args.push(Base.getValue(RuleProcessor.processRule(ast[2][i])));
		}
		
	} else if (ast[1][0] === "dot") {
		throw new Error("IMPLEMENT ME");
	} else {
		throw new Error("Internal Error: Unsupported call reference type '" + ast[1][0] + "'");
	}
	
	result = func.call(thisValue, args);
	
	RuleProcessor.fireRuleEvent(ast, {}, true);
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);