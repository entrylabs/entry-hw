function Module() {
    this.tx_max_len = 35;
    this.tx_data = new Array(this.tx_max_len);

    this.sensor_data = {
        left_infared: 0,
        right_infared: 0,
        motion: 0,
        ultrasonic: 0,
        gas: 0,
        cds: 0,
        tmp: 0,
        vibe: 0
    }

    this.worker_data = {
        tone: 0,
        buz_octave: 0,
        buz_note: 0,
        ultrasonic: 0,
        motion: 0,
        motor_state: 0,
        servo_angle: 0,
        neopixel: {
            first: {
                r: 0,
                g: 0,
                b: 0
            },
            second: {
                r: 0,
                g: 0,
                b: 0
            },
            third: {
                r: 0,
                g: 0,
                b: 0
            },
            fourth: {
                r: 0,
                g: 0,
                b: 0
            },
            fifth: {
                r: 0,
                g: 0,
                b: 0
            },
            sixth: {
                r: 0,
                g: 0,
                b: 0
            },
            seventh: {
                r: 0,
                g: 0,
                b: 0
            },
            eighth: {
                r: 0,
                g: 0,
                b: 0
            }
        },
        outer_motor: 0
    }

    this.sensorValueSize = {
        FLOAT: 2,
        SHORT: 3,
    };

    this.sensorTypes = {
        ALIVE: 0,
        DIGITAL: 1,
        ANALOG: 2,
        ULTRASONIC: 3,
        MOTION: 4,
        TIMER: 5,
    };
}

var TESTINO = {
    TONE: 'tone',
    MOTOR_STATE: 'motorState',
    SERVO_ANGLE: 'servoAngle',
    ULTRASONIC: 'ultrasonic',
    MOTION: 'motion',
    NEOPIXEL: 'neopixel',
    OUTER_MOTOR: 'outerMotor'
}

Module.prototype.init = function(handler, config) {};

Module.prototype.setSerialPort = function(sp) {
    this.sp = sp;
};

Module.prototype.requestInitialData = function() {
    let tx_data = this.tx_data;
    tx_data[0] = 0xff; // 시작 255
    tx_data[1] = 0x23; // 길이 35
    for (let i=2; i < this.tx_max_len-2; i++) {
        tx_data[i] = 0;
    }
    tx_data[33] = 0x0;
    tx_data[34] = 0xa;
    return tx_data;
};

