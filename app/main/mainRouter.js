const { ipcMain } = require('electron');
const Scanner = require('./scanner');
const EntryServer = require('./server');
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
        this.server.open();

        ipcMain.on('state', this.onState.bind(this));
        ipcMain.on('startScan', this.startScan.bind(this));
        ipcMain.on('stopScan', this.stopScan.bind(this));
        ipcMain.on('close', this.close.bind(this));
    }

    /**
     * renderer 에 state 인자를 보낸다. 주로 ui 변경을 위해 사용된다.
     * @param {string} state 변경된 state
     * @param {...*} args 추가로 보낼 인자
     */
    sendState(state, ...args) {
        this.browser.webContents.send('state', state, ...args);
    }

    /**
     * renderer 로 이벤트를 보낸다. sendState 는 sendEvent('state', args) 와 동일하다.
     * @param eventChannel
     * @param args
     */
    sendEvent(eventChannel, ...args) {
        this.browser.webContents.send(eventChannel, ...args);
    }

    /**
     * ipcMain.on('state', ...) 처리함수
     * @param state
     */
    onState(state) {
        this.server.setState(state);
    }

    /**
     * 현재 컴퓨터에 연결된 포트들을 검색한다.
     * 특정 시간(Scanner.SCAN_INTERVAL_MILLS) 마다 체크한다.
     * 연결성공시 'state' 이벤트가 발생된다.
     * @param event
     * @param config
     */
    async startScan(event, config) {
        this.config = config;
        if (this.scanner) {
            this.hwModule = require(`../modules/${config.module}`);
            const connector = await this.scanner.startScan(this.hwModule, this.config);
            if (connector) {
                this.sendEvent('state', 'connected');
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
            this.sendEvent('state', 'flash');
            return;
        }

        // 엔트리측, 하드웨어측이 정상적으로 준비된 경우
        if (this.hwModule && this.server) {
            // 엔트리쪽으로 송수신시 변환할 방식. 현재 json 만 지원한다.
            this.handler = HandlerCreator.create(this.config);
            this._connectToServer();
            this._connectToDeviceConnector();
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
        handler.decode(data, type);

        console.log('main server.data : ', handler.data);

        if (hwModule.handleRemoteData) {
            hwModule.handleRemoteData(handler);
        }
    }

    /**
     * 디바이스와의 연결 담당 로직.
     *
     * @private
     */
   _connectToDeviceConnector() {
        const hwModule = this.hwModule;
        const server = this.server;
        const connector = this.connector;
        const { control, duration, advertise } = this.config.hardware;

        /**
         * connector 에서 callback(null, data) 으로 주기적으로 데이터 전송.
         * 디바이스에서 데이터가 온 경우 발생한다.
         */
        connector.connect(hwModule, (state, data) => {
            if (state) {
                this.sendEvent('state', state);
                // event.sender.send('state', state);
                // 연결 후 state 가 변경되었을 때 이벤트 발생
                if (hwModule.eventController) {
                    hwModule.eventController(state);
                }
                return;
            }

            // 디바이스에 데이터 전송
            if (hwModule.handleLocalData) {
                hwModule.handleLocalData(data);
            }

            // 데이터 전송 후, handler.write 로 작성된 데이터 서버에 전송
            if (hwModule.requestRemoteData) {
                hwModule.requestRemoteData(this.handler);
                const data = this.handler.encode();
                if (data) {
                    server.send(data);
                }
            }

            // 만약 디바이스가 마스터모드인 경우, 디바이스에 바로 데이터 송신
            if (control === 'master') {
                if (hwModule.requestLocalData) {
                    const data = hwModule.requestLocalData();
                    if (data) {
                        connector.send(data);
                    }
                }
            }
        });

        // 마스터모드가 아닌 경우, duration 주기로 계속 서버에 데이터를 요청
        if (duration && control !== 'master') {
            this.requestLocalDataInterval = setInterval(() => {
                if (hwModule.requestLocalData) {
                    const data = hwModule.requestLocalData();
                    if (data) {
                        connector.send(data);
                    }
                }
                if (hwModule.getProperty) {
                    const data = hwModule.getProperty();
                    if (data) {
                        connector.send(data);
                    }
                }
            }, duration);
        }

        // 만약 advertise 가 활성화 되어있는 경우,
        // handler 에 저장되어있는 데이터를 계속해서 디바이스로 송신
        if (advertise) {
            this.advertiseInterval = setInterval(function() {
                const data = this.handler.encode();
                if (data) {
                    server.send(data);
                }
            }, advertise);
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
        if (this.requestLocalDataInterval) {
            clearInterval(this.requestLocalDataInterval);
            this.requestLocalDataInterval = undefined;
        }
        if (this.advertiseInterval) {
            clearInterval(this.advertiseInterval);
            this.advertiseInterval = undefined;
        }
        if (this.handler) {
            this.handler = undefined;
        }
    };
}

module.exports = MainRouter;
