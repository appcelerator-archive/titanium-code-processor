/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Processes Titanium APIs for the code processor
 *
 * @module plugins/TiAPIProcessor
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

var fs = require("fs"),
	path = require("path"),
	util = require("util"),
	
	Base = require(path.join(global.nodeCodeProcessorLibDir, "Base")),
	Runtime = require(path.join(global.nodeCodeProcessorLibDir, "Runtime")),
	Exceptions = require(path.join(global.nodeCodeProcessorLibDir, "Exceptions")),
	CodeProcessor = require(path.join(global.nodeCodeProcessorLibDir, "CodeProcessor")),
	
	jsca,
	platform,
	
	api = { children: {} };

// ******** Plugin API Methods ********

/**
 * Creates an instance of the ti api processor plugin
 * 
 * @classdesc Injects a stub of the Titanium Mobile API into the global namespace
 * 
 * @constructor
 * @name module:plugins/TiAPIProcessor
 */
module.exports = function(options) {
	jsca = JSON.parse(fs.readFileSync(path.join(options.sdkPath, "api.jsca")));
	platform = options.platform;
};

/**
 * Initializes the plugin
 * 
 * @method
 * @name module:plugins/TiAPIProcessor#init
 */
module.exports.prototype.init = function init() {
	
	// Iterate through the json object and inject all the APIs
	var typesToInsert = {},
		globalObject = Runtime.getGlobalObject(),
		types = jsca.types,
		type,
		aliases = jsca.aliases,
		alias,
		i, j,
		len,
		name,
		root,
		obj;
	
	// Create the API tree
	for (i = 0, len = types.length; i < len; i++) {
		type = types[i];
		root = api;
		name = type.name.split('.');
		for(j = 0; j < name.length; j++) {
			root.children[name[j]] || (root.children[name[j]] = { children: {} });
			root = root.children[name[j]];
		}
		root.node = type;
	}

	// Create the list of aliases and global objects
	for (i = 0, aliases.length; i < len; i++) {
		alias = aliases[i];
		if (alias) {
			type = alias.type;
			typesToInsert[type] || (typesToInsert[type] = []);
			typesToInsert[type].push(alias.name)
		}
	}
	
	// Inject the global objects
	for (p in typesToInsert) {
		obj = createObject(api.children[p]);
		globalObject.put(p, obj, false, true);
		for(i = 0, len = typesToInsert[p].length; i < len; i++) {
			globalObject.put(typesToInsert[p][i], obj, false, true);
		}
	}
};

/**
 * Gets the results of the plugin
 *
 * @method
 * @name module:plugins/TiAPIProcessor#getResults
 * @returns {Object} An empty object.
 */
module.exports.prototype.getResults = function getResults() {
	return {};
};

// ******** Function Type ********

/**
 * @classdesc Specialized function that returns information based on the JSCA
 * 
 * @constructor
 * @private
 * @param {Array[String]|undefined} returnTypes An array of return types, or undefined
 * @param {String} [className] The name of the class, defaults to "Function." This parameter should only be used by a 
 *		constructor for an object extending this one.
 */
function TiFunction(returnTypes, className) {
	Base.ObjectType.call(this, className || "Function");
	this._returnTypes = returnTypes;
}
util.inherits(TiFunction, Base.FunctionType);

/**
 * Calls the require function
 * 
 * @method
 * @param {module:Base.BaseType} thisVal The value of <code>this</code> of the function
 * @param (Array[{@link module:Base.BaseType}]} args The set of arguments passed in to the function call
 * @returns {module:Base.BaseType} The return value from the function
 * @see ECMA-262 Spec Chapter 13.2.1
 */
