/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * @module CodeProcessor
 * @author Bryan Hughes &lt;<a href="mailto:bhughes@appcelerator.com">bhughes@appcelerator.com</a>&gt;
 */

// ******** Requires ********

var winston = require("winston"),
	uglify = require("uglify-js"),
	xml2js = require("xml2js"),
	shelljs = require("shelljs"),
	InvalidStateError = require("./Exceptions.js").InvalidStateError,
	InvalidArgumentsError = require("./Exceptions.js").InvalidArgumentsError,
	is = require("./TiUtil").is,
	capitalize = require("./TiUtil").capitalize,
	createValue = require("./TiUtil").createValue,
	path = require("path"),
	fs = require("fs");
shelljs.silent(true); // Don't output stuff to the console

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
 * @see CodeProcessor#addProcessorStateListener
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
 * @see CodeProcessor#addProcessorStateListener
 */

/**
 * Indicates that a file is about to be processed. 
 *
 * @name CodeProcessor#fileProcessingBegin
 * @event
 * @param {JSContext} context The current state of the processor.
 * @param {Object} eventData The data for the event. 
 * @param {String} eventData.file The name of the file for which parsing is about to begin.
 * @see CodeProcessor#addProcessorStateListener
 */

/**
 * Indicates that a file has finished being processed successfully. 
 *
 * @name CodeProcessor#fileProcessingEnd
 * @event
 * @param {JSContext} context The current state of the processor.
 * @param {Object} eventData The data for the event. 
 * @param {String} eventData.file The name of the file for which parsing has just ended.
 * @see CodeProcessor#addProcessorStateListener
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
 * @see CodeProcessor#addProcessorStateListener
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
 * @see CodeProcessor#addProcessorStateListener
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
 * @see CodeProcessor#addProcessorStateListener
 */

/**
 * Indicates that all parsing has been completed successfully. Note: parsing complete also invokes the
 * {@link CodeProcessor#process} method's completion callback with the information below.
 *
 * @name CodeProcessor#processingComplete
 * @event
 * @param {JSContext} context The current state of the processor.
 * @param {Object={}} eventData The data for the event. This is an empty object
 * @see CodeProcessor#addProcessorStateListener
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
 * @see CodeProcessor#addRuleListener

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
 * @throws {InvalidArguments} Thrown when an valid project path is not specified
 */
