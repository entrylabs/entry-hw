const BaseModule = require('./baseModule');

class CodeWiz extends BaseModule {
    constructor() {
        super();
        this.receiveType = {
            SENSOR_TYPE1: 0,
            SENSOR_TYPE2: 1,
            RUN_OK: 2,
            BOOLEAN: 3,
            UNSIGNED_INT: 4,
            FLOAT: 5,
        };
        this.orderTypes = {
            BUZZER: 1,
            NEOPIXEL: 2,
            OLED: 3,
            DIGITAL_OUTPUT: 4,
        };
        this.actionTypes = {
            READ: 1,
            RUN: 0,
        };
        this.sendBuffers = [];

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

            TIMER: 0,
            //ISRUN:1,
        };
        this.isDraing = false;
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
        sp.set({ dtr: false, rts: true });
        sp.set({ dtr: false, rts: false });
        return true;
    }

    // 연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
    checkInitialData(data, config) {
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
    // lostController(self, cb) {
    //     // console.log(this.sp);
    // }
    // setSerialPort(sp) {
    //     this.sp = sp;
    //     sp.set({ dtr: false, rts: true });
    //     sp.set({ dtr: false, rts: false });
    // }
    // disconnect(connect) {
    //     connect.close();
    //     if (this.sp) {
    //         delete this.sp;
    //     }
    // }
    /**
     * 엔트리에서 받은 데이터에 대한 처리
     * @param {*} handler
     */
    handleRemoteData(handler) {
        const isReset = handler.serverData.RESET;
        if (isReset === 1) {
            this.sp.write([254, 255, 3, 1, 0]);
            // this.handler.write('RESET', 0);
            return;
        }
        const getData = handler.serverData.GET;
        const setData = handler.serverData.SET;
        let buffer = null;
        if (getData) {
            this.handler.write('runOK', false);
            const keys = Object.keys(getData);
            keys.forEach((id) => {
                const data = getData[id];
                if (data) {
                    buffer = this.makeSendMessage(this.actionTypes.READ, data.value);
                }
            });
        } else if (setData) {
            this.handler.write('runOK', false);
            const keys = Object.keys(setData);
            keys.forEach((id) => {
                const data = setData[id];
                if (data) {
                    buffer = this.makeSendMessage(this.actionTypes.RUN, data.value);
                }
            });
        }

        if (buffer?.length > 0) {
            this.sendBuffers.push(buffer);
            console.log('this.sendBuffers', this.sendBuffers);
        }
    }
    processData(dataArr) {
        let retVal = [];
        // console.log('dataArr:', dataArr);
        for (let i = 0; i < dataArr.length; ++i) {
            retVal.push(...this.strToAscii('' + dataArr[i]));
        }
        return retVal;
    }
    strToAscii(str) {
        if (!str) {
            return [];
        }
        let ret = [str.length];
        for (let i = 0; i < str.length; ++i) {
            ret.push(str[i].charCodeAt());
        }
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
        let datas = [];
        let lastIndex = 0;
        buffer.forEach((value, idx) => {
            if (value == 13 && buffer[idx + 1] == 10) {
                datas.push(buffer.subarray(lastIndex, idx));
                lastIndex = idx + 2;
            }
        });
        return datas;
    }
    /**
     * 하드웨어에서 온 데이터 처리
     * @param {*} data
     */
    handleLocalData(data) {
        const datas = this.getDataByBuffer(data);

        datas.forEach((data) => {
            if (data.length < 4 || data[0] !== 0xff || data[1] !== 0x55) {
                return;
            }
            const readData = data.subarray(2, data.length);
            let value;
            switch (readData[0]) {
                case this.receiveType.SENSOR_TYPE1: {
                    for (let i = 0; 2 * i < readData.length; ++i) {
                        value = (readData[i * 2 + 1] << 8) | readData[i * 2 + 2];
                        if (i === 2) {
                            if (value < 3000) {
                                this.sensorData.DIST = value;
                            }
                        } else if (i === 3) {
                            this.sensorData[this.defaultSensorList[i]] = value - 300;
                        } else {
                            this.sensorData[this.defaultSensorList[i]] = value;
                        }
                    }
                    this.shouldUpdateSensor1 = true;
                    return;
                }
                case this.receiveType.SENSOR_TYPE2: {
                    let _value;
                    for (let i = 0; i < 8; ++i) {
                        _value = (readData[1] >> (i - 4)) & 1; //===0? 0:1;
                        this.sensorData[this.defaultSensorList2[i]] = _value === 1;
                    }
                    for (let i = 8; i < 8 + 3; ++i) {
                        _value = readData[i - 6];
                        if (_value <= 180) {
                            this.sensorData[this.defaultSensorList2[i]] = _value - 90;
                        }
                    }
                    //temperature
                    _value = (readData[5] << 8) | readData[6];
                    _value -= 400;
                    _value /= 10.0;
                    if (_value < 81) {
                        this.sensorData[this.defaultSensorList2[11]] = _value;
                    }
                    this.shouldUpdateSensor2 = true;
                    return;
                }
                // this.handler 쟁여둠
                // 펌웨어 바뀌어야함(?) 길이부분이 없다
                case this.receiveType.RUN_OK: {
                    if (readData[1] === 6) {
                        // 리턴값이 있는건 밸류에 다른 값을 넣자
                        this.handler.write('runOK', { value: 'runOK' });
                    }
                    break;
                }
                case this.receiveType.BOOLEAN: {
                    this.handler.write('runOK', { value: readData[1] === 1 });
                    break;
                }
                case this.receiveType.UNSIGNED_INT: {
                    let _value = (readData[1] << 8) | readData[2];
                    this.handler.write('runOK', { value: _value });
                    break;
                }
                default: {
                    break;
                }
            }
        });
    }

    /**
     * 엔트리로 전달할 데이터
     * @param {*} handler
     */
    requestRemoteData(handler) {
        if (this.shouldUpdateSensor1) {
            this.defaultSensorList.forEach((value, index, arr) => {
                handler.write(value, this.sensorData[value]);
            });
            this.shouldUpdateSensor1 = false;
        }

        if (this.shouldUpdateSensor2) {
            this.defaultSensorList2.forEach((value, index, arr) => {
                handler.write(value, this.sensorData[value]);
            });
            this.shouldUpdateSensor2 = false;
        }
    }
} // end CodeWiz

module.exports = new CodeWiz();
