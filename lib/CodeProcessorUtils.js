/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Various helper methods
 *
 * @module CodeProcessorUtils
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var fs = require('fs'),
	path = require('path'),
	jsFileRegex = /^[^\.].*\.js$/,
	jsDirRegex = /^[^\.]/;

exports.pluralize = function (singular, plural, value) {
	var sourceStr = value === 1 ? singular : plural;
	return sourceStr.replace(/%s/g, value);
};

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

exports.findJavaScriptFiles = function (baseDir) {
	return exports.crawlDirectory(baseDir, function (fileName) {
		return jsFileRegex.test(fileName);
	}, function (dirName) {
		return jsDirRegex.test(dirName);
	});
};

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
			if (fs.statSync(path.join(dir, content)).isDirectory()) {
				localDirs.push(content);
			} else {
				localFiles.push(content);
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