var CodeProcessor = exports.CodeProcessor = function CodeProcessorConstructor(options) {

	// Use the logger, if supplied, or create a new one
	logger = options && options.logger;
	if (!logger) {
		logger = new (winston.Logger)({
			transports: [
				new (winston.transports.Console)({ level: "warn" })
			]
		});
		logger.setLevels(winston.config.syslog.levels);
	}
	this._log = function log(level, message) {
		if (level === "debug") {
			message = "(ti-code-processor) " + message;
		}
		logger.log(level, message);
	};

	// Process the options
	if (options) {

		// Parse the globals warnings flag
		this._analysisPrecision = typeof options.analysisPrecision === "number" && 
			options.analysisPrecision >= 1 && options.analysisPrecision <= 4 ? options.analysisPrecision : undefined;
		if (this._analysisPrecision !== undefined) {
			this._log("debug", "Setting analysis precision to " + this._analysisPrecision);
		} else {
			this._analysisPrecision = DEFAULT_ANALYSIS_PRECISION;
			this._log("debug", "No analysis precision specified, defaulting to " + this._analysisPrecision);
		}

		// Parse the minify flag
		this._minify = typeof options.minify === "boolean" ? options.minify : undefined;
		if (this._minify !== undefined) {
			this._log("debug", (this._minify ? "Enabling" : "Disabling") + " code minification");
		} else {
			this._minify = DEFAULT_CODE_MINIFICATION;
			this._log("debug", "Code minification not specified, defaulting to " + this._minify);
		}
	}

	// Initialize the event listeners
	this._taggedListeners = [];
	this._defaultListeners = {
		processStateListeners: [],
		ruleListeners: []
	};
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
 * @throws {InvalidArguments} Thrown when the project root does not exist.
 * @throws {InvalidArguments} Thrown when the tiapp.xml file could not be found.
 * @throws {InvalidArguments} Thrown when invalid callbacks are supplied.
 */
CodeProcessor.prototype.process = function process(projectRoot, completionCallback, errorCallback) {

	if (!path.existsSync(projectRoot)) {
		throw new InvalidArgumentsError("Error: project root '" + projectRoot + "' does not exist.");
	}

	// Hook up the callbacks
	this.addProcessorStateListener("processingComplete", completionCallback);
	this.addProcessorStateListener("processingError", errorCallback);

	// Validate the tiapp.xml
	var tiappxmlpath = path.join(projectRoot, "tiapp.xml");
	if (!path.existsSync(tiappxmlpath)) {
		throw new InvalidArgumentsError("Error: tiapp.xml file '" + tiappxmlpath + "' does not exist.");
	}

	// Parse the tiapp.xml file
	this._log("debug", "Processing tiapp.xml '" + tiappxmlpath + "'");
	var self = this;
	(new xml2js.Parser()).parseString(fs.readFileSync(tiappxmlpath).toString(), function (err, result) {

		// Check if there was an error parsing tiapp.xml
		if (err) {
			throw new Error("Could not parse '" + tiappxmlpath + "': " + err)
		}

		// Store the results
		self.tiappxml = result;

		// Find out what the main file is
		var entryPoint = "app.js";
		if (result.mobileweb.main) {
			entryPoint = result.mobileweb.main;
		}
		if (!path.existsSync(path.join(projectRoot,"Resources", entryPoint))) {
			throw new InvalidArgumentsError("Error: Project entry point '" + path.join(projectRoot,"Resources", entryPoint) + "' does not exist.");
		}
		self._log("debug", "Processing entry point '" + entryPoint + "'");

		// Create the code processing directory, if it doesn't exist
		var buildDirectory = path.join(projectRoot, "build"),
			codeProcessingDirectory = path.join(buildDirectory, "codeprocessing");
		// TODO: Replace next line with incremental build mechanism
		shelljs.rm("-r", codeProcessingDirectory);
		if (!path.existsSync(buildDirectory)) {
			fs.mkdir(buildDirectory)
		}
		if (!path.existsSync(codeProcessingDirectory)) {
			fs.mkdir(codeProcessingDirectory);
		}

		// Copy the resources directory into the working directory
		shelljs.cp("-r", path.join(projectRoot, "Resources"), codeProcessingDirectory);

		// If it exists, copy the modules directory into the working directory
		var modulesDir = path.join(projectRoot, "modules");
		if (path.existsSync(modulesDir)) {
			shelljs.cp("-r", modulesDir, codeProcessingDirectory);
		}

		self._processProject(path.join(codeProcessingDirectory, "Resources", entryPoint));
		
		setTimeout(function(){
			self._fireProcessStateEvent("processingComplete");
		}, 500);
	});
};

// ******** Plugin Methods ********

/**
 * Adds a processor state event listener for the given event name.
 *
 * @function
 * @param {String} name The name of the event to listen to, e.g. 'parseError'.
 * @param {function} callback The function to call when the event is fired.
 * @param {Boolean} [tag] Indicates the event listener set to be attached to. Each tag corresponds to a separate parse
 * 		of the tree, run in the order that the tag was added. If an event listener is going to modify the tree, a tag
 * 		<b>must</b> be provided so that it doesn't stomp on the other event listeners.
 */
CodeProcessor.prototype.addProcessorStateListener = function addProcessorStateListener(name, callback, tag) {

	// Fetch the event listener set
	var eventListeners = this._getListeners(tag).processStateListeners;

	// Store the event callback
	if (!eventListeners[name]) {
		eventListeners[name] = [];
	}
	eventListeners[name].push(callback);
};

/**
 * Adds a rule event listener for the given event name. Events can be 
 *
 * @function
 * @param {String} name The name of the event to listen to, e.g. 'call'.
 * @param {function} callback The function to call when the event is fired.
 * @param {Boolean} [tag] Indicates the event listener set to be attached to. Each tag corresponds to a separate parse
 * 		of the tree, run in the order that the tag was added. If an event listener is going to modify the tree, a tag
 * 		<b>must</b> be provided so that it doesn't stomp on the other event listeners.
 * @param {Boolean} [preorder] Fires the event <em>before</em> the rule is processed, as opposed to after.
 */
CodeProcessor.prototype.addRuleListener = function addRuleListener(name, callback, tag, preorder) {

	// Parse the parameters
	if (is(tag, "Boolean")) {
		preorder = tag;
		tag = undefined;
	}

	// Fetch the event listener set
	var eventListeners = this._getListeners(tag).ruleListeners;

	// Store the event callback
	if (!eventListeners[name]) {
		eventListeners[name] = {
			pre: [],
			post: []
		};
	}
	eventListeners[name][preorder ? "pre" : "post"].push(callback);
};

/**
 * Looks up a variable based on the variable name. This can only be called from within a rule event callback, otherwise
 *      it throws an exception.
 *
 * @function
 * @param {String} variableName The name of the variable to look up.
 * @throws {InvalidArguments} Thrown when a valid variable name is not supplied.
 * @throws {InvalidContext} Thrown when not called from within a rule event callback.
 * @returns {JSValue|undefined} Returns the value of the variable if found, else undefined.
 */
CodeProcessor.prototype.lookupVariable = function lookupVariable(variableName) {
	
};

/**
 * Replaces the current branch with the one supplied. 
 *
 * @function
 * @param {Object} [newBranch] the branch to replace the old one with. If ommitted, the old branch is deleted. If the
 *      new branch is not valid (i.e. has more than one root node, is not a properly formatted tree, etc), then it will
 *      throw an exception. This can only be called from within a rule event callback for a writeable plugin, otherwise
 *      it throws an exception.
 * @throws {InvalidArguments} Thrown when an invalid branch is supplied.
 * @throws {InvalidContext} Thrown when not called from within a rule event callback.
 */	
CodeProcessor.prototype.replaceCurrentBranch = function replaceCurrentBranch(newBranch) {
	
};

/**
 * Preprocesses the supplied code before the project is evaluated. Any symbols injected in the global namespace will
 * remain there when the project is evaluated. This can be used to "hard-code" values for optimization purposes.
 *
 * @function
 * @param {String} code The code to preprocess.
 * @throws {InvalidArgumentError} Thrown if there is a parse error in the code.
 */
CodeProcessor.prototype.preprocessCode = function preprocessCode(code) {
	
};

// ******** Private Event Methods ********

/**
 * Gets the list of listeners associated with the tag, creating them if need pe
 *
 * @private
 * @function
 * @param {String} tag The name of the tag.
 */
CodeProcessor.prototype._getListeners = function(tag) {
	var eventListeners;
	if (tag) {
		var taggedListeners = this._taggedListeners,
			i = 0,
			len = taggedListeners.length;
		for(; i < len; i++) {
			if (taggedListeners[i].tag == tag) {
				eventListeners = taggedListeners[i];
			}
		}
		if (!eventListeners) {
			taggedListeners.push(eventListeners = {
				tag: tag,
				processStateListeners: [],
				ruleListeners: []
			});
		}
	} else {
		eventListeners = this._defaultListeners;
	}
	return eventListeners
}

/**
 * Fires a process state event.
 *
 * @private
 * @function
 * @param {String} name The name of the event, e.g. "processingComplete."
 * @param {Object} data The event data to be sent to the event listeners.
 */
CodeProcessor.prototype._fireProcessStateEvent = function _fireProcessStateEvent(name, data) {
	var listeners = this._currentProcessStateListeners[name],
		i = 0,
		len = listeners ? listeners.length : 0
	!data && (data = {});

	this._log("debug", "Event '" + name + "': " + JSON.stringify(data));

	for(; i < len; i++) {
		listeners[i](this._currentScope.context, data);
	}
};

/**
 * Fires a rule event.
 *
 * @private
 * @function
 * @param {Object} rule The name of the event, e.g. "processingComplete."
 * @param {Object} [value] The event data to be sent to the event listeners.
 * @param {Boolean} [preorder] Indicates whether to fire the pre- or post-order rule event listeners.
 */
CodeProcessor.prototype._fireRuleEvent = function _fireRuleEvent(rule, value, preorder) {
	this._log("debug", (preorder ? "Pre-order " : "Post-order " ) + " rule event '" + rule[0].name + "': " + JSON.stringify(value));

	var i = 0,
		len,
		type = !!preorder ? "pre" : "post",
		listeners = this._currentRuleListeners[rule[0].name];
	listeners = listeners ? listeners[type] : [];
	for(len = listeners.length; i < len; i++) {
		listeners[i](this._currentScope.context, rule, value);
	}

	listeners = this._currentRuleListeners["allrules"];
	listeners = listeners ? listeners[type] : [];
	for(len = listeners.length; i < len; i++) {
		listeners[i](this._currentScope.context, rule, value);
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
	var i = 0,
		len = this._taggedListeners.length;

	// Helper for processing the project
	function processProjectHelper(listenerSet) {

		// Set the current listeners
		this._currentProcessStateListeners = listenerSet.processStateListeners;
		this._currentRuleListeners = listenerSet.ruleListeners;

		// Initialize the processing data.
		this._scopes = [];
		this._callStack = [];
		this._moduleList = []; // CommonJS modules. Could be Ti marketplace modules, but could also be part of the project.
		this._scopeStack = [];
		this._currentGlobalScope = this._masterGlobalScope = this._createScope("@global", entryPoint, 0, 0);

		// Process the file
		this._processFile(entryPoint, false);
	}

	// Parse the project for the tagged listeners
	for(; i < len; i++) {
		this._log("debug", "Processing event listener set tagged as '" + this._taggedListeners[i].tag + "'");
		processProjectHelper.call(this, this._taggedListeners[i]);
	}

	// Parse the project for the default listeners
	this._log("debug", "Processing default event listener set");
	processProjectHelper.call(this, this._defaultListeners);
};

/**
 * Processes a file.
 *
 * @private
 * @function
 * @param {String} file The path to the file to parse
 * @param {Boolean} [createContext] Indicates whether or not to create a file-level context for containing global
 * 		variables. This allows, for example, properly namespacing "global" variables in a CommonJS module which are
 * 		actually module-scope, not global-scope.
 * @returns {JSValue} The value of the file, if there is one (e.g. module.exports).
 */
CodeProcessor.prototype._processFile = function _processFile(file, createContext) {

	// Make sure the file exists
	if (path.existsSync(file)) {

		// Fire the parsing begin event
		this._fireProcessStateEvent("fileProcessingBegin", {
			file: file
		});

		// Create the new context, if necessary
		if (!!createContext) {
			this._currentGlobalScope = this._createScope("@scopedglobal-" + file, file, 0, 0);
		}

		// Files always start out as "global" scoped, whatever global is for the file.
		this._enterScope(this._currentGlobalScope);

		// Read in the file and generate the AST
		try {
			var root = uglify.parser.parse(fs.readFileSync(file).toString(), false, true);
		} catch (e) {
			this._log("error", "Syntax error: " + e.message);
			this._fireProcessStateEvent("parseError", {
				message: e.message,
				file: file,
				line: e.line,
				col: e.col
			});
			return;
		}

		// TODO: temporary validation check to make sure we fully understand UglifyJS' data structures. Remove once validated
		if (root.length !== 2 || root[0] !== "toplevel" || (root[1].constructor !== Array)) {
			throw new Error("Internal Error: unrecognized tree");
		}

		// Process the AST
		for(var i = 0, len = root[1].length; i < len; i++) {
			this._processRule(root[1][i]);
		}

	} else {
		this._fireProcessStateEvent("fileLoadError", {
			file: file,
			error: "File Not Found"
		});
	}
};

/**
 * Creates a scope
 *
 * @private
 */
CodeProcessor.prototype._createScope = function _createScope(name, file, line, col) {
	var newScope = {
		context: {
			name: name,
			file: file,
			line: line,
			col: col
		},
		symbols: []
	};
	this._scopes.push(newScope);
	return newScope;
};

/**
 * Enters the provided scope
 *
 * @private
 * @function
 * @param {Scope} scope The scope to enter
 */
CodeProcessor.prototype._enterScope = function _enterScope(scope) {
	var oldScope = this._currentScope;

	this._currentScope = scope;
	this._scopeStack.push(scope);

	this._fireProcessStateEvent("contextChange", {
		previousContext: oldScope && oldScope.context
	});
};

/**
 * Exits the current scope
 *
 * @private
 * @function
 */
CodeProcessor.prototype._exitScope = function _exitScope() {
	var oldScope = this._scopeStack.pop();
	this._currentScope = this._scopeStack[this._scopeStack.length - 1];

	this._fireProcessStateEvent("contextChange", {
		previousContext: oldScope.context
	});
};

/**
 * Creates a new symbol table entry.
 *
 * @private
 * @function
 * @param {JSValue} value The value to add
 */
CodeProcessor.prototype._createSymbolTableEntry = function _createSymbolTableEntry(name) {
	
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

	this._fireRuleEvent(rule, undefined, true);
	var result = this['_processRule' + capitalize(ruleInfo.name)](rule);
	this._fireRuleEvent(rule, result, false);

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
	return createValue("Number", rule[1]);
};

// (:string str)
CodeProcessor.prototype._processRuleString = function(rule) {
	return createValue("String", rule[1]);
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
	var declarations = rule[1],
		numDeclarations = declarations.length,
		i = 0,
		declaration,
		name,
		value;
	for(; i < numDeclarations; i++) {
		declaration = declarations[i];
		name = declaration[0];
		
		if (declaration[1]) {
			value = this._processRule(declaration[1]);
			if (value) {
				value = createValue(value.type, value.value, name);
			} else {
				value = createValue();
			}
		} else {
			value = createValue("Undefined", undefined, name);
		}
		console.log(name + " = " + value);
		
	}
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