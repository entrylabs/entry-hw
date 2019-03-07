'use strict';
const util = require('util');
const EventEmitter = require('events').EventEmitter;
const { ipcRenderer } = require('electron');

function Router() {
	EventEmitter.call(this);
}

util.inherits(Router, EventEmitter);

Router.prototype.init = function(server) {
	this.scanner = require('./scanner/scanner');
	this.server = server;
	return this;
};

Router.prototype.startScan = function(config) {
	if(this.scanner) {
		this.extension = require('../../modules/' + config.module);
		this.scanner.startScan(this, this.extension, config);
	}
};

Router.prototype.stopScan = function() {
	if(this.scanner) {
		this.scanner.stopScan();
	}
};

Router.prototype.connect = function(connector, config) {
	var self = this;
	var control = config.hardware.control;
    var duration = config.hardware.duration;
	var advertise = config.hardware.advertise;
	var extension = this.extension;
	var server = this.server;
    var type = config.hardware.type;
    var h_type = type;

	self.connector = connector;
    if(self.connector['executeFlash']) {
        self.emit('state', 'flash');
    } else if(extension && server) {
		var handler = require('./datahandler/handler.js').create(config);
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
        connector.connect(extension, function(state, data) {
			if(state) {
				self.emit('state', state);
                if(extension.eventController) {
                    extension.eventController(state);
                }
			} else {
				if(extension.handleLocalData) {
					extension.handleLocalData(data);
				}
				if(extension.requestRemoteData) {
					extension.requestRemoteData(handler);
					var data = handler.encode();
					if(data) {
						server.send(data);
					}
				}
				if(control === 'master') {
					if(extension.requestLocalData) {
						var data = extension.requestLocalData();
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
            self.advertise = setInterval(function () {
                var data = handler.encode();
                if(data) {
                    server.send(data);
                }
            }, advertise);
        }
	}
};

Router.prototype.close = function() {
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

module.exports = new Router();
