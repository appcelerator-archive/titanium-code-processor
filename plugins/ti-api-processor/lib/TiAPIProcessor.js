/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Processes Titanium APIs for the code processor
 *
 * @module plugin/TiAPIProcessor
 * @author Allen Yeung &lt;<a href="mailto:ayeung@appcelerator.com">ayeung@appcelerator.com</a>&gt;
 */

var fs = require("fs"),
	path = require("path"),
	util = require("util"),
	
	Base = require(path.join(global.nodeCodeProcessorLibDir, "Base")),
	Runtime = require(path.join(global.nodeCodeProcessorLibDir, "Runtime")),
	CodeProcessor = require(path.join(global.nodeCodeProcessorLibDir, "CodeProcessor")),	
	
	apis = {},
	jscaJSON;

// ******** Plugin API Methods ********

/**
 * Creates an instance of the ti api processor plugin
 * 
 * @classdesc Injects a stub of the Titanium Mobile API into the global namespace
 * 
 * @constructor
 */
module.exports = function(cli) {
	jscaJSON = JSON.parse(fs.readFileSync(path.join(cli.env.sdk, "api.jsca")));
};

/**
 * Initializes the plugin
 * 
 * @method
 */
module.exports.prototype.init = function init() {
	
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

	// Loop through all types and construct a tree of all the types
	for (i = 0; i < typesArray.length; i++) {
		addType(typesArray[i], apis, true);
	}

	// Inject the tree that was constructed into the global object
	for (name in apis) {
		inject(globalObject, apis[name], name, [], aliases[name]);
	}
};

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

// ******** Titanium Namespace Function ********

/**
 * @classdesc Customized require() function that doesn't actually execute code in the interpreter, but rather does it here.
 * 
 * @constructor
 * @private
 * @param {String} [className] The name of the class, defaults to "Function." This parameter should only be used by a 
 *		constructor for an object extending this one.
 */
function TiFunctionType(returnTypeJsca, fullFuncName, className) {
	Base.ObjectType.call(this, className || "Function");
	this.returnTypeJsca = returnTypeJsca;
	this.fullFuncName = fullFuncName;
}
util.inherits(TiFunctionType, Base.FunctionTypeBase);

/**
 * Calls the function
 * 
 * @method
 * @param {module:Base.BaseType} thisVal The value of <code>this</code> of the function
 * @param (Array[{@link module:Base.BaseType}]} args The set of arguments passed in to the function call
 * @returns {module:Base.BaseType} The return value from the function
 * @see ECMA-262 Spec Chapter 13.2.1
 */
TiFunctionType.prototype.call = function call(thisVal, args) {
	var returnTypeJsca = this.returnTypeJsca,
		returnTypeName,
		funcRootNameArray = this.fullFuncName.slice(0, this.fullFuncName.length - 1),
		funcName = this.fullFuncName[this.fullFuncName.length - 1],
		objectType,
		propertyName,
		parentType,
		returnApi = {},
		i = 0,
		result,
		injectResult;

	if (returnTypeJsca) {

		if (returnTypeJsca === "unknown") {
			return new Base.UnknownType();
		}

		// Convert JSCA type to local tree-like structure
		addType(returnTypeJsca, returnApi, false);

		objectType = new Base.ObjectType();
		// Set returnTypeName so we can use it for 'create' methods below
		returnTypeName = returnTypeJsca.name.split(".");

		// The first node must be Titanium. Create an object for the Titanium node, then proceed to inject its children to the newly created object
		for (propertyName in returnApi.Titanium) {
			injectResult = inject(objectType, returnApi.Titanium[propertyName], propertyName, ["Titanium"], undefined, returnTypeJsca.name);
			// Set result only if it's undefined
			if (!result) {
				result = injectResult;
			}
		}
	}

	// When the function name is applyProperties, we want to fire a propertyReferenced event
	if (funcName.match(/^create|^applyProperties$/) && args.length > 0) {

		// applyProperties does not go through the logic above, so we have to construct the returnApi tree here.
		if (funcName === "applyProperties") {
			parentType = findTypeByName(funcRootNameArray.join('.'));
			if (parentType) {
				// Convert JSCA type to local tree-like structure
				addType(parentType, returnApi, false);
			}
		}

		// Move returnApi to the correct child.
		for (i = 0; i < funcRootNameArray.length; i++) {
			returnApi = returnApi[funcRootNameArray[i]];
		}

		// Loop through all the properties of an object argument, and fire off property referenced events for each property.
		for (propertyName in args[0]._properties) {
			// Use the returnTypeName as parentName when there is one (there should be one in create functions)
			reportPropertyReferenced(propertyName, returnTypeName ? returnTypeName : funcRootNameArray, returnApi);
		}
	}

	return result ? result : new Base.UndefinedType();
};

