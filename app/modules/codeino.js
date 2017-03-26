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
        TIMER: 8
    }

    this.actionTypes = {
        GET: 1,
        SET: 2,
        RESET: 3
    };

    this.sensorValueSize = {
        FLOAT: 2,
        SHORT: 3
    }

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
            '13': 0
        },
        ANALOG: {
            '0': 0,
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0
        },
        PULSEIN: {
        },
        TIMER: 0,
    }

    this.defaultOutput = {
        '0': { type: this.sensorTypes.DIGITAL, data: 0 },
        '1': { type: this.sensorTypes.DIGITAL, data: 0 },
        '2': { type: this.sensorTypes.DIGITAL, data: 0 },
        '3': { type: this.sensorTypes.DIGITAL, data: 0 },
        '4': { type: this.sensorTypes.DIGITAL, data: 0 },
        '5': { type: this.sensorTypes.DIGITAL, data: 0 },
        '6': { type: this.sensorTypes.DIGITAL, data: 0 },
        '7': { type: this.sensorTypes.DIGITAL, data: 0 },
        '8': { type: this.sensorTypes.DIGITAL, data: 0 },
        '9': { type: this.sensorTypes.DIGITAL, data: 0 },
        '10': { type: this.sensorTypes.DIGITAL, data: 0 },
        '11': { type: this.sensorTypes.DIGITAL, data: 0 },
        '12': { type: this.sensorTypes.DIGITAL, data: 0 },
        '13': { type: this.sensorTypes.DIGITAL, data: 0 }
    }

    this.sendBuffers = [];

    this.lastTime = 0;
    this.lastSendTime = 0;
}

var sensorIdx = 0;

Module.prototype.init = function(handler, config) {
};

Module.prototype.setSerialPort = function (sp) {
    var self = this;
    this.sp = sp;
};

Module.prototype.requestInitialData = function() {
    return this.makeSensorReadBuffer(this.sensorTypes.ANALOG, 0);
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
    if(data[0] == 255 && data[1] == 85 && data[data.length-1] == 10) {
        return true;
    } else {
        return false;
    }
};

Module.prototype.lostController = function(self, cb) {
    // console.log(this.sp);

};

Module.prototype.requestRemoteData = function(handler) {
    var self = this;
    this.lastSendTime = this.lastTime;
    Object.keys(this.sensorData).forEach(function (key) {
        if(self.sensorData[key] != undefined) {
            handler.write(key, self.sensorData[key]);
            self.canSendData = false;
        }
    })
};

Module.prototype.handleRemoteData = function(handler) {
    var self = this;
    var getDatas = handler.read('GET');
    var setDatas = handler.read('SET') || this.defaultOutput;
    var resetDatas = handler.read('RESET');
    var time = handler.read('TIME');
    var key = handler.read('KEY');

    if((this.lastTime < time && this.lastTime == this.lastSendTime)) {
        this.lastTime = time;
        this.sensorData.TIME = this.lastTime;

        if(getDatas && $.isPlainObject(getDatas) && getDatas.type ) {
            // this.sp.write(self.makeSensorReadBuffer(getDatas.type, getDatas.port));
            this.sp.write(self.makeSensorReadBuffer(getDatas.type, getDatas.port, getDatas.data));
        } else {
        }
    }

    if(this.lastKey != key && setDatas) {
        this.lastKey = key;
        var setKeys = Object.keys(setDatas);
        setKeys.forEach(function (port) {
            var data = setDatas[port];
            if(data) {
                self.sp.write(self.makeOutputBuffer(data.type, port, data.data));
            }
        });
    }
};

Module.prototype.requestLocalData = function() {
    return null;
};

/*
ff 55 idx size data a
*/
Module.prototype.handleLocalData = function(data) {
    var self = this;
    var datas = this.getDataByBuffer(data);

    datas.forEach(function (data) {
        if(data.length == 2) {
            return;
        }
        var readData = data.subarray(3, data.length);
        var value;
        switch(readData[0]) {
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

        switch(type) {
            case self.sensorTypes.DIGITAL: {
                self.sensorData.DIGITAL[port] = value;
                break;
            }
            case self.sensorTypes.ANALOG: {
                self.sensorData.ANALOG[port - 14] = value;
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
        case this.sensorTypes.TONE: {
            var time = new Buffer(2);
            if($.isPlainObject(data)) {
                value.writeInt16LE(data.value);
                time.writeInt16LE(data.duration);
            } else {
                value.writeInt16LE(0);
                time.writeInt16LE(0);
            }
            buffer = new Buffer([255, 85, 8, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, value, time, dummy]);
            break;
        }
        case this.sensorTypes.TONE: {
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

     this.sensorData.PULSEIN = {
    }
};

module.exports = new Module();
