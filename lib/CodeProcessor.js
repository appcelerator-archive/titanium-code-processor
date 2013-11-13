/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * WARNING: The Code Processor IS NOT reentrant! A second invokation of the code processor prior to the first
 * one finishing will kill the first instance and the second invokation may be unstable. A second invokation of the code
 * processor after the first has finished is untested and not likely to work.
 *
 * @module CodeProcessor
 */

// ******** Globals ********

var path = require('path'),
	fs = require('fs'),
	async = require('async'),

	wrench = require('wrench'),
	uglify = require('uglify-js'),
	mu = require('mu2'),
	sourcemap = require('source-map'),

	RuleProcessor = require('./RuleProcessor'),
	AST = require('./AST'),
	Base = require('./Base'),
	Runtime = require('./Runtime'),
	CodeProcessorUtils = require('./CodeProcessorUtils'),

	pluralize = CodeProcessorUtils.pluralize,

	startTime = Date.now();

// ******** Prime the rules ********
(function(){
	var rules = CodeProcessorUtils.findJavaScriptFiles(path.join(__dirname, 'rules')),
		i,
		len = rules.length;
	for (i = 0; i < len; i++) {
		require(rules[i]);
	}
})();

// ******** Put the lib dir in the global space so modules can use it ********

global.titaniumCodeProcessorLibDir = __dirname;

// ******** Event Documentation ********

/**
 * Indicates that a file is about to be processed.
 *
 * @name module:CodeProcessor.enteredFile
 * @event
 * @property {string} type The type of the event
 * @property {string} description The description of the event
 * @property {(string | undefined)} filename The name of the file being processed when the event was triggered, if any
 * @property {(number | undefined)} line The line number of the file being processed when the event was triggered, if any
 * @property {(number | undefined)} column The column number of the file being processed when the event was triggered, if any
 * @property {Object} data The event-specific information
 * @property {string} data.filename The absolute path to the file that is about to be processed
 */

/**
 * Indicates that the current run of the project is about to be processed
 *
 * @name module:CodeProcessor.projectProcessingBegin
 * @event
 * @property {string} type The type of the event
 * @property {string} description The description of the event
 * @property {(string | undefined)} filename The name of the file being processed when the event was triggered, if any
 * @property {(number | undefined)} line The line number of the file being processed when the event was triggered, if any
 * @property {(number | undefined)} column The column number of the file being processed when the event was triggered, if any
 */

/**
 * Indicates that the current run of the project has finished being processed
 *
 * @name module:CodeProcessor.projectProcessingEnd
 * @event
 * @property {string} type The type of the event
 * @property {string} description The description of the event
 * @property {(string | undefined)} filename The name of the file being processed when the event was triggered, if any
 * @property {(number | undefined)} line The line number of the file being processed when the event was triggered, if any
 * @property {(number | undefined)} column The column number of the file being processed when the event was triggered, if any
 */

/**
 * Indicates that a global variable was just created because the identifier name was not declared anywhere
 *
 * @name module:CodeProcessor.undeclaredGlobalVariableCreated
 * @event
 * @property {string} type The type of the event
 * @property {string} description The description of the event
 * @property {(string | undefined)} filename The name of the file being processed when the event was triggered, if any
 * @property {(number | undefined)} line The line number of the file being processed when the event was triggered, if any
 * @property {(number | undefined)} column The column number of the file being processed when the event was triggered, if any
 * @property {Object} data The event-specific information
 * @property {string} data.name The name of the global variable that was just created
 */

/**
 * The maximum recursion, as specified in {@link module:Runtime.options.maxRecursionLimit}, was reached
 *
 * @name module:CodeProcessor.maxRecusionLimitReached
 * @event
 * @property {string} type The type of the event
 * @property {string} description The description of the event
 * @property {(string | undefined)} filename The name of the file being processed when the event was triggered, if any
 * @property {(number | undefined)} line The line number of the file being processed when the event was triggered, if any
 * @property {(number | undefined)} column The column number of the file being processed when the event was triggered, if any
 */

/**
 * The maximum loop iteration limit, as specified in {@link module:Runtime.options.maxLoopIterations}, was reached
 *
 * @name module:CodeProcessor.maxIterationsExceeded
 * @event
 * @property {string} type The type of the event
 * @property {string} description The description of the event
 * @property {(string | undefined)} filename The name of the file being processed when the event was triggered, if any
 * @property {(number | undefined)} line The line number of the file being processed when the event was triggered, if any
 * @property {(number | undefined)} column The column number of the file being processed when the event was triggered, if any
 */

/**
 * An error was reported
 *
 * @name module:CodeProcessor.errorReported
 * @event
 * @property {string} type The type of the event
 * @property {string} description The description of the event
 * @property {(string | undefined)} filename The name of the file being processed when the event was triggered, if any
 * @property {(number | undefined)} line The line number of the file being processed when the event was triggered, if any
 * @property {(number | undefined)} column The column number of the file being processed when the event was triggered, if any
 * @property {Object} data The event-specific information
 * @property {string} type The type of error, e.g. "SyntaxError"
 * @property {string} description A description of the error
 */

/**
 * A warning was reported
 *
 * @name module:CodeProcessor.warningReported
 * @event
 * @property {string} type The type of the event
 * @property {string} description The description of the event
 * @property {(string | undefined)} filename The name of the file being processed when the event was triggered, if any
 * @property {(number | undefined)} line The line number of the file being processed when the event was triggered, if any
 * @property {(number | undefined)} column The column number of the file being processed when the event was triggered, if any
 * @property {Object} data The event-specific information
 * @property {string} type The type of warning, e.g. "deprecatedTiPropertyReferenced"
 * @property {string} description A description of the warning
 */

// ******** API Methods ********

/**
 * The query plugin callback definition
 *
 * @callback module:CodeProcessor.queryPluginsCallback
 * @param {string} error The error, if one occured
 * @param {Object} results The plugin information, varies from plugin to plugin (see plugin documentation for details)
 */
/**
 * Queries all plugins found in the supplied search paths for their information
 *
 * @method module:CodeProcessor.queryPlugins
 * @param {Array.<string>} paths An array of paths to search in addition to the default path. Can be an empty array, but must not be undefined
 * @param {Object} logger A Winston logger instance
 * @param {module:CodeProcessor.queryPluginsCallback} callback The callback to call when finished
 */
