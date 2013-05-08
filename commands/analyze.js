/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * CLI command interface for the code processor
 *
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var appc = require('node-appc'),
	i18n = appc.i18n(__dirname),
	__ = i18n.__;

exports.desc = exports.extendedDesc = __('analyses a project using the Titanium Code Processor');

exports.config = function (logger, config) {
	var conf = {
		skipBanner: true,
		flags: {
			'query-plugins': {
				desc: __('queries the plugins in available plugin search paths and prints information about them')
			},
			'query-options': {
				desc: __('queries the plugins in available plugin search paths and prints information about them')
			},
			'all-plugins': {
				abbr: 'A',
				desc: __('loads all plugins in the default search path')
			}
		},
		options: {
			'config-file': {
				abbr: 'F',
				desc: __('the path to the config file, note: all other options are ignored when this options is specified'),
				callback: function() {
					conf.options.platform.required = false;
				}
			},
			plugins: {
				abbr: 'L',
				desc: __('a comma separated list of plugin names to load'),
				hint: __('plugins')
			},
			platform: {
				abbr: 'p',
				desc: __('the name of the OS being built-for, reflected in code via Ti.Platform.osname'),
				hint: __('platform'),
				required: true
			},
			'project-dir': {
				abbr: 'd',
				desc: __('the directory containing the project, otherwise the current working directory')
			},
			'results-dir': {
				abbr: 'R',
				desc: __('the path to the directory that will contain the generated results pages')
			},
			'log-level': {
				callback: function (value) {
					logger.levels.hasOwnProperty(value) && logger.setLevel(value);
				},
				desc: __('minimum logging level'),
				default: config.cli.logLevel || 'debug',
				hint: __('level'),
				values: logger.getLevels()
			},
			output: {
				abbr: 'o',
				desc: __('output format'),
				hint: __('format'),
				default: 'report',
				values: ['report', 'json', 'stream']
			}
		}
	};
	return conf;
};

exports.validate = function (logger, config, cli) {

};

exports.run = function (logger, config, cli) {
	if (cli.argv.output === 'report') {
		logger.banner();
	}
};
