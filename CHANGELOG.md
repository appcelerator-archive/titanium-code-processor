## 0.2.0 (14 January 2013)

### New Features
* Upgraded from Uglify-JS v1 to v2
** This will allow us to take advantage of source maps in the future
* Analysis maps now annotate the original code, not a serialized AST.
** Comments, whitespace, and overall formatting are preserved.

## 0.1.10 (10 December 2012)

### Bug Fixes
* Fixed a bug with setting ambiguous contexts properly in function calls
* Fixed a bug in postfix expressions (think x++) where the previous value was unknown not returning the proper value
* Fixed the output with native modules to accurately reflect that they are skipped, not unresolved

### New Features
* Implemented a new unknown/ambiguous map generation plugin (see [project-dir]/analysis for generated output)
* Added map generation to the analysis coverage plugin (see [project-dir]/analysis for generated output)
* Updated the analysis coverage plugin to report nodes knowingly skipped and files skipped

## 0.1.9 (30 November 2012)

### Bug Fixes
* Fixed a lot of bugs necessary to get the chapter 11 - 14 unit tests passing
* Fixed module validation so that it displays an intelligible error when a specified module version is missing
* Fixed an issue with properly setting up the context stack for queued functions
	* This fixes queued functions with a return statement causing a spurious "return not valid outside of functions" exception

### New Features
* Unknown callback detector plugin
	* Detects instances where an unknown value is passed when a function is expected
	* This is useful in determining why a block of code is not being analyzed
* More advanced unit test harness implemented using node cluster

## 0.1.8 (28 November 2012)

### Bug Fixes
* Paths with spaces are now supported

## 0.1.7 (28 November 2012)
This is a minor release with slightly tweaked output to aid in debugging, and a new document for tracking the status of unit tests

## 0.1.6 (26 November 2012)

### New Features
* Human readable output
	* You can still get JSON output with the new -j/--json flag
* Silent output with the -s flag. Only the results are displayed
* -o flag is now required. In practice this flag is necessary for all but the most basic of apps, so I feel that making it required will help users avoid a common pitfall

### Bug Fixes
* Node 0.6 support (not fully tested)
* Added error checking around the 'titanium project' command and making failures more obvious that a 3.0 or newer SDK is not installed