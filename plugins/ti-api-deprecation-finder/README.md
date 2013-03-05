Ti API Deprecation Finder Plugin
================================

## Overview

The Ti API Deprecation Finder plugin finds any deprecated Titanium APIs used in the project. It depends on the Ti API Processor plugin.

## Options

No options

## Output

* **name** _string_ Always equals "ti-api-deprecation-finder"
* **summary** _string_ A short summary of the results
* **deprecatedAPIs** _object_ The deprecated APIs used in the project
	* **&lt;API name&gt;** _number_ The number of times the deprecated API indicated by the object key is used