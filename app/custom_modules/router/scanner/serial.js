'use strict';

class Scanner {
    static get SCAN_INTERVAL_MILLS() {
        return 1500;
    }

    static _isObject(target) {
        return Object.prototype.toString.call(target) === '[object Object]';
    }

    constructor() {
        this.serialport = require('@serialport/stream');
        this.serialport.Binding = require('@entrylabs/bindings');
    }

    startScan(extension, config, callback, router) {
        this.router = router;
        this.config = config;
        this.slaveTimers = {};
        this.connectors = {};
        this.scanCount = 0;
        this.closeConnectors();
        this.clearTimers();

        this.scan(extension, callback);
        this.timer = setInterval(() => {
            this.scan(extension, callback);
        }, Scanner.SCAN_INTERVAL_MILLS);
    };

    stopScan() {
        this.config = undefined;
        this.clearTimers();
        this.closeConnectors();
    };

    scan(extension, callback) {
        this.serialport.list(
            /**
             * @param error{Error}
             * @param devices{Array<Object>}
             */
            (error, devices) => {
                if (error) {
                    if (callback) {
                        callback(error);
                    }
                    return;
                }

                const { serverMode, hardware } = this.config;
                let { select_com_port:selectComPort } = this.config;
                const { scanType, comName:checkComName, control, duration, firmwarecheck, pnpId, type } = hardware;
                let { vendor } = hardware;

                if (vendor && Scanner._isObject(vendor)) {
                    vendor = vendor[process.platform];
                }

                if (selectComPort && Scanner._isObject(selectComPort)) {
                    selectComPort = selectComPort[process.platform];
                }

                const checkComPort = (selectComPort || type === 'bluetooth' || serverMode === 1) || false;
                const myComPort = this.config.this_com_port;

                if (checkComPort && !myComPort) {
                    this.router.emit('state', 'select_port', devices);
                    callback();
                    return;
                }

                if (scanType === 'data') {
                    if (this.scanCount < 5) {
                        this.scanCount++;
                    } else {
                        if (devices.some(function(device) {
                            let isVendor = false;
                            if (Array.isArray(vendor)) {
                                isVendor = vendor.some(function(v) {
                                    return device.manufacturer && device.manufacturer.indexOf(v) >= 0;
                                });
                            } else {
                                if (device.manufacturer && device.manufacturer.indexOf(vendor) >= 0) {
                                    isVendor = true;
                                }
                            }

                            return device.manufacturer && isVendor;
                        }) === false) {
                            vendor = undefined;
                        }
                    }
                }

                devices.forEach((device) => {
                    let isVendor = false;
                    let isComName = false;
                    const comName = device.comName || this.config.hardware.name;

                    if (Array.isArray(vendor)) {
                        isVendor = vendor.some(function(name) {
                            return device.manufacturer && device.manufacturer.indexOf(name) >= 0;
                        });
                    } else if (vendor && device.manufacturer && device.manufacturer.indexOf(vendor) >= 0) {
                        isVendor = true;
                    }

                    if (Array.isArray(checkComName)) {
                        isComName = checkComName.some(function(name) {
                            return comName.indexOf(name) >= 0;
                        });
                    } else if (checkComName && comName.indexOf(checkComName) >= 0) {
                        isComName = true;
                    }

                    if (!vendor || (device.manufacturer && isVendor) || (device.pnpId && device.pnpId.indexOf(pnpId) >= 0) || isComName || checkComPort) {

                        if (checkComPort && comName !== myComPort) {
                            return;
                        }

                        // comName = '/dev/tty.EV3-SerialPort';
                        let connector = this.connectors[comName];
                        if (connector === undefined) {
                            connector = require('../connector/serial').create();
                            this.connectors[comName] = connector;
                            connector.open(comName, this.config.hardware, (error, sp) => {
                                if (error) {
                                    delete this.connectors[comName];
                                    if (callback) {
                                        callback(error);
                                    }
                                } else {
                                    this.setConnector(connector);
                                    if (control) {
                                        let flashFirmware;
                                        if (firmwarecheck) {
                                            flashFirmware = setTimeout(() => {
                                                sp.removeAllListeners('data');
                                                connector.executeFlash = true;
                                                this.finalizeScan(comName, connector, callback);
                                            }, 3000);
                                        }

                                        if (control === 'master') {
                                            if (extension.checkInitialData && extension.requestInitialData) {

                                                let source = sp;
                                                if (sp.parser){
                                                    source = sp.parser;
                                                }
                                                source.on('data', (data) => {
                                                    if (this.config.hardware.stream === 'string') {
                                                        data = data.toString();
                                                    }

                                                    const result = extension.checkInitialData(data, this.config);
                                                    if (result === undefined) {
                                                        connector.send(extension.requestInitialData());
                                                    } else {
                                                        source.removeAllListeners('data'); // modify  sp --> source
                                                        clearTimeout(flashFirmware);
                                                        if (result === true) {

                                                            if (extension.setSerialPort) {
                                                                extension.setSerialPort(sp);
                                                            }

                                                            this.finalizeScan(comName, connector, callback);
                                                        } else if (callback) {
                                                            callback(new Error('Invalid hardware'));
                                                        }
                                                    }
                                                });
                                            }
                                        } else {
                                            if (duration && extension.checkInitialData && extension.requestInitialData) {
                                                sp.on('data', (data) => {
                                                    if (this.config.hardware.stream === 'string') {
                                                        data = data.toString();
                                                    }

                                                    const result = extension.checkInitialData(data, this.config);
                                                    if (result !== undefined) {
                                                        sp.removeAllListeners('data');
                                                        clearTimeout(flashFirmware);
                                                        if (result === true) {
                                                            if (extension.setSerialPort) {
                                                                extension.setSerialPort(sp);
                                                            }
                                                            if (extension.resetProperty) {
                                                                connector.send(extension.resetProperty());
                                                            }
                                                            this.finalizeScan(comName, connector, callback);
                                                        } else if (callback) {
                                                            callback(new Error('Invalid hardware'));
                                                        }
                                                    }
                                                });
                                                let slaveTimer = this.slaveTimers[comName];
                                                if (slaveTimer) {
                                                    clearInterval(slaveTimer);
                                                }
                                                slaveTimer = setInterval(() => {
                                                    connector.send(extension.requestInitialData(sp));
                                                }, duration);
                                                this.slaveTimers[comName] = slaveTimer;
                                            }
                                        }
                                    } else {
                                        this.finalizeScan(comName, connector, callback);
                                    }
                                }
                            });
                        }
                    }
                });
            });
    };

    clearTimers() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = undefined;
        }
        const slaveTimers = this.slaveTimers;
        if (slaveTimers) {
            let slaveTimer;
            for (const key in slaveTimers) {
                slaveTimer = slaveTimers[key];
                if (slaveTimer) {
                    clearInterval(slaveTimer);
                }
            }
        }
        this.slaveTimers = {};
    };

    setConnector(connector) {
        this.router.connector = connector;
        this.router.emit('state', 'before_connect');
    };

    finalizeScan(comName, connector, callback) {
        if (this.connectors && comName) {
            this.connectors[comName] = undefined;
        }
        this.stopScan();

        if (callback) {
            callback(null, connector);
        }
    };

    closeConnectors() {
        const connectors = this.connectors;
        if (connectors) {
            let connector;
            for (const key in connectors) {
                connector = connectors[key];
                if (connector) {
                    connector.close();
                }
            }
        }
        this.connectors = {};
    };
}

module.exports = new Scanner();
