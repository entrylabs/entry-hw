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
        METRIX: 9,
        METRIXCLEAR: 11,
        METRIXROWCOLCLEAR: 12,
        METRIXDRAW: 13,
        NEOPIXEL: 14,
        NEOPIXELCLEAR: 15,
        NEOPIXELINIT : 16,
        NEOPIXELRAINBOW : 17,
        NEOPIXELEACH : 18,
        LCDINIT: 19,
        LCD: 20,
        LCDCLEAR: 21,
        TEMPCHECK: 22,
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
        TEMPCHECK: 0,
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

// 엔트리로 전달할 데이터
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
};

Module.prototype.isRecentData = function(port, type, data) {
    var that = this;
    var isRecent = false;

    if(type == this.sensorTypes.ULTRASONIC) {
        var portString = port.toString();
        var isGarbageClear = false;
        Object.keys(this.recentCheckData).forEach(function (key) {
            var recent = that.recentCheckData[key];
            if(key === portString) {
                
            }
            if(key !== portString && recent.type == that.sensorTypes.ULTRASONIC) {
                delete that.recentCheckData[key];
                isGarbageClear = true;
            }
        });

        if((port in this.recentCheckData && isGarbageClear) || !(port in this.recentCheckData)) {
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

 // 하드웨어에서 온 데이터 처리 로직
/*
ff 55 idx size data a
*/
Module.prototype.handleLocalData = function(data) {
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
            case self.sensorTypes.TEMPCHECK: {
                self.sensorData.TEMPCHECK = value;
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
    } else if (device == this.sensorTypes.TEMPCHECK)  {
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
Module.prototype.makeOutputBuffer = function(device, port, data) {
    var buffer;
    var value = new Buffer(2);
    var dummy = new Buffer([10]);

    switch (device) {
        case this.sensorTypes.SERVO_PIN:
        case this.sensorTypes.DIGITAL:
        case this.sensorTypes.PWM: 
        case this.sensorTypes.METRIXCLEAR:
        case this.sensorTypes.METRIXDRAW:
        case this.sensorTypes.NEOPIXELCLEAR:
        case this.sensorTypes.NEOPIXELRAINBOW:
        case this.sensorTypes.LCDCLEAR:
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
        case this.sensorTypes.METRIX: 
        case this.sensorTypes.METRIXROWCOLCLEAR:
        {
            const value1 = new Buffer(2);
            const value2 = new Buffer(2);
            if ($.isPlainObject(data)) {
                value1.writeInt16LE(data.value1);
                value2.writeInt16LE(data.value2);
            } else {
                value1.writeInt16LE(0);
                value2.writeInt16LE(0);
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
            buffer = Buffer.concat([buffer, value1, value2, dummy]);
            break;
        }
        case this.sensorTypes.NEOPIXELINIT:
        {
            const neoCount = new Buffer(2);
            var bright = new Buffer(2);
            
            if ($.isPlainObject(data)) {
                neoCount.writeInt16LE(data.value1);
                bright.writeInt16LE(data.value2);
            } else {
                neoCount.writeInt16LE(0);
                bright.writeInt16LE(0);
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
            buffer = Buffer.concat([buffer, neoCount, bright, dummy]);
            break;
        }
        case this.sensorTypes.NEOPIXEL:
        {
            //var count_value = new Buffer(2);
            const rValue = new Buffer(2);
            const gValue = new Buffer(2);
            const bValue = new Buffer(2);
            
            if ($.isPlainObject(data)) {
               // count_value.writeInt16LE(data.count);
                rValue.writeInt16LE(data.R_val);
                gValue.writeInt16LE(data.G_val);
                bValue.writeInt16LE(data.B_val);
            } else {
                //count_value.writeInt16LE(0);
                rValue.writeInt16LE(0);
                gValue.writeInt16LE(0);
                bValue.writeInt16LE(0);
            }

            buffer = new Buffer([
                255,
                85,
                10,
                sensorIdx,
                this.actionTypes.SET,
                device,
                port,
            ]);
            buffer = Buffer.concat([buffer, rValue, gValue, bValue, dummy]);
            break;
        }
        case this.sensorTypes.NEOPIXELEACH:
        {
            const cntValue = new Buffer(2);
            const rVal = new Buffer(2);
            const gVal = new Buffer(2);
            const bVal = new Buffer(2);
            
            if ($.isPlainObject(data)) {
                cntValue.writeInt16LE(data.CNT_val);
                rVal.writeInt16LE(data.R_val);
                gVal.writeInt16LE(data.G_val);
                bVal.writeInt16LE(data.B_val);
            } else {
                cntValue.writeInt16LE(0);
                rVal.writeInt16LE(0);
                gVal.writeInt16LE(0);
                bVal.writeInt16LE(0);
            }

            buffer = new Buffer([
                255,
                85,
                12,
                sensorIdx,
                this.actionTypes.SET,
                device,
                port,
            ]);
            buffer = Buffer.concat([buffer, cntValue, rVal, gVal, bVal, dummy]);
            break;
        }
        case this.sensorTypes.LCDINIT:
        {
            const listVal = new Buffer(2);

            if ($.isPlainObject(data)) {
                listVal.writeInt16LE(data.list);
            } else {
                listVal.writeInt16LE(0);
            }

            buffer = new Buffer([
                255,
                85,
                6,
                sensorIdx,
                this.actionTypes.SET,
                device,
                port,
            ]);

            buffer = Buffer.concat([buffer, listVal, dummy]);
           
            break;
        }
        case this.sensorTypes.LCD:
        {
            const rowValue = new Buffer(2);
            const colValue = new Buffer(2);
            const val = new Buffer(2);
            let textLen = 0;
            let text;
            
            if ($.isPlainObject(data)) {
                textLen = ('' + `${data.value}`).length;
                text = Buffer.from('' + `${data.value}`, 'ascii');
                rowValue.writeInt16LE(data.row);
                colValue.writeInt16LE(data.col);
                val.writeInt16LE(textLen);
            } else {
                rowValue.writeInt16LE(0);
                colValue.writeInt16LE(0);

                textLen = 0;
                text = Buffer.from('', 'ascii');
                val.writeInt16LE(textLen);
            }

            buffer = new Buffer([
                255,
                85,
                10 + textLen,
                sensorIdx,
                this.actionTypes.SET,
                device,
                port,
            ]);
            
            buffer = Buffer.concat([buffer, rowValue, colValue, val, text, dummy]);
            break;
        }
        case this.sensorTypes.NEOPIXELEACH:{
            var cnt_value = new Buffer(2);
            var r_value = new Buffer(2);
            var g_value = new Buffer(2);
            var b_value = new Buffer(2);
            
            if ($.isPlainObject(data)) {
                cnt_value.writeInt16LE(data.CNT_val);
                r_value.writeInt16LE(data.R_val);
                g_value.writeInt16LE(data.G_val);
                b_value.writeInt16LE(data.B_val);
            } else {
                cnt_value.writeInt16LE(0);
                r_value.writeInt16LE(0);
                g_value.writeInt16LE(0);
                b_value.writeInt16LE(0);
            }

            buffer = new Buffer([
                255,
                85,
                10,
                sensorIdx,
                this.actionTypes.SET,
                device,
                port,
            ]);
            buffer = Buffer.concat([buffer, cnt_value, r_value, g_value, b_value, dummy]);
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

// 하드웨어 연결 해제 시 호출
Module.prototype.disconnect = function(connect) {
    var self = this;
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
