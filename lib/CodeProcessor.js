/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @module CodeProcessor
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

// ******** Requires ********
var uglify = require("uglify-js"),
	xml2js = require("xml2js"),
	wrench = require("wrench"),
	
	path = require("path"),
	fs = require("fs"),
	
	is = require("./TiUtil").is,
	capitalize = require("./TiUtil").capitalize,
	
	Messaging = require("./Messaging"),
	RuleProcessor = require("./RuleProcessor"),
	
	Exceptions = require("./Exceptions"),
	
	Base = require("./Base"),
	Context = require("./Context");

// ******** Constants ********

var DEFAULT_ANALYSIS_PRECISION = 2,
	DEFAULT_CODE_MINIFICATION = true;

// ******** Event Documentation ********

/**
 * Indicates that <code>Ti.include()</code> was called. 
 *
 * @name CodeProcessor#fileInclude
 * @event
 * @param {JSContext} context The current state of the processor.
 * @param {Object} eventData The data for the event. 
 * @param {String} eventData.includingFile The name of the file that is including another file.
 * @param {String} eventData.file The name of the file being included.
 * @see CodeProcessor#on
 */

/**
 * Indicates that <code>require()</code> was called. 
 *
 * @name CodeProcessor#fileRequire
 * @event
 * @param {JSContext} context The current state of the processor.
 * @param {Object} eventData The data for the event. 
 * @param {String} eventData.requiringFile The name of the file that is requiring another file.
 * @param {String} eventData.module The module being included. Note: this is NOT the same as the file name for the
 *      module that was included.
 * @see CodeProcessor#on
 */

/**
 * Indicates that a file is about to be processed. 
 *
 * @name CodeProcessor#fileProcessingBegin
 * @event
 * @param {JSContext} context The current state of the processor.
 * @param {Object} eventData The data for the event. 
 * @param {String} eventData.file The name of the file for which parsing is about to begin.
 * @see CodeProcessor#on
 */

/**
 * Indicates that a file has finished being processed successfully. 
 *
 * @name CodeProcessor#fileProcessingEnd
 * @event
 * @param {JSContext} context The current state of the processor.
 * @param {Object} eventData The data for the event. 
 * @param {String} eventData.file The name of the file for which parsing has just ended.
 * @see CodeProcessor#on
 */

/**
 * Indicates that a requested file, either the entry point file or one that was required/included, could not be loaded .
 *
 * @name CodeProcessor#fileLoadError
 * @event
 * @param {JSContext} context The current state of the processor.
 * @param {Object} eventData The data for the event. 
 * @param {String} eventData.file The name of the file attempted to load.
 * @param {String} eventData.error Description of the error (e.g. "File Not Found").
 * @see CodeProcessor#on
 */

/**
 * Indicates that a context change, such as calling a closure, exiting a function, etc, has occurred. 
 *
 * @name CodeProcessor#contextChange
 * @event
 * @param {JSContext} context The current state of the processor.
 * @param {Object} eventData The data for the event. 
 * @param {JSContext} eventData.previousContext The previous context that was just exited. This value is undefined for
 * 		the very first context change (entering app.js), but is always defined after that.
 * @see CodeProcessor#on
 */

/**
 * Indicates that a parse error was encountered. Note: parse errors also invoke the {@link CodeProcessor#process} method's
 * error callback with the information below.
 *
 * @name CodeProcessor#parseError
 * @event
 * @param {JSContext} context The current state of the processor.
 * @param {Object} eventData The data for the event. 
 * @param {String} eventData.message The error message as reported from UglifyJS.
 * @param {Integer} eventData.file The file that the error occured in.
 * @param {Integer} eventData.line The line of the file where the error occured.
 * @param {Integer} eventData.column The column of the file where the error occured.
 * @see CodeProcessor#on
 */

/**
 * Indicates that all parsing has been completed successfully. Note: parsing complete also invokes the
 * {@link CodeProcessor#process} method's completion callback with the information below.
 *
 * @name CodeProcessor#processingComplete
 * @event
 * @param {JSContext} context The current state of the processor.
 * @param {Object={}} eventData The data for the event. This is an empty object
 * @see CodeProcessor#on
 */

