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
	TiFunctionType,
	jscaJSON,
	jscaVersion;

module.exports = function(CodeProcessor) {
	// TODO: Find the sdk path from code processor instead
	var titaniumSDKPath = "/Library/Application Support/Titanium/mobilesdk/osx/2.1.0.GA/",
		jscaString;

	Messaging = CodeProcessor.Messaging;
	Runtime = CodeProcessor.Runtime;
	Base = CodeProcessor.Base;

	TiFunctionType = function TiFunctionType(returnTypeJsca) {
		Base.ObjectType.call(this, "Function");
		this.returnTypeJsca = returnTypeJsca;
	};
	util.inherits(TiFunctionType, Base.FunctionTypeBase);

	TiFunctionType.prototype.call = function call(thisVal, args) {
		var returnTypeJsca = this.returnTypeJsca,
			returnTypeName,
			objectType,
			propertyName,
			returnApi = {},
			i = 1;

		// If returnTypeJsca is undefined, just return undefined
		if (returnTypeJsca) {
			
			if (returnTypeJsca === "unknown") {
				return new Base.UnknownType();
			}
			
			// Convert JSCA type to local tree-like structure
			addType(returnTypeJsca, returnApi, false);
			
			// The first node must be Titanium.  
			// We create an object for the Titanium node, then proceed inject its children to the newly created object
			returnApi = returnApi["Titanium"];
			objectType = new Base.ObjectType();

			for (propertyName in returnApi) {
				inject(objectType, returnApi[propertyName], propertyName, ["Titanium"]);
			}
			
			// After we have constructed the object, go through and update objectType to make sure we are pointing to the right object according to returnTypeName
			returnTypeName = this.returnTypeJsca.name.split(".");
			
			for (; i< returnTypeName.length; i++) {
				objectType = objectType.get(returnTypeName[i]);
			}

			return objectType;
		}

		return new Base.UndefinedType();
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
	jscaVersion = jscaJSON.version;

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

			// Loop through all types construct a tree of all the types
			for (i = 0; i < typesArray.length; i++) {
				addType(typesArray[i], APIs, true);
			}
			
			// Inject the tree that was constructed into the global object
			for (name in APIs) {
				inject(globalObject, APIs[name], name, [], aliases[name]);
			}
		}
	);
};

/**
 * Creates given type and adds it to the parent object
 * 
 * @private
 * @method
 * @param {Object} type A type object that contains information about the type (includes name, property, functions etc)
 * @param {Object} parent The paren that we want to add the type to
 */
function addType(type, parent, skipInternal) {
	
	var name = type.name.split("."),
		properties = type.properties,
		functions = type.functions,
		currentNamespace,
		i = 0;
	
	if (skipInternal && type.isInternal) {
		return;
	}

	for (; i < name.length; i++) {
		// During the first iteration, add namespace to the global object
		if (i === 0 ) {
			currentNamespace = addNamespace(name[i], parent);
		} else {
			// Add current namespace as a child of the pervious one
			currentNamespace = addNamespace(name[i], currentNamespace);
		}
	}

	// Add functions
	if (functions) {
		for(i = 0; i < functions.length; i++) {
			processFunction(functions[i], currentNamespace, functions[i].returnTypes);
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
 * Takes in a node and recursively injects it and its children to the given parent
 * 
 * @private
 * @method
 * @param {module:Base.ObjectType} parent The parent object type that we want to add to
 * @param {Object} node The node that we want to inject into the code processor
 * @param {String} name The current name of the node we want to inject
 * @param {String} alias The alias of the name we are going to inject
 */
function inject(parent, node, name, parentName, alias) {
	var objectType,
		functionType,
		propertyType,
		propertyName,
		fParentName = parentName.slice();

	if ( node.nodeType === "function") {
		parent.put(name, new TiFunctionType(node.returnTypeJsca), false);
	} else if ( node.nodeType === "property") {
		parent.put(name, new Base.UnknownType(), false);
	} else if ( typeof node === "object") {
		objectType = new Base.ObjectType();
		parent.put(name, objectType, false);
		
		if (alias) {
			parent.put(alias, objectType, false);
		}
		
		objectType.on("propertyReferenced", function(data){
			Messaging.fireEvent("titaniumPropertyReferenced", data);
		});
		
		fParentName.push(name);
		
		// inject children
		for (propertyName in node) {
			inject(objectType, node[propertyName], propertyName, fParentName);
		}
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
function processFunction(func, parent, returnTypes) {
	var funcName = func.name,
		jsca,
		returnType;
	
	if (func.isInternal) {
		return;
	}
	
	// If the returnTypes are undefined, leave jsca as undefined
	if (returnTypes) {
		returnType = returnTypes[0].type;
		if (returnTypes.length === 1 && !isPrimitiveType(returnType)) {
			jsca = findTypeByName(returnType);
		} else {
			// mark jsca as unknown when it's a primitive type or there is more than one return type
			jsca = "unknown";
		}
	}

	if (!parent[funcName]) {
		parent[funcName] = { nodeType: "function", returnTypeJsca: jsca};
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
	
	if (prop.isInternal) {
		return;
	}
	
	if (!parent[propName]) {
		parent[propName] = { nodeType: "property" };
	}
}

function findTypeByName(name) {
	var	typesArray = jscaJSON.types,
		i;
	
	for (i = 0; i < typesArray.length; i++) {
		if (typesArray[i].name === name) {
			return typesArray[i];
		}
	}
}

function isPrimitiveType(type) {
	return (type === "Number" || type === "Boolean" || type === "String" || type === "Array");
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
