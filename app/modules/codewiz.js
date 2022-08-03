const BaseModule = require('./baseModule');

class CodeWiz extends BaseModule {
    constructor() {
        super();
        this.receiveType = {
            SENSOR_TYPE1: 0,
            SENSOR_TYPE2: 1,
            HUSKY_RESULTS: 2,
            BOOLEAN: 3,
            INT: 4,
            FLOAT: 5,
            RUN_OK: 6,
        };

        this.sendBuffers = [];
        this.recvBuffers = [];

        this.defaultSensorList = ['SOUND', 'LIGHT', 'DIST', 'HALL'];
        this.defaultSensorList2 = [
            'touchPin_13',
            'touchPin_14',
            'touchPin_15',
            'touchPin_27',
            'touchPin_32',
            'touchPin_33',
            'switchButton_4',
            'switchButton_26',
            'GYRO_X',
            'GYRO_Y',
            'GYRO_Z',
            'tempSensor',
        ];
        this.sensorData = {
            SOUND: 0,
            LIGHT: 0,
            DIST: 0,
            HALL: 0,
            touchPin_13: 0,
            touchPin_14: 0,
            touchPin_15: 0,
            touchPin_27: 0,
            touchPin_32: 0,
            touchPin_33: 0,
            switchButton_4: 0,
            switchButton_26: 0,
            tempSensor: 0.0,
            GYRO_X: 0,
            GYRO_Y: 0,
            GYRO_Z: 0,
            HUSKY_READ:{
                _type:0,
                _count:0,
                _list:[],
            },
        };
        this.isDraing = false;
        this.isFirst = true;
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

    /*
    연결 후 초기에 송신할 데이터가 필요한 경우 사용합니다.
    requestInitialData 를 사용한 경우 checkInitialData 가 필수입니다.
    이 두 함수가 정의되어있어야 로직이 동작합니다. 필요없으면 작성하지 않아도 됩니다.
    */
    requestInitialData(sp) {
        this.sp = sp;
        this.sp.binding.openOptions.hupcl=false;
        // reset
        // this.sp.set({ dtr: false, rts: true });
        // this.sp.set({ dtr: false, rts: false });
        this.connectApp0();
        return true;
    }
    __sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async connectApp0() {
        const runApp0=[0xC0,0x00,0xE0,0x00,0x00,0x00,0x00,0x00,0x00,0xC0];
        console.log('this.sp:',this.sp);
        // FactoryApp 진입
        this.sp.set({ dtr: false, rts: true });
        await this.__sleep(200);
        this.sp.set({ dtr: true, rts: false });
        await this.__sleep(800);
        this.sp.set({ dtr: false, rts: false });
        await this.__sleep(1000);

        this.sp.write(runApp0);
    }
    // 연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
    checkInitialData(data, config) {
        // this.connectApp0();
        return true;
    }

    // 주기적으로 하드웨어에서 받은 데이터의 검증이 필요한 경우 사용합니다.
    validateLocalData(data) {
        return true;
    }

    // afterConnect(that, cb) {
    //     that.connected = true;
    //     if (cb) {
    //         cb('connected');
    //     }
    // }

    // 연결이 끊겼을 때, 핸들러
    // self에는 SerialConnector가 있음
    // self.hwModule 은 this와 같은?듯
    lostController(self, callback) {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.timer = setInterval(() => {
            if (this.sp?.isOpen === false) {
                callback('lost');
                clearInterval(this.timer);
            }
        }, 1122);
    }

    // 펌웨어 업로드시 lostController에서 체크하는게 안불리려면
    // 업로드 전에 mainRouter.stopScan이 불리므로 거기서 disconnect를 호출하니까
    // 여기서 타이머를 초기화해주면 될?듯
    disconnect(connect) {
        connect.close();
        this.sendBuffers = [];
        this.recvBuffers = [];
        this.isDraing = false;
        this.sp = null;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    /**
     * 엔트리에서 받은 데이터에 대한 처리
     * @param {*} handler
     */
    handleRemoteData(handler) {
        const isReset = handler.serverData.RESET;
        if (isReset === 1) {
            this.sp.write([254, 255, 3, 1, 0]);
            return;
        }
        const orderData = handler.serverData.ORDER;

        let buffer = null;
        if (orderData) {
            // this.handler.write('runOK', false);
            const keys = Object.keys(orderData);
            keys.forEach((id) => {
                const data = orderData[id];
                if (data) {
                    buffer = this.makeSendMessage(data.type, data.value);
                    if (buffer?.length > 0) {
                        this.sendBuffers.push(buffer);
                        this.curId = id;
                        // this.handler.write(id, {value:null});

                        // console.log('this.sendBuffers', this.sendBuffers);
                    }
                }
            });
        }
    }
    processData(dataArr) {
        let retVal = [];
        for (let i = 0; i < dataArr.length; ++i) {
            retVal.push(...this.strToAscii('' + dataArr[i]));
        }
        return retVal;
    }
    strToAscii(str) {
        if (!str) {
            return [];
        }
        // let ret = [str.length];
        let ret = [];
        for (let i = 0; i < str.length; ++i) {
            // ret.push(str[i].charCodeAt());
            let c = str[i].charCodeAt();
            if (c > 0xff) {
                ret.push(0x08, c >> 8, c & 0xff);
            } else {
                ret.push(c);
            }
        }
        ret.unshift(ret.length);
        return ret;
    }

    makeSendMessage(type, data) {
        if (!$.isPlainObject(data)) {
            return null;
        }
        let buffer = this.addHeader(type, [data.opcode, ...this.processData(data.params)]);

        return buffer;
    }
    addHeader(actionType, data) {
        return [254, 255, data.length + 2, actionType, ...data];
    }

    /*
    하드웨어 기기에 전달할 데이터를 반환합니다.
    slave 모드인 경우 duration 속성 간격으로 지속적으로 기기에 요청을 보냅니다.
    */
    requestLocalData() {
        if (!this.isDraing && this.sendBuffers.length > 0) {
            this.isDraing = true;
            this.sp.write(this.sendBuffers.shift(), () => {
                if (this.sp) {
                    this.sp.drain(() => {
                        this.isDraing = false;
                    });
                }
            });
        }
        return null;
    }
    getDataByBuffer(buffer) {
        this.recvBuffers.push(...buffer);
        let datas = [];
        let lastIdx = 0;
        this.recvBuffers.forEach((value, idx, d) => {
            if (value === 0xff && d[idx + 1] === 0xfe) {
                lastIdx = idx + 2 + d[idx + 2];
                datas.push(d.slice(idx + 2, lastIdx));
            }
        });
        this.recvBuffers.splice(0, lastIdx);
        return datas;
    }
    /**
     * 하드웨어에서 온 데이터 처리
     * @param {*} data
     */
    handleLocalData(data) {
        const datas = this.getDataByBuffer(data);

        datas.forEach((readData) => {
            let value;
            switch (readData[1]) {
                case this.receiveType.SENSOR_TYPE1: {
                    for (let i = 1; 2 * i < readData.length; ++i) {
                        value = (readData[i * 2] << 8) | readData[i * 2 + 1];
                        if (i === 3) {
                            if (value < 3000) {
                                this.sensorData.DIST = value;
                            }
                        } else if (i === 4) {
                            this.sensorData.HALL = value - 300;
                        } else {
                            this.sensorData[this.defaultSensorList[i - 1]] = value;
                        }
                    }
                    this.shouldUpdateSensor1 = true;
                    return;
                }
                case this.receiveType.SENSOR_TYPE2: {
                    let _value;
                    for (let i = 0; i < 8; ++i) {
                        _value = (readData[2] >> i) & 1; //===0? 0:1;
                        this.sensorData[this.defaultSensorList2[i]] = _value === 1;
                    }
                    for (let i = 8; i < 8 + 3; ++i) {
                        _value = readData[i - 5];
                        if (_value <= 180) {
                            this.sensorData[this.defaultSensorList2[i]] = _value - 90;
                        }
                    }
                    //temperature
                    _value = (readData[6] << 8) | readData[7];
                    _value -= 400;
                    _value /= 10.0;
                    if (_value < 81) {
                        this.sensorData[this.defaultSensorList2[11]] = _value;
                    }
                    this.shouldUpdateSensor2 = true;
                    return;
                }
                case this.receiveType.HUSKY_RESULTS: {
                    this.sensorData.HUSKY_READ._type = readData[2];
                    this.sensorData.HUSKY_READ._count = readData[3];
                    this.sensorData.HUSKY_READ._list = [];
                    for (let i = 0; i < readData[3]; ++i) {
                        this.sensorData.HUSKY_READ._list.push([
                            readData[9 * i + 4],
                            readData[9 * i + 5] << 8 | readData[9 * i + 6],
                            readData[9 * i + 7] << 8 | readData[9 * i + 8],
                            readData[9 * i + 9] << 8 | readData[9 * i + 10],
                            readData[9 * i + 11] << 8 | readData[9 * i + 12],
                        ]);
                    }
                    this.shouldUpdateHusky = true;
                    return;
                }
                case this.receiveType.RUN_OK: {
                    this.handler.write(this.curId, { value: 'runOK' });
                    return;
                }
                case this.receiveType.BOOLEAN: {
                    this.handler.write(this.curId, { value: readData[2] === 1 });
                    return;
                }
                case this.receiveType.INT: {
                    let _sign = readData[2] === 1;
                    let _value = (readData[3] << 8) | readData[4];
                    if (_sign) {
                        _value *= -1;
                    }
                    this.handler.write(this.curId, { value: _value });
                    return;
                }
                case this.receiveType.FLOAT: {
                    let _sign = readData[2] & 0x80; // -: 1, +:0
                    let firstData = readData[2] & 0x7f;
                    let _value = (firstData << 8) | readData[3];
                    if (_sign === 1) {
                        _value *= -1;
                    }
                    _value /= 10;
                    this.handler.write(this.curId, { value: _value });
                    return;
                }
                default: {
                    return;
                }
            }
        });
    }

    /**
     * 엔트리로 전달할 데이터
     * @param {*} handler
     */
    requestRemoteData(handler) {
        if (this.isFirst || this.shouldUpdateSensor1) {
            this.defaultSensorList.forEach((value, index, arr) => {
                handler.write(value, this.sensorData[value]);
            });
            this.shouldUpdateSensor1 = false;
        }

        if (this.isFirst || this.shouldUpdateSensor2) {
            this.defaultSensorList2.forEach((value, index, arr) => {
                handler.write(value, this.sensorData[value]);
            });
            this.shouldUpdateSensor2 = false;
        }
        if (this.isFirst || this.shouldUpdateHusky) {
            handler.write("HUSKY_READ", this.sensorData.HUSKY_READ);
            this.shouldUpdateHusky = false;
        }
        this.isFirst = false;
    }
} // end CodeWiz

module.exports = new CodeWiz();
