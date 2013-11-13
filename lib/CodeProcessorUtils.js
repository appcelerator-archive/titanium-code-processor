/**
 * <p>Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Various helper methods
 *
 * @module CodeProcessorUtils
 */

var fs = require('fs'),
	path = require('path'),
	jsFileRegex = /^[^\.].*\.js$/,
	jsDirRegex = /^[^\.]/;

/**
 * Creates a properly pluralized version of a string given a numerical value. Input strings can use "%s" to denote
 * where the value to pluralize should be placed in a sentence (multiple "%s" instances are supported). The correct
 * string is selected based on whether the value is 1 or not.
 *
 * @param  {string} singular The singular version of the string
 * @param  {string} plural The plural version of the string
 * @param  {number} value The value to determine pluralization
 * @return {string} The pluralized string
 */
exports.pluralize = function (singular, plural, value) {
	var sourceStr = value === 1 ? singular : plural;
	return sourceStr.replace(/%s/g, value);
};

/**
 * Non-recursively finds all sub-directories inside of a given directory
 *
 * @param  {string} baseDir The path to the base directory to search
 * @return {Array.<string>} An array of all of the sub-directory names
 */
exports.getSubDirectories = function (baseDir) {

	var contents = fs.readdirSync(baseDir),
		fullPath,
		i;

	for (i = 0; i < contents.length; i++) {
		fullPath = path.join(baseDir, contents[i]);
		if (!fs.statSync(fullPath).isDirectory() || !jsDirRegex.test(contents[i][0])) {
			contents.splice(i--, 1);
		} else {
			contents[i] = fullPath;
		}
	}

	return contents;
};

/**
 * Recursively finds all JavaScript files in a directory
 *
 * @param  {string} baseDir The path to the base directory to search
 * @return {Array.<string>} An array of paths to all JavaScript files found
 */
exports.findJavaScriptFiles = function (baseDir) {
	return exports.crawlDirectory(baseDir, function (fileName) {
		return jsFileRegex.test(fileName);
	}, function (dirName) {
		return jsDirRegex.test(dirName);
	});
};

/**
 * Called when a file is found
 *
 * @callback module:CodeProcessorUtils.crawlDirectoryFileCallback
 * @param {string} fileName The name of the file
 * @param {string} filePath The path to the file
 * @returns {boolean} Whether or not to include this file in the results
 */
/**
 * Called when a directory is found
 *
 * @callback module:CodeProcessorUtils.crawlDirectoryDirectoryCallback
 * @param {string} dirName The name of the directory
 * @param {string} dirPath The path to the directory
 * @returns {boolean} Whether or not to recurse into this directory
 */
/**
 * Crawls a directory looking for files and folders and optionally call user-supplied callbacks when found
 *
 * @param  {string} baseDir The path to the base directory to crawl
 * @param  {module:CodeProcessorUtils.crawlDirectoryFileCallback} fileCallback The callback to call when a file is found
 * @param  {module:CodeProcessorUtils.crawlDirectoryDirectoryCallback} directoryCallback The callback to call when a directory is called
 * @return {Array.<string>} An array of all files found
 */
exports.crawlDirectory = function (baseDir, fileCallback, directoryCallback) {
	var files = [];
	function crawl(dir) {
		var contents = fs.readdirSync(dir),
			i, len,
			localFiles = [],
			localDirs = [],
			content;

		// Sort into files and directories
		for (i = 0, len = contents.length; i < len; i++) {
			content = contents[i];
			if (fs.existsSync(path.join(dir, content))) {
				if (fs.statSync(path.join(dir, content)).isDirectory()) {
					localDirs.push(content);
				} else {
					localFiles.push(content);
				}
			}
		}

		// Filter the files
		for (i = 0; i < localFiles.length; i++) {
			content = path.join(dir, localFiles[i]);
			if (fileCallback && !fileCallback(localFiles[i], content)) {
				localFiles.splice(i--, 1);
			} else {
				localFiles[i] = content;
			}
		}

		// Add the files
		files = files.concat(localFiles);

		// Crawl the sub directories
		for (i = 0; i < localDirs.length; i++) {
			content = path.join(dir, localDirs[i]);
			if (!directoryCallback || directoryCallback(localDirs[i], content)) {
				crawl(content);
			}
		}
	}
	crawl(baseDir);
	return files;
};