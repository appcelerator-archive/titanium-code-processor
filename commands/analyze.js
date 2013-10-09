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
	semver = require('semver'),

	appc = require('node-appc'),
	ti, // Will be loaded in the config method
	afs = appc.fs,
	i18n = appc.i18n(__dirname),
	__ = i18n.__,
	__n = i18n.__n,

	latestSDK,

	CodeProcessor = require('../'),
	CodeProcessorUtils = require('../lib/CodeProcessorUtils'),
	Runtime = require('../lib/Runtime'),

	sourceInformation,
	options,
	plugins;

const DISABLE_BLACKLIST = false,
	VISUALIZE_BLACKLISTED_FILES = false;

exports.cliVersion = '>=3.X';
exports.title = __('Analyze');
exports.desc = exports.extendedDesc = __('analyzes a project using the Titanium Code Processor');

exports.config = function (logger, config, cli) {

	// Load the titanium-sdk module from the active SDK
	var defaultInstallLocation = cli.env.installPath,
		locations = cli.env.os.sdkPaths.map(function (p) { return afs.resolvePath(p); }),
		sdks = cli.env.sdks,
		vers = Object.keys(sdks).sort().reverse();
	locations.indexOf(defaultInstallLocation) == -1 && locations.push(defaultInstallLocation);
	latestSDK = vers[0];
	if (semver.lt(latestSDK.match(/^([0-9]*\.[0-9]*\.[0-9]*)/)[1], '3.2.0')) {
		logger.error('The Titanium Code Processor requires version 3.2.0 of the Titanium SDK or newer');
		process.exit(1);
	}
	ti = require(path.join(sdks[latestSDK].path, 'node_modules', 'titanium-sdk'));

	// Create the config
	return function (finished) {
		ti.platformOptions(logger, config, cli, 'build', function (platformConf) {
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
					},
					'wait': {
						abbr: 'W',
						desc: __('Process waits on standard input after processing the results'),
						default: false
					}
				},
				options: appc.util.mix({
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
						callback: function (platform) {
							cli.argv.$originalPlatform = platform;
							return ti.resolvePlatform(platform);
						},
						desc: __('the name of the OS being built-for, reflected in code via Ti.Platform.osname (ignored if --config-file is specified)'),
						hint: __('platform'),
						prompt: {
							label: __('Target platform [%s]', ti.targetPlatforms.join(',')),
							error: __('Invalid platform'),
							validator: function (platform) {
								if (!platform) {
									throw new appc.exception(__('Invalid platform'));
								}

								platform = platform.trim();

								// temp: ti.availablePlatforms contains "iphone" and "ipad" which aren't going to be valid supported platforms
								if (ti.availablePlatforms.indexOf(platform) == -1) {
									throw new appc.exception(__('Invalid platform: %s', platform));
								}

								// now that we've passed the validation, transform and continue
								platform = ti.resolvePlatform(platform);

								// it's possible that platform was not specified at the command line in which case the it would
								// be prompted for. that means that validate() was unable to apply default values for platform-
								// specific options and scan for platform-specific hooks, so we must do it here.

								var p = platformConf[platform];
								p && p.options && Object.keys(p.options).forEach(function (name) {
									if (p.options[name].default && cli.argv[name] === undefined) {
										cli.argv[name] = p.options[name].default;
									}
								});

								cli.scanHooks(afs.resolvePath(path.dirname(module.filename), '..', '..', platform, 'cli', 'hooks'));

								return true;
							}
						},
						required: true,
						skipValueCheck: true,
						values: ti.targetPlatforms
					},
					'project-dir': {
						abbr: 'd',
						desc: __('the directory containing the project, otherwise the current working directory (ignored if --config-file is specified)')
					},
					'results-dir': {
						abbr: 'R',
						desc: __('the path to the directory that will contain the generated results pages (ignored if --config-file is specified)')
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
				}, ti.commonOptions(logger, config)),
				platforms: {}
			};
			finished(conf);
		});
	};
};

exports.validate = function (logger, config, cli) {
	return function (callback) {
		if (cli.argv.output === 'report') {
			logger.banner();
		}
		if (cli.argv['config-file']) {
			validateConfigFile(logger, config, cli, callback);
		} else {
			validateCLIParameters(logger, config, cli, callback);
		}
	};
};