exports.queryPlugins = queryPlugins;
function queryPlugins(pluginPaths, logger, callback) {
	var pluginResolutionTasks = [],
		pluginInfo = {};
	pluginPaths = [path.resolve(path.join(__dirname, '..', 'plugins'))].concat(pluginPaths),

	pluginPaths.forEach(function (pluginPath) {
		pluginResolutionTasks.push(function (next) {
			next(undefined, CodeProcessorUtils.getSubDirectories(pluginPath));
		});
	});

	async.parallel(pluginResolutionTasks, function (err, results) {
		if (err) {
			callback(err);
		} else {
			var pluginDirectories = [],
				i, len,
				pluginParseTasks = [];
			for (i = 0, len = results.length; i < len; i++) {
				pluginDirectories = pluginDirectories.concat(results[i]);
			}
			pluginDirectories.forEach(function (pluginDirectory) {
				pluginParseTasks.push(function (next) {
					fs.readFile(path.join(pluginDirectory, 'package.json'), 'utf-8', function (err, data) {
						var pluginData;
						if (err) {
							logger.warn('warn: Could not read plugin information in "' + pluginDirectory + '": ' + err);
							next();
						} else {
							try {
								pluginData = JSON.parse(data);
								if (pluginData.titaniumCodeProcessorPlugin === true) {
									pluginData.path = pluginDirectory;
									pluginInfo[pluginData.name] = pluginData;
								}
							} catch(e) {
								logger.warn('warn: Could not parse plugin information in "' + pluginDirectory + '": ' + e);
							}
							next();
						}
					});
				});
			});
			async.parallel(pluginParseTasks, function () {
				callback(undefined, pluginInfo);
			});
		}
	});
}

/**
 * The query options callback definition
 *
 * @callback module:CodeProcessor.queryOptionsCallback
 * @param {string} error The error, if one occured
 * @param {Object} results The information for each option
 * @param {Object} results.entry A single option entry, where "entry" is the name of the option
 * @param {string} results.entry.description A description of the option
 * @param {primitive} results.entry.defaultValue The default value of the option
 * @param {boolean} results.entry.require Whether or not the option is required
 * @param {Array.<{type: string}>} results.entry.types An array of type definitions
 */
/**
 * Queries the set of options
 *
 * @method
 * @param {module:CodeProcessor.queryOptionsCallback} callback The callback to call when finished
 */
exports.queryOptions = queryOptions;
function queryOptions(callback) {
	callback(undefined, {
		invokeMethods: {
			description: 'Whether or not methods should be invoked',
			types: [{
				type: 'boolean'
			}],
			defaultValue: Runtime.options.invokeMethods,
			required: false
		},
		evaluateLoops: {
			description: 'Whether or not to evaluate loops',
			types: [{
				type: 'boolean'
			}],
			defaultValue: Runtime.options.evaluateLoops,
			required: false
		},
		maxLoopIterations: {
			description: 'The maximum number of iterations a loop can iterate before falling back to an unknown evaluation',
			types: [{
				type: 'number'
			}],
			defaultValue: Runtime.options.maxLoopIterations,
			required: false
		},
		maxRecursionLimit: {
			description: 'The maximum recursion depth to evaluate before throwing a RangeError exception',
			types: [{
				type: 'number'
			}],
			defaultValue: Runtime.options.maxRecursionLimit,
			required: false
		},
		logConsoleCalls: {
			description: 'If enabled, all console.* calls in a user\'s code are logged to the terminal',
			types: [{
				type: 'boolean'
			}],
			defaultValue: Runtime.options.logConsoleCalls,
			required: false
		},
		executionTimeLimit: {
			description: 'The maximum time the app is allowed to run before erroring. 0 means no time limit',
			types: [{
				type: 'number'
			}],
			defaultValue: Runtime.options.executionTimeLimit,
			required: false
		},
		exactMode: {
			description: 'whether or not the app should be evaluated in exact mode. Exact mode does not use ambiguous' +
				' modes and throws an exception if an Unknown type is encountered',
			types: [{
				type: 'boolean'
			}],
			defaultValue: Runtime.options.exactMode,
			required: false
		},
		nativeExceptionRecovery: {
			description: 'whether or not to try and recover from recoverable native exceptions when not in try/catch statements',
			types: [{
				type: 'boolean'
			}],
			defaultValue: Runtime.options.nativeExceptionRecovery,
			required: false
		},
		processUnvisitedCode: {
			description: 'When set to true, all nodes and files that are not visited/skipped will be processed in ambiguous' +
				' mode after all other code has been processed. While this will cause more of a project to be analyzed,' +
				' this will decrease accuracy and can generate a lot of false positives',
			types: [{
				type: 'boolean'
			}],
			defaultValue: Runtime.options.processUnvisitedCode,
			required: false
		},
		cycleDetectionStackSize: {
			description: 'The size of the cycle detection stack. Cycles that are larger than this size will not be caught',
			types: [{
				type: 'number'
			}],
			defaultValue: Runtime.options.cycleDetectionStackSize,
			required: false
		},
		maxCycles: {
			description: 'The maximum number of cycles to allow before throwing an exception',
			types: [{
				type: 'number'
			}],
			defaultValue: Runtime.options.maxCycles,
			require: false
		}
	});
}

/**
 * Source information for a project
 *
 * @typedef {Object} module:CodeProcessor.sourceInformation
 * @property {string} projectDir The project directory
 * @property {string} sourceDir The directory containing the source code (e.g. <project dir>/Resources)
 * @property {string} entryPoint The entry point of the project
 * @property {string} [sourceMapDir] The directory containing the source maps for the project
 *		(e.g. <project dir>/build/map/Resources for Alloy apps)
 * @property {string} [originalSourceDir] The directory containing the original source code that the
 */
/**
 * Plugin information
 *
 * @typedef {Object} module:CodeProcessor.pluginInformation
 * @property {string} path The path to the plugin directory
 * @property {Object} options The plugin specific options used to initialize the plugin
 * @property {boolean} suppressOutput Whether or not to exclude the plugin results from the output
 */
