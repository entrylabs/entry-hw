const EventEmitter = require('events').EventEmitter;
const logger = require('../custom_modules/logger').get();
const { ipcMain } = require('electron');

/**
 * scanner, server, connector 를 총괄하는 중앙 클래스.
 * 해당 클래스는 renderer 의 router 와 통신한다.
 * 아래의 클래스들은 ipc 통신을 하지 않는다.
 *
 * scanner : 포트 검색 과 종료
 * server : entry workspace 와 통신하는 http/ws 서버
 * connector : 연결 성공 후의 실제 시리얼포트
 */
class MainRouter extends EventEmitter {
    constructor() {
        super();
        this.scanner = require('./scanner');
        this.server = require('./server');
        // this.server.open();
    }

    /**
     * 현재 컴퓨터에 연결된 포트들을 검색한다.
     * 특정 시간(Scanner.SCAN_INTERVAL_MILLS) 마다 체크한다.
     * 연결성공시 'state' 이벤트가 발생된다.
     * @param event
     * @param config
     */
    startScan(event, config) {
        logger.i('scanning...');
        if(this.scanner) {
            this.hwModule = require('../modules/' + config.module);
            this.scanner.startScan(this.hwModule, config, (error, connector) => {
                if(error) {
                    logger.e(error);
                    return;
                }

                if(connector) {
                    event.sender.send('state', 'connected');
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

    /**
     * 연결이 정상적으로 된 경우 startScan 의 callback 에서 호출된다.
     * @param event
     * @param connector
     * @param config
     */
    connect(event, connector, config) {
        this.connector = connector;

        if(this.connector.executeFlash) {
            this.emit('state', 'flash');
            return;
        }

        // 엔트리측, 하드웨어측이 정상적으로 준비된 경우
        if(this.hwModule && this.server) {
            // 엔트리쪽으로 송수신시 변환할 방식. 현재 json 만 지원한다.
            const handler = require('../custom_modules/router/datahandler/handler').create(config);
            this._connectToServer(handler);
            this._connectToDeviceConnector(event, handler, config);
        }
    }

    /**
     * 엔트리 워크스페이스와의 연결 담당 로직
     *
     * @param handler jsonHandler
     * @private
     */
    _connectToServer(handler) {
        const hwModule = this.hwModule;
        const server = this.server;

        server.removeAllListeners();

        // 신규 연결시 해당 메세지 전송
        server.on('connection', () => {
            if(hwModule.socketReconnection) {
                hwModule.socketReconnection();
            }
        });

        // 엔트리 측에서 데이터를 받아온 경우 전달
        server.on('data', function(data, type) {
            handler.decode(data, type);

            console.log('main server.data : ', handler.data);

            if(hwModule.handleRemoteData) {
                hwModule.handleRemoteData(handler);
            }
        });

        // 엔트리 실행이 종료된 경우 reset 명령어 호출
        server.on('close', function() {
            if(hwModule.reset) {
                hwModule.reset();
            }
        });
    }

    /**
     * 디바이스와의 연결 담당 로직.
     *
     * @param handler jsonHandler
     * @param config module.json 파일정보
     * @private
     */
   _connectToDeviceConnector(event, handler, config) {
        const hwModule = this.hwModule;
        const server = this.server;
        const connector = this.connector;
        const { control, duration, advertise } = config.hardware;

        /**
         * connector 에서 callback(null, data) 으로 주기적으로 데이터 전송.
         * 디바이스에서 데이터가 온 경우 발생한다.
         */
        connector.connect(hwModule, (state, data) => {
            console.log('main connector.connect : ', data);

            if(state) {
                event.sender.send('state', state);
                // 연결 후 state 가 변경되었을 때 이벤트 발생
                if(hwModule.eventController) {
                    hwModule.eventController(state);
                }
                return;
            }

            // 디바이스에 데이터 전송
            if(hwModule.handleLocalData) {
                hwModule.handleLocalData(data);
            }

            // 데이터 전송 후, handler.write 로 작성된 데이터 서버에 전송
            if(hwModule.requestRemoteData) {
                hwModule.requestRemoteData(handler);
                const data = handler.encode();
                if(data) {
                    server.send(data);
                }
            }

            // 만약 디바이스가 마스터모드인 경우, 디바이스에 바로 데이터 송신
            if(control === 'master') {
                if(hwModule.requestLocalData) {
                    const data = hwModule.requestLocalData();
                    if(data) {
                        connector.send(data);
                    }
                }
            }
        });

        // 마스터모드가 아닌 경우, duration 주기로 계속 서버에 데이터를 요청
        if(duration && control !== 'master') {
            this.requestLocalDataInterval = setInterval(() => {
                if(hwModule.requestLocalData) {
                    const data = hwModule.requestLocalData();
                    if(data) {
                        connector.send(data);
                    }
                }
                if(hwModule.getProperty) {
                    const data = hwModule.getProperty();
                    if(data) {
                        connector.send(data);
                    }
                }
            }, duration);
        }

        // 만약 advertise 가 활성화 되어있는 경우,
        // handler 에 저장되어있는 데이터를 계속해서 디바이스로 송신
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
