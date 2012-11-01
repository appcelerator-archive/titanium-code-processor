/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * WARNING: The Code Processor IS NOT fully reentrant! A second invokation of the code processor prior to the first 
 * one finishing will kill the first instance and the second invokation may be unstable.
 * 
 * @module CodeProcessor
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

// ******** Requires ********

var path = require('path'),
	fs = require('fs'),
	util = require('util'),
	
	wrench = require('wrench'),
	
	RuleProcessor = require('./RuleProcessor'),
	AST = require('./AST'),
	Base = require('./Base'),
	Runtime = require('./Runtime'),

// ******** Global Variables ********

	rules = wrench.readdirSyncRecursive(path.join(__dirname, 'rules')),
	i = 0,
	len = rules.length,
	
	plugins;

// ******** Put the lib dir in the global space so modules can use it ********

global.nodeCodeProcessorLibDir = __dirname;

// ******** Prime the rules ********
for (; i < len; i++) {
	require(path.join(__dirname, 'rules', rules[i]));
}

// ******** Event Documentation ********

/**
 * Indicates that a file is about to be processed. 
 *
 * @name module:CodeProcessor.fileProcessingBegin
 * @event
 * @property {String} file The absolute path to the file that is about to be processed.
 * @see CodeProcessor#on
 */

/**
 * Indicates that a file has finished being processed. 
 *
 * @name module:CodeProcessor.fileProcessingEnd
 * @event
 * @property {String} file The absolute path to the file that just finished being processed.
 * @see CodeProcessor#on
 */

/**
 * Indicates that the current run of the project is about to be processed. Note tht event tags can cause multiple runs, 
 * and thus multiple instances of this event.
 *
 * @name module:CodeProcessor.projectProcessingBegin
 * @event
 * @see CodeProcessor#on
 */

/**
 * Indicates that the current run of the project has finished being processed. Note tht event tags can cause multiple runs, 
 * and thus multiple instances of this event.
 *
 * @name module:CodeProcessor.projectProcessingEnd
 * @event
 * @see CodeProcessor#on
 */

/**
 * Indicates that all parsing has been completed successfully.
 *
 * @name module:CodeProcessor.processingComplete
 * @event
 * @see CodeProcessor#on
 */

// ******** Application Methods ********

/**
 * Begins to process a project.
 *
 * @method
 * @param {Array[String]} files A list of files to process.
 * @param {Array[String]} pluginList A list of plugins to load. Each name must correspond with a subdirectory containing
 *		a node module in the 'plugins' directory.
 * @param {Winston Logger} logger A logger instance from the CLI (can be a CLI logger, which wraps winston, or a winston logger directly)
 * @param {Object} cli The configuration from the CLI
 * @param {Object} cli.sdks The list of all installed SDK
 * @param {Object} [options] Options for controlling the code processor
 * @param {Boolean} [options.invokeMethods] Indicates whether or not methods should be invoked. Default is true.
 * @param {Boolean} [options.evaluateLoops] Indicates whether or not to evaluate loops. Default is false.
 * @param {Number} [options.maxLoopIterations] The maximum number of iterations a loop can iterate before falling
 *		back to an unknown evaluation (as if evaluateLoops were false). This prevents code with extremely intensive code
 *		or code with infinite loops from taking down the system. Default is 10000.
 * @param {Number} [options.maxLoopIterations] The maximum number of iterations a loop can iterate before falling
 *		back to an unknown evaluation (as if evaluateLoops were false). This prevents code with extremely intensive code
 *		or code with infinite loops from taking down the system. Default is 10000.
 * @param {Number} [options.maxRecursionLimit] Indicates the maximum recursion depth to evaluate before erroring 
 * 		(infinite recursion guard)
 * @param {Number|undefined} [options.executionTimeLimit] Indicates the maximum time the app is allowed to run before erroring.
 *		Undefined means no limit.
 * @param {Boolean} [options.exactMode] Indicates whether or not the app should be evaluated in exact mode. Exact mode does not 
 * 		use ambiguous mode and throws an exception if an Unknown type is encountered.
 * @param {String} [options.sdkPath] The path to the Titanium SDK to use
 * @param {String} [options.platform] The name of the platform being compiled for
 * @param {Object} [options.modules] A dictionary of module ids as keys. If the module is a common js module, the value
 * 		is the path to the module entry point, otherwise the value is null.
 */