Module.prototype.checkInitialData = function(data, config) {
    return true;
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

/* 엔트리HW -> 엔트리JS */
Module.prototype.requestRemoteData = function(handler) {
    let sensor_data = this.sensor_data;
    for (let key in sensor_data) {
        handler.write(key, sensor_data[key]);
    }
};

/** 엔트리JS -> 엔트리HW */
Module.prototype.handleRemoteData = function(handler) {
    let worker_data = this.worker_data;
    let new_value;

    if (handler.e(TESTINO.TONE)) {
        new_value = handler.read(TESTINO.TONE);
        if (new_value.data) {
            let value = new_value.data.value;
            worker_data.buz_octave = parseInt(value / 256);
            worker_data.buz_note = (value % 256);
        } else if (new_value === 0) {
            worker_data.buz_octave = 0;
            worker_data.buz_note = 0;
        } else {
            worker_data.buz_octave = 0;
            worker_data.buz_note = 0;
        }
    }

    if (handler.e(TESTINO.MOTOR_STATE)) {
        new_value = handler.read(TESTINO.MOTOR_STATE);

        if (worker_data.motor_state != new_value) {
            worker_data.motor_state = new_value;
        }
    }

    if (handler.e(TESTINO.SERVO_ANGLE)) {
        new_value = handler.read(TESTINO.SERVO_ANGLE);
        if (new_value == 0) {
            new_value = 90;
        } else if (new_value > 130) {
            new_value = 130;
        } else if (new_value < 50) {
            new_value = 50;
        }
        worker_data.servo_angle = new_value;
    }

    if (handler.e(TESTINO.ULTRASONIC)) {
        new_value = handler.read(TESTINO.ULTRASONIC);
        worker_data.ultrasonic = new_value;
    }

    if (handler.e(TESTINO.MOTION)) {
        new_value = handler.read(TESTINO.MOTION);
        worker_data.motion = new_value;
    }

    if (handler.e(TESTINO.NEOPIXEL)) {
        new_value = handler.read(TESTINO.NEOPIXEL);
        if (new_value.data) {

            let red = new_value.data.red;
            let green = new_value.data.green;
            let blue = new_value.data.blue;
            let numAble = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'];
            
            if (new_value.data.numStr) {
                let num = new_value.data.numStr;
    
                if (numAble.includes(num)) {
                    worker_data.neopixel[num].r = red;
                    worker_data.neopixel[num].g = green;
                    worker_data.neopixel[num].b = blue;
                }
            } else {
                for (able in numAble) {
                    worker_data.neopixel[numAble[able]].r = red;
                    worker_data.neopixel[numAble[able]].g = green;
                    worker_data.neopixel[numAble[able]].b = blue;
                }
            }
        } else {
            worker_data.neopixel.first.r = 0;
            worker_data.neopixel.first.g = 0;
            worker_data.neopixel.first.b = 0;
            worker_data.neopixel.second.r = 0;
            worker_data.neopixel.second.g = 0;
            worker_data.neopixel.second.b = 0;
            worker_data.neopixel.third.r = 0;
            worker_data.neopixel.third.g = 0;
            worker_data.neopixel.third.b = 0;
            worker_data.neopixel.fourth.r = 0;
            worker_data.neopixel.fourth.g = 0;
            worker_data.neopixel.fourth.b = 0;
            worker_data.neopixel.fifth.r = 0;
            worker_data.neopixel.fifth.g = 0;
            worker_data.neopixel.fifth.b = 0;
            worker_data.neopixel.sixth.r = 0;
            worker_data.neopixel.sixth.g = 0;
            worker_data.neopixel.sixth.b = 0;
            worker_data.neopixel.seventh.r = 0;
            worker_data.neopixel.seventh.g = 0;
            worker_data.neopixel.seventh.b = 0;
            worker_data.neopixel.eighth.r = 0;
            worker_data.neopixel.eighth.g = 0;
            worker_data.neopixel.eighth.b = 0;
        }
    }

    if (handler.e(TESTINO.OUTER_MOTOR)) {
        new_value = handler.read(TESTINO.OUTER_MOTOR);
        worker_data.outer_motor = new_value;
    }

    this.worker_data = worker_data;
};


/* 엔트리HW -> 교구 */
Module.prototype.requestLocalData = function() {
    let worker_data = this.worker_data
    let tx_data = this.tx_data;
    let check_sum = 0;
    let data_len = 35;

    tx_data[0] = 0xff;
    tx_data[1] = 0x23;
    tx_data[2] = worker_data.buz_octave;
    tx_data[3] = worker_data.buz_note;
    tx_data[4] = worker_data.ultrasonic;
    tx_data[5] = worker_data.motion;
    tx_data[6] = worker_data.motor_state;
    tx_data[7] = worker_data.servo_angle;
    tx_data[8] = worker_data.neopixel.first.r;
    tx_data[9] = worker_data.neopixel.first.g;
    tx_data[10] = worker_data.neopixel.first.b;
    tx_data[11] = worker_data.neopixel.second.r;
    tx_data[12] = worker_data.neopixel.second.g;
    tx_data[13] = worker_data.neopixel.second.b;
    tx_data[14] = worker_data.neopixel.third.r;
    tx_data[15] = worker_data.neopixel.third.g;
    tx_data[16] = worker_data.neopixel.third.b;
    tx_data[17] = worker_data.neopixel.fourth.r;
    tx_data[18] = worker_data.neopixel.fourth.g;
    tx_data[19] = worker_data.neopixel.fourth.b;
    tx_data[20] = worker_data.neopixel.fifth.r;
    tx_data[21] = worker_data.neopixel.fifth.g;
    tx_data[22] = worker_data.neopixel.fifth.b;
    tx_data[23] = worker_data.neopixel.sixth.r;
    tx_data[24] = worker_data.neopixel.sixth.g;
    tx_data[25] = worker_data.neopixel.sixth.b;
    tx_data[26] = worker_data.neopixel.seventh.r;
    tx_data[27] = worker_data.neopixel.seventh.g;
    tx_data[28] = worker_data.neopixel.seventh.b;
    tx_data[29] = worker_data.neopixel.eighth.r;
    tx_data[30] = worker_data.neopixel.eighth.g;
    tx_data[31] = worker_data.neopixel.eighth.b;
    tx_data[32] = worker_data.outer_motor;
    tx_data[34] = 0xa;

    for (let i = 2; i < data_len-2; i++) {
        check_sum += tx_data[i];
    }
    tx_data[data_len-2] = check_sum % 256;

    this.tx_data = tx_data;

    return tx_data;
};

/* 교구 -> 엔트리HW */
Module.prototype.handleLocalData = function(data) {
    let self = this;
    let datas = this.getDataByBuffer(data);
    let sensor_data = this.sensor_data;

    datas.forEach(function(data) {
        if (data.length <= 4 || data[0] !== 255 || data[1] !== 12) {
            return;
        }
        let readData = data.subarray(2, data.length);
        let value;

        switch (readData[0]) {
            case self.sensorValueSize.FLOAT: {
                value = new Buffer(readData.subarray(2, 6)).readFloatLE();
                value = Math.round(value * 100) / 100;
                break;
            }
            case self.sensorValueSize.SHORT: {
                value = new Buffer(readData.subarray(2, 4)).readInt16LE();
                break;
            }
            default: {
                value = 0;
                break;
            }
        }

        let type = readData[readData.length - 1];
        let port = readData[1];

        switch (type) {
            case self.sensorTypes.DIGITAL: {
                switch (port) {
                    case 5: {
                        sensor_data.left_infared = value;
                        break;
                    }
                    case 6: {
                        sensor_data.left_infared = value;
                        break;
                    }
                    case 11: {
                        sensor_data.motion = value;
                        break;
                    }
                    default: {
                        break;
                    }
                }
                break;
            }
            case self.sensorTypes.ANALOG: {
                switch (port) {
                    case 0: {
                        sensor_data.gas = value;
                        break;
                    }
                    case 1: {
                        sensor_data.cds = value;
                        break;
                    }
                    case 2: {
                        sensor_data.tmp = ((value * 5.0 * 100) / 1024.0 - 3.0).toFixed(2);
                        break;
                    }
                    case 3: {
                        sensor_data.vibe = value;
                        break;
                    }
                    default: {
                        break;
                    }
                }
                break;
            }
            case self.sensorTypes.ULTRASONIC: {
                switch (port) {
                    case 13: {
                        sensor_data.ultrasonic = value;
                        break;
                    }
                    default: {
                        break;
                    }
                }
                break;
            }
            default: {
                break;
            }
        }
    })

    self.sensor_data = sensor_data;
};

Module.prototype.getDataByBuffer = function(buffer) {
    let datas = [];
    let lastIndex = 0;
    buffer.forEach(function(value, idx) {
        if (value == 13 && buffer[idx + 1] == 10) {
            datas.push(buffer.subarray(lastIndex, idx));
            lastIndex = idx + 2;
        }
    })
    return datas;
}

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
};

module.exports = new Module();
