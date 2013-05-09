/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * CLI command interface for the code processor
 *
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var path = require('path'),
	fs = require('fs'),
	existsSync = fs.existsSync || path.existsSync,
	exec = require('child_process').exec,

	wrench = require('wrench'),
	winston = require('winston'),

	appc = require('node-appc'),
	i18n = appc.i18n(__dirname),
	__ = i18n.__,

	CodeProcessor = require('../'),

	sourceInformation,
	options,
	plugins;

exports.desc = exports.extendedDesc = __('analyses a project using the Titanium Code Processor');

exports.config = function (logger, config) {
	var conf = {
		skipBanner: true,
		flags: {
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

	var argv = cli.argv,
		configFile,
		filename;

	// Check if a config file was specified
	configFile = argv['config-file'];
	if (configFile) {

		// Parse the config file
		if (!existsSync(configFile)) {
			logger.error(__('Could not find config file "%s"', configFile));
			process.exit(1);
		}
		try {
			configFile = JSON.parse(fs.readFileSync(configFile));
		} catch(e) {
			logger.error(__('Could not parse config file: %s',e));
			process.exit(1);
		}

		// Validate the entry point
		if (typeof configFile.sourceInformation !== 'object' || Array.isArray(configFile.sourceInformation)) {
			logger.error(__('Source information missing in config file'));
			process.exit(1);
		}
		if (!configFile.sourceInformation.projectDir) {
			logger.error(__('Missing project directory in config file'));
			process.exit(1);
		}
		if (!existsSync(configFile.sourceInformation.projectDir)) {
			logger.error(__('Could not find project directory "%s"', configFile.sourceInformation.projectDir));
			process.exit(1);
		}
		if (!configFile.sourceInformation.sourceDir) {
			logger.error(__('Missing source directory in config file'));
			process.exit(1);
		}
		if (!existsSync(configFile.sourceInformation.sourceDir)) {
			logger.error(__('Could not find source directory "%s"', configFile.sourceInformation.sourceDir));
			process.exit(1);
		}
		if (!configFile.sourceInformation.entryPoint) {
			logger.error(__('Missing entry point in config file'));
			process.exit(1);
		}
		if (!existsSync(configFile.sourceInformation.entryPoint)) {
			logger.error(__('Could not find entry point "%s"', configFile.sourceInformation.entryPoint));
			process.exit(1);
		}

		// Validate the logging and finagle things around for outputs other than report
		if (configFile.logging && configFile.logging.file) {
			if (['trace', 'debug', 'info', 'notice', 'warn', 'error'].indexOf(configFile.logging.file.level) === -1) {
				logger.error(__('Unknown log level "%s"', configFile.logging.file.level));
				process.exit(1);
			}
			filename = configFile.logging.file.path;
			if (!existsSync(path.dirname(filename))) {
				wrench.mkdirSyncRecursive(path.dirname(filename));
			}
			logger.add(winston.transports.File, {
				filename: path.resolve(filename),
				level: configFile.logging.file.level
			});
		}
		if (argv.output !== 'report') {
			logger.remove(winston.transports.Console);
			if (configFile.logging.console) {
				logger.warn(__('Console logging settings will be ignored because the output type is not report'));
			}
		} else if (configFile.logging.console) {
			if (['trace', 'debug', 'info', 'notice', 'warn', 'error'].indexOf(configFile.logging.console.level) === -1) {
				logger.error(__('Unknown log level "%s"', configFile.logging.console.level));
				process.exit(1);
			}
			logger.setLevel(configFile.logging.console.level);
		}

		if (!configFile.options) {
			configFile.options = {};
		}
		if (typeof configFile.options !== 'object' || Array.isArray(configFile.options)) {
			logger.error(__('Config "options" entry must be an object'));
			process.exit(1);
		}

		if (!configFile.plugins) {
			configFile.plugins = [];
		}
		if (typeof configFile.plugins !== 'object' || !Array.isArray(configFile.plugins)) {
			logger.error(__('Config "plugins" entry must be an array'));
			process.exit(1);
		}

		sourceInformation = configFile.sourceInformation;
		options = configFile.options;
		plugins = configFile.plugins;
	}/* else {

		if (!parsedOptions.osname) {
			console.error('\n"osname" argument is required when not using a config file\n');
			process.exit(1);
		}

		// Create the logger
		if (['trace', 'debug', 'info', 'notice', 'warn', 'error'].indexOf(parsedOptions['log-level']) === -1) {
			console.error('Unknown log level "' + parsedOptions['log-level'] + '"');
			process.exit(1);
		}
		logger = new (winston.Logger)({
			transports: [
				new (winston.transports.Console)({ level: parsedOptions['log-level'] })
			],
			levels: {
				trace: 0,
				debug: 1,
				info: 2,
				notice: 3,
				warn: 4,
				error: 5
			}
		});

		// Parse the config options
		if (parsedOptions.config) {
			for(i = 0, len = parsedOptions.config.length; i < len; i++) {
				configOption = parsedOptions.config[i].split('=');
				if (configOption.length !== 2) {
					console.error('Invalid option "' + parsedOptions.config[i] + '"\n');
					process.exit(1);
				}
				switch(configOption[0]) {
					case 'invokeMethods':
						options.invokeMethods = configOption[1] === 'true';
						break;
					case 'evaluateLoops':
						options.evaluateLoops = configOption[1] === 'true';
						break;
					case 'maxLoopIterations':
						options.maxLoopIterations = parseInt(configOption[1], 10);
						break;
					case 'maxRecursionLimit':
						options.maxRecursionLimit = parseInt(configOption[1], 10);
						break;
					case 'cycleDetectionStackSize':
						options.cycleDetectionStackSize = parseInt(configOption[1], 10);
						break;
					case 'maxCycles':
						options.maxCycles = parseInt(configOption[1], 10);
						break;
					case 'logConsoleCalls':
						options.logConsoleCalls = configOption[1] === 'true';
						break;
					case 'executionTimeLimit':
						options.executionTimeLimit = parseInt(configOption[1], 10);
						break;
					case 'exactMode':
						options.exactMode = configOption[1] === 'true';
						break;
					case 'nativeExceptionRecovery':
						options.nativeExceptionRecovery = configOption[1] === 'true';
						break;
					case 'processUnvisitedCode':
						options.processUnvisitedCode = configOption[1] === 'true';
						break;
					default:
						console.error('Invalid option "' + parsedOptions.config[i] + '"\n');
						process.exit(1);
				}
			}
		}

		// Calculate the project root
		if (parsedOptions['project-dir']) {
			projectRoot = parsedOptions['project-dir'];
		}
		projectRoot = sourceInformation.projectDir = path.resolve(projectRoot);

		// Store the results dir
		options.resultsPath = parsedOptions['results-dir'];
		options.resultsTheme = parsedOptions['results-theme'];
		options.suppressResults = parsedOptions['suppress-results'];

		// Check if we are processing a project or a single file
		sourceInformation.sourceDir = path.join(projectRoot, 'Resources');
		entryPoint = sourceInformation.entryPoint = path.join(projectRoot, 'Resources', 'app.js');
		if (!existsSync(entryPoint)) {
			console.error(projectRoot + ' does not appear to be a valid Titanium Mobile project.\n');
			process.exit(1);
		} else {
			if (logger) {
				logger.info('Analyzing project at "' + projectRoot + '"');
			}
			exec('titanium project --no-prompt --project-dir "' + projectRoot + '"', { stdio: 'inherit'}, function (err) {
				var tasks = {
					tiappxml: function (next) {
						(new xml2js.Parser()).parseString(fs.readFileSync(path.join(projectRoot, 'tiapp.xml')), function (err, data) {
							if (err) {
								next(err);
							} else {
								next(null, data);
							}
						});
					},
					modules: function (next) {
						exec('titanium module --no-prompt -o json --project-dir "' + projectRoot + '"', function (err, stdout) {
							if (err) {
								next(err);
							} else {
								next(null, JSON.parse(stdout));
							}
						});
					},
					project: function (next) {
						exec('titanium project --no-prompt -o json --project-dir "' + projectRoot + '"', function (err, stdout) {
							if (err) {
								next(err);
							} else {
								next(null, JSON.parse(stdout));
							}
						});
					},
					info: function (next) {
						exec('titanium info --no-prompt -t titanium -o json', function (err, stdout) {
							if (err) {
								next(err);
							} else {
								next(null, JSON.parse(stdout));
							}
						});
					}
				};

				if (err) {
					if (logger) {
						logger.error('Could not run the "titanium project" command: ' + err +
							'Make sure that the Titanium CLI is installed and a 3.0 or newer SDK is installed.\n');
					}
				} else {
					async.parallel(tasks, function (err, result) {
						if (err) {
							if (logger) {
								logger.error(err);
							}
						} else {

							// Create the plugin info
							CodeProcessor.queryPlugins([], function(err, results) {
								var sdkVersion,
									sdkInfo,
									projectModules,
									globalModules,
									moduleList,
									modules = {},
									i, len,
									pluginList = parsedOptions.plugin,
									plugins = [],
									plugin;

								if (parsedOptions['all-plugins']) {
									for(plugin in results) {
										plugins.push({
											path: results[plugin].path,
											options: {}
										});
									}
								} else if (parsedOptions['non-ti-plugins']) {
									for(plugin in results) {
										if (!tiRegex.test(plugin)) {
											plugins.push({
												path: results[plugin].path,
												options: {}
											});
										}
									}
								} else if (pluginList) {
									for(i = 0, len = pluginList.length; i < len; i++) {
										plugin = pluginList[i];
										if (plugin in results) {
											plugins.push({
												path: results[plugin].path,
												options: {}
											});
										} else if (logger) {
											logger.warn('Plugin "' + pluginList[i] + '" is unknown');
										}
									}
								}

								// Parse the CLI queries
								if (result.info && result.modules && result.project) {

									// Get the SDK path
									sdkVersion = result.tiappxml['ti:app']['sdk-version'];
									if (sdkVersion) {
										sdkVersion = sdkVersion[0].match(/^([0-9]\.[0-9]\.[0-9]).*$/)[1];
									} else {
										sdkVersion = Object.keys(result.info.titanium).sort().pop();
									}
									sdkInfo = result.info.titanium[sdkVersion];
									if (!sdkInfo) {
										if (result.info.titanium[sdkVersion + '.GA']) {
											sdkVersion = sdkVersion + '.GA';
											sdkInfo = result.info.titanium[sdkVersion];
										} else {
											if (logger) {
												logger.error('SDK version ' + sdkVersion + ' is not available\n');
											}
											process.exit(1);
										}
									}

									// Get the list of modules from the tiapp.xml
									projectModules = result.modules.project;
									globalModules = result.modules.global;
									moduleList = result.tiappxml['ti:app'].modules && result.tiappxml['ti:app'].modules[0].module;
									if (moduleList) {
										moduleList.forEach(function (module) {
											var platform = module.$.platform,
												name = module._,
												version = module.$.version,
												moduleEntry;
											if (platform) {
												if (!modules[platform]) {
													modules[platform] = {};
												}
												if (projectModules && projectModules[platform] && projectModules[platform][name]) {
													moduleEntry = projectModules[platform][name];
												} else if (globalModules && globalModules[platform] && globalModules[platform][name]) {
													moduleEntry = globalModules[platform][name];
												}
												if (moduleEntry) {
													if (version) {
														moduleEntry = moduleEntry[version];
														if (!moduleEntry) {
															logger.error('Version ' + version + ' of ' + name + ' does not exist');
															process.exit(1);
														}
													} else {
														moduleEntry = moduleEntry[Object.keys(moduleEntry).sort().pop()];
													}
													modules[platform][name] = moduleEntry.modulePath;
												}
											} else {
												if (!modules[parsedOptions.osname]) {
													modules[parsedOptions.osname] = {};
												}
												modules[parsedOptions.osname][name] = ''; // Kinda hacky, but good enough for this script
											}
										});
									}
									for(i = 0, len = plugins.length; i < len; i++) {
										if (path.basename(plugins[i].path) === 'require-provider') {
											plugins[i].options.modules = modules;
										} else if (path.basename(plugins[i].path) === 'ti-api-provider') {
											plugins[i].options.sdkPath = sdkInfo.path;
										}
									}
								}
								for(i = 0, len = plugins.length; i < len; i++) {
									if (path.basename(plugins[i].path) === 'require-provider') {
										plugins[i].options.platform = parsedOptions.osname;
									} else if (path.basename(plugins[i].path) === 'ti-api-platform-validator') {
										plugins[i].options.platform = parsedOptions.osname;
									} else if (path.basename(plugins[i].path) === 'ti-api-provider') {
										plugins[i].options.platform = parsedOptions.osname;
									} else if (path.basename(plugins[i].path) === 'analysis-coverage') {
										plugins[i].options.visualization = {
											outputDirectory: options.resultsPath ? path.join(options.resultsPath, 'analysis-coverage') : undefined
										};
									} else if (path.basename(plugins[i].path) === 'unknown-ambiguous-visualizer') {
										plugins[i].options.visualization = {
											outputDirectory: options.resultsPath ? path.join(options.resultsPath, 'unknown-ambiguous-visualizer') : undefined
										};
									}
								}

								// Check if this is an alloy app
								if (existsSync(path.join(projectRoot, 'app'))) {
									sourceMapDir = path.join(projectRoot, 'build', 'map', 'Resources');
									sourceInformation.originalSourceDir = path.join(projectRoot, 'app');
									if (!existsSync(sourceMapDir)) {
										logger.error('Alloy projects must be compiled to analyze with the Titanium Code Processor');
										process.exit(1);
									}

									// Load the source maps
									sourceMapsFiles = wrench.readdirSyncRecursive(sourceMapDir);
									sourceMaps = {};
									for (i = 0, len = sourceMapsFiles.length; i < len; i++) {
										sourceMap = path.join(sourceMapDir, sourceMapsFiles[i]);
										if (sourceMapRegex.test(sourceMap)) {
											sourceMaps[sourceMapsFiles[i].replace(sourceMapRegex, '')] = sourceMap;
										}
									}
									sourceInformation.sourceMaps = sourceMaps;
								}

								setTimeout(function(){
									CodeProcessor.run(sourceInformation, options, plugins, logger);
								}, 0);
							});
						}
					});
				}
			});
		}
	}
	*/
};

exports.run = function (logger, config, cli) {
	if (cli.argv.output === 'report') {
		logger.banner();
	}
	CodeProcessor.run(sourceInformation, options, plugins, logger);
};
