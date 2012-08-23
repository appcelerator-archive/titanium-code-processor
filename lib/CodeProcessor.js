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

var xml2js = require("xml2js"),
	wrench = require("wrench"),
	
	path = require("path"),
	fs = require("fs"),
	
	is = require("./TiUtil").is,
	capitalize = require("./TiUtil").capitalize,
	
	Messaging = require("./Messaging"),
	RuleProcessor = require("./RuleProcessor"),
	
	Exceptions = require("./Exceptions"),
	
	AST = require("./AST"),
	Base = require("./Base"),
	Context = require("./Context"),
	Runtime = require("./Runtime");

// ******** Module exposure for plugins ********

exports.Base = Base;
exports.Context = Context;
exports.Runtime = Runtime;
exports.Messaging = Messaging;
exports.Exceptions = Exceptions;

// ******** Constants ********

var DEFAULT_ANALYSIS_PRECISION = 2,
	DEFAULT_CODE_MINIFICATION = true;
	
// ******** Prime the rules ********

var rules = wrench.readdirSyncRecursive(path.join(__dirname, "rules")),
	i = 0,
	len = rules.length;
for (; i < len; i++) {
	require(path.join(__dirname, "rules", rules[i]));
}

// ******** Event Documentation ********

/**
 * Indicates that a file is about to be processed. 
 *
 * @name module:CodeProcessor.fileProcessingBegin
 * @event
 * @property {JSContext} context The current state of the processor.
 * @property {Object} eventData The data for the event. 
 * @property {String} eventData.file The name of the file for which parsing is about to begin.
 * @see CodeProcessor#on
 */

/**
 * Indicates that a file has finished being processed successfully. 
 *
 * @name module:CodeProcessor.fileProcessingEnd
 * @event
 * @property {JSContext} context The current state of the processor.
 * @property {Object} eventData The data for the event. 
 * @property {String} eventData.file The name of the file for which parsing has just ended.
 * @see CodeProcessor#on
 */

/**
 * Indicates that a requested file, either the entry point file or one that was required/included, could not be loaded .
 *
 * @name module:CodeProcessor.fileLoadError
 * @event
 * @property {JSContext} context The current state of the processor.
 * @property {Object} eventData The data for the event. 
 * @property {String} eventData.file The name of the file attempted to load.
 * @property {String} eventData.error Description of the error (e.g. "File Not Found").
 * @see CodeProcessor#on
 */

/**
 * Indicates that a parse error was encountered. Note: parse errors also invoke the {@link CodeProcessor#process} method's
 * error callback with the information below.
 *
 * @name module:CodeProcessor.parseError
 * @event
 * @property {JSContext} context The current state of the processor.
 * @property {Object} eventData The data for the event. 
 * @property {String} eventData.message The error message as reported from the underlying AST technology.
 * @property {String} eventData.file The file that the error occured in.
 * @property {Integer} eventData.line The line of the file where the error occured.
 * @property {Integer} eventData.column The column of the file where the error occured.
 * @see CodeProcessor#on
 */

/**
 * Indicates that all parsing has been completed successfully. Note: parsing complete also invokes the
 * {@link CodeProcessor#process} method's completion callback with the information below.
 *
 * @name module:CodeProcessor.processingComplete
 * @event
 * @property {JSContext} context The current state of the processor.
 * @property {Object={}} eventData The data for the event. This is an empty object
 * @see CodeProcessor#on
 */

// ******** Application Methods ********

/**
 * Begins to process a project. If only one function is supplied as an argument, it is assumed to be the
 * <code>completionCallback</code>.
 *
 * @function
 * @param {String} projectRoot The path to the root folder of the project. The processor will look for the tiapp.xml
 *		file in this folder.
 * @param {Object} [options] Options for controlling the code processor
 * @param {Number} [options.analysisPrecision] Sets the analysis precision (1-4, default 2)
 * @param {Winston Logger} [options.logger] An instance of a winston logger (with syslog levels) to use instead of
 *		creating an internal logger instance
 * @param {function} [completionCallback] A callback to be called when all processing has completed successfully.
 * @param {function} [errorCallback] A callback to be called when an error occurred that prevents processing from
 *		continuing, e.g. a syntax error in code.
 * @throws {module:Exceptions.InvalidArguments} Thrown when the project root does not exist.
 * @throws {module:Exceptions.InvalidArguments} Thrown when the tiapp.xml file could not be found.
 * @throws {module:Exceptions.InvalidArguments} Thrown when invalid callbacks are supplied.
 */
