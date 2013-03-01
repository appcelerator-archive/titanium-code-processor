## 0.3.2 (28 February 2013)

### New Features
* Modified the Ti API usage finder to report both global api usage numbers and per-file api usage numbers
* Added HTML-bases results pages that studio can use to display results graphically
* Rearchitected unit tests so that they run 30 times faster

### Bug Fixes
* Fixed some more bugs surrounding setting up contexts for deferred methods
* Fixed a few miscellaneous bugs and regressions
* The plugins command now ignores node modules that are not code processor plugins that exist in the plugins search path

## 0.3.1 (14 February 2013)

### New Features
* Added support for parsing values from Ti.UI.createXXX constructors
* Added support for Ti.UI.Window.url

### Bug Fixes
* Fixed a bug where deferred analysis of methods wasn't setting up the proper context
** Methods are deferred either because they are a callback (addEventListener/setTimeout/etc) or because they weren't analyzed and processUnvisitedCode is true
* Prevented duplicate errors and warnings from being reported
** Duplicate errors and warnings were being reported when the same line of code causing the error was visited multiple times, thus throwing multiple errors

## 0.3.0 (1 February 2013)

### New Features
* Reworked the CLI interface to be much more robust
** The code processor now takes a sub-command, one of 'options', 'plugins', 'analyze', and 'subprocess'
** The 'subprocess' sub-command provides an interactive, structured mechanism for calling the code processor from other programs
* Plugins can now take options
** Options must be specified using a configuration file
* Plugins can now reside anywhere
** To specify plugins in another location, they must be specified in a configuration file
* The ti-api-processor plugin now allows you to specify values for any primitive type in the API
** This can be used to see how an app will react to, say, a specific screen size
* Plugins are now checked to make sure their dependencies are also loaded
* Added --all-plugins and --non-ti-plugins flags to the CLI to load all plugins or all non-Titanium-specific plugins, respectively
** Now, if no plugins are specified, no plugins are loaded

### Bug Fixes
* Fixed a bug where the code processor crashes when encountering a reference to an undeclared variable that is named the same as an Object prototype property
* Added a lot of configuration validation to prevent unexpected behavior/crashes when supplied with bad configuration data

## 0.2.2 (20 Janurary 2013)

### Bug Fixes
* Fixed property references on Ti objects being ignored

## 0.2.1 (20 January 2013)

### New Features
* Added a new option "processUnvisitedCode"
** All .js files that are not processed are processed in an ambiguous context
** All functions that are not invoked are invoked in an ambiguous context
** This option, when combined with invokeMethods=false, makes the code processor work in a more static manner. Processing is much faster, but results are not as accurate
* Removed support for event tags
** They were never used and getting rid of them improved perfomance

### Bug Fixes
* Improved maximum recursion detection/handling to avoid maximum call stack exceeded exceptions
* Lots of small bug fixes dealing with unknown values

## 0.2.0 (14 January 2013)

### New Features
* Upgraded from Uglify-JS v1 to v2
	* This will allow us to take advantage of source maps in the future
* Analysis maps now annotate the original code, not a serialized AST.
	* Comments, whitespace, and overall formatting are preserved.

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