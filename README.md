Titanium Code Processor
========

## Overview
Code analysis node.js modules for Titanium mobile

## Installation
	git clone https://github.com/appcelerator/titanium-code-processor.git
	cd titanium-code-processor
	npm install

## Running
Basic run:

	node bin/codeprocessor <options>

Running with all plugins:

	node bin/codeprocessor -c evaluateLoops=true -l debug -p require-provider -p require-finder -p common-globals -p ti-api-processor -p ti-api-usage-finder -p ti-api-deprecation-finder -p ti-api-platform-validator -o <platform> <Project Directory>

## Options
Use the built in help command to see options

	node bin/codeprocessor --help
