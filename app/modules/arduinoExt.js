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
        TIMER: 0,
    }

    this.sendBuffers = [];
}

var sensorIdx = 0;

Module.prototype.init = function(handler, config) {
};

Module.prototype.setSerialPort = function (sp) {
    var that = this;
    this.sp = sp;
};

Module.prototype.requestInitialData = function() {
    return this.makeSensorReadBuffer(this.sensorTypes.ANALOG, 0);
};

Module.prototype.checkInitialData = function(data, config) {
    return true;
};

Module.prototype.validateLocalData = function(data) {
    if(data[0] == 255 && data[1] == 85 && data[data.length-1] == 10) {
        return true;
    } else {
        return false;
    }
};

Module.prototype.lostController = function(that, cb) {
    // console.log(this.sp);

};

Module.prototype.requestRemoteData = function(handler) {
    var that = this;
    Object.keys(this.sensorData).forEach(function (key) {
        if(that.sensorData[key] != undefined) {
            handler.write(key, that.sensorData[key]);           
        }
    })
};

Module.prototype.handleRemoteData = function(handler) {
    var that = this;
    var getDatas = handler.read('GET');
    var setDatas = handler.read('SET');
    var resetDatas = handler.read('RESET');

    if(getDatas) {
        this.sp.write(that.makeSensorReadBuffer(getDatas.type, getDatas.port, getDatas.data));
    }

    if(setDatas && Array.isArray(setDatas)) {
        setDatas.forEach(function (item) {
            // that.sendBuffers.push(that.makeSensorReadBuffer(item.type, item.port, item.data));
        });
    }

    if(resetDatas && Array.isArray(resetDatas)) {
        resetDatas.forEach(function (item) {
            // that.sendBuffers.push(that.makeSensorReadBuffer(item.type, item.port, item.data));
        });
    }
};

Module.prototype.requestLocalData = function() {
    var buffer = this.makeSensorReadBuffer(this.sensorTypes.ANALOG, 0);
    return buffer;
};

/*
ff 55 idx size data a
*/
Module.prototype.handleLocalData = function(data) { // data: Native Buffer
    // console.log(data);
    var readData = data.subarray(3, data.length-2);
    var value;
    switch(readData[0]) {
        case this.sensorValueSize.FLOAT: {
            value = new Buffer(readData.subarray(1, 5)).readFloatLE();
            value = Math.round(value * 100) / 100;
            break;
        }
        case this.sensorValueSize.SHORT: {
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
        case this.sensorTypes.DIGITAL: {
            this.sensorData.DIGITAL[port] = value;
            break;
        }
        case this.sensorTypes.ANALOG: {
            this.sensorData.ANALOG[port - 14] = value;
            break;
        }
        case this.sensorTypes.PULSEIN: {
            this.sensorData.PULSEIN[port] = value;
            break;
        }
        case this.sensorTypes.ULTRASONIC: {
            this.sensorData.ULTRASONIC = value;
            break;
        }
        case this.sensorTypes.TIMER: {
            this.sensorData.TIMER = value;
            break;
        }
        default: {
            break;
        }
    }
    console.log(value);
};

/*
ff 55 len idx action device port  slot  data a
0  1  2   3   4      5      6     7     8
*/

Module.prototype.makeSensorReadBuffer = function(device, port, data) {
    var buffer;
    if(device == this.sensorTypes.ULTRASONIC) {
        buffer = new Buffer([255, 85, 9, sensorIdx, this.actionTypes.GET, device, port[0], port[1], 10]);
    } else if(!data) {
        buffer = new Buffer([255, 85, 8, sensorIdx, this.actionTypes.GET, device, port, 10]);
    } else {
        value = new Buffer(2);
        value.writeInt16LE(data);
        buffer = new Buffer([255, 85, 10, sensorIdx, this.actionTypes.GET, device, port, 10]);
        buffer = Buffer.concat([buffer, value, 10]);
    }
    sensorIdx++;
    if(sensorIdx > 254) {
        sensorIdx = 0;
    }

    return buffer;
};

Module.prototype.reset = function() {
};

module.exports = new Module();
