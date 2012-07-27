/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

var path = require("path"),
	RuleProcessor = require("../RuleProcessor"),
	Context = require("../Context"),
	Runtime = require("../Runtime");

exports.processRule = function(ast) {
	
	RuleProcessor.fireRuleEvent(ast, {});
	
	// If the file contains no text, then length is 0 and we don't need to process it
	if (ast[1].length) {
	
		// Create the context, checking for strict mode
		var children = ast[1],
			strict = children[0][0].name === "directive" && children[0][1] === "use strict",
			context = Context.createGlobalContext(ast, strict),
			i = strict ? 1 : 0, 
			len = children.length;
		Runtime.contextStack.push(context);
		
		// Evaluate the children
		for(; i < len; i++) {
			RuleProcessor.processRule(children[i]);
		}
	}
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);