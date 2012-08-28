/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * Injects Titanium APIs into ti-code-processor
 * 
 * @author Allen Yeung &lt;<a href="mailto:ayeung@appcelerator.com">ayeung@appcelerator.com</a>&gt;
 */

var fs = require("fs"),
	path = require("path"),
	Messaging,
	Runtime,
	Base,
	Titanium = require("./Titanium");

module.exports = function(CodeProcessor) {
	Messaging = CodeProcessor.Messaging;
	Runtime = CodeProcessor.Runtime;
	Base = CodeProcessor.Base;
	
	// Start injection process when we get the "projectProcessingBegin" event from code processor.
	Messaging.on("projectProcessingBegin", ApiInjector);
}

/**
 * The main function to perform the API injection.
 */
var ApiInjector =  function () {	
	
	// FIXME Find the sdk path from code processor instead
	var titaniumSDKPath = "/Library/Application Support/Titanium/mobilesdk/osx/2.1.0.GA/"	
	
	if (!titaniumSDKPath) {
		Messaging.log("error", "Titanium SDK was not provided, could not inject APIs", "(ti-api-injector)");
		process.exit(1);
	}
	
	// Read in jsca file as json
	var jscaString = fs.readFileSync(path.join(titaniumSDKPath, "api.jsca"), 'utf8', function(err){
		if (err) {
			Messaging.log("error", "Could not open file: " + err, "(ti-api-injector)");
			process.exit(1);
		}
	});
	
	var jscaJSON = JSON.parse(jscaString);

	// Iterate through the json object and inject all the APIs
	var typesArray = jscaJSON['types'],
		aliasesArray = jscaJSON['aliases'],
		aliases = {},
		i = 0;
		
	// Create aliases object
	for (i = 0; i < aliasesArray.length; i++) {
		aliases[aliasesArray[i].type] = aliasesArray[i].name;
	}
	
	// Loop through all types and inject them into global object
	for (i = 0; i < typesArray.length; i++) {
		addType(typesArray[i], aliases);
	}

};

/**
 * @private
**/

/**
 * Creates given type and adds it to the global object
 * 
 * @param type A type object that contains information about the type (includes name, property, functions etc)
 * @param aliases The aliases associated with the given type (Aliases will be added in parallel with the name property of the type)
 */
function addType(type, aliases) {
	var globalObject = Runtime.globalObject;
	var name = type.name.split(".");
	// We only need to keep track of the current alias, since there can only one top-level alias
	var currentNamespace, currentAlias;
	var i =0;
	
	for (i = 0; i < name.length; i++) {
		// During the first iteration, add namespace to the global object
		if (i ==0 ) {
			currentNamespace = addNamespace(name[i], globalObject);
			if (aliases[name[i]]) {
				currentAlias = addNamespace(aliases[name[i]], globalObject);
			}
			continue;
		}
		// Add current namespace as a child of the pervious one
		currentNamespace = addNamespace(name[i], currentNamespace);
		if (currentAlias) {
			currentAlias = addNamespace(name[i], currentAlias);
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
 * @param name The name of the namespace we want to add
 * @param parent The parent of the given namespace
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
 * @param func The function object that we want to process
 * @param parent The parent of the given func
 */
function processFunction(func, parent) {
	var funcName = func.name;
	
	if (!parent.hasProperty(funcName)) {
		parent.put(funcName,  new Titanium.FunctionType(), false);
	}
}

/**
 * Processes the given property and adds it as a child of the given parent (if it doesn't already exist)
 * 
 * @param prop The property object that we want to process
 * @param parent The parent of the given property
 */
function processProperty(prop, parent) {
	var propName = prop.name;	
		
	if (!parent.hasProperty(propName)) {
		parent.put(propName, new Base.UnknownType(), false);
	}
}

/**
* Gets the results of the plugin
* 
* @method
* @returns {Object} A dictionary with two array properties: <code>resolved</code> and <code>unresolved</code>. The
*		<code>resolved</code> array contains a list of resolved absolute paths to files that were required. The
*		<code>unresolved</code> array contains a list of unresolved paths, as passed in to the <code>require()</code>
*		method.
*/
module.exports.prototype.getResults = function getResults() {
	return {};
};
