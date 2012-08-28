/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @author Allen Yeung &lt;<a href="mailto:ayeung@appcelerator.com">ayeung@appcelerator.com</a>&gt;
 */

var CodeProcessor = require("ti-code-processor"),
	Base = CodeProcessor.Base;

/**
 * @classdesc A Titanium function object type
 *
 * @constructor
 * @extends module:Base.ObjectType
 */
exports.FunctionType = function() {
	Base.ObjectType.call(this, "Function");
}

/**
* Calls the function
* 
* @method
* @returns {module:Base.UnknownType} An unknown type since we don't know the value of a Titanium function
*/
exports.FunctionType.prototype.call = function call(thisVal, args) {
	return new Base.UnknownType();
}
