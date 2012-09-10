/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * This plugin finds the deprecated Titanium APIs that are used.
 * 
 * @module plugin/TiAPIDeprecationFinder
 * @author Allen Yeung &lt;<a href="mailto:ayeung@appcelerator.com">ayeung@appcelerator.com</a>&gt;
 */
 
var path = require("path"),
	Base = require(path.join(global.nodeCodeProcessorLibDir, "Base")),
	Runtime = require(path.join(global.nodeCodeProcessorLibDir, "Runtime")),
	Exceptions = require(path.join(global.nodeCodeProcessorLibDir, "Exceptions")),
	RuleProcessor = require(path.join(global.nodeCodeProcessorLibDir, "RuleProcessor"));

// ******** Plugin API Methods ********

/**
 * Creates an instance of the Ti event processor plugin
 * 
 * @classdesc Analysis event callbacks
 * 
 * @constructor
 */
module.exports = function (cli) {
	Runtime.on("tiPropReferenced", function(e) {
		var func = args[0],
			eventDescription,
			eventData,
			result;
	
		if (++Runtime.recursionCount === Runtime.options.maxRecursionLimit) {
		
			// Fire an event and report a warning
			eventDescription = "Maximum application recursion limit of " + Runtime.options.maxRecursionLimit + 
				" reached, could not fully process code";
			eventData = {
				ruleName: "call"
			};
			Runtime.fireEvent("maxRecusionLimitReached", eventDescription, eventData);
			Runtime.reportWarning("maxRecusionLimitReached", eventDescription, eventData);
		
		} else if (Base.type(func) !== "Unknown") {
				if (func.className !== "Function" || !Base.isCallable(func)) {
					throw new Exceptions.TypeError();
				}
				
				// Call the function, discarding the result
				Runtime.ambiguousCode++;
				func.call(new Base.UndefinedType(), [new Base.UnknownType()]);
				Runtime.ambiguousCode--;
			}
		}
		Runtime.recursionCount--;
	});
};

/**
 * Initializes the plugin
 * 
 * @method
 */
module.exports.prototype.init = function init() {};

/**
* Gets the results of the plugin
* 
* @method
* @returns {Object} A dictionary of the deprecated Titanium APIs that were used along with a count of how many times they were used.
*/
module.exports.prototype.getResults = function getResults() {
	return results;
};