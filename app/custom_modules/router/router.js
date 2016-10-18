'use strict';
var util = require('util');
var EventEmitter = require('events').EventEmitter;

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
		server.removeAllListeners();
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
                if(extension.evevtContoller) {
                    extension.evevtContoller(state);
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
            self.timer = setInterval(function() {
                if(extension.requestLocalData) {
                    var data = extension.requestLocalData();
                    if(data) {
                        connector.send(data);
                    }
                }
            }, duration);
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
    if(this.timer) {
        clearInterval(this.timer);
        this.timer = undefined;
    }
	if(this.advertise) {
		clearInterval(this.advertise);
		this.advertise = undefined;
	}
};

module.exports = new Router();
