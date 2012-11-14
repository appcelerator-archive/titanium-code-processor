/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @module plugins/RequireProvider
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var util = require('util'),
	path = require('path'),
	fs = require('fs'),
	
	Base = require(path.join(global.nodeCodeProcessorLibDir, 'Base')),
	Runtime = require(path.join(global.nodeCodeProcessorLibDir, 'Runtime')),
	CodeProcessor = require(path.join(global.nodeCodeProcessorLibDir, 'CodeProcessor')),
	AST = require(path.join(global.nodeCodeProcessorLibDir, 'AST')),
	RuleProcessor = require(path.join(global.nodeCodeProcessorLibDir, 'RuleProcessor')),
	
	pluginRegExp = /^(.+?)\!(.*)$/,
	fileRegExp = /\.js$/,
	
	platform,
	modules,
	cache = {};


/**
 * Creates an instance of the require provider plugin
 * 
 * @classdesc Provides a CommonJS compliant require() implementation, based on Titanium Mobile's implementations
 * 
 * @constructor
 * @name module:plugins/RequireProvider
 */
module.exports = function (options) {
	platform = options.platform;
	modules = options.modules;
};

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
RequireFunction.prototype.call = function call(thisVal, args) {
	
	// Validate and parse the args
	var name = args && Base.getValue(args[0]),
		filePath,
		result = new Base.UnknownType(),
		isModule,
		eventDescription;
		
	if (!name) {
		name = new Base.UndefinedType();
	}
	
	name = Base.toString(name);
	if (Base.type(name) !== 'String') {
		eventDescription = 'A value that could not be evaluated was passed to require';
		Runtime.fireEvent('requireUnresolved', eventDescription, {
			name: '<Could not evaluate require path>'
		});
		Runtime.reportWarning('requireUnresolved', eventDescription, {
			name: '<Could not evaluate require path>'
		});
		return result;
	}
	name = name.value;
	if (pluginRegExp.test(name) || name.indexOf(':') !== -1) {
		Runtime.fireEvent('requireUnresolved', 
			'Plugins and URLS can not be evaluated at compile-time and will be deferred until runtime.', {
				name: name
		});
	} else {

		// Determine if this is a Titanium module
		if (modules['commonjs'] && modules['commonjs'] && modules['commonjs'].hasOwnProperty(name)) {
			isModule = true;
			filePath = modules['commonjs'][name];
		} else if (modules[platform] && modules[platform] && modules[platform].hasOwnProperty(name)) {
			isModule = true;
		}

		if (isModule) {
			if (filePath) {
				if (cache[filePath]) {
					Runtime.fireEvent('requireResolved', 'The require path "' + filePath + '" was resolved', {
						name: filePath
					});
					result = cache[filePath];
				} else {
					result = processFile(filePath, true)[1];
					cache[filePath] = result;
				}
			} else {
				Runtime.fireEvent('requireUnresolved', 
					'Native modules cannot be evaluated at compile-time and will be deferred until runtime', {
						name: name
				});
			}
		} else {

			// Resolve the path
			isModule = !name.match(fileRegExp); // I kinda hate this, but there are too many incorrect usages of require in the wild to implement the spec correctly
			if (name[0] === '.') {
				filePath = path.resolve(path.join(path.dirname(Runtime.getCurrentLocation().file), name));
				filePath += isModule ? '.js' : '';
			} else {
				filePath = path.resolve(path.join(path.dirname(Runtime.getEntryPointFile()), platform, name));
				filePath += isModule ? '.js' : '';
				if (!fs.existsSync(filePath)) {
					filePath = path.resolve(path.join(path.dirname(Runtime.getEntryPointFile()), name));
					filePath += isModule ? '.js' : '';
				}
			}
					
			// Make sure that the file exists and then process it
			if (fs.existsSync(filePath)) {
				if (cache[filePath]) {
					result = cache[filePath];
				} else {
					Runtime.fireEvent('requireResolved', 'The require path "' + filePath + '" was resolved', {
						name: filePath
					});
					result = processFile(filePath, isModule)[1];
					cache[filePath] = result;
				}
				
			} else {
				eventDescription = 'The require path "' + filePath + '" could not be found';
				Runtime.fireEvent('requireMissing', eventDescription, {
					name: filePath
				});
				Runtime.reportError('requireMissing', eventDescription, {
					name: filePath
				});
			}
		}
	}
	return result;
};

/**
 * Initializes the plugin
 * 
 * @method
 * @name module:plugins/RequireProvider#init
 */
module.exports.prototype.init = function init() {
	Runtime.getGlobalObject().defineOwnProperty('require', {
		value: new RequireFunction(),
		writable: false,
		enumerable: true,
		configurable: true
	}, false, true);
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

// ******** Helper Methods ********

/**
 * @private
 */
function processFile(file, createExports) {
	
	var root,
		results,
		_module,
		_exports,
		context,
		envRec;
	
	// Make sure the file exists
	if (fs.existsSync(file)) {
		
		// Fire the parsing begin event
		Runtime.fireEvent('fileProcessingBegin', 'Processing is beginning for file "' + file + '"', {
			file: file
		});
		Runtime.log('debug', 'Processing file ' + file);
		
		// Read in the file and generate the AST
		root = AST.parse(file);
		if (root) {
	
			// Create the context, checking for strict mode
			context = Base.createGlobalContext(root, RuleProcessor.isBlockStrict(root[1]));
			if (createExports) {
				envRec = context.lexicalEnvironment.envRec;
				_module = new Base.ObjectType(),
				_exports = new Base.ObjectType(),
			
				_module.put('exports', _exports, false);
			
				envRec.createMutableBinding('module', true);
				envRec.setMutableBinding('module', _module);
				envRec.createMutableBinding('exports', true);
				envRec.setMutableBinding('exports', _exports);
			}
		
			// Process the code
			results = RuleProcessor.processRule(root);
			Runtime.exitContext();
		}
		
		// Exit the context and get the results
		if (createExports) {
			results[1] = Base.type(context.thisBinding) === 'Unknown' ? new Base.UnknownType() : _module.get('exports');
		}
		
		// Fire the parsing end event
		Runtime.fireEvent('fileProcessingEnd', 'Processing finished for file "' + file + '"', {
			file: file
		});
		
	} else {
		throw new Error('Internal Error: could not find file "' + file + '"');
	}
	return results;
}