/**
 * Processes the entry point using the supplied options and plugins. The function calls the other functions in this module,
 * so it is not necessary to call them separately if calling this function.
 *
 * @method
 * @param {module:CodeProcessor.sourceInformation} sourceInformation The source information for the project
 * @param {Object} options The options for the run. See {@link module:CodeProcessor.queryOptions} for more info
 * @param {Object} plugins The plugins to load. Each key is the name of the plugin, and the value is the plugin information
 * @param {module:CodeProcessor.pluginInformation} plugins.entry A plugin entry, whose name is "entry"
 * @param {(Object | undefined)} logger A logger instance from the CLI (can be a CLI logger, which wraps winston, or a winston logger directly)
 * @param {Function} callback The callback to call once processing is complete (takes no arguments)
 */
exports.run = run;
function run(sourceInformation, options, plugins, logger, callback) {

	var results;
	options = options || {};
	plugins = plugins || {};

	try {
		Runtime.setLogger(logger);

		init(sourceInformation, options, plugins);

		Runtime.on('enteredFile', function(e) {
			Runtime.log('debug', 'Entering file ' + e.data.filename);
		});

		Runtime.fireEvent('projectProcessingBegin', 'Project processing is beginning');

		Runtime.log('info', 'Analyzing project');
		results = processEntryPoint(sourceInformation.entryPoint);

		Runtime.log('info', 'Processing queued functions');
		processQueuedFunctions();

		if (Runtime.options.processUnvisitedCode) {
			Runtime.log('info', 'Processing unvisited code');
			processUnvisitedCode();
		}

		finalize();

		Runtime.log('info', 'Generating results');
		Runtime.fireEvent('projectProcessingEnd', 'Project processing complete');
		generateResultsPages(options.outputFormat, Runtime.options.resultsPath, Runtime.options.resultsTheme, callback);
		if (options.outputFormat === 'stream') {
			var endEvent = JSON.stringify({'projectProcessingEnd':true});
			console.log('REQ,01000002,' + ('00000000' + endEvent.length.toString(16)).slice(-8) + ',' + endEvent);
		}
	} catch(e) {
		if (e.message === 'Maximum call stack size exceeded') {
			console.error('node.js maximum call stack size exceeded. Increasing the stack size may allow the project to be fully analyzed');
		} else {
			console.error('Internal error ' + e.message + '. Please file a bug report at http://jira.appcelerator.org/');
			if (e.stack) {
				Runtime.log('debug', e.stack);
			}
		}
		process.exit(1);
	}

	return results;
}

/**
 * Processes the input options
 *
 * @method
 * @param {module:CodeProcessor.sourceInformation} sourceInformation The source information for the project
 * @param {Object} options The options for the run. See {@link module:CodeProcessor.queryOptions} for more info
 * @param {Object} plugins The plugins to load. Each key is the name of the plugin, and the value is the plugin information
 * @param {module:CodeProcessor.pluginInformation} plugins.entry A plugin entry, whose name is "entry"
 * @param {module:AST.node} ast The root ast for the entry point file. Used to initialize the global namespace
 */
