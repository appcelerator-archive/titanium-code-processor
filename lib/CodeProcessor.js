/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * WARNING: The Code Processor IS NOT reentrant! A second invokation of the code processor prior to the first
 * one finishing will kill the first instance and the second invokation may be unstable. A second invokation of the code
 * processor after the first has finished is untested and not likely to work.
 *
 * @module CodeProcessor
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

// TODO: Former options that need to be split into plugin options
/* @param {String} [options.sdkPath] The path to the Titanium SDK to use
 * @param {String} [options.platform] The name of the platform being compiled for. <code>Ti.Platform.osname</code> will report this value.
 * @param {Object} [options.modules] A dictionary of module ids as keys. If the module is a common js module, the value
 *		is the path to the module entry point, otherwise the value is null.*/

// ******** Globals ********

var path = require('path'),
	fs = require('fs'),
	async = require('async'),
	existsSync = fs.existsSync || path.existsSync,

	wrench = require('wrench'),
	uglify = require('uglify-js'),
	mu = require('mu2'),

	RuleProcessor = require('./RuleProcessor'),
	AST = require('./AST'),
	Base = require('./Base'),
	Runtime = require('./Runtime'),

	startTime = Date.now();

// ******** Prime the rules ********
(function(){
	var rules = wrench.readdirSyncRecursive(path.join(__dirname, 'rules')),
		i,
		len = rules.length;
	for (i = 0; i < len; i++) {
		require(path.join(__dirname, 'rules', rules[i]));
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
 * @property {String} filename The absolute path to the file that is about to be processed
 * @see module:Runtime.on
 */

/**
 * Indicates that the current run of the project is about to be processed
 *
 * @name module:CodeProcessor.projectProcessingBegin
 * @event
 * @see module:Runtime.on
 */

/**
 * Indicates that the current run of the project has finished being processed
 *
 * @name module:CodeProcessor.projectProcessingEnd
 * @event
 * @see module:Runtime.on
 */

// ******** API Methods ********

/**
 * Queries a set of plugin search paths for plugins and their options
 *
 * @method
 * @param {Array[Strings]} paths An array of paths to search in addition to the default path. Can be an empty array, but must not be undefined
 * @param {Function(err, results)} callback The callback to call when finished
 */
exports.queryPlugins = queryPlugins;
function queryPlugins(pluginPaths, callback) {
	var pluginResolutionTasks = [],
		pluginInfo = {};
	pluginPaths = [path.resolve(path.join(__dirname, '..', 'plugins'))].concat(pluginPaths),

	pluginPaths.forEach(function (pluginPath) {
		pluginResolutionTasks.push(function (next) {
			fs.readdir(pluginPath, function (err, files) {
				var i, len;
				for (i = 0, len = files.length; i < len; i++) {
					files[i] = path.join(pluginPath, files[i]);
				}
				next(err, files);
			});
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
							console.warn('warn: Could not read plugin information in "' + pluginDirectory + '": ' + err);
							next();
						} else {
							try {
								pluginData = JSON.parse(data);
								if (pluginData.titaniumCodeProcessorPlugin === true) {
									pluginData.path = pluginDirectory;
									pluginInfo[pluginData.name] = pluginData;
								}
								next();
							} catch(e) {
								console.warn('warn: Could not parse plugin information in "' + pluginDirectory + '": ' + e);
								next();
							}
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
 * Queries the set of options
 *
 * @method
 * @param {Function(err, results)} callback The callback to call when finished
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
		}
	});
}

/**
 * Processes the entry point using the supplied options and plugins
 *
 * @method
 * @param {String} entryPoint The entry point of the project.
 * @param {Object} options The options for the run. Run {@link queryOptions} for information about the options
 * @param {Any} options.option An option. The actual key is the name of the option
 * @param {Object} plugins The options for the run. Run {@link queryOptions} for information about the options
 * @param {Object} plugins.plugin The plugin. The key is the name of the plugin
 * @param {String} plugins.plugin.path The path to the plugin, as reported by {@link queryOptions}
 * @param {Object} plugins.plugin.options The options for the plugin
 * @param {Any} plugins.plugin.options.option An option. The actual key is the name of the option
 * @param {Winston Logger} [logger] A logger instance from the CLI (can be a CLI logger, which wraps winston, or a winston logger directly)
 */
exports.run = run;
function run(entryPoint, options, plugins, logger) {

	var results;
	options = options || {};
	plugins = plugins || {};

	Runtime.setLogger(logger);

	init(options, plugins);

	Runtime.on('enteredFile', function(e) {
		Runtime.log('debug', 'Entering file ' + e.data.filename);
	});

	Runtime.fireEvent('projectProcessingBegin', 'Project processing is beginning');

	results = processEntryPoint(entryPoint);

	processQueuedFunctions();

	if (Runtime.options.processUnvisitedCode) {
		processUnvisitedCode();
	}

	Runtime.exitContext();

	Runtime.fireEvent('projectProcessingEnd', 'Project processing complete');

	if (Runtime.options.resultsPath) {
		generateResultsPages(Runtime.options.resultsPath);
	}

	return results;
}

/**
 * Processes the input options
 *
 * @method
 */
exports.init = init;
function init(options, plugins, ast) {
	var i, ilen, j, k, klen,
		loadedPlugins = [],
		pkg,
		dependencyFound;

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

	// Parse the exact mode options
	if (options.hasOwnProperty('exactMode')) {
		Runtime.options.exactMode = !!options.exactMode;
	}
	Runtime.log('debug', 'Setting processing option: exact mode is ' + (Runtime.options.exactMode ? 'on' : 'off'));

	// Parse the exact mode options
	if (options.hasOwnProperty('processUnvisitedCode')) {
		Runtime.options.processUnvisitedCode = !!options.processUnvisitedCode;
	}
	Runtime.log('debug', 'Setting processing option: unvisited code will ' +
		(Runtime.options.processUnvisitedCode ? '' : 'not ') + 'be processed');

	// Parse the exact mode options
	if (options.hasOwnProperty('nativeExceptionRecovery')) {
		Runtime.options.nativeExceptionRecovery = !!options.nativeExceptionRecovery;
	}
	Runtime.log('debug', 'Setting processing option: native exception recovery is ' +
		(Runtime.options.nativeExceptionRecovery ? 'enabled' : 'disabled'));

	// Parse the exact mode options
	if (options.hasOwnProperty('resultsPath')) {
		Runtime.options.resultsPath = options.resultsPath;
	}
	Runtime.log('debug', 'Setting processing option: ' + (Runtime.options.resultsPath ? 'the results path is "' +
		Runtime.options.resultsPath + '"' : 'No results path is set'));

	// Load the plugins
	for (i = 0, ilen = plugins.length; i < ilen; i++) {
		Runtime.log('debug', 'Loading code processor plugin "' + plugins[i].name + '"');
		try {
			pkg = JSON.parse(fs.readFileSync(path.join(plugins[i].path, 'package.json')));
		} catch(e) {
			Runtime.log('warning', 'Could not parse package.json for plugin "' + plugins[i].name + '": ' + e);
		}
		for(j in pkg.dependencies) {
			dependencyFound = false;
			for (k = 0, klen = plugins.length; k < klen; k++) {
				if (j === plugins[k].name) {
					dependencyFound = true;
				}
			}
			if (!dependencyFound) {
				Runtime.log('error', 'Missing dependency: plugin "' + plugins[i].name + '" depends on plugin "' + j + '"\n');
				process.exit(1);
			}
		}
		loadedPlugins[i] = new (require(plugins[i].path))(plugins[i].options);
		loadedPlugins[i].name = plugins[i].name;
	}

	// Calculated the time limit
	if (Runtime.options.executionTimeLimit) {
		Runtime.executionTimeLimit = Date.now() + Runtime.options.executionTimeLimit;
	}

	Runtime.plugins = loadedPlugins;

	// Initialize the runtime
	Base.createGlobalContext(ast);
	Base.init();

	// Initialize the plugins
	for (i = 0, ilen = Runtime.plugins.length; i < ilen; i++) {
		Runtime.plugins[i].init();
	}
}

/**
 * Processes the input options
 *
 * @method
 */
exports.processEntryPoint = processEntryPoint;
function processEntryPoint(entryPoint) {

	var ast,
		results,
		exception;

	// Process the project
	try {
		/*jshint debug: true*/
		debugger;
		Runtime.setEntryPointFile(entryPoint);

		// Make sure the entryPoint exists
		if (existsSync(entryPoint)) {

			// Fire the parsing begin event
			Runtime.fireEvent('enteredFile', 'Entering file "' + entryPoint + '"', {
				filename: entryPoint
			});

			// Read in the entryPoint and generate the AST
			ast = AST.parse(entryPoint);
			if (!ast.syntaxError) {
				Runtime._unknown = false;
				Base.createModuleContext(ast, RuleProcessor.isBlockStrict(ast), false, false);
				results = ast.processRule();
				Runtime.exitContext();
			} else {
				Base.handleRecoverableNativeException('SyntaxError', ast.message, {
					filename: entryPoint,
					line: ast.line,
					column: ast.col
				});
			}

		} else {
			throw new Error('Internal Error: could not find file "' + entryPoint + '"');
		}

		// Check if an exception was thrown
		if (results && results[0] === 'throw') {
			exception = results[1]._exception;
			if (Base.type(exception) === 'String') {
				exception = exception.value;
			} else if (Base.type(exception) === 'Unknown') {
				exception = '<unknown>';
			} else {
				exception = exception._lookupProperty('message').value.value;
			}
			Runtime.reportError('uncaughtException', 'An exception was thrown but not caught: ' + exception, {
				description: 'Uncaught exception',
				exception: results[1]
			});
		}
	} catch (e) {
		if (e.isCodeProcessorException) {
			results = ['throw', Runtime._exception, undefined];
			exception = Runtime._exception;
			if (Base.type(exception) === 'String') {
				exception = exception.value;
			} else if (Base.type(exception) === 'Unknown') {
				exception = '<unknown>';
			} else {
				exception = exception._lookupProperty('message').value.value;
			}
			Runtime.reportError('uncaughtException', 'An exception was thrown but not caught: ' + exception, {
				description: 'Uncaught exception',
				exception: Runtime._exception
			});
			Runtime._exception = undefined;
		} else {
			throw e;
		}
	}

	return results;
}

/**
 * Processes the input options
 *
 * @method
 */
exports.processQueuedFunctions = processQueuedFunctions;
function processQueuedFunctions() {

	var queuedFunction,
		exception;

	// Process any queued functions
	Runtime.log('debug', 'Processing queued functions');
	while (queuedFunction = Runtime.getNextQueuedFunction()) {

		Runtime.recursionCount++;
		try {
			queuedFunction.func.call(queuedFunction.thisVal, queuedFunction.args, queuedFunction.ambiguousContext);
		} catch (e) {
			if (e.isCodeProcessorException) {
				exception = Runtime._exception;
				if (Base.type(exception) === 'String') {
					exception = exception.value;
				} else if (Base.type(exception) === 'Unknown') {
					exception = '<unknown>';
				} else {
					exception = exception._lookupProperty('message').value.value;
				}
				Runtime.reportError('uncaughtException', 'An exception was thrown but not caught: ' + exception, {
						description: 'Uncaught exception',
						exception: Runtime._exception
					});
				Runtime._exception = undefined;
			} else {
				throw e;
			}
		}
		Runtime.recursionCount--;
	}
}

/**
 * Processes the input options
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
		exception,
		previousAmbiguousSetting;

	Runtime.log('debug', 'Processing unvisited files');
	while(unprocessedFile = Runtime.getUnprocessedFilesList()[0]) {

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
					exception = Runtime._exception;
					if (Base.type(exception) === 'String') {
						exception = exception.value;
					} else if (Base.type(exception) === 'Unknown') {
						exception = '<unknown>';
					} else {
						exception = exception._lookupProperty('message').value.value;
					}
					Runtime.reportError('uncaughtException', 'An exception was thrown but not caught: ' + exception, {
							description: 'Uncaught exception',
							exception: Runtime._exception
						});
					Runtime._exception = undefined;
				} else {
					throw e;
				}
			}

			// Exit the module context
			Runtime.exitContext();
		} else {
			Base.handleRecoverableNativeException('SyntaxError', ast.message, {
				filename: unprocessedFile,
				line: ast.line,
				column: ast.col
			});
		}
	}

	Runtime.log('debug', 'Processing unvisited functions');
	while(unprocessedFunction = Runtime.getUnprocessedFunctions()[0]) {
		unprocessedFunction._lastKnownContext._ambiguousContext = true;
		Runtime.enterContext(unprocessedFunction._lastKnownContext);
		funcObject = unprocessedFunction.processRule();

		// Create unknown arguments set to the length of the expected args
		args = [];
		for(i = 0; i < funcObject.formalParameters.length; i++) {
			args.push(new Base.UnknownType());
		}

		Runtime.recursionCount++;
		try {
			funcObject.call(new Base.UnknownType(), args, true);
		} catch (e) {
			if (e.isCodeProcessorException) {
				exception = Runtime._exception;
				if (Base.type(exception) === 'String') {
					exception = exception.value;
				} else if (Base.type(exception) === 'Unknown') {
					exception = '<unknown>';
				} else {
					exception = exception._lookupProperty('message').value.value;
				}
				Runtime.reportError('uncaughtException', 'An exception was thrown but not caught: ' + exception, {
						description: 'Uncaught exception',
						exception: Runtime._exception
					});
				Runtime._exception = undefined;
			} else {
				throw e;
			}
		}
		Runtime.recursionCount--;

		Runtime.exitContext();
		unprocessedFunction._lastKnownContext._ambiguousContext = previousAmbiguousSetting;
	}
}

/**
 * Gets the results of the code processor. Note: the results are sanitized to remove hidden properties and functions,
 * thus allowing the results to be JSON.stringify()'d.
 *
 * @method
 * @returns {Object} An object containing three entries: 'errors', 'warnings', and 'plugins'. The plugins entry is
 *		itself an object, with the keys being the names of each plugin.
 */
exports.getResults = getResults;
function getResults() {
	var rawResults = {
			errors: Runtime.getReportedErrors(),
			warnings: Runtime.getReportedWarnings(),
			plugins: [],
			elapsedTime: Date.now() - startTime,
			resultsPath: Runtime.options.resultsPath
		},
		results = {},
		i, len,
		hiddenRegex = /^_/,
		astNode = uglify.AST_Node;
	for (i = 0, len = Runtime.plugins.length; i < len; i++) {
		rawResults.plugins[i] = Runtime.plugins[i].getResults();
		rawResults.plugins[i].name = Runtime.plugins[i].name;
	}
	function sanitize(rawNode, node) {
		var p;
		for(p in rawNode) {
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

function generateResultsPages(resultsDirectory) {
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
		plugin,
		page,
		baseDirectory = path.dirname(Runtime.getEntryPointFile()) + path.sep;

	function queueRender(template, destination, headerIndex, data) {
		tasks.push(function(next){
			var renderStream,
				i, len,
				compiledData = '';

			if (!existsSync(template)) {
				throw new Error('Template "' + template + '" does not exist');
			}

			for(i = 0, len = header.length; i < len; i++) {
				header[i].isHighlighted = i === headerIndex;
			}
			data.header = header;

			mu.root = path.dirname(template);
			renderStream = mu.compileAndRender(path.basename(template), data);
			renderStream.on('data', function (data) {
				compiledData += data.toString();
			});
			renderStream.on('end', function() {
				fs.writeFileSync(destination, compiledData);
				next();
			});
		});
	}

	// Create the results directory if it doesn't exist
	if (!existsSync(resultsDirectory)) {
		wrench.mkdirSyncRecursive(resultsDirectory);
	}

	// Copy the style sheet over
	wrench.copyDirSyncRecursive(path.join(__dirname, '..', 'templates', 'bootstrap'), path.join(resultsDirectory, 'bootstrap'));

	// Create the header
	for (i = 0, len = plugins.length; i < len; i++) {
		plugin = plugins[i];
		if (plugin.displayName && plugin.getResultsPageData) {
			header.push({
				name: plugin.displayName,
				file: plugin.name + '.html'
			});
		}
	}

	// Generate the errors and warnings lists
	if (results.errors.length) {
		errorList = [];
		for(i = 0, len = results.errors.length; i < len; i++) {
			error = results.errors[i];
			errorList.push({
				description: error.description,
				filename: error.filename.replace(baseDirectory, ''),
				line: error.line
			});
		}
	}
	if (results.warnings.length) {
		warningList = [];
		for(i = 0, len = results.warnings.length; i < len; i++) {
			warning = results.warnings[i];
			warningList.push({
				description: warning.description,
				filename: warning.filename.replace(baseDirectory, ''),
				line: warning.line
			});
		}
	}

	// Generate the plugin summary list
	if (header.length > 1) {
		pluginList = [];
		for (i = 0, len = plugins.length; i < len; i++) {
			plugin = plugins[i];
			if (plugin.displayName && plugin.getResultsPageData) {
				pluginList.push({
					name: plugin.displayName,
					overview: results.plugins[i].summary || ''
				});
			}
		}
	}

	// Generate the summary results page
	queueRender(path.join(__dirname, '..', 'templates', 'summary.html'),
		path.join(resultsDirectory, 'index.html'),
		-1, {
			elapsedTime: (results.elapsedTime / 1000).toFixed(1),
			numErrors: results.errors.length,
			numWarnings: results.warnings.length,
			errors: errorList ? { errorList: errorList } : undefined,
			warnings: warningList ? { warningList: warningList } : undefined,
			plugins: pluginList ? { pluginList: pluginList } : undefined,
		});


	// Generate the plugin results pages
	currentPage = 0;
	for (i = 0, len = plugins.length; i < len; i++) {
		plugin = plugins[i];
		if (plugin.displayName && plugin.getResultsPageData) {
			plugin = plugin.getResultsPageData(plugin.name + '.html', baseDirectory);
			for(page in plugin) {
				queueRender(plugin[page].template,
					path.join(resultsDirectory, page),
					currentPage,
					plugin[page].data);
			}
			currentPage++;
		}
	}

	// Render the results
	async.series(tasks);
}