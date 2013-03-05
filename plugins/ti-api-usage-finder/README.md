Ti API Usage Finder Plugin
==========================

## Overview

The Ti API Usage Finder plugin finds all Titanium APIs that are used. It depends on the Ti API Processor plugin.

## Options

No options

## Output

* **name** _string_ Always equals "ti-api-usage-finder"
* **summary** _string_ A short summary of the results
* **invalidAPIs** _object_ The APIs used in the project
	* **&lt;API name&gt;** _number_ The number of times the API indicated by the object key is used