function Module() {
    this.tx_max_len = 14;
    this.tx_data = new Array(this.tx_max_len);

    this.sensor_data = {
        vibe: 0,
    };

    this.worker_data = {
        tone: 0,
        buz_octave: 0,
        buz_note: 0,
        motor_state: 0,
        led: 0,
        shoot_state: 0,
        d9: 0,
        d10: 0,
        angle_state: 0,
    };

    this.sensorValueSize = {
        FLOAT: 2,
        SHORT: 3,
    };

    this.sensorTypes = {
        ALIVE: 0,
        VIBE: 1,
        TIMER: 2,
    };
}

const NEOCANNON = {
    TONE: 'tone',
    MOTOR_STATE: 'motorState',
    LED: 'led',
    SHOOT_STATE: 'shootState',
    D9: 'd9',
    D10: 'd10',
    ANGLE_STATE: 'angleState',
};

Module.prototype.init = function(handler, config) {};

Module.prototype.setSerialPort = function(sp) {
    this.sp = sp;
};

Module.prototype.requestInitialData = function() {
    const txData = this.tx_data;
    txData[0] = 0xff;
    txData[1] = 0x0e;
    txData[2] = 0x01;
    txData[3] = 0x03;
    for (let i = 4; i < this.tx_max_len - 2; i++) {
        txData[i] = 0;
    }
    txData[12] = 0x4;
    txData[13] = 0xa;
    return txData;
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
    const sensorData = this.sensor_data;
    for (const key in sensorData) {
        handler.write(key, sensorData[key]);
    }
};

/** 엔트리JS -> 엔트리HW */
Module.prototype.handleRemoteData = function(handler) {
    const workerData = this.worker_data;
    let newValue;

    if (handler.e(NEOCANNON.TONE)) {
        newValue = handler.read(NEOCANNON.TONE);
        if (newValue.data) {
            const value = newValue.data.value;
            workerData.buz_octave = value >> 8;
            workerData.buz_note = value & 255;
        } else if (newValue === 0) {
            workerData.buz_octave = 0;
            workerData.buz_note = 0;
        } else {
            workerData.buz_octave = 0;
            workerData.buz_note = 0;
        }
    }

    if (handler.e(NEOCANNON.MOTOR_STATE)) {
        newValue = handler.read(NEOCANNON.MOTOR_STATE);

        if (workerData.motor_state != newValue) {
            workerData.motor_state = newValue;
        }
    }

    if (handler.e(NEOCANNON.LED)) {
        newValue = handler.read(NEOCANNON.LED);
        workerData.led = newValue;
    }

    if (handler.e(NEOCANNON.SHOOT_STATE)) {
        newValue = handler.read(NEOCANNON.SHOOT_STATE);
        workerData.shoot_state = newValue;
    }

    if (handler.e(NEOCANNON.D9)) {
        newValue = handler.read(NEOCANNON.D9);
        workerData.d9 = newValue;
    }

    if (handler.e(NEOCANNON.D10)) {
        newValue = handler.read(NEOCANNON.D10);
        workerData.d10 = newValue;
    }

    if (handler.e(NEOCANNON.ANGLE_STATE)) {
        newValue = handler.read(NEOCANNON.ANGLE_STATE);
        workerData.angle_state = newValue;
    }

    this.worker_data = workerData;
};

/* 엔트리HW -> 교구 */
Module.prototype.requestLocalData = function() {
    const workerData = this.worker_data;
    const txData = this.tx_data;
    let checkSum = 0;
    const dataLen = txData.length;

    txData[0] = 0xff;
    txData[1] = 0x0e;
    txData[2] = 0x01;
    txData[3] = 0x03;
    txData[4] = workerData.buz_octave;
    txData[5] = workerData.buz_note;
    txData[6] = workerData.motor_state;
    txData[7] = workerData.led;
    txData[8] = workerData.shoot_state;
    txData[9] = workerData.d9;
    txData[10] = workerData.d10;
    txData[11] = workerData.angle_state;
    txData[13] = 0xa;

    for (let i = 2; i < dataLen - 2; i++) {
        checkSum += txData[i];
    }
    txData[dataLen - 2] = checkSum & 255;

    this.tx_data = txData;

    return txData;
};

/* 교구 -> 엔트리HW */
Module.prototype.handleLocalData = function(data) {
    const datas = this.getDataByBuffer(data);
    const sensorData = this.sensor_data;

    datas.forEach((data) => {
        if (data.length <= 4 || data[0] !== 255 || data[1] !== 7) {
            return;
        }
        const readData = data.subarray(2, data.length);
        let value;
        let checkSum;

        const idx = readData[0];
        if (idx == 1) {
            if (readData.length != 4) {
                return;
            }
            const vibeState = readData[1];
            const life = readData[2];
            checkSum = (idx + vibeState + life) & 0xff;
            if (checkSum != readData[3]) return;

            sensorData.vibe = vibeState;
        }
    });
    this.sensor_data = sensorData;
};

Module.prototype.getDataByBuffer = function(buffer) {
    const datas = [];
    let lastIndex = 0;
    buffer.forEach((value, idx) => {
        if (value == 13 && buffer[idx + 1] == 10) {
            datas.push(buffer.subarray(lastIndex, idx));
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
    this.lastTime = 0;
    this.lastSendTime = 0;
};

module.exports = new Module();
