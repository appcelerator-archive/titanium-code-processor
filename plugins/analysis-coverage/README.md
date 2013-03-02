Analysis Coverage Plugin
========================

## Overview

The analysis coverage plugin reports how much of the visualization plugin was analyzed. It reports back project and file level statistics and can optionally generate visualization data.

## Options

* visualization &lt;optional&gt; (object) - Visualization data creation configuration. No visualization data is generated if this option is not included.
	* outputDirectory (string) - The directory to store the results in. If ommitted, results are not written to file
	* timestampOutputDirectory &lt;optional&gt; (boolean) - If set, the output directory name will have a timestamp appended to it
	* styles &lt;optional&gt; (object) - Overrides the font styles for annotations
		* visited (object)
			* bold (boolean)
			* italic (boolean)
			* fontColor (object) - Colors are specified using RGB float values, with r=0, g=0, b=0 representing black and r=1, g=1, b=1 representing white
				* r (number)
				* g (number)
				* b (number)
			* backgroundColor (object) - Colors are specified using RGB float values, with r=0, g=0, b=0 representing black and r=1, g=1, b=1 representing white
				* r (number)
				* g (number)
				* b (number)
		* skipped (object)
			* bold (boolean)
			* italic (boolean)
			* fontColor (object) - Colors are specified using RGB float values, with r=0, g=0, b=0 representing black and r=1, g=1, b=1 representing white
				* r (number)
				* g (number)
				* b (number)
			* backgroundColor (object) - Colors are specified using RGB float values, with r=0, g=0, b=0 representing black and r=1, g=1, b=1 representing white
				* r (number)
				* g (number)
				* b (number)
		* unvisited (object)
			* bold (boolean)
			* italic (boolean)
			* fontColor (object) - Colors are specified using RGB float values, with r=0, g=0, b=0 representing black and r=1, g=1, b=1 representing white
				* r (number)
				* g (number)
				* b (number)
			* backgroundColor (object) - Colors are specified using RGB float values, with r=0, g=0, b=0 representing black and r=1, g=1, b=1 representing white
				* r (number)
				* g (number)
				* b (number)

## Output

* name (string) - Always equals "analysis-coverage"
* summary (string) - A short summary of the results
* details (object)
	* &lt;astname, usually a filename&gt; (object)
		* numTotalNodes (number) - The total number of AST nodes in this file
		* numNodesVisited (number) - The number of AST nodes that were visited
		* numNodesSkipped (number) - The number of AST nodes that were intentionally skipped, for example if they were inside of an if statement with a false conditional
* filesSkipped (array of strings) - The files that were not analyzed, if any
* numTotalFiles (number) - The total number of JavaScript files in the project
* numFilesVisited (number) - The number of files that were analyzed
* numFilesSkipped (number) - The number of files that were not analyzed
* numTotalNodes (number) - The total number of AST nodes in all of the files
* numNodesVisited (number) - The number of AST nodes that were visited
* numNodesSkipped (number) - The number of AST nodes that were intentionally skipped, for example if they were inside of an if statement with a false conditional
