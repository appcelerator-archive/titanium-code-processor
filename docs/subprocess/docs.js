/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Documentation for the subprocess bin file in jsdoc format
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

/** <pre>Command usage:
Usage: subprocess run <config file>
       subprocess queryPlugins [<search path> [<search path> [...]]]
       subprocess queryOptions

Commands:
   run       Runs the Titanium Code Processor using the supplied config file in interactive mode
   plugins   Queries the plugins in the default search path and the listed search paths
   options   Queries the options

Note: this interface is only intended for applications that subprocess the Titanium Code Processor</pre>
 * @module CommandUsage
 */

// *******************************
// *        Generic types        *
// *******************************

/**
 * @name type
 * @property {String} type One of 'null', 'boolean', 'number', 'string', 'object', 'array', or 'dictionary'. Note: type
 *		'dictionary' is just an object that takes in an arbitrary set of key:value pairs
 * @property {Array[{@link type}]} subType Only for type of 'array', this is the types of the array elements
 * @property {Object} properties Only for type of 'object', the properties of the object
 * @property {option} properties.property A property, with the key being the name of the proprety
 * @property {Array[Primitive]} [allowedValues] Only for primitive types, a list of allowed values
 * @property {Object} key Only for type of 'dictionary', information about the key
 * @property {String} [key.description] A description of the key
 * @property {option} [value] Only for type of 'dictionary', information about the value
 * @example
 * {
 *	"type": "array",
 *	"subTypes": [{
 *		"type": "object",
 *		"properties": {
 *			"name": {
 *				"types": [{
 *					"type": "string",
 *				}],
 *				"description": "The name of the module"
 *			},
 *			"path": {
 *				"types": [{
 *					"type": "string",
 *				}],
 *				"description": "The path to the module"
 *			},
 *			"type": {
 *				"types": [{
 *					"type": "string",
 *					"allowedValues": [
 *						"commonjs",
 *						"iphone",
 *						"android",
 *						"mobileweb"
 *					]
 *				}],
 *				"description": "The type of the module"
 *			}
 *		}]
 * }
 */

/**
 * @name option
 * @type Object
 * @property {Array[{@link type}]} types The list of possible types allowed by the option
 * @property {String} [description] A description of the option
 * @property {Boolean} required Whether or not this option is required
 * @property {Any} [defaultValue] The devault value
 * @example
 * {
 *		"types": [{
 *			"type": "string"
 *		}],
 *		"required": false,
 *		"description": "I am an option",
 *		"defaultValue": "hi"
 * }
 */

// *******************************
// *       Options Command       *
// *******************************

/**
 * Queries the code processor options
 *
 * @module OptionsSubcommand
 */
/**
 * @name module:OptionsSubcommand.output
 * @property {option} optionName The options for the plugin. The key is the name of the option
 */

// *******************************
// *       Plugins Command       *
// *******************************

/**
 * Searches for plugins in the default path and the (optional) supplied search paths and queries them
 *
 * @module PluginsSubcommand
 */
/**
 * @name module:PluginsSubcommand.output
 * @property {Object} pluginName A plugin entry. The actual key is the name of the plugin
 * @property {String} pluginName.path The path to the plugin
 * @property {Array[String]} pluginName.dependencies The plugin dependencies, with each entry being the plugin name
 * @property {Object} pluginName.options The options for the plugin
 * @property {option} pluginName.options.optionName The options for the plugin. The key is the name of the option
 */

// *******************************
// *         Run Command         *
// *******************************

/**
 * The run command runs the code processor using the supplied configuration file
 *
 * @module RunSubcommand
 */

// ******** Config File ********

