const EventEmitter = require('events').EventEmitter;
const logger = require('../custom_modules/logger').get();
const { ipcMain } = require('electron');

class MainRouter extends EventEmitter {
    constructor() {
        super();
        this.scanner = require('../custom_modules/router/scanner/serial');
        this.server = require('../custom_modules/entry');
    }

    startScan(config) {
        logger.i('scanning...');
        if(this.scanner) {
            this.hwModule = require('../modules/' + config.module);
            this.scanner.startScan(this.hwModule, config, (error, connector) => {
                if(error) {
                    logger.e(error);
                } else if(connector) {
                    this.connect(connector, config);
                }
            }, this);
        }
    }

    stopScan() {
        if(this.scanner) {
            this.scanner.stopScan();
        }
    }

    connect(connector, config) {
        this.connector = connector;

        if(this.connector.executeFlash) {
            this.emit('state', 'flash');
            return;
        }

        if(this.hwModule && this.server) {
            const handler = require('../custom_modules/router/datahandler/handler').create(config);
            this._connectToServer(handler);
            this._connectToDeviceConnector(handler, config);
        }
    }

    _connectToServer(handler) {
        const extension = this.hwModule;
        const server = this.server;

        server.removeAllListeners();
        server.on('connection', (data, type) => {
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
    }

    _connectToDeviceConnector(handler, config) {
        const extension = this.hwModule;
        const server = this.server;
        const connector = this.connector;
        const { control, duration, advertise } = config.hardware;

        /**
         * connector 에서 callback(null, data) 으로 주기적으로 데이터 전송
         */
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
            this.requestLocalDataInterval = setInterval(() => {
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
            }, duration);
        }

        if(advertise) {
            this.advertiseInterval = setInterval(function () {
                const data = handler.encode();
                if(data) {
                    server.send(data);
                }
            }, advertise);
        }
    }

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
        if(this.requestLocalDataInterval) {
            clearInterval(this.requestLocalDataInterval);
            this.requestLocalDataInterval = undefined;
        }
        if(this.advertiseInterval) {
            clearInterval(this.advertiseInterval);
            this.advertiseInterval = undefined;
        }
    };
};

module.exports = new MainRouter();
