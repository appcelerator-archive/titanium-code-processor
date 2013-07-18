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
	AST = require(path.join(global.titaniumCodeProcessorLibDir, 'AST')),
	RuleProcessor = require(path.join(global.titaniumCodeProcessorLibDir, 'RuleProcessor')),

	jsca,
	manifest,
	platform,
	modules,
	cache,
	platformList = ['android', 'mobileweb', 'iphone', 'ipad', 'blackberry', 'tizen'],
	values,
	api,

	methodOverrides = [],
	propertyOverrides = [],
	objectOverrides = [],

	getterRegex = /^get([A-Z])(.*)$/,
	setterRegex = /^set([A-Z])(.*)$/,
	pluginRegExp = /^(.+?)\!(.*)$/,
	fileRegExp = /\.js$/,
	underscoreRegex = /\._/g;

// ******** Plugin API Methods ********

/**
 * Initializes the plugin
 *
 * @method
 * @name module:plugins/TiAPIProcessor#init
 * @param {Object} options The plugin options
 * @param {Array[Dependency Instance]} dependencies The dependant plugins of this plugin
 */
exports.init = function init(options, dependencies) {

	// Iterate through the json object and inject all the APIs
	var typesToInsert = {},
		globalObject = Runtime.getGlobalObject(),
		stringObject = globalObject.get('String'),
		types,
		type,
		aliases,
		alias,
		i, ilen, j, jlen,
		name,
		root,
		obj,
		p,
		jsRegex = /\.js$/,
		overrideFiles = CodeProcessorUtils.findJavaScriptFiles(path.join(__dirname, 'overrides')),
		overrideDefs,
		rawManifest;
	
	platform = exports.platform = options && options.platform;
	modules = exports.modules = options && options.modules || {};
	cache = {};
	values = options && options.values || {};
	test = options && options.test;

	api = {
		children: {}
	};

	if (!test) {
		if (!options || !existsSync(options.sdkPath)) {
			console.error('The ' + exports.displayName + ' plugin requires a valid "sdkPath" option');
			process.exit(1);
		}
		
		if (!platform) {
			console.error('The ' + exports.displayName + ' plugin requires the "platform" option');
			process.exit(1);
		}
		if (platformList.indexOf(platform) === -1) {
			console.error('"' + platform + '" is not a valid platform for the ' + exports.displayName + ' plugin');
			process.exit(1);
		}
	}

	// Add common globals
	function addObject(name, value, obj) {
		obj.defineOwnProperty(name, {
			value: value,
			writable: false,
			enumerable: true,
			configurable: true
		}, false, true);
	}

	addObject('L', new LFunc(), globalObject);
	addObject('alert', new AlertFunc(), globalObject);
	addObject('clearInterval', new ClearIntervalFunc(), globalObject);
	addObject('clearTimeout', new ClearTimeoutFunc(), globalObject);
	addObject('setInterval', new SetIntervalFunc(), globalObject);
	addObject('setTimeout', new SetTimeoutFunc(), globalObject);
	addObject('console', new ConsoleObject(), globalObject);

	addObject('format', new StringFunc(), stringObject);
	addObject('formatCurrency', new StringFunc(), stringObject);
	addObject('formatDate', new StringFunc(), stringObject);
	addObject('formatDecimal', new StringFunc(), stringObject);
	addObject('formatTime', new StringFunc(), stringObject);

	// Require provider
	// Require provider
	if (!test) {
		Runtime.on('fileListSet', function(e) {
			var platformSpecificFiles = {},
				genericFiles = {},
				fileList = e.data.fileList,
				file,
				leadSegment,
				i, len,
				baseDir = Runtime.sourceInformation.sourceDir;
			for (i = 0, len = fileList.length; i < len; i++) {
				file = path.relative(baseDir, fileList[i]).split(path.sep);
				leadSegment = file[0];
				if (platformList.indexOf(leadSegment) !== -1) {
					file.splice(0, 1);
					if (leadSegment === platform) {
						platformSpecificFiles[file.join(path.sep)] = 1;
					}
				} else {
					genericFiles[file.join(path.sep)] = 1;
				}
			}
			for (i in platformSpecificFiles) {
				if (i in genericFiles) {
					delete genericFiles[i];
				}
			}
			fileList = Object.keys(genericFiles);
			for (i in platformSpecificFiles) {
				fileList.push(path.join(platform, i));
			}
			for (i = 0, len = fileList.length; i < len; i++) {
				fileList[i] = path.join(baseDir, fileList[i]);
			}
			Runtime.fileList = fileList;
		});
	
		Runtime.isFileValid = function isFileValid(filename) {
			var rootDir = filename.split(path.sep)[0];
			return fileRegExp.test(filename) && (platformList.indexOf(rootDir) === -1 || rootDir === platform);
		};
	
		globalObject.defineOwnProperty('require', {
			value: new RequireFunction(),
			writable: false,
			enumerable: true,
			configurable: true
		}, false, true);
	}

	if (!test) {
		// Parse and validate the JSCA file
		jsca = path.join(options.sdkPath, 'api.jsca');
		if (!existsSync(jsca)) {
			console.error('The ' + exports.displayName + ' plugin could not find a valid JSCA file at "' + jsca + '"');
			process.exit(1);
		}
		jsca = JSON.parse(fs.readFileSync(jsca));
		types = jsca.types;
		aliases = jsca.aliases;
	
		// Parse and validate the manifest file
		manifest = path.join(options.sdkPath, 'manifest.json');
		if (existsSync(manifest)) {
			manifest = JSON.parse(fs.readFileSync(manifest));
		} else {
			manifest = path.join(options.sdkPath, 'version.txt');
			if (existsSync(manifest)) {
				rawManifest = fs.readFileSync(manifest).toString().split('\n');
				manifest = {};
				for (i = 0, ilen = rawManifest.length; i < ilen; i++) {
					if (rawManifest[i]) {
						rawManifest[i] = rawManifest[i].split('=');
						manifest[rawManifest[i][0]] = rawManifest[i][1];
					}
				}
			} else {
				console.error('The ' + exports.displayName + ' plugin could not find a valid manifest file at "' + manifest + '"');
				process.exit(1);
			}
		}
	
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
					if (overrideDefs[j].callFunction) {
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
	}
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
TiFunction.prototype.callFunction = Base.wrapNativeCall(function callFunction(thisVal, args) {
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
TiSetterFunction.prototype.callFunction = Base.wrapNativeCall(function callFunction(thisVal, args) {
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
TiGetterFunction.prototype.callFunction = Base.wrapNativeCall(function callFunction(thisVal) {
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
		value._apiName = fullName.replace(underscoreRegex, '.');
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
			if (methodOverrides[j].regex.test(name) && methodOverrides[j].callFunction) {
				value.callFunction = methodOverrides[j].callFunction;
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


// ******** Console Object ********

/**
 * console.*() prototype method
 *
 * @private
 */
function ConsoleFunc(type, className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
	this._type = type;
}
util.inherits(ConsoleFunc, Base.FunctionTypeBase);
ConsoleFunc.prototype.callFunction = Base.wrapNativeCall(function callFunction(thisVal, args) {
	var level = this._type,
		message = [];
	args.forEach(function (arg) {
		if (Base.type(arg) === 'Unknown') {
			message.push('<Unknown value>');
		} else {
			message.push(Base.toString(arg).value);
		}
	});
	message = message.join(' ');
	Runtime.fireEvent('consoleOutput', message, {
		level: level,
		message: message
	});
	if (Runtime.options.logConsoleCalls) {
		Runtime.log('info', 'program output [' + this._type + ']: ' + message);
	}
	return new Base.UndefinedType();
});

/**
 * Console Object
 *
 * @private
 */
function ConsoleObject(className) {
	Base.ObjectType.call(this, className);

	this.put('debug', new ConsoleFunc('debug'), false, true);
	this.put('error', new ConsoleFunc('error'), false, true);
	this.put('info', new ConsoleFunc('info'), false, true);
	this.put('log', new ConsoleFunc('log'), false, true);
	this.put('warn', new ConsoleFunc('warn'), false, true);
}
util.inherits(ConsoleObject, Base.ObjectType);

/**
 * L method
 *
 * @private
 */
function LFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(LFunc, Base.FunctionTypeBase);
LFunc.prototype.callFunction = Base.wrapNativeCall(function callFunction() {
	return new Base.UnknownType();
});

/**
 * alert method
 *
 * @private
 */
function AlertFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(AlertFunc, Base.FunctionTypeBase);
AlertFunc.prototype.callFunction = Base.wrapNativeCall(function callFunction() {
	return new Base.UndefinedType();
});

/**
 * clearInterval method
 *
 * @private
 */
function ClearIntervalFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(ClearIntervalFunc, Base.FunctionTypeBase);
ClearIntervalFunc.prototype.callFunction = Base.wrapNativeCall(function callFunction() {
	return new Base.UndefinedType();
});

/**
 * clearTimeout method
 *
 * @private
 */
function ClearTimeoutFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(ClearTimeoutFunc, Base.FunctionTypeBase);
ClearTimeoutFunc.prototype.callFunction = Base.wrapNativeCall(function callFunction() {
	return new Base.UndefinedType();
});

/**
 * setInterval method
 *
 * @private
 */
function SetIntervalFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(SetIntervalFunc, Base.FunctionTypeBase);
SetIntervalFunc.prototype.callFunction = Base.wrapNativeCall(function callFunction(thisVal, args) {

	var func = args[0];

	// Make sure func is actually a function
	if (Base.type(func) !== 'Unknown') {
		if (func.className !== 'Function' || !Base.isCallable(func)) {
			Base.handleRecoverableNativeException('TypeError', 'A value that is not a function was passed to setInterval');
			return new Base.UnknownType();
		}

		// Call the function, discarding the result
		Runtime.queueFunction(func, new Base.UndefinedType(), [], true);
	} else {
		Runtime.fireEvent('unknownCallback', 'An unknown value was passed to setInterval. Some source code may not be analyzed.');
	}

	return new Base.UnknownType();
});

/**
 * setTimeout method
 *
 * @private
 */
function SetTimeoutFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(SetTimeoutFunc, Base.FunctionTypeBase);
SetTimeoutFunc.prototype.callFunction = Base.wrapNativeCall(function callFunction(thisVal, args) {
	var func = args[0];

	// Make sure func is actually a function
	if (Base.type(func) !== 'Unknown') {
		if (func.className !== 'Function' || !Base.isCallable(func)) {
			Base.handleRecoverableNativeException('TypeError', 'A value that is not a function was passed to setTimeout');
			return new Base.UnknownType();
		}

		// Call the function, discarding the result
		Runtime.queueFunction(func, new Base.UndefinedType(), [], true);
	} else {
		Runtime.fireEvent('unknownCallback', 'An unknown value was passed to setTimeout. Some source code may not be analyzed.');
	}

	return new Base.UnknownType();
});

/**
 * Non-standard string extension function
 *
 * @private
 */
function StringFunc(className) {
	Base.ObjectType.call(this, className || 'Function');
	this.put('length', new Base.NumberType(1), false, true);
}
util.inherits(StringFunc, Base.FunctionTypeBase);
StringFunc.prototype.callFunction = Base.wrapNativeCall(function callFunction() {
	return new Base.UndefinedType();
});

/**
 * @classdesc Customized require() function that doesn't actually execute code in the interpreter, but rather does it here.
 *
 * @constructor
 * @private
 * @param {String} [className] The name of the class, defaults to 'Function.' This parameter should only be used by a
 *		constructor for an object extending this one.
 */
function RequireFunction(className) {
	Base.ObjectType.call(this, className || 'Function');
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
RequireFunction.prototype.callFunction = function callFunction(thisVal, args) {

	// Validate and parse the args
	var name = args && Base.getValue(args[0]),
		filePath,
		moduleInfo,
		result = new Base.UnknownType(),
		isModule,
		eventDescription;

	if (!name) {
		name = new Base.UndefinedType();
	}

	name = Base.toString(name);
	if (Base.type(name) !== 'String') {
		eventDescription = 'A value that could not be evaluated was passed to require';
		Runtime.fireEvent('requireUnresolved', eventDescription);
		Runtime.reportWarning('requireUnresolved', eventDescription);
		return result;
	}
	name = name.value;
	this._location = undefined;
	this._ast = undefined;
	if (pluginRegExp.test(name) || name.indexOf(':') !== -1) {
		Runtime.fireEvent('requireUnresolved',
			'Plugins and URLS can not be evaluated at compile-time and will be deferred until runtime.', {
				name: name
		});
	} else {

		// Determine if this is a Titanium module
		if (modules.commonjs && modules.commonjs.hasOwnProperty(name)) {
			isModule = true;
			filePath = modules.commonjs[name];
			moduleInfo = require(path.join(filePath, 'package.json'));
			filePath = path.join(filePath, moduleInfo.main + '.js');
		} else if (['ios', 'iphone', 'ipad'].indexOf(platform) !== -1) { // iOS requires special handling
			isModule = (modules.iphone && modules.iphone.hasOwnProperty(name)) ||
				(modules.ipad && modules.ipad.hasOwnProperty(name));
		} else if (modules[platform] && modules[platform].hasOwnProperty(name)) {
			isModule = true;
		}

		if (isModule) {
			if (filePath) {
				Runtime.fireEvent('requireResolved', 'Module "' + name + '" was resolved to "' + filePath + '"', {
					name: name,
					path: filePath
				});
				if (cache[filePath]) {
					result = cache[filePath];
				} else {
					result = processFile.call(this, filePath, true);
					cache[filePath] = result;
				}
			} else {
				Runtime.fireEvent('requireSkipped',
					'Native modules cannot be evaluated by the Titanium Code Processor', {
						name: name
				});
			}
		} else {

			// Resolve the path
			isModule = !name.match(fileRegExp); // I kinda hate this, but there are too many incorrect usages of require in the wild to implement the spec correctly
			if (name[0] === '.') {
				filePath = path.resolve(path.join(path.dirname(Runtime.getCurrentLocation().filename), name));
				filePath += isModule ? '.js' : '';
			} else {
				filePath = path.resolve(path.join(Runtime.sourceInformation.sourceDir, platform, name));
				filePath += isModule ? '.js' : '';
				if (!existsSync(filePath)) {
					filePath = path.resolve(path.join(Runtime.sourceInformation.sourceDir, name));
					filePath += isModule ? '.js' : '';
				}
			}

			// Make sure that the file exists and then process it
			if (Runtime.fileList.indexOf(filePath) !== -1) {
				if (cache[filePath]) {
					result = cache[filePath];
				} else {
					Runtime.fireEvent('requireResolved', 'Module "' + name + '" was resolved to "' + filePath + '"', {
						name: name,
						path: filePath
					});
					result = processFile.call(this, filePath, isModule);
					cache[filePath] = result;
				}
				this._location = {
					filename: filePath,
					line: 1,
					column: 1
				};
			} else {
				eventDescription = 'The module "' + name + '" could not be found';
				Runtime.fireEvent('requireMissing', eventDescription, {
					name: name,
					path: filePath
				});
				Runtime.reportError('RequireMissing', eventDescription);
			}
		}
	}
	return result;
};

// ******** Helper Methods ********

/**
 * @private
 */
function processFile(filename, createExports) {

	var root,
		results,
		context;

	// Make sure the file exists
	if (existsSync(filename)) {

		// Fire the parsing begin event
		Runtime.fireEvent('enteredFile', 'Entering file "' + filename + '"', {
			filename: filename
		});

		// Read in the file and generate the AST
		root = AST.parse(filename);
		if (!root.syntaxError) {

			// Create the context, checking for strict mode
			context = Base.createModuleContext(root, RuleProcessor.isBlockStrict(root), createExports, false);

			// Process the code
			results = root.processRule()[1];
			Runtime.exitContext();

			// Exit the context and get the results
			if (createExports) {
				results = Base.type(context.thisBinding) === 'Unknown' ? new Base.UnknownType() : context.thisBinding.get('exports');
			}
		} else {
			Runtime.reportUglifyError(root);
			results = new Base.UnknownType();
		}
		this._ast = root;

	} else {
		throw new Error('Internal Error: could not find file "' + filename + '"');
	}
	return results;
}
