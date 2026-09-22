const {
    ArduinoBase,
    // protocol
    SysexCMD,
    Instruction,
    Frequency,
    // define
    THREAD_STEP_INTERVAL,
    THREAD_STEP_INTERVAL_COMPATIBILITY,
    // util
    Sleep
} = require('./roborobo_base');

const ColorNumber = {
    RED: 1,
    ORANGE: 2,
    YELLOW: 3,
    YELLOWGREEN: 7,
    GREEN: 4,
    SKYBLUE: 8,
    BLUE: 5,
    PURPLE: 6,
    PINK: 9,
    BLACK: 10,
    WHITE: 11,
    NONE: 127
};

const ControlMode = {
    REALTIME: 0x00,
    CARD: 0x03,
    STOP: 0x05,
    CALIBRATION: 0x06,
    GYRO_DIRECTION: 0x07,
    LINE_TRACING: 0x08,
    DISCONNECT: 0x7F
};

const Direction = {
    FORWARD: 'FORWARD',
    BACKWARD: 'BACKWARD',
    LEFTWARD: 'LEFTWARD',
    RIGHTWARD: 'RIGHTWARD',
    TURNLEFT: 'TURNLEFT',
    TURNRIGHT: 'TURNRIGHT',
    STOP: 'STOP',
};

class RoE extends ArduinoBase {
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

        this._stopLineTracing();

        this._setMode(ControlMode.STOP);
        this._setMode(ControlMode.REALTIME);
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
        handler.write("state", {rx: this.state.rx, isLineTracerRunning: this.state.isLineTracerRunning});

