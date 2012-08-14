/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

var path = require("path"),
	RuleProcessor = require("../RuleProcessor"),
	Base = require("../Base");

exports.processRule = function(ast) {
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
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
		throw new Error("Internal Error: atom of type " + name + " is unrecognized.");
	}
	
	RuleProcessor.fireRuleEvent(ast, {}, true);
	return result;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);