TiFunction.prototype.call = function call(thisVal, args) {
	var returnType,
		root = api,
		parent,
		i, len;
	if (this._returnTypes && this._returnTypes.length === 1) {
		returnType = this._returnTypes[0].type.split('.');
		for(i = 0, len = returnType.length; i < len; i++) {
			root = root && root.children[returnType[i]];
		}
		if (root && root.node) {
			value = createObject(root)
			Runtime.fireEvent("tiPropertyReferenced", "Property '" + p + "' was referenced", {
				name: this._returnTypes[0].type,
				node: root.node
			});
		} else {
			Runtime.fireEvent('nonTiPropertyReference', 'Property "' + p + '" was referenced but is not part of the API', {
				name: p
			});
		}
		return value;
	} else {
		return new Base.UndefinedType();
	}
};

// ******** Object Type ********

/**
 * @classdesc A custom object implementation that hooks into get, put, and delete so it can fire the appropriate Ti events
 * 
 * @constructor
 * @private
 * @extends module:Base.ObjectType
 * @param {Object} api The api describing the object
 * @param {Object} api.node The JSCA node for the object
 * @param {Object} api.children Any children of this object (i.e. separate JSCA types that are properties)
 */
exports.TiObjectType = TiObjectType;
function TiObjectType(api, className) {
	this._api = api;
	Base.ObjectType.call(this, className || "Object");
}
util.inherits(TiObjectType, Base.ObjectType);

/**
 * Indicates that a titanium property was referenced (i.e. read).
 *
 * @name module:plugins/TiAPIProcessor.TiObjectType#tiPropertyReferenced
 * @event
 * @param {String} name The name of the property that was referenced
 * @param {{@link module:Base.DataPropertyDescriptor}|{@link module:Base.AccessorPropertyDescriptor}|undefined} The
 *		descriptor fetched, if it could be found.
 */
/**
 * ECMA-262 Spec: <em>Returns the value of the named property.</em>
 * 
 * @method
 * @param {String} p The name of the property to fetch
 * @returns {{@link module:Base.BaseType}} The value of the property, or a new instance of 
 *		{@link module:Base.UndefinedType} if the property does not exist
 * @see ECMA-262 Spec Chapter 8.12.3
 */
exports.TiObjectType.prototype.get = function get(p) {
	var value = Base.ObjectType.prototype.get.apply(this, arguments),
		node = value._api ? value._api.node : value._property ? value._property : value._function;
	if (node) {
		Runtime.fireEvent("tiPropertyReferenced", "Property '" + p + "' was referenced", {
			name: this._api.node.name + '.' + p,
			node: node
		});
	} else {
		Runtime.fireEvent('nonTiPropertyReference', 'Property "' + p + '" was referenced but is not part of the API', {
			name: p
		});
	}
	return value;
};

/**
 * Indicates that a titanium property was set (i.e. written).
 *
 * @name module:plugins/TiAPIProcessor.TiObjectType#tiPropertySet
 * @event
 * @param {String} name The name of the property that was set
 * @param {module:Base.BaseType} value The value that was set
 */
/**
 * ECMA-262 Spec: <em>Sets the specified named property to the value of the second parameter. The flag controls failure 
 * handling.</em>
 * 
 * @method
 * @param {String} p The name of the parameter to set the value as
 * @param {module:Base.BaseType} v The value to set
 * @param {Boolean} throwFlag Whether or not to throw an exception on error (related to strict mode)
 * @param {Boolean} suppressEvent Suppresses the "propertySet" event (used when setting prototypes)
 * @throws {{@link module:Exceptions.TypeError}} Thrown when the property cannot be put and throwFlag is true
 * @see ECMA-262 Spec Chapter 8.12.5
 */
exports.TiObjectType.prototype.put = function put(p, v, throwFlag, suppressEvent) {
	var node = v._api ? v._api.node : v._property ? v._property : v._function;
	Base.ObjectType.prototype.put.apply(this, arguments);
	if (!suppressEvent) {
		if (node) {
			Runtime.fireEvent("tiPropertySet", "Property '" + p + "' was set", {
				name: this._api.node.name + '.' + p,
				node: node
			});
		} else {
			Runtime.fireEvent('nonTiPropertySet', 'Property "' + p + '" was set but is not part of the API', {
				name: p
			});
		}
	}
};

