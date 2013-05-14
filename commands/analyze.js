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
	async = require('async'),
	xml2js = require('xml2js'),

	appc = require('node-appc'),
	i18n = appc.i18n(__dirname),
	__ = i18n.__,

	CodeProcessor = require('../'),
	Runtime = require('../lib/Runtime');

exports.desc = exports.extendedDesc = __('analyzes a project using the Titanium Code Processor');

exports.config = function (logger, config) {
	var conf = {
		skipBanner: true,
		flags: {
			'all-plugins': {
				abbr: 'A',
				desc: __('loads all plugins in the default search path')
			},
			'no-method-invokation': {
				desc: __('prevents methods from being invoked (ignored if --config-file is specified)'),
				default: !Runtime.options.invokeMethods
			},
			'no-loop-evaluation': {
				desc: __('Whether or not to evaluate loops (ignored if --config-file is specified)'),
				default: !Runtime.options.evaluateLoops
			},
			'no-console-passthrough': {
				desc: __('Prevents console.* calls in a project from being logged to the console (ignored if' +
					' --config-file is specified)'),
				default: !Runtime.options.logConsoleCalls
			},
			'exact-mode': {
				desc: __('enables exact mode evaluation. Exact mode does not use ambiguous' +
					' modes and throws an exception if an Unknown type is encountered (ignored if --config-file is specified)'),
				default: Runtime.options.exactMode
			},
			'no-native-exception-recovery': {
				desc: __('disables recovering from native exceptions when not in try/catch statements (ignored ' +
					'if --config-file is specified)'),
				default: !Runtime.options.nativeExceptionRecovery
			},
			'process-unvisited-code': {
				desc: __('when set to true, all nodes and files that are not visited/skipped will be processed in ambiguous' +
					' mode after all other code has been processed. While this will cause more of a project to be analyzed,' +
					' this will decrease accuracy and can generate a lot of false positives (ignored if --config-file is specified)'),
				default: Runtime.options.processUnvisitedCode
			}
		},
		options: {
			output: {
				abbr: 'o',
				desc: __('output format'),
				hint: __('format'),
				default: 'report',
				values: ['report', 'json', 'stream']
			},
			'config-file': {
				abbr: 'F',
				desc: __('the path to the config file, note: most options and flags are ignored with this option'),
				callback: function() {
					conf.options.platform.required = false;
				}
			},
			plugins: {
				desc: __('a comma separated list of plugin names to load (ignored if --config-file is specified)'),
				hint: __('plugins')
			},
			platform: {
				abbr: 'p',
				desc: __('the name of the OS being built-for, reflected in code via Ti.Platform.osname (ignored if --config-file is specified)'),
				hint: __('platform'),
				required: true
			},
			'project-dir': {
				abbr: 'd',
				desc: __('the directory containing the project, otherwise the current working directory (ignored if --config-file is specified)')
			},
			'results-dir': {
				abbr: 'R',
				desc: __('the path to the directory that will contain the generated results pages (ignored if --config-file is specified)')
			},
			'log-level': {
				callback: function (value) {
					logger.levels.hasOwnProperty(value) && logger.setLevel(value);
				},
				desc: __('minimum logging level (ignored if --config-file is specified)'),
				default: config.cli.logLevel || 'debug',
				hint: __('level'),
				values: logger.getLevels()
			},
			'max-loop-iterations': {
				desc: __('the maximum number of iterations a loop can iterate before falling back to an unknown evaluation (ignored if --config-file is specified)'),
				hint: __('iterations'),
				default: Runtime.options.maxLoopIterations
			},
			'max-recursion-limit': {
				desc: __('the maximum recursion depth to evaluate before throwing a RangeError exception (ignored if --config-file is specified)'),
				hint: __('recursion limit'),
				default: Runtime.options.maxRecursionLimit
			},
			'execution-time-limit': {
				desc: __('the maximum time the app is allowed to run before erroring. 0 means no time limit (ignored if --config-file is specified)'),
				hint: __('time limit'),
				default: Runtime.options.executionTimeLimit
			},
			'cycle-detection-stack-size': {
				desc: __('the size of the cycle detection stack. Cycles that are larger than this size will not be caught'),
				hint: __('size'),
				default: Runtime.options.cycleDetectionStackSize
			},
			'max-cycles': {
				desc: __('The maximum number of cycles to allow before throwing an exception'),
				hint: __('size'),
				default: Runtime.options.maxCycles
			}
		}
	};
	return conf;
};

