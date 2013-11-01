/**
 * <p>Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * require implementation
 *
 * @module plugins/TiAPIProcessor
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var path = require('path'),
	fs = require('fs'),

	Base = require(path.join(global.titaniumCodeProcessorLibDir, 'Base')),
	Runtime = require(path.join(global.titaniumCodeProcessorLibDir, 'Runtime')),
	AST = require(path.join(global.titaniumCodeProcessorLibDir, 'AST')),
	RuleProcessor = require(path.join(global.titaniumCodeProcessorLibDir, 'RuleProcessor')),

	pluginRegExp = /^(.+?)\!(.*)$/,
	fileRegExp = /\.js$/,

	platform,
	modules,
	cache,
	platformList;

exports.getOverrides = function (options) {

	if (options.globalsOnly) {
		return [];
	}

	// Validate the module paths
	(function () {
		var platform,
			entry,
			modulePath,
			errors;
		if (options.modules) {
			for (platform in options.modules) {
				for (entry in options.modules[platform]) {
					modulePath = options.modules[platform][entry];
					if (modulePath && !fs.existsSync(modulePath)) {
						console.error('Module "' + entry + '" for platform "' + platform + '" could not be found at "' + modulePath + '"');
						errors = true;
					}
				}
			}
		}
		if (errors) {
			process.exit(1);
		}
	})();

	Runtime.on('fileListSet', function(e) {
		var platformSpecificFiles = {},
			genericFiles = {},
			fileList = e.data.fileList,
			file,
			leadSegment,
			i, len,
			baseDir = Runtime.sourceInformation.sourceDir;
		for (i = 0, len = fileList.length; i < len; i++) {
			file = path.relative(baseDir, fileList[i]).split(path.sep);
			leadSegment = file[0];
			if (platformList.indexOf(leadSegment) !== -1) {
				file.splice(0, 1);
				if (leadSegment === platform) {
					platformSpecificFiles[file.join(path.sep)] = 1;
				}
			} else {
				genericFiles[file.join(path.sep)] = 1;
			}
		}
		for (i in platformSpecificFiles) {
			if (i in genericFiles) {
				delete genericFiles[i];
			}
		}
		fileList = Object.keys(genericFiles);
		for (i in platformSpecificFiles) {
			fileList.push(path.join(platform, i));
		}
		for (i = 0, len = fileList.length; i < len; i++) {
			fileList[i] = path.join(baseDir, fileList[i]);
		}
		Runtime.fileList = fileList;
	});

	Runtime.isFileValid = function isFileValid(filename) {
		var rootDir = filename.split(path.sep)[0];
		return fileRegExp.test(filename) && (platformList.indexOf(rootDir) === -1 || rootDir === platform);
	};

	platform = options && options.platform;
	platformList = options && options.platformList;
	modules = options && options.modules || {};
	cache = {};

	return [{
		regex: /^require$/,
		callFunction: function callFunction(thisVal, args) {
			// Validate and parse the args
			var name = args && Base.getValue(args[0]),
				filePath,
				moduleInfo,
				result = new Base.UnknownType(),
				isModule,
				eventDescription;

			if (!name) {
				name = new Base.UndefinedType();
			}

			name = Base.toString(name);
			if (Base.type(name) !== 'String') {
				eventDescription = 'A value that could not be evaluated was passed to require';
				Runtime.fireEvent('requireUnresolved', eventDescription);
				Runtime.reportWarning('requireUnresolved', eventDescription);
				return result;
			}
			name = name.value;
			this._location = undefined;
			this._ast = undefined;
			if (pluginRegExp.test(name) || name.indexOf(':') !== -1) {
				Runtime.fireEvent('requireUnresolved',
					'Plugins and URLS can not be evaluated at compile-time and will be deferred until runtime.', {
						name: name
				});
			} else {

				// Determine if this is a Titanium module
				if (modules.commonjs && modules.commonjs.hasOwnProperty(name)) {
					isModule = true;
					filePath = modules.commonjs[name];
					moduleInfo = require(path.join(filePath, 'package.json'));
					filePath = path.join(filePath, moduleInfo.main + '.js');
				} else if (['ios', 'iphone', 'ipad'].indexOf(platform) !== -1) { // iOS requires special handling
					isModule = (modules.iphone && modules.iphone.hasOwnProperty(name)) ||
						(modules.ipad && modules.ipad.hasOwnProperty(name));
				} else if (modules[platform] && modules[platform].hasOwnProperty(name)) {
					isModule = true;
				}

				if (name == 'ti.cloud') {
					result = options.cloudModules.cloud;
				} else if(name == 'ti.cloudpush') {
					result = options.cloudModules.cloudPush;
				} else if (isModule) {
					if (filePath) {
						Runtime.fireEvent('requireResolved', 'Module "' + name + '" was resolved to "' + filePath + '"', {
							name: name,
							path: filePath
						});
						if (cache[filePath]) {
							result = cache[filePath];
						} else {
							result = processFile.call(this, filePath, true);
							cache[filePath] = result;
						}
					} else {
						Runtime.fireEvent('requireSkipped',
							'Native modules cannot be evaluated by the Titanium Code Processor', {
								name: name
						});
					}
				} else {

					// Resolve the path
					isModule = !name.match(fileRegExp); // I kinda hate this, but there are too many incorrect usages of require in the wild to implement the spec correctly
					if (name[0] === '.') {
						filePath = path.resolve(path.join(path.dirname(Runtime.getCurrentLocation().filename), name));
						filePath += isModule ? '.js' : '';
					} else {
						filePath = path.resolve(path.join(Runtime.sourceInformation.sourceDir, platform, name));
						filePath += isModule ? '.js' : '';
						if (!fs.existsSync(filePath)) {
							filePath = path.resolve(path.join(Runtime.sourceInformation.sourceDir, name));
							filePath += isModule ? '.js' : '';
						}
					}

					// Make sure that the file exists and then process it
					if (Runtime.fileList.indexOf(filePath) !== -1) {
						if (cache[filePath]) {
							result = cache[filePath];
						} else {
							Runtime.fireEvent('requireResolved', 'Module "' + name + '" was resolved to "' + filePath + '"', {
								name: name,
								path: filePath
							});
							result = processFile.call(this, filePath, isModule);
							cache[filePath] = result;
						}
						this._location = {
							filename: filePath,
							line: 1,
							column: 1
						};
					} else {
						eventDescription = 'The module "' + name + '" could not be found';
						Runtime.fireEvent('requireMissing', eventDescription, {
							name: name,
							path: filePath
						});
						Runtime.reportError('RequireMissing', eventDescription);
					}
				}
			}
			return result;
		}
	}];
};

// ******** Helper Methods ********

/**
 * @private
 */
function processFile(filename, createExports) {

	var root,
		results,
		context;

	// Make sure the file exists and that the blacklist isn't supposed to keep it from being processed
	if (fs.existsSync(filename)) {

		if(Runtime.isFileBlacklisted(filename) && Base.isSkippedMode()) {
			results = new Base.UnknownType();
		} else {

			// Fire the parsing begin event
			Runtime.fireEvent('enteredFile', 'Entering file "' + filename + '"', {
				filename: filename
			});

			// Read in the file and generate the AST
			root = AST.parse(filename);
			if (!root.syntaxError) {

				// Create the context, checking for strict mode
				context = Base.createModuleContext(root, RuleProcessor.isBlockStrict(root), createExports, false);

				// Process the code
				results = root.processRule()[1];
				Base.exitContext();

				// Exit the context and get the results
				if (createExports) {
					results = Base.type(context.thisBinding) === 'Unknown' ? new Base.UnknownType() : context.thisBinding.get('exports');
				}
			} else {
				Runtime.reportUglifyError(root);
				results = new Base.UnknownType();
			}
			this._ast = root;
		}
	} else {
		throw new Error('Internal Error: could not find file "' + filename + '"');
	}
	return results;
}