/**
 * Indicates that a titanium property was deleted
 *
 * @name module:plugins/TiAPIProcessor.TiObjectType#tiPropertyDeleted
 * @event
 * @param {String} name The name of the property referenced
 */
/**
 * ECMA-262 Spec: <em>Removes the specified named own property from the object. The flag controls failure handling.</em>
 * 
 * @method
 * @param {String} p The name of the parameter to delete
 * @param {Boolean} throwFlag Whether or not to throw an exception on error (related to strict mode)
 * @returns {Boolean} Whether or not the object was deleted succesfully
 * @throws {{@link module:Exceptions.TypeError}} Thrown when the property cannot be deleted and throwFlag is true
 * @see ECMA-262 Spec Chapter 8.12.7
 */
exports.TiObjectType.prototype.delete = function objDelete(p, throwFlag) {
	var success = Base.ObjectType.prototype["delete"].apply(this, arguments);
	Runtime.fireEvent("tiPropertyDeleted", "Property '" + p + "' was deleted", {
		name: this._api.node.name + '.' + p,
		success: success
	});
	return success;
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
	var file = args && Base.getValue(args[0]),
		evalFunc,
		root,
		module,
		result = new Base.UnknownType();
	
	// Validate the file
	if (!file) {
		file = new Base.UndefinedType();
	}
	if (Base.type(file) === "Unknown") {
		
		eventDescription = "A value that could not be evaluated was passed to Ti.include";
		Runtime.fireEvent("requireUnresolved", eventDescription, {
			name: "<Could not evaluate Ti.include path>"
		});
		Runtime.reportWarning("requireUnresolved", eventDescription, {
			name: "<Could not evaluate Ti.include path>"
		});
		return result;
	}
	file = Base.toString(file).value;
	file = path.resolve(path.join(path.dirname(file[0] !== "." ? Runtime.getEntryPointFile() : Runtime.getCurrentFile()), file));
	
	// Make sure the file exists
	console.log(path.resolve(file));
	if (fs.existsSync(file)) {
		
		// Fire the parsing begin event
		Runtime.fireEvent("fileProcessingBegin", "Processing is beginning for file '" + file + "'", {
			file: file
		});
		
		// Set the current file
		Runtime.setCurrentFile(file);
		
		// Eval the code
		evalFunc = Runtime.getGlobalObject().get('eval');
		evalFunc.call(thisVal, [new Base.StringType(fs.readFileSync(file).toString())]);
		
		// Restore the previous file
		Runtime.popCurrentFile();
		
		// Fire the parsing end event
		Runtime.fireEvent("fileProcessingEnd", "Processing finished for file '" + file + "'", {
			file: file
		});
		
	} else {
		throw new Error("Could not load file '" + file + "'");
	}
	return result;
};

// ******** Helper Methods ********

/**
 * Creates a titanium object from an API node
 * 
 * @private
 * @method
 */
function createObject(apiNode) {
	var obj = new TiObjectType(apiNode),
		properties = apiNode.node.properties,
		property,
		functions = apiNode.node.functions,
		func,
		children = apiNode.children,
		child,
		value,
		name,
		type,
		p, i, len;
	
	// Add the properties
	for(i = 0, len = properties.length; i < len; i++) {
		property = properties[i];
		name = property.name;
		type = property.type;
		if (name === 'osname' && apiNode.node.name === 'Titanium.Platform') {
			value = new Base.StringType(platform);
		} else if (type in api.children) {
			value = createObject(api.children[type]);
		} else {
			value = new Base.UnknownType();
		}
		value._property = property;
		obj.put(name, value, false, true);
	}
	
	// Add the methods
	for(i = 0, len = functions.length; i < len; i++) {
		func = functions[i];
		if (func.name === 'include' && apiNode.node.name === 'Titanium') {
			value = new IncludeFunction();
		} else {
			value = new TiFunction(func.returnTypes);
		}
		value._function = func;
		obj.put(func.name, value, false, true);
	}
	
	// Add the children
	for(p in children) {
		obj.put(p, createObject(children[p]))
	}
	
	// Return the newly created object
	return obj;
}