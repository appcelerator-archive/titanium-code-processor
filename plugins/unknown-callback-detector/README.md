Unknown Callback Detector Plugin
================================

## Overview

The Unknown Callback Detector plugin finds all instances where an unknown values was passed to a method expecting a callback as a parameter.

## Options

No options

## Output

* **name** _string_ Always equals "ti-api-usage-finder"
* **summary** _string_ A short summary of the results
* **unknownCallbacks** _array_ The APIs used in the project
	*  _object_ An instance where an unknown callback was detected
		* **filename** _string_ The full path to the file where the unknown callback was passed
		* **line** _number_ The line number where the unknown callback was passed
		* **column** _number_ The column number where the unknown callback was passed