        // 모니터 관련 정보
        handler.write('sensor_touch', this.state.rx.touch ? 1 : 0);
        handler.write('sensor_infrared', this.state.rx.infrared ? 1 : 0);
        handler.write('sensor_color_left', this._toRoEColorString(this.state.rx.colorSensor.left));
        handler.write('sensor_color_right', this._toRoEColorString(this.state.rx.colorSensor.right));
    }

    handleRemoteData (handler) {
        super.handleRemoteData(handler);
    }

    execute (command, data) {
        switch (command) {
            case 'reset': {
                this.reset();
            } break;
            case 'setMode': {
                this._setMode(data.mode);
            } break;
            case 'setStepMotor': {
                const motors = [];
                const keys = data ? Object.keys(data) : [];
                keys.forEach(key => motors.push(data[key]));
                this._setStepMotor(motors);
            } break;
            case 'setLineTracingMode': {
                this._setLineTracingMode(data.mode);
            } break;
            case 'stopLineTracing': {
                this._stopLineTracing();
            } break;
            case 'setRgbLedColor': {
                this._setRgbLedColor(data.color);
            } break;
            case 'setPiezoBuzzer': {
                this._setPiezoBuzzer(data.note, data.duration);
            } break;
        }
    }

    /**
     * @override
     */
    get targetVersion () {
        return {model: 64, hardware: 1, firmware: 26};
    }

    /**
     * @override
     */
    _getConnectionCheckCommand () {
        return this._getRequestAllVersionCommand();
    }

    /**
        * 실시간: 0, 카드리더모드: 3, 정지:5, 컬러보정모드:6, 자이로센서 기본자세:7, 라인트레이싱: 8, 연결해제: 127
        * @param {any} mode
        */
    _setMode (mode) {
        this._sendBuffer.push([
            SysexCMD.START, SysexCMD.SET, Instruction.SET_MODE,
            0x01, // legnth
            mode & 0x7F, // realtime
            SysexCMD.END
        ]);
    }

    /**
     * 
     * @param {any} motors
     */
    _setStepMotor (motors) {
        const isEqual = function () {
            let ret = true;
            for (let i = 0; i < motors.length; i++) {
                const m = motors[i];
                if (!m) {
                    ret = false;
                    break;
                }

                const obj = this.state.getTxStepMotor(i);
                ret &= (Object.entries(obj).toString() === Object.entries(m).toString());
            }
            return ret;
        }.bind(this);

        if (isEqual()) return;

        const data = [];
        for (let i = 0; i < motors.length; i++) {
            const m = motors[i];
            if (!m) continue;

            const obj = this.state.getTxStepMotor(i);
            const isInfinity = m.distance === undefined || m.distance === null;

            obj.motor = m.motor;
            obj.distance = isInfinity ? null : Math.max(0, Math.min(m.distance, 255));
            obj.state = m.state;

            m.distance = isInfinity ? 0 : Math.max(0, Math.min(m.distance, 255));
            data.push(m.state > 0 ? m.distance & 0x7F : 0);

            const distanceMsb = (m.distance >> 7) & 0x01;
            const num = ((m.motor - 1) & 0x01) << 2;
            const state = ((Math.max(1, m.state) - 1) & 0x01) << 4;
            const speed = 0x00 << 5;
            const infinity = (m.state > 0 && isInfinity ? 1 : 0) << 6;
            data.push((infinity + speed + state + num + distanceMsb) & 0x7F);

            if (isInfinity) continue;
            const reset = setTimeout(() => {
                if (Object.entries(obj).toString() === Object.entries(m).toString()) {
                    obj.motor = null;
                    obj.distance = null;
                    obj.state = null;
                    clearTimeout(reset);
                }
            }, m.distance);
        }

        if (data.length > 0) {
            data.unshift(SysexCMD.START, SysexCMD.SET, Instruction.SET_STEP_MOTOR, data.length);
            data.push(SysexCMD.END);
            this._sendBuffer.push(data);
        }
    }

    _setLineTracingMode (mode) {
        if (!this._lineTracer) {
            this.state.isLineTracerRunning = true;
            return this._lineTracer = this._startLineTracing(mode)
                .then(() => {
                    this._lineTracer = null;
                    this.state.isLineTracerRunning = false;
                })
                .catch(() => {
                    this._lineTracer = null;
                    this.state.isLineTracerRunning = false;
                });
        }
    }

    _startLineTracing (mode) {
        this._isLineTracerInterrupt = false;
        const isEquals = function (v1, v2, v3, v4) {
            let result = true;
            result &= (typeof v1 !== undefined && v1 === v2);
            result &= (typeof v3 !== undefined && v3 === v4);
            return result;
        };

        const color = this.state.rx.colorSensor;
        const defaultDelay = THREAD_STEP_INTERVAL_COMPATIBILITY;
        const isCurveMode = mode === 'curve';

        let delay = defaultDelay;
        let dir = Direction.STOP;
        let prevDir = Direction.STOP;
        let prevTurn = Direction.TURNLEFT;

        return new Promise(async (resolve, reject) => {
            this._setMode(ControlMode.LINE_TRACING);
            this._setStepMotor(this._getMotorsData(Direction.FORWARD));
            while (!this._isLineTracerInterrupt) {
                if (!isCurveMode) {
                    if (isEquals(color.left, ColorNumber.GREEN, color.right, ColorNumber.GREEN)) {
                        this._setStepMotor(this._getMotorsData(Direction.FORWARD));
                        await Sleep(500);
                    } else if (isEquals(color.left, ColorNumber.RED, color.right, ColorNumber.RED)) {
                        this._setStepMotor(this._getMotorsData(Direction.BACKWARD));
                        await Sleep(500);
                    } else if (isEquals(color.left, ColorNumber.YELLOW, color.right, ColorNumber.YELLOW)) {
                        this._setStepMotor(this._getMotorsData(Direction.FORWARD));
                        await Sleep(500);
                        this._setStepMotor(this._getMotorsData(Direction.TURNLEFT));
                        await Sleep(700);
                    } else if (isEquals(color.left, ColorNumber.BLUE, color.right, ColorNumber.BLUE)) {
                        this._setStepMotor(this._getMotorsData(Direction.FORWARD));
                        await Sleep(500);
                        this._setStepMotor(this._getMotorsData(Direction.TURNRIGHT));
                        await Sleep(700);
                    }
                }

                dir = Direction.STOP;
                delay = defaultDelay;

                if (isEquals(color.left, ColorNumber.PINK, color.right, ColorNumber.PINK)) {
                    this._setStepMotor(this._getMotorsData(dir = Direction.STOP));
                    this._isLineTracerInterrupt = true;
                    return resolve();
                } else if (isEquals(color.left, ColorNumber.BLACK, color.right, ColorNumber.BLACK)) {
                    if (isCurveMode && isEquals(prevTurn, Direction.RIGHTWARD)) {
                        dir = Direction.TURNLEFT;
                        prevTurn = Direction.STOP;
                        delay = 500;
                    } else {
                        dir = Direction.FORWARD;
                    }
                } else if (isEquals(color.left, ColorNumber.BLACK)) {
                    dir = Direction.LEFTWARD;
                    prevTurn = dir;
                } else if (isEquals(color.right, ColorNumber.BLACK)) {
                    dir = Direction.RIGHTWARD;
                    prevTurn = dir;
                } else {
                    if (this.state.rx.infrared) {
                        if (isEquals(prevDir, Direction.FORWARD) || isEquals(prevDir, Direction.LEFTWARD) || isEquals(prevDir, Direction.RIGHTWARD)) {
                            dir = prevDir;
                        } else {
                            dir = Direction.FORWARD;
                        }
                    } else {
                        if (isEquals(prevDir, Direction.FORWARD)) {
                            dir = prevDir;
                        } else {
                            dir = Direction.FORWARD;
                        }
                    }
                }

                this._setStepMotor(this._getMotorsData(dir));
                prevDir = dir;
                await Sleep(delay);
            }
            return resolve();
        }).then(() => {
            this._setStepMotor(this._getMotorsData(Direction.STOP));
            this._setMode(ControlMode.REALTIME);
        }).catch(() => {
            this._setStepMotor(this._getMotorsData(Direction.STOP));
            this._setMode(ControlMode.REALTIME);
        });
    }

    _getMotorsData (direction) {
        switch (direction) {
            case Direction.FORWARD: return [{motor: 1, state: 2}, {motor: 2, state: 1}];
            case Direction.BACKWARD: return [{motor: 1, state: 1}, {motor: 2, state: 2}];
            case Direction.LEFTWARD: return [{motor: 1, state: 0}, {motor: 2, distance: 45, state: 1}];
            case Direction.RIGHTWARD: return [{motor: 1, distance: 45, state: 2}, {motor: 2, state: 0}];
            case Direction.TURNLEFT: return [{motor: 1, distance: 90, state: 1}, {motor: 2, distance: 90, state: 1}];
            case Direction.TURNRIGHT: return [{motor: 1, distance: 90, state: 2}, {motor: 2, distance: 90, state: 2}];
            default: return [{motor: 1, distance: 0, state: 0}, {motor: 2, distance: 0, state: 0}];
        }
    }

    _stopLineTracing () {
        if (this._lineTracer) {
            this._isLineTracerInterrupt = true;
            return new Promise(async resolve => {
                while (this._lineTracer) {
                    await Sleep(THREAD_STEP_INTERVAL);
                }
                resolve();
            });
        }
    }

    /**
    * RGB LED 색상, 밝기 제어 함수
    * @param {{r: number[0, 255], g: number[0, 255], b: number[0, 255], a: number[0, 100]}} color
    */
    _setRgbLedColor (color) {
        if (!color) {
            color = {r: 0, g: 0, b: 0};
        } else {
            color.r = (typeof color.r === 'number') ? Math.min(255, Math.max(0, color.r)) : 0;
            color.g = (typeof color.g === 'number') ? Math.min(255, Math.max(0, color.g)) : 0;
            color.b = (typeof color.b === 'number') ? Math.min(255, Math.max(0, color.b)) : 0;
        }

        const obj = this.state.tx.rgbLed;
        if (Object.entries(obj).toString() === Object.entries(color).toString()) return;
        else {
            obj.r = color.r;
            obj.g = color.g;
            obj.b = color.b;
        }

        const rMsb = (color.r >> 7) & 0x01;
        const gMsb = ((color.g >> 7) & 0x01) << 1;
        const bMsb = ((color.b >> 7) & 0x01) << 2;

        this._sendBuffer.push([
            SysexCMD.START, SysexCMD.SET, Instruction.SET_OUTPUT_WRITE,
            0x06, // legnth
            0x00, // default
            0x00, // led
            color.r & 0x7F, // realtime
            color.g & 0x7F, // realtime
            color.b & 0x7F, // realtime
            (rMsb + gMsb + bMsb) & 0x7F,
            SysexCMD.END
        ]);
    }

    _playSounds (num) {
        if (!this.isRealtimeAvailable) return;

        num = Math.max(0, Math.min(127, num)) & 0x7F;
        this._sendBuffer.push([
            SysexCMD.START, SysexCMD.SET, Instruction.SET_OUTPUT_WRITE,
            0x03, // legnth
            0x00, // default
            0x02, // sound
            num,  // sound number
            SysexCMD.END
        ]);
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
            case 0x00: { // datas[4] == 0x00 left, datas[7] == 0x01 right
                this.state.rx.colorSensor.left = data[5];
                this.state.rx.colorSensor.right = data[8];
            } break;
            case 0x02: { // infrared
                this.state.rx.infrared = data[5] == 1;
            } break;
            case 0x03: { // touch
                this.state.rx.touch = data[5] == 1;
            } break;
            case 0x04: {
            } break;
            default:
                return false;
        }
        return true;
    }

    _toRoEColorString (protocol) {
        switch (protocol) {
            case 1: return 'RED';
            case 2: return 'ORANGE';
            case 3: return 'YELLOW';
            case 7: return 'YELLOW GREEN';
            case 4: return 'GREEN';
            case 8: return 'SKY BLUE';
            case 5: return 'BLUE';
            case 6: return 'PURPLE';
            case 9: return 'PINK';
            case 10: return 'BLACK';
            case 11: return 'WHITE';
            default: return 'UNKNOWN';
        }
    }
}

class State {
    constructor () {

        this.isLineTracerRunning = false;

        this.tx = {
            /**
             * motor index 사용 [0, 3]
             * motor num => [1, 4]
             * pin number => motor num 1:[4, 5] 2:[6, 7], 3:[8, 9], 4:[10, 11]
             * {
             *      motor: 1, => [1, 2] motor num
             *      distance: 0, => [0, 255]
             *      state: 0  => [0: 정지, 1: 정회전, 2: 역회전]
             * }
             */
            stepMotor: [],
            /**
             *
             */
            rgbLed: {
                r: null,
                g: null,
                b: null
            },
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
        };

        this.rx = {
            /**
             *
             */
            infrared: false,
            /**
             *
             */
            touch: false,

            colorSensor: {
                left: 127,
                right: 127
            }
        };
    }

    /**
    * 
    * @param {number} index [0, 1]
    */
    getTxStepMotor (index) {
        if (!this.tx.stepMotor[index]) {
            this.tx.stepMotor[index] = {
                motor: null,
                distance: null,
                state: null
            };
        }
        return this.tx.stepMotor[index];
    }
}

module.exports = new RoE();