exports.init = init;
function init(sourceInformation, options, plugins, ast) {
	var i, ilen, j, jlen, k, klen,
		loadedPlugins = [],
		pkg,
		dependencyFound,
		pluginDefinitions = [],
		pluginDependencyOrder = [],
		unsortedPlugins,
		changed,
		dependencies,
		numPlugins = plugins.length,
		sourceMapDir,
		sourceMapsFiles,
		sourceMaps = {},
		sourceMap,
		sourceMapRegex = /\.map$/,
		projectRoot = sourceInformation.projectDir,
		whiteList,
		whiteListPlatforms = ['', 'iphone', 'ipad', 'ios', 'android', 'mobileweb', 'tizen', 'blackberry'];

	// Parse the invoke methods option
	if (options.hasOwnProperty('invokeMethods')) {
		Runtime.options.invokeMethods = !!options.invokeMethods;
	}
	Runtime.log('debug', 'Setting processing option: methods will ' +
		(Runtime.options.invokeMethods ? '' : 'not ') + 'be invoked');

	// Parse the evaluate loops option
	if (options.hasOwnProperty('evaluateLoops')) {
		Runtime.options.evaluateLoops = !!options.evaluateLoops;
	}
	Runtime.log('debug', 'Setting processing option: loops will ' +
		(Runtime.options.evaluateLoops ? '' : 'not ') + 'be evaluated');

	// Parse the max loop iterations option
	if (options.hasOwnProperty('maxLoopIterations')) {
		Runtime.options.maxLoopIterations = parseInt(options.maxLoopIterations, 10);
	}
	Runtime.log('debug', 'Setting processing option: max loop iterations is ' + Runtime.options.maxLoopIterations);

	// Parse the log console calls option
	if (options.hasOwnProperty('logConsoleCalls')) {
		Runtime.options.logConsoleCalls = !!options.logConsoleCalls;
	}
	Runtime.log('debug', 'Setting processing option: console calls will ' +
		(Runtime.options.logConsoleCalls ? '' : 'not ') + 'be logged to the terminal');

	// Parse the execution time limit option
	if (options.hasOwnProperty('executionTimeLimit')) {
		Runtime.options.executionTimeLimit = parseInt(options.executionTimeLimit, 10);
		Runtime.log('debug', 'Setting processing option: execution time limit is ' + Runtime.options.executionTimeLimit);
	}

	// Parse the max recursion limit option
	if (options.hasOwnProperty('maxRecursionLimit')) {
		Runtime.options.maxRecursionLimit = parseInt(options.maxRecursionLimit, 10);
	}
	Runtime.log('debug', 'Setting processing option: max recursion limit is ' + Runtime.options.maxRecursionLimit);

	// Parse the cycle detection stack size option
	if (options.hasOwnProperty('cycleDetectionStackSize')) {
		Runtime.options.cycleDetectionStackSize = parseInt(options.cycleDetectionStackSize, 10);
	}
	Runtime.log('debug', 'Setting processing option: cycle detection stack size is ' + Runtime.options.cycleDetectionStackSize);

	// Parse the max cycles limit option
	if (options.hasOwnProperty('maxCycles')) {
		Runtime.options.maxCycles = parseInt(options.maxCycles, 10);
	}
	Runtime.log('debug', 'Setting processing option: max cycle limit is ' + Runtime.options.maxCycles);

	// Parse the exact mode options
	if (options.hasOwnProperty('exactMode')) {
		Runtime.options.exactMode = !!options.exactMode;
	}
	Runtime.log('debug', 'Setting processing option: exact mode is ' + (Runtime.options.exactMode ? 'on' : 'off'));

	// Parse the process unvisited code option
	if (options.hasOwnProperty('processUnvisitedCode')) {
		Runtime.options.processUnvisitedCode = !!options.processUnvisitedCode;
	}
	Runtime.log('debug', 'Setting processing option: unvisited code will ' +
		(Runtime.options.processUnvisitedCode ? '' : 'not ') + 'be processed');

	// Parse the native exception recovery option
	if (options.hasOwnProperty('nativeExceptionRecovery')) {
		Runtime.options.nativeExceptionRecovery = !!options.nativeExceptionRecovery;
	}
	Runtime.log('debug', 'Setting processing option: native exception recovery is ' +
		(Runtime.options.nativeExceptionRecovery ? 'enabled' : 'disabled'));

	// Parse the resultsPath option
	if (options.hasOwnProperty('resultsPath')) {
		Runtime.options.resultsPath = options.resultsPath;
	}
	Runtime.log('debug', 'Setting processing option: ' + (Runtime.options.resultsPath ? 'the results path is "' +
		Runtime.options.resultsPath + '"' : 'no results path is set'));

	// Parse the resultsTheme option
	if (options.hasOwnProperty('resultsTheme')) {
		Runtime.options.resultsTheme = options.resultsTheme;
	}
	Runtime.log('debug', 'Setting processing option: ' + (Runtime.options.resultsTheme ? 'the results theme is "' +
		Runtime.options.resultsTheme + '"' : 'no results theme is set'));

	// Calculated the time limit
	if (Runtime.options.executionTimeLimit) {
		Runtime.executionTimeLimit = Date.now() + Runtime.options.executionTimeLimit;
	}

	// Iinitialize the whitelist
	whiteList = [ path.join(projectRoot, 'modules') ];
	if (fs.existsSync(path.join(projectRoot, 'app'))) {

		// TODO: update to be dynamic from ti-api-provider or something
		whiteListPlatforms.forEach(function (platform) {

			// Calculate the root path
			var rootPath = [ projectRoot, 'Resources' ],
				sourceRootPath = [projectRoot, 'app' ],
				rootContents,
				jsRegex = /\.js$/;
			if (platform) {
				rootPath.push(platform);
				sourceRootPath.push(platform);
			}
			rootPath.push('alloy');
			sourceRootPath.push('alloy');
			rootPath = path.join.apply(path, rootPath);
			sourceRootPath = path.join.apply(path, sourceRootPath);

			// If the path doesn't exist, then that means the platform isn't being used, so bail out early
			if (!fs.existsSync(rootPath)) {
				return;
			}

			// Check the base directories
			['controllers', 'models', 'styles', 'sync', 'widgets'].forEach(function(component) {
				if (fs.existsSync(path.join(rootPath, component))) {
					whiteList.push(path.join(rootPath, component));
				}
			});

			// Check for lib/ and assets/ files
			rootPath = path.dirname(rootPath);
			sourceRootPath = path.dirname(sourceRootPath);
			rootContents = fs.readdirSync(rootPath);
			rootContents.forEach(function (file) {
				var filePath = path.join(rootPath, file);
				if ((jsRegex.test(file) || fs.statSync(filePath).isDirectory() && whiteListPlatforms.indexOf(file) == -1) &&
						(fs.existsSync(path.join(sourceRootPath, 'lib', file)) ||
						fs.existsSync(path.join(sourceRootPath, 'assets', file)))) {
					whiteList.push(filePath);
				}
			});
		});
	} else {
		whiteList.push(path.join(projectRoot, 'Resources'));
	}
	Runtime.options.whiteList = whiteList;

	// Load the source maps
	if (sourceInformation && sourceInformation.sourceMapDir) {
		sourceMapDir = sourceInformation.sourceMapDir;
		if (!fs.existsSync(sourceMapDir)) {
			console.error('Source map directory "' + sourceMapDir + '" does not exist');
			process.exit(1);
		}
		sourceMapsFiles = wrench.readdirSyncRecursive(sourceMapDir);
		for (i = 0, ilen = sourceMapsFiles.length; i < ilen; i++) {
			sourceMap = path.join(sourceMapDir, sourceMapsFiles[i]);
			if (sourceMapRegex.test(sourceMap)) {
				try {
					sourceMaps[sourceMapsFiles[i].replace(sourceMapRegex, '')] =
						new sourcemap.SourceMapConsumer(JSON.parse(fs.readFileSync(sourceMap).toString()));
				} catch (e) {
					console.error('Could not parse source map file "' + sourceMap + '": ' + e.message);
					process.exit(1);
				}
			}
		}
		sourceInformation.sourceMaps = sourceMaps;
	}

	// Initialize the runtime
	Runtime.log('info', 'Initializing core engine');
	Base.init(ast);
	Runtime.sourceInformation = sourceInformation;

	// Load the plugins
	for (i = 0; i < numPlugins; i++) {
		try {
			pkg = JSON.parse(fs.readFileSync(path.join(plugins[i].path, 'package.json')));
			Runtime.log('debug', 'Loading code processor plugin ' + pkg.name);
			pluginDefinitions[i] = pkg;
		} catch(e) {
			console.error('Could not parse "' + path.join(plugins[i].path, 'package.json') + '": ' + e);
			process.exit(1);
		}
	}
	unsortedPlugins = [].concat(pluginDefinitions);
	while (unsortedPlugins.length) {
		changed = false;
		for (i = 0, ilen = unsortedPlugins.length; i < ilen; i++) {
			dependencies = Object.keys(unsortedPlugins[i].dependencies);
			if (dependencies.length) {
				dependencyFound = dependencies.length;
				for (j = 0, jlen = pluginDependencyOrder.length; j < jlen; j++) {
					for (k = 0, klen = dependencies.length; k < klen; k++) {
						if (pluginDependencyOrder[j].name === dependencies[k]) {
							dependencyFound--;
						}
					}
				}
				if (dependencyFound === 0) {
					changed = true;
					pluginDependencyOrder.push(unsortedPlugins.splice(i, 1)[0]);
					break;
				}
			} else {
				changed = true;
				pluginDependencyOrder.push(unsortedPlugins.splice(i, 1)[0]);
				break;
			}
		}
		if (!changed) {
			console.error('Circular or missing plugin dependency detected, cannot load plugins');
			process.exit(1);
		}
	}
	for (i = 0; i < numPlugins; i++) {
		for (j = 0; j < numPlugins; j++) {
			if (pluginDependencyOrder[i].name === pluginDefinitions[j].name) {
				Runtime.log('debug', 'Initializing plugin ' + pluginDefinitions[j].name);
				dependencies = [];
				for (k = 0; k < numPlugins; k++) {
					if (loadedPlugins[k] && loadedPlugins[k].name in pluginDefinitions[j].dependencies) {
						dependencies.push(loadedPlugins[k]);
					}
				}
				loadedPlugins[j] = require(plugins[j].path);
				loadedPlugins[j].name = pluginDefinitions[j].name;
				loadedPlugins[j].displayName = pluginDefinitions[j].displayName;
				loadedPlugins[j].suppressOutput = plugins[j].suppressOutput;
				if (loadedPlugins[j].init) {
					loadedPlugins[j].init(plugins[j].options, dependencies);
				}
				break;
			}
		}
	}
	Runtime.plugins = loadedPlugins;

	// Calculate the list of viable files
	if (sourceInformation) {
		Runtime.fileList = CodeProcessorUtils.findJavaScriptFiles(sourceInformation.sourceDir);
	}
	Runtime.fireEvent('fileListSet', 'The list of files in the project was set', {
		fileList: Runtime.fileList
	});
}

