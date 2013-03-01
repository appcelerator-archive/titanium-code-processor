/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Ti.include implementation
 *
 * @module plugins/TiAPIProcessor
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var fs = require('fs'),
	path = require('path'),
	existsSync = fs.existsSync || path.existsSync,

	Base = require(path.join(global.titaniumCodeProcessorLibDir, 'Base')),
	Runtime = require(path.join(global.titaniumCodeProcessorLibDir, 'Runtime'));

exports.init = function (options) {
	return {
		regex: /^Titanium\.include$/,
		call: function call(thisVal, args) {
			var files = [],
				filePath,
				evalFunc,
				result = new Base.UnknownType(),
				i, len,
				eventDescription;

			args = args || [];
			for (i = 0, len = args.length; i < len; i++) {
				files.push(Base.getValue(args[i]));
			}

			files.forEach(function (filename) {
				filename = Base.toString(filename);
				if (Base.type(filename) !== 'String') {
					eventDescription = 'A value that could not be evaluated was passed to Ti.include';
					Runtime.fireEvent('tiIncludeUnresolved', eventDescription);
					Runtime.reportWarning('tiIncludeUnresolved', eventDescription);
					return result;
				}
				filename = filename.value;

				if (filename[0] === '.') {
					filePath = path.resolve(path.join(path.dirname(Runtime.getCurrentLocation().filename), filename));
				} else {
					filePath = path.resolve(path.join(path.dirname(Runtime.getEntryPointFile()), options.platform, filename));
					if (!existsSync(filePath)) {
						filePath = path.resolve(path.join(path.dirname(Runtime.getEntryPointFile()), filename));
					}
				}

				// Make sure the file exists
				if (existsSync(filePath)) {

					Runtime.fireEvent('tiIncludeResolved', 'The Ti.include path "' + filePath + '" was resolved', {
						name: filename,
						path: filePath
					});

					// Fire the parsing begin event
					Runtime.fireEvent('enteredFile', 'Processing is beginning for file "' + filePath + '"', {
						filename: filePath
					});

					// Eval the code
					evalFunc = Runtime.getGlobalObject().get('eval');
					evalFunc.call(thisVal, [new Base.StringType(fs.readFileSync(filePath).toString())], false, filePath);

				} else {
					eventDescription = 'The Ti.include path "' + filename + '" could not be found';
					Runtime.fireEvent('tiIncludeMissing', eventDescription, {
						name: filename
					});
					Runtime.reportError('tiIncludeMissing', eventDescription, {
						name: filename
					});
				}
			});
			return new Base.UndefinedType();
		}
	};
};