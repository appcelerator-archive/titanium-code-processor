#!/usr/bin/env node

var fs = require('fs'),
	path = require('path'),
	wrench = require('wrench'),
	spawn = require('child_process').spawn,
	codeProcessorDir = path.resolve(path.join(__dirname, 'titanium-code-processor')),
	directoryQueue = [
		path.join(codeProcessorDir, 'lib'), 
		path.join(codeProcessorDir, 'plugins')
	],
	fileList = [];

process.chdir(path.join(__dirname, 'jsdoc'));

if (fs.existsSync(path.join(codeProcessorDir, 'docs'))) {
	wrench.rmdirSyncRecursive(path.join(codeProcessorDir, 'docs'));
}

spawn(path.join(codeProcessorDir, 'bin', 'assemblebase')).on('exit', function () {
	
	while(directoryQueue.length) {
		var dir = directoryQueue.pop(),
			files = fs.readdirSync(dir), file,
			i = 0, len = files.length;
		if (dir !== path.join(codeProcessorDir, 'lib', 'base')) {
			for(; i < len; i++) {
				file = path.join(dir,files[i]);
				if (fs.statSync(file).isDirectory()) {
					directoryQueue.push(file);
				} else if (file.match(/.js$/)) {
					fileList.push(file);
				}
			}
		}
	}
	fileList.push(path.join(codeProcessorDir, 'api_cover_page.md'));

	spawn('./jsdoc', ['--verbose', '--destination', path.join(codeProcessorDir, 'docs')].concat(fileList), {
		stdio: 'inherit'
	});
});