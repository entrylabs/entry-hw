'use strict';

const _ = require('lodash');
const rendererConsole = require('./utils/rendererConsole');
const SerialPort = require('@serialport/stream');
const Binding = require('@serialport/bindings');
const Connector = require('./connector');
const { CLOUD_MODE_TYPES: CloudModeTypes } = require('../common/constants');

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

    constructor(router) {
        this.router = router;
        this.serialport = SerialPort;
        this.serialport.Binding = Binding;
        this.isScanning = false;
    }

    async startScan(hwModule, config) {
        this.stopScan();

        this.setConfig(config);
        this.hwModule = hwModule;
        this.slaveTimers = {};
        this.connectors = {};

        return await this.intervalScan();
    };

    setConfig(config) {
        this.config = config;
    }

    async intervalScan() {
        this.isScanning = true;
        let scanResult = undefined;
        while (this.isScanning) {
            scanResult = await this.scan();
            if (scanResult) {
                this.isScanning = false;
            }
            await new Promise((resolve) => setTimeout(resolve, 1500));
        }
        return scanResult;
    }

    scan() {
        return new Promise(async (resolve, reject) => {
            if (!this.config) {
                return;
            }

            //TODO this_com_port 가 config 에서 설정될 수도 있고,
            // renderer 에서 COM 선택한것도 여기로 들어온다.
            const serverMode = this.router.currentCloudMode;
            const { hardware, this_com_port: selectedComPortName } = this.config;
            let { select_com_port: needCOMPortSelect } = this.config;
            const {
                comName: verifiedComPortNames,
                pnpId,
                type,
            } = hardware;
            let { vendor } = hardware;

            // win, mac 플랫폼에 맞는 벤더명 설정
            if (vendor && _.isPlainObject(vendor)) {
                vendor = vendor[process.platform];
            }

            // win, mac 플랫폼에 맞춰 COMPort 확인창 필요한지 설정
            if (needCOMPortSelect && _.isPlainObject(needCOMPortSelect)) {
                needCOMPortSelect = needCOMPortSelect[process.platform];
            }

            // comPort 선택지가 필요한지 체크한다. 블루투스나 클라우드 모드인경우 무조건 검사한다.
            const isComPortSelected =
                needCOMPortSelect ||
                type === 'bluetooth' ||
                serverMode === CloudModeTypes.cloud;

            try {
                /**
                 * 1. 포트가 선택되면 로직 전부 무시하고 바로 해당 포트로 연결시도
                 * 2. 포트가 선택되지 않은 경우
                 *  . 포트 선택이 필요한 상태인 경우 / 포트목록 노출시도
                 *  . 필요 없는 경우 / 자동선택이 config 작성되어있는 경우(필요한 경우) 해당 값포트로 연결시도
                 *   -> 모든 포트에 연결 시도 할 예정
                 */
                const comPorts = await SerialPort.list();
                rendererConsole.log(JSON.stringify(comPorts));
                if (isComPortSelected) {
                    if (selectedComPortName) {
                        // lost 후 reconnect 임시 대응
                        if (comPorts
                            .map((portData) => portData.path)
                            .findIndex((path) => path === selectedComPortName) === -1) {
                            resolve();
                            return;
                        }

                        let connector = this.connectors[selectedComPortName];
                        if (connector === undefined) {
                            connector = await this.prepareConnector(selectedComPortName);
                            this.connectors[selectedComPortName] = connector;
                        }
                        resolve(connector);
                    } else {
                        this.router.sendState('select_port', comPorts);
                        resolve();
                    }
                    return;
                }

                let vendorSelectedComPortName = undefined;
                comPorts.some((port) => {
                    const comName = port.path || hardware.name;

                    // config 에 입력한 특정 벤더와 겹치는지 여부
                    const isVendor = this._indexOfStringOrArray(vendor, port.manufacturer);

                    // config 에 입력한 특정 COMPortName과 겹치는지 여부
                    const isComName = this._indexOfStringOrArray(verifiedComPortNames, comName);

                    // config 에 입력한 특정 pnpId와 겹치는지 여부
                    const isPnpId = this._indexOfStringOrArray(pnpId, port.pnpId);

                    // 현재 포트가 config 과 일치하는 경우 연결시도할 포트목록에 추가
                    if (isVendor || isPnpId || isComName) {
                        vendorSelectedComPortName = comName;
                        return true;
                    }
                });

                if (vendorSelectedComPortName) {
                    let connector = this.connectors[vendorSelectedComPortName];
                    if (connector === undefined) {
                        connector = await this.prepareConnector(vendorSelectedComPortName);
                        this.connectors[vendorSelectedComPortName] = connector;
                    }
                    resolve(connector);
                } else {
                    resolve();
                }
            } catch (e) {
                reject(e);
            }
        });
    };

    /**
     *
     * @param {string} connectedComName 연결을 성사하고자 하는 COMPort
     * @returns {Promise<Connector>}
     */
    prepareConnector(connectedComName) {
        return new Promise(async (resolve, reject) => {
            // 통신개시후 완료확인 받아 낸 후 넘기기
            // 통신개시후 펌웨어 플래싱 필요한 경우 플래그 새기고 넘기기
            const hwModule = this.hwModule;
            const { hardware } = this.config;
            const connector = new Connector(hwModule, hardware);

            try {
                await connector.open(connectedComName);
                if (this.config.firmware) {
                    /*
                    펌웨어가 없는 상태에서 통신이 이루어지지 않는 경우,
                    before_connect 로 임시 연결됨 상태로 만들어서 펌웨어 버튼은 동작할 수 있게끔
                    만든다.
                     */
                    this.router.connector = connector;
                    this.router.sendState('before_connect');
                }
                await connector.initialize();
                this.finalizeScan(connectedComName);
                resolve(connector);
            } catch (e) {
                delete this.connectors[connectedComName];
                reject(e);
            }
        });
    }

    /**
     * arrayOrString 내에 target 이 포함되어있는지 검사한다.
     * @param {?String|?Array<String>} arrayOrString
     * @param {?String} target
     * @returns {boolean}
     */
    _indexOfStringOrArray(arrayOrString, target) {
        if (!target || !arrayOrString) {
            return false;
        }

        if (Array.isArray(arrayOrString)) {
            // arrayOrString.some((item)=>target.includes(item))
            // noinspection JSUnresolvedFunction
            return arrayOrString.some((item) => target.indexOf(item) >= 0);
        } else {
            // noinspection JSValidateTypes
            return target.indexOf(arrayOrString) >= 0;
        }
    }

    getComPortList() {
        return new Promise((resolve, reject) => {
            // noinspection JSIgnoredPromiseFromCall
            this.serialport.list((error, list) => {
                if (error) {
                    reject(error);
                } else {
                    rendererConsole.info(JSON.stringify(list));
                    resolve(list);
                }
            });
        });
    }

    stopScan() {
        this.config = undefined;
        this.isScanning = false;
        this.clearTimers();
    };


    clearTimers() {
        if (this.scanTimer) {
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

    finalizeScan(comName) {
        if (this.connectors && comName) {
            this.connectors[comName] = undefined;
        }
        this.stopScan();
    };
}

module.exports = Scanner;
