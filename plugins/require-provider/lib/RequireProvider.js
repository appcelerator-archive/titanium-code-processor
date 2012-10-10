/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @module plugins/RequireProvider
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

var util = require("util"),
	path = require("path"),
	fs = require("fs"),
	Base = require(path.join(global.nodeCodeProcessorLibDir, "Base")),
	Runtime = require(path.join(global.nodeCodeProcessorLibDir, "Runtime")),
	CodeProcessor = require(path.join(global.nodeCodeProcessorLibDir, "CodeProcessor")),
	pluginRegExp = /^(.+?)\!(.*)$/,
	fileRegExp = /\.js$/;


/**
 * Creates an instance of the require provider plugin
 * 
 * @classdesc Provides a CommonJS compliant require() implementation, based on Titanium Mobile's implementations
 * 
 * @constructor
 * @name module:plugins/RequireProvider
 */
module.exports = function () {};

/**
 * Performs the function call that requires/includes a file
 * 
 * @method
 * @param {Array[{@link module:Base.BaseType}]} args The set of arguments passed in to the function call
 * @param {Boolean} useCurrentContext Indicates whether this operation should use the current contect or create a new one
 */
module.exports.callHelper = callHelper;
function callHelper(args, isInclude) {
	
	// Validate and parse the args
	var name = args && Base.getValue(args[0]),
		result = new Base.UnknownType(),
		isModule,
		eventDescription;
		
	if (!name) {
		name = new Base.UndefinedType();
	}
	
	if (Base.type(name) === "Unknown") {
		
		eventDescription = "A value that could not be evaluated was passed to require";
		Runtime.fireEvent("requireUnresolved", eventDescription, {
			name: "<Could not evaluate require path>"
		});
		Runtime.reportWarning("requireUnresolved", eventDescription, {
			name: "<Could not evaluate require path>"
		});
		return result;
	}
	
	name = Base.toString(name).value;
	
	// We don't process plugins or urls at compile time
	if (pluginRegExp.test(name) || name.indexOf(":") !== -1) {
		Runtime.fireEvent("requireUnresolved", 
			"Plugins and URLS can not be evaluated at compile-time and will be deferred to runtime.", {
				name: name
			});
	} else {
		
		// Resolve the path
		isModule = name[0] !== "/" && !name.match(fileRegExp);
		name = path.resolve(path.join(path.dirname(name[0] !== "." ? Runtime.getEntryPointFile() : Runtime.getCurrentFile()), name));
		name += isModule ? ".js" : "";
				
		// Make sure that the file exists and then process it
		if (fs.existsSync(name)) {
			
			Runtime.fireEvent("requireResolved", "The require path '" + name + "' was resolved", {
				name: name
			});
			result = CodeProcessor.processFile(name, isModule, isInclude);
			if (!isInclude) {
				result = result[1];
			}
			
		} else {
			eventDescription = "The require path '" + name + "' was resolved";
			Runtime.fireEvent("requireMissing", eventDescription, {
				name: name
			});
			Runtime.reportError("requireMissing", eventDescription, {
				name: name
			});
		}
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
 * @param {Array[{@link module:Base.BaseType}]} args The set of arguments passed in to the function call
 * @returns {module:Base.BaseType} The return value from the function
 * @see ECMA-262 Spec Chapter 13.2.1
 */
RequireFunction.prototype.call = function call(thisVal, args) {
	return callHelper(args, false);
};

/**
 * Initializes the plugin
 * 
 * @method
 * @name module:plugins/RequireProvider#init
 */
module.exports.prototype.init = function init() {
	
	var globalEnvironmentRecord = Runtime.getGlobalContext().lexicalEnvironment.envRec,
		tiobj;
	
	// Create the require method
	globalEnvironmentRecord.createMutableBinding("require", false, true);
	globalEnvironmentRecord.setMutableBinding("require", new RequireFunction(), false, true);
};

/**
* Gets the results of the plugin
* 
* @method
 * @name module:plugins/RequireProvider#getResults
* @returns {Object} An empty object.
*/
module.exports.prototype.getResults = function getResults() {
	return {};
};