/**
 * addEventListener method
 * 
 * @private
 */
function AddEventListenerFunc(className) {
	Base.ObjectType.call(this, className || "Function");
	this.put("length", new Base.NumberType(2), false, true);
}
util.inherits(AddEventListenerFunc, Base.FunctionTypeBase);
AddEventListenerFunc.prototype.call = function call(thisVal, args) {

	debugger;
	var func = args[1],
		eventDescription,
		eventData,
		result;
	
	if (++Runtime.recursionCount === Runtime.options.maxRecursionLimit) {
		
		// Fire an event and report a warning
		eventDescription = "Maximum application recursion limit of " + Runtime.options.maxRecursionLimit + 
			" reached, could not fully process code";
		eventData = {
			ruleName: "call"
		};
		Runtime.fireEvent("maxRecusionLimitReached", eventDescription, eventData);
		Runtime.reportWarning("maxRecusionLimitReached", eventDescription, eventData);
			
		// Set the result to unknown
		result = new Base.UnknownType();
		
	} else {
		
		// Make sure func is actually a function
		if (Base.type(func) !== "Unknown") {
			if (func.className !== "Function" || !Base.isCallable(func)) {
				throw new Exceptions.TypeError();
			}
			
			// Call the function, discarding the result
			Runtime.ambiguousCode++;
			func.call(new Base.UndefinedType(), args);
			Runtime.ambiguousCode--;
			result = new Base.UndefinedType();
		} else {
			result = new Base.UnknownType();
		}
	}
	Runtime.recursionCount--;
	
	return result;
};

// ******** Helper Methods ********

/**
 * Creates given type and adds it to the parent object
 *
 * @private
 * @method
 * @param {Object} type A type object that contains information about the type (includes name, property, functions etc)
 * @param {Object} parent The parent that we want to add the type to
 * @param {Object} skipInternal A flag to determine whether to skip internal properties
 */
