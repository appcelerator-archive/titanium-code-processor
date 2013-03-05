Ti API Platform Validator Plugin
================================

## Overview

The Ti API Platform Validator plugin finds any platform specific Titanium APIs that are called from the incorrect platform. It depends on the Ti API Processor plugin.

## Options

No options

## Output

* **name** _string_ Always equals "ti-api-platform-validator"
* **summary** _string_ A short summary of the results
* **invalidAPIs** _object_ The platform-specific APIs used incorrectly in the project
	* **&lt;API name&gt;** _number_ The number of times the platform-specific API indicated by the object key  is used incorrectly