/*
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Documentation for the subprocess bin file in jsdoc format
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

// *******************************
// *        Generic types        *
// *******************************

/**
 * @name type
 * @property {String} type One of 'null', 'boolean', 'number', 'string', 'object', or 'array'
 * @property {type} subType Only for type of 'array', this is the type of the array elements
 * @property {Object} properties Only for type of 'object', the properties of the object
 * @property {option} properties.property A property, with the key being the name of the proprety
 * @property {Array[Primitive]} [allowedValues] Only for primitive types, a list of allowed values
 * @property {String} [description] A description of this type
 * @example
 * {
 *	"type": "array",
 *	"subType": {
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
 *		}
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
 * @module options
 */
/**
 * @name module:options.output
 * @property {option} optionName The options for the plugin. The key is the name of the option
 */

// *******************************
// *       Plugins Command       *
// *******************************

/**
 * Searches for plugins in the default path and the (optional) supplied search paths and queries them
 *
 * @module plugins
 */
/**
 * @name module:plugins.output
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
 * @module run
 */

// ******** Config File ********

/**
 * The spec for the config file supplied to the run command
 *
 * @name module:run.ConfigFileFormat
 * @property {String} entryPoint The path to the entry point file (a.k.a. app.js)
 * @property {Object} [log] Logging information. The information logged is the same information output to stdout when
 *		using the normal CLI interface, minus results
 * @property {String} log.path The path to the log file. The file does not need to exist, but the directory does
 * @property {String} log.level The log level. One of "trace", "debug", "info", "notice", "warn", or "error"
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
 * @name module:run.exitMessage
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
 * @name module:run.enteredFileMessage
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
 * @name module:run.projectProcessingBeginMessage
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
 * @name module:run.projectProcessingEndMessage
 * @param {Undefined} request There is no request data
 * @param {Undefined} response There is no response data
 */