exports.run = function (logger, config, cli) {
	var argv = cli.argv,
		configFile,
		filename,
		projectRoot,
		entryPoint,
		options,
		sourceInformation,
		pkg,
		i, len,
		sdkPath,
		ti;

	function run(sourceInformation, options, plugins) {
		options.outputFormat = argv.output;
		cli.fireHook('codeprocessor.pre.run', function () {
			setTimeout(function () {
				CodeProcessor.run(sourceInformation, options, plugins, logger, function () {});
			}, 0);
		});
	}

	if (argv.output === 'report') {
		logger.banner();
	}

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

		// Set the CLI platform arg
		for (i = 0, len = configFile.plugins.length; i < len; i++) {
			try {
				pkg = JSON.parse(fs.readFileSync(path.join(configFile.plugins[i].path, 'package.json')));
				if (pkg.name === 'require-provider') {
					argv.platform = configFile.plugins[i].options.platform;
				}
				if (pkg.name === 'ti-api-provider') {
					sdkPath = configFile.plugins[i].options.sdkPath;
					if (!existsSync(sdkPath)) {
						logger.log('error', 'Could not find the specified SDK path "' + sdkPath + '"');
						process.exit(1);
					}
					try {
						ti = require(path.join(sdkPath, 'node_modules', 'titanium-sdk'));
						ti.validateProjectDir(logger, cli, cli.argv, 'project-dir');
						ti.validateTiappXml(logger, cli.tiapp);
						ti.loadPlugins(logger, cli, config, cli.argv['project-dir']);
					} catch(e) {} // squash
				}
			} catch(e) {
				logger.log('error', 'Could not parse "' + path.join(configFile.plugins[i].path, 'package.json') + '": ' + e);
				process.exit(1);
			}
		}
		if (!cli.argv.platform) {
			argv.platform = 'iphone';
		}

		if (typeof configFile.plugins !== 'object' || !Array.isArray(configFile.plugins)) {
			logger.error(__('Config "plugins" entry must be an array'));
			process.exit(1);
		}

		run(configFile.sourceInformation, configFile.options, configFile.plugins);

	} else {

		// Parse the config options
		options = {};
		options.invokeMethods = !argv['no-method-invokation'];
		options.evaluateLoops = !argv['no-loop-evaluation'];
		options.maxLoopIterations = parseInt(argv['max-loop-iterations'], 10);
		options.maxRecursionLimit = parseInt(argv['max-recursion-limit'], 10);
		options.cycleDetectionStackSize = parseInt(argv['cycle-detection-stack-size'], 10);
		options.maxCycles = parseInt(argv['max-cycles'], 10);
		options.logConsoleCalls = !argv['no-console-passthrough'];
		options.executionTimeLimit = parseInt(argv['execution-time-limit'], 10);
		options.exactMode = argv['exact-mode'];
		options.nativeExceptionRecovery = !argv['no-native-exception-recovery'];
		options.processUnvisitedCode = argv['process-unvisited-code'];
		options.resultsPath = argv['results-dir'];

		if (argv.output !== 'report') {
			logger.remove(winston.transports.Console);
		}

		// Calculate the project root
		if (argv['project-dir']) {
			projectRoot = argv['project-dir'];
		}
		sourceInformation = {};
		projectRoot = sourceInformation.projectDir = path.resolve(projectRoot);

		// Set the source information
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
							CodeProcessor.queryPlugins(config.paths && config.paths.codeProcessorPlugins || [],
									logger, function(err, results) {
								var sdkVersion,
									sdkInfo,
									projectModules,
									globalModules,
									moduleList,
									modules = {},
									pluginList = argv.plugins,
									plugins = [],
									plugin,
									sourceMapDir,
									sourceMapsFiles,
									sourceMaps,
									sourceMap,
									sourceMapRegex = /\.map$/,
									ti,
									sdkPath;

								if (argv['all-plugins']) {
									for(plugin in results) {
										plugins.push({
											path: results[plugin].path,
											options: {}
										});
									}
								} else {
									pluginList = pluginList ? pluginList.split(',') : [];
									for(i = 0, len = pluginList.length; i < len; i++) {
										plugin = pluginList[i];
										if (plugin in results) {
											plugins.push({
												path: results[plugin].path,
												options: {}
											});
										} else if (logger) {
											logger.warn(__('Plugin "%s" is unknown', pluginList[i]));
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

									// Load the ti module and CLI plugins
									sdkPath = sdkInfo.path;
									if (!existsSync(sdkPath)) {
										logger.log('error', 'Could not find the specified SDK path "' + sdkPath + '"');
										process.exit(1);
									}
									try {
										ti = require(path.join(sdkPath, 'node_modules', 'titanium-sdk'));
										ti.validateProjectDir(logger, cli, cli.argv, 'project-dir');
										ti.validateTiappXml(logger, cli.tiapp);
										ti.loadPlugins(logger, cli, config, cli.argv['project-dir']);
									} catch(e) {} //squash

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
												if (!modules[argv.platform]) {
													modules[argv.platform] = {};
												}
												modules[argv.platform][name] = ''; // Kinda hacky, but good enough for this script
											}
										});
									}
									for(i = 0, len = plugins.length; i < len; i++) {
										if (path.basename(plugins[i].path) === 'require-provider') {
											plugins[i].options.modules = modules;
										} else if (path.basename(plugins[i].path) === 'ti-api-provider') {
											plugins[i].options.sdkPath = sdkPath;
										}
									}
								}
								for(i = 0, len = plugins.length; i < len; i++) {
									if (path.basename(plugins[i].path) === 'require-provider') {
										plugins[i].options.platform = argv.platform;
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

								run(sourceInformation, options, plugins);
							});
						}
					});
				}
			});
		}
	}
};
