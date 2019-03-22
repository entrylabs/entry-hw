'use strict';

const ConnectorCreator = require('./connector');
const { SERVER_MODE_TYPES } = require('../src/common/constants');

/**
 * 전체 포트를 검색한다.
 * 검색 조건은 hwModule 의 config 에서 설정한다.
 * pnpId, VendorName, select port 등등 이다.
 *
 * 결과의 송수신은 router 에 만들어진 함수로 보낸다.
 */
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

    startScan(hwModule, config, callback) {
        this.stopScan();

        this.config = config;
        this.hwModule = hwModule;
        this.slaveTimers = {};
        this.connectors = {};
        this.scanCount = 0;

        try {
            this.scan(callback);
            this.scanTimer = setInterval(() => {
                this.scan(callback);
            }, Scanner.SCAN_INTERVAL_MILLS);
        } catch (e) {
            console.error(e);
        }
    };

    async scan(callback) {
        const hwModule = this.hwModule;

        // noinspection JSIgnoredPromiseFromCall
        this.serialport.list(
            /**
             * @param {Error} error
             * @param {Array<Object>} ports
             */
            (error, ports) => {
            if (error) {
                throw error;
            }

            //TODO this_com_port 가 config 에서 설정될 수도 있고,
            // renderer 에서 COM 선택한것도 여기로 들어온다.
            const { serverMode, hardware, this_com_port: selectedComPort } = this.config;
            let { select_com_port: needCOMPortSelect } = this.config;
            const { scanType,
                comName: checkComName,
                control,
                duration,
                firmwarecheck,
                pnpId,
                type,
            } = hardware;
            let { vendor } = hardware;

            // win, mac 플랫폼에 맞는 벤더명 설정
            if (vendor && Scanner._isObject(vendor)) {
                vendor = vendor[process.platform];
            }

            // win, mac 플랫폼에 맞춰 COMPort 확인창 필요한지 설정
            if (needCOMPortSelect && Scanner._isObject(needCOMPortSelect)) {
                needCOMPortSelect = needCOMPortSelect[process.platform];
            }

            //
            const checkComPort =
                needCOMPortSelect ||
                type === 'bluetooth' ||
                serverMode === SERVER_MODE_TYPES.multi;

            // COMPort 필요하면서, 선택이 되지 않은 경우는 선택되기 전까지 진행하지 않는다.
            if (checkComPort && !selectedComPort) {
                this.router.sendState('select_port', ports);
                callback();
                return;
            }

            //TODO 이게 왜 필요하죠 110 라인이랑 동일로직인것 같은
            if (scanType === 'data') {
                if (this.scanCount < 5) {
                    this.scanCount++;
                } else {
                    if (ports.some((device) => {
                        let isVendor = false;
                        if (Array.isArray(vendor)) {
                            isVendor = vendor.some((v) =>
                                device.manufacturer && device.manufacturer.indexOf(v) >= 0);
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
                const comName = port.comName || hardware.name;

                if (Array.isArray(vendor)) {
                    isVendor = vendor.some((name) =>
                        port.manufacturer && port.manufacturer.indexOf(name) >= 0);
                } else if (vendor && port.manufacturer && port.manufacturer.indexOf(vendor) >= 0) {
                    isVendor = true;
                }

                if (Array.isArray(checkComName)) {
                    isComName = checkComName.some((name) => comName.indexOf(name) >= 0);
                } else if (checkComName && comName.indexOf(checkComName) >= 0) {
                    isComName = true;
                }

                if (!vendor ||
                    (port.manufacturer && isVendor) ||
                    (port.pnpId && port.pnpId.indexOf(pnpId) >= 0) ||
                    isComName ||
                    checkComPort
                ) {
                    if (checkComPort && comName !== myComPort) {
                        return;
                    }

                    // comName = '/dev/tty.EV3-SerialPort';
                    let connector = this.connectors[comName];
                    if (connector === undefined) {
                        connector = ConnectorCreator.create();
                        this.connectors[comName] = connector;
                        connector.open(comName, hardware, (error, serialPort) => {
                            if (error) {
                                delete this.connectors[comName];
                                throw error;
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
                                const source = serialPort.parser ?
                                    serialPort.pipe(serialPort.parser) : serialPort;
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
                                                serialPort.removeAllListeners('data');
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

    stopScan() {
        this.config = undefined;
        this.clearTimers();
        this.closeConnectors();
    };


    clearTimers() {
        if (this.scanTimer) {
            clearInterval(this.scanTimer);
            this.scanTimer = undefined;
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
        this.router.sendState('before_connect');
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
