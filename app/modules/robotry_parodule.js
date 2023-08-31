const BaseModule = require('./robotry');
class Parodule extends BaseModule {
    // 클래스 내부에서 사용될 필드들을 이곳에서 선언합니다.
    constructor() {
        super();
        this.sp = null;
        this.controlTypes = {
            DIGITAL: 0,
            ANALOG: 1,
            STRING: 2,
        };
        this.UNKNOWN = 207;
        this.NONE = 208;
        this.PIXEL = 209;
        this.MOTOR = 210;
        this.BUZZER = 211;
        this.paroduleData = {
            SENSOR: {
                '0': 0,
                '1': 0,
                '2': 0,
                '3': 0,
            },
            MODULE: {
                '0': 0,
                '1': 0,
                '2': 0,
                '3': 0,
            },
            MODULE1: '픽셀',
            MODULE2: '픽셀',
            MODULE3: '픽셀',
            MODULE4: '픽셀',
        };
        this.isConnect = false;
        this.cmdTime = 0;
        this.portTimeList = [0, 0, 0, 0, 0];
        this.terminal = [0xee, 0xee, 0xee, 0xee, '\n']; // 터미널 버퍼 저장 공간
        this.moduleOff = [0xff, 0x55, 0xc8, 0xc8, 0xc8, 0xc8, '\n']; // 모듈 종료 인터럽트
        // this.bleDisconCode = new Buffer('123\r\n');
        this.paroduleEntry = new Buffer('entry\r\n'); // 엔트리 모듈 내부 셰이킹
        this.paroduleInit = [0xff, 0x55, 0xff, 0xff, 0xff, 0xff, 0x0a]; // 엔트리용 모듈 인식 코드
        this.paroduleClose = new Buffer('spclose\r\n'); // 시리어 포트 종료 신호
        this.isSend = true;
        this.pre_time = 0;
    }
    /*
    최초에 커넥션이 이루어진 후의 초기 설정.
    handler 는 워크스페이스와 통신하 데이터를 json 화 하는 오브젝트입니다. (datahandler/json 참고)
    config 은 module.json 오브젝트입니다.
    */
    init(handler, config) {
        this.handler = handler;
        this.config = config;
    }
    setSerialPort(sp) {
        let self = this;
        this.sp = sp;
    }
    afterConnect(that, cb) {
        that.connected = true;
        if (cb) {
            cb('connected');
        }
    }
    connect() {
        this.isConnect = true;
    }
    /*
    연결 후 초기에 송신할 데이터가 필요한 경우 사용합니다.
    requestInitialData 를 사용한 경우 checkInitialData 가 필수입니다.
    이 두 함수가 정의되어있어야 로직이 동작합니다. 필요없으면 작성하지 않아도 됩니다.
    */
    requestInitialData() {
        return this.paroduleEntry;
    }
    // 연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
    checkInitialData(data, config) {
        if (data) {
            return true;
        }
        else {
            return false;
        }

    }
    // 주기적으로 하드웨어에서 받은 데이터의 검증이 필요한 경우 사용합니다.
    validateLocalData(data) {
        return true;
    }
    /*
    하드웨어 기기에 전달할 데이터를 반환합니다.
    slave 모드인 경우 duration 속성 간격으로 지속적으로 기기에 요청을 보냅니다.
    */
    requestLocalData() {
        // 하드웨어로 보낼 데이터 로직
        if (!this.isConnect) {
            return;
        }
        if (this.sendBuffers.length > 0) {
            if (this.sp) {
                this.sp.write(this.sendBuffers.shift(), () => {
                    this.sp.drain(() => {
                    });
                });
            }
        }
        return null;
    }

