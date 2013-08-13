Ti API Require Finder Plugin
=====================

## Overview

The Require Finder plugin finds all files/modules that were required by the project. It depends on the Ti API provider plugin.

## Options

No options

## Output

* **name** _string_ Always equals "require-finder"
* **summary** _string_ A short summary of the results
* **resolved** _array_ The list of require statements that were successfully resolved
	* **filename** _string_ The full path to the file where the require statement was called from
	* **line** _number_ The line number where the error was detected
	* **column** _number_ The column number where the require statement was called from
	* **data** _object_ Information specific to the require statement
		* **name** _string_ The value passed to require
		* **path** _string_ The file that the require statement was resolved to
* **unresolved** _array_ The list of require statements that were passed an unknown value
	* **filename** _string_ The full path to the file where the require statement was called from
	* **line** _number_ The line number where the error was detected
	* **column** _number_ The column number where the require statement was called from
	* **data** _object_ Information specific to the require statement
* **missing** _array_ The list of require statements that were resolved, but the file could not be found
	* **filename** _string_ The full path to the file where the require statement was called from
	* **line** _number_ The line number where the error was detected
	* **column** _number_ The column number where the require statement was called from
	* **data** _object_ Information specific to the require statement
		* **name** _string_ The value passed to require
		* **path** _string_ The file that the require statement was resolved to
* **skipped** _array_ The list of require statements that pointed to native modules that could not be processed
	* **filename** _string_ The full path to the file where the require statement was called from
	* **line** _number_ The line number where the error was detected
	* **column** _number_ The column number where the require statement was called from
	* **data** _object_ Information specific to the require statement
		* **name** _string_ The value passed to require