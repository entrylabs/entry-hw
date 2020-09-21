function Module() {
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
        LIGHT: 9,
        MICROPHONE: 10,
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
        ULTRASONIC: 0,
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
        LIGHT: 0,
        MIC: 0,
    };

    this.defaultOutput = {};

    this.recentCheckData = {};

    this.sendBuffers = [];

    this.lastTime = 0;
    this.lastSendTime = 0;
    this.isDraing = false;
}

var sensorIdx = 0;

Module.prototype.init = function(handler, config) {};

Module.prototype.setSerialPort = function(sp) {
    var self = this;
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

//-------------------------------------------------------------------------------------------------
// Web Socket 송신 데이타
Module.prototype.requestRemoteData = function(handler) {
    var self = this;
    if (!self.sensorData) {
        return;
    }
    Object.keys(this.sensorData).forEach(function(key) {
        if (self.sensorData[key] != undefined) {
            handler.write(key, self.sensorData[key]);
        }
    });
};

// Web Socket 수신 데이타
Module.prototype.handleRemoteData = function(handler) {
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
                    //self.recentCheckData[dataObj.port] = {
                    //    type: key,
                    //    data: dataObj.data,
                    //};
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
};

Module.prototype.isRecentData = function(port, type, data) {
    var isRecent = false;

    if (port in this.recentCheckData) {
        if (
            (type != this.sensorTypes.TONE || type != this.sensorTypes.LIGHT) &&
            this.recentCheckData[port].type === type &&
            this.recentCheckData[port].data === data
        ) {
            isRecent = true;
        }
    }

    return isRecent;
};

//-------------------------------------------------------------------------------------------------
// 하드웨어 송신 데이타 (this -> Hardware)

Module.prototype.requestLocalData = function() {
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
};

// 하드웨어 수신 데이타 (Hardware -> this)

/*
ff 55 idx size data a
*/
Module.prototype.handleLocalData = function(data) {
    var key;
    var value;
    var base_idx;
    var self = this;

    console.log('HW Received...');

    for (var i = 0; i < 3; i++) {
        base_idx = i * 3;
        key = data[base_idx];
        value = data[base_idx + 1] & 0x000000ff | (data[base_idx + 2] << 8) & 0x0000ff00;
        
        //key = (data[i * 2] & 0x78) >> 3;
        //value = ((data[i * 2] & 0x07) << 7) | (data[i * 2 + 1] & 0x7f);

        console.log('[' + key + '] = ' + value);

        if (key == 5) self.sensorData.LIGHT = value;
        else if (key == 6) self.sensorData.MIC = value;
    }

    /*
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
    */
};

//-------------------------------------------------------------------------------------------------

/*
ff 55 len idx action device port  slot  data a
0  1  2   3   4      5      6     7     8
*/

Module.prototype.makeSensorReadBuffer = function(device, port, data) {
    var buffer;
    var dummy = new Buffer([10]);
    var convertPort = port - '1' + 2;

    if (device == this.sensorTypes.LIGHT) {
        buffer = new Buffer([
            0xff,
            0x01,
            convertPort, // port
            0x04, // command
            data, // data
            0x20,
            0x34,
            0x56,
        ]);
    } else if (device == this.sensorTypes.MICROPHONE) {
        buffer = new Buffer([
            0xff,
            0x01,
            convertPort, // port
            0x03, // command
            data, // data
            0x20,
            0x34,
            0x56,
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
};

//0xff 0x55 0x6 0x0 0x1 0xa 0x9 0x0 0x0 0xa
//0xff, 0x01
//0x02 (port + 1)
//0x01 (command) - 0x01(servo), 0x02(GPIO), 0x03(Microphone), 0x04(Light), 0x05(Speed Motor PWM)

Module.prototype.makeOutputBuffer = function(device, port, data) {
    var buffer;
    var value = new Buffer(2);
    var dummy = new Buffer([10]);

    var convertPort = port - '1' + 2;

    switch (device) {
        //        case this.sensorTypes.PWM: {
        //            value.writeInt16LE(data);
        //            buffer = new Buffer([
        //                255,
        //                85,
        //                6,
        //                sensorIdx,
        //                this.actionTypes.SET,
        //                device,
        //                port,
        //            ]);
        //            buffer = Buffer.concat([buffer, value, dummy]);
        //            break;
        //        }
        //        case this.sensorTypes.TONE: {
        //            var time = new Buffer(2);
        //            if ($.isPlainObject(data)) {
        //                value.writeInt16LE(data.value);
        //                time.writeInt16LE(data.duration);
        //            } else {
        //                value.writeInt16LE(0);
        //                time.writeInt16LE(0);
        //            }
        //            buffer = new Buffer([
        //                255,
        //                85,
        //                8,
        //                sensorIdx,
        //                this.actionTypes.SET,
        //                device,
        //                port,
        //            ]);
        //            buffer = Buffer.concat([buffer, value, time, dummy]);
        //            break;
        //        }

        case this.sensorTypes.PWM: {
            buffer = new Buffer([
                0xff,
                0x01,
                convertPort, // port
                0x05, // command
                data, // 0~255
                0x20,
                0x34,
                0x56,
            ]);

            break;
        }

        case this.sensorTypes.SERVO_PIN: {
            buffer = new Buffer([
                0xff,
                0x01,
                convertPort, // port
                0x01, // command
                data, // 0~180
                0x20,
                0x34,
                0x56,
            ]);

            break;
        }

        case this.sensorTypes.DIGITAL: {
            buffer = new Buffer([
                0xff,
                0x01,
                convertPort, // port
                0x02, // command
                data, // on-off
                0x20,
                0x34,
                0x56,
            ]);

            break;
        }
    }

    return buffer;
};

Module.prototype.getDataByBuffer = function(buffer) {
    var datas = [];
    var lastIndex = 0;
    buffer.forEach(function(value, idx) {
        if (value == 13 && buffer[idx + 1] == 10) {
            datas.push(buffer.subarray(lastIndex, idx));
            lastIndex = idx + 2;
        }
    });

    return datas;
};

Module.prototype.disconnect = function(connect) {
    var self = this;
    connect.close();
    if (self.sp) {
        delete self.sp;
    }
};

Module.prototype.reset = function() {
    this.lastTime = 0;
    this.lastSendTime = 0;

    this.sensorData.PULSEIN = {};
};

module.exports = new Module();