/**
 * All rule events share the same signature and data format. You can pass in <code>"allrules"</code> to listen for every
 * rule event.
 *
 * @name CodeProcessor#ruleEvent
 * @event
 * @param {JSContext} context The current state of the processor.
 * @param {Object} eventData The data for the event. 
 * @param {Object[]} eventData.rule The rule, as defined by UglifyJS.
 * @param {JSValue|undefined} eventData.value If this rule can be represented by a value at runtime, it is supplied here.
 * @see CodeProcessor#on

// ******** Application Methods ********

/**
 * Creates an instance of the code processor
 * 
 * @class Provides Abstract Syntax Tree (AST) based parsing capabilities for Titanium Mobile projects. {@link Plugins}
 *      can be utilized to gather useful information about the project.
 * 
 * @constructor
 * @param {Object} [options] Options for controlling the code processor.
 * @param {Number} [options.analysisPrecision] Sets the analysis precision (1-4, default 2)
 * @param {Winston Logger} [options.logger] An instance of a winston logger (with syslog levels) to use instead of
 * 		creating an internal logger instance
 * @param {Boolean} [options.minify] Minifies all processed code after processing has completed.
 * @throws {module:Exceptions.InvalidArguments} Thrown when an valid project path is not specified
 */
var CodeProcessor = exports.CodeProcessor = function CodeProcessorConstructor(options) {

	// Use the logger, if supplied, or create a new one
	if (options && options.logger) {
		Messaging.setLogger(options.logger);
	}

	// Process the options
	if (options) {

		// Parse the globals warnings flag
		this._analysisPrecision = typeof options.analysisPrecision === "number" && 
			options.analysisPrecision >= 1 && options.analysisPrecision <= 4 ? options.analysisPrecision : undefined;
		if (this._analysisPrecision !== undefined) {
			Messaging.log("debug", "Setting analysis precision to " + this._analysisPrecision);
		} else {
			this._analysisPrecision = DEFAULT_ANALYSIS_PRECISION;
			Messaging.log("debug", "No analysis precision specified, defaulting to " + this._analysisPrecision);
		}

		// Parse the minify flag
		this._minify = typeof options.minify === "boolean" ? options.minify : undefined;
		if (this._minify !== undefined) {
			Messaging.log("debug", (this._minify ? "Enabling" : "Disabling") + " code minification");
		} else {
			this._minify = DEFAULT_CODE_MINIFICATION;
			Messaging.log("debug", "Code minification not specified, defaulting to " + this._minify);
		}
	}
	
	// Prime the rules
	var rules = wrench.readdirSyncRecursive(path.join(__dirname, "rules")),
		i = 0,
		len = rules.length;
	for(; i < len; i++) {
		console.log(path.join(__dirname, "rules", rules[i]));
		require(path.join(__dirname, "rules", rules[i]));
	}
};

/**
 * Begins to process a project. If only one function is supplied as an argument, it is assumed to be the
 * <code>completionCallback</code>.
 *
 * @function
 * @param {String} projectRoot The path to the root folder of the project. The processor will look for the tiapp.xml
 * 		file in this folder.
 * @param {function} [completionCallback] A callback to be called when all processing has completed successfully.
 * @param {function} [errorCallback] A callback to be called when an error occurred that prevents processing from
 * 		continuing, e.g. a syntax error in code.
 * @throws {module:Exceptions.InvalidArguments} Thrown when the project root does not exist.
 * @throws {module:Exceptions.InvalidArguments} Thrown when the tiapp.xml file could not be found.
 * @throws {module:Exceptions.InvalidArguments} Thrown when invalid callbacks are supplied.
 */
