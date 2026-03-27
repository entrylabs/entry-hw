const BaseModule = require('./baseModule');

var sensorIdx = 0;

class cremaker_3Dpen extends BaseModule {
    constructor() {
        super();
        this.sp = null;
        this.sensorTypes = {
            ALIVE: 0,
            DIGITAL: 1,
            ANALOG: 2,
            PWM: 3,
            MOTOR_ENABLE: 5,
            MOTOR_DIR: 6,
            HEATER: 9,
            MOTOR_SPEED: 10,
            SCREEN: 8,
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
                '6': 0,
                '7': 0,
            },
        };

        this.defaultOutput = {};

        this.recentCheckData = {};

        this.sendBuffers = [];

        this.lastTime = 0;
        this.lastSendTime = 0;
        this.isDraing = false;        
    }    

    init(handler, config) {}

    setSerialPort(sp) {
        var self = this;
        this.sp = sp;
    }

    requestInitialData() {      
        return this.makeSensorReadBuffer(this.sensorTypes.ANALOG, 0);
    }

    

    afterConnect(that, cb) {
        that.connected = true;        
        if (cb) {
            cb('connected');
        }
    }

    checkInitialData(data, config) {
        return true;
    }

    validateLocalData(data) {
        return true;
    }

    handleRemoteData(handler) {
        var self = this;
        var getDatas = handler.read('GET');
        var setDatas = handler.read('SET') || this.defaultOutput;
        var time = handler.read('TIME');
        var buffer = new Buffer([]);

        if (getDatas) {
            var keys = Object.keys(getDatas);
            keys.forEach(function(key) {
                var isSend = false;
                var dataObj = getDatas[key];
                if (
                    typeof dataObj.port === 'string' ||
                    typeof dataObj.port === 'number'
                ) {
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
                            data: dataObj.data,
                        };
                        buffer = Buffer.concat([
                            buffer,
                            self.makeSensorReadBuffer(
                                key,
                                dataObj.port,
                                dataObj.data
                            ),
                        ]);
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
    }

    isRecentData(port, type, data) {
        var isRecent = false;

        if (port in this.recentCheckData) {
            if (
                this.recentCheckData[port].type === type &&
                this.recentCheckData[port].data === data
            ) {
                isRecent = true;
            }
        }

        return isRecent;
    }

    requestLocalData() {
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

        return null;
    }

    handleLocalData(data) {
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
                default: {
                    break;
                }
            }
        });
    }

    makeSensorReadBuffer(device, port, data) {
        var buffer;
        var dummy = new Buffer([10]);
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
        console.log(buffer);

        return buffer;
    }

    makeOutputBuffer(device, port, data) {
        var buffer;
        var value = new Buffer(2);
        var dummy = new Buffer([10]);
        switch (device) {
            case this.sensorTypes.DIGITAL:
            case this.sensorTypes.PWM: 
            case this.sensorTypes.MOTOR_ENABLE:
            case this.sensorTypes.MOTOR_DIR:
            case this.sensorTypes.MOTOR_SPEED:
            case this.sensorTypes.HEATER:
            case this.sensorTypes.SCREEN: {
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
        }

        return buffer;
    }

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

    disconnect(connect) {
        var self = this;
        connect.close();
        if (self.sp) {
            delete self.sp;
        }
    }

    requestRemoteData(handler) {
        var self = this;
        if (!self.sensorData) {
            return;
        }
        Object.keys(this.sensorData).forEach(function(key) {
            if (self.sensorData[key] != undefined) {
                handler.write(key, self.sensorData[key]);
            }
        });
    }

    reset() {
        this.lastTime = 0;
        this.lastSendTime = 0;
    }
}

module.exports = new cremaker_3Dpen();
