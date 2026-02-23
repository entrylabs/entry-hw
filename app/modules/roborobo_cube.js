const {
    ArduinoBase,
    // protocol
    SysexCMD,
    Instruction,
    Frequency,
    DrawMode
} = require('./roborobo_base');

class Cube extends ArduinoBase {
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

    /**
     * @override
     */
    reset () {
        super.reset();

        this._clearDotMatrix();
        this._setSensorMode(0);
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

    /**
     * @override
     */
    requestRemoteData (handler) {
        handler.write("state", {rx: this.state.rx});

        // 모니터 관련 정보
        handler.write('sensor_gesture', this._toGestureDiectionString());
        handler.write('sensor_proximity', this._getProximitySensorValue());
    }

    handleRemoteData (handler) {
        super.handleRemoteData(handler);
    }

    execute (command, data) {
        switch (command) {
            case 'reset': {
                this.reset();
            } break;
            case 'setDotMatrix': {
                this._setDotMatrix(data);
            } break;
            case 'setPiezoBuzzer': {
                this._setPiezoBuzzer(data.note, data.duration);
            } break;
            case 'setSensorMode': {
                this._setSensorMode(data.option);
            } break;
        }
    }

    /**
     * @override
     */
    get targetVersion () {
        return {model: 65, hardware: 1, firmware: 18};
    }

    /**
     * @override
     */
    _getConnectionCheckCommand () {
        return this._getRequestAllVersionCommand();
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
                const index = info.x + info.y * 7;
                dots = dots.substring(0, index) + info.dot + dots.substring(index + 1, 7 * 7 - 1);
            } break;
            case 'row': {
                dots = dots.substring(0, info.y * 7) + info.dots + dots.substring((info.y + 1) * 7, 7 * 7 - 1);
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

        // Dot Matrix 데이터가 없거나 모두 꺼져있는 경우.
        if (sum == 0) {
            this._sendBuffer.push([SysexCMD.START, SysexCMD.SET, Instruction.SET_DOTMATRIX, 0x01, DrawMode.CLEAR, SysexCMD.END]);
            return;
        }

        const data = [DrawMode.BIT];
        for (let i = 0; i < 7; i++) {
            let dot = 0;
            for (let j = 0; j < 7; j++) {
                const index = (i * 7) + j;
                dot += (dots[index] == 1) ? 1 << (7 - j - 1) : 0;
            }
            data.push(dot);
        }

        data.unshift(SysexCMD.START, SysexCMD.SET, Instruction.SET_DOTMATRIX, data.length);
        data.push(SysexCMD.END);
        this._sendBuffer.push(data);
    }

    _clearDotMatrix () {
        this._setDotMatrix({type: 'all', dots: this._defaultDots()});
    }

    _defaultDots () {
        const length = 7 * 7;
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
        const length = 7 * 7;
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

    _playSounds (num) {
        num = Math.max(0, Math.min(127, num)) & 0x7F;
        this._sendBuffer.push([
            SysexCMD.START, SysexCMD.SET, Instruction.SET_OUTPUT_WRITE,
            0x03, // legnth
            0x00, // default
            0x02, // sound
            num,  // sound number
            SysexCMD.END]);
    }

    /**
     * 피에조 버저 소리 제어 함수
     * @param {number} pin [2, 15]
     * @param {number} note
     * @param {number} duration
     */
    _setPiezoBuzzer (note, duration) {
        if (typeof note === 'number') {
            const max = Object.keys(Frequency).length;
            note = Math.min(max, Math.max(0, note));
        } else {
            note = 0;
        }
        duration = (typeof duration === 'number') ? duration = Math.max(0, duration) : 0;

        const obj = this.state.tx.piezo;
        if (Object.entries(obj).toString() === Object.entries({note, duration}).toString()) return;
        else {
            obj.note = note;
            obj.duration = duration;
        }

        let frequency = Math.round(Frequency[note]);
        let frequencies = [(frequency & 0xFF), ((frequency >> 8) & 0xFF)];

        const frequencyMsb = (frequencies[0] >> 7) & 0x01;
        frequencies[0] = frequencies[0] & 0x7F;
        frequencies[1] = ((frequencies[1] << 1) + frequencyMsb) & 0x7F;

        const msec = duration * 1000;
        let durations = [(msec & 0xFF), ((msec >> 8) & 0xFF)];

        const durationMsb = (durations[0] >> 7) & 0x01;
        durations[0] = durations[0] & 0x7F;
        durations[1] = ((durations[1] << 1) + durationMsb) & 0x7F;

        this._sendBuffer.push([
            SysexCMD.START, SysexCMD.SET, Instruction.SET_OUTPUT_WRITE,
            0x07, //length
            0x00,
            0x01, // buzzer: 1
            0x00, // on: 0, off: 1
            frequencies[0],
            frequencies[1],
            durations[0],
            durations[1],
            SysexCMD.END
        ]);

        // 0초 재생은 반복할 의미가 없으므로 리턴
        if (duration === 0) return;
        // 음이 같아도 반복적으로 동작하기 위하여 출력 후 초기화
        const reset = setTimeout(() => {
            const obj = this.state.tx.piezo;
            if (Object.entries(obj).toString() === Object.entries({note, duration}).toString()) {
                obj.note = null;
                obj.duration = null;
                clearTimeout(reset);
            }
        }, msec * 0.8);
    }

    /**
     * 사용안함: 0, 근접 센서:2, 제스쳐 센서: 3
     * @param {any} sensor
     */
    _setSensorMode (sensor = 0) {
        if (this.state.tx.sensorMode === sensor) return;
        this.state.tx.sensorMode = sensor;

        this._sendBuffer.push([
            SysexCMD.START, SysexCMD.SET, Instruction.SET_SENSOR_MODE,
            0x01, // length
            Math.max(0, Math.min(127, sensor)) & 0x7F,
            SysexCMD.END
        ]);
    }

    _getProximitySensorValue () {
        const value = this.state.rx.proximity;
        let result = 0; // not detected
        if (value >= 255) {
            result = 0;
        } else if (value >= 115) {
            result = 1;
        } else if (value >= 50) {
            result = 2;
        } else if (value >= 30) {
            result = 3;
        } else if (value >= 15) {
            result = 4;
        } else if (value >= 8) {
            result = 5;
        } else {
            result = 6;
        }
        return result;
    }

    /**
     * 자이로 센서 기준 방향 초기화 함수
     * @override
     * @param {number} type
     */
    _resetGyroSensor (type) {
        type = Math.max(0, Math.min(7, type)) & 0x0F;
        this._sendBuffer.push([
            SysexCMD.START, SysexCMD.SET, Instruction.SET_MODE,
            0x02, // length
            0x07, // 자이로 기본 자세 
            type, // 0: 기준 축 계산 및 설정, 1: 기준 축으로 초기화
            SysexCMD.END
        ]);
    }

    /**
     * @override
     * @param {Array} data
     */
    _processSysexCMD_Get (data) {
        if (data.length < 4) return;

        const length = data[3] + 5;
        if (data.length < length) return;
        if (data[length - 1] != 0xF7) {
            data.splice(0, 1);
            return;
        }

        if (data[2] == Instruction.GET_SENSOR && this._processSysexCMD_GetSensor(data)) {
            data.splice(0, length);
        } else {
            super._processSysexCMD_Get(data);
        }
    }

    /**
     * @override
     * @param {Array} data
     */
    _processSysexCMD_GetSensor (data) {
        switch (data[4]) {
            case 0x00: {
                this.state.rx.buttons.g = data[5] == 0;
            } break;
            case 0x01: {
                this.state.rx.buttons.b = data[5] == 0;
            } break;
            case 0x02: {
                this.state.rx.buttons.r = data[5] == 0;
            } break;
            case 0x03: {
                this.state.rx.buttons.y = data[5] == 0;
            } break;
            case 0x07: { // gesture
                this.state.rx.gesture = data[5] + ((data[6] & 0x01) << 7);
                if (this._resetTimer) {
                    clearTimeout(this._resetTimer);
                    this._resetTimer = null;
                }

                this._resetTimer = setTimeout(() => {
                    this.state.rx.gesture = 127;
                    clearTimeout(this._resetTimer);
                }, 300);

            } break;
            case 0x08: { // proximity
                this.state.rx.proximity = data[5] + ((data[6] & 0x01) << 7);
            } break;
            case 0x09: {
                const obj = this.state.rx.gyro;
                obj.angle.x = (data[5] + ((data[6] & 0x01) << 7)) * ((data[6] >> 4 & 0x01) == 1 ? 1 : -1);
                obj.angle.y = (data[7] + ((data[8] & 0x01) << 7)) * ((data[8] >> 4 & 0x01) == 1 ? 1 : -1);
                obj.angle.z = (data[9] + ((data[10] & 0x01) << 7)) * ((data[10] >> 4 & 0x01) == 1 ? 1 : -1);

                obj.gyro.x = (data[11] + ((data[12] & 0x01) << 7)) * ((data[12] >> 4 & 0x01) == 1 ? 1 : -1);
                obj.gyro.y = (data[13] + ((data[14] & 0x01) << 7)) * ((data[14] >> 4 & 0x01) == 1 ? 1 : -1);
                obj.gyro.z = (data[15] + ((data[16] & 0x01) << 7)) * ((data[16] >> 4 & 0x01) == 1 ? 1 : -1);

                obj.accel.x = (data[17] & 0x3F) * ((data[17] >> 6 & 0x01) == 1 ? 1 : -1);
                obj.accel.y = (data[18] & 0x3F) * ((data[18] >> 6 & 0x01) == 1 ? 1 : -1);
                obj.accel.z = (data[19] & 0x3F) * ((data[19] >> 6 & 0x01) == 1 ? 1 : -1);

                obj.shake = data[20] & 0x01;
            } break;
            default:
                return false;
        }
        return true;
    }

    _toGestureDiectionString () {
        switch (this.state.rx.gesture) {
            case 1: return 'RIGHT';
            case 2: return 'DOWN';
            case 4: return 'LEFT';
            case 8: return 'UP';
            default: return 'NONE';
        }
    }
}

class State {
    constructor () {
        this.tx = {
            /**
             * 0 또는 1로 길이 7 * 7로 구성된 문자열
             */
            dotMatrix: null,
            /**
             * {
             *      note: 0, => 건반 번호
             *      duration: 0 => 지속 시간
             * }
             */
            piezo: {
                note: null,
                duration: null
            },

            sensorMode: 0
        };

        /**
         * 센서의 값을 수신하여 저장
         */
        this.rx = {
            gyro: {
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
                accel: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                shake: 0,
            },

            gesture: 127,

            proximity: 6,
            /**
             * 버튼이 눌렸는지 여부
             */
            buttons: {
                r: false,
                g: false,
                b: false,
                y: false
            }
        };
    }
}

module.exports = new Cube();