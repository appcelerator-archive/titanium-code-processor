/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @module RequireProvider
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

var util = require("util"),
	path = require("path"),
	Exceptions,
	Base,
	Messaging,
	Runtime,
	pluginRegExp = /^(.+?)\!(.*)$/,
	fileRegExp = /\.js$/;

/**
 * @classdesc Customized require() function that doesn't actually execute code in the interpreter, but rather does it here.
 * 
 * @constructor
 * @private
 * @param {String} [className] The name of the class, defaults to "Function." This parameter should only be used by a 
 *		constructor for an object extending this one.
 */
function RequireFunction(className) {
	CodeProcessor.Base.ObjectType.call(this, className || "Function");
}
util.inherits(RequireFunction, CodeProcessor.Context.FunctionType);

/**
 * Calls the require function
 * 
 * @method
 * @param {module:Base.BaseType} thisVal The value of <code>this</code> of the function
 * @param (Array[{@link module:Base.BaseType}]} args The set of arguments passed in to the function call
 * @returns {module:Base.BaseType} The return value from the function
 * @see ECMA-262 Spec Chapter 13.2.1
 */
RequireFunction.prototype.call = function call(thisVal, args) {
	
	// Validate and parse the args
	var name = args && Base.getValue(args[0]),
		result,
		isModule;
	if (!name || Base.type(name) !== "String") {
		throw new Exceptions.TypeError("Invalid require path '" + args[0] + "'");
	}
	name = name.value;
	
	// We don't process plugins or urls at compile time
	if (pluginRegExp.test(name) || name.indexOf(":") !== -1) {
		result = new Base.UnknownType();
		Messaging.fireEvent("requireNotProcessed", {
			name: name
		});
	} else {
		
		// Resolve the path
		isModule = name[0] !== "/" && !name.match(fileRegExp);
		name = path.resolve(path.join(path.dirname(name[0] !== "." ? Runtime.fileStack[0] : Runtime.getCurrentFile()), name));
		name += isModule ? ".js" : "";
		
		// Process the file
		result = CodeProcessor.processFile(name, isModule);
		Messaging.fireEvent("requireProcessed", {
			name: name
		});
	}
	if (!result) {
		result = new Base.UndefinedType();
	}
	return result;
};

/**
 * Creates an instance of the require provider plugin
 * 
 * @classdesc Provides a CommonJS compliant require() implementation, based on Titanium Mobile's implementations
 * 
 * @constructor
 * @param {Object} libs A dictionary containing useful libs from {@link module:CodeProcessor} so they don't have to be
 *		required()'d individually using brittle hard-coded paths.
 */
module.exports = function (libs) {
	
	// Store the code processor methods we need
	Exceptions = libs.Exceptions;
	Base = libs.Base;
	Messaging = libs.Messaging;
	Runtime = libs.Runtime;
	
	// Inject the require method
	CodeProcessor.Messaging.on("projectProcessingBegin", function () {
		var globalEnvironmentRecord = CodeProcessor.Runtime.globalContext.lexicalEnvironment.envRec;
		globalEnvironmentRecord.createMutableBinding("require", false);
		globalEnvironmentRecord.setMutableBinding("require", new RequireFunction(), false);
	});
};