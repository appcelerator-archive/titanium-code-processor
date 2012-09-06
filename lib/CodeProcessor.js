/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * WARNING: The Code Processor IS NOT fully reentrant! A second invokation of the code processor prior to the first 
 * one finishing will kill the first instance and the second invokation may be unstable.
 * 
 * @module CodeProcessor
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

// ******** Requires ********

var path = require("path"),
	fs = require("fs"),
	util = require("util"),
	
	wrench = require("wrench"),
	
	RuleProcessor = require("./RuleProcessor"),
	Exceptions = require("./Exceptions"),
	AST = require("./AST"),
	Base = require("./Base"),
	Runtime = require("./Runtime"),
	Globals = require("./Global"),

// ******** Global Variables ********

	rules = wrench.readdirSyncRecursive(path.join(__dirname, "rules")),
	i = 0,
	len = rules.length,
	
	plugins,

// ******** Constants ********

	DEFAULT_ANALYSIS_PRECISION = 2,
	DEFAULT_CODE_MINIFICATION = true;
	
// ******** Prime the rules ********
for (; i < len; i++) {
	require(path.join(__dirname, "rules", rules[i]));
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
 * @function
 * @param {Array[String]} files A list of files to process.
 * @param {Array[String]} pluginList A list of plugins to load. Each name must correspond with a subdirectory containing
 *		a node module in the "plugins" directory.
 * @param {Object} [options] Options for controlling the code processor
 * @param {Boolean} [options.invokeMethods] Indicates whether or not methods should be invoked. Default is true.
 * @param {Boolean} [options.evaluateLoops] Indicates whether or not to evaluate loops. Default is false.
 * @param {Number} [options.maxLoopIterations] The maximum number of iterations a loop can iterate before falling
 *		back to an unknown evaluation (as if evaluateLoops were false). This prevents code with extremely intensive code
 *		or code with infinite loops from taking down the system. Default is 10000.
 * @param {Winston Logger} [options.logger] An instance of a winston logger (with syslog levels) to use instead of
 *		creating an internal logger instance
 * @throws {module:Exceptions.InvalidArguments} Thrown when the project root does not exist.
 * @throws {module:Exceptions.InvalidArguments} Thrown when the tiapp.xml file could not be found.
 * @throws {module:Exceptions.InvalidArguments} Thrown when invalid callbacks are supplied.
 */
exports.process = process;
function process(files, pluginList, options) {
	
	var i = 0, 
		len = pluginList.length,
		pluginPath,
		tags,
		results,
		j,
		env;
	
	// Process the options
	if (options) {
		
		// Store the logger
		if (options.logger) {
			Runtime.setLogger(options.logger);
		}
		
		// Parse the invoke methods option
		if (options.invokeMethods !== undefined) {
			Runtime.options.invokeMethods = !!options.invokeMethods;
		}
		Runtime.log("debug", "Setting processing option: methods will " + 
			(Runtime.options.invokeMethods ? "" : "not ") + "be invoked");
		
		// Parse the evaluate loops option
		if (options.evaluateLoops !== undefined) {
			Runtime.options.evaluateLoops = !!options.evaluateLoops;
		}
		Runtime.log("debug", "Setting processing option: loops will " + 
			(Runtime.options.evaluateLoops ? "" : "not ") + "be evaluated");
		
		// Parse the max loop iterations option
		if (options.maxLoopIterations !== undefined) {
			Runtime.options.maxLoopIterations = parseInt(options.maxLoopIterations);
		}
		Runtime.log("debug", "Setting processing option: max loop iterations is " + Runtime.options.maxLoopIterations);
		
		// Parse the max recursion limit option
		if (options.maxRecursionLimit !== undefined) {
			Runtime.options.maxRecursionLimit = parseInt(options.maxRecursionLimit);
		}
		Runtime.log("debug", "Setting processing option: max recursion limit is " + Runtime.options.maxRecursionLimit);
	}
	
	// Load the plugins
	plugins = {};
	for (; i < len; i++) {
		pluginPath = path.resolve(path.join(__dirname, "..", "plugins", pluginList[i]));
		if (fs.existsSync(pluginPath)) {
			Runtime.log("debug", "Loading plugin '" + pluginList[i] + "' at " + pluginPath);
			plugins[pluginList[i]] = new (require(pluginPath))({
				Base: Base,
				Runtime: Runtime,
				Exceptions: Exceptions,
				processFile: processFile
			});
		}
	}
	
	// Parse the project for all listener sets
	tags = Runtime.getTags();
	processingLoop: for (i = 0, len = tags.length; i < len; i++) {
		Runtime.log("debug", "Processing event listener set '" + tags[i] + "'");
		
		// Load the listener set
		Runtime.loadListenerSet(tags[i]);
		
		// Initialize the runtime
		Runtime.globalObject = new Base.ObjectType();
		env = Base.newObjectEnvironment(Runtime.globalObject, undefined);
		Runtime.globalContext = new Base.ExecutionContext(
				env,
				env,
				Runtime.globalObject);
		Runtime.contextStack = [Runtime.globalContext];
		Base.createThrowTypeErrorFunction();
		Globals.injectGlobals();
		
		try {
			// Fire the process event
			Runtime.fireEvent("projectProcessingBegin", "Project processing is beginning");
			
			// Process the files
			for(j = 0; j < files.length; j++) {
				results = processFile(files[i], false);
			
				// Check if an exception was thrown
				if (results && results[0] === "throw") {
					Runtime.reportError({
						description: "Uncaught exception",
						exception: results[1]
					});
					break processingLoop;
				}
			}
		} catch(e) {
			if (e.reportError) {
				Runtime.reportError(e.name, e.message, e);
				results = ["throw", undefined, undefined];
			} else {
				throw e;
			}
		}
		Runtime.fireEvent("projectProcessingEnd", "Project processing complete");
	}
	
	Runtime.fireEvent("processingComplete", "All processing is complete");
	return results;
}

/**
 * Gets the results of the code processor.
 * 
 * @method
 * @returns {Object} An object containing three entries: "errors", "warnings", and "plugins". The plugins entry is
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
 * @param {Boolean} [useCurrentContext] Whether or not to create a new context in the file
 * @returns {{@link module:Base.ObjectType} | undefined} The value of module.exports, if one was requested
 */
exports.processFile = processFile;
function processFile(file, createExports, useCurrentContext) {
	
	var root,
		module,
		results;
	
	// Make sure the file exists
	if (fs.existsSync(file)) {
		
		// Fire the parsing begin event
		Runtime.fireEvent("fileProcessingBegin", "Processing is beginning for file '" + file + "'", {
			file: file
		});
		
		// Set the current file
		Runtime.fileStack.push(file);
		
		// Read in the file and generate the AST
		root = AST.parse(file);
		if (root) {
			// Process the project
			root.createExports = createExports;
			root.useCurrentContext = useCurrentContext;
			results = RuleProcessor.processRule(root);
		}
		
		// Restore the previous file
		Runtime.fileStack.pop();
		
		// Fire the parsing end event
		Runtime.fireEvent("fileProcessingEnd", "Processing finished for file '" + file + "'", {
			file: file
		});
		
	} else {
		throw new Exceptions.InvalidArgumentsError("Could not load file '" + file + "'");
	}
	return results;
}

// ******** Unit Test Methods ********

/**
 * Runs the supplied files in a unit-test like manner.
 * 
 * @method
 * @returns {Boolean} Whether or not an exception was thrown in code (aka whether or not the unit test passed).
 */
exports.runUnitTest = runUnitTest;
function runUnitTest(files, pluginList, options) {
	var result;
	try {
		result = process(files, pluginList, options);
		if (result && result[0] === "throw") {
			process.exit(1);
		}
	} catch(e) {
		process.exit(-1);
	}
}