function Module() {
    this.sp = null;
    this.sensorTypes = {
        ALIVE: 0,
        DIGITAL: 1,
        ANALOG: 2,
        PWM: 3,
        PULSEIN: 6,
        TIMER: 8,
        OLED_ADDR: 23,
        OLED_TEXT: 24,
        OLED_CLEAR: 25,
        OLED_SMILE: 26,
        OLED_SAD: 27,
        OLED_ANGRY: 28,
        OLED_ANIM_STAR: 29,      // 별 떨어지기 애니메이션
        OLED_ANIM_FLOWER: 30,    // 꽃송이 떨어지기 애니메이션
        OLED_ANIM_SNOW: 31,      // 눈송이 떨어지기 애니메이션
        OLED_ANIM_STOP: 32,      // 애니메이션 정지
    };

    this.actionTypes = {
        GET: 1,
        SET: 2,
        RESET: 3,
    };

    this.sensorValueSize = {
        FLOAT: 2,
        SHORT: 3,
    };

    this.digitalPortTimeList = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    this.sensorData = {
        DIGITAL: {
            '0': 0,
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0,
            '6': 0,
            '7': 0,
            '8': 0,
            '9': 0,
            '10': 0,
            '11': 0,
            '12': 0,
            '13': 0,
        },
        ANALOG: {
            '0': 0,
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0,
        },
        PULSEIN: {},
        TIMER: 0,
        OLED_ADDR: 0,
    };

    this.defaultOutput = {};

    this.recentCheckData = {};

    this.sendBuffers = [];

    this.lastTime = 0;
    this.lastSendTime = 0;
    this.isDraing = false;
}

let sensorIdx = 0;

Module.prototype.init = function(handler, config) {};

Module.prototype.setSerialPort = function(sp) {
    const self = this;
    this.sp = sp;
};

Module.prototype.requestInitialData = function() {
    return this.makeSensorReadBuffer(this.sensorTypes.ANALOG, 0);
};

Module.prototype.checkInitialData = function(data, config) {
    return true;
    // 이후에 체크 로직 개선되면 처리
    // var datas = this.getDataByBuffer(data);
    // var isValidData = datas.some(function (data) {
    //     return (data.length > 4 && data[0] === 255 && data[1] === 85);
    // });
    // return isValidData;
};

Module.prototype.afterConnect = function(that, cb) {
    that.connected = true;
    if (cb) {
        cb('connected');
    }
};

Module.prototype.validateLocalData = function(data) {
    return true;
};

// 엔트리로 전달할 데이터
Module.prototype.requestRemoteData = function(handler) {
    const self = this;
    if (!self.sensorData) {
        return;
    }
    Object.keys(this.sensorData).forEach((key) => {
        if (self.sensorData[key] != undefined) {
            handler.write(key, self.sensorData[key]);
        }
    });
};

Module.prototype.handleRemoteData = function(handler) {
    const self = this;
    const getDatas = handler.read('GET');
    const setDatas = handler.read('SET') || this.defaultOutput;
    const time = handler.read('TIME');
    let buffer = new Buffer([]);

    if (getDatas) {
        const keys = Object.keys(getDatas);
        keys.forEach((key) => {
            let isSend = false;
            const dataObj = getDatas[key];
            if (
                typeof dataObj.port === 'string' ||
                typeof dataObj.port === 'number'
            ) {
                const time = self.digitalPortTimeList[dataObj.port];
                if (dataObj.time > time) {
                    isSend = true;
                    self.digitalPortTimeList[dataObj.port] = dataObj.time;
                }
            } else if (Array.isArray(dataObj.port)) {
                isSend = dataObj.port.every((port) => {
                    const time = self.digitalPortTimeList[port];
                    return dataObj.time > time;
                });

                if (isSend) {
                    dataObj.port.forEach((port) => {
                        self.digitalPortTimeList[port] = dataObj.time;
                    });
                }
            }

            if (isSend) {
                if (!self.isRecentData(dataObj.port, key, dataObj.data)) {
                    self.recentCheckData[dataObj.port] = {
                        type: key,
                        data: dataObj.data,
                    };
                    buffer = Buffer.concat([
                        buffer,
                        self.makeSensorReadBuffer(
                            key,
                            dataObj.port,
                            dataObj.data,
                        ),
                    ]);
                }
            }
        });
    }

    if (setDatas) {
        const setKeys = Object.keys(setDatas);
        setKeys.forEach((port) => {
            const data = setDatas[port];
            if (data) {
                if (self.digitalPortTimeList[port] < data.time) {
                    self.digitalPortTimeList[port] = data.time;

                    if (!self.isRecentData(port, data.type, data.data)) {
                        self.recentCheckData[port] = {
                            type: data.type,
                            data: data.data,
                        };
                        buffer = Buffer.concat([
                            buffer,
                            self.makeOutputBuffer(data.type, port, data.data),
                        ]);
                    }
                }
            }
        });
    }

    if (buffer.length) {
        this.sendBuffers.push(buffer);
    }
};