/**
 * Finalizes the state of the code processor
 *
 * @method
 */
exports.finalize = finalize;
function finalize() {
	var id,
		astSet = Runtime.getASTSet(),
		ambiguousBlockSemaphoreStack = [0],
		ambiguousContextSemaphoreStack = [false],
		unknownSemaphoreStack = [0];

	// Exit the global context
	Base.exitContext();

	// Mark all ambiguous blocks and contexts as ambiguous
	function nodeCallback(node, descend) {
		var isFunction = node instanceof uglify.AST_Defun || node instanceof uglify.AST_Function,
			currentStackLocation,
			taggedAsAmbiguousContext = node._ambiguousContext,
			taggedAsAmbiguousBlock = node._ambiguousBlock,
			taggedAsUnknown = node._unknown;
		if (isFunction) {
			ambiguousBlockSemaphoreStack.push(0);
			ambiguousContextSemaphoreStack.push(0);
			unknownSemaphoreStack.push(0);
		}
		currentStackLocation = ambiguousContextSemaphoreStack.length - 1;
		if (taggedAsAmbiguousBlock ) {
			ambiguousBlockSemaphoreStack[currentStackLocation]++;
		}
		if (taggedAsAmbiguousContext) {
			ambiguousContextSemaphoreStack[currentStackLocation]++;
		}
		if (taggedAsUnknown) {
			unknownSemaphoreStack[currentStackLocation]++;
		}

		if (ambiguousBlockSemaphoreStack[currentStackLocation]) {
			node._ambiguousBlock = true;
		}
		if (ambiguousContextSemaphoreStack[currentStackLocation]) {
			node._ambiguousContext = true;
		}
		if (unknownSemaphoreStack[currentStackLocation]) {
			node._unknown = true;
		}

		descend();

		if (taggedAsAmbiguousBlock ) {
			ambiguousBlockSemaphoreStack[currentStackLocation]--;
		}
		if (taggedAsAmbiguousContext) {
			ambiguousContextSemaphoreStack[currentStackLocation]--;
		}
		if (taggedAsUnknown) {
			unknownSemaphoreStack[currentStackLocation]--;
		}
		if (isFunction) {
			ambiguousBlockSemaphoreStack.pop();
			ambiguousContextSemaphoreStack.pop();
		}
		return true;
	}
	for (id in astSet) {
		astSet[id].walk(new uglify.TreeWalker(nodeCallback));
	}
}

/**
 * Processes the input options
 *
 * @method
 * @param {string} entrpoint The path to the entry point
 * @return {Array} The return value tuple of the top level statement
 */
exports.processEntryPoint = processEntryPoint;
function processEntryPoint(entryPoint) {

	var ast,
		results;

	// Process the project
	try {
		debugger;

		// Make sure the entryPoint exists
		if (fs.existsSync(entryPoint)) {

			// Fire the parsing begin event
			Runtime.fireEvent('enteredFile', 'Entering file "' + entryPoint + '"', {
				filename: entryPoint
			});

			// Read in the entryPoint and generate the AST
			ast = AST.parse(entryPoint);
			if (!ast.syntaxError) {
				Runtime._unknown = false;
				Base.createModuleContext(ast, RuleProcessor.isBlockStrict(ast), false, false);
				try {
					results = ast.processRule();
				} finally {
					Base.exitContext();
				}
			} else {
				Runtime.reportUglifyError(ast);
			}

		} else {
			throw new Error('Internal Error: could not find file "' + entryPoint + '"');
		}

		// Check if an exception was thrown
		if (results && results[0] === 'throw') {
			Runtime.reportError('uncaughtException', Base.getsExceptionMessage(results[1]._exception), results[1]._exception.stackTrace);
		}
	} catch (e) {
		if (e.isCodeProcessorException) {
			results = ['throw', Runtime._exception, undefined];
			Runtime.reportError('uncaughtException', Base.getsExceptionMessage(Runtime._exception), Runtime._exception.stackTrace);
			Runtime._exception = undefined;
		} else {
			throw e;
		}
	}

	return results;
}

/**
 * Processes all queued functions, taking into account functions that were queued while processing a queued function
 *
 * @method
 */
