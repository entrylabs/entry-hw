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

	static get DEFAULT_SLAVE_DURATION() {
		return 1000;
	}

	constructor(hwModule, hardwareOptions) {
		this.options = hardwareOptions;
		this.hwModule = hwModule;
	}

	makeSerialPortOptions(serialPortOptions) {
		const _options = {
			autoOpen: true,
			baudRate: 9600,
			parity: 'none',
			dataBits: 8,
			stopBits: 1,
			bufferSize: 65536,
		};

		if (serialPortOptions.flowControl === 'hardware') {
			_options.rtscts = true;
		} else if (serialPortOptions.flowControl === 'software') {
			_options.xon = true;
			_options.xoff = true;
		}

		Object.assign(_options, serialPortOptions);
		return _options;
	}

	open(port) {
		return new Promise((resolve, reject) => {
			const hardwareOptions = this.options;
			this.lostTimer = hardwareOptions.lostTimer || Connector.DEFAULT_CONNECT_LOST_MILLS;

			const serialPort = new SerialPort(port, this.makeSerialPortOptions(hardwareOptions));
			this.serialPort = serialPort;

			// TODO parser 를 해당 커넥터에서 공용으로 전부 적용되는지 파악 후 다른 재할당 로직 삭제
			const { delimiter, byteDelimiter } = hardwareOptions;
			if (delimiter) {
				serialPort.parser = new Readline({ delimiter });
                this.serialPort.pipe(serialPort.parser);
			} else if (byteDelimiter) {
				serialPort.parser = new Delimiter({
					delimiter: byteDelimiter,
					includeDelimiter: true,
				});
                this.serialPort.pipe(serialPort.parser);
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

	/**
	 * checkInitialData, requestInitialData 가 둘다 존재하는 경우 handShake 를 진행한다.
	 * 둘 중 하나라도 없는 경우는 로직을 종료한다.
	 * 만약 firmwareCheck 옵션이 활성화 된 경우면 executeFlash 를 세팅하고 종료한다.
	 * 이 플래그는 라우터에서 flasher 를 바로 사용해야하는지 판단한다.
	 *
	 * @returns {Promise<void>} 준비완료 or 펌웨어체크 준비
	 */
	initialize() {
		return new Promise((resolve, reject) => {
			const {
			    control,
                duration = Connector.DEFAULT_SLAVE_DURATION,
                firmwarecheck,
			} = this.options;
			const hwModule = this.hwModule;

			if (control) {
				if (firmwarecheck) {
					this.flashFirmware = setTimeout(() => {
						this.serialPort.removeAllListeners('data');
						this.executeFlash = true;
						resolve();
					});
				}

				// TODO 리팩토링 필요
				if (hwModule.checkInitialData && hwModule.requestInitialData) {
					if (control === 'master') {
						this.serialPort.on('data', (data) => {
							const result = hwModule.checkInitialData(data, this.options);

                            if (result === undefined) {
                                this.send(hwModule.requestInitialData());
                            } else {
                                this.serialPort.removeAllListeners('data');
                                clearTimeout(this.flashFirmware);
                                if (result === true) {
                                    if (hwModule.setSerialPort) {
                                        hwModule.setSerialPort(this.serialPort);
                                    }
                                    resolve();
                                } else {
                                    reject(new Error('Invalid hardware'));
                                }
                            }
						});
					} else {
					    // control type is slave
                        this.serialPort.on('data', (data) => {
                            const result = hwModule.checkInitialData(data, this.options);
                            if (result !== undefined) {
                                this.serialPort.removeAllListeners('data');
                                clearTimeout(this.flashFirmware);
                                clearTimeout(this.slaveTimer);
                                if (result === true) {
                                    if (hwModule.setSerialPort) {
                                        hwModule.setSerialPort(this.serialPort);
                                    }
                                    if (hwModule.resetProperty) {
                                        this.send(hwModule.resetProperty());
                                    }
                                    resolve();
                                } else {
                                    reject(new Error('Invalid hardware'));
                                }
                            }
                        });
                        this.slaveTimer = setInterval(() => {
                            this.send(hwModule.requestInitialData(this.serialPort));
                        }, duration);
                    }
				} else {
				    resolve();
                }
			}
		});
	}

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
