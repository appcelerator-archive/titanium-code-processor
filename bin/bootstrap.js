#!/usr/bin/env node
/**
 * <p>Copyright (c) 2012 by Appcelerator, Inc. All Rights Reserved.
 * Please see the LICENSE file for information about licensing.</p>
 *
 * Bootstraps the main binary file to provide some extra development-only usage
 *
 * @author Bryan Hughes &lt;<a href='mailto:bhughes@appcelerator.com'>bhughes@appcelerator.com</a>&gt;
 */

var path = require('path'),
	debugIndex = process.argv.indexOf('-d'),
	debug = false,
	spawn = require('child_process').spawn,
	cmd = [];

if (debugIndex !== -1) {
	process.argv.splice(debugIndex, 1);
	debug = true;
	cmd.push('--debug-brk');
}
process.argv.splice(0, 2);
cmd = cmd.concat(['--stack-size=10000', path.resolve(path.join(__dirname, 'codeprocessor'))], process.argv);
spawn(path.join(__dirname, 'assemblebase')).on('exit', function () {
	spawn('node', cmd, {
		stdio: 'inherit'
	});
});