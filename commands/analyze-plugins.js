/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * CLI command interface for the code processor
 *
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var CodeProcessor = require('..'),
	__ = require('../lib/i18n')(__dirname).__;

exports.desc = exports.extendedDesc = __('analyses a project using the Titanium Code Processor');

exports.config = function () {
	var conf = {
		skipBanner: true
	};
	return conf;
};

exports.run = function (logger, config) {
	var paths = config.paths && config.paths.codeProcessorPlugins || [];
	CodeProcessor.queryPlugins(paths, logger, function (err, results) {
		if (err) {
			logger.error(err);
			process.exit(1);
		} else {
			logger.log(JSON.stringify(results, false, '\t'));
		}
	});
};
