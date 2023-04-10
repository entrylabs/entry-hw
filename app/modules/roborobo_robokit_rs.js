const {
    ArduinoBase,
    ArduinoStateBase,
    PinMode,
    SysexCMD,
    Instruction
} = require('./roborobo_base');

const DrawMode = {
    BIT: 0x00,
    POINT: 0x01,
    SIGN: 0x02,
    STRING: 0x03,
    SCROLLDRAW: 0x04,
    CLEAR: 0x07
}

class RobokitRS extends ArduinoBase {
    constructor () {
        super();
    }

    /**
     * @override
     */
    newTypedState () {
        return new State();
    }

    init (handler, config) {
        super.init(handler, config);
    }

    reset () {
        super.reset();
    }

    requestInitialData () {
        return super.requestInitialData();
    }

    checkInitialData (data, config) {
        return super.checkInitialData(data, config);
    }

    validateLocalData (data) {
        return super.validateLocalData(data);
    }

    requestLocalData () {
        return super.requestLocalData();
    }

    handleLocalData (data) {
        super.handleLocalData(data);
    }

    requestRemoteData (handler) {
        super.requestRemoteData(handler);

        for (let i = 2; i <= 13; i++) {
            let value = this.state.rx.digital[i];
            value = this.isEqualsPinMode(i, PinMode.INPUT) && typeof value === 'number' ? value : 0;
            handler.write('digital_' + i, value);
        }

        for (let i = 0; i <= 5; i++) {
            let value = this.state.rx.analog[i];
            value = this.isEqualsPinMode(i + 14, PinMode.ANALOG) && typeof value === 'number' ? value : 0;
            handler.write('analog_' + i, value);
        }

        handler.write("sensor_gyroscope_angle_x", this.state.rx.gyro.enable ? this.state.rx.gyro.angle.x : 0);
        handler.write("sensor_gyroscope_angle_y", this.state.rx.gyro.enable ? this.state.rx.gyro.angle.y : 0);
        handler.write("sensor_gyroscope_angle_z", this.state.rx.gyro.enable ? this.state.rx.gyro.angle.z : 0);
        handler.write("sensor_gyroscope_gyro_x", this.state.rx.gyro.enable ? this.state.rx.gyro.gyro.x : 0);
        handler.write("sensor_gyroscope_gyro_y", this.state.rx.gyro.enable ? this.state.rx.gyro.gyro.y : 0);
        handler.write("sensor_gyroscope_gyro_z", this.state.rx.gyro.enable ? this.state.rx.gyro.gyro.z : 0);
        handler.write("sensor_gyroscope_shake", this.state.rx.gyro.enable ? this.state.rx.gyro.shake : 0);
    }

    handleRemoteData (handler) {
        super.handleRemoteData(handler);
    }

    /**
     * @override
     * @param {any} command
     * @param {any} data
     */
    execute (command, data) {
        switch (command) {
            case 'setDotMatrix': {
                this._setDotMatrix(data);
            } break;
            case 'enableGyroSensor': {
                this._enableGyroSensor();
            } break;
            case 'resetGyroSensor': {
                this._resetGyroSensor(data.direction);
            } break;
            default: {
                super.execute(command, data);
            } break;
        }
    }

    /**
     * @override
     */
    get targetVersion () {
        return {model: 0, hardware: 10, firmware: 28}
    }

    /**
     * @param {string} info 0 또는 1로 이루어진 문자열 (ex=>'00101001111~')
     */
    _setDotMatrix (info) {

        let dots = this.state.tx.dotMatrix;
        if (!dots) {
            dots = this._defaultDots();
        }

        switch (info.type) {
            case 'dot': {
                const index = info.x + info.y * 15;
                dots = dots.substring(0, index) + info.dot + dots.substring(index + 1, 15 * 7 - 1);
            } break;
            case 'row': {
                dots = dots.substring(0, info.y * 15) + info.dots + dots.substring((info.y + 1) * 15, 15 * 7 - 1);
            } break;
            case 'all': {
                dots = info.dots;
            } break;
        }

        if (this.state.tx.dotMatrix === dots) return;
        else this.state.tx.dotMatrix = dots;

        dots = this._toDots(dots);
        let sum = 0;
        if (dots && dots.length > 0) {
            dots.forEach(v => sum += v);
        }

        this.setPinMode(18, PinMode.I2C);
        this.setPinMode(19, PinMode.I2C);

        // Dot Matrix 데이터가 없거나 모두 꺼져있는 경우.
        if (sum == 0) {
            this._sendBuffer.push([SysexCMD.START, SysexCMD.SET, Instruction.SET_DOTMATRIX, 0x01, DrawMode.CLEAR, SysexCMD.END]);
            return;
        }

        const data = [DrawMode.BIT];
        for (let i = 0; i < 15; i++) {
            let dot = 0;
            for (let j = 0; j < 7; j++) {
                const index = i + (j * 15);
                dot += (dots[index] == 1) ? 1 << j : 0;
            }
            data.push(dot);
        }

        data.unshift(SysexCMD.START, SysexCMD.SET, Instruction.SET_DOTMATRIX, data.length);
        data.push(SysexCMD.END);
        this._sendBuffer.push(data);
    }

    _defaultDots () {
        const length = 15 * 7;
        let dots = '';
        for (let i = 0; i < length; i++) {
            dots += 0;
        }
        return dots;
    }

    /**
     * dotMatrix 문자열 형태의 값을 number array로 반환 하는 함수
     * @param {string} data 0 또는 1로 이루어진 문자열 (ex=>'00101001111~')
     * @returns {Array.<number>} 
     */
    _toDots (data) {
        let dots = [];
        const length = 15 * 7;
        if (!data || data.length <= 0) {
            for (let i = 0; i < length; i++) {
                dots.push(0);
            }
            return dots;
        }

        for (let i = 0; i < length; i++) {
            const dot = data[i];
            if (dot == '1') {
                dots.push(1);
            } else {
                dots.push(0);
            }
        }
        return dots;
    }

    /**
     * 장치로부터 자이로 센서 값을 전달받기 위한 설정 및 자이로 센서 값 반환 함수
     */
    _enableGyroSensor () {
        if ((this.setPinMode(18, PinMode.I2C) && this.setPinMode(19, PinMode.I2C)) || !this.state.rx.gyro.enable) {
            this._sendBuffer.push([SysexCMD.START, SysexCMD.SET, Instruction.SET_MODE, 0x02, 0x07, 0x00, SysexCMD.END]);
            this.state.rx.gyro.enable = true;
        }
    }

    /**
     * 자이로 센서 기준 방향 초기화 함수
     * @param {number} direction
     */
    _resetGyroSensor (direction) {
        this.setPinMode(18, PinMode.I2C);
        this.setPinMode(19, PinMode.I2C);
        this.state.rx.gyro.enable = true;

        direction = Math.max(0, Math.min(7, direction)) & 0x0F;
        this._sendBuffer.push([SysexCMD.START, SysexCMD.SET, Instruction.SET_MODE, 0x02, 0x07, direction, SysexCMD.END]);
    }
}

class State extends ArduinoStateBase {
    constructor () {
        super();

        /**
         * 0 또는 1로 길이 7 * 15로 구성된 문자열
         */
        this.tx.dotMatrix = null;

        /**
         * I2C pin 사용 [18, 19] 번호 고정
         */
        this.rx.gyro = {
            enable: false,
            angle: {
                x: 0,
                y: 0,
                z: 0
            },
            gyro: {
                x: 0,
                y: 0,
                z: 0
            },
            shake: 0,
        }
    }
}

module.exports = new RobokitRS();
