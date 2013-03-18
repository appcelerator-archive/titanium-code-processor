Titanium Code Processor
=======================

The Titanium Code Processor is a tool for analyzing JavaScript code in
[Titanium Mobile](https://github.com/appcelerator/titanium_mobile) projects. It
provide a wide variety of useful functionality, including runtime error detection,
Titanium API deprecation warnings, platform specific API validation, and more.
It is built using a robust plugin solution that makes it relatively easy to add
new analyses to the code processor. The tool can be used as a stand-alone binary,
used as part of the Titanium CLI, or incorporated as a library into other node.js
applications (See the API documentation in the 'docs' folder for more
information on using the code processor as a library).

Note: In this document, whenever a data structure is defined, it uses the following convention:

**[{name}]** [&lt;optional&gt;] _{type}_ [{description}]

Fields in [] are optional. If the type definition does not explicitly say &lt;optional&gt;, then it is required. If a
type has children, i.e. it is an object or array, then it's children are specified using indented lines immediately
below the type definition. Object properties always have a name and array entries never have a name.

## Table of Contents
* [Quick Start](#quick-start)
	* [Install Using NPM](#install-using-npm)
	* [Run](#run)
* [Running Using the Standalone Command](#running-using-the-standalone-command)
	* [Analyze Sub-Command](#analyze-sub-command)
	* [Options Sub-Command](#options-sub-command)
	* [Plugins Sub-Command](#plugins-sub-command)
	* [Subprocess sub-command](#subprocess-sub-command)
		* [Low Level Packet Format](#low-level-packet-format)
		* [High Level Packet Format](#high-level-packet-format)
		* [Code Processor Message Types](#code-processor-message-types)
	* [Config File Example](#config-file-example)
* [Running as Part of the Titanium CLI](#running-as-part-of-the-titanium-cli)
* [Runtime Options](#runtime-options)
* [Built-in Plugins](#built-in-plugins)
* [Internal Concepts](#internal-concepts)

## Quick Start

### Install Using NPM

```
[sudo] npm install -g titanium-code-processor
```
The code processor relies on the new [Titanium CLI](https://github.com/appcelerator/titanium), so make sure
it is installed before continuing. If you have a 3.0.0. or newer Titanium SDK installed, you already have the CLI.

### Run

From within your project directory, run:
```
titanium-code-processor analyze -o iphone
```

## Running Using the Standalone Command

```
titanium-code-processor [sub-command] [options]
```
Sub-commands
* analyze - Analyzes a project
* options - Queries the options available
* plugins - Queries the plugins available in the supplied search paths, if any, and the default path
* subprocess - Provides an interactive interface for working with the code processor from another process

Note: if you are not going to subprocess the Titanium Code Processor, then the analyze command is all you need.

### Analyze Sub-Command

```
titanium-code-processor analyze [options]
```
Analyzes a project.

List of options

Option | Description
-------|------------
--plugin, -p &lt;plugin name&gt; | Specifies a plugin to load. The -p flag expects the name of a single plugin, e.g. ```-p ti-api-deprecation-finder```
--config, -c &lt;option=value&gt; | Specifies a configuration option and it's value, e.g ```-c invokeMethods=false```
--log-level, -l | Sets the log level. Possible values are 'error', 'warn', 'notice', 'info', 'debug', or 'trace'
--osname, -o | The name of the OS being analyzed for. This is the value that will be reported via 'Ti.Platform.osname', and must be one of 'android', 'iphone', 'ipad', or 'mobileweb'. This flag is **required**
--project-dir, -d | The directory of the project to load. If not specified, defaults to the current directory
--config-file, -f | The path to the config file. Note: when this flag is specified, all other flags are ignored and tiapp.xml is not parsed
--results-dir, -r | The path to the directory that will contain the results
--all-plugins, -a | Loads all plugins in the default search path
--non-ti-plugins, -t | Loads all non-titanium specific plugins in the default search path

### Options Sub-Command

```
titanium-code-processor options
```
This command provides detailed information on all of the options that are available to the code processor. Results are output in JSON format for easy parsing. Option names, valid value types, etc. are included in the results. Each option has the following format:

Option definition:
* **types** _array_ The list of possible types allowed by the option
	* _type_ See type definition below
* **description** &lt;optional&gt; _string_ A description of the option
* **required** _boolean_ Whether or not this option is required
* **defaultValue** &lt;optional&gt; _any_ The devault value

Type definition:
* **type** _string_ One of 'null', 'boolean', 'number', 'string', 'object', or 'array'
* **subType** _type_ Only for type of 'array', this is the type of the array elements
* **properties** _object_ Only for type of 'object', the properties of the object, with each key being the property name, and the value an option as defined above
	* **&lt;propertyName&gt;** _option_ A property of the object
* **allowedValues** &lt;optional&gt; _array_ A list of allowed values
	* _primitive_ only primitive types (boolean, number, string, null, undefined) are allowed
* **description** &lt;optional&gt; _string_ A description of this type

As an example:

```JSON
{
	"myOption": {
		"types": [{
			"type": "object",
			"properties": {
				"foo": {
					"types": [{
						"type": "string"
					}]
					"required": true
				}
			}
		}],
		"required": false,
		"description": "I am an option",
		"defaultValue": "hi"
	}
}
```

### Plugins Sub-Command

```
titanium-code-processor plugins [<search path 1> [<search path 2> [...]]]
```
This command provides detailed information all plugins found in the default search path (&lt;code processor dir&gt;/plugins) and in the search paths provided (if any) in JSON format for easy parsing. The path to the plugin, options the plugin takes, etc. are included in the results. The output has the following format:

* **&lt;plugin-name&gt;** _object_
	* **path** _string_ The full path to the plugin
	* **otherEntry** _any_ Each entry from the package.json is duplicated here

### Subprocess Sub-Command

```
titanium-code-processor subprocess <path/to/config/file>
```
The subprocess sub-command can be used to sub-process the code processor. Input and output is handled via stdin and stdout using a structured streaming format. All options are set via the config file. Information is passed back and forth using a custom two-layer packet format. The lower layer is completely custom, while the upper layer is formatted JSON and is encapsulated by the lower layer

#### Low Level Packet Format

The low level packet consists of four comma separated fields that forms either a request or a response message
```
[Message Type],[Sequence ID],[Message Length],[data]
```
Note: the packet header at this level is ASCII formatted, although the data can theoretically be in any format

Name | Description
-----|------------
MessageType | A three character sequence that is either 'REQ' (request) or 'RES' (response)
Sequence ID | A 32-bit, base 16 number that identifies the message. This value is always 8 characters long, and includes 0 padding if necessary. Note: Response messages have the same Sequence ID as the request that generated the response
Message Length | A 32-bit, base 16 number that identifies the length of the message. This value is always 8 characters long, and includes 0 padding if necessary. Hex letters must be lower case.

Example:
```
REQ,000079AC,0000000C,{foo: 'bar'}
RES,000079AC,0000000C,{foo: 'baz'}
```

#### High Level Packet Format

The high level packet is just a JSON string. The contents of the JSON object vary depending on message type and context.

A request always has the following definition:

* **messageType** _string_ A free form string defining the type of message, and is typically the name of an event
* **data** _any_ Any valid JSON value. Set to ```null``` if there is no data.

Example:
```JSON
{
	"messageType": "enteredFile",
	"data": {
		"filename": "path/to/file"
	}
}
```

A response is one of two possible definitions:

* **error** _string_ A string describing the error

or

* **data** _any_ Any valid JSON value. Set to ```null``` if there is no data

Examples:
```JSON
{
	"error": "I can't do that Dave"
}
```
```JSON
{
	"data": 10
}
```

#### Code Processor Message Types

The code processor sends seven possible messages, listed below

**enteredFile**

A file was just entered. Note that it is possible for a file to be entered multiple times.

* _string_ The path to the file that was just entered

Example:
```JSON
"path/to/file"
```

**projectProcessingBegin**

All pre-processing has completed and processing is about to begin. Contains no data

* _null_

Example:
```JSON
null
```

**projectProcessingEnd**

The project processing has completed, results are being calculated. Contains no data

* _null_

Exmaple:
```JSON
null
```

**warningReported**

A warning was encountered. When a warning is detected, this message is immediately sent, meaning that they will always
come before ```projectProcessingEnd```

* **type** _string_ The type of warning
* **description** _string_ A description of the warning
* **filename** _string_ The full path to the file where the warning was detected
* **line** _number_ The line number where the warning was detected
* **column** _number_ The column number where the warning was detected

Example:
```JSON
{
	"type": "WarningType",
	"description": "The description of the warning",
	"filename": "path/to/file",
	"line": 0,
	"column": 0
}
```

**errorReported**

An error was encountered. When an error is detected, this message is immediately sent, meaning that they will always
come before ```projectProcessingEnd```

* **type** _string_ The type of error
* **description** _string_ A description of the error
* **filename** _string_ The full path to the file where the error was detected
* **line** _number_ The line number where the error was detected
* **column** _number_ The column number where the error was detected

Example:
```JSON
{
	"type": "ErrorType",
	"description": "The description of the error",
	"filename": "path/to/file",
	"line": 0,
	"column": 0
}
```

**consoleOutput**

The program being analyzed output something to the console via ```console.*``` or ```Ti.API.*```

* **level** _string_ The log level of the message, e.g. "info" for ```Ti.API.info```
* **message** _string_ The message being logged to the console

```JSON
{
	"level": "error",
	"message": "I am being logged"
}
```

**results**

The results from the project

* **errors** _array_ The errors from the project. The array is empty, but exists, if no errors were found
	* **type** _string_ The type of error
	* **description** _string_ A description of the error
	* **filename** _string_ The full path to the file where the error was detected
	* **line** _number_ The line number where the error was detected
	* **column** _number_ The column number where the error was detected
* **warnings** _array_ The warnings from the project. The array is empty, but exists, if no warnings were found
	* **type** _string_ The type of warning
	* **description** _string_ A description of the warning
	* **filename** _string_ The full path to the file where the warning was detected
	* **line** _number_ The line number where the warning was detected
	* **column** _number_ The column number where the warning was detected
* **plugins** _array_
	* **name** _string_ The name of the plugin, e.g. "ti-api-deprecation-finder"
	* **&lt;other key&gt;** Some other key specific to the plugin. See the plugin's README for detailed information
* **elapsedTime** _number_ The amount of time it took to process the project, in ms
* **resultsPath** _string_ The value of ```resultsPath``` passed to the code processor, for easy reference

Example:
```JSON
{
	"errors": [{
		"name": "SyntaxError",
		"description": "The description of the error",
		"data": {
			"otherKeys": "other data, including message, type, etc"
		},
		"filename": "path/to/file",
		"line": 0,
		"column": 0,
		"occurances": 0
	}],
	"warnings": [{
		"name": "SyntaxError",
		"description": "The description of the error",
		"data": {
			"otherKeys": "other data, including message, type, etc"
		},
		"filename": "path/to/file",
		"line": 0,
		"column": 0,
		"occurances": 0
	}],
	"plugins": [{
		"name": "plugin-name",
		"otherKeys": "other values"
	}],
	"elapsedTime": 0,
	"resultsPath": "resultsPath/from/config/file"
}
```

Note: The code processor can technically recieve requests too, but it is not currently listening for any messages and
will return an error stating as much. Eventually there are plans for sending messages to do things like cancel processing.

### Config File

The config file contains everything necessary for processing a project. Below is it's definition

* **entryPoint** _string_ The path to the entry point
* **logging** _object_ Logging configuration
	* **console** &lt;optional&gt; _object_ The configuration for logging to the console
		* **level** _string_ The log level, e.g. "debug"
	* **file** &lt;optional&gt; _object_ The configuration for logging to a file
		* **level** _string_ The log level, e.g. "debug"
		* **path** _string_ The full path to the log file. The file does not have to previously exist
* **options** _object_ The options for the project. See [Runtime Options](#runtime-options) for details
* **plugins** _array_ The plugins to load
	* _object_ The configuration for a plugin to load
		* **path** _string_ The path to the plugin
		* **options** _object_ The plugin options. See the plugin's README for details

Note: all paths are relative to the CWD. ```~``` is not supported, and it is recommended to use absolute paths

```JSON
{
	"entryPoint": "path/to/app.js",
	"logging": {
		"console": {
			"level": "info"
		},
		"file": {
			"level": "debug",
			"path": "path/to/log"
		}
	},
	"options": {
		"resultsPath": "path/to/results/directory",
		"processUnvisitedCode": true,
		"maxRecursionLimit": 500
	},
	"plugins": [
		{
			"name": "common-globals",
			"path": "path/to/common-globals",
			"options": {}
		},
		{
			"name": "require-provider",
			"path": "path/to/require-provider",
			"options": {
				"platform": "iphone",
				"modules": []
			}
		},
		{
			"name": "ti-api-processor",
			"path": "path/to/ti-api-processor",
			"options": {
				"platform": "iphone",
				"sdkPath": "path/to/sdk",
				"values": {
					"Titanium.Platform.displayCaps.platformWidth": 720
				}
			}
		},
		{
			"name": "ti-api-usage-finder",
			"path": "path/to/ti-api-usage-finder",
			"options": {}
		},
		{
			"name": "ti-api-platform-validator",
			"path": "path/to/ti-api-platform-validator",
			"options": {
				"platform": "iphone"
			}
		},
		{
			"name": "unknown-ambiguous-visualizer",
			"path": "path/to/unknown-ambiguous-visualizer",
			"options": {
				"outputDirectory": "path/to/output/dir",
				"timestampOutputDirectory": false
			}
		}
	]
}
```

## Running as Part of the Titanium CLI

**Note:** This information is outdated and will only work with the version 0.1.x, the code processor that shipped with SDK 3.0

The code processor is integrated as a build step in the CLI. To enable it, add
the following to your tiapp.xml:
```xml
<code-processor>
	<enabled>true</enabled>
</code-processor>
```
Options and plugins can also be specified in the tiapp.xml, as the following
example shows:
```xml
<code-processor>
	<enabled>true</enabled>
	<options>
		<nativeExceptionRecovery>true</nativeExceptionRecovery>
		<invokeMethods>false</invokeMethods>
	</options>
	<plugins>
		<plugin>analysis-coverage</plugin>
		<plugin>require-provider</plugin>
	</plugins>
</code-processor>
```

## Runtime Options

These options can be set at the command line by using the '-c' flag from the code
processor command, or by setting the option in the tiapp.xml file if using the
Titanium CLI.

name | type | default | description
-----|------|---------|------------
invokeMethods | boolean | true | Indicates whether or not to invoke methods. If set to false, the method is evaluated once in ambiguous context mode.
evaluateLoops | boolean | true | Indicates whether or not to evaluate loops. If set to false, the loop body and any loop conditionals are evaluated once in ambiguous block mode.
maxLoopIterations | integer | 1000000000000 | The maximum number of iterations of a loop to evaluate. If this threshold is exceeded, the block is evaluated once in ambiguous block mode. Note: this threshold makes it impossible to analyze infinite loops.
maxRecursionLimit | integer | 1000 | The maximum function call depth to evaluate, similar to a stack size limit. If this threshold is exceeded, function bodies are not evaluated and unknown is returned. Note: this threshold makes it impossible to analyze infinite recursion.
logConsoleCalls | boolean | true | If enabled, all console.* calls in a user's code are logged to the terminal using the appropriate log level.
executionTimeLimit | integer | undefined | The maximum time to execute the code before throwing an exception. If not defined, the code processor will run as long as it takes to complete the analysis.
exactMode | boolean | false | Enables exact mode and causes the code processor act exactly like a standard JavaScript interpreter. Intended primarily for unit testing and is not recommended for project .analysis
nativeExceptionRecovery | boolean | false | When enabled, the code processor will recover from many types of native exceptions and continue analysis. Enabling this has the potential of generating incorrect results, but can be used to parse code that normally wouldn't be parsed because of an error.

## Built-in Plugins

Plugins are informally grouped into two types: analyzers and providers. Providers
provide some sort of feature in the runtime that is not included in the ECMAScript
specification, such as the Titanium Mobile API. Providers do not report any
results. Analyzers do not provide any features in the runtime but instead analyze
code and do report results. Many analyzers depend on providers to work. All of the
current plugins are listed below, along with their type and if they have any other
dependencies

name | type | dependencies | description
-----|------|--------------|------------
[analysis-coverage](plugins/analysis-coverage) | analyzer | &lt;none&gt; | Reports the number of AST nodes that were analyzed on a global and per-file/eval basis. Optionally creates a visualization map of all the code that was analyzed
[common-globals](plugins/common-globals) | provider | &lt;none&gt; | Provides implementations for common globals that aren't part of the JavaScript spec but are provided on all Titanium Mobile platforms (setTimeout, console, etc).
[require-provider](plugins/require-provider) | provider | &lt;none&gt; | Provides an implementation of ```require()``` that matches the Titanium Mobile implementation, including its inconsistencies with CommonJS.
[require-finder](plugins/require-finder) | analyzer | require-provider | Reports all files that are ```require()```'d in a project.
[ti-api-processor](plugins/ti-api-processor) | provider | &lt;none&gt; | Provides an implementation of the Titanium Mobile API. This implementation reads the API documentation for the SDK used by the project to create the API implementation. As such, the SDK specified in the project's tiapp.xml file *must* be installed.
[ti-api-deprecation-finder](plugins/ti-api-deprecation-finder) | analyzer | ti-api-processor | Reports all deprecated APIs used by the project.
[ti-api-platform-validator](plugins/ti-api-platform-validator) | analyer | ti-api-processor | Reports all instances where a platform specific feature is used on the wrong platform, e.g. calling ```Ti.Android.createIntent``` on iOS.
[ti-api-usage-finder](plugins/ti-api-usage-finder) | analyzer | ti-api-processor | Reports all Titanium Mobile APIs used by the project.
[ti-api-include-finder](plugins/ti-api-include-finder) | analyzer | ti-api-processor | Reports all files that are ```Ti.include()```'d by the project.
[unknown-ambiguous-visualizer](plugins/unknown-ambiguous-visualizer) | analyzer | &lt;none&gt; | Creates a visualization map of unknown values and ambiguous contexts/blocks
[unknown-callback-detector](plugins/unknown-callback-detector) | analyzer | &lt;none&gt; | Detects when an unknown value is supplied to a method when a callback is expected

## Internal Concepts

At the core of the code processor is an ECMAScript 5 interpreter that has been
specially designed to work offline. To make this work, two new concepts have
been introduced: an 'unknown' data type and 'ambiguous modes.'

The unknown data type is pretty self-explanatory; it's a value that we don't know
the value of. For example, if the following code is run:
```JavaScript
var x = Date.now();
```
x will be set to unknown since the date changes from run to run and isn't known
at compile time. Operations on unknown values always produce unknown values. For
example, y evaluates to unknown in all of the following circumstances:
```JavaScript
var x = Date.now(),
	y;
y = x + 20;
y = x > 100;
y = x.foo();
y = x.toString();
y = typeof x;
```
Ambiguous modes occur when we are evaluating code without knowing exactly how
it is invoked. There are two types of ambiguous mode: ambiguous context mode and
ambiguous block mode.

An ambiguous context is a function or module that is invoked
without knowing exactly how it was invoked. All callbacks passed to the Titanium
API are evaluated as ambiguous contexts, and any functions called from an ambiguous
block is called as an ambiguous context. In the following example, y is set to
unknown:
```JavaScript
var y;
setTimeout(function () {
	y = 20;
}, 10)
```

An ambiguous block is a loop/conditional body that is evaluated without knowing
the exact circumstances it is evaluated in. If statements and while/do-while
loops are evaluated as an ambiguous block if the conditional is unknown. For and
for-in loops are evaluated as an ambiguous block if some part of the iteration
conditions are unknown. All assignments in an ambiguous block evaluate to unknown
and all functions called from an ambiguous block are evaluated in an ambiguous
context. In the following example, y is set to unknown:
```JavaScript
var x = Date.now(),
	y;
if (x) {
	y = 10;
} else {
	y = 20;
}
```

## Running the ECMA-262 Unit Tests

The ECMA working group, who maintains the ECMA-262 specification (the JavaScript spec), also maintains a series of unit
tests. To run the unit tests:

* Clone the test-262 [Mercurial Repository](http://hg.ecmascript.org/tests/test262/)
	* Note: you will need install [Mercurial](http://mercurial.selenic.com/) before you can clone the repository. Git will not work.
* Add the following to your titanium config file at ~/.titanium/config.json:

```JSON
{
	"code-processor": {
		"test": {
			"test-262-directory": "/path/to/test-262/repo"
		}
	}
}
```

* Run the test script at &lt;titanium code processor dir&gt;/tests/bin/tests
	* You can run ```tests --help``` to see options for controlling the test process

#### (C) Copyright 2012-2013, [Appcelerator](http://www.appcelerator.com) Inc. All Rights Reserved.
