'use strict';
const Readline = require('@serialport/parser-readline'); // modify
const Delimiter = require('@serialport/parser-delimiter');
const SerialPort = require('@serialport/stream');
SerialPort.Binding = require('@entrylabs/bindings');

/**
 * 스캔이 끝난 후, 선택된 포트로 시리얼포트를 오픈하는 클래스
 */
class Connector {
	static get DEFAULT_CONNECT_LOST_MILLS() {
		return 500;
	}

	constructor(hwModule, hardwareOptions) {
		this.options = hardwareOptions;
		this.hwModule = hwModule;
	}

	makeSerialPortOptions(options) {
		const _options = {
			autoOpen: true,
			baudRate: 9600,
			parity: 'none',
			dataBits: 8,
			stopBits: 1,
			bufferSize: 65536,
		};

		if (options.flowControl === 'hardware') {
			_options.rtscts = true;
		} else if (options.flowControl === 'software') {
			_options.xon = true;
			_options.xoff = true;
		}

		Object.assign(_options, options);
		return _options;
	}

	open(port, hardwareOptions) {
		return new Promise((resolve, reject) => {
			this.options = hardwareOptions;
			this.lostTimer = hardwareOptions.lostTimer || Connector.DEFAULT_CONNECT_LOST_MILLS;

			const serialPort = new SerialPort(port, this.makeSerialPortOptions(hardwareOptions));
			this.serialPort = serialPort;

			const { delimiter, byteDelimiter } = hardwareOptions;
			if (delimiter) {
				serialPort.parser = new Readline({ delimiter });
			} else if (byteDelimiter) {
				serialPort.parser = new Delimiter({
					delimiter: byteDelimiter,
					includeDelimiter: true,
				});
			}

			serialPort.on('error', reject);
			serialPort.on('open', (error) => {
				serialPort.removeAllListeners('open');
				if (error) {
					reject(error);
				} else {
					resolve(this.serialPort);
				}
			});
		});
	};

	connect(hwModule, callback) {
		console.log('connect!');
		if (hwModule.connect) {
			hwModule.connect();
		}
		if (this.serialPort) {
			this.connected = false;
			this.received = true;
			const serialPort = this.serialPort;
			callback('connect');

			if (hwModule.afterConnect) {
				hwModule.afterConnect(this, callback);
			}

			const source = this.serialPort.parser ? this.serialPort.pipe(this.serialPort.parser) : this.serialPort;
			source.on('data', (data) => {
				if (!hwModule.validateLocalData || hwModule.validateLocalData(data)) {
					if (this.connected === false) {
						this.connected = true;
						if (callback) {
							callback('connected');
						}
					}
					this.received = true;
					if (callback) {
						callback(null, data);
					}
				}
			});

			serialPort.on('disconnect', () => {
				this.close();
				if (callback) {
					callback('disconnected');
				}
			});

			if (hwModule.lostController) {
				hwModule.lostController(this, callback);
			} else {
				this.timer = setInterval(() => {
					if (this.connected) {
						if (this.received === false) {
							this.connected = false;
							if (callback) {
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
		if (this.timer) {
			clearInterval(this.timer);
			this.timer = undefined;
		}
		if (this.serialPort) {
			this.serialPort.removeAllListeners();
			if (this.serialPort.parser) {
				this.serialPort.parser.removeAllListeners();
			}
		}
	};

	close() {
		this.clear();
		if (this.serialPort) {
			if (this.serialPort.isOpen) { // modify isOpen
				this.serialPort.close((e) => {
					this.serialPort = undefined;
				});
			}
		}
	};

	send(data, callback) {
		if (this.serialPort && this.serialPort.isOpen && data && !this.serialPort.isSending) {
			this.serialPort.isSending = true;

			if (this.options.stream === 'string') {
				data = Buffer.from(data, 'utf8');
			}

			this.serialPort.write(data, () => {
				if (this.serialPort) {
					this.serialPort.drain(() => {
						this.serialPort.isSending = false;
						callback && callback();
					});
				}
			});
		}
	};
}

module.exports = Connector;
