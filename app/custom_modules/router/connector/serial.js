'use strict';
const Readline = require('@serialport/parser-readline'); // modify
const Delimiter = require('@serialport/parser-delimiter');
const SerialPort = require('@serialport/stream');
SerialPort.Binding = require('@entrylabs/bindings');

class Connector {
	open(port, options, callback) {
		this.options = options;

		this.lostTimer = options.lostTimer || 500;
		// options
		const _options = {
			autoOpen: true,
			baudRate: 9600,
			parity: 'none',
			dataBits: 8,
			stopBits: 1,
			bufferSize: 65536,
		};
		if(options.flowControl === 'hardware') {
			_options.rtscts = true;
		} else if(options.flowControl === 'software') {
			_options.xon = true;
			_options.xoff = true;
		}

		Object.assign(_options, this.options);

		this.serialPort = new SerialPort(port, _options);

		if(options.delimiter) {
			this.serialPort.parser = this.serialPort.pipe(new Readline(options));
		} else if(options.byteDelimiter) {
			this.serialPort.parser = this.serialPort.pipe(new Delimiter({
				delimiter: options.byteDelimiter,
				includeDelimiter: true,
			}))
		}
		// modify end

		this.serialPort.on('error', (error) => {
			console.error(error);
			if(callback) {
				callback(error);
			}
		});
		this.serialPort.on('open', (error) => {
			this.serialPort.removeAllListeners('open');
			if(callback) {
				callback(error, this.serialPort);
			}
		});
	};

	connect(hwModule, callback) {
		console.log('connect!');
		if(hwModule.connect) {
			hwModule.connect();
		}
		if(this.serialPort) {
			this.connected = false;
			this.received = true;
			const serialPort = this.serialPort;
			callback('connect');

			if(hwModule.afterConnect) {
				hwModule.afterConnect(this, callback);
			}

			// if(this.options.delimiter) {
			// 	serialPort.parser = serialPort.pipe(new Readline(self.options));
			// } else if(this.options.byteDelimiter) {
			// 	serialPort.parser = serialPort.pipe(new Delimiter({
			// 		delimiter: this.options.byteDelimiter,
			// 		includeDelimiter: true,
			// 	}));
			// }

			serialPort.on('data', (data) => {
				if(this.options.stream === 'string') {
					data = data.toString();
				}

				if(!hwModule.validateLocalData || hwModule.validateLocalData(data)) {
					if(this.connected === false) {
						this.connected = true;
						if(callback) {
							callback('connected');
						}
					}
					this.received = true;
					if(callback) {
						callback(null, data);
					}
				}
			});
			serialPort.on('disconnect', () => {
				this.close();
				if(callback) {
					callback('disconnected');
				}
			});

			if(hwModule.lostController) {
				hwModule.lostController(self, callback);
			} else {
				this.timer = setInterval(() => {
					if(this.connected) {
						if(this.received === false) {
							this.connected = false;
							if(callback) {
								callback('lost');
							}
						}
						this.received = false;
					}
				}, this.lostTimer);
			}
		}
	};

	clear() {
		this.connected = false;
		if(this.timer) {
			clearInterval(this.timer);
			this.timer = undefined;
		}
		if(this.serialPort) {
			this.serialPort.removeAllListeners();
			if(this.serialPort.parser) {
				this.serialPort.parser.removeAllListeners();
			}
		}
	};

	close() {
		this.clear();
		if(this.serialPort) {
			if(this.serialPort.isOpen) { // modify isOpen
				this.serialPort.close((e) => {
					this.serialPort = undefined;
				});
			}
		}
	};

	send(data, callback) {
		if(this.serialPort && this.serialPort.isOpen && data && !this.serialPort.isSending) {
			this.serialPort.isSending = true;

			if(this.options.stream === 'string') {
				data = Buffer.from(data, 'utf8');
			}

			this.serialPort.write(data, () => {
				if(this.serialPort) {
					this.serialPort.drain(() => {
						this.serialPort.isSending = false;
						callback && callback();
					});
				}
			});
		}
	};
}

module.exports.create = () => new Connector();