Module.prototype.isRecentData = function(port, type, data) {
    const that = this;
    let isRecent = false;

    // OLED 표정 및 애니메이션 타입은 항상 허용 (반복 블록에서 계속 호출 가능하도록)
    if (type == this.sensorTypes.OLED_SMILE || 
        type == this.sensorTypes.OLED_SAD ||
        type == this.sensorTypes.OLED_ANGRY ||
        type == this.sensorTypes.OLED_ANIM_STAR ||
        type == this.sensorTypes.OLED_ANIM_FLOWER ||
        type == this.sensorTypes.OLED_ANIM_SNOW ||
        type == this.sensorTypes.OLED_ANIM_STOP) {
        return false;
    }

    if (type == this.sensorTypes.ULTRASONIC) {
        const portString = port.toString();
        let isGarbageClear = false;
        Object.keys(this.recentCheckData).forEach((key) => {
            const recent = that.recentCheckData[key];
            if (key === portString) {
                
            }
            if (key !== portString && recent.type == that.sensorTypes.ULTRASONIC) {
                delete that.recentCheckData[key];
                isGarbageClear = true;
            }
        });

        if ((port in this.recentCheckData && isGarbageClear) || !(port in this.recentCheckData)) {
            isRecent = false;
        } else {
            isRecent = true;
        }
    } else if (port in this.recentCheckData && type != this.sensorTypes.TONE) {
        if (
            this.recentCheckData[port].type === type &&
            this.recentCheckData[port].data === data
        ) {
            isRecent = true;
        }
    }

    return isRecent;
};

Module.prototype.requestLocalData = function() {
    const self = this;

    if (!this.isDraing && this.sendBuffers.length > 0) {
        this.isDraing = true;
        this.sp.write(this.sendBuffers.shift(), () => {
            if (self.sp) {
                self.sp.drain(() => {
                    self.isDraing = false;
                });
            }
        });
    }

    return null;
};

// 하드웨어에서 온 데이터 처리 로직
/*
ff 55 idx size data a
*/
Module.prototype.handleLocalData = function(data) {
    const self = this;
    const datas = this.getDataByBuffer(data);

    datas.forEach((data) => {
        if (data.length <= 4 || data[0] !== 255 || data[1] !== 85) {
            return;
        }
        const readData = data.subarray(2, data.length);

        let value;
        switch (readData[0]) {
            case self.sensorValueSize.FLOAT: {
                value = new Buffer(readData.subarray(1, 5)).readFloatLE();
                value = Math.round(value * 100) / 100;
                break;
            }
            case self.sensorValueSize.SHORT: {
                value = new Buffer(readData.subarray(1, 3)).readInt16LE();
                break;
            }
            default: {
                value = 0;
                break;
            }
        }

        const type = readData[readData.length - 1];
        const port = readData[readData.length - 2];

        

        
        switch (type) {
            case self.sensorTypes.DIGITAL: {
                self.sensorData.DIGITAL[port] = value;
                break;
            }
            case self.sensorTypes.ANALOG: {
                self.sensorData.ANALOG[port] = value;
                break;
            }
            case self.sensorTypes.PULSEIN: {
                self.sensorData.PULSEIN[port] = value;
                break;
            }
            case self.sensorTypes.TIMER: {
                self.sensorData.TIMER = value;
                break;
            }
            case self.sensorTypes.OLED_ADDR: {
                const intValue = Math.round(value);
                // 주소 값 범위(1~90)일 때만 hex로 표시
                if (intValue >= 1 && intValue <= 90) {
                    const hexValue = `0x${intValue.toString(16).toUpperCase().padStart(2, '0')}`;
                    console.log('[OLED Init Status]', value, `(${hexValue})`);
                } else if (intValue === 300) {
                    // 웃는얼굴 호출 시작
                    console.log('[OLED Smile] drawSmileFace start');
                } else if (intValue === 301) {
                    // 웃는얼굴 호출 완료
                    console.log('[OLED Smile] drawSmileFace end');
                } else if (intValue === 310) {
                    // 슬픈표정 호출 시작
                    console.log('[OLED Sad] drawSadFace start');
                } else if (intValue === 311) {
                    // 슬픈표정 호출 완료
                    console.log('[OLED Sad] drawSadFace end');
                } else {
                    console.log('[OLED Init Status]', value);
                }
                self.sensorData.OLED_ADDR = value;
                break;
            }
            default: {
                break;
            }
        }
    });
};

/*
ff 55 len idx action device port  slot  data a
0  1  2   3   4      5      6     7     8
*/

