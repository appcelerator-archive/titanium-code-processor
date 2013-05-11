/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * CLI command interface for the code processor
 *
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var CodeProcessor = require('..'),
	appc = require('node-appc'),
	i18n = appc.i18n(__dirname),
	__ = i18n.__;

exports.desc = exports.extendedDesc = __('analyses a project using the Titanium Code Processor');

exports.config = function () {
	var conf = {
		skipBanner: true
	};
	return conf;
};

exports.run = function (logger, config) {
	CodeProcessor.queryPlugins(config.paths && config.paths.codeProcessorPlugins || [], logger, function (err, results) {
		if (err) {
			logger.error(err);
			process.exit(1);
		} else {
			logger.log(JSON.stringify(results, false, '\t'));
		}
	});
};
