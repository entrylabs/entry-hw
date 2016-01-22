'use strict';
var exec = require('child_process').exec;

var Module = {
	flash : function(firmware, port, baudRate, callBack) {
		var rate = baudRate || '115200';
		var cmd = 'avr.exe -p m328p -P\\\\.\\' +
			port +
			' -b' + rate + ' -Uflash:w:\"' +
			firmware +
			'.hex\":i -C./avrdude.conf -carduino -D';
		exec(
			cmd,
			{
				cwd: './node_modules/flasher'
			},
			callBack
		);
	}
};

module.exports = Module;