    // 하드웨어에서 온 데이터 처리
    handleLocalData(data) {
        let self = this;
        let datas = this.getDataByBuffer(data);
        // 데이터 처리 로직
        datas.forEach((data) => {
            // 센서 데이터만 걸러냄 
            if (data.length < 6) {
                return;
            }
            else if (data[0] == 0xff && data[1] == 0x44) {
                //console.log(data);
                let temp = ['', '', '', ''];
                let readData = data.subarray(2, data.length);
                for (let i = 0; i < 4; i++) {
                    self.paroduleData.MODULE[i] = readData[i];
                }
                for (let i = 0; i < 4; i++) {
                    let value = self.paroduleData.MODULE[i];
                    if (value == this.PIXEL) {
                        temp[i] = '픽셀';
                    }
                    else if (value == this.MOTOR) {
                        temp[i] = '모터';
                    }
                    else if (value == this.BUZZER) {
                        temp[i] = '부저';
                    }
                    else if (value == this.NONE) {
                        temp[i] = '없음';
                    } else {
                        temp[i] = '모름';
                    }
                }
                self.paroduleData.MODULE1 = temp[0];
                self.paroduleData.MODULE2 = temp[1];
                self.paroduleData.MODULE3 = temp[2];
                self.paroduleData.MODULE4 = temp[3];
            }
            else if (data[0] == 0xff && data[1] == 0x66) {
                let readData = data.subarray(2, data.length);
                for (let i = 0; i < 4; i++) {
                    self.paroduleData.SENSOR[i] = readData[i];
                }
            }
        });
    }
    // 엔트리로 전달할 데이터
    requestRemoteData(handler) {
        let self = this;
        if (!self.paroduleData) {
            return;
        }
        this.lastSendTime = this.lastTime;
        Object.keys(this.paroduleData).forEach(function (key) {
            if (self.paroduleData[key] != undefined) {
                handler.write(key, self.paroduleData[key]);
                self.canSendData = false;
            }
        });
    }
    // 엔트리에서 받은 데이터에 대한 처리
    handleRemoteData(handler) {
        const interval = 60000; // 1분에 한번씩 연결된 모듈 데이터 호출
        let self = this;
        let cmdDatas = handler.read('CMD');
        let getDatas = handler.read('GET');
        let setDatas = handler.read('SET');
        let time = handler.read('TIME');
        let buffer = new Buffer([]);
        // 입력 모듈일 경우
        if (getDatas) {
        }
        // 출력 모듈일 경우
        if (setDatas) {
            let setKey = Object.keys(setDatas);
            setKey.forEach(function (port) {
                let data = setDatas[port];
                if (data) {
                    if (self.portTimeList[port] < data.time) {
                        self.portTimeList[port] = data.time
                        if (!self.isRecentData(port, data.type, data.data)) {
                            self.recentCheckData[port] = {
                                type: data.type,
                                data: data.data
                            }
                            self.updateTerminalBuffer(port);
                            buffer = new Buffer(self.makeOutputBuffer(data.type, null));
                        }
                    }
                }
            });

        }
        // 커맨드 명령어
        if (cmdDatas) {
            if (self.cmdTime < cmdDatas.time) {
                self.cmdTime = cmdDatas.time;

                if (!self.isRecentData(cmdDatas.data)) {
                    self.recentCheckData = {
                        data: cmdDatas.data
                    }
                    buffer = new Buffer(cmdDatas.data);
                }
            }
        }
        if (buffer.length) {
            this.sendBuffers.push(buffer);
        }
        else {
            buffer = new Buffer([0xff, 0x55, 0xff, 0xff, 0xff, 0xff, 0x0a]);
            if (this.isSend) {
                this.isSend = false;
                this.sendBuffers.push(buffer);
            }
            /* 당장은 없어도 괜찮음
            else if (Date.now() - this.pre_time > interval) {
                this.pre_time = Date.now();
                this.sendBuffers.push(buffer);
            }
            */
        }
    }
    // recentCheckData 리스트에 있는 경우 true 반환 아니면 false
    isRecentData(port, type, data) {
        let isRecent = false;

        if (port in this.recentCheckData) {
            if (this.recentCheckData[port].type === type && this.recentCheckData[port].data === data) {
                isRecent = true;
            }
        }
        return isRecent;
    }

    updateTerminalBuffer(port) {
        if (this.recentCheckData[port].data === 0) {
            this.terminal[port] = 238;
        }
        else {
            this.terminal[port] = this.recentCheckData[port].data;
        }
    }
    makeOutputBuffer(dataType, data) {
        let buffer;
        if (dataType == this.controlTypes.STRING) {
            buffer = new Buffer(data);
        }
        else if (dataType == this.controlTypes.DIGITAL) {
            buffer = new Buffer([
                0xff,
                0x55,
                this.terminal[0],
                this.terminal[1],
                this.terminal[2],
                this.terminal[3],
                0x0a
            ]);
        }
        else {
        }
        return buffer;
    }
    // '\r\n' 을 기준으로 버퍼를 자른다
    getDataByBuffer(buffer) {
        let datas = [];
        let lastIndex = 0;
        buffer.forEach(function (value, idx) {
            if (value == 13 && buffer[idx + 1] == 10) {
                datas.push(buffer.subarray(lastIndex, idx));
                lastIndex = idx + 2;
            }
        });
        return datas;
    }
    // 연결 해제되면 시리얼 포트 제거
    disconnect(connect) {
        const spClose = this.paroduleClose;
        if (this.sp) {
            this.sp.write(spClose, () => {
                this.sp.drain(() => {
                    connect.close();
                    this.isConnect = false;
                })
            })
        }
    }
    // 리셋
    reset() {
    }
}
module.exports = new Parodule();