exports.processQueuedFunctions = processQueuedFunctions;
function processQueuedFunctions() {

	var queuedFunction;

	// Process any queued functions
	while (queuedFunction = Runtime.getNextQueuedFunction()) {

		Runtime.log('debug', 'Evaluating queued function at ' + queuedFunction.filename + ':' + queuedFunction.line);
		try {
			if (queuedFunction.skippedContext) {
				Base.processInSkippedMode(queuedFunction.func.callFunction.bind(queuedFunction.func, queuedFunction.thisVal, queuedFunction.args, {
					isAmbiguousContext: queuedFunction.ambiguousContext
				}));
			} else {
				queuedFunction.func.callFunction(queuedFunction.thisVal, queuedFunction.args, {
					isAmbiguousContext: queuedFunction.ambiguousContext
				});
			}
		} catch (e) {
			if (e.isCodeProcessorException) {
				Runtime.reportError('uncaughtException', Base.getsExceptionMessage(Runtime._exception), RuleProcessor.getStackTrace());
				Runtime._exception = undefined;
			} else {
				throw e;
			}
		}
	}
}

/**
 * Processes all unvisited code, if the appropriate option was set
 *
 * @method
 */
exports.processUnvisitedCode = processUnvisitedCode;
function processUnvisitedCode() {
	var unprocessedFile,
		unprocessedFunction,
		ast,
		funcObject,
		args,
		i,
		previousAmbiguousSetting;

	while (unprocessedFile = Runtime.getUnprocessedFilesList()[0]) {

		Runtime.log('debug', 'Processing unprocessed file ' + unprocessedFile);

		// Fire the parsing begin event
		Runtime.fireEvent('enteredFile', 'Entering file "' + unprocessedFile + '"', {
			filename: unprocessedFile
		});

		// Read in the entryPoint and generate the AST
		ast = AST.parse(unprocessedFile);
		if (!ast.syntaxError) {

			// Create the module context
			Base.createModuleContext(ast, RuleProcessor.isBlockStrict(ast), true, true);

			// Process the code
			Runtime._unknown = false;
			try {
				ast.processRule();
			} catch (e) {
				if (e.isCodeProcessorException) {
					Runtime.reportError('uncaughtException', Base.getsExceptionMessage(Runtime._exception), RuleProcessor.getStackTrace());
					Runtime._exception = undefined;
				} else {
					throw e;
				}
			} finally {
				// Exit the module context
				Base.exitContext();
			}
		} else {
			Runtime.reportUglifyError(ast);
		}
	}

	Runtime.log('debug', 'Processing unvisited functions');
	while (unprocessedFunction = Runtime.getNextUnprocessedFunction()) {

		Runtime.log('debug', 'Evaluating unprocessed function at ' + unprocessedFunction.start.file + ':' + unprocessedFunction.start.line);

		unprocessedFunction._lastKnownContext._ambiguousContext = true;
		Base.enterContext(unprocessedFunction._lastKnownContext);

		// Function definitions are instantiated as part of identifier binding in the context creation, but function exrpessions are not
		if (unprocessedFunction.className === 'AST_Defun') {
			funcObject = unprocessedFunction._funcObject;
		} else {
			funcObject = unprocessedFunction.processRule();
		}

		// Create unknown arguments set to the length of the expected args
		args = [];
		for (i = 0; i < funcObject.formalParameters.length; i++) {
			args.push(new Base.UnknownType());
		}

		try {
			funcObject.callFunction(new Base.UnknownType(), args, {
				isAmbiguousContext: true,
				alwaysInvoke: true
			});
		} catch (e) {
			if (e.isCodeProcessorException) {
				Runtime.reportError('uncaughtException', Base.getsExceptionMessage(Runtime._exception), RuleProcessor.getStackTrace());
				Runtime._exception = undefined;
			} else {
				throw e;
			}
		} finally {
			Base.exitContext();
		}

		unprocessedFunction._lastKnownContext._ambiguousContext = previousAmbiguousSetting;
	}
}

/**
 * The results object
 *
 * @typedef {Object} module:CodeProcessor.getResultsReturnValue
 * @property {Array.<Object>} errors The errors found in the project
 * @property {Object} errors.entry A single error entry
 * @property {string} errors.entry.type The type of the event
 * @property {string} errors.entry.description The description of the event
 * @property {(string | undefined)} errors.entry.filename The name of the file being processed when the event was triggered, if any
 * @property {(number | undefined)} errors.entry.line The line number of the file being processed when the event was triggered, if any
 * @property {(number | undefined)} errors.entry.column The column number of the file being processed when the event was triggered, if any
 * @property {Object} errors.entry.data The event-specific information
 * @property {string} errors.entry.data.type The type of error, e.g. "SyntaxError"
 * @property {string} errors.entry.data.description A description of the error
 * @property {Object} warnings The warnings found in the project
 * @property {Object} warnings.entry A single warning entry
 * @property {string} warnings.entry.type The type of the event
 * @property {string} warnings.entry.description The description of the event
 * @property {(string | undefined)} warnings.entry.filename The name of the file being processed when the event was triggered, if any
 * @property {(number | undefined)} warnings.entry.line The line number of the file being processed when the event was triggered, if any
 * @property {(number | undefined)} warnings.entry.column The column number of the file being processed when the event was triggered, if any
 * @property {Object} warnings.entry.data The event-specific information
 * @property {string} warnings.entry.type The type of warning, e.g. "deprecatedTiPropertyReferenced"
 * @property {string} warnings.entry.description A description of the warning
 * @property {Array.<Object>} plugins The results of the plugins. Each plugin has its own results format
 * @property {number} elapsedTime The elapsed time, in milliseconds
 * @property {string} resultsPath The path to the results files, if a path was specified in the options
 */
/**
 * Gets the results of the code processor. Note: the results are sanitized to remove hidden properties and functions,
 * thus allowing the results to be JSON.stringify()'d.
 *
 * @method
 * @returns {module:CodeProcessor.getResultsReturnValue} The results of the analysis
 */