exports.run = function (logger, config, cli) {
	cli.fireHook('codeprocessor.pre.run', function () {

		// Validate the source information, now that alloy has been compiled
		if (!existsSync(sourceInformation.projectDir)) {
			console.error(__('Could not find project directory "%s"', sourceInformation.projectDir));
			process.exit(1);
		}
		if (!existsSync(sourceInformation.sourceDir)) {
			console.error(__('Could not find source directory "%s"', sourceInformation.sourceDir));
			process.exit(1);
		}
		if (!existsSync(sourceInformation.entryPoint)) {
			console.error(__('Could not find entry point "%s"', sourceInformation.entryPoint));
			process.exit(1);
		}

		options.outputFormat = cli.argv.output;
		setTimeout(function () {
			CodeProcessor.run(sourceInformation, options, plugins, logger, function () {
				if (cli.argv.wait)
				{
					var stdin = process.stdin;
					stdin.setRawMode && stdin.setRawMode(true);
					stdin.resume();
					stdin.setEncoding('utf8');

					// Exit on any data passed to stdin
					stdin.on('data', function(){
						process.exit();
					});
				}
			});
		}, 0);
	});
};

function validateAlloyHook(projectDir, logger, callback) {
	var projectHook;
	if (existsSync(path.join(projectDir, 'app'))) {
		projectHook = fs.readFileSync(path.join(projectDir, 'plugins', 'ti.alloy', 'hooks', 'alloy.js')).toString();
		if (projectHook.indexOf('codeprocessor.pre.run') === -1) {
			logger.warn(__('The Alloy hook is out of date and must be updated to work with the Titanium Code Processor. Updating now.'));
			exec('alloy install plugin', {
				cwd: projectDir
			}, callback);
		} else {
			callback();
		}
	} else {
		callback();
	}
}

function validateConfigFile(logger, config, cli, callback) {
	var argv = cli.argv,
		configFile = cli.argv['config-file'],
		filename,
		pkg,
		i, len,
		sdkPath,
		ti;

	// Parse the config file
	if (!existsSync(configFile)) {
		console.error(__('Could not find config file "%s"', configFile));
		process.exit(1);
	}
	try {
		configFile = JSON.parse(fs.readFileSync(configFile));
	} catch(e) {
		console.error(__('Could not parse config file: %s',e));
		process.exit(1);
	}

	// Validate the entry point
	if (typeof configFile.sourceInformation !== 'object' || Array.isArray(configFile.sourceInformation)) {
		console.error(__('Source information missing in config file'));
		process.exit(1);
	}
	if (!configFile.sourceInformation.projectDir) {
		console.error(__('Missing project directory in config file'));
		process.exit(1);
	}
	if (!configFile.sourceInformation.sourceDir) {
		console.error(__('Missing source directory in config file'));
		process.exit(1);
	}
	if (!configFile.sourceInformation.entryPoint) {
		console.error(__('Missing entry point in config file'));
		process.exit(1);
	}

	// Validate the logging and finagle things around for outputs other than report
	if (configFile.logging && configFile.logging.file) {
		if (['trace', 'debug', 'info', 'notice', 'warn', 'error'].indexOf(configFile.logging.file.level) === -1) {
			console.error(__('Unknown log level "%s"', configFile.logging.file.level));
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
			console.error(__('Unknown log level "%s"', configFile.logging.console.level));
			process.exit(1);
		}
		logger.setLevel(configFile.logging.console.level);
	}

	// Validate the Alloy hook
	validateAlloyHook(configFile.sourceInformation.projectDir, logger, function () {

		if (!configFile.options) {
			configFile.options = {};
		}
		if (typeof configFile.options !== 'object' || Array.isArray(configFile.options)) {
			console.error(__('Config "options" entry must be an object'));
			process.exit(1);
		}

		if (!configFile.plugins) {
			configFile.plugins = [];
		}

		argv['project-dir'] = configFile.sourceInformation.projectDir;

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
						console.log('error', 'Could not find the specified SDK path "' + sdkPath + '"');
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
				console.log('error', 'Could not parse "' + path.join(configFile.plugins[i].path, 'package.json') + '": ' + e);
				process.exit(1);
			}
		}
		if (!cli.argv.platform) {
			argv.platform = 'iphone';
		}

		if (typeof configFile.plugins !== 'object' || !Array.isArray(configFile.plugins)) {
			console.error(__('Config "plugins" entry must be an array'));
			process.exit(1);
		}

		sourceInformation = configFile.sourceInformation;
		options = configFile.options;
		plugins = configFile.plugins;
		callback(true);
	});
}

