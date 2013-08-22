/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Hook for CLI integration with the build system
 *
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var path = require('path'),
	CodeProcessor = require(path.resolve(path.join(__dirname, '..')));

exports.cliVersion = '>=3.X';
exports.init = function init(logger, config, cli, appc) {

	cli.addHook('build.pre.compile', function (build, finished) {
		if (cli.tiapp['code-processor'] && cli.tiapp['code-processor'].enabled) {
			var codeProcessorPluginDir = path.resolve(path.join(global.titaniumCodeProcessorLibDir, '..', 'plugins')),
				parsedModules = {},
				moduleSearchPaths,
				platform = cli.argv.platform;

			moduleSearchPaths = [ cli.argv['project-dir'], appc.fs.resolvePath(path.join(__dirname, '..', '..')) ];
			if (config.paths && Array.isArray(config.paths.modules)) {
				moduleSearchPaths = moduleSearchPaths.concat(config.paths.modules);
			}

			// Get the list of modules
			parsedModules.commonjs = {};
			parsedModules[platform] = {};
			appc.timodule.find(cli.tiapp.modules, cli.argv.$originalPlatform !== platform ?
					[ cli.argv.$originalPlatform, platform ] : platform,
					cli.argv['deploy-type'] || 'development', cli.tiapp['sdk-version'], moduleSearchPaths, logger, function (modules) {
				modules.found.forEach(function (module) {
					if (module.platform.indexOf(platform) !== -1) {
						parsedModules[platform][module.id] = null;
					} else if (module.platform.indexOf('commonjs') !== -1) {
						parsedModules.commonjs[module.id] = module.modulePath;
					}
				});

				// Run the code processor
				CodeProcessor.run(
					appc.fs.resolvePath(path.join(cli.argv['project-dir'], 'Resources', 'app.js')),
					appc.util.mix({
						invokeMethods: true,
						evaluateLoops: true,
						processUnvisitedCode: true,
						suppressResults: true,
						logConsoleCalls: false,
					}, cli.tiapp['code-processor'].options),
					[
						{
							path: path.join(codeProcessorPluginDir, 'ti-api-provider'),
							options: {
								sdkPath: cli.sdk.path,
								platform: cli.argv.platform,
								modules: parsedModules
							}
						},
						{
							path: path.join(codeProcessorPluginDir, 'ti-api-platform-validator'),
							options: {}
						},
						{
							path: path.join(codeProcessorPluginDir, 'ti-api-usage-finder'),
							options: {}
						},
						{
							path: path.join(codeProcessorPluginDir, 'ti-api-deprecation-finder'),
							options: {}
						}
					],
					logger, function() {

						// Parse the results
						var codeProcessorResults = CodeProcessor.getResults(),
							errors = codeProcessorResults.errors,
							warnings = codeProcessorResults.warnings,
							data,
							i, len;
						for(i = 0, len = errors.length; i < len; i++) {
							data = errors[i];
							logger.error('Titanium Code Processor error: ' + data.description + ' (' + data.file + ':' + data.line + ':' + data.column + ')');
						}
						for(i = 0, len = warnings.length; i < len; i++) {
							data = warnings[i];
							logger.warn('Titanium Code Processor warning: ' + data.description + ' (' + data.file + ':' + data.line + ':' + data.column + ')');
						}
						if (errors.length) {
							logger.warn('The Titanium Code Processor detected errors in the project, results will be discarded');
						} else {
							cli.codeProcessor = codeProcessorResults;
						}

						// Continue building the project
						finished();
					});
			});
		} else {
			finished();
		}
	});
};
