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
	Runtime = require("../Runtime");

exports.processRule = function(ast) {
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
	// Note: this rule is actually two rules merged into one: literal references to undefined, null, true, false, and 
	// variable references. Each case returns something different. Hopefully that's OK.
	var name = ast[1],
		result;
	if (name === "true" || name === "false") {
		result = new Base.BooleanType();
		result.value = name === "true" ? true : false;
	} else if (name === "undefined") {
		result = new Base.UndefinedType();
	} else if (name === "null") {
		result = new Base.NullType();
	} else {
		var context = Runtime.getCurrentContext();
		result = Context.getIdentifierReference(context.lexicalEnvironment, name, context.strict);
	}
	
	RuleProcessor.fireRuleEvent(ast, {}, true);
	return result;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);