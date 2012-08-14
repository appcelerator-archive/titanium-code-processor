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
	
	var input = Base.getValue(RuleProcessor.processRule(ast[1])),
		result,
		a = ast[2],
		b,
		defaultClause,
		c,
		r,
		v,
		cIndex = 0,
		i = 0, len = a.length,
		searching = true,
		found = false,
		foundInB = false,
		clauseSelector;
	
	// Find the default case and slice the cases up to match the actual ECMA spec rules
	for(; i < len; i++) {
		if (!a[i][0]) {
			defaultClause = a[i];
			b = a.slice(i + 1);
			a = a.slice(0,i);
			break;
		}
	}
	
	if (defaultClause) {
		returnLoop:
		while(true) {
			// Step 5
			aLoop:
			while(true) {
				c = a[cIndex++];
				if (!c) {
					break aLoop;
				}
				if (!found) {
					clauseSelector = Base.getValue(RuleProcessor.processRule(c[0]));
					if (input.value === clauseSelector.value) {
						found = true;
					}
				}
				if (found && c[1]) {
					for(i = 0, len = c[1].length; i < len; i++) {
						r = RuleProcessor.processRule(c[1][i]);
						if (r[1]) {
							v = r[1];
						}
						if (r[0] !== "normal") {
							result = [r[0], v, r[2]];
							break returnLoop;
						}
					}
				}
			}
			// Step 7
			cIndex = 0;
			if (!found) {
				bLoop:
				while(!foundInB) {
					c = b[cIndex++];
					if (!c) {
						break bLoop;
					}
					clauseSelector = Base.getValue(RuleProcessor.processRule(c[0]));
					if (input.value === clauseSelector.value) {
						foundInB = true;
						if (c[1]) {
							for(i = 0, len = c[1].length; i < len; i++) {
								r = RuleProcessor.processRule(c[1][i]);
								if (r[1]) {
									v = r[1];
								}
								if (r[0] !== "normal") {
									result = [r[0], v, r[2]];
									break returnLoop;
								}
							}
						}
					}
				}
			}
			// Step 8
			if (!foundInB && defaultClause[1]) {
				for(i = 0, len = defaultClause[1].length; i < len; i++) {
					r = RuleProcessor.processRule(defaultClause[1][i]);
					if (r[1]) {
						v = r[1];
					}
					if (r[0] !== "normal") {
						result = [r[0], v, r[2]];
						break returnLoop;
					}
				}
			}
			// Step 9
			while(true) {
				c = b[cIndex++];
				if (!c) {
					result = ["normal", undefined, undefined];
					break returnLoop;
				}
				if (c[1]) {
					for(i = 0, len = c[1].length; i < len; i++) {
						r = RuleProcessor.processRule(c[1][i]);
						if (r[1]) {
							v = r[1];
						}
						if (r[0] !== "normal") {
							result = [r[0], v, r[2]];
							break returnLoop;
						}
					}
				}
			}
			break returnLoop;
		}
		
	} else {
		caseLoop:
		while(true) {
			c = a[cIndex++];
			if (searching) {
				if (!c) {
					result = ["normal", v, undefined];
					break caseLoop;
				}
				clauseSelector = Base.getValue(RuleProcessor.processRule(c[0]));
				if (input.value === clauseSelector.value) {
					searching = false;
					for(i = 0, len = c[1].length; i < len; i++) {
						r = RuleProcessor.processRule(c[1][i]);
						if (r[0] !== "normal") {
							result = r;
							break caseLoop;
						}
						v = r[1];
					}
				}
			} else {
				if (c[1]) {
					for(i = 0, len = c[1].length; i < len; i++) {
						r = RuleProcessor.processRule(c[1][i]);
						if (r[1]) {
							v = r[1];
						}
						if (r[0] !== "normal") {
							result = [r[0], v, r[2]];
							break caseLoop;
						}
					}
				}
			}
		}
	}
		
	if (result[0] === "break" && (!result[2] || ast[0].label === result[2])) {
		result = ["normal", result[1], undefined];
	}
	
	RuleProcessor.fireRuleEvent(ast, {}, true);
	
	return result;
};
RuleProcessor.registerRuleProcessor(path.basename(__filename, ".js"), exports);