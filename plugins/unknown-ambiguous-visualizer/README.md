Unknown and Ambiguous Visualizer Plugin
=======================================

## Overview

The Unknown and Ambiguous Visualizer plugin reports how much of the project had to be evaluated as unknown and in an ambiguous block. It reports back project and file level statistics and can optionally generate visualization data.

## Options

* **visualization** &lt;optional&gt; _object_ Visualization data creation configuration. No visualization data is generated if this option is not included.
	* **outputDirectory** _string_ The directory to store the results in. If ommitted, results are not written to file
	* **timestampOutputDirectory** &lt;optional&gt; _boolean_ If set, the output directory name will have a timestamp appended to it
	* **styles** &lt;optional&gt; _object_ Overrides the font styles for annotations
		* **unknown** _object_
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
		* **ambiguousBlock** _object_
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
		* **ambiguousContext** _object_
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

* **name** _string_ Always equals "unknown-ambiguous-visualizer"
* **summary** _string_ A short summary of the results
* **details** _object_
	* **&lt;astname, usually a filename&gt;** _object_
		* **numUnknownNodes** _number_ The number of nodes that were evaluated as unknown
		* **numAbiguousBlockNodes** _number_ The number of nodes that were evaluated in an ambiguous block
		* **numAbiguousContextNodes** _number_The number of nodes that were evaluated in an ambiguous context
		* **numTotalNodes** _number_  The total number of AST nodes in this file
* **numUnknownNodes** _number_ The number of nodes that were evaluated as unknown
* **numAbiguousBlockNodes** _number_ The number of nodes that were evaluated in an ambiguous block
* **numAbiguousContextNodes** _number_The number of nodes that were evaluated in an ambiguous context
* **numTotalNodes** _number_  The total number of AST nodes in the project