exports.getResults = getResults;
function getResults() {
	var errors = Runtime.getReportedErrors(),
		warnings = Runtime.getReportedWarnings(),
		rawResults = {
			errors: errors,
			warnings: warnings,
			plugins: [],
			elapsedTime: Date.now() - startTime,
			resultsPath: Runtime.options.resultsPath
		},
		results = {},
		i, len,
		hiddenRegex = /^_/,
		astNode = uglify.AST_Node;
	for (i = 0, len = Runtime.plugins.length; i < len; i++) {
		rawResults.plugins[i] = Runtime.plugins[i].getResults && Runtime.plugins[i].getResults() || {};
		rawResults.plugins[i].name = Runtime.plugins[i].name;
	}
	for (i = 0, len = errors.length; i < len; i++) {
		if (errors[i].occurances > 1) {
			errors[i].description += ' (' + errors[i].occurances + ' occurances)';
		}
	}
	for (i = 0, len = warnings.length; i < len; i++) {
		if (warnings[i].occurances > 1) {
			warnings[i].description += ' (' + warnings[i].occurances + ' occurances)';
		}
	}
	function sanitize(rawNode, node) {
		var p;
		for (p in rawNode) {
			if (!hiddenRegex.test(p) && !(rawNode[p] instanceof astNode)) {
				if (typeof rawNode[p] === 'object') {
					node[p] = Array.isArray(rawNode[p]) ? [] : {};
					sanitize(rawNode[p], node[p]);
				} else if (typeof rawNode[p] !== 'function') {
					node[p] = rawNode[p];
				}
			}
		}
	}
	sanitize(rawResults, results);
	return results;
}

// ******** Helper Methods ********

/**
 * Generates a string with n number of chr
 *
 * @method
 * @param {number} n The number of times to duplicate chr
 * @param {string} chr The character (or string) to duplicate
 * @return {string} The string with the duplicated character
 */
function nChars(n, chr) {
	var spaces = '',
		i;
	for (i = 0; i < n; i++) {
		spaces += chr;
	}
	return spaces;
}

/**
 * Generates a table that plays nicely with mono-spaced fonts (e.g. like those found in a terminal). It works by
 * generating a single row for each object in the entries array. Each column in the row is pulled from the object using
 * the corresponding key in the entriesOrder array.
 *
 * @method
 * @param {Array.<string>} headings The headings for the table
 * @param {Array.<Object>} entries The array of objects to render to the table
 * @param {Array.<string>} entriesOrder The order of the keys to fetch from entries
 * @return {string} The rendered table
 */
function arrayGen(headings, entries, entriesOrder) {
	var columns = new Array(headings.length),
		i, ilen, j, jlen,
		maxLength,
		entry,
		topSep,
		middleSep,
		bottomSep,
		padding,
		output = '';

	// Collate and pad the data
	for (i = 0, ilen = columns.length; i < ilen; i++) {
		columns[i] = [headings[i]];
		maxLength = headings[i].length;
		for (j = 0, jlen = entries.length; j < jlen; j++) {
			entry = (entries[j][entriesOrder[i]]).toString();
			columns[i].push(entry);
			if (entry.length > maxLength) {
				maxLength = entry.length;
			}
		}
		for (j = 0, jlen = columns[i].length; j < jlen; j++) {
			columns[i][j] = ' ' + columns[i][j] + nChars(maxLength - columns[i][j].length + 1, ' ');
		}
	}

	// Generate the table separators
	topSep =    '┌';
	middleSep = '├';
	bottomSep = '└';
	for (i = 0, ilen = columns.length - 1; i < ilen; i++) {
		padding = nChars(columns[i][0].length, '─');
		topSep += padding +    '┬';
		middleSep += padding + '┼';
		bottomSep += padding + '┴';
	}
	padding = nChars(columns[columns.length - 1][0].length, '─');
	topSep += padding +    '┐\n';
	middleSep += padding + '┤\n';
	bottomSep += padding + '┘';

	output += topSep;
	for (i = 0, ilen = columns[0].length; i < ilen; i++) {
		output += '|';
		for (j = 0, jlen = columns.length; j < jlen; j++) {
			output += '' + (i === 0 ? columns[j][i].cyan : columns[j][i]) + '|';
		}
		output += '\n' + (i < ilen - 1 ? middleSep : bottomSep);
	}

	return output;
}

/**
 * typedef {Object} module:CodeProcessor.pluginResultsPageData
 * @property {string} template The path to the mustache template (filenames must be unique across all plugins)
 * @property {Object} data The render data for the template
 */
/**
 * private
 */
