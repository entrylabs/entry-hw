const BaseModule = require('./robotry');
var sensorIdx = 0;
class robitStage extends BaseModule {

    // 클래스 내부에서 사용될 필드들을 이곳에서 선언합니다.
    constructor() {
        super();
        this.sp = null;
        this.sensorTypes = {
            ALIVE: 0,
            DIGITAL: 1,
            ANALOG: 2,
            PWM: 3,
            SERVO_PIN: 4,
            TONE: 5,
            PULSEIN: 6,
            ULTRASONIC: 7,
            TIMER: 8,
        };
    }

    setSerialPort(sp){
        var self = this;
        this.sp = sp;
    };
    
    afterConnect(that, cb) {
        that.connected = true;
        if (cb) {
            cb('connected');
        }
    }
    
    /*
    하드웨어 기기에 전달할 데이터를 반환합니다.
    slave 모드인 경우 duration 속성 간격으로 지속적으로 기기에 요청을 보냅니다.
    */
    requestLocalData() {
        // 하드웨어로 보낼 데이터 로직
        var self = this;

        if (!this.isDraing && this.sendBuffers.length > 0) {
            this.isDraing = true;
            this.sp.write(this.sendBuffers.shift(), function() {
                if (self.sp) {
                    self.sp.drain(function() {
                        self.isDraing = false;
                    });
                }
            });
        }

        return 0;
    }

    // 하드웨어에서 온 데이터 처리 
    handleLocalData(data) {
        // 데이터 처리 로직
        var self = this;
        var datas = this.getDataByBuffer(data);

        datas.forEach(function(data) {
            if (data.length <= 4 || data[0] !== 255 || data[1] !== 85) {
                return;
            }
            var readData = data.subarray(2, data.length);
            var value;
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

            var type = readData[readData.length - 1];
            var port = readData[readData.length - 2];

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
                case self.sensorTypes.ULTRASONIC: {
                    self.sensorData.ULTRASONIC = value;
                    break;
                }
                case self.sensorTypes.TIMER: {
                    self.sensorData.TIMER = value;
                    break;
                }
                default: {
                    break;
                }
            }
        });
    }

    // 엔트리로 전달할 데이터
    requestRemoteData(handler) {
        var self = this;
        if (!self.sensorData) {
            return;
        }
        this.lastSendTime = this.lastTime;
        Object.keys(this.sensorData).forEach(function(key) {
            if (self.sensorData[key] != undefined) {
                handler.write(key, self.sensorData[key]);
                self.canSendData = false;
            }
        })
    }
    // 엔트리에서 받은 데이터에 대한 처리
    handleRemoteData(handler) {
        // const value = handler.read(key) ...
        var self = this;
        var getDatas = handler.read('GET');
        var setDatas = handler.read('SET') || this.defaultOutput;
        var resetDatas = handler.read('RESET');
        var time = handler.read('TIME');
        var buffer = new Buffer([]);

        if (getDatas) {
            var keys = Object.keys(getDatas);
            keys.forEach(function(key) {
                var isSend = false;
                var dataObj = getDatas[key];
                if (typeof dataObj.port === 'string' || typeof dataObj.port === 'number') {
                    var time = self.digitalPortTimeList[dataObj.port];
                    if (dataObj.time > time) {
                        isSend = true;
                        self.digitalPortTimeList[dataObj.port] = dataObj.time;
                    }
                } else if (Array.isArray(dataObj.port)) {
                    isSend = dataObj.port.every(function(port) {
                        var time = self.digitalPortTimeList[port];
                        return dataObj.time > time;
                    });

                    if (isSend) {
                        dataObj.port.forEach(function(port) {
                            self.digitalPortTimeList[port] = dataObj.time;
                        });
                    }
                }

                if (isSend) {
                    if (!self.isRecentData(dataObj.port, key, dataObj.data)) {
                        self.recentCheckData[dataObj.port] = {
                            type: key,
                            data: dataObj.data
                        }
                        buffer = Buffer.concat([buffer, self.makeSensorReadBuffer(key, dataObj.port, dataObj.data)]);
                    }
                }
            });
        }

        if (setDatas) {
            var setKeys = Object.keys(setDatas);
            setKeys.forEach(function(port) {
                var data = setDatas[port];
                if (data) {
                    if (self.digitalPortTimeList[port] < data.time) {
                        self.digitalPortTimeList[port] = data.time;

                        if (!self.isRecentData(port, data.type, data.data)) {
                            self.recentCheckData[port] = {
                                type: data.type,
                                data: data.data
                            }
                            buffer = Buffer.concat([buffer, self.makeOutputBuffer(data.type, port, data.data)]);
                        }
                    }
                }
            });
        }

        if (buffer.length) {
            this.sendBuffers.push(buffer);
        }
    }

    // recentCheckData 리스트에 있는 경우 true 반환 아니면 false
    isRecentData(port, type, data) {
        var isRecent = false;

        if (port in this.recentCheckData) {
            if (type != this.sensorTypes.TONE && this.recentCheckData[port].type === type && this.recentCheckData[port].data === data) {
                isRecent = true;
            }
        }

        return isRecent;
    }
    
    /*
    GET인 경우 SensorType 에 따라 버퍼를 생성
    ff 55 len idx action device port  slot  data a
    0  1  2   3   4      5      6     7     8
    */
    makeSensorReadBuffer(device, port, data) {
        var buffer;
        var dummy = new Buffer([10]);
        if (device == this.sensorTypes.ULTRASONIC) {
            buffer = new Buffer([
                255,
                85,
                6,
                sensorIdx,
                this.actionTypes.GET,
                device,
                port[0],
                port[1],
                10,
            ]);
        } else if (!data) {
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
            value = new Buffer(2);
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
    }
    //0xff 0x55 0x6 0x0 0x1 0xa 0x9 0x0 0x0 0xa
    // SET인 경우 SensorType 에 따라 버퍼를 생성
    makeOutputBuffer(device, port, data) {
        var buffer;
        var value = new Buffer(2);
        var dummy = new Buffer([10]);
        switch (device) {
            case this.sensorTypes.SERVO_PIN:
            case this.sensorTypes.DIGITAL:
            case this.sensorTypes.PWM: {
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
            case this.sensorTypes.TONE: {
                var time = new Buffer(2);
                if ($.isPlainObject(data)) {
                    value.writeInt16LE(data.value);
                    time.writeInt16LE(data.duration);
                } else {
                    value.writeInt16LE(0);
                    time.writeInt16LE(0);
                }
                buffer = new Buffer([
                    255,
                    85,
                    8,
                    sensorIdx,
                    this.actionTypes.SET,
                    device,
                    port,
                ]);
                buffer = Buffer.concat([buffer, value, time, dummy]);
                break;
            }
            case this.sensorTypes.TONE: {
            }
        }
    
        return buffer;
    }

    // 버퍼 를 받아서 datas에 저장~
    getDataByBuffer(buffer) {
        var datas = [];
        var lastIndex = 0;
        buffer.forEach(function(value, idx) {
            if (value == 13 && buffer[idx + 1] == 10) {
                datas.push(buffer.subarray(lastIndex, idx));
                lastIndex = idx + 2;
            }
        });

        return datas;
    }

    // 연결 해제되면 시리얼 포트 제거
    disconnect(connect) {
        var self = this;
        connect.close();
        if(self.sp) {
            delete self.sp;
        }
    }

    // 리셋
    reset(){
        this.lastTime = 0;
        this.lastSendTime = 0;
        this.sensorData.PULSEIN = {}
    }
}
module.exports = new robitStage();