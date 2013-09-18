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

	Base = require(path.join(global.titaniumCodeProcessorLibDir, 'Base')),
	Runtime = require(path.join(global.titaniumCodeProcessorLibDir, 'Runtime'));

exports.getOverrides = function (options) {
	if (options.globalsOnly) {
		return [];
	}
	return [{
		regex: /^Titanium\.version$/,
		value: new Base.StringType(options.manifest.version)
	},{
		regex: /^Titanium.*\.create([a-zA-Z0-9_]*)$/,
		callFunction: Base.wrapNativeCall(function callFunction(thisVal, args) {
			var returnType,
				root = options.api,
				i, j, len,
				value = new Base.UnknownType(),
				callArgs,
				props = args && args[0] && Base.type(args[0]) === 'Object' && args[0],
				propNames;
			args = args || [];
			for (i = 0, len = args.length; i < len; i++) {
				if (Base.type(args[i]) !== 'Unknown') {
					if (Base.isCallable(args[i])) {
						callArgs = [];
						for (j = 0; j < args[i].get('length').value; j++) {
							callArgs[j] = new Base.UnknownType();
						}
						Runtime.queueFunction(args[i], new Base.UndefinedType(), callArgs, true, Base.isSkippedMode());
					}
				} else if (this._api.parameters[i] && this._api.parameters[i].type === 'Function') {
					Runtime.fireEvent('unknownCallback', 'An unknown value was passed to ' + this._apiName +
						'. Some source code may not be analyzed.');
				}
			}
			if (this._returnTypes && this._returnTypes.length === 1) {
				returnType = this._returnTypes[0].type.split('.');
				for (i = 0, len = returnType.length; i < len; i++) {
					root = root && root.children[returnType[i]];
				}
				if (root && root.node) {
					value = options.createObject(root);
					Runtime.fireEvent('tiPropertyReferenced', 'Property "' + this._returnTypes[0].type + '" was referenced', {
						name: this._returnTypes[0].type,
						node: root.node
					});
					if (props) {
						propNames = props._getPropertyNames();
						for (i = 0, len = propNames.length; i < len; i++) {
							value.defineOwnProperty(propNames[i], props.getOwnProperty(propNames[i], true));
						}
					}
				} else {
					Runtime.fireEvent('nonTiPropertyReference', 'Property "' + this._returnTypes[0].type + '" was referenced but is not part of the API', {
						name: this._returnTypes[0].type
					});
				}
				return value;
			} else {
				return new Base.UnknownType();
			}
		})
	},{
		regex: /^Titanium\.include$/,
		callFunction: function callFunction(thisVal, args) {
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

			this._location = undefined;
			this._ast = undefined;
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
					filePath = path.resolve(path.join(Runtime.sourceInformation.sourceDir, options.platform, filename));
					if (!fs.existsSync(filePath)) {
						filePath = path.resolve(path.join(Runtime.sourceInformation.sourceDir, filename));
					}
				}

				// Make sure the file exists
				if (fs.existsSync(filePath)) {

					Runtime.fireEvent('tiIncludeResolved', 'The Ti.include path "' + filePath + '" was resolved', {
						name: filename,
						path: filePath
					});

					// Fire the parsing begin event
					Runtime.fireEvent('enteredFile', 'Processing is beginning for file "' + filePath + '"', {
						filename: filePath
					});

					// Eval the code
					evalFunc = Base.getGlobalObject().get('eval');
					evalFunc.callFunction(thisVal, [new Base.StringType(fs.readFileSync(filePath).toString())], true, filePath);

					this._location = {
						filename: filePath,
						line: 1,
						column: 1
					};

				} else {
					eventDescription = 'The Ti.include path "' + filename + '" could not be found';
					Runtime.fireEvent('tiIncludeMissing', eventDescription, {
						name: filename
					});
					Runtime.reportError('tiIncludeMissing', eventDescription);
				}
			}.bind(this));
			return new Base.UndefinedType();
		}
	}];
};