/**
 * Appcelerator Common Library for Node.js
 * Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.
 */

var path = require('path'),
	fs = require('fs'),
	vsprintf = require('sprintf').vsprintf,
	locale,
	providers = {};

try {
	locale = JSON.parse(fs.readFileSync(path.join(process.env[process.platform == 'win32' ? 'USERPROFILE' : 'HOME'], '.titanium', 'config.json'))).user.locale;
} catch(e) {
	locale = 'en-us';
}

module.exports = function (dirname) {
	
	var localesDir,
		initialDir = dirname;
	while (dirname.split(path.sep)[1]) {
		if (~fs.readdirSync(dirname).indexOf('locales')) {
			localesDir = path.join(dirname, 'locales');
			break;
		}
		dirname = path.resolve(path.join(dirname, '..'));
	}
	if (!localesDir) {
		return new i18n();
	}
	if (!providers[localesDir]) {
		providers[localesDir] = new i18n(localesDir);
	}
	return providers[localesDir];
};

module.exports.getLocale = function() {
	return locale;
}

function i18n(localesDir) {
	
	if (localesDir) {
		var localeFilePath = path.join(localesDir, locale + '.js');
		try {
			if (fs.existsSync(localeFilePath)) {
				this.localeData = JSON.parse(fs.readFileSync(localeFilePath));
			} else {
				localeFilePath = path.join(localesDir, locale.split('-')[0] + '.js');
				this.localeData = JSON.parse(fs.readFileSync(localeFilePath));
			}
		} catch(e) {
			this.localeData = {};
		}
	} else {
		this.localeData = {};
	}
	
	this.__ = function (message) {
		if (this.localeData) {
			return vsprintf(this.localeData[message] || message, Array.prototype.slice.call(arguments, 1));
		} else {
			console.log('early ' + message);
			return vsprintf(message, Array.prototype.slice.call(arguments, 1));
		}
	}.bind(this);
	
	this.__n = function(singularMessage, pluralMessage, count) {
		if (this.localeData) {
			var message = this.localeData[singularMessage];
			if (parseInt(count, 10) > 1) {
				message = vsprintf(message ? message.other : pluralMessage, [count]);
			} else {
				message = vsprintf(message ? message.one : singularMessage, [count]);
			}
			return vsprintf(message, Array.prototype.slice.call(arguments, 3));
		} else {
			return vsprintf(parseInt(count, 10) > 1 ? pluralMessage : singularMessage, Array.prototype.slice.call(arguments, 3));
		}
	}.bind(this);
}