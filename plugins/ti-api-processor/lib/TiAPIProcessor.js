/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Processes Titanium APIs for the code processor
 *
 * @module plugins/TiAPIProcessor
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var fs = require('fs'),
	path = require('path'),
	existsSync = fs.existsSync || path.existsSync,
	util = require('util'),

	Base = require(path.join(global.titaniumCodeProcessorLibDir, 'Base')),
	Runtime = require(path.join(global.titaniumCodeProcessorLibDir, 'Runtime')),

	jsca,
	platform,
	values,

	api = { children: {} },

	platformList = ['android', 'mobileweb', 'iphone', 'ios', 'ipad'],

	methodOverrides = [
		require('./method-overrides/TiInclude.js'),
		require('./method-overrides/TiUICreate.js'),
		require('./method-overrides/TiUIWindowOpen.js')
	],
	propertyOverrides = [];

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
	jsca = options && options.sdkPath && path.join(options.sdkPath, 'api.jsca');
	platform = options && options.platform;
	values = options && options.values || {};

	if (!platform) {
		console.error('ti-api-processor plugin requires the "platform" option');
		process.exit(1);
	}
	if (platformList.indexOf(platform) === -1) {
		console.error('"' + platform + '" is not a valid platform for the ti-api-processor plugin');
		process.exit(1);
	}
	if (!jsca) {
		console.error('ti-api-processor plugin requires the "sdkPath" option');
		process.exit(1);
	}
	if (!existsSync(jsca)) {
		console.error('ti-api-processor plugin could not find a valid JSCA file at "' + jsca + '"');
		process.exit(1);
	}
	jsca = JSON.parse(fs.readFileSync(jsca));
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
		obj,
		p;

	// Create the API tree
	for (i = 0, len = types.length; i < len; i++) {
		type = types[i];
		root = api;
		name = type.name.split('.');
		for(j = 0; j < name.length; j++) {
			if (!root.children[name[j]]) {
				(root.children[name[j]] = { children: {} });
			}
			root = root.children[name[j]];
		}
		root.node = type;
	}

	for(i = 0, len = methodOverrides.length; i < len; i++) {
		methodOverrides[i] = methodOverrides[i].init({
			api: api,
			platform: platform,
			values: values,
			createObject: createObject
		});
	}
	for(i = 0, len = propertyOverrides.length; i < len; i++) {
		propertyOverrides[i] = propertyOverrides[i].init({
			api: api,
			platform: platform,
			values: values,
			createObject: createObject
		});
	}

	// Create the list of aliases and global objects
	for (i = 0, len = aliases.length; i < len; i++) {
		alias = aliases[i];
		if (alias) {
			type = alias.type;
			if (!typesToInsert[type]) {
				(typesToInsert[type] = []);
			}
			typesToInsert[type].push(alias.name);
		}
	}

	// Inject the global objects
	for (p in typesToInsert) {
		obj = createObject(api.children[p]);
		globalObject.defineOwnProperty(p, {
			value: obj,
			writable: false,
			enumerable: true,
			configurable: true
		}, false, true);
		for(i = 0, len = typesToInsert[p].length; i < len; i++) {
			globalObject.defineOwnProperty(typesToInsert[p][i], {
				value: obj,
				writable: false,
				enumerable: true,
				configurable: true
			}, false, true);
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
 * @private
 */
function TiFunction(returnTypes, className) {
	Base.ObjectType.call(this, className || 'Function');
	this._returnTypes = returnTypes;
}
util.inherits(TiFunction, Base.FunctionType);

/**
 * @private
 */
TiFunction.prototype.call = function call(thisVal, args) {
	var returnType,
		root = api,
		i, j, len,
		value = new Base.UnknownType(),
		callArgs;
	args = args || [];
	for(i = 0, len = args.length; i < len; i++) {
		if (Base.type(args[i]) !== 'Unknown') {
			if (Base.isCallable(args[i])) {
				callArgs = [];
				for(j = 0; j < args[i].get('length').value; j++) {
					callArgs[j] = new Base.UnknownType();
				}
				Runtime.queueFunction(args[i], new Base.UndefinedType(), callArgs, true);
			}
		} else if (this._api.parameters[i] && this._api.parameters[i].type === 'Function') {
			Runtime.fireEvent('unknownCallback', 'An unknown value was passed to ' + this._apiName +
				'. Some source code may not be analyzed.');
		}
	}
	if (this._returnTypes && this._returnTypes.length === 1) {
		returnType = this._returnTypes[0].type.split('.');
		for(i = 0, len = returnType.length; i < len; i++) {
			root = root && root.children[returnType[i]];
		}
		if (root && root.node) {
			value = createObject(root);
			Runtime.fireEvent('tiPropertyReferenced', 'Property "' + this._returnTypes[0].type + '" was referenced', {
				name: this._returnTypes[0].type,
				node: root.node
			});
		} else {
			Runtime.fireEvent('nonTiPropertyReference', 'Property "' + this._returnTypes[0].type + '" was referenced but is not part of the API', {
				name: this._returnTypes[0].type
			});
		}
		return value;
	} else {
		return new Base.UnknownType();
	}
};

// ******** Object Type ********

/**
 * @classdesc A custom object implementation that hooks into get, put, and delete so it can fire the appropriate Ti events
 *
 * @constructor
 * @name module:plugins/TiAPIProcessor~TiObjectType
 * @private
 * @extends module:Base.ObjectType
 * @param {Object} api The api describing the object
 * @param {Object} api.node The JSCA node for the object
 * @param {Object} api.children Any children of this object (i.e. separate JSCA types that are properties)
 */
function TiObjectType(api, className) {
	this._api = api;
	Base.ObjectType.call(this, className || 'Object');
}
util.inherits(TiObjectType, Base.ObjectType);

/**
 * Indicates that a titanium property was referenced (i.e. read).
 *
 * @name module:plugins/TiAPIProcessor#tiPropertyReferenced
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
TiObjectType.prototype.getOwnProperty = function getOwnProperty(p, suppressEvent) {
	var value = Base.ObjectType.prototype.getOwnProperty.apply(this, arguments),
		node;
	if (value && !suppressEvent) {
		node = value.value._api;
		if (node) {
			Runtime.fireEvent('tiPropertyReferenced', 'Property "' + p + '" was referenced', {
				name: value.value._apiName,
				node: node
			});
		} else {
			Runtime.fireEvent('nonTiPropertyReference', 'Property "' + p + '" was referenced but is not part of the API', {
				name: p
			});
		}
	}
	return value;
};

/**
 * Indicates that a titanium property was set (i.e. written).
 *
 * @name module:plugins/TiAPIProcessor#tiPropertySet
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
 * @param {Boolean} suppressEvent Suppresses the 'propertySet' event (used when setting prototypes)
 * @see ECMA-262 Spec Chapter 8.12.5
 */
TiObjectType.prototype.defineOwnProperty = function defineOwnProperty(p, desc, throwFlag, suppressEvent) {
	var v;
	Base.ObjectType.prototype.defineOwnProperty.apply(this, arguments);
	if (!suppressEvent && Base.isDataDescriptor(desc)) {
		v = desc.value;
		if (v._api) {
			Runtime.fireEvent('tiPropertySet', 'Property "' + p + '" was set', {
				name: v._apiName,
				node: v._api
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
 * @name module:plugins/TiAPIProcessor#tiPropertyDeleted
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
 * @see ECMA-262 Spec Chapter 8.12.7
 */
TiObjectType.prototype.delete = function objDelete(p) {
	var success = Base.ObjectType.prototype['delete'].apply(this, arguments);
	Runtime.fireEvent('tiPropertyDeleted', 'Property "' + p + '" was deleted', {
		name: this._apiName + '.' + p,
		success: success
	});
	return success;
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
		value,
		name,
		fullName,
		type,
		p, i, ilen, j, jlen;

	obj._api = apiNode.node;
	obj._apiName = apiNode.node.name;

	// Add the properties
	for(i = 0, ilen = properties.length; i < ilen; i++) {
		property = properties[i];
		name = property.name;
		type = property.type;
		fullName = apiNode.node.name + '.' + name;
		if (name === 'osname' && apiNode.node.name === 'Titanium.Platform') {
			value = new Base.StringType(platform);
		} else if (fullName in values) {
			if (values[fullName] === null) {
				value = new Base.NullType();
			} else {
				switch(typeof values[fullName]) {
					case 'number':
						value = new Base.NumberType(values[fullName]);
						break;
					case 'string':
						value = new Base.NumberType(values[fullName]);
						break;
					case 'boolean':
						value = new Base.NumberType(values[fullName]);
						break;
					default:
						console.error('Invalid value specified in ti-api-processor options: ' + values[fullName]);
						process.exit(1);
				}
			}
		}else if (type in api.children) {
			value = createObject(api.children[type]);
		} else {
			value = new Base.UnknownType();
		}
		value._api = property;
		value._apiName = name;
		obj.defineOwnProperty(name, {
			value: value,
			// TODO: Need to read the 'permission' property from the JSCA, only it doesn't exist yet
			writable: !(name === 'osname' && apiNode.node.name === 'Titanium.Platform') && !property.isClassProperty,
			enumerable: true,
			configurable: true
		}, false, true);
	}

	// Add the methods
	for (i = 0, ilen = functions.length; i < ilen; i++) {
		func = functions[i];
		name = apiNode.node.name + '.' + func.name;
		value = new TiFunction(func.returnTypes);
		for (j = 0, jlen = methodOverrides.length; j < jlen; j++) {
			if (methodOverrides[j].regex.test(name) && methodOverrides[j].call) {
				value.call = methodOverrides[j].call;
			}
		}
		if (func.parameters) {
			value.defineOwnProperty('length', {
				value: new Base.NumberType(func.parameters.length),
				writable: false,
				enumerable: true,
				configurable: true
			}, false, true);
		}
		value._api = func;
		value._apiName = name;
		obj.defineOwnProperty(func.name, {
			value: value,
			writable: false,
			enumerable: true,
			configurable: true
		}, false, true);
	}

	// Add the children
	for(p in children) {
		obj.defineOwnProperty(p, {
			value: createObject(children[p]),
			writable: false,
			enumerable: true,
			configurable: true
		}, false, true);
	}

	// Return the newly created object
	return obj;
}