'use strict';
const EventEmitter = require('events').EventEmitter;
const { ipcRenderer } = require('electron');

class Router extends EventEmitter {
	constructor() {
		super();
	}

	init(server) {
		this.scanner = require('./scanner/scanner');
		this.server = server;
		return this;
	}

	startScan(config) {
		if(this.scanner) {
			this.extension = require('../../modules/' + config.module);
			this.scanner.startScan(this, this.extension, config);
		}
	};

	stopScan() {
		if(this.scanner) {
			this.scanner.stopScan();
		}
	};

	connect(connector, config) {
		const control = config.hardware.control;
		const duration = config.hardware.duration;
		const advertise = config.hardware.advertise;
		const extension = this.extension;
		const server = this.server;
		const type = config.hardware.type;
		const h_type = type;

		this.connector = connector;
		if(this.connector['executeFlash']) {
			this.emit('state', 'flash');
		} else if(extension && server) {
			const handler = require('./datahandler/handler.js').create(config);
			if(extension.init) {
				extension.init(handler, config);
			}
			if(extension.setSocket) {
				extension.setSocket(server);
			}
			server.removeAllListeners();
			server.on('connection', function(data, type) {
				if(extension.socketReconnection) {
					extension.socketReconnection();
				}
			});
			server.on('data', function(data, type) {
				handler.decode(data, type);
				if(extension.handleRemoteData) {
					extension.handleRemoteData(handler);
				}
			});
			server.on('close', function() {
				if(extension.reset) {
					extension.reset();
				}
			});
			connector.connect(extension, (state, data) => {
				if(state) {
					this.emit('state', state);
					if(extension.eventController) {
						extension.eventController(state);
					}
				} else {
					if(extension.handleLocalData) {
						extension.handleLocalData(data);
					}
					if(extension.requestRemoteData) {
						extension.requestRemoteData(handler);
						const data = handler.encode();
						if(data) {
							server.send(data);
						}
					}
					if(control === 'master') {
						if(extension.requestLocalData) {
							const data = extension.requestLocalData();
							if(data) {
								connector.send(data);
							}
						}
					}
				}
			});

			if(duration && control !== 'master') {
				ipcRenderer.send('startRequestLocalData', duration);
				ipcRenderer.removeAllListeners('sendingRequestLocalData');
				ipcRenderer.on('sendingRequestLocalData', () => {
					console.log('requestLocalData', Date.now());
					if(extension.requestLocalData) {
						const data = extension.requestLocalData();
						if(data) {
							connector.send(data);
						}
					}
					if(extension.getProperty) {
						const data = extension.getProperty();
						if(data) {
							connector.send(data);
						}
					}
				});
			}

			if(advertise) {
				this.advertise = setInterval(function () {
					const data = handler.encode();
					if(data) {
						server.send(data);
					}
				}, advertise);
			}
		}
	};

	close() {
		if(this.server) {
			this.server.disconnectHardware();
			this.server.removeAllListeners();
		}
		if(this.scanner) {
			this.scanner.stopScan();
		}
		if(this.connector) {
			console.log('disconnect');
			if(this.extension.disconnect) {
				this.extension.disconnect(this.connector);
			} else {
				this.connector.close();
			}
		}
		// if(this.timer) {
		//     clearInterval(this.timer);
		//     this.timer = undefined;
		// }
		ipcRenderer.send('stopRequestLocalData');
		if(this.advertise) {
			clearInterval(this.advertise);
			this.advertise = undefined;
		}
	};
}

module.exports = new Router();