function validateCLIParameters(logger, config, cli, callback) {

	var argv = cli.argv,
		projectRoot,
		entryPoint,
		sdk,
		i, len;

	// If the output isn't report, we want to suppress all output to the console. However, we want to keep the logger
	// around because we may be logging to a file
	if (argv.output !== 'report') {
		logger.remove(winston.transports.Console);
	}

	// Validate the project information
	ti.validateProjectDir(logger, cli, cli.argv, 'project-dir');
	ti.validateTiappXml(logger, cli.tiapp);

	// Note: we do custom SDK validation because the validateCorrectSDK method does a lot more than we need
	sdk = cli.tiapp['sdk-version'] || Object.keys(cli.env.sdks).sort().reverse()[0];

	// check the project's preferred sdk is even installed
	if (sdk == '__global__' || !cli.env.sdks[sdk]) {
		logger.banner();
		logger.error(__('Unable to analyze project because the "sdk-version" in the tiapp.xml is not installed') + '\n');
		logger.log(__('The project\'s %s is currently set to %s, which is not installed.', 'sdk-version'.cyan, sdk.cyan) + '\n');
		logger.log(__('Update the %s in the tiapp.xml to one of the installed Titaniums SDKs:', 'sdk-version'.cyan));
		Object.keys(cli.env.sdks).sort().forEach(function (ver) {
			if (ver != '__global__') {
				logger.log('    ' + ver.cyan);
			}
		});
		logger.log(__('or run "%s" to download and install Titanium SDK %s', ('titanium sdk install ' + sdk).cyan, sdk) + '\n');
		callback(false);
		return;
	}

	// Validate the platform
	ti.validatePlatform(logger, cli, 'platform');
	if (ti.validatePlatformOptions(logger, config, cli, 'analyze') === false) {
		callback(false);
		return;
	}

	// Load the project specific plugins
	ti.loadPlugins(logger, config, cli, cli.argv['project-dir'], function () {

		// Parse the config options
		options = {};
		options.invokeMethods = argv['method-invokation'] !== false;
		options.evaluateLoops = argv['loop-evaluation'] !== false;
		options.maxLoopIterations = parseInt(argv['max-loop-iterations'], 10);
		options.maxRecursionLimit = parseInt(argv['max-recursion-limit'], 10);
		options.cycleDetectionStackSize = parseInt(argv['cycle-detection-stack-size'], 10);
		options.maxCycles = parseInt(argv['max-cycles'], 10);
		options.logConsoleCalls = argv['console-passthrough'] !== false;
		options.executionTimeLimit = parseInt(argv['execution-time-limit'], 10);
		options.exactMode = argv['exact-mode'];
		options.nativeExceptionRecovery = argv['native-exception-recovery'] !== false;
		options.processUnvisitedCode = argv['process-unvisited-code'];
		options.resultsPath = argv['results-dir'];

		// Calculate the project root
		projectRoot = argv['project-dir'] || '.';
		sourceInformation = {};
		projectRoot = sourceInformation.projectDir = path.resolve(projectRoot);

		// Set the source information
		sourceInformation.sourceDir = path.join(projectRoot, 'Resources');
		entryPoint = sourceInformation.entryPoint = path.join(projectRoot, 'Resources', 'app.js');

		// Analyze the project
		logger.info('Analyzing project at "' + projectRoot + '"');
		validateAlloyHook(projectRoot, logger, function () {

			// Create the plugin info
			CodeProcessor.queryPlugins(config.paths && config.paths.codeProcessorPlugins || [],
					logger, function(err, results) {
				var modules = {},
					pluginList = argv.plugins,
					plugin,
					sdkPath,
					blacklistedFiles = [],
					p, m;

				plugins = [];
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

				// Load the ti module and CLI plugins
				sdkPath = cli.env.sdks[sdk].path;

				// Get the list of modules from the tiapp.xml
				if (!cli.tiapp.modules || !cli.tiapp.modules.length) {
					logger.info(__('No Titanium Modules required, continuing'));
				} else {
					logger.info(__n('Searching for %s Titanium Module', 'Searching for %s Titanium Modules', cli.tiapp.modules.length));
					appc.timodule.find(cli.tiapp.modules, argv.platform, 'development', sdk, [ path.join(sdkPath, '..', '..', '..'), projectRoot], logger, function (moduleResults) {
						if (moduleResults.missing.length) {
							logger.error(__('Could not find all required Titanium Modules:'));
							moduleResults.missing.forEach(function (m) {
								logger.error('   id: ' + m.id + '\t version: ' + (m.version || 'latest') + '\t platform: ' + m.platform + '\t deploy-type: ' + m.deployType);
							});
							logger.log();
							process.exit(1);
						}

						if (moduleResults.incompatible.length) {
							logger.error(__('Found incompatible Titanium Modules:'));
							moduleResults.incompatible.forEach(function (m) {
								logger.error('   id: ' + m.id + '\t version: ' + (m.version || 'latest') + '\t platform: ' + m.platform + '\t min sdk: ' + m.minsdk);
							});
							logger.log();
							process.exit(1);
						}

						if (moduleResults.conflict.length) {
							logger.error(__('Found conflicting Titanium modules:'));
							moduleResults.conflict.forEach(function (m) {
								logger.error('   ' + __('Titanium module "%s" requested for both ' + argv.platform + ' and CommonJS platforms, but only one may be used at a time.', m.id));
							});
							logger.log();
							process.exit(1);
						}

						moduleResults.found.forEach(function (module) {
							var platform = module.platform[0];
							if (!modules[platform]) {
								modules[platform] = {};
							}
							modules[platform][module.id] = module.modulePath;
						});
					});
				}

				// Create the file blacklist
				if (!DISABLE_BLACKLIST) {
					if (existsSync(path.join(projectRoot, 'app'))) {
						blacklistedFiles = blacklistedFiles.concat([
							path.join(projectRoot, 'Resources', 'alloy.js'),
							path.join(projectRoot, 'Resources', 'alloy', 'CFG.js'),
							path.join(projectRoot, 'Resources', 'alloy', 'widget.js'),
							path.join(projectRoot, 'Resources', 'alloy', 'backbone.js'),
							path.join(projectRoot, 'Resources', 'alloy', 'underscore.js'),
							path.join(projectRoot, 'Resources', 'alloy', 'sync', 'localStorage.js'),
							path.join(projectRoot, 'Resources', 'alloy', 'sync', 'properties.js'),
							path.join(projectRoot, 'Resources', 'alloy', 'sync', 'sql.js'),
							path.join(projectRoot, 'Resources', 'alloy', 'sync', 'util.js')
						]);
					}
					for (p in modules) {
						for (m in modules[p]) {
							if (modules[p][m]) {
								blacklistedFiles = blacklistedFiles.concat(CodeProcessorUtils.findJavaScriptFiles(modules[p][m]));
							}
						}
					}
				}
				options.blacklistedFiles = blacklistedFiles;

				// Set the plugin information
				for(i = 0, len = plugins.length; i < len; i++) {
					if (path.basename(plugins[i].path) === 'ti-api-provider') {
						plugins[i].options.platform = argv.platform;
						plugins[i].options.sdkPath = sdkPath;
						plugins[i].options.modules = modules;
						plugins[i].options.tiappProperties = cli.tiapp.properties;
					} else if (path.basename(plugins[i].path) === 'analysis-coverage') {
						plugins[i].options.visualization = {
							outputDirectory: options.resultsPath ? path.join(options.resultsPath, 'analysis-coverage') : undefined
						};
						plugins[i].options.analyzeBlacklistedFiles = VISUALIZE_BLACKLISTED_FILES;
					} else if (path.basename(plugins[i].path) === 'unknown-ambiguous-visualizer') {
						plugins[i].options.visualization = {
							outputDirectory: options.resultsPath ? path.join(options.resultsPath, 'unknown-ambiguous-visualizer') : undefined
						};
						plugins[i].options.analyzeBlacklistedFiles = VISUALIZE_BLACKLISTED_FILES;
					}
				}

				// Check if this is an alloy app
				if (existsSync(path.join(projectRoot, 'app'))) {
					sourceInformation.sourceMapDir = path.join(projectRoot, 'build', 'map', 'Resources');
					sourceInformation.originalSourceDir = path.join(projectRoot, 'app');
				}

				// Tell the CLI we are done
				callback(true);
			});
		});
	});
}