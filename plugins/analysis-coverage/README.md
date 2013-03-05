Analysis Coverage Plugin
========================

## Overview

The Analysis Coverage plugin reports how much of the project was analyzed. It reports back project and file level statistics and can optionally generate visualization data.

## Options

* **visualization** &lt;optional&gt; _object_ Visualization data creation configuration. No visualization data is generated if this option is not included.
	* **outputDirectory** _string_ The directory to store the results in. If ommitted, results are not written to file
	* **timestampOutputDirectory** &lt;optional&gt; _boolean_ If set, the output directory name will have a timestamp appended to it
	* **styles** &lt;optional&gt; _object_ Overrides the font styles for annotations
		* **visited** _object_
			* **bold** _boolean_
			* **italic** _boolean_
			* **fontColor** _object_ Colors are specified using RGB float values, with r=0, g=0, b=0 representing black and r=1, g=1, b=1 representing white
				* **r** _number_
				* **g** _number_
				* **b** _number_
			* **backgroundColor** _object_ Colors are specified using RGB float values, with r=0, g=0, b=0 representing black and r=1, g=1, b=1 representing white
				* **r** _number_
				* **g** _number_
				* **b** _number_
		* **skipped** _object_
			* **bold** _boolean_
			* **italic** _boolean_
			* **fontColor** _object_ Colors are specified using RGB float values, with r=0, g=0, b=0 representing black and r=1, g=1, b=1 representing white
				* **r** _number_
				* **g** _number_
				* **b** _number_
			* **backgroundColor** _object_ Colors are specified using RGB float values, with r=0, g=0, b=0 representing black and r=1, g=1, b=1 representing white
				* **r** _number_
				* **g** _number_
				* **b** _number_
		* **unvisited** _object_
			* **bold** _boolean_
			* **italic** _boolean_
			* **fontColor** _object_ Colors are specified using RGB float values, with r=0, g=0, b=0 representing black and r=1, g=1, b=1 representing white
				* **r** _number_
				* **g** _number_
				* **b** _number_
			* **backgroundColor** _object_ Colors are specified using RGB float values, with r=0, g=0, b=0 representing black and r=1, g=1, b=1 representing white
				* **r** _number_
				* **g** _number_
				* **b** _number_

## Output

* **name** _string_ Always equals "analysis-coverage"
* **summary** _string_ A short summary of the results
* **details** _object_
	* **&lt;astname, usually a filename&gt;** _object_
		* **numTotalNodes** _number_ The total number of AST nodes in this file
		* **numNodesVisited** _number_ The number of AST nodes that were visited
		* **numNodesSkipped** _number_ The number of AST nodes that were intentionally skipped, for example if they were inside of an if statement with a false conditional
* **filesSkipped** _array_ The files that were not analyzed, if any
	* _string_ The path to the file that was not analyzed
* **numTotalFiles** _number_ The total number of JavaScript files in the project
* **numFilesVisited** _number_ The number of files that were analyzed
* **numFilesSkipped** _number_ The number of files that were not analyzed
* **numTotalNodes** _number_ The total number of AST nodes in all of the files
* **numNodesVisited** _number_ The number of AST nodes that were visited
* **numNodesSkipped** _number_ The number of AST nodes that were intentionally skipped, for example if they were inside of an if statement with a false conditional