exports.process = process;
function process(files, pluginList, options, logger) {
	
	var i = 0,
		len = pluginList && pluginList.length,
		pluginDir = path.resolve(path.join(__dirname, '..', 'plugins')),
		pluginPath,
		tags,
		results,
		j,
		env,
		executionTimeLimit,
		executionTimeLimitTimer,
		globalObject;
		
	// Store the logger
	Runtime.setLogger(logger);
	
	// Process the options
	if (options) {
		
		// Parse the invoke methods option
		if (options.invokeMethods !== undefined) {
			Runtime.options.invokeMethods = !!options.invokeMethods;
		}
		Runtime.log('debug', 'Setting processing option: methods will ' + 
			(Runtime.options.invokeMethods ? '' : 'not ') + 'be invoked');
		
		// Parse the evaluate loops option
		if (options.evaluateLoops !== undefined) {
			Runtime.options.evaluateLoops = !!options.evaluateLoops;
		}
		Runtime.log('debug', 'Setting processing option: loops will ' + 
			(Runtime.options.evaluateLoops ? '' : 'not ') + 'be evaluated');
		
		// Parse the max loop iterations option
		if (options.maxLoopIterations !== undefined) {
			Runtime.options.maxLoopIterations = parseInt(options.maxLoopIterations);
		}
		Runtime.log('debug', 'Setting processing option: max loop iterations is ' + Runtime.options.maxLoopIterations);
		
		// Parse the execution time limit option
		if (options.executionTimeLimit !== undefined) {
			executionTimeLimit = parseInt(options.executionTimeLimit);
			Runtime.log('debug', 'Setting processing option: execution time limit is ' + executionTimeLimit);
		}
		
		// Parse the max recursion limit option
		if (options.maxRecursionLimit !== undefined) {
			Runtime.options.maxRecursionLimit = parseInt(options.maxRecursionLimit);
		}
		Runtime.log('debug', 'Setting processing option: max recursion limit is ' + Runtime.options.maxRecursionLimit);
		
		// Parse the exact mode options
		if (options.exactMode !== undefined) {
			Runtime.options.exactMode = !!options.exactMode;
		}
		Runtime.log('debug', 'Setting processing option: exact mode is ' + 
			(Runtime.options.exactMode ? 'on' : 'off'));
	}
	
	// Load the plugins. If no plugins are specified, load all plugins
	plugins = {};
	if (!pluginList) {
		pluginList = [];
		results = fs.readdirSync(pluginDir);
		for(i = 0, len = results.length; i < len; i++) {
			if (fs.lstatSync(path.join(pluginDir, results[i])).isDirectory()) {
				pluginList.push(results[i]);
			}
		}
	}
	for (i = 0, len = pluginList.length; i < len; i++) {
		pluginPath = path.join(pluginDir, pluginList[i]);
		if (fs.existsSync(pluginPath)) {
			Runtime.log('debug', 'Loading code processor plugin "' + pluginList[i] + '"');
			plugins[pluginList[i]] = new (require(pluginPath))(options);
		}
	}
	// Calculated the time limit
	Runtime.executionTimeLimit = Date.now() + executionTimeLimit;
	
	// Parse the project for all listener sets
	Runtime.log('info', 'Processing source code in ' + files.join(', '));
	tags = Runtime.getTags();
	processingLoop: for (i = 0, len = tags.length; i < len; i++) {
		Runtime.log('debug', 'Processing event listener set "' + tags[i] + '"');
		
		// Load the listener set
		Runtime.loadListenerSet(tags[i]);
		
		// Initialize the runtime
		globalObject = new Base.ObjectType();
		Runtime.setGlobalObject(globalObject);
		env = Base.newObjectEnvironment(globalObject, undefined);
		Runtime.enterContext(new Base.ExecutionContext(
				env,
				env,
				globalObject))
		Base.createThrowTypeErrorFunction();
		Base.injectGlobals();
			
		// Fire the process event
		Runtime.fireEvent('projectProcessingBegin', 'Project processing is beginning');
			
		// Initialize the plugins
		for (j in plugins) {
			plugins[j].init();
		}
			
		// Process the files
		try {
			for(j = 0; j < files.length; j++) {
				results = processFile(files[j], false);
			
				// Check if an exception was thrown
				if (results && results[0] === 'throw') {
					Runtime.reportError('uncaughtException', 'An exception was thrown but not caught: ' + 
						results[1]._lookupProperty('message').value.value, {
							description: 'Uncaught exception',
							exception: results[1]
						});
					break processingLoop;
				}
			}
		} catch (e) {
			if (e.isCodeProcessorException) {
				results = ['throw', Runtime.exception, undefined];
				Runtime.reportError('uncaughtException', 'An exception was thrown but not caught: ' + 
					Runtime.exception._lookupProperty('message').value.value, {
						description: 'Uncaught exception',
						exception: Runtime.exception
					});
				Runtime.exception = undefined;
			} else {
				throw e;
			}
		}
		
		// Fire the process event
		Runtime.fireEvent('projectProcessingEnd', 'Project processing complete');
	}
	if (executionTimeLimit) {
		clearTimeout(executionTimeLimitTimer);
	}
	Runtime.fireEvent('processingComplete', 'All processing is complete');
	return results;
}