function addType(type, parent, skipInternal) {

	var name = type.name.split("."),
		properties = type.properties,
		functions = type.functions,
		currentNamespace,
		i = 0,
		typeDeprecated;

	if (skipInternal && type.isInternal) {
		return;
	}

	for (; i < name.length; i++) {

		/* Only set the deprecated property if it's the last node in the namespace.
		 * For example, in Titanium.UI, we only want to add the deprecation flag on UI, not Titanium.
		 * Otherwise, we would report the deprecation incorrectly later on. 
		 */
		if (i === name.length - 1) {
			typeDeprecated = type.deprecated;
		}

		// During the first iteration, add namespace to the global object
		if (i === 0) {
			currentNamespace = addNamespace(name[i], parent, typeDeprecated);
		} else {
			// Add current namespace as a child of the pervious one
			currentNamespace = addNamespace(name[i], currentNamespace, typeDeprecated);
		}
	}

	// Add functions
	if (functions) {
		for (i = 0; i < functions.length; i++) {
			processFunction(functions[i], currentNamespace);
		}
	}

	// Add properties
	if (properties) {
		for (i = 0; i < properties.length; i++) {
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
 * @param {Array} parentName The name of the parent
 * @param {String} alias The alias of the name we are going to inject
 */
function inject(parent, node, name, parentName, alias, returnNodeName) {
	var objectType,
		propertyName,
		result;
		
	// Create a deep copy of parentName so we don't modify the original
	parentName = parentName.slice();
		
	// When injecting children, we will hit the 'deprecated' property.  In that case, it could be undefined or a boolean value.
	// If it's undefined, just return here.
	if (!node) {
		return;
	} else if (node.nodeType === "function") {
		parentName.push(name);
		if (name === "addEventListener") {
			parent.put(name, new AddEventListenerFunc(), false, true);
		} else {
			parent.put(name, new TiFunctionType(node.returnTypeJsca, parentName), false, true);
		}
	} else if (node.nodeType === "property") {
		parent.put(name, new Base.UnknownType(), false, true);
	} else if ( typeof node === "object") {
		objectType = new Base.ObjectType();
		parent.put(name, objectType, false, true);

		if (alias) {
			parent.put(alias, objectType, false, true);
		}

		objectType.on("propertyReferenced", function(e) {
			reportPropertyReferenced(e.data.name, parentName, node);
		});

		parentName.push(name);

		// inject children
		for (propertyName in node) {
			result = inject(objectType, node[propertyName], propertyName, parentName, undefined, returnNodeName);
		}

		if (parentName.join('.') === returnNodeName) {
			result = objectType;
		}

		return result;
	}
}

/**
 * Creates and adds a namespace with the given name to the given parent (if it doesn't already exist)
 *
 * @private
 * @method
 * @param {String} name The name of the namespace to add
 * @param {Object} parent The parent of the given namespace
 * @param {Boolean} deprecated A boolean flag to specify whether the namespace is deprecated
 * @returns {Object} The namespace object that was added
 */
function addNamespace(name, parent, deprecated) {
	if (!parent[name]) {
		parent[name] = {
			deprecated : deprecated
		};
	}
	return parent[name];
}

/**
 * Checks whether the given type is primitive
 *
 * @private
 * @method
 * @param {String} type The name of the type
 * @returns {Boolean} A boolean value on whether the given type is primitive
 */
function isPrimitiveType(type) {
	return (type === "Number" || type === "Boolean" || type === "String");
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
	var funcName = func.name,
		jsca,
		returnTypes = func.returnTypes,
		returnType;

	if (func.isInternal) {
		return;
	}

	// If the returnTypes are undefined, leave jsca as undefined
	if (returnTypes) {
		returnType = returnTypes[0].type;
		if (returnTypes.length === 1 && !isPrimitiveType(returnType) && returnType !== "Array") {
			jsca = findTypeByName(returnType);
		} else {
			// mark jsca as unknown when it's a primitive type or there is more than one return type
			jsca = "unknown";
		}
	}

	if (!parent[funcName]) {
		parent[funcName] = {
			nodeType : "function",
			returnTypeJsca : jsca,
			deprecated : func.deprecated
		};
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
		parent[propName] = {
			nodeType : "property",
			deprecated : prop.deprecated
		};
	}
}

/**
 * Finds the type object from jsca based on the given name
 *
 * @private
 * @method
 * @param {String} name The name of the type
 * @returns {Object} A jsca object that was found
 */
function findTypeByName(name) {
	var typesArray = jscaJSON.types,
		i;

	for ( i = 0; i < typesArray.length; i++) {
		if (typesArray[i].name === name) {
			return typesArray[i];
		}
	}
}

/**
 * Reports that a property was referenced
 *
 * @private
 * @method
 * @param {String} propertyName The propery name that was referenced
 * @param {Array} parentName The parent name of the property referenced
 * @param {String} node The node for the property referenced
 */
function reportPropertyReferenced(propertyName, parentName, node) {
	var propertyNode = node[propertyName];
	
	// Create a deep copy so we don't change the original
	parentName = parentName.slice();
	
	parentName.push(propertyName);
	Runtime.fireEvent("tiPropReferenced", "Titanium property referenced: " + propertyName, {
		name : propertyName,
		deprecated: propertyNode && propertyNode.deprecated,
		api: parentName
	});
}