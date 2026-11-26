'use strict';
//
function Module() {
    this.sp = null;
    this.sensorTypes = {
        ALIVE: 0,
        DIGITAL: 1,
        ANALOG: 2,
        PWM: 3,
        RGBLED_PIN: 4,

        ULTRASONIC: 7,
        TIMER: 8,

        SERVO_PIN: 10,

        DEFAULT_NEOPIXEL: 11,
        CUSTOM_NEOPIXEL_POWER:12,
        CUSTOM_NEOPIXEL_LED_HANDLE:13,

        DEFAULT_BUZZER: 5,
        CUSTOM_BUZZER: 6,

        RESET:0xFF
    };

    this.actionTypes = {
        GET: 1,
        SET: 2,
        RESET: 3
    };

    this.sensorValueSize = {
        ANAL_VALUES: 0,
        DIGITAL_VALUES:1,
        FLOAT: 2,
        SHORT: 3,
    };

    this.digitalPortTimeList = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    this.sensorData = {
        ULTRASONIC: 0,
        DIGITAL: {
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
            '6': 0
        },
        TIMER: 0,
    };

    this.defaultOutput = {
    };

    this.recentCheckData = {
    };

    this.sendBuffers = [];

    this.lastTime = 0;
    this.lastSendTime = 0;
    this.isDraing = false;
}

var sensorIdx = 0;

Module.prototype.init = function(handler, config) {
};

Module.prototype.setSerialPort = function (sp) {
    var self = this;
    this.sp = sp;
};

Module.prototype.requestInitialData = function() {
    return true;
};

Module.prototype.checkInitialData = function(data, config) {
    return true;
};

Module.prototype.afterConnect = function(that, cb) {
    that.connected = true;
    if(cb) {
        cb('connected');
    }
};

Module.prototype.validateLocalData = function(data) {
    return true;
};

Module.prototype.lostController = function(self, cb) {
};