/**
 * Gets the results of the code processor.
 * 
 * @method
 * @returns {Object} An object containing three entries: 'errors', 'warnings', and 'plugins'. The plugins entry is
 *		itself an object, with the keys being the names of each plugin.
 */
exports.getResults = getResults;
function getResults() {
	var results = {
			errors: Runtime.getReportedErrors(),
			warnings: Runtime.getReportedWarnings(),
			plugins: {}
		},
		i;
	for(i in plugins) {
		results.plugins[i] = plugins[i].getResults();
	}
	return results;
}

// ******** Plugin Methods ********

/**
 * Processes a file.
 *
 * @function
 * @param {String} file The path to the file to parse
 * @param {Boolean} [createExports] Whether or not to create a <code>module.exports</code> object in the file's context
 * @returns {{@link module:Base.ObjectType} | undefined} The value of module.exports, if one was requested
 */
exports.processFile = processFile;
function processFile(file, createExports) {
	
	var root,
		module,
		results,
		_module,
		_exports,
		context,
		envRec,
		children,
		identifierMap = [],
		rootContext;
	
	// Make sure the file exists
	if (fs.existsSync(file)) {
		
		// Fire the parsing begin event
		Runtime.fireEvent('fileProcessingBegin', 'Processing is beginning for file "' + file + '"', {
			file: file
		});
		
		// Set the current file
		Runtime.setCurrentFile(file);
		
		// Read in the file and generate the AST
		root = AST.parse(file);
		if (root) {
			children = root[1];
			
			rootContext = {
				identifiers: {},
				childContexts: []
			};
			console.dir(createIdentifierMap(rootContext, [root], [rootContext]));
			global.process.exit();
	
			// Create the context, checking for strict mode
			context = Base.createGlobalContext(root, RuleProcessor.isBlockStrict(children));
			envRec = context.lexicalEnvironment.envRec;
			Runtime.enterContext(context);
			if (createExports) {
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
		
		// Restore the previous file
		Runtime.popCurrentFile();
		
		// Fire the parsing end event
		Runtime.fireEvent('fileProcessingEnd', 'Processing finished for file "' + file + '"', {
			file: file
		});
		
	} else {
		throw new Error('Could not load file "' + file + '"');
	}
	return results;
}

// ******** Helper Methods ********

/**
 * @private
 */
function createIdentifierMap(identifierMap, astSet, scopeChain) {
	astSet.forEach(function (ast) {
		AST.walk(ast, {
			'var': function (node, next) {
				var vars = node[1],
					i = 0, len = vars.length;
				for(; i < len; i++) {
					identifierMap.identifiers[vars[i][0]] = {
						references: []
					};
					if (vars[i][1]) {
						identifierMap.identifiers[vars[i][0]].references.push({
							line: node[0].start.line,
							column: node[0].start.col,
							node: node,
							scope: [].concat(scopeChain)
						});
					}
				}
				next();
			},
			'function': function (node, next) {
				var childContext = {
						identifiers: {},
						childContexts: []
					},
					i, len;
				if (node[1]) {
					childContext.identifiers[node[1]] = {
						references: []
					};
				}
				if (node[2]) {
					for(i = 0, len = node[2].length; i < len; i++) {
						childContext.identifiers[node[2][i]] = {
							references: []
						};
					}
				}
				scopeChain.push(childContext);
				identifierMap.childContexts.push(createIdentifierMap(childContext, node[3], scopeChain));
			},
			'defun': function (node, next) {
				var childContext = {
						identifiers: {},
						childContexts: []
					},
					i, len;
				identifierMap.identifiers[node[1]] = {
					references: []
				};
				if (node[2]) {
					for(i = 0, len = node[2].length; i < len; i++) {
						childContext.identifiers[node[2][i]] = {
							references: []
						};
					}
				}
				scopeChain.push(childContext);
				identifierMap.childContexts.push(createIdentifierMap(childContext, node[3], scopeChain));
			},
			'name': function (node, next) {
				var name = node[1],
					localScope = [].concat(scopeChain);
				contextMap = localScope.pop();
				if (name !== 'true' && name !== 'false' && name !== 'null' && name !== 'this') {
					while(contextMap) {
						if (contextMap.identifiers[name]) {
							contextMap.identifiers[name].references.push({
								line: node[0].start.line,
								column: node[0].start.col,
								ruleType: 'name'
							});
							break;
						} else if (!localScope.length) {
							contextMap.identifiers[name] = {
								references: [{
									line: node[0].start.line,
									column: node[0].start.col,
									node: node,
									scope: [].concat(scopeChain)
								}]
							}
							break;
						}
						contextMap = localScope.pop();
					}
				}
				next();
			}
		});	
	});
	scopeChain.pop();
	return identifierMap;
}