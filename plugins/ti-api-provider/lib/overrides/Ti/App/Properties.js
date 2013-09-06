/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Ti.App.Properties implementation
 *
 * @module plugins/TiAPIProcessor
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var path = require('path'),
	Runtime = require(path.join(global.titaniumCodeProcessorLibDir, 'Runtime')),
	Base = require(path.join(global.titaniumCodeProcessorLibDir, 'Base'));

exports.getOverrides = function (options) {
	if (options.globalsOnly) {
		return [];
	}
	var tiappProperties = options.tiappProperties,
		setProperty = Base.wrapNativeCall(function setProperty(thisVal, args) {
			var name = Base.toString(args[0]);
			if (Base.type(name) != 'Unknown') {
				name = name.value;
				if (tiappProperties.hasOwnProperty(name)) {
					delete tiappProperties[name];
					Runtime.reportWarning('tiappPropertyInvalidated', 'Property "' + name +
						'" specified Tiapp.xml was overwritten, the value of this property cannot be guaranteed');
				}
			}
			return new Base.UndefinedType();
		}),
		p;

	function createGetFunction(type) {
		return Base.wrapNativeCall(function getProperty(thisVal, args) {
			var name = Base.toString(args[0]);
			if (Base.type(name) == 'Unknown') {
				return new Base.UnknownType();
			}
			name = name.value;
			if (!tiappProperties[name]) {
				return new Base.UnknownType();
			} else if (tiappProperties[name].type != type) {
				return new Base.UndefinedType();
			} else {
				return tiappProperties[name];
			}
		});
	}

	for (p in tiappProperties) {
		switch(tiappProperties[p].type) {
			case 'string':
				tiappProperties[p].value = new Base.StringType(tiappProperties[p].value);
				break;
			case 'bool':
				tiappProperties[p].value = new Base.BooleanType(tiappProperties[p].value);
				break;
			case 'int':
			case 'double':
				tiappProperties[p].value = new Base.NumberType(tiappProperties[p].value);
				break;
			default:
				Runtime.reportWarning('invalidTiappPropertyType', 'Invalid tiapp.xml property type "' + tiappProperties[p].type + '"');
				delete tiappProperties[p];
		}
	}

	return [{
		regex: /^Titanium\.App\.getBool$/,
		callFunction: createGetFunction('bool')
	},{
		regex: /^Titanium\.App\.getDouble$/,
		callFunction: createGetFunction('double')
	},{
		regex: /^Titanium\.App\.getInt$/,
		callFunction: createGetFunction('int')
	},{
		regex: /^Titanium\.App\.getString$/,
		callFunction: createGetFunction('string')
	},{
		regex: /^Titanium\.App\.hasProperty$/,
		callFunction: Base.wrapNativeCall(function callFunction(thisVal, args) {
			var name = Base.toString(args[0]);
			if (Base.type(name) == 'Unknown') {
				return new Base.UnknownType();
			}
			name = name.value;
			return tiappProperties[name] ? new Base.BooleanType(true) : new Base.UnknownType();
		})
	},{
		regex: /^Titanium\.App\.removeProperty$/,
		callFunction: Base.wrapNativeCall(function callFunction(thisVal, args) {
			var name = Base.toString(args[0]);
			if (Base.type(name) != 'Unknown') {
				name = name.value;
				if (tiappProperties.hasOwnProperty(name)) {
					delete tiappProperties[name];
					Runtime.reportWarning('tiappPropertyInvalidated', 'Property "' + name +
						'" specified Tiapp.xml was removed, the value of this property cannot be guaranteed');
				}
			}
			return new Base.UndefinedType();
		})
	},{
		regex: /^Titanium\.App\.setBool$/,
		callFunction: setProperty
	},{
		regex: /^Titanium\.App\.setDouble$/,
		callFunction: setProperty
	},{
		regex: /^Titanium\.App\.setInt$/,
		callFunction: setProperty
	},{
		regex: /^Titanium\.App\.setString$/,
		callFunction: setProperty
	}];
};