/**
 * The spec for the config file supplied to the run command
 *
 * @name module:RunSubcommand.ConfigFileFormat
 * @property {String} entryPoint The path to the entry point file (a.k.a. app.js)
 * @property {Object} [logging] Logging information. The information logged is the same information output to stdout when
 *		using the normal CLI interface, minus results
 * @property {Object} [logging.console] Options for the console log. If ommitted, nothing will be logged to the console
 *		(ignored when using the subprocess command)
 * @property {String} logging.console.level The log level. One of "trace", "debug", "info", "notice", "warn", or "error"
 * @property {Object} [logging.file] Options for the file log. If ommitted, a file log will not be created
 * @property {String} logging.file.path The path to the log file. The file does not need to exist, but the directory does
 * @property {String} logging.file.level The log level. One of "trace", "debug", "info", "notice", "warn", or "error"
 * @property {Object} options The core code processor options (run 'subprocess options' to see the list of options)
 * @property {Any} options.optionName An option value. The object key is the name of the option
 * @property {Object} plugins The plugins to load and their options
 * @property {Object} plugins.pluginName A plugin value. The object key is the name of the plugin
 * @property {String} plugins.pluginName.path The path to the plugin
 * @property {Object} plugins.pluginName.options The options for the plugin
 * @property {Any} plugins.pluginName.options.optionName An option value. The object key is the name of the option
 */

// ******** Inbound Messages ********

/**
 * Tells the app to exit
 * <p>
 * Initiated by: External Process
 * <br/>
 * Message name: "exit"
 * </p>
 * @event
 * @name module:RunSubcommand.exitMessage
 * @param {Undefined} request There is no request data
 * @param {Undefined} response There is no response data
 */

// ******** Outbound Messages ********

/**
 * Indicates that a file was just entered
 * <p>
 * Initiated by: Code Processor
 * <br/>
 * Message name: 'enteredFile'
 * </p>
 * @event
 * @name module:RunSubcommand.enteredFileMessage
 * @param {String} request The absolute path to the file that was just entered
 * @param {Undefined} response There is no response data
 */

/**
 * Indicates that the current run of the project is about to be processed, and all pre-processing steps have been completed successfully
 * <p>
 * Initiated by: Code Processor
 * <br/>
 * Message name: 'projectProcessingBegin'
 * </p>
 * @event
 * @name module:RunSubcommand.projectProcessingBeginMessage
 * @param {Undefined} request There is no request data
 * @param {Undefined} response There is no response data
 */

/**
 * Indicates that the current run of the project has finished being processed
 * <p>
 * Initiated by: Code Processor
 * <br/>
 * Message name: 'projectProcessingEnd'
 * </p>
 * @event
 * @name module:RunSubcommand.projectProcessingEndMessage
 * @param {Undefined} request There is no request data
 * @param {Undefined} response There is no response data
 */

/**
 * An error was found in the project
 * <p>
 * Initiated by: Code Processor
 * <br/>
 * Message Name: 'error'
 * </p>
 * @event
 * @name module:RunSubcommand.errorMessage
 * @param {Object} request The error that occured
 * @param {String} request.filename The path to the file where the error occured
 * @param {Number} request.line The line number where the error occured
 * @param {Number} request.column The column number where the error occured
 * @param {String} request.type The type of error (e.g. TypeError)
 * @param {String} request.description A description of the error
 * @param {Undefined} response There is no response data
 */

/**
 * A warning was found in the project
 * <p>
 * Initiated by: Code Processor
 * <br/>
 * Message Name: 'warning'
 * </p>
 * @event
 * @name module:RunSubcommand.warningMessage
 * @param {Object} request The warning that occured
 * @param {String} request.filename The path to the file where the warning occured
 * @param {Number} request.line The line number where the warning occured
 * @param {Number} request.column The column number where the warning occured
 * @param {String} request.type The type of warning (e.g. invalidPlatformReference)
 * @param {String} request.description A description of the warning
 * @param {Undefined} response There is no response data
 */

/**
 * The program output some data to the console
 * <p>
 * Initiated by: Code Processor
 * <br/>
 * Message Name: 'consoleOutput'
 * </p>
 * @event
 * @param {String} level The log level, e.g. 'error'
 * @param {String} message The message output to the console
 */