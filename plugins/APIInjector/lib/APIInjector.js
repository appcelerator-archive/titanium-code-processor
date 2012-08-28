/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * Injects Titanium APIs into ti-code-processor
 * 
 * @module APIIjector
 * @author Allen Yeung &lt;<a href="mailto:ayeung@appcelerator.com">ayeung@appcelerator.com</a>&gt;
 */

var fs = require("fs"),
	path = require("path"),
	util = require("util"),
	Messaging,
	Runtime,
	Base;

module.exports = function(CodeProcessor) {
	Messaging = CodeProcessor.Messaging;
	Runtime = CodeProcessor.Runtime;
	Base = CodeProcessor.Base;
	
	util.inherits(exports.TiFunctionType, Base.FunctionType);

	// Start injection process when a "projectProcessingBegin" event is fired from the code processor
	Messaging.on("projectProcessingBegin", function () {
			// TODO: Find the sdk path from code processor instead
			var titaniumSDKPath = "/Library/Application Support/Titanium/mobilesdk/osx/2.1.0.GA/"	

			if (!titaniumSDKPath) {
				Messaging.log("error", "Titanium SDK was not provided, could not inject APIs");
				process.exit(1);
			}

			// Read in jsca file as json
			var jscaString = fs.readFileSync(path.join(titaniumSDKPath, "api.jsca"), 'utf8');

			var jscaJSON = JSON.parse(jscaString);

			// Iterate through the json object and inject all the APIs
			var typesArray = jscaJSON['types'],
				aliasesArray = jscaJSON['aliases'],
				aliases = {},
				i = 0;

			// Create aliases object
			for (; i < aliasesArray.length; i++) {
				aliases[aliasesArray[i].type] = aliasesArray[i].name;
			}

			// Loop through all types and inject them into global object
			for (i = 0; i < typesArray.length; i++) {
				addType(typesArray[i], aliases);
			}
		}
	);
}

/**
 * Creates given type and adds it to the global object
 * 
 * @private
 * @method
 * @param {Object} type A type object that contains information about the type (includes name, property, functions etc)
 * @param {Object} aliases The aliases associated with the given type (Aliases will be added in parallel with the name property of the type)
 */
function addType(type, aliases) {
	var globalObject = Runtime.globalObject,
		name = type.name.split("."),
	// Only need to keep track of the current alias, since there can only be one top-level alias
		currentNamespace, currentAlias,
		i = 0;
	
	for (; i < name.length; i++) {
		// During the first iteration, add namespace to the global object
		if (i === 0 ) {
			currentNamespace = addNamespace(name[i], globalObject);
			if (aliases[name[i]]) {
				currentAlias = addNamespace(aliases[name[i]], globalObject);
			}
		} else {
			// Add current namespace as a child of the pervious one
			currentNamespace = addNamespace(name[i], currentNamespace);
			if (currentAlias) {
				currentAlias = addNamespace(name[i], currentAlias);
			}
		}
	}
	
	// Add functions
	var functions = type.functions;

	if (functions) {
		for(i = 0; i < functions.length; i++) {
			processFunction(functions[i], currentNamespace);
			if (currentAlias) {
				processProperty(functions[i], currentAlias);
			}
		}
	}
	
	// Add properties
	var properties = type.properties;

	if (properties) {
		for( i = 0; i < properties.length; i++) {
			processProperty(properties[i], currentNamespace);
			if (currentAlias) {
				processProperty(properties[i], currentAlias);
			}
		}
	}
}

/**
 * Creates and adds a namespace with the given name to the given parent (if it doesn't already exist)
 * 
 * @private
 * @method
 * @param {String} name The name of the namespace to add
 * @param {module:Base.ObjectType} parent The parent of the given namespace
 * @returns {module:Base.ObjectType} The namespace object that was added
 */
function addNamespace(name, parent) {
	if (!parent.hasProperty(name)) {
		var objectType = new Base.ObjectType();
		parent.put(name, objectType, false);
		return objectType;
	}
	return parent.get(name);
}

/**
 * Processes the given function and adds it as a child of the given parent (if it doesn't already exist)
 * 
 * @private
 * @method
 * @param {Object} func The function object to process
 * @param {String} func.name The name of the function to process
 * @param {module:Base.ObjectType} parent The parent of the given func
 * @returns {module:Base.ObjectType} The function object that was added
 */
function processFunction(func, parent) {
	var funcName = func.name;
	
	if (!parent.hasProperty(funcName)) {
		parent.put(funcName,  new exports.TiFunctionType, false);
	}
}

/**
 * Processes the given property and adds it as a child of the given parent (if it doesn't already exist)
 * 
 * @private
 * @method
 * @param {Object} prop The property object that to process
 * @param {String} prop.name The name of the property to add
 * @param {module:Base.ObjectType} parent The parent of the given property
 * @returns {module:Base.ObjectType} The property object that was added
 */
function processProperty(prop, parent) {
	var propName = prop.name;	
		
	if (!parent.hasProperty(propName)) {
		parent.put(propName, new Base.UnknownType(), false);
	}
}

/**
 * @classdesc A Titanium function object type
 *
 * @constructor
 * @extends module:Base.ObjectType
 */
exports.TiFunctionType = function() {
	Base.ObjectType.call(this, "Function");
}

/**
* Calls the function
* 
* @method
* @returns {module:Base.UnknownType} An unknown type since the value of Titanium function is unknown
*/
exports.TiFunctionType.prototype.call = function call(thisVal, args) {
	return new Base.UnknownType();
}

/**
* Constructor for TiFunctionType
* 
* @method
* @returns {module:Base.UnknownType} An unknown type since the value of Titanium function is unknown
*/
exports.TiFunctionType.prototype.constructor = function constructor() {
	return new Base.UnknownType();
}

/**
* Gets the results of the plugin
* 
* @private
* @method
* @returns {Object} An empty object.
*/
module.exports.prototype.getResults = function getResults() {
	return {};
};
