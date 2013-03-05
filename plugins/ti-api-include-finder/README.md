Ti API Include Finder Plugin
============================

## Overview

The Ti API Include Finder plugin finds all files that are ```Ti.include()```'d in the project. It depends on the Ti API Processor plugin.

## Options

No options

## Output

* **name** _string_ Always equals "ti-api-include-finder"
* **summary** _string_ A short summary of the results
* **resolved** _array_ The list of include statements that were successfully resolved
	* **filename** _string_ The full path to the file where the include statement was called from
	* **line** _number_ The line number where the error was detected
	* **column** _number_ The column number where the include statement was called from
	* **data** _object_ Information specific to the include statement
		* **name** _string_ The value passed to include
		* **path** _string_ The file that the include statement was resolved to
* **unresolved** _array_ The list of include statements that were passed an unknown value
	* **filename** _string_ The full path to the file where the include statement was called from
	* **line** _number_ The line number where the error was detected
	* **column** _number_ The column number where the include statement was called from
	* **data** _object_ Information specific to the include statement
* **missing** _array_ The list of include statements that were resolved, but the file could not be found
	* **filename** _string_ The full path to the file where the include statement was called from
	* **line** _number_ The line number where the error was detected
	* **column** _number_ The column number where the include statement was called from
	* **data** _object_ Information specific to the include statement
		* **name** _string_ The value passed to include
		* **path** _string_ The file that the include statement was resolved to