Module.prototype.makeSensorReadBuffer = function(device, port, data) {
    let buffer;
    const dummy = new Buffer([10]);

    if (!data) {
        buffer = new Buffer([
            255,
            85,
            5,
            sensorIdx,
            this.actionTypes.GET,
            device,
            port,
            10,
        ]);
    } else {
        const value = new Buffer(2);
        value.writeInt16LE(data);
        buffer = new Buffer([
            255,
            85,
            7,
            sensorIdx,
            this.actionTypes.GET,
            device,
            port,
            10,
        ]);
        buffer = Buffer.concat([buffer, value, dummy]);
    }
    sensorIdx++;
    if (sensorIdx > 254) {
        sensorIdx = 0;
    }

    return buffer;
};

//0xff 0x55 0x6 0x0 0x1 0xa 0x9 0x0 0x0 0xa
Module.prototype.makeOutputBuffer = function(device, port, data) {
    let buffer;
    const value = new Buffer(2);
    const dummy = new Buffer([10]);

    switch (device) {
        case this.sensorTypes.DIGITAL:
        case this.sensorTypes.PWM: 
        case this.sensorTypes.OLED_ADDR:
        case this.sensorTypes.OLED_CLEAR:
        case this.sensorTypes.OLED_SMILE:
        case this.sensorTypes.OLED_SAD:
        case this.sensorTypes.OLED_ANGRY:
        case this.sensorTypes.OLED_ANIM_STOP:
        {
            value.writeInt16LE(data);

            buffer = new Buffer([
                255,
                85,
                6,
                sensorIdx,
                this.actionTypes.SET,
                device,
                port,
            ]);
            buffer = Buffer.concat([buffer, value, dummy]);
            break;
        }
        case this.sensorTypes.OLED_ANIM_STAR:
        case this.sensorTypes.OLED_ANIM_FLOWER:
        case this.sensorTypes.OLED_ANIM_SNOW:
        {
            // 애니메이션: count(개수)와 speed(속도) 전송
            let count = 10;  // 기본값
            let speed = 3;   // 기본값
            
            if (data && typeof data === 'object') {
                count = data.count || 10;
                speed = data.speed || 3;
            }

            const countBuf = new Buffer(2);
            const speedBuf = new Buffer(2);
            
            countBuf.writeInt16LE(count);
            speedBuf.writeInt16LE(speed);


            buffer = new Buffer([
                255,
                85,
                // payload len: idx+action+device+port+count(2)+speed(2)+dummy
                10,
                sensorIdx,
                this.actionTypes.SET,
                device,
                port,
            ]);
            
            buffer = Buffer.concat([buffer, countBuf, speedBuf, dummy]);
            break;
        }
        case this.sensorTypes.OLED_TEXT:
        {
            let textLen = 0;
            let text;
            let x = 0;
            let y = 0;
            let size = 1;
            
            if (data && typeof data === 'object' && data.value !== undefined) {
                textLen = ('' + `${data.value}`).length;
                text = Buffer.from('' + `${data.value}`, 'ascii');
                x = data.x || 0;
                y = data.y || 0;
                size = data.size || 1;
            } else {
                textLen = 0;
                text = Buffer.from('', 'ascii');
            }

            // 텍스트 길이 제한 (OLED 화면 크기 고려)
            if (textLen > 50) {
                textLen = 50;
                text = text.subarray(0, 50);
            }

            const xPos = new Buffer(2);
            const yPos = new Buffer(2);
            const textSize = new Buffer(2);
            const val = new Buffer(2);
            
            xPos.writeInt16LE(x);
            yPos.writeInt16LE(y);
            textSize.writeInt16LE(size);
            val.writeInt16LE(textLen);

            buffer = new Buffer([
                255,
                85,
                14 + textLen,
                sensorIdx,
                this.actionTypes.SET,
                device,
                port,
            ]);
            
            buffer = Buffer.concat([buffer, xPos, yPos, textSize, val, text, dummy]);
            break;
        }
    }

    return buffer;
};

Module.prototype.getDataByBuffer = function(buffer) {
    const datas = [];
    let lastIndex = 0;
    buffer.forEach((value, idx) => {
        if (value == 13 && buffer[idx + 1] == 10) {
            datas.push(buffer.subarray(lastIndex, idx));
            lastIndex = idx + 2;
        }
    });

    return datas;
};

// 하드웨어 연결 해제 시 호출
Module.prototype.disconnect = function(connect) {
    const self = this;
    connect.close();
    if (self.sp) {
        delete self.sp;
    }
};

// 엔트라와의 연결 종료 후 처리 코드
Module.prototype.reset = function() {
    this.lastTime = 0;
    this.lastSendTime = 0;

    this.sensorData.PULSEIN = {};
};

module.exports = new Module();
