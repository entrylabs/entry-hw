function Module() {
    this.sp = null;
    this.sensorTypes = {
        ALIVE: 0,
        DIGITAL: 1,
        ANALOG: 2,
        PWM: 3,
        SERVO_PIN: 4,
        TONE: 5,
        TIMER: 7,
        RGB_LED: 8,
        BUZZER: 9,
        DOT_MATRIX: 10,
        GAS_SENSOR: 11,
        MAGNETIC_SENSOR: 12,
        SOUND_SENSOR: 13,
        TEMP_SENSOR: 14,
        PIR_SENSOR: 15,
        MOTOR_FAN: 16,
        BUTTON_SENSOR: 17,

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

    this.digitalPortTimeList = new Array(14).fill(0);
    this.sensorData = {
        DIGITAL: {},
        ANALOG: {},
        TIMER: 0,
    };
    this.defaultOutput = {};
    this.recentCheckData = {};
    this.sendBuffers = [];
    this.isDraing = false;
}

var sensorIdx = 0;

Module.prototype.init = function(handler, config) {};

Module.prototype.setSerialPort = function(sp) {
    this.sp = sp;
};

Module.prototype.requestInitialData = function() {
    // 핸드셰이크 요청: 0xff 0x55 0x04 0x00 0x01 0x00
    return Buffer.from([0xff, 0x55, 0x04, 0x00, this.actionTypes.GET, this.sensorTypes.ALIVE]);
    console.log('Handshake request sent:', buffer);
    return buffer;
    
};

Module.prototype.checkInitialData = function(data, config) {
    console.log('Handshake response received:', data);
    // 데이터가 0xff 0x55로 시작하고 ALIVE 응답인지 확인
    return data.length > 2 && data[0] === 0xff && data[1] === 0x55;
};
0
Module.prototype.afterConnect = function(that, cb) {
    that.connected = true;
    if (cb) {
        cb('connected');
    }
};

Module.prototype.validateLocalData = function(data) {
    return true;
};

Module.prototype.requestRemoteData = function(handler) {
    Object.keys(this.sensorData).forEach((key) => {
        handler.write(key, this.sensorData[key]);
    });
};

Module.prototype.handleRemoteData = function(handler) {
    const getDatas = handler.read('GET');
    const setDatas = handler.read('SET') || this.defaultOutput;
    let buffer = Buffer.alloc(0);

    if (getDatas) {
        Object.keys(getDatas).forEach((key) => {
            const dataObj = getDatas[key];
            if (dataObj.port !== undefined && this.isNewData(dataObj.port, key, dataObj.data)) {
                this.recentCheckData[dataObj.port] = {
                    type: key,
                    data: dataObj.data,
                };
                buffer = Buffer.concat([
                    buffer,
                    this.makeSensorReadBuffer(key, dataObj.port, dataObj.data),
                ]);
            }
        });
    }

    if (setDatas) {
        Object.keys(setDatas).forEach((port) => {
            const data = setDatas[port];
            if (data && this.isNewData(port, data.type, data.data)) {
                this.recentCheckData[port] = {
                    type: data.type,
                    data: data.data,
                };
                buffer = Buffer.concat([
                    buffer,
                    this.makeOutputBuffer(data.type, port, data.data),
                ]);
            }
        });
    }

    if (buffer.length) {
        this.sendBuffers.push(buffer);
    }
};

Module.prototype.isNewData = function(port, type, data) {
    return (
        !(port in this.recentCheckData) ||
        this.recentCheckData[port].type !== type ||
        this.recentCheckData[port].data !== data
    );
};

Module.prototype.requestLocalData = function() {
    if (!this.isDraing && this.sendBuffers.length > 0) {
        this.isDraing = true;
        this.sp.write(this.sendBuffers.shift(), () => {
            this.sp.drain(() => {
                this.isDraing = false;
            });
        });
    }
    return null;
};

Module.prototype.handleLocalData = function(data) {
    const datas = this.getDataByBuffer(data);

    datas.forEach((data) => {
        if (!data || data.length <= 4 || data[0] !== 255 || data[1] !== 85) {
            return; // 잘못된 데이터 무시
        }
        const readData = data.subarray(2, data.length);

        // 데이터 길이 확인
        if (
            (readData[0] === this.sensorValueSize.FLOAT && readData.length < 5) ||
            (readData[0] === this.sensorValueSize.SHORT && readData.length < 3)
        ) {
            console.error("Incomplete buffer received:", readData);
            return;
        }

        let value;
        try {
            switch (readData[0]) {
                case this.sensorValueSize.FLOAT:
                    value = readData.readFloatLE(1);
                    break;
                case this.sensorValueSize.SHORT:
                    value = readData.readInt16LE(1);
                    break;
                default:
                    value = 0;
                    break;
            }
        } catch (err) {
            console.error("Error reading buffer:", err);
            return; // 버퍼 읽기 오류 처리
        }

        const type = readData[readData.length - 1];
        const port = readData[readData.length - 2];

        // 데이터 타입별 처리
        switch (type) {
            case this.sensorTypes.BUZZER:
                break;

            case this.sensorTypes.DIGITAL:
                this.sensorData.DIGITAL[port] = value;
                break;

            case this.sensorTypes.ANALOG:
                this.sensorData.ANALOG[port] = value;
                break;

            case this.sensorTypes.TIMER:
                this.sensorData.TIMER = value;
                break;
            case this.sensorTypes.BUTTON_SENSOR: {
                // BUTTON_SENSOR 추가 처리
                this.sensorData.BUTTON_SENSOR = this.sensorData.BUTTON_SENSOR || {};
                this.sensorData.BUTTON_SENSOR[port] = value; // 버튼 상태 저장 (0 또는 1)
                break;
            }



            case this.sensorTypes.SOUND_SENSOR:
            case this.sensorTypes.GAS_SENSOR:
            case this.sensorTypes.TEMP_SENSOR: {
                const sensorValue = value; // 센서의 현재 값
                const triggerValue = readData.readInt16LE(1); // 트리거 값
                this.sensorData.ANALOG[port] = sensorValue; // Entry에 값 송신
                if (sensorValue >= triggerValue) {
                    digitalWrite(port, HIGH); // 트리거 값 이상 시 HIGH
                } else {
                    digitalWrite(port, LOW); // 트리거 값 미만 시 LOW
                }
                break;
            }

            case this.sensorTypes.ALIVE:
                console.log("Handshake successful");
                break;



            default:
                console.error("Unknown type received:", type);
                break;
        }
    });
};



Module.prototype.makeSensorReadBuffer = function(device, port, data) {
    const dummy = Buffer.from([10]);
    let buffer;

    switch (device) {
        case this.sensorTypes.SOUND_SENSOR: { // 사운드 센서 추가
            buffer = Buffer.from([255, 85, 5, sensorIdx, this.actionTypes.GET, device, port, 10]);
            break;
        }
        default: {
            if (!data) {
                buffer = Buffer.from([255, 85, 5, sensorIdx, this.actionTypes.GET, device, port, 10]);
            } else {
                const value = Buffer.alloc(2);
                value.writeInt16LE(data);
                buffer = Buffer.from([255, 85, 7, sensorIdx, this.actionTypes.GET, device, port]);
                buffer = Buffer.concat([buffer, value, dummy]);
            }
        }
    }
    sensorIdx = (sensorIdx + 1) % 255;
    return buffer;
};

Module.prototype.makeOutputBuffer = function(device, port, data) {
    const dummy = Buffer.from([10]);
    let buffer;
    switch (device) {

        case this.sensorTypes.DIGITAL:
        case this.sensorTypes.PWM:
        case this.sensorTypes.RGB_LED: {
            const value = Buffer.alloc(2);
            value.writeInt16LE(data);
            buffer = Buffer.from([255, 85, 6, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, value, dummy]);
            break;
        }
        case this.sensorTypes.DOT_MATRIX: {

            const matrixData = Buffer.from(data); 
            buffer = Buffer.from([
                255, 85, 8 + matrixData.length, 
                sensorIdx,                      
                this.actionTypes.SET,           
                device,                         
                port,                           
            ]);
            buffer = Buffer.concat([buffer, matrixData, dummy]); 
            break;
        }

        case this.sensorTypes.SERVO_PIN: { 
            const value = Buffer.alloc(2);
            value.writeInt16LE(data); 
            buffer = Buffer.from([255, 85, 6, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, value, dummy]);
            break;
        }
        case this.sensorTypes.MOTOR_FAN: { 
            const speed = Buffer.alloc(1);
            speed.writeUInt8(data.speed); 
        
            const direction = Buffer.alloc(1);
            direction.writeUInt8(data.direction); 
        
            buffer = Buffer.from([255, 85, 7, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, speed, direction, dummy]);
            break;
        }
        case this.sensorTypes.BUZZER:
    const noteIndex = data.noteIndex;
    const octave = data.octave;
    const duration = Buffer.alloc(2);
    duration.writeInt16LE(data.duration);

    buffer = Buffer.from([255, 85, 8, sensorIdx, this.actionTypes.SET, device, port]);
    buffer = Buffer.concat([buffer, Buffer.from([noteIndex, octave]), duration, dummy]);
    break;
        case this.sensorTypes.TONE:
            const value = Buffer.alloc(2);
            const time = Buffer.alloc(2);
            value.writeInt16LE(data.value);
            time.writeInt16LE(data.duration);
            buffer = Buffer.from([255, 85, 8, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, value, time, dummy]);
            break;
        default:
            buffer = Buffer.alloc(0);
            break;
    }
    sensorIdx = (sensorIdx + 1) % 255;
    return buffer;
};

Module.prototype.getDataByBuffer = function(buffer) {
    const datas = [];
    let lastIndex = 0;

    buffer.forEach((value, idx) => {
        if (value === 0x0D && buffer[idx + 1] === 0x0A) { 
            const data = buffer.subarray(lastIndex, idx); 
            if (data[0] === 0xFF && data[1] === 0x55) {   
                datas.push(data);
            }
            lastIndex = idx + 2; 
        }
    });

    return datas; 
};


Module.prototype.disconnect = function(connect) {
    connect.close();
    if (this.sp) {
        delete this.sp;
    }
};

Module.prototype.reset = function() {
    this.sensorData = {
        DIGITAL: {},
        ANALOG: {},
        TIMER: 0,
    };
    this.recentCheckData = {};
    this.sendBuffers = [];
};

module.exports = new Module();
