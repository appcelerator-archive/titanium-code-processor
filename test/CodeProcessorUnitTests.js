#!/usr/bin/env node

/**
 * Test definition
 * 
 * @Object
 * @name Test
 * @param {String} name The name of the test
 * @param {Function} testFunction The function to run that contains the test
 * @param {Object} props The test properties
 * @param {Boolean} props.throws Indicates that this test is expected to throw an exception
 * @param {String} props.throwsType The type of error that is thrown. Specifically, it is the value of the Error.name 
 *		property (e.g. "TypeError").
 * @param props.expectedReturnValue The expected return value of the test function
 */
 
var fs = require("fs"),
	assert = require("assert"),
	path = require("path"),
	testSuites = [];

// Find the tests
module.exports.libPath = path.join(__dirname, "..", "lib");
function findTests(dir) {
	var files = fs.readdirSync(dir),
		file,
		filePath;
	for(var i = 0, len = files.length; i < len; i++) {
		file = files[i];
		filePath = path.join(dir,file);
		if (fs.statSync(filePath).isDirectory()) {
			findTests(filePath);
		} else if (file.match(/\.js$/)) {
			testSuites.push({
				name: filePath.replace(/\.js$/, ""),
				tests: require(path.resolve(filePath))
			});
		}
	}
}
findTests(path.join(__dirname, "tests"));

// Kickstart the testing by calling the first test
console.log("Processing " + testSuites.length + " test suite" + (testSuites.length !== 1 ? "s" : "") + ".\n");
var currentTestSuite = 0,
	currentTest = -1,
	numPassedTests = 0,
	numFailedTests = 0;
function runNextTest() {	

	// Check if we are finished
	if (currentTestSuite >= testSuites.length) {
		console.log("\nAll tests completed.\n" + numPassedTests + " test" + (numPassedTests > 1 ? "s" : "") + " passed, " + 
			numFailedTests + " test" + (numFailedTests > 1 ? "s" : "") + " failed.");
		return;
	}

	// Move to the next test
	var suite = testSuites[currentTestSuite];
	if (currentTest >= suite.tests.length - 1) {
		currentTestSuite++;
		currentTest = -1;
		runNextTest();
		return;
	} else {
		currentTest++;
	}
	
	// Fetch the next test
	var test = testSuites[currentTestSuite].tests[currentTest];
	console.log("Testing: " + path.relative(path.join(__dirname, "tests"), testSuites[currentTestSuite].name) + " - " + test.name);
	
	// Run the test, taking the test properties into account
	var testFunction = test.testFunction,
		props = test.props,
		success;
	try {
		if (props.expectedException) {
			try {
				testFunction();
			} catch(e) {
				success = e.name === props.expectedException;
			}
		} else if(props.hasOwnProperty("expectedReturnValue")) {
			var result = testFunction();
			try {
				assert.deepEqual(result, props.expectedReturnValue);
				success = true;
			} catch(e) {}
		}
		
		if (props.postEvaluation) {
			success = success && props.postEvaluation();
		}
	} catch(e) {} // Squash any exceptions and leave success as false
	
	// Update the results and run the next test
	if (success) {
		numPassedTests++;
	} else {
		console.log("\tFailed\n");
		numFailedTests++;
	}
	runNextTest();
}
runNextTest();