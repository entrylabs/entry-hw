const BaseModule = require('./baseModule');

class KABOINO extends BaseModule {
    constructor() {
        super();
        this.sp = null;
        this.actionTypes = {
            GET: 1,
            SET: 2,
            RESET: 3,
        };
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
            SET_LGT: 9,
            SET_TONE: 10,
            SET_BODY_SPEED_TURN: 11,
            SET_WHEEL_SPIN: 12,
            SET_WHEEL_BALANCE: 13,
            SET_WHEEL_SPEED: 14,
            SET_DISPLAY_STRING: 15,
            SET_DISPLAY_CLEAR: 16,
            SET_SEARCH_LIGHT:17,
            GET_DUST_SENSOR: 22,
            GET_ULTRASONIC_SENSOR: 23,
            GET_COLOR_SENSOR: 24,
            GET_SND_SENSOR: 25,
            SET_BALL_HOLDER: 26,
            SET_LIFT_AGV: 27,
            SET_ROBOT_ARM: 28,
            SET_ULTRASONIC_ANGLE: 29,
            SET_COLOR_SEN_LED: 30,
        };

        this.digitalPortTimeList = [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0
        ];
        
        this.sensorValueSize = {
            FLOAT: 2,
            SHORT: 3,
        };
        
        this.sensorData = {
            ULTRASONIC: 0,
            DUST: 0,
            COLOR: 0,
            SND: 0,
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
                '8': 0,
            },
            PULSEIN: {},
            TIMER: 0,
        };

        this.defaultOutput = {};

        this.recentCheckData = {};

        this.sendBuffers = [];

        this.lastTime = 0;
        this.lastSendTime = 0;
        this.isDraing = false;

        this.sensorIdx = 0;
    }

    init = function(handler, config) {
    }

    setSerialPort = function(sp) {
        var self = this;
        this.sp = sp;
    }

    requestInitialData = function() {
        return this.makeSensorReadBuffer(this.sensorTypes.ANALOG, 0);
    }

    checkInitialData = function(data, config) {
        return true;
    }

    afterConnect = function(that, cb) {
        that.connected = true;
        if (cb) {
            cb('connected');
        }
    }

    validateLocalData = function(data) {
        return true;
    }

    requestRemoteData = function(handler) {
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

    handleRemoteData = function(handler) {
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

                if (typeof dataObj.port === 'string' || typeof dataObj.port === 'number') {
                    var time = self.digitalPortTimeList[dataObj.port];
                    if (dataObj.time > time) {
                        isSend = true;
                        self.digitalPortTimeList[dataObj.port] = dataObj.time;
                    }
                }
                else if (Array.isArray(dataObj.port)) {
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
                        };
                    }
                }
            });
        }

        if (buffer.length) {
            this.sendBuffers.push(buffer);
        }
    }

    isRecentData = function(port, type, data) {
        var that = this;
        var isRecent = false;

        if (type == this.sensorTypes.GET_COLOR_SENSOR) {
            var portString = port.toString();
            var isGarbageClear = false;
            Object.keys(this.recentCheckData).forEach(function (key) {
                var recent = that.recentCheckData[key];
                if (key === portString) {
                    
                }
                if (key !== portString && recent.type == that.sensorTypes.GET_COLOR_SENSOR) {
                    delete that.recentCheckData[key];
                    isGarbageClear = true;
                }
            });

            if ((port in this.recentCheckData && isGarbageClear) || !(port in this.recentCheckData)) {
                isRecent = false;
            }
            else {
                isRecent = true;
            }
        }
        else if (type == this.sensorTypes.GET_DUST_SENSOR) {
            var portString = port.toString();
            var isGarbageClear = false;
            Object.keys(this.recentCheckData).forEach(function (key) {
                var recent = that.recentCheckData[key];
                if (key === portString) {
                    
                }
                if (key !== portString && recent.type == that.sensorTypes.GET_DUST_SENSOR) {
                    delete that.recentCheckData[key];
                    isGarbageClear = true;
                }
            });

            if ((port in this.recentCheckData && isGarbageClear) || !(port in this.recentCheckData)) {
                isRecent = false;
            }
            else {
                isRecent = true;
            }
        }
        else if (type == this.sensorTypes.GET_ULTRASONIC_SENSOR) {
            var portString = port.toString();
            var isGarbageClear = false;
            Object.keys(this.recentCheckData).forEach(function (key) {
                var recent = that.recentCheckData[key];
                if (key === portString) {
                    
                }
                if (key !== portString && recent.type == that.sensorTypes.GET_ULTRASONIC_SENSOR) {
                    delete that.recentCheckData[key];
                    isGarbageClear = true;
                }
            });

            if ((port in this.recentCheckData && isGarbageClear) || !(port in this.recentCheckData)) {
                isRecent = false;
            }
            else {
                isRecent = true;
            }
            
        }
        else if (type == this.sensorTypes.GET_SND_SENSOR) {
            var portString = port.toString();
            var isGarbageClear = false;
            Object.keys(this.recentCheckData).forEach(function (key) {
                var recent = that.recentCheckData[key];
                if (key === portString) {
                    
                }
                if (key !== portString && recent.type == that.sensorTypes.GET_SND_SENSOR) {
                    delete that.recentCheckData[key];
                    isGarbageClear = true;
                }
            });

            if ((port in this.recentCheckData && isGarbageClear) || !(port in this.recentCheckData)) {
                isRecent = false;
            }
            else {
                isRecent = true;
            }
        }
        else if (port in this.recentCheckData && type != this.sensorTypes.TONE) {
            if (this.recentCheckData[port].type === type && this.recentCheckData[port].data === data) {
                isRecent = true;
            }
        }

        return isRecent;
    }

    requestLocalData = function() {
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

    handleLocalData = function(data) {
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
                case self.sensorTypes.GET_COLOR_SENSOR: {
                    self.sensorData.COLOR = parseInt(value);
                    break;
                }
                case self.sensorTypes.GET_DUST_SENSOR: {
                    self.sensorData.DUST = parseInt(value);
                    break;
                }
                case self.sensorTypes.GET_ULTRASONIC_SENSOR: {
                    self.sensorData.ULTRASONIC = parseInt(value);
                    break;
                }
                case self.sensorTypes.GET_SND_SENSOR: {
                    self.sensorData.SND = parseInt(value);
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

    makeSensorReadBuffer = function(device, port, data) {
        var buffer;
        var dummy = new Buffer([10]);
        if (device == this.sensorTypes.GET_COLOR_SENSOR) {
            buffer = new Buffer([
                255,
                85,
                5,
                this.sensorIdx,
                this.actionTypes.GET,
                device,
                port,
                10,
            ]);
        }
        else if (device == this.sensorTypes.GET_DUST_SENSOR) {
            buffer = new Buffer([
                255,
                85,
                5,
                this.sensorIdx,
                this.actionTypes.GET,
                device,
                port,
                10,
            ]);
        }
        else if (device == this.sensorTypes.GET_ULTRASONIC_SENSOR) {
            buffer = new Buffer([
                255,
                85,
                5,
                this.sensorIdx,
                this.actionTypes.GET,
                device,
                port,
                10,
            ]);
        }
        else if (device == this.sensorTypes.GET_SND_SENSOR) {
            buffer = new Buffer([
                255,
                85,
                5,
                this.sensorIdx,
                this.actionTypes.GET,
                device,
                port,
                10,
            ]);
        }
        else if (!data) {
            buffer = new Buffer([
                255,
                85,
                5,
                this.sensorIdx,
                this.actionTypes.GET,
                device,
                port,
                10,
            ]);
        }
        else {
            value = new Buffer(2);
            value.writeInt16LE(data);
            buffer = new Buffer([
                255,
                85,
                7,
                this.sensorIdx,
                this.actionTypes.GET,
                device,
                port,
                10,
            ]);
            buffer = Buffer.concat([buffer, value, dummy]);
        }

        this.sensorIdx++;
        if (this.sensorIdx > 254) {
            this.sensorIdx = 0;
        }

        return buffer;
    }

    makeOutputBuffer = function(device, port, data) {
        var buffer;
        var value = new Buffer(2);
        var dummy = new Buffer([10]);
        switch (device) {
            case this.sensorTypes.SERVO_PIN:
            case this.sensorTypes.DIGITAL:
            case this.sensorTypes.SET_BALL_HOLDER:
            case this.sensorTypes.SET_LIFT_AGV:
            case this.sensorTypes.SET_ULTRASONIC_ANGLE:
            case this.sensorTypes.SET_ROBOT_ARM:
            case this.sensorTypes.SET_COLOR_SEN_LED:
            case this.sensorTypes.PWM: {
                value.writeInt16LE(data);
                buffer = new Buffer([
                    255,
                    85,
                    5,
                    this.sensorIdx,
                    this.actionTypes.SET,
                    device,
                    port,
                    data
                ]);
                buffer = Buffer.concat([buffer, dummy]);
                break;
            }
            case this.sensorTypes.SET_SEARCH_LIGHT:
            case this.sensorTypes.SET_LGT: {
                value.writeInt16LE(data);
                buffer = new Buffer([
                    255,
                    85,
                    6,
                    this.sensorIdx,
                    this.actionTypes.SET,
                    device,
                    port,
                    data
                ]);
                buffer = Buffer.concat([buffer, dummy]);
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
                    this.sensorIdx,
                    this.actionTypes.SET,
                    device,
                    port,
                ]);
                buffer = Buffer.concat([buffer, value, time, dummy]);
                break;
            }
            case this.sensorTypes.SET_BODY_SPEED_TURN:
            case this.sensorTypes.SET_WHEEL_SPIN:
            case this.sensorTypes.SET_WHEEL_SPEED: {
                buffer = new Buffer([
                    255,
                    85,
                    6,
                    this.sensorIdx,
                    this.actionTypes.SET,
                    device,
                    port,
                    data[0], data[1]
                ]);
                buffer = Buffer.concat([buffer, dummy]);
                break;
            }
            case this.sensorTypes.SET_TONE: {
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
                    this.sensorIdx,
                    this.actionTypes.SET,
                    device,
                    port,
                ]);
                buffer = Buffer.concat([buffer, value, time, dummy]);
                break;
            }
            case this.sensorTypes.SET_DISPLAY_STRING: {
                buffer = new Buffer([
                    255,
                    85,
                    27,
                    this.sensorIdx,
                    this.actionTypes.SET,
                    device,
                    port,
                    data[0],
                    data[1],
                    data[2],
                    data[3],
                    data[4],
                    data[5],
                    data[6],
                    data[7],
                    data[8],
                    data[9],
                    data[10],
                    data[11],
                    data[12],
                    data[13],
                    data[14],
                    data[15],
                    data[16],
                    data[17],
                    data[18],
                    data[19],
                    data[20],
                    data[21],
                    data[22]
                ]);
                buffer = Buffer.concat([buffer, dummy]);
                break;
            }
            case this.sensorTypes.SET_DISPLAY_CLEAR: {
                buffer = new Buffer([
                    255,
                    85,
                    5,
                    this.sensorIdx,
                    this.actionTypes.SET,
                    device,
                    port,
                    data.data,
                ]);
                buffer = Buffer.concat([buffer,dummy]);
                break;
            }
            case this.sensorTypes.TONE: {
            }
        }

        return buffer;
    }

    getDataByBuffer = function(buffer) {
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

    disconnect = function(connect) {
        var self = this;
        connect.close();
        if (self.sp) {
            delete self.sp;
        }
    }

    reset = function() {
        this.lastTime = 0;
        this.lastSendTime = 0;

        this.sensorData.PULSEIN = {};
    }
}

module.exports = new KABOINO();
