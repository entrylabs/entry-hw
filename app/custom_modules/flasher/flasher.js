'use strict';
var exec = require('child_process').exec;
var path = require('path');
var fs = require('fs');
var platform = process.platform;

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
		var avrName;
		var avrConf;
		var portPrefix;
		switch(platform) {
			case 'darwin': 
				avrName = './avrdude';
				avrConf = './avrdude-osx.conf';
				portPrefix = '';
				break;
			default :
				avrName = 'avrdude.exe';
				avrConf = './avrdude.conf';
				portPrefix = '\\\\.\\';
				break;
		}
		var cmd = [avrName, ' -p m328p -P', portPrefix, port, ' -b', rate, ' -Uflash:w:\"', firmware, '.hex\":i -C', avrConf, ' -carduino -D'];
		
		exec(
			cmd.join(''),
			{
				cwd: path.resolve(appPath, 'flasher')
			},
			callBack
		);		
	}
};

module.exports = Module;