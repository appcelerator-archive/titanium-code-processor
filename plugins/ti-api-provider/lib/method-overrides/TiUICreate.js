/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Ti.UI.createXXX implementation
 *
 * @module plugins/TiAPIProcessor
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var path = require('path'),

	Base = require(path.join(global.titaniumCodeProcessorLibDir, 'Base')),
	Runtime = require(path.join(global.titaniumCodeProcessorLibDir, 'Runtime'));

exports.init = function (options) {
	return {
		regex: /^Titanium\.UI\.create([a-zA-Z0-9_]*)$/,
		call: function call(thisVal, args) {
			var returnType,
				root = options.api,
				i, j, len,
				value = new Base.UnknownType(),
				callArgs,
				props = args && args[0] && Base.type(args[0]) === 'Object' && args[0],
				propNames;
			args = args || [];
			for(i = 0, len = args.length; i < len; i++) {
				if (Base.type(args[i]) !== 'Unknown') {
					if (Base.isCallable(args[i])) {
						callArgs = [];
						for(j = 0; j < args[i].get('length').value; j++) {
							callArgs[j] = new Base.UnknownType();
						}
						Runtime.queueFunction(args[i], new Base.UndefinedType(), callArgs, true);
					}
				} else if (this._api.parameters[i] && this._api.parameters[i].type === 'Function') {
					Runtime.fireEvent('unknownCallback', 'An unknown value was passed to ' + this._apiName +
						'. Some source code may not be analyzed.');
				}
			}
			if (this._returnTypes && this._returnTypes.length === 1) {
				returnType = this._returnTypes[0].type.split('.');
				for(i = 0, len = returnType.length; i < len; i++) {
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
		}
	};
};