function generateResultsPages(outputFormat, resultsDirectory, theme, callback) {
	var plugins = Runtime.plugins,
		results = getResults(),
		header = [],
		i, len,
		currentPage,
		tasks = [],
		errorList,
		error,
		warningList,
		warning,
		pluginList,
		elevatedPluginList,
		plugin,
		page,
		numErrors,
		numWarnings,
		errorsAndWarnings,
		baseDirectory = Runtime.sourceInformation.projectDir + path.sep,
		resultsToLog = '',
		data,
		paddingLength,
		mappedLocation;

	function queueRender(template, destination, headerIndex, data) {
		tasks.push(function(next){
			var renderStream,
				i, len,
				compiledData = '';

			if (!fs.existsSync(template)) {
				throw new Error('Template "' + template + '" does not exist');
			}

			for (i = 0, len = header.length; i < len; i++) {
				header[i].isHighlighted = i === headerIndex;
			}
			data.header = header;

			mu.root = path.dirname(template);
			renderStream = mu.compileAndRender(path.basename(template), data);
			renderStream.on('data', function (data) {
				compiledData += data.toString();
			});
			renderStream.on('end', function() {
				fs.writeFile(destination, compiledData, function () {
					next();
				});
			});
		});
	}

	// Generate the errors and warnings lists
	if (results.errors.length) {
		errorList = [];
		for (i = 0, len = results.errors.length; i < len; i++) {
			error = results.errors[i];
			mappedLocation = Runtime.mapLocation(error);
			errorList.push({
				description: error.description,
				filename: mappedLocation.filename.replace(baseDirectory, ''),
				line: mappedLocation.line
			});
		}
	}
	if (results.warnings.length) {
		warningList = [];
		for (i = 0, len = results.warnings.length; i < len; i++) {
			warning = results.warnings[i];
			mappedLocation = Runtime.mapLocation(warning);
			warningList.push({
				description: warning.description,
				filename: mappedLocation.filename.replace(baseDirectory, ''),
				line: mappedLocation.line
			});
		}
	}

	// Generate the plugin summary list
	if (plugins.length) {
		pluginList = [];
		elevatedPluginList = [];
		for (i = 0, len = plugins.length; i < len; i++) {
			plugin = plugins[i];
			if (plugin.getResultsPageData && !plugin.suppressOutput) {
				(plugin.elevatePluginSummary ? elevatedPluginList : pluginList).push({
					name: plugin.displayName,
					overview: results.plugins[i].summary || ''
				});
			}
		}
	}

	// Generate the errors and warnings summary
	numErrors = results.errors.length;
	numWarnings = results.warnings.length;
	if (numErrors || numWarnings) {
		errorsAndWarnings = '\n';
		if (numErrors) {
			errorsAndWarnings += pluralize('%s error ', '%s errors ', numErrors);
			if (numWarnings) {
				errorsAndWarnings += 'and ';
			}
		}
		if (numWarnings) {
			errorsAndWarnings += pluralize('%s warning ', '%s warnings ', numWarnings);
		}
		errorsAndWarnings += 'detected';
	}

	data = {
		elapsedTime: (results.elapsedTime / 1000).toFixed(1),
		time: (new Date()).toTimeString(),
		date: (new Date()).toDateString(),
		options: [{
			option: 'Invoke Methods',
			value: Runtime.options.invokeMethods,
		},{
			option: 'Evaluate Loops',
			value: Runtime.options.evaluateLoops,
		},{
			option: 'Process Unvisited Code',
			value: Runtime.options.processUnvisitedCode,
		}],
		errorsAndWarnings: errorsAndWarnings,
		errors: errorList ? { errorList: errorList } : undefined,
		warnings: warningList ? { warningList: warningList } : undefined,
		elevatedPlugins: elevatedPluginList,
		plugins: pluginList ? { pluginList: pluginList } : undefined
	};

	if (outputFormat === 'report') {
		for (i = 0, len = plugins.length; i < len; i++) {
			plugin = plugins[i];
			if (plugin.renderLogOutput && !plugin.suppressOutput) {
				paddingLength = (40 - plugin.displayName.length) / 2;
				resultsToLog += '\n\n' +
					'******************************************\n' +
					'*' + nChars(Math.floor(paddingLength), ' ') + plugin.displayName.cyan + nChars(Math.ceil(paddingLength), ' ') + '*\n' +
					'******************************************\n\n' +
					plugin.renderLogOutput(arrayGen);
			}
		}

		resultsToLog +=
			'\n\n******************************************\n' +
			'*                ' + 'Summary'.cyan + '                 *\n' +
			'******************************************\n\n';

		resultsToLog += 'Analysis completed in ' + data.elapsedTime + ' seconds at ' + data.time + ' on ' + data.date +
			(data.errorsAndWarnings ? data.errorsAndWarnings : '') + '\n';
		if (elevatedPluginList && elevatedPluginList.length) {
			for (i = 0, len = elevatedPluginList.length; i < len; i++) {
				resultsToLog += elevatedPluginList[i].name + ': ' + elevatedPluginList[i].overview + '\n';
			}
		}
		resultsToLog += '\n';

		resultsToLog += 'Options selected\n';
		resultsToLog += arrayGen(['Option', 'Value'], data.options, ['option', 'value']);

		if (data.errors) {
			resultsToLog += '\n\nErrors\n';
			resultsToLog += arrayGen(['Description', 'File', 'Line'], data.errors.errorList, ['description', 'filename', 'line']);
		}
		if (data.warnings) {
			resultsToLog += '\n\nWarnings\n';
			resultsToLog += arrayGen(['Description', 'File', 'Line'], data.warnings.warningList, ['description', 'filename', 'line']);
		}
		if (data.plugins && data.plugins.pluginList.length) {
			resultsToLog += '\n\nPlugin Summary\n';
			resultsToLog += arrayGen(['Plugin', 'Overview'], data.plugins.pluginList, ['name', 'overview']);
		}

		console.log(resultsToLog + '\n');
	} else if (outputFormat === 'json') {
		console.log(JSON.stringify(results, false, '\t'));
	} else if (outputFormat === 'stream') {
		results = JSON.stringify(results);
		console.log('REQ,01000001,' + ('00000000' + results.length.toString(16)).slice(-8) + ',' + results);
	}

	if (resultsDirectory) {

		// Create the results directory if it doesn't exist
		if (!fs.existsSync(resultsDirectory)) {
			wrench.mkdirSyncRecursive(resultsDirectory);
		}

		// Copy the style sheet over
		theme = path.join(__dirname, '..', 'templates', 'bootstrap-' + (theme || 'light'));
		if (!fs.existsSync(theme)) {
			throw new Error('Template theme "' + theme + '" does not exist');
		}
		wrench.copyDirSyncRecursive(theme, path.join(resultsDirectory, 'bootstrap'));

		// Create the header
		for (i = 0, len = plugins.length; i < len; i++) {
			plugin = plugins[i];
			if (plugin.getResultsPageData && !plugin.suppressOutput) {
				header.push({
					name: plugin.displayName,
					file: plugin.name + '.html'
				});
			}
		}

		// Generate the summary results page
		queueRender(path.join(__dirname, '..', 'templates', 'summary.html'),
			path.join(resultsDirectory, 'index.html'), -1, data);

		// Generate the plugin results pages
		currentPage = 0;
		for (i = 0, len = plugins.length; i < len; i++) {
			plugin = plugins[i];
			if (plugin.getResultsPageData && !plugin.suppressOutput) {
				plugin = plugin.getResultsPageData(plugin.name + '.html', baseDirectory);
				for (page in plugin) {
					queueRender(plugin[page].template,
						path.join(resultsDirectory, page),
						currentPage,
						plugin[page].data);
				}
				currentPage++;
			}
		}

		// Render the results
		async.series(tasks, callback);
	} else {
		callback && callback();
	}
}