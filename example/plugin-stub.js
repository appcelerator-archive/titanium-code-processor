/**
 * @fileoverview This file provides a stub for plugins. It is also used to document the plugin API.
 * @author Bryan Hughes <bhughes@appcelerator.com>
 */

/**
 * Creates an instance of the plugin that is associated with the provided analyzer.
 *
 * @class A plugin hooks into a {@link CodeAnalyzer} to provide useful information on some aspect of the project. A
 * 		plugin could be created, for example, that scans a project for all require() statements and returns a list of all required files.
 *
 * @constructor
 * @param {CodeAnalyzer} codeAnalyzer The {@link CodeAnalyzer} to associate the plugin with.
 * @throws {InvalidArguments} Thrown when a valid {@link CodeAnalyzer} is not supplied.
 */
var Plugin = modules.exports = function(codeAnalyzer) {
	
};

/**
 * Adds a results listener. This is the only way to get the results from the plugin.
 * 
 * @function
 * @param {function(results)} resultsListener A callback to be called once the results are ready.
 * @throws {InvalidArguments} Thrown when a valid resultsListener is not supplied.
 */
Plugin.prototype.addResultsListener = function(resultsListener) {
	
};