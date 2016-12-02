'use strict';
var exec = require('child_process').exec;
var path = require('path');
var fs = require('fs');

var copyRecursiveSync = function(src, dest) {
	var exists = fs.existsSync(src);
	var stats = exists && fs.statSync(src);
	var isDirectory = exists && stats.isDirectory();
	if (exists && isDirectory) {
		if(!fs.existsSync(dest)) {
			fs.mkdirSync(dest);
		}
		fs.readdirSync(src).forEach(function(childItemName) {
			copyRecursiveSync(path.join(src, childItemName),
			            path.join(dest, childItemName));
		});
	} else {
		var data = fs.readFileSync(src);
		fs.writeFileSync(dest, data);
	}
};

var Module = {
	flash : function(firmware, port, baudRate, callBack) {
		var appPath = '';
		if(__dirname.indexOf('app.asar') >= 0) {
			var asarPath = __dirname;
			copyRecursiveSync(asarPath, path.join(__dirname, '..', '..', '..', 'flasher'));
			appPath = path.join(__dirname, '..', '..', '..');
		} else {
			appPath = path.join(__dirname, '..');
		}

		var rate = baudRate || '115200';
		var cmd = 'avr.exe -p m328p -P\\\\.\\' +
			port +
			' -b' + rate + ' -Uflash:w:\"' +
			firmware +
			'.hex\":i -C./avrdude.conf -carduino -D';
		
		exec(
			cmd,
			{
				cwd: path.resolve(appPath, 'flasher')
			},
			callBack
		);		
	}
};

module.exports = Module;