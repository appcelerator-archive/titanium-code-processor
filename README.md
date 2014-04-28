Titanium Code Processor [![Build Status](https://travis-ci.org/appcelerator/titanium-code-processor.png)](https://travis-ci.org/appcelerator/titanium-code-processor)
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
* [Running Using the CLI](#running-using-the-cli)
	* [Command Options](#command-options)
	* [Stream Output Format](#stream-output-format)
		* [Low Level Packet Format](#low-level-packet-format)
		* [High Level Packet Format](#high-level-packet-format)
		* [Message Types](#message-types)
	* [Config File](#config-file)
* [Running as Part of a Build](#running-as-part-of-a-build)
* [Runtime Options](#runtime-options)
* [Built-in Plugins](#built-in-plugins)
* [Internal Concepts](#internal-concepts)
* [Running the ECMA-262 Unit Tests](#running-the-ecma-262-unit-tests)

## Quick Start

### Install Using NPM

```
[sudo] npm install -g titanium-code-processor
```

The code processor works as a command in the [Titanium CLI](https://github.com/appcelerator/titanium), so make sure
it is installed before continuing. If you have a 3.0.0. or newer Titanium SDK installed, you should already have the CLI.
There are two ways to include the code processor as part of the CLI:

Automatic Method: run the included install script

```
node /path/to/titanium-code-processor/bin/install
```

Manual Method: configure the cli by hand

```
titanium config paths.commands --append /path/to/titanium-code-processor/commands
titanium config paths.hooks --append /path/to/titanium-code-processor/hooks
```

Note: On *NIX systems, the code processor is typically installed in /usr/local/lib/node_modules/titanium-code-processor

### Run

From within your project directory, run:

```
titanium analyze -p iphone -A
```

## Running Using the CLI

```
titanium analyze [options]
```
Analyzes a project.

### Command Options
<table>
	<tr>
		<th>Option</th><th>Description</th>
	</tr>
	<tr>
		<td>-A, --all-plugins</td><td>loads all plugins in the default search path</td>
	</tr>
	<tr>
		<td>--exact-mode</td><td>enables exact mode evaluation. Exact mode does not use ambiguous modes and throws an exception if an Unknown type is encountered (ignored if --config-file is specified)  [default: false]</td>
	</tr>
	<tr>
		<td>--no-console-passthrough</td><td>Prevents console.* calls in a project from being logged to the console (ignored if --config-file is specified)  [default: false]</td>
	</tr>
	<tr>
		<td>--no-loop-evaluation</td><td>Whether or not to evaluate loops (ignored if --config-file is specified)  [default: false]</td>
	</tr>
	<tr>
		<td>--no-method-invokation</td><td>prevents methods from being invoked (ignored if --config-file is specified)  [default: false]</td>
	</tr>
	<tr>
		<td>--no-native-exception-recovery</td><td>disables recovering from native exceptions when not in try/catch statements (ignored if --config-file is specified)  [default: false]</td>
	</tr>
	<tr>
		<td>--process-unvisited-code</td><td>when set to true, all nodes and files that are not visited/skipped will be processed in ambiguous mode after all other code has been processed. While this will cause more of a project to be analyzed, this will decrease accuracy and can generate a lot of false positives (ignored if --config-file is specified)  [default: false]</td>
	</tr>
	<tr>
		<td>-F, --config-file [value]</td><td>the path to the config file, note: most options and flags are ignored with this option
	</tr>
	<tr>
		<td>--cycle-detection-stack-size [size]</td><td>the size of the cycle detection stack. Cycles that are larger than this size will not be caught  [default: 10000]
	</tr>
	<tr>
		<td>--execution-time-limit [time limit]</td><td>the maximum time the app is allowed to run before erroring. 0 means no time limit (ignored if --config-file is specified)  [default: 300000]
	</tr>
	<tr>
		<td>--log-level [level]</td><td>minimum logging level (ignored if --config-file is specified)  [trace, debug, info, warn, error]
	</tr>
	<tr>
		<td>--max-cycles [size]</td><td>The maximum number of cycles to allow before throwing an exception  [default: 200001]
	</tr>
	<tr>
		<td>--max-loop-iterations [iterations]</td><td>the maximum number of iterations a loop can iterate before falling back to an unknown evaluation (ignored if --config-file is specified)  [default: 200000]
	</tr>
	<tr>
		<td>--max-recursion-limit [recursion limit]</td><td>the maximum recursion depth to evaluate before throwing a RangeError exception (ignored if --config-file is specified)  [default: 500]
	</tr>
	<tr>
		<td>-o, --output [format]</td><td>output format  [report, json, stream]
	</tr>
	<tr>
		<td>-p, --platform [platform]</td><td>the name of the OS being built-for, reflected in code via Ti.Platform.osname (ignored if --config-file is specified)
	</tr>
	<tr>
		<td>--plugins [plugins]</td><td>a comma separated list of plugin names to load (ignored if --config-file is specified)
	</tr>
	<tr>
		<td>-d, --project-dir [value]</td><td>the directory containing the project, otherwise the current working directory (ignored if --config-file is specified)
	</tr>
	<tr>
		<td>-R, --results-dir [value]</td><td>the path to the directory that will contain the generated results pages (ignored if --config-file is specified)
	</tr>
</table>

### Stream Output Format

```
titanium-code-processor subprocess <path/to/config/file>
```
The stream output format allows for JSON data to be passed in packets as the code processor runs. Data is passed back and forth using a custom two-layer packet format. The lower layer is completely custom, while the upper layer is formatted JSON and is encapsulated by the lower layer

#### Low Level Packet Format

The low level packet consists of four comma separated fields that forms a message
```
[Message Type],[Sequence ID],[Message Length],[data]
```
Note: the packet header at this level is ASCII formatted, although the data can theoretically be in any format

<table>
	<tr>
		<th>Name</th><th>Description</th>
	</tr>
	<tr>
		<td>MessageType</td><td>A three character sequence that currently is always 'REQ' (request)</td>
	</tr>
	<tr>
		<td>Sequence ID</td><td>A 32-bit, base 16 number that identifies the message. This value is always 8 characters long, and includes 0 padding if necessary.</td>
	</tr>
	<tr>
		<td>Message Length</td><td>A 32-bit, base 16 number that identifies the length of the message. This value is always 8 characters long, and includes 0 padding if necessary. Hex letters must be lower case.</td>
	</tr>
	<tr>
		<td>Data</td><td>The data for the message as specified in the [High Level Packet Format](#high-level-packet-format) section</td>
	</tr>
</table>

Example:

```
REQ,000079AC,0000000C,{foo: 'bar'}
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

#### Message Types

The code processor currently only sends one message, but others are planned for the future

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

### Config File

The config file contains everything necessary for processing a project. Below is it's definition

* **sourceInformation** _object_ The path to the entry point
	 * **sourceDir** The directory containing the source code to be analyzed
	 * **entryPoint** The entry point for the project
	 * **projectDir** The project directory
	 * **originalSourceDir** &lt;optional&gt; The original directory that contained source code. Source maps map from here to sourceDir
	 * **sourceMaps** &lt;optional&gt; The source maps in key-value form. The key is a relative path to the file with sourceDir as the base, i.e. an absolute path to a file is at sourceDir + '/' + sourceMapKey
* **logging** _object_ Logging configuration
	* **file** &lt;optional&gt; _object_ The configuration for logging to a file
		* **level** _string_ The log level, e.g. "debug"
		* **path** _string_ The full path to the log file. The file does not have to previously exist
* **options** _object_ The options for the project. See [Runtime Options](#runtime-options) for details
* **plugins** _array_ The plugins to load
	* _object_ The configuration for a plugin to load
		* **path** _string_ The path to the plugin
		* **options** _object_ The plugin options. See the plugin's README for details

Note: all paths are relative to the CWD. ```~``` is not supported, and it is recommended to use absolute paths

Example config file for an Alloy application:

```JSON
{
	"sourceInformation": {
		"projectDir": "/path/to/project",
		"entryPoint": "path/to/project/Resources/app.js",
		"sourceDir": "/path/to/project/Resources",
		"sourceMaps": "/path/to/project/build/map/Resources",
		"originalSourceDir": "/path/to/project/app"
	},
	"logging": {
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
			"path": "path/to/common-globals",
			"options": {}
		},
		{
			"path": "path/to/require-provider",
			"options": {
				"platform": "iphone",
				"modules": []
			}
		},
		{
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
			"path": "path/to/ti-api-usage-finder",
			"options": {}
		},
		{
			"path": "path/to/ti-api-platform-validator",
			"options": {
				"platform": "iphone"
			}
		}
	]
}
```

## Running as Part of a Build

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
		<plugin>require-provider</plugin>
	</plugins>
</code-processor>
```

Running as part of a build will report errors and warnings, and is used in Mobile Web to compress the size of index.html

## Runtime Options

These options can be set at the command line by using the '-c' flag from the code
processor command, or by setting the option in the tiapp.xml file if using the
Titanium CLI.

<table>
	<tr>
		<th>name</th><th>type</th><th>default</th><th>description</th>
	</tr>
	<tr>
		<td>invokeMethods</td><td>boolean</td><td>true</td><td>Indicates whether or not to invoke methods. If set to false, the method is evaluated once in ambiguous context mode.</td>
	</tr>
	<tr>
		<td>evaluateLoops</td><td>boolean</td><td>true</td><td>Indicates whether or not to evaluate loops. If set to false, the loop body and any loop conditionals are evaluated once in ambiguous block mode.</td>
	</tr>
	<tr>
		<td>maxLoopIterations</td><td>integer</td><td>1000000000000</td><td>The maximum number of iterations of a loop to evaluate. If this threshold is exceeded, the block is evaluated once in ambiguous block mode. Note: this threshold makes it impossible to analyze infinite loops.</td>
	</tr>
	<tr>
		<td>maxRecursionLimit</td><td>integer</td><td>1000</td><td>The maximum function call depth to evaluate, similar to a stack size limit. If this threshold is exceeded, function bodies are not evaluated and unknown is returned. Note: this threshold makes it impossible to analyze infinite recursion.</td>
	</tr>
	<tr>
		<td>logConsoleCalls</td><td>boolean</td><td>true</td><td>If enabled, all console.* calls in a user's code are logged to the terminal using the appropriate log level.</td>
	</tr>
	<tr>
		<td>executionTimeLimit</td><td>integer</td><td>undefined</td><td>The maximum time to execute the code before throwing an exception. If not defined, the code processor will run as long as it takes to complete the analysis.</td>
	</tr>
	<tr>
		<td>exactMode</td><td>boolean</td><td>false</td><td>Enables exact mode and causes the code processor act exactly like a standard JavaScript interpreter. Intended primarily for unit testing and is not recommended for project .analysis</td>
	<tr>
		<td>nativeExceptionRecovery</td><td>boolean</td><td>false</td><td>When enabled, the code processor will recover from many types of native exceptions and continue analysis. Enabling this has the potential of generating incorrect results, but can be used to parse code that normally wouldn't be parsed because of an error.</td>
	</tr>
</table>

## Built-in Plugins

Plugins are informally grouped into two types: analyzers and providers. Providers
provide some sort of feature in the runtime that is not included in the ECMAScript
specification, such as the Titanium Mobile API. Providers do not report any
results. Analyzers do not provide any features in the runtime but instead analyze
code and do report results. Many analyzers depend on providers to work. All of the
current plugins are listed below, along with their type and if they have any other
dependencies

<table>
	<tr>
		<th>name</th><th>type</th><th>dependencies</th><th>description</th>
	</tr>
	<tr>
		<td><a href="plugins/common-globals">common-globals</a></td><td>provider</td><td>&lt;none&gt;</td><td>Provides implementations for common globals that aren't part of the JavaScript spec but are provided on all Titanium Mobile platforms (setTimeout, console, etc).</td>
	</tr>
	<tr>
		<td><a href="plugins/require-provider">require-provider</a></td><td>provider</td><td>&lt;none&gt;</td><td>Provides an implementation of ```require()``` that matches the Titanium Mobile implementation, including its inconsistencies with CommonJS.</td>
	</tr>
	<tr>
		<td><a href="plugins/require-finder">require-finder</a></td><td>analyzer</td><td>require-provider</td><td>Reports all files that are ```require()```'d in a project.</td>
	</tr>
	<tr>
		<td><a href="plugins/ti-api-provider">ti-api-provider</a></td><td>provider</td><td>require-provider, common-globals</td><td>Provides an implementation of the Titanium Mobile API. This implementation reads the API documentation for the SDK used by the project to create the API implementation. As such, the SDK specified in the project's tiapp.xml file *must* be installed.</td>
	</tr>
	<tr>
		<td><a href="plugins/ti-api-deprecation-finder">ti-api-deprecation-finder</a></td><td>analyzer</td><td>ti-api-provider</td><td>Reports all deprecated APIs used by the project.</td>
	</tr>
	<tr>
		<td><a href="plugins/ti-api-platform-validator">ti-api-platform-validator</a></td><td>analyer</td><td>ti-api-provider</td><td>Reports all instances where a platform specific feature is used on the wrong platform, e.g. calling ```Ti.Android.createIntent``` on iOS.</td>
	</tr>
	<tr>
		<td><a href="plugins/ti-api-usage-finder">ti-api-usage-finder</a></td><td>analyzer</td><td>ti-api-provider</td><td>Reports all Titanium Mobile APIs used by the project.</td>
	</tr>
	<tr>
		<td><a href="plugins/ti-api-include-finder">ti-api-include-finder</a></td><td>analyzer</td><td>ti-api-provider</td><td>Reports all files that are ```Ti.include()```'d by the project.</td>
	</tr>
</table>

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

## Contributing

Titanium is an open source project.  Titanium wouldn't be where it is now without contributions by the community. Please consider forking this repo to improve, enhance or fix issues. If you feel like the community will benefit from your fork, please open a pull request.

To protect the interests of the Titanium contributors, Appcelerator, customers and end users we require contributors to sign a Contributors License Agreement (CLA) before we pull the changes into the main repository. Our CLA is simple and straightforward - it requires that the contributions you make to any Appcelerator open source project are properly licensed and that you have the legal authority to make those changes. This helps us significantly reduce future legal risk for everyone involved. It is easy, helps everyone, takes only a few minutes, and only needs to be completed once.

[You can digitally sign the CLA](http://bit.ly/app_cla) online. Please indicate your email address in your first pull request so that we can make sure that will locate your CLA.  Once you've submitted it, you no longer need to send one for subsequent submissions.

#### (C) Copyright 2012-2013, [Appcelerator](http://www.appcelerator.com) Inc. All Rights Reserved.
