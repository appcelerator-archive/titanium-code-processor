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
	CodeProcessorUtils = require(path.join(global.titaniumCodeProcessorLibDir, 'CodeProcessorUtils')),

	jsca,
	manifest,
	platform,
	platformList,
	values,
	api,

	methodOverrides = [],
	propertyOverrides = [],
	objectOverrides = [],

	getterRegex = /^get([A-Z])(.*)$/,
	setterRegex = /^set([A-Z])(.*)$/,
	underscoreRegex = /\._/g;

// ******** Plugin API Methods ********

/**
 * Creates an instance of the ti api processor plugin
 *
 * @classdesc Injects a stub of the Titanium Mobile API into the global namespace
 *
 * @constructor
 * @name module:plugins/TiAPIProcessor
 */
module.exports = function(options, dependencies) {
	var i, len,
		rawManifest;
	for (i = 0, len = dependencies.length; i < len; i++) {
		if (dependencies[i].name === 'require-provider') {
			this.platform = platform = dependencies[i].platform;
			this.platformList = platformList = dependencies[i].platformList;
		}
	}

	values = options && options.values || {};

	api = {
		children: {}
	};

	if (!options || !existsSync(options.sdkPath)) {
		console.error(this.name + ' plugin requires a valid "sdkPath" option');
		process.exit(1);
	}

	// Parse and validate the JSCA file
	jsca = path.join(options.sdkPath, 'api.jsca');
	if (!existsSync(jsca)) {
		console.error(this.name + ' plugin could not find a valid JSCA file at "' + jsca + '"');
		process.exit(1);
	}
	jsca = JSON.parse(fs.readFileSync(jsca));

	// Parse and validate the manifest file
	manifest = path.join(options.sdkPath, 'manifest.json');
	if (existsSync(manifest)) {
		manifest = JSON.parse(fs.readFileSync(manifest));
	} else {
		manifest = path.join(options.sdkPath, 'version.txt');
		if (existsSync(manifest)) {
			rawManifest = fs.readFileSync(manifest).toString().split('\n');
			manifest = {};
			for (i = 0, len = rawManifest.length; i < len; i++) {
				if (rawManifest[i]) {
					rawManifest[i] = rawManifest[i].split('=');
					manifest[rawManifest[i][0]] = rawManifest[i][1];
				}
			}
		} else {
			console.error(this.name + ' plugin could not find a valid manifest file at "' + manifest + '"');
			process.exit(1);
		}
	}
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
		i, ilen, j, jlen,
		name,
		root,
		obj,
		p,
		jsRegex = /\.js$/,
		overrideFiles = CodeProcessorUtils.findJavaScriptFiles(path.join(__dirname, 'overrides')),
		overrideDefs;

	// Create the API tree
	for (i = 0, ilen = types.length; i < ilen; i++) {
		type = types[i];
		root = api;
		name = type.name.split('.');
		for (j = 0; j < name.length; j++) {
			if (!root.children[name[j]]) {
				(root.children[name[j]] = { children: {} });
			}
			root = root.children[name[j]];
		}
		root.node = type;
	}

	// Load the overrides
	for (i = 0, ilen = overrideFiles.length; i < ilen; i++) {
		if (jsRegex.test(overrideFiles[i])) {
			overrideDefs = require(overrideFiles[i]).getOverrides({
					api: api,
					manifest: manifest,
					platform: platform,
					values: values,
					createObject: createObject
				});
			for(j = 0, jlen = overrideDefs.length; j < jlen; j++) {
				if (overrideDefs[j].call) {
					methodOverrides.push(overrideDefs[j]);
				} else if (overrideDefs[j].value) {
					propertyOverrides.push(overrideDefs[j]);
				} else if (overrideDefs[j].obj) {
					objectOverrides.push(overrideDefs[j]);
				} else {
					throw new Error('Invalid override in ' + overrideFiles[i]);
				}
			}
		}
	}

	// Create the list of aliases and global objects
	for (i = 0, ilen = aliases.length; i < ilen; i++) {
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
		for (i = 0, ilen = typesToInsert[p].length; i < ilen; i++) {
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
TiFunction.prototype.call = Base.wrapNativeCall(function call(thisVal, args) {
	var returnType,
		root = api,
		i, ilen, j, jlen,
		value = new Base.UnknownType(),
		callArgs;
	args = args || [];
	for (i = 0, ilen = args.length; i < ilen; i++) {
		if (Base.type(args[i]) !== 'Unknown') {
			if (Base.isCallable(args[i])) {
				callArgs = [];
				for (j = 0, jlen = args[i].get('length').value; j < jlen; j++) {
					callArgs[j] = new Base.UnknownType();
				}
				Runtime.queueFunction(args[i], thisVal, callArgs, true);
			}
		} else if (this._api.parameters[i] && this._api.parameters[i].type === 'Function') {
			Runtime.fireEvent('unknownCallback', 'An unknown value was passed to ' + this._apiName +
				'. Some source code may not be analyzed.');
		}
	}
	if (this._returnTypes && this._returnTypes.length === 1) {
		returnType = this._returnTypes[0].type.split('.');
		for (i = 0, ilen = returnType.length; i < ilen; i++) {
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
});

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
	var v,
		callArgs,
		i, len,
		props = this._api.properties,
		api;
	Base.ObjectType.prototype.defineOwnProperty.apply(this, arguments);
	if (Base.isDataDescriptor(desc)) {
		v = desc.value;
		for (i = 0, len = props.length; i < len; i++) {
			if (props[i].name === p) {
				api = props[i];
			}
		}
		if (api) {
			if (!suppressEvent) {
				Runtime.fireEvent('tiPropertySet', 'Property "' + p + '" was set', {
					name: this._apiName + '.' + api.name,
					node: v._api
				});
			}
			if (Base.isCallable(v)) {
				callArgs = [];
				for (i = 0, len = v.get('length').value; i < len; i++) {
					callArgs[i] = new Base.UnknownType();
				}
				Runtime.queueFunction(v, this, callArgs, true);
			}
		} else if (!suppressEvent) {
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
 * Creates a setter function
 *
 * @private
 * @method
 */
function TiSetterFunction(obj, name, className) {
	Base.ObjectType.call(this, className || 'Function');
	this._obj = obj;
	this._name = name;
	this._isTiSetter = true;
}
util.inherits(TiSetterFunction, Base.FunctionType);

/**
 * @private
 */
TiSetterFunction.prototype.call = Base.wrapNativeCall(function call(thisVal, args) {
	var oldValue;
	if (thisVal !== this._obj) {
		Base.handleRecoverableNativeException('TypeError', 'Cannot invoke setters on objects that are not the original owner of the setter');
		return new Base.UnknownType();
	}
	if (args[0]) {
		oldValue = thisVal.getOwnProperty(this._name);
		thisVal.defineOwnProperty(this._name, {
			value: args[0],
			writable: oldValue.writable,
			enumerable: oldValue.enumerable,
			configurable: oldValue.configurable
		}, false, true);
	}
	return new Base.UndefinedType();
});

/**
 * Creates a getter function
 *
 * @private
 * @method
 */
function TiGetterFunction(obj, name, className) {
	Base.ObjectType.call(this, className || 'Function');
	this._obj = obj;
	this._name = name;
	this._isTiGetter = true;
}
util.inherits(TiGetterFunction, Base.FunctionType);

/**
 * @private
 */
TiGetterFunction.prototype.call = Base.wrapNativeCall(function call(thisVal) {
	if (thisVal !== this._obj) {
		Base.handleRecoverableNativeException('TypeError', 'Cannot invoke getters on objects that are not the original owner of the getter');
		return new Base.UnknownType();
	}
	return thisVal.getOwnProperty(this._name, true).value;
});

/**
 * Creates a titanium object from an API node
 *
 * @private
 * @method
 */
function createObject(apiNode) {
	var obj = new TiObjectType(apiNode),
		properties = apiNode.node.properties,
		propertyList = {},
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
	obj._apiName = apiNode.node.name.replace(underscoreRegex, '.');

	// Check if this object is being overridden
	for (i = 0, ilen = objectOverrides.length; i < ilen; i++) {
		if (objectOverrides[i].regex.test(obj._apiName) && objectOverrides[i].obj) {
			return objectOverrides[i].obj;
		}
	}

	// Figure out which methods are getters/setters and which are just regular methods
	for (i = 0, ilen = properties.length; i < ilen; i++) {
		property = properties[i];
		propertyList[property.name] = property;
	}
	for (i = 0; i < functions.length; i++) {
		func = functions[i];
		value = getterRegex.exec(func.name);
		if (value) {
			value = value[1].toLowerCase() + value[2];
			if (propertyList[value]) {
				propertyList[value]._getter = func;
				functions.splice(i--, 1);
			}
		} else {
			value = setterRegex.exec(func.name);
			if (value) {
				value = value[1].toLowerCase() + value[2];
				if (propertyList[value]) {
					propertyList[value]._setter = func;
					functions.splice(i--, 1);
				}
			}
		}
	}

	// Add the properties
	for (i = 0, ilen = properties.length; i < ilen; i++) {
		property = properties[i];
		name = property.name;
		type = property.type;
		property.readonly = !property._setter;
		fullName = apiNode.node.name + '.' + name;
		value = undefined;
		for (j = 0, jlen = propertyOverrides.length; j < jlen; j++) {
			if (propertyOverrides[j].regex.test(fullName) && propertyOverrides[j].value) {
				value = propertyOverrides[j].value;
				break;
			}
		}
		if (name === 'osname' && apiNode.node.name === 'Titanium.Platform') {
			value = new Base.StringType(platform);
		} else if (value) {
			// Do nothing
		} else if (fullName in values) {
			if (values[fullName] === null) {
				value = new Base.NullType();
			} else {
				switch(typeof values[fullName]) {
					case 'number':
						value = new Base.NumberType(values[fullName]);
						break;
					case 'string':
						value = new Base.StringType(values[fullName]);
						break;
					case 'boolean':
						value = new Base.BooleanType(values[fullName]);
						break;
					default:
						console.error('Invalid value specified in ' + this.name + ' options: ' + values[fullName]);
						process.exit(1);
				}
			}
		} else if (type in api.children) {
			value = createObject(api.children[type]);
		} else {
			value = new Base.UnknownType();
		}
		value._api = property;
		value._apiName = name.replace(underscoreRegex, '.');
		obj.defineOwnProperty(name, {
			value: value,
			writable:
				!(name === 'osname' && apiNode.node.name === 'Titanium.Platform') &&
				!property.isClassProperty &&
				!property.readonly,
			enumerable: true,
			configurable: true
		}, false, true);
		if (property._setter) {
			obj.defineOwnProperty('set' + name[0].toUpperCase() + name.substr(1), {
				value: new TiSetterFunction(obj, name),
				writable: false,
				enumerable: false,
				configurable: true,
			});
		}
		if (property._getter) {
			obj.defineOwnProperty('get' + name[0].toUpperCase() + name.substr(1), {
				value: new TiGetterFunction(obj, name),
				writable: false,
				enumerable: false,
				configurable: true,
			});
		}
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
		value._apiName = name.replace(underscoreRegex, '.');
		obj.defineOwnProperty(func.name, {
			value: value,
			writable: false,
			enumerable: true,
			configurable: true
		}, false, true);
	}

	// Add the children
	for (p in children) {
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