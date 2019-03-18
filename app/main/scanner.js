'use strict';

const ConnectorCreator = require('./connector');
const { ipcMain } = require('electron');

class Scanner {
    static get SCAN_INTERVAL_MILLS() {
        return 1500;
    }

    static _isObject(target) {
        return Object.prototype.toString.call(target) === '[object Object]';
    }

    constructor(router) {
        this.router = router;
        this.serialport = require('@serialport/stream');
        this.serialport.Binding = require('@entrylabs/bindings');
    }

    startScan(extension, config, callback) {
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

    scan(hwModule, callback) {
        this.serialport.list((error, ports) => {
            if (error) {
                if (callback) {
                    callback(error);
                }
                return;
            }

            const { serverMode, hardware } = this.config;
            let { select_com_port: selectComPort } = this.config;
            const { scanType, comName: checkComName, control, duration, firmwarecheck, pnpId, type } = hardware;
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
                this.router.sendEvent('state', 'select_port', ports);
                // this.router.emit('state', 'select_port', ports);
                callback();
                return;
            }

            if (scanType === 'data') {
                if (this.scanCount < 5) {
                    this.scanCount++;
                } else {
                    if (ports.some(function(device) {
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

            ports.forEach((port) => {
                let isVendor = false;
                let isComName = false;
                const comName = port.comName || this.config.hardware.name;

                if (Array.isArray(vendor)) {
                    isVendor = vendor.some(function(name) {
                        return port.manufacturer && port.manufacturer.indexOf(name) >= 0;
                    });
                } else if (vendor && port.manufacturer && port.manufacturer.indexOf(vendor) >= 0) {
                    isVendor = true;
                }

                if (Array.isArray(checkComName)) {
                    isComName = checkComName.some(function(name) {
                        return comName.indexOf(name) >= 0;
                    });
                } else if (checkComName && comName.indexOf(checkComName) >= 0) {
                    isComName = true;
                }

                if (!vendor || (port.manufacturer && isVendor) || (port.pnpId && port.pnpId.indexOf(pnpId) >= 0) || isComName || checkComPort) {

                    if (checkComPort && comName !== myComPort) {
                        return;
                    }

                    // comName = '/dev/tty.EV3-SerialPort';
                    let connector = this.connectors[comName];
                    if (connector === undefined) {
                        connector = ConnectorCreator.create();
                        this.connectors[comName] = connector;
                        connector.open(comName, this.config.hardware, (error, serialPort) => {
                            if (error) {
                                delete this.connectors[comName];
                                if (callback) {
                                    callback(error);
                                }
                                return;
                            }

                            this.setConnector(connector);

                            if (control) {
                                let flashFirmware;
                                if (firmwarecheck) {
                                    flashFirmware = setTimeout(() => {
                                        serialPort.removeAllListeners('data');
                                        connector.executeFlash = true;
                                        this.finalizeScan(comName, connector, callback);
                                    }, 3000);
                                }

                                // 파서를 쓰는 경우는 파서로 데이터를 가져온다.
                                const source = serialPort.parser ? serialPort.pipe(serialPort.parser) : serialPort;
                                if (control === 'master') {
                                    if (hwModule.checkInitialData && hwModule.requestInitialData) {
                                        source.on('data', (data) => {
                                            if (!this.config) {
                                                console.log('nono');
                                                return;
                                            }

                                            const result = hwModule.checkInitialData(data, this.config);
                                            if (result === undefined) {
                                                connector.send(hwModule.requestInitialData());
                                            } else {
                                                serialPort.removeAllListeners('data'); // modify  sp --> source
                                                source.removeAllListeners('data');
                                                clearTimeout(flashFirmware);
                                                if (result === true) {
                                                    if (hwModule.setSerialPort) {
                                                        hwModule.setSerialPort(serialPort);
                                                    }
                                                    this.finalizeScan(comName, connector, callback);
                                                } else if (callback) {
                                                    callback(new Error('Invalid hardware'));
                                                }
                                            }
                                        });
                                    }
                                } else { // if control type is slave
                                    if (duration && hwModule.checkInitialData && hwModule.requestInitialData) {
                                        source.on('data', (data) => {
                                            if (!this.config) {
                                                console.log('nono');
                                                return;
                                            }

                                            const result = hwModule.checkInitialData(data, this.config);
                                            if (result !== undefined) {
                                                serialPort.removeAllListeners('data');
                                                source.removeAllListeners('data');
                                                clearTimeout(flashFirmware);
                                                if (result === true) {
                                                    if (hwModule.setSerialPort) {
                                                        hwModule.setSerialPort(serialPort);
                                                    }
                                                    if (hwModule.resetProperty) {
                                                        connector.send(hwModule.resetProperty());
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
                                            connector.send(hwModule.requestInitialData(serialPort));
                                        }, duration);
                                        this.slaveTimers[comName] = slaveTimer;
                                    }
                                }
                            } else {
                                this.finalizeScan(comName, connector, callback);
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

module.exports = Scanner;
