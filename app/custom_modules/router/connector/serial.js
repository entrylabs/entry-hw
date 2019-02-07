'use strict';
const Readline = require('@serialport/parser-readline'); // modify

function Connector() {
}

Connector.prototype.open = function(port, options, callback) {
	var serialport = require('@serialport/stream'); // modify
	serialport.Binding = require('@entrylabs/bindings');
	this.options = options; // modify

	this.lostTimer = options.lostTimer || 500;
	// options
	var _options = {};
	_options.autoOpen = options.autoOpen || options.AutoOpen || true;
	_options.baudRate = options.baudRate || options.baudrate || 9600;
	_options.parity = options.parity || 'none';
	_options.dataBits = options.dataBits || options.databits || 8;
	_options.stopBits = options.stopBits || options.stopbits || 1;
	_options.bufferSize = options.bufferSize || options.buffersize || 65536;

	// modify start
	//	if(options.delimiter) {
	//		_options.parser = serialport.parsers.readline(options.delimiter, options.encoding);
	//	} else if(options.byteDelimiter) {
	//		_options.parser = serialport.parsers.byteDelimiter(options.byteDelimiter);
	//	}
	// modify end

	var flowcontrol = options.flowControl || options.flowcontrol;
	if(flowcontrol === 'hardware') {
		//_options.flowControl = true;
		_options.rtscts = true; // modify
	} else if(flowcontrol === 'software') {
		_options.flowControl = ['XON', 'XOFF'];
	}

	var sp = new serialport(port, _options); // modify serialport.SerialPort --> serialport
	this.sp = sp;

	// modify start
	if(options.delimiter) {
		//_options.parser = serialport.parsers.readline(options.delimiter, options.encoding);
		sp.parser = sp.pipe(new Readline(options));
	} else if(options.byteDelimiter) {
		_options.parser = serialport.parsers.byteDelimiter(options.byteDelimiter);
	}
	// modify end

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

		// modify start
		var source = sp;
		if(self.options.delimiter) {
			source = sp.parser = sp.pipe(new Readline(self.options));
		}
		source.on('data', function(data) {
			// modify end
			// modify start
			if(self.options.stream == 'string') {
				data = data.toString();
			}
			// modify end

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
			}, this.lostTimer);
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

		// modify start
		if(this.sp.parser) {
			this.sp.parser.removeAllListeners();
		}
		// modify end
	}
};

Connector.prototype.close = function() {
	var self = this;
	this.clear();
	if(this.sp) {
		if(this.sp.isOpen) { // modify isOpen
			this.sp.close(function (e) {
				self.sp = undefined;
			});
		}
	}
};

Connector.prototype.send = function(data, callback) {
	var that = this;
	if(this.sp && this.sp.isOpen && data && !this.sp.isSending) { // modify isOpen
		this.sp.isSending = true;

		// modify start
		if(this.options.stream == 'string') {
			data = Buffer.from(data, 'utf8');
		}
		// modify end

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
