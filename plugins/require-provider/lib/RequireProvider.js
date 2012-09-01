/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @module RequireProvider
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

// ******** Plugin API Methods ********

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
	var util = require("util"),
		path = require("path"),
		fs = require("fs"),
		Exceptions = libs.Exceptions,
		Base = libs.Base,
		Messaging = libs.Messaging,
		Runtime = libs.Runtime,
		processFile = libs.processFile,
		pluginRegExp = /^(.+?)\!(.*)$/,
		fileRegExp = /\.js$/;
	
		function callHelper(args, useCurrentContext) {
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
				Messaging.fireEvent("requireUnresolved", {
					name: name
				});
			} else {
		
				// Resolve the path
				isModule = name[0] !== "/" && !name.match(fileRegExp);
				name = path.resolve(path.join(path.dirname(name[0] !== "." ? Runtime.fileStack[0] : Runtime.getCurrentFile()), name));
				name += isModule ? ".js" : "";
				
				// Make sure that the file exists and then process it
				if (fs.existsSync(name)) {
					
					Messaging.fireEvent("requireResolved", {
						name: name
					});
					result = processFile(name, isModule, useCurrentContext)[1];
					
				} else {
					Messaging.log("warn", (useCurrentContext ? "Ti.include()'d" : "Require()'d") + " file '" + name + "' does not exist");
					Messaging.fireEvent("requireMissing", {
						name: name
					});
				}
			}
			if (!result) {
				result = new Base.UndefinedType();
			}
			return result;
		}
	
	/**
	 * @classdesc Customized require() function that doesn't actually execute code in the interpreter, but rather does it here.
	 * 
	 * @constructor
	 * @private
	 * @param {String} [className] The name of the class, defaults to "Function." This parameter should only be used by a 
	 *		constructor for an object extending this one.
	 */
	function RequireFunction(className) {
		Base.ObjectType.call(this, className || "Function");
	}
	util.inherits(RequireFunction, Base.FunctionType);

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
		return callHelper(args, false);
	};
	
	/**
	 * @classdesc Customized require() function that doesn't actually execute code in the interpreter, but rather does it here.
	 * 
	 * @constructor
	 * @private
	 * @param {String} [className] The name of the class, defaults to "Function." This parameter should only be used by a 
	 *		constructor for an object extending this one.
	 */
	function IncludeFunction(className) {
		Base.ObjectType.call(this, className || "Function");
	}
	util.inherits(IncludeFunction, Base.FunctionType);

	/**
	 * Calls the require function
	 * 
	 * @method
	 * @param {module:Base.BaseType} thisVal The value of <code>this</code> of the function
	 * @param (Array[{@link module:Base.BaseType}]} args The set of arguments passed in to the function call
	 * @returns {module:Base.BaseType} The return value from the function
	 * @see ECMA-262 Spec Chapter 13.2.1
	 */
	IncludeFunction.prototype.call = function call(thisVal, args) {
		return callHelper(args, true);
	};
	
	// Inject the require method
	Messaging.on("projectProcessingBegin", function () {
		var globalEnvironmentRecord = Runtime.globalContext.lexicalEnvironment.envRec,
			tiobj;
		
		// Create the require method
		globalEnvironmentRecord.createMutableBinding("require", false, true);
		globalEnvironmentRecord.setMutableBinding("require", new RequireFunction(), false, true);
		
		// Create the Ti.Include method
		if (globalEnvironmentRecord.hasBinding("Ti")) {
			tiobj = globalEnvironmentRecord.getBindingValue("Ti");
		} else {
			tiobj = new Base.ObjectType();
			globalEnvironmentRecord.createMutableBinding("Ti", false, true);
			globalEnvironmentRecord.setMutableBinding("Ti", tiobj, false, true);
			globalEnvironmentRecord.createMutableBinding("Titanium", false, true);
			globalEnvironmentRecord.setMutableBinding("Titanium", tiobj, false, true);			
		}
		tiobj.put("include", new IncludeFunction(), false, true);
	});
};

/**
* Gets the results of the plugin
* 
* @method
* @returns {Object} An empty object.
*/
module.exports.prototype.getResults = function getResults() {
	return {};
};