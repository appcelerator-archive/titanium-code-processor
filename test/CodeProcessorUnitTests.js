#!/usr/bin/env node

var fs = require("fs"),
	path = require("path"),
	testSuites = [];

// Find the tests
module.exports.libPath = path.join(__dirname, "..", "lib");
function findTests(dir) {
	console.log(dir);
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

// Run the tests
console.log("Processing " + testSuites.length + " test suite" + (testSuites.length !== 1 ? "s" : "") + ".\n");
var currentTestSuite = 0,
	currentTest = 0,
	numPassedTests = 0,
	numFailedTests = 0;

function runNextTest() {	
	var test = testSuites[currentTestSuite].tests[currentTest];
	console.log("Testing: " + testSuites[currentTestSuite].name + ", " + test.name);
	test.test(function(success) {
		if (success) {
			numPassedTests++;
		} else {
			numFailedTests++;
		}
	});

	var suite = testSuites[currentTestSuite];
	if (currentTest >= suite.tests.length - 1) {
		currentTestSuite++;
		currentTest = 0;
	} else {
		currentTest++;
	}

	if (currentTestSuite >= testSuites.length) {
		console.log("\nAll tests completed.\n" + numPassedTests + " tests passed, " + numFailedTests + " tests failed.");
	} else {
		runNextTest();
	}
}
runNextTest();