#!/usr/bin/env node

/**
 * @fileoverview rovides a CLI interface into the code processor API
 * @author Bryan Hughes <bhughes@appcelerator.com>
 */

// ******** Requires and File-Level Variables ********

var util = require("util"),
	path = require("path"),
	fs = require("fs"),
	NomNom = require("nomnom"),
	winston = require("winston"),
	xml2js = require("xml2js"),
	wrench = require("wrench"),
	CodeProcessor = require("node-code-processor"),
	Exceptions = require("../lib/Exceptions"),

// ******** CLI Options Parsing ********

// Process the cli args
	parsedOptions = NomNom
		.option("plugin", {
			abbr: "p",
			metavar: "MODULE_NAME",
			list: true,
			type: "string",
			help: "Name of the plugin module to include"
		})
		.option("config", {
			abbr: "c",
			metavar: "CONFIG_OPTION=VALUE",
			list: true,
			help: "Processor options, defined as 'key=value'"
		})
		.option("verbose", {
			abbr: "v",
			flag: true,
			help: "Enable verbose logging. Equivalent to '-l debug'"
		})
		.option("log-level", {
			abbr: "l",
			metavar: "LOG_LEVEL",
			default: "notice",
			help: "The logging level",
			choices: ["emergency", "alert", "critical", "error", "warn", "notice", "info", "debug"]
		})
		.script("codeprocessor [project-dir]")
		.help("Processes the supplied project using the given plugins.")
		.nom(),
	i,
	len,
	configOption,
	options = {},
	projectRoot = ".",
	plugins,
	tiappxmlpath;

// Parse the config options
if (parsedOptions.config) {
	for(i = 0, len = parsedOptions.config.length; i < len; i++) {
		configOption = parsedOptions.config[i].split("=");
		if (configOption.length !== 2) {
			winston.log("error", "Invalid option '" + parsedOptions.config[i] + "'\n");
			process.exit(1);
		}
		options[configOption[0]] = configOption[1];
	}
}

// Calculate the project root
if (parsedOptions[0]) {
	projectRoot = parsedOptions[0];
}
projectRoot = path.resolve(projectRoot);

// ******** Code Processing ********

// Register any plugins
plugins = parsedOptions.plugin || [];

// Make sure that the project exists
if (!fs.existsSync(projectRoot)) {
	throw new Exceptions.InvalidArgumentsError("Error: project root '" + projectRoot + "' does not exist.");
}
	
// Validate the tiapp.xml
tiappxmlpath = path.join(projectRoot, "tiapp.xml");
if (!fs.existsSync(tiappxmlpath)) {
	throw new Exceptions.InvalidArgumentsError("Error: tiapp.xml file '" + tiappxmlpath + "' does not exist.");
}
	
// Parse the tiapp.xml file
winston.log("debug", "Processing tiapp.xml '" + tiappxmlpath + "'");
(new xml2js.Parser()).parseString(fs.readFileSync(tiappxmlpath).toString(), function (err, result) {
		
	// Check if there was an error parsing tiapp.xml
	if (err) {
		winston.log("error", "Could not parse '" + tiappxmlpath + "': " + err);
	} else {
			
		// Wrap in a set timeout so that exceptions don't get thrown through the xml parser
		setTimeout(function () {
				
			// Calculate the various directories of interest
			var codeProcessingDirectory = path.join(projectRoot, "build", "codeprocessing"),
				entryPoint = "app.js",
				startTime;
			
			entryPoint = path.join(projectRoot, "Resources", entryPoint);
			if (!fs.existsSync(entryPoint)) {
				throw new Exceptions.InvalidArgumentsError("Error: Project entry point '" + entryPoint + "' does not exist.");
			}
			winston.log("debug", "Processing app main '" + entryPoint + "'");

			// Process the code
			startTime = (new Date()).getTime();
			CodeProcessor.process([entryPoint], plugins, winston, options);
			
			winston.log("info", "Code processing finished successfully in " + ((new Date()).getTime() - startTime) + " ms.");
			winston.log("info", util.inspect(CodeProcessor.getResults(), false, 4));
			
			process.exit(result[0] === "normal" ? 0 : 1);
		}, 0);
	}
});