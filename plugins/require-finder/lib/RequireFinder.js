/**
 * @fileoverview This file provides the definition for the require finder plugin for ti-code-processor.
 * @author Bryan Hughes <bhughes@appcelerator.com>
 */
 
// ******** Requires ********

var util = require("util"),
	CodeProcessor = require("ti-code-processor"),
	Messaging = CodeProcessor.Messaging;

// ******** Event Documentation ********

/**
 * Indicates that results are available. Registering for this callback is the only way to obtain the results of a plugin.
 *
 * @name RequireFinder#resultsAvailable
 * @event
 * @param {RequireFinderResults} results The required()'d and Ti.include()'d modules/files.
 */

// ******** Methods ********

/**
 * Creates an instance of the require finder plugin that is associated with the provided code processor.
 *
 * @class A plugin hooks into a {@link CodeProcessor} to provide useful information on some aspect of the project. A
 * 		plugin could be created, for example, that scans a project for all require() statements and returns a list of
 * 		all required files.
 *
 * @constructor
 * @param {CodeProcessor} codeProcessor The {@link CodeProcessor} to associate the plugin with.
 * @throws {InvalidArguments} Thrown when a valid {@link CodeProcessor} is not supplied.
 */
var RequireFinder = module.exports = function() {

	// Initialize the results
	this._results = {
		includes: [],
		requires: []
	};
	Messaging.log("debug", "Require-finder initialized", "(ti-require-finder)");
};