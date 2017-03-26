'use strict';
function Connector() {
}

Connector.prototype.open = function(port, options, callback) {
	var serialport = require('../../serialport');

	// options
	var _options = {};
	_options.autoOpen = options.autoOpen || options.AutoOpen || true;
	_options.baudRate = options.baudRate || options.baudrate || 9600;
	_options.parity = options.parity || 'none';
	_options.dataBits = options.dataBits || options.databits || 8;
	_options.stopBits = options.stopBits || options.stopbits || 1;
	_options.bufferSize = options.bufferSize || options.buffersize || 65536;
	if(options.delimiter) {
		_options.parser = serialport.parsers.readline(options.delimiter);
	}
	var flowcontrol = options.flowControl || options.flowcontrol;
	if(flowcontrol === 'hardware') {
		_options.flowControl = true;
	} else if(flowcontrol === 'software') {
		_options.flowControl = ['XON', 'XOFF'];
	}

	var sp = new serialport.SerialPort(port, _options);
	this.sp = sp;
	sp.on('error', function(error) {
		console.error(error);
		if(callback) {
			callback(error);
		}
	});
	sp.on('open', function(error) {
		sp.removeAllListeners('open');
		if(callback) {
			callback(error, sp);
		}
	});
};

Connector.prototype.connect = function(extension, callback) {
	console.log('connect!');
	if(extension.connect) {
		extension.connect();
	}
	var self = this;
	if(self.sp) {
		self.connected = false;
		self.received = true;
		var sp = self.sp;
		callback('connect');
		if(extension.afterConnect) {
			extension.afterConnect(self, callback);
		}
		sp.on('data', function(data) {
			var valid = true;
			if(extension.validateLocalData) {
				valid = extension.validateLocalData(data);
			}
			if(valid) {
				if(self.connected == false) {
					self.connected = true;
					if(callback) {
						callback('connected');
					}
				}
				self.received = true;
				if(callback) {
					callback(null, data);
				}
			}
		});
		sp.on('disconnect', function() {
			self.close();
			if(callback) {
				callback('disconnected');
			}
		});
		if(extension.lostController) {
			extension.lostController(self, callback);
		} else {
			self.timer = setInterval(function() {
				if(self.connected) {
					if(self.received == false) {
						self.connected = false;
						if(callback) {
							callback('lost');
						}
					}
					self.received = false;
				}
			}, 500);
		}
	}
};

Connector.prototype.clear = function() {
	this.connected = false;
	if(this.timer) {
		clearInterval(this.timer);
		this.timer = undefined;
	}
	if(this.sp) {
		this.sp.removeAllListeners();
	}
};

Connector.prototype.close = function() {
	var self = this;
	this.clear();
	if(this.sp) {
		if(this.sp.isOpen()) {
			this.sp.close(function (e) {
				self.sp = undefined;
			});
		}
	}
};

Connector.prototype.send = function(data, callback) {
	var that = this;
	if(this.sp && this.sp.isOpen() && data && !this.sp.isSending) {
		this.sp.isSending = true;
		this.sp.write(data, function () {
			if(that.sp) {
				that.sp.drain(function () {
					that.sp.isSending = false;
					if(callback){
						callback();
					}
				});
			}
		});
	}
};

module.exports.create = function() {
	return new Connector();
};
