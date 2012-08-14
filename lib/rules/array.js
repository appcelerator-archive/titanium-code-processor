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
	
	var elements = ast[1],
		array = new Base.ArrayType(),
		i = 0,
		len = elements.length;
	array.put("length", len, false);
	
	for(; i < len; i++) {
		array.defineOwnProperty(i + "", {
			value: Base.getValue(RuleProcessor.processRule(elements[i])),
			writable: true,
			enumerable: true,
			configurable: true
		}, false);
	}
	
	RuleProcessor.fireRuleEvent(ast, {}, true);
	return array;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);