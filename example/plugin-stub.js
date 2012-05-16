/**
 * @fileoverview This file provides a stub for plugins. It is also used to document the plugin API.
 * @author Bryan Hughes <bhughes@appcelerator.com>
 */

/**
 * Creates an instance of the plugin that is associated with the provided code processor.
 *
 * @class A plugin hooks into a {@link CodeProcessor} to provide useful information on some aspect of the project. A
 * 		plugin could be created, for example, that scans a project for all require() statements and returns a list of
 * 		all required files.
 *
 * @constructor
 * @param {codeProcessor} codeProcessor The {@link CodeProcessor} to associate the plugin with.
 * @param {WinstonLogger} externalLogger An instance of a winston logger, configured for syslog levels, to use instead
 * 		of creating an internal logger.
 * @throws {InvalidArguments} Thrown when a valid {@link CodeProcessor} is not supplied.
 */
var Plugin = modules.exports = function(codeProcessor, externalLogger) {};

/**
 * Registers a callback to be called when the results for this plugin are ready
 * 
 * @function
 * @param {function} resultsListener The function to call once the results are ready.
 */
Plugin.prototype.addResultsListener = function(resultsListener) {};