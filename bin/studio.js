//#!/usr/bin/env node
/*
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Provides a "server-like" interface for studio to interact with the code processor
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var appc = require('node-appc'),
	studioInterface = appc.messaging.create('stdio');
studioInterface.open();

/**
 * @name type
 * @property {String} type One of 'null', 'boolean', 'number', 'string', 'object', or 'array'
 * @property {String|Object} subType Only for type of 'array', this is the type of the array elements and is
 *		a type definition
 * @property {Object} properties Only for type of 'object', the properties of the object. Each key is the name of the
 *		property, and the value is a type definition
 * @property {String} [allowedValues] Only for primitive types, a list of allowed values
 * @property {String} [description] A description of this type
 * @example
 * {
 *		"type": {
 *			"type": "array",
 *			"subType": {
 *				"type": "object",
 *				"properties": {
 *					"name": {
 *						"type": "string",
 *						"description": "The name of the module"
 *					},
 *					"path": {
 *						"type": "string",
 *						"description": "The path to the module"
 *					},
 *					"type": {
 *						"type": "string",
 *						"allowedValues": [
 *							"commonjs",
 *							"iphone",
 *							"android",
 *							"mobileweb"
 *						]
 *						"description": "The type of the module"
 *					}
 *				}
 *			}
 *		},
 *		"description": "The list of modules used by the project"
 * }
 */

/**
 * @name option
 * @type Object
 * @property {Array[{@link type}]} types The list of possible types allowed by the option
 * @property {String} [description] A description of the option
 * @property {Boolean} required Whether or not this option is required
 * @example
 * {
 *		"types": [{
 *			"type": "string"
 *		}],
 *		"required": false,
 *		"description": "I am an option"
 * }
 */

/**
 * Querys a set of plugin search paths for plugins and their options
 * @module queryPlugins
 */
/**
 * An array of paths to search in addition to the default path, can be empty but must not be undefined
 * @type Array[Strings]
 * @name module:queryPlugins.queryPluginsRequest
 * @example
 * [
 *	"my/first/path",
 *	"my/second/path"
 * ]
 */
/**
 * @type Object
 * @name module:queryPlugins.queryPluginsResponse
 * @property {Object} plugin A plugin entry. The actual key is the name of the plugin
 * @property {String} plugin.path The path to the plugin
 * @property {Object} plugin.options The options for the plugin
 * @property {option} plugin.options.option The options for the plugin. The key is the name of the option
 * @example
 * {
 *	"require-finder": {
 *		"path":"path/to-plugin",
 *		"options": {
 *			"platform": {
 *				"type": "string",
 *				"description": "Specifies which platform specific folder inside of the Resources folder to require files from"
 *			}
 *		}
 *	}
 * }
 */
studioInterface.listen('queryPlugins', function(request, response) {
});

/**
 * Queries the set of options
 * @module queryOptions
 */
/**
 * There is no request data
 * @type Undefined
 * @name module:queryOptions.queryOptionsRequest
 */
/**
 * @type Object
 * @name module:queryOptions.queryOptionsResponse
 * @property {option} option The options for the plugin. The key is the name of the option
 * @example
 * {
 *	"platform": {
 *		"type": "string",
 *		"description": "Specifies which platform specific folder inside of the Resources folder to require files from"
 *	}
 * }
 */
studioInterface.listen('queryOptions', function(request, response) {
});

/**
 * Sets the options for a run
 * @module setOptions
 */
/**
 * @type Object
 * @name module:setOptions.setOptionsRequest
 * @property {option} option The options for the plugin. The key is the name of the option, and the value is the value
 * @example
 * {
 *	"searchPaths": [
 *		"path/1",
 *		"path/2"
 *	]
 * }
 */
/**
 * There is no response data, although there may be errors as reported by the "error" property in the messaging packet
 * @type Undefined
 * @name module:setOptions.setOptionsResponse
 */
studioInterface.listen('setOptions', function (request, response) {
});

/**
 * Sets the plugins and their options for a run
 * @module setPlugins
 */
/**
 * @type Object
 * @name module:setPlugins.setPluginsRequest
 * @property {Object} plugin The plugin. The key is the name of the plugin
 * @property {String} plugin.path The path to the plugin, as reported by {@link queryOptions}
 * @property {Object} plugin.options The options for the plugin
 * @property {option} plugin.options.option An option. They key is the name of the option
 * @example
 * {
 *	"require-finder": {
 *		"path":"path/to-plugin",
 *		"options": {
 *			"platform": "mobileweb"
 *		}
 *	}
 * }
 */
/**
 * There is no response data, although there may be errors as reported by the "error" property in the messaging packet
 * @type Undefined
 * @name module:setPlugins.setPluginsResponse
 */
studioInterface.listen('setPlugins', function (request, response) {
});

/**
 * Runs the project
 * @module run
 */
/**
 * @type Object
 * @name module:run.runRequest
 * @property {String} entryPoint The entry point for the project
 * @property {String} [logFile] A file to log the output of the code processor too. Useful for debugging
 * @example
 * {
 *	"entryPoint": "path/to/entry/point",
 *	"logFile": "path/to/log/file"
 * }
 */
/**
 * There is no response data, although there may be errors as reported by the "error" property in the messaging packet
 * @type Undefined
 * @name module:run.runResponse
 */
studioInterface.listen('run', function (request, response) {
});

/**
 * Gets the results from the previous run
 * @module getResults
 */
/**
 * There is no request data
 * @type Undefined
 * @name module:getResults.getResultsRequest
 */
/**
 * @type Object
 * @name module:getResults.getResultsResponse
 * @property {Object} plugin The results for a plugin. The key is the name of the plugin, and the value is the results
 *		(varies from plugin to plugin)
 * @example
 * {
 *	"platform": {
 *		"type": "string",
 *		"description": "Specifies which platform specific folder inside of the Resources folder to require files from"
 *	}
 * }
 */
studioInterface.listen('getResults', function (request, response) {
});

/**
 * Tells the app to exit
 * @module exit
 */
/**
 * There is no request data
 * @type Undefined
 * @name module:exit.exitRequest
 */
/**
 * There is no response data
 * @type Undefined
 * @name module:exit.exitResponse
 */
studioInterface.listen('exit', function (request, response) {
	studioInterface.close();
});


/**
 * Indicates that a file is about to be processed.
 *
 * @name module:CodeProcessor.fileProcessingBegin
 * @event
 * @property {String} filename The absolute path to the file that is about to be processed.
 * @see module:Runtime.on
 */

/**
 * Indicates that a file has finished being processed.
 *
 * @name module:CodeProcessor.fileProcessingEnd
 * @event
 * @property {String} filename The absolute path to the file that just finished being processed.
 * @see module:Runtime.on
 */

/**
 * Indicates that the current run of the project is about to be processed. Note tht event tags can cause multiple runs,
 * and thus multiple instances of this event.
 *
 * @name module:CodeProcessor.projectProcessingBegin
 * @event
 * @see module:Runtime.on
 */

/**
 * Indicates that the current run of the project has finished being processed. Note tht event tags can cause multiple runs,
 * and thus multiple instances of this event.
 *
 * @name module:CodeProcessor.projectProcessingEnd
 * @event
 * @see module:Runtime.on
 */

/**
 * Indicates that all parsing has been completed successfully.
 *
 * @name module:CodeProcessor.processingComplete
 * @event
 * @see module:Runtime#on