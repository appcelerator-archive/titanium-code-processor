/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Base class for all nodes, really just provides a sanity check
 *
 * @module rules/AST_Toplevel
 */

var AST = require('../AST');

AST.registerRuleProcessor('AST_Node', function processRule() {
	throw new Error('Internal Error: process rule function not defined for AST node type "' + this.TYPE + '"');
});