/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 * 
 * Provides a CLI for the code processor tests
 * @author Allen Yeung <ayeung@appcelerator.com>
 */

// ******** Requires and File-Level Variables ********
debugger
var winston = require("winston"),
	NomNom = require("nomnom"),
	path = require("path"),
	CodeProcessor = require("node-code-processor"),
	childProcess = require('child_process');

// ******** Helper Methods ********

function log(level, message) {
	if (level === "debug") {
		message = "(node-code-processor-tests) " + message;
	}
	logger.log(level, message);
}

// ******** CLI Options Parsing ********

// Process the cli args
var parsedOptions = NomNom
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
	.option("file", {
		abbr: "f",
		help: "The file to process",
		hidden: true
	})
	.script("codeprocessor [project-dir]")
	.help("Runs the code processor tests using the given plugins.")
	.nom();

// Calculate the debug level and create the logger

var logger = new (winston.Logger)({
	transports: [
		new (winston.transports.Console)({ level: parsedOptions.verbose ? "debug" : parsedOptions["log-level"] })
	]
});
logger.setLevels(winston.config.syslog.levels);

// Parse the config options
var i,
	len,
	configOption,
	options = { logger: logger };
if (parsedOptions.config) {
	for(i = 0, len = parsedOptions.config.length; i < len; i++) {
		configOption = parsedOptions.config[i].split("=");
		if (configOption.length !== 2) {
			log("error", "Invalid option '" + parsedOptions.config[i] + "'\n");
			process.exit(1);
		}
		options[configOption[0]] = configOption[1];
	}
}

// Calculate the project root
var projectRoot = ".";
if (parsedOptions[0]) {
	projectRoot = parsedOptions[0];
}
projectRoot = path.resolve(projectRoot);

// ******** Unit tests ********

// Register any plugins
var plugins = parsedOptions.plugin || [];

if(parsedOptions.file) {
	// Process file only
	CodeProcessor.runUnitTest([parsedOptions.file], plugins, options, {}, {});

} else {
	// Call the test262 to run the unit tests
	var args = process.argv, command;
		
	// Remove 'node' and the file executable from the arguments
	args.splice(0,2);
	command = path.resolve("bin/codeProcessorTest ") + args.join(" ") + " -f ";
	
	// We are running something like:
	// tools/packaging/test262.py --command "<path_to_codeProcessorTest> <additional arguments> -f "
	var test262 = childProcess.spawn("tools/packaging/test262.py", ["--command", command], {cwd: path.resolve("third-party/test262"), stdio: "inherit"});
	
	test262.on('exit', function(code){
		if (code !== 0) {
			log('info',"Successfully ran code processor tests.");
		}
	});
}
