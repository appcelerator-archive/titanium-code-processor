Titanium API Processor Plugin
=============================

## Overview

The Titanium API processor is a provider plugin that provides an implementation of the Titanium API. It produces no results.

## Options

* **platform** _string_ The name of the platform being analyzed. This is used for a variety of purposes, including determining the value of ```Ti.Platform.osname```
* **sdkPath** _string_ The path to the SDK. This is used to look up the API information and generate the API classes inside the runtime

## Output

* **name** _string_ Always equals "ti-api-provider"