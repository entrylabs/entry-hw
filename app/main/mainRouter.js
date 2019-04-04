const { ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const Utils = require('../src/js/utils');
const Scanner = require('./scanner');
const EntryServer = require('./server');
const Flasher = require('./flasher');
const HardwareListManager = require('./hardwareListManager');
const HandlerCreator = require('../custom_modules/router/datahandler/handler');

/**
 * scanner, server, connector 를 총괄하는 중앙 클래스.
 * 해당 클래스는 renderer 의 router 와 통신한다.
 * 아래의 클래스들은 ipc 통신을 하지 않는다.
 *
 * scanner : 포트 검색 과 종료
 * server : entry workspace 와 통신하는 http/ws 서버
 * connector : 연결 성공 후의 실제 시리얼포트
 */
class MainRouter {
    constructor(mainWindow) {
        this.browser = mainWindow;
        this.scanner = new Scanner(this);
        this.server = new EntryServer(this);
        this.flasher = new Flasher();
        this.hardwareListManager = new HardwareListManager();

        this.config = undefined;
        /** @type {Connector} */
        this.connector = undefined;
        this.hwModule = undefined;
        /** @type {Object} */
        this.handler = undefined;

        this.server.open();

        ipcMain.on('state', (e, state) => {
            this.onChangeState(state);
        });
        ipcMain.on('startScan', async (e, config) => {
            await this.startScan(config);
        });
        ipcMain.on('stopScan', () => {
            this.stopScan();
        });
        ipcMain.on('close', () => {
            this.close();
        });
        ipcMain.on('requestFlash', (e) => {
            this.flashFirmware()
                .then(() => {
                    e.sender.send('requestFlash');
                })
                .catch((e) => {
                    e.sender.send('requestFlash', e);
                });
        });
        ipcMain.on('executeDriver', (e, driverPath) => {
            this.executeDriver(driverPath);
        });

        ipcMain.on('requestHardwareListSync', (e) => {
            e.returnValue = this.hardwareListManager.allHardwareList;
        });
    }

    /**
     * 펌웨어를 업로드한다.
     * 펌웨어는 커넥터가 닫힌 상태에서 작업되어야 한다. (COMPort 점유)
     * 실패시 tryFlasherNumber 만큼 반복한다. 기본값은 10번이다.
     * 로직 종료시 재스캔하여 연결을 수립한다.
     * @returns {Promise<void|Error>}
     */
    flashFirmware() {
        if (this.connector && this.connector.serialPort && this.config) {
            const {
                firmware,
                firmwareBaudRate: baudRate,
                firmwareMCUType: MCUType,
                tryFlasherNumber: maxFlashTryCount = 10,
            } = this.config;
            const lastSerialPortCOMPort = this.connector.serialPort.path;
            this.firmwareTryCount = 0;

            this.close(); // 서버 통신 중지, 시리얼포트 연결 해제

            const flashFunction = () => new Promise((resolve, reject) => {
                setTimeout(() => {
                    //연결 해제 완료시간까지 잠시 대기 후 로직 수행한다.
                    this.flasher.flash(firmware, lastSerialPortCOMPort, { baudRate, MCUType })
                        .then(([error]) => {
                            if (error) {
                                if (error === 'exit') {
                                    // 에러 메세지 없이 프로세스 종료
                                    reject(new Error());
                                } else if (++this.firmwareTryCount <= maxFlashTryCount) {
                                    setTimeout(() => {
                                        flashFunction().then(resolve);
                                    }, 100);
                                } else {
                                    reject(new Error('Failed Firmware Upload'));
                                }
                            } else {
                                resolve();
                            }
                        })
                        .catch(reject);
                }, 500);
            });

            // 에러가 발생하거나, 정상종료가 되어도 일단 startScan 을 재시작한다.
            return flashFunction()
                .then(() => {
                    console.log('flash successed');
                })
                .catch((e) => {
                    console.log('flash failed');
                    throw e;
                })
                .finally(async () => {
                    if (this.flasher.flasherProcess) {
                        this.flasher.kill();
                    }
                    if (firmware.afterDelay) {
                        await new Promise((resolve) => setTimeout(resolve, firmware.afterDelay));
                    }
                    await this.startScan(this.config);
                });
        } else {
            return Promise.reject(new Error('Hardware Device Is Not Connected'));
        }
    }

    /**
     * 연결을 끊고 새로 수립한다.
     * disconnect 혹은 lost state 상태이고, config 에 reconnect: true 인 경우 발생한다.
     * startScan 의 결과는 기다리지 않는다.
     */
    reconnect() {
        this.close();
        this.startScan(this.config);
    }

    /**
     * renderer 에 state 인자를 보낸다. 주로 ui 변경을 위해 사용된다.
     * @param {string} state 변경된 state
     * @param {...*} args 추가로 보낼 인자
     */
    sendState(state, ...args) {
        let resultState = state;
        if (state === 'lost' || state === 'disconnect') {
            if (this.config && this.config.reconnect) {
                this.reconnect();
            } else {
                // 연결 잃은 후 재연결 속성 없으면 연결해제처리
                resultState = 'disconnect';
                this.close();
            }
        }

        this.browser.webContents.send('state', resultState, ...args);
    }

    /**
     * ipcMain.on('state', ...) 처리함수
     * @param state
     */
    onChangeState(state) {
        this.server.setState(state);
    }

    /**
     * 현재 컴퓨터에 연결된 포트들을 검색한다.
     * 특정 시간(Scanner.SCAN_INTERVAL_MILLS) 마다 체크한다.
     * 연결성공시 'state' 이벤트가 발생된다.
     * @param config
     */
    async startScan(config) {
        this.config = config;
        if (this.scanner) {
            this.hwModule = require(`../modules/${config.module}`);
            const connector = await this.scanner.startScan(this.hwModule, this.config);
            if (connector) {
                this.sendState('connected');
                this._connect(connector);
            } else {
                console.log('connector not found! [debug]');
            }
        }
    }

    /**
     * 클라우드 모드 동작용.
     * 신규 클라이언트 소켓생성되어 호스트에 연결되는 경우,
     * 호스트 서버에서 관리하기 위해 해당 클라이언트용 roomId 를 추가한다.
     * @param roomId
     */
    addRoomId(roomId) {
        this.server.addRoomIdsOnSecondInstance(roomId);
    }

    getRoomIds() {
        return global.sharedObject.roomIds || [];
    }

    stopScan() {
        if (this.scanner) {
            this.scanner.stopScan();
        }
    }

    /**
     * 연결이 정상적으로 된 경우 startScan 의 callback 에서 호출된다.
     * @param connector
     */
    _connect(connector) {
        this.connector = connector;

        if (this.connector.executeFlash) {
            this.sendState('flash');
            return;
        }

        // 엔트리측, 하드웨어측이 정상적으로 준비된 경우
        if (this.hwModule && this.server) {
            // 엔트리쪽으로 송수신시 변환할 방식. 현재 json 만 지원한다.
            this.handler = HandlerCreator.create(this.config);
            this._connectToServer();

            this.connector.setRouter(this);
            this.connector.connect(); // router 설정 후 실제 기기와의 통신 시작
        }
    }

    /**
     * 엔트리 워크스페이스와의 연결 담당 로직
     *
     * @private
     */
    _connectToServer() {
        const hwModule = this.hwModule;
        const server = this.server;

        server.removeAllListeners();

        if (hwModule.init) {
            hwModule.init(this.handler, this.config);
        }

        if (hwModule.setSocket) {
            hwModule.setSocket(server);
        }

        // 신규 연결시 해당 메세지 전송
        server.on('connection', () => {
            if (hwModule.socketReconnection) {
                hwModule.socketReconnection();
            }
        });

        // 엔트리 실행이 종료된 경우 reset 명령어 호출
        server.on('close', () => {
            if (hwModule.reset) {
                hwModule.reset();
            }
        });
    }

    // 엔트리 측에서 데이터를 받아온 경우 전달
    handleServerData({ data, type }) {
        const hwModule = this.hwModule;
        const handler = this.handler;

        if (!hwModule || !handler) {
            return;
        }

        handler.decode(data, type);

        if (hwModule.handleRemoteData) {
            hwModule.handleRemoteData(handler);
        }
    }

    /**
     * 서버로 인코딩된 데이터를 보낸다. 핸들러 조작 함수가 없는 경우 그대로 보낸다. ex) advertise
     * @param {function?} callback handler 내 데이터를 변경할 함수. ex. requestRemoteData
     */
    sendEncodedDataToServer(callback) {
        callback && callback(this.handler);
        const data = this.handler.encode();
        if (data) {
            this.server.send(data);
        }
    }

    close() {
        if (this.server) {
            this.server.disconnectHardware();
        }
        if (this.scanner) {
            this.scanner.stopScan();
        }
        if (this.connector) {
            console.log('disconnect');
            if (this.hwModule.disconnect) {
                this.hwModule.disconnect(this.connector);
            } else {
                this.connector.close();
            }
            this.connector = undefined;
        }
        if (this.handler) {
            this.handler = undefined;
        }
    };

    executeDriver(driverPath) {
        if (!this.config) {
            return;
        }
        let basePath = '';
        const sourcePath = path.resolve('app', 'drivers');
        const asarIndex = __dirname.indexOf('app.asar');
        if (asarIndex >= 0) {
            basePath = path.join(
                __dirname.substr(0, asarIndex),
                'drivers'
            );
            if (!fs.existsSync(basePath)) {
                Utils.copyRecursiveSync(sourcePath, basePath);
            }
        } else {
            basePath = sourcePath;
        }

        shell.openItem(path.resolve(basePath, driverPath));
    }
}

module.exports = MainRouter;