Module.prototype.requestRemoteData = function(handler) {
    var self = this;
    if(!self.sensorData) {
        return;
    }
    Object.keys(this.sensorData).forEach(function (key) {
        if(self.sensorData[key] != undefined) {
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

    if(getDatas) {
        var keys = Object.keys(getDatas);
        keys.forEach(function(key) {
            var isSend = false;
            var dataObj = getDatas[key];
            if(typeof dataObj.port === 'string' || typeof dataObj.port === 'number') {
                var time = self.digitalPortTimeList[dataObj.port];
                if(dataObj.time > time) {
                    isSend = true;
                    self.digitalPortTimeList[dataObj.port] = dataObj.time;
                }
            } else if(Array.isArray(dataObj.port)){
                isSend = dataObj.port.every(function(port) {
                    var time = self.digitalPortTimeList[port];
                    return dataObj.time > time;
                });

                if(isSend) {
                    dataObj.port.forEach(function(port) {
                        self.digitalPortTimeList[port] = dataObj.time;
                    });
                }
            }

            if(isSend) {
                if(!self.isRecentData(dataObj.port, key, dataObj.data)) {
                    self.recentCheckData[dataObj.port] = {
                        type: key,
                        data: dataObj.data
                    }
                    buffer = Buffer.concat([buffer, self.makeSensorReadBuffer(key, dataObj.port, dataObj.data)]);
                }
            }
        });
    }

    if(setDatas) {
        var setKeys = Object.keys(setDatas);
        setKeys.forEach(function (port) {
            var data = setDatas[port];
            if(port>=50) {
                port -=50;
            }
            if(data) {
                if(self.digitalPortTimeList[port] < data.time) {
                    self.digitalPortTimeList[port] = data.time;

                    if(!self.isRecentData(port, data.type, data.data)) {
                        self.recentCheckData[port] = {
                            type: data.type,
                            data: data.data
                        }
                        buffer = Buffer.concat([buffer, self.makeOutputBuffer(data.type, port, data.data)]);
                        //delete setDatas[port]
                    }
                }
            }
        });
    }
    if(buffer.length) {
        this.sendBuffers.push(buffer);
    }
};

Module.prototype.isRecentData = function(port, type, data) {
    var isRecent = false;

    if(port in this.recentCheckData) {
        if(type != this.sensorTypes.TONE && this.recentCheckData[port].type === type && this.recentCheckData[port].data === data) {
            isRecent = true;
        }
    }

    return isRecent;
}

Module.prototype.requestLocalData = function() {
    var self = this;

    if(!this.isDraing && this.sendBuffers.length > 0) {
        this.isDraing = true;
        this.sp.write(this.sendBuffers.shift(), function () {
            if(self.sp) {
                self.sp.drain(function () {
                    self.isDraing = false;
                });
            }
        });
    }

    return null;
};

/*
ff 55 idx size data a
*/
Module.prototype.handleLocalData = function(data) {
    var self = this;
    var datas = this.getDataByBuffer(data);
    
    datas.forEach(function (data) {
        //let customFormat = false;
        if(data.length <= 4 || data[0] !== 255 || data[1] !== 85) {
            return;
        }
        var readData = data.subarray(2, data.length);
        var value;
        switch(readData[0]) {
            case self.sensorValueSize.FLOAT: {
                //value = new Buffer(readData.subarray(1, 5)).readFloatLE(); 
                //value = Math.round(value * 100) / 100;
                value = ((readData[1]<<8) + readData[2])/100;
                break;
            }
            case self.sensorValueSize.SHORT: {
                value = new Buffer(readData.subarray(1, 3)).readInt16LE();
                break;
            }
            case self.sensorValueSize.DIGITAL_VALUES: {
                value = readData[1];
                break;
            }
            case self.sensorValueSize.ANAL_VALUES: {
                for(let i=0; i<7; ++i) {
                    self.sensorData.ANALOG[readData[1+3*i]] = (readData[2+3*i]<<8) + readData[3+3*i];
                }
                if(readData[22]) {//존재하면
                    self.sensorData.ULTRASONIC =((readData[23]<<8) + readData[24])/100;
                }
                //함수 종료
                return;
            }
            default: {
                value = 0;
                break;
            }
        }

        var type = readData[readData.length - 1];

        switch(type) {
            case self.sensorTypes.DIGITAL: {
                let port = readData[readData.length - 2];
                self.sensorData.DIGITAL[port] = value;
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
};

/*
ff 55 len idx action device port  slot  data a
0  1  2   3   4      5      6     7     8
*/
Module.prototype.makeSensorReadBuffer = function(device, port, data) {
    var buffer;
    var dummy = new Buffer([10]);
    if(device == this.sensorTypes.ULTRASONIC) {
        buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, port[0], port[1], 10]);
    } else if(!data) {
        buffer = new Buffer([255, 85, 5, sensorIdx, this.actionTypes.GET, device, port, 10]);
    } else {
        value = new Buffer(2);
        value.writeInt16LE(data);
        buffer = new Buffer([255, 85, 7, sensorIdx, this.actionTypes.GET, device, port, 10]);
        buffer = Buffer.concat([buffer, value, dummy]);
    }
    sensorIdx++;
    if(sensorIdx > 254) {
        sensorIdx = 0;
    }

    return buffer;
};

//0xff 0x55 0x6 0x0 0x1 0xa 0x9 0x0 0x0 0xa
Module.prototype.makeOutputBuffer = function(device, port, data) {
    var buffer;
    var value = new Buffer(2);
    var dummy = new Buffer([10]);
    switch(device) {
        case this.sensorTypes.SERVO_PIN:
        case this.sensorTypes.DIGITAL:
        case this.sensorTypes.PWM: {
            value.writeInt16LE(data);
            buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, value, dummy]);
            break;
        }
        case this.sensorTypes.DEFAULT_BUZZER:
        case this.sensorTypes.CUSTOM_BUZZER: {
            var time = new Buffer(2);
            if($.isPlainObject(data)) {
                value.writeInt16LE(data.value);
                time.writeInt16LE(data.duration);
            } else {
                value.writeInt16LE(0);
                time.writeInt16LE(0);
            }
            // 2바이트씩이라 length = 4 + 2 +2
            buffer = new Buffer([255, 85, 8, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, value, time, dummy]);
            break;
        }
        case this.sensorTypes.DEFAULT_NEOPIXEL: {
            if ($.isPlainObject(data)) {
                let rValue = new Buffer(1);
                let gValue = new Buffer(1);
                let bValue = new Buffer(1);
                let brightness = new Buffer(1);
                rValue.writeUInt8(data.rValue);
                gValue.writeUInt8(data.gValue);
                bValue.writeUInt8(data.bValue);
                brightness.writeUInt8(data.brightness);
                buffer = new Buffer([255, 85, 8, sensorIdx, this.actionTypes.SET, device, port]);
                buffer = Buffer.concat([buffer, rValue, gValue, bValue, brightness, dummy]);
            } else {
                buffer = new Buffer([255, 85, 8, sensorIdx, this.actionTypes.SET, device, port, 0,0,0,22]);                
            }
            break;
        }
        case this.sensorTypes.CUSTOM_NEOPIXEL_POWER: {
            if ($.isPlainObject(data)) {
                let isOn = new Buffer(1);
                let brightness = new Buffer(1);
                isOn.writeUInt8(data.isOn);
                brightness.writeUInt8(data.brightness);
                buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, device, port]);
                buffer = Buffer.concat([buffer, isOn, brightness, dummy]);
            } else {
                buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, device, port, 0,22]);           
            }
            break;
        }
        case this.sensorTypes.CUSTOM_NEOPIXEL_LED_HANDLE: {
            if ($.isPlainObject(data)) {
                let r = new Buffer(1); 
                let g = new Buffer(1); 
                let b = new Buffer(1);
                r.writeUInt8(data.r);
                g.writeUInt8(data.g);
                b.writeUInt8(data.b);
                buffer = new Buffer([255, 85, 7/* 4(ledNum : port-50) + 3(r, g, b) */, sensorIdx, this.actionTypes.SET, device, port]);
                buffer = Buffer.concat([buffer, r, g, b]);
            } else {
                buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, this.sensorTypes.CUSTOM_NEOPIXEL_POWER, port, 0,22]);                
            }
            break;
        }
        case this.sensorTypes.RGBLED_PIN:{
            if ($.isPlainObject(data)) {
                let r = new Buffer(1); 
                let g = new Buffer(1); 
                let b = new Buffer(1);
                r.writeUInt8(data.r);
                g.writeUInt8(data.g);
                b.writeUInt8(data.b);
                buffer = new Buffer([255, 85, 7, sensorIdx, this.actionTypes.SET, device, port]);
                buffer = Buffer.concat([buffer, r, g, b]);
            } else {
                // 끄기신호 보내자 
                buffer = new Buffer([255, 85, 7, sensorIdx, this.actionTypes.SET, device, port, 0,0,0]);                
            }
            break;
        }
        case this.sensorTypes.ULTRASONIC:{
            let echo=new Buffer(1);
            echo.writeUInt8(data);
            buffer = new Buffer([255, 85, 5, sensorIdx, this.actionTypes.GET, device, port]);
            buffer = Buffer.concat([buffer, echo]);
            break;
        }
        case this.sensorTypes.RESET:{
            buffer = new Buffer([255, 85, 4, sensorIdx, this.actionTypes.SET, device, port]);
            break;
        }
    }

    return buffer;
};

Module.prototype.getDataByBuffer = function(buffer) {
    var datas = [];
    var lastIndex = 0;
    buffer.forEach(function (value, idx) {
        if(value == 13 && buffer[idx + 1] == 10) {
            datas.push(buffer.subarray(lastIndex, idx));
            lastIndex = idx + 2;
        }
    });

    return datas;
};

Module.prototype.disconnect = function(connect) {
    var self = this;
    connect.close();
    if(self.sp) {
        delete self.sp;
    }
};

Module.prototype.reset = function() {
    this.lastTime = 0;
    this.lastSendTime = 0;

};

module.exports = new Module();