CodeProcessor.prototype.process = function process(projectRoot, completionCallback, errorCallback) {

	if (!fs.existsSync(projectRoot)) {
		throw new Exceptions.InvalidArgumentsError("Error: project root '" + projectRoot + "' does not exist.");
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
	var self = this;
	(new xml2js.Parser()).parseString(fs.readFileSync(tiappxmlpath).toString(), function (err, result) {

		// Wrap in a set timeout so that exceptions don't get thrown through the xml parser
		setTimeout(function() {
			var buildDirectory = path.join(projectRoot, "build"),
				codeProcessingDirectory = path.join(buildDirectory, "codeprocessing"),
				entryPoint = "app.js";
			
			// Check if there was an error parsing tiapp.xml
			if (err) {
				throw new Error("Could not parse '" + tiappxmlpath + "': " + err)
			}

			// Store the results
			self.tiappxml = result;

			// Find out what the main file is
			if (result.mobileweb.main) {
				entryPoint = result.mobileweb.main;
			}
			if (!fs.existsSync(path.join(projectRoot,"Resources", entryPoint))) {
				throw new Exceptions.InvalidArgumentsError("Error: Project entry point '" + path.join(projectRoot,"Resources", entryPoint) + "' does not exist.");
			}
			Messaging.log("debug", "Processing entry point '" + entryPoint + "'");

			// TODO: Replace next line with incremental build mechanism
			fs.rmdir(codeProcessingDirectory);
			
			// Create the code processing directory, if it doesn't exist
			if (!fs.existsSync(buildDirectory)) {
				fs.mkdir(buildDirectory)
			}
			if (!fs.existsSync(codeProcessingDirectory)) {
				fs.mkdir(codeProcessingDirectory);
			}

			// Copy the resources directory into the working directory
			wrench.copyDirSyncRecursive(path.join(projectRoot, "Resources"), codeProcessingDirectory);
			
			// TODO: Copy modules located inside the project to the working dir

			// Process the project
			self._processProject(path.join(codeProcessingDirectory, entryPoint));
			
			// TODO: the timeout is a temp method to simulate an asynchronous project completion
			setTimeout(function(){
				Messaging.fireEvent("processingComplete");
			}, 500);
		}, 0);
	});
};

// ******** Plugin Methods ********

/**
 * Replaces the current branch with the one supplied. 
 *
 * @function
 * @param {Object} [newBranch] the branch to replace the old one with. If ommitted, the old branch is deleted. If the
 *      new branch is not valid (i.e. has more than one root node, is not a properly formatted tree, etc), then it will
 *      throw an exception. This can only be called from within a rule event callback for a writeable plugin, otherwise
 *      it throws an exception.
 * @throws {module:Exceptions.InvalidArguments} Thrown when an invalid branch is supplied.
 * @throws {InvalidContext} Thrown when not called from within a rule event callback.
 */	
CodeProcessor.prototype.replaceCurrentBranch = function replaceCurrentBranch(newBranch) {
	
};

/**
 * Processes a file.
 *
 * @private
 * @function
 * @param {String} file The path to the file to parse
 * @returns {JSValue} The value of the file, if there is one (e.g. module.exports).
 */
CodeProcessor.prototype.processFile = function processFile(file) {

	// Make sure the file exists
	if (fs.existsSync(file)) {

		// Fire the parsing begin event
		Messaging.fireEvent("fileProcessingBegin", {
			file: file
		});

		// Read in the file and generate the AST
		var root;
		try {
			root = uglify.parser.parse(fs.readFileSync(file).toString(), false, true);
		} catch (e) {
			Messaging.log("error", "Parse error: " + e.message);
			Messaging.fireEvent("parseError", {
				message: e.message,
				file: file,
				line: e.line,
				col: e.col
			});
			return;
		}
		
		// Process the project
		RuleProcessor.processRule(root);

	} else {
		Messaging.fireEvent("fileLoadError", {
			file: file,
			error: "File Not Found"
		});
	}
};

// ******** Private Processing Methods ********

/**
 * Processes a project with the given entry point file. This method should only be called by
 * {@link CodeProcessor#process}. This method initializes all of the processing data structures and kickstarts processing.
 *
 * @private
 * @function
 * @param {String} entryPoint The path to the entry point of the file.
 */
CodeProcessor.prototype._processProject = function _processProject(entryPoint) {

	// Kickstart the processor
	var tags = Messaging.getTags(),
		i = 0,
		len = tags.length;

	// Parse the project for all listener sets
	for(; i < len; i++) {
		Messaging.log("debug", "Processing event listener set '" + tags[i] + "'");
		
		// Load the listener set
		Messaging.loadListenerSet(tags[i]);
		
		// Fire the process event
		Messaging.fireEvent("projectProcessingBegin");

		// Process the file
		this.processFile(entryPoint, false);
	}
};

/**
 * Processes the given tree. In practice, it really just processes the root node and recursively calls itself for the
 * children.
 *
 * @private
 * @function
 * @param {DictionaryTree} tree The tree to process.
 */
CodeProcessor.prototype._processRule = function _processRule(rule) {
	var ruleInfo = rule[0],
		keys = Object.keys(ruleInfo),
		value;

	// TODO: temporary validation check to make sure we fully understand UglifyJS' data structures. Remove once validated
	for(var i in keys) {
		if (ruleInfo[i] && ruleInfo[i] !== "name" && ruleInfo[i] !== "start" && ruleInfo[i] !== "end") {
			throw new Error("Internal error: unrecognized rule. rule info key '" + ruleInfo[i] + "' is not recognized");
		}
	}
	if (!ruleInfo.name || !ruleInfo.start || !ruleInfo.end) {
		throw new Error("Internal error: missing rule key " + ruleInfo.name + " " + ruleInfo.start + " " + ruleInfo.end);
	}

	// TODO: Create pre- and post- rule events
	var result = this['_processRule' + capitalize(ruleInfo.name)](rule);
	Messaging.fireEvent(rule[0], result);

	return result;
};

// ******** Private Rule Parsing Methods ********

// **** Literal rules ****

// (:atom atom)
CodeProcessor.prototype._processRuleAtom = function(rule) {
	console.dir(rule[1]);
};

// (:num num)
CodeProcessor.prototype._processRuleNum = function(rule) {
};

// (:string str)
CodeProcessor.prototype._processRuleString = function(rule) {
};

// (:name name)
CodeProcessor.prototype._processRuleName = function(rule) {
	
};

// (:array elems)
CodeProcessor.prototype._processRuleArray = function(rule) {
	
};

// (:object properties)
CodeProcessor.prototype._processRuleObject = function(rule) {
	
};

// (:regexp expr flags)
CodeProcessor.prototype._processRuleRegexp = function(rule) {
	
};

// **** Operator rules ****

// (:assign op place val)
CodeProcessor.prototype._processRuleAssign = function(rule) {
	
};

//(:binary op lhs rhs)
CodeProcessor.prototype._processRuleBinary = function(rule) {
	
};

//(:unary-postfix op place)
CodeProcessor.prototype["_processRuleUnary-postfix"] = function(rule) {
	
};

//(:unary-prefix op place)
CodeProcessor.prototype["_processRuleUnary-postfix"] = function(rule) {
	
};

//(:call func args)
CodeProcessor.prototype._processRuleCall = function(rule) {
	
};

//(:dot obj attr)
CodeProcessor.prototype._processRuleDot = function(rule) {
	
};

//(:sub obj attr)
CodeProcessor.prototype._processRuleSub = function(rule) {
	
};

//(:seq form1 result)
CodeProcessor.prototype._processRuleSeq = function(rule) {
	
};

//(:conditional test then else)
CodeProcessor.prototype._processRuleConditional = function(rule) {
	
};

//(:function name args stat*)
CodeProcessor.prototype._processRuleFunction = function(rule) {
	
};

//(:new func args)
CodeProcessor.prototype._processRuleNew = function(rule) {
	
};

// **** Block rules ****

//(:toplevel stat*)
CodeProcessor.prototype._processRuleToplevel = function(rule) {
	
};

//(:block stat*)
CodeProcessor.prototype._processRuleBlock = function(rule) {
	
};

//(:stat form)
CodeProcessor.prototype._processRuleStat = function(rule) {
	
};

//(:label name form)
CodeProcessor.prototype._processRuleLabel = function(rule) {
	
};

//(:if test then else)
CodeProcessor.prototype._processRuleIf = function(rule) {
	
};

//(:with obj body)
CodeProcessor.prototype._processRuleWith = function(rule) {
	
};

//(:var bindings)
CodeProcessor.prototype._processRuleVar = function(rule) {
	
};

//(:defun name args stat*)
CodeProcessor.prototype._processRuleDefun = function(rule) {
	
};

//(:return value)
CodeProcessor.prototype._processRuleReturn = function(rule) {
	
};

//(:debugger)
CodeProcessor.prototype._processRuleDebugger = function(rule) {
	
};

// **** Exception rules ****

//(:try body catch finally)
CodeProcessor.prototype._processRuleTry = function(rule) {
	
};

//(:throw expr)
CodeProcessor.prototype._processRuleThrow = function(rule) {
	
};

// **** Control flow rules ****

//(:break label)
CodeProcessor.prototype._processRuleBreak = function(rule) {
	
};

//(:continue label)
CodeProcessor.prototype._processRuleContinue = function(rule) {
	
};

//(:while cond body)
CodeProcessor.prototype._processRuleWhile = function(rule) {
	
};

//(:do cond body)
CodeProcessor.prototype._processRuleDo = function(rule) {
	
};

//(:for init cond step body)
CodeProcessor.prototype._processRuleFor = function(rule) {
	
};

//(:for-in init lhs obj body)
CodeProcessor.prototype["_processRuleFor-in"] = function(rule) {
	
};

//(:switch val (case . body)*)
CodeProcessor.prototype._processRuleSwitch = function(rule) {
	
};

//(:directive val)
CodeProcessor.prototype._processRuleDirective = function(rule) {

};