exports.process = function process(projectRoot, options, completionCallback, errorCallback) {
	
	// Make sure that the project exists
	if (!fs.existsSync(projectRoot)) {
		throw new Exceptions.InvalidArgumentsError("Error: project root '" + projectRoot + "' does not exist.");
	}
	
	// Process the options
	if (options) {
		
		// Store the logger
		if (options.logger) {
			Messaging.setLogger(options.logger);
		}
		
		// Parse the invoke methods option
		if (options.invokeMethods !== undefined) {
			Runtime.options.invokeMethods = !!options.invokeMethods;
		}
		Messaging.log("debug", "Setting processing option: methods will " + 
				(Runtime.options.invokeMethods ? "" : "not ") + "be invoked");
		
		// Parse the evaluate loops option
		if (options.evaluateLoops !== undefined) {
			Runtime.options.evaluateLoops = !!options.evaluateLoops;
		}
		Messaging.log("debug", "Setting processing option: loops will " + 
				(Runtime.options.evaluateLoops ? "" : "not ") + "be evaluated");
	}
	
	// Hook up the callbacks
	Messaging.on("processingComplete", completionCallback);
	Messaging.on("processingError", errorCallback);
	
	// Validate the tiapp.xml
	var tiappxmlpath = path.join(projectRoot, "tiapp.xml");
	if (!fs.existsSync(tiappxmlpath)) {
		throw new Exceptions.InvalidArgumentsError("Error: tiapp.xml file '" + tiappxmlpath + "' does not exist.");
	}
	
	// Parse the tiapp.xml file
	Messaging.log("debug", "Processing tiapp.xml '" + tiappxmlpath + "'");
	(new xml2js.Parser()).parseString(fs.readFileSync(tiappxmlpath).toString(), function (err, result) {
		
		// Wrap in a set timeout so that exceptions don't get thrown through the xml parser
		setTimeout(function () {
			
			// Check if there was an error parsing tiapp.xml
			if (err) {
				throw new Error("Could not parse '" + tiappxmlpath + "': " + err);
			}
			
			// Calculate the various directories of interest
			var codeProcessingDirectory = path.join(projectRoot, "build", "codeprocessing"),
				entryPoint = "app.js";
				
			// TODO: Replace next line with incremental build mechanism
			fs.rmdir(codeProcessingDirectory);
			
			// Create the code processing directory, if it doesn't exist
			if (!fs.existsSync(codeProcessingDirectory)) {
				wrench.mkdirSyncRecursive(codeProcessingDirectory);
			}
			
			// Copy the resources directory into the working directory
			wrench.copyDirSyncRecursive(path.join(projectRoot, "Resources"), path.join(codeProcessingDirectory, "Resources"));
			
			// TODO: Copy modules located inside the project to the working dir
			
			// Find out what the main file is
			if (result.mobileweb.main) {
				entryPoint = result.mobileweb.main;
			}
			entryPoint = path.join(codeProcessingDirectory, "Resources", entryPoint);
			if (!fs.existsSync(entryPoint)) {
				throw new Exceptions.InvalidArgumentsError("Error: Project entry point '" + entryPoint + "' does not exist.");
			}
			Messaging.log("debug", "Processing entry point '" + entryPoint + "'");
			
			// Parse the project for all listener sets
			var tags = Messaging.getTags(),
				i = 0,
				len = tags.length;
			for (; i < len; i++) {
				Messaging.log("debug", "Processing event listener set '" + tags[i] + "'");
				
				// Load the listener set
				Messaging.loadListenerSet(tags[i]);
				
				// Initialize the runtime
				Runtime.globalObject = new Base.ObjectType();
				var env = Context.NewObjectEnvironment(Runtime.globalObject, null);
				Runtime.globalContext = new Context.ExecutionContext(
						env,
						env,
						exports.globalObject);
				Runtime.contextStack = [Runtime.globalContext];
				
				// Fire the process event
				Messaging.fireEvent("projectProcessingBegin");
				
				// Process the file
				exports.processFile(entryPoint, false);
			}
			
			Messaging.fireEvent("processingComplete");
		}, 0);
	});
};

// ******** Plugin Methods ********

/**
 * Processes a file.
 *
 * @private
 * @function
 * @param {String} file The path to the file to parse
 * @returns {JSValue} The value of the file, if there is one (e.g. module.exports).
 */
exports.processFile = function processFile(file) {
	
	// Make sure the file exists
	if (fs.existsSync(file)) {
		
		// Fire the parsing begin event
		Messaging.fireEvent("fileProcessingBegin", {
			file: file
		});
		
		// Set the current file
		Runtime.fileStack.push(file);
		
		// Read in the file and generate the AST
		var root = AST.parse(file);
		
		// Process the project
		RuleProcessor.processRule(root);
		
		// Restore the previous file
		Runtime.fileStack.pop();
		
	} else {
		Messaging.fireEvent("fileLoadError", {
			file: file,
			error: "File Not Found"
		});
	}
};