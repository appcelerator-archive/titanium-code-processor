/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @module Program
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

exports.processProgramRule = function(code) {
	// TODO: temporary validation check to make sure we fully understand UglifyJS' data structures. Remove once validated
	if (code.length !== 2 || code[0] !== "toplevel" || (code[1].constructor !== Array)) {
		throw new Error("Internal Error: unrecognized tree");
	}
}
require("../RuleProcessor").registerRuleProcessor("toplevel", exports.processProgramRule);