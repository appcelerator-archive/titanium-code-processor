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
	
	var children = ast[1],
		i = 0,
		len = children.length,
		context;
	for(; i < len; i++) {
		if (children[i][1]) {
			context = Runtime.getCurrentContext();
			Base.putValue(Context.getIdentifierReference(context.lexicalEnvironment, children[i][0], context.strict), 
				Base.getValue(RuleProcessor.processRule(children[i][1])));
		}
	}
	
	RuleProcessor.fireRuleEvent(ast, {}, true);
	return ["normal", undefined, undefined];
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);