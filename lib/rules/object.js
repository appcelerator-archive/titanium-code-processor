/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

var path = require("path"),
	RuleProcessor = require("../RuleProcessor"),
	Base = require("../Base"),
	Runtime = require("../Runtime"),
	Exceptions = require("../Exceptions");

exports.processRule = function(ast) {
	RuleProcessor.fireRuleEvent(ast, {}, false);
	
	var obj = new Base.ObjectType(),
		i = 0,
		len = ast[1].length,
		prop,
		propId,
		previous,
		exprValue,
		context = Runtime.getCurrentContext();
	for(; i < len; i++) {
		prop = ast[1][i];
		
		if (context.strict && (prop[0] === "eval" || prop[1] === "arguments")) {
			throw new Exceptions.SyntaxError();
		}
		if (prop[2]) {
			throw new Error("IMPLEMENT ME");
		} else {
			propId = {
				value: RuleProcessor.processRule(prop[1]),
				writable: true,
				enumerable: true,
				configurable: true
			};
		}
		previous = obj.getOwnProperty(propId.name);
		if (previous && (context.strict && Base.isDataDescriptor(previous)) || 
				(Base.isDataDescriptor(previous) && Base.isAccessorDescriptor(propId)) || 
				(Base.isAccessorDescriptor(previous) && Base.isDataDescriptor(propId)) ||
				(Base.isAccessorDescriptor(previous) && Base.isAccessorDescriptor(propId)) && 
					(previous.get && propId.get || previous.set && propId.set)) {
			throw new Exceptions.SyntaxError();
		}
		obj.defineOwnProperty(prop[0], propId, false);
	}
	
	RuleProcessor.fireRuleEvent(ast, {}, true);
	return obj;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);