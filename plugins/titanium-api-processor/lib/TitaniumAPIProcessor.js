/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * Processes Titanium APIs for the code processor
 * 
 * @module TitaniumAPIProcessor
 * @author Allen Yeung &lt;<a href="mailto:ayeung@appcelerator.com">ayeung@appcelerator.com</a>&gt;
 */

var fs = require("fs"),
	path = require("path"),
	util = require("util"),
	Messaging,
	Runtime,
	Base,
	APIs = {},
	TiFunctionType;

module.exports = function(CodeProcessor) {
	// TODO: Find the sdk path from code processor instead
	var titaniumSDKPath = "/Library/Application Support/Titanium/mobilesdk/osx/2.1.0.GA/",
		jscaString,
		jscaJSON;
	
	Messaging = CodeProcessor.Messaging;
	Runtime = CodeProcessor.Runtime;
	Base = CodeProcessor.Base;

	TiFunctionType = function TiFunctionType() {
		Base.ObjectType.call(this, "Function");
	};
	util.inherits(TiFunctionType, Base.FunctionTypeBase);

	TiFunctionType.prototype.call = function call(thisVal, args) {
		return new Base.UnknownType();
	};

	TiFunctionType.prototype.constructor = function constructor() {
		return new Base.UnknownType();
	};

	if (!titaniumSDKPath) {
		Messaging.log("error", "Titanium SDK was not provided, could not inject APIs");
		process.exit(1);
	}

	// Read in jsca file as json
	jscaString = fs.readFileSync(path.join(titaniumSDKPath, "api.jsca"), 'utf8'),
	jscaJSON = JSON.parse(jscaString);

	// Start injection process when a "projectProcessingBegin" event is fired from the code processor
	Messaging.on("projectProcessingBegin", function () {

			// Iterate through the json object and inject all the APIs
			var globalObject = Runtime.globalObject,
				typesArray = jscaJSON.types,
				aliasesArray = jscaJSON.aliases,
				aliases = {},
				i = 0,
				name;

			// Create aliases object
			for (; i < aliasesArray.length; i++) {
				aliases[aliasesArray[i].type] = aliasesArray[i].name;
			}

			// Loop through all types and inject them into global object
			for (i = 0; i < typesArray.length; i++) {
				addType(typesArray[i]);
			}
			
			for (name in APIs) {

				// inject children
				injectToCodeProcessor(globalObject, APIs[name], name, aliases[name]);
			}
			
		}
	);
};

/**
 * Creates given type and adds it to the APIs object
 * 
 * @private
 * @method
 * @param {Object} type A type object that contains information about the type (includes name, property, functions etc)
 */
function addType(type) {
	
	var name = type.name.split("."),
		currentNamespace,
		properties = type.properties,
		functions = type.functions,
		i = 0;
	
	// If it's not a type that starts with Titanium, don't inject it
	if (name[0] !== "Titanium") {
		return;
	}

	for (; i < name.length; i++) {
		
		// During the first iteration, add namespace to the global object
		if (i === 0 ) {
			currentNamespace = addNamespace(name[i], APIs);
		} else {
			// Add current namespace as a child of the pervious one
			currentNamespace = addNamespace(name[i], currentNamespace);
		}
	}

	// Add functions
	if (functions) {
		for(i = 0; i < functions.length; i++) {
			processFunction(functions[i], currentNamespace);
		}
	}

	// Add properties
	if (properties) {
		for( i = 0; i < properties.length; i++) {
			processProperty(properties[i], currentNamespace);
		}
	}
}

/**
 * Takes in a node and recursively injects it and its children to the code processor
 * 
 * @private
 * @method
 * @param {module:Base.ObjectType} parent The parent object type that we want to add to
 * @param {Object} node The node that we want to inject into the code processor
 * @param {String} name The current name of the node we want to inject
 * @param {String} alias The alias of the name we are going to inject
 */
function injectToCodeProcessor(parent, node, name, alias) {
	if ( typeof node === "object") {
		var objectType = new Base.ObjectType(),
			propertyName;
		parent.put(name, objectType, false);
		
		if (alias) {
			parent.put(alias, objectType, false);
		}
		
		for (propertyName in node) {
			// inject children
			injectToCodeProcessor(objectType, node[propertyName], propertyName);
		}

	} else if ( node === "function") {
		parent.put(name, new TiFunctionType(), false);
	} else if ( node === "property") {
		parent.put(name, new Base.UnknownType(), false);
	}
	
}

/**
 * Creates and adds a namespace with the given name to the given parent (if it doesn't already exist)
 * 
 * @private
 * @method
 * @param {String} name The name of the namespace to add
 * @param {Object} parent The parent of the given namespace
 * @returns {Object} The namespace object that was added
 */
function addNamespace(name, parent) {
	if (!parent[name]) {
		parent[name] = {};
	}
	return parent[name];
}

/**
 * Processes the given function and adds it as a child of the given parent (if it doesn't already exist)
 * 
 * @private
 * @method
 * @param {Object} func The function object to process
 * @param {String} func.name The name of the function to process
 * @param {Object} parent The parent of the given func
 */
function processFunction(func, parent) {
	var funcName = func.name;
	
	if (!parent[funcName]) {
		parent[funcName] = "function";
	}
}

/**
 * Processes the given property and adds it as a child of the given parent (if it doesn't already exist)
 * 
 * @private
 * @method
 * @param {Object} prop The property object that to process
 * @param {String} prop.name The name of the property to add
 * @param {Object} parent The parent of the given property
 */
function processProperty(prop, parent) {
	var propName = prop.name;	
		
	if (!parent[propName]) {
		parent[propName] = "property";
	}
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
