const BaseModule = require('./baseModule');

const THREAD_STEP_INTERVAL = 1000 / 60;
const THREAD_STEP_INTERVAL_COMPATIBILITY = 1000 / 30;

const FirmataCMD = {
    ENABLE_DIGITAL: 0xD0,
    DIGITAL_CH0: 0x90,
    DIGITAL_CH1: 0x91,
    ENABLE_ANALOG: 0xC0,
    ANALOG_PIN0: 0xE0,
    ANALOG_PIN1: 0xE1,
    ANALOG_PIN2: 0xE2,
    ANALOG_PIN3: 0xE3,
    ANALOG_PIN4: 0xE4,
    ANALOG_PIN5: 0xE5,
    SET_PIN_MODE: 0xF4,
    GET_VERSION: 0xF9,
    RESET: 0xFF,
};

const PinMode = {
    INPUT: 0x00,
    OUTPUT: 0x01,
    ANALOG: 0x02,
    PWM: 0x03,
    SERVO: 0x04,
    SHIFT: 0x05,
    I2C: 0x06,
    ONEWIRE: 0x07,
    STEPPER: 0x08,
    ENCODER: 0x09,
    TONE: 0x0A,
    SONAR: 0x0B,
    SERIAL: 0x0C,
    PULLUP: 0x0D,
    RGBLED: 0x0E,
    ROTARYPOSITION: 0x0F,
    IGNORE: 0x7F
};

const SysexCMD = {
    START: 0xF0,
    SET: 0x00,
    GET: 0x01,
    TONE_DATA: 0x5F,
    SONAR_CONFIG: 0x62,
    SONAR: 0x63,
    SERVO: 0x70,
    I2C_REQUEST: 0x76,
    I2C_REPLY: 0x77,
    I2C_CONFIG: 0x78,
    END: 0xF7
};

const Instruction = {
    DIGITAL: 0x00,
    ANALOG: 0x01,
    SET_MOTOR: 0x02,
    SET_SERVO: 0x03,
    SET_STEP_MOTOR: 0x05,
    SET_DISPLAY: 0x06,
    SET_RGBLED: 0x07,
    SET_DOTMATRIX: 0x08,
    SET_OUTPUT_WRITE: 0x0A,
    SET_ADVANCED: 0x50,
    SET_SENSOR_MODE: 0x51,
    SET_MODE: 0x7D,
    SET_RESET: 0x7F,
    GET_SENSOR: 0x02,
    GET_CONNECT_MODE: 0x7A,
    GET_ID: 0x7B,
    GET_VOLTAGE: 0x7C,
    GET_VERSION_FIRMWARE: 0x7D,
    GET_VERSION_HARDWARE: 0x7E,
    GET_VERSION: 0x7F,
};

const Frequency = {
    0: 32.7032, 1: 34.6478, 2: 36.7081, 3: 38.8909, 4: 41.2034, 5: 43.6535, 6: 46.2493, 7: 48.9994, 8: 51.9130, 9: 55.0000, 10: 58.2705, 11: 61.7354,
    12: 65.4064, 13: 69.2957, 14: 73.4162, 15: 77.7817, 16: 82.4069, 17: 87.3071, 18: 92.4986, 19: 97.9989, 20: 103.8262, 21: 110.0000, 22: 116.5409, 23: 123.4708,
    24: 130.8128, 25: 138.5913, 26: 146.8324, 27: 155.5636, 28: 164.8138, 29: 174.6141, 30: 184.9972, 31: 195.9977, 32: 207.6523, 33: 220.0000, 34: 233.0819, 35: 246.9417,
    36: 261.6256, 37: 277.1826, 38: 293.6648, 39: 311.1270, 40: 329.6276, 41: 349.2282, 42: 369.9944, 43: 391.9954, 44: 415.3047, 45: 440.0000, 46: 466.1638, 47: 493.8833,
    48: 523.2511, 49: 554.3653, 50: 587.3295, 51: 622.2544, 52: 659.2551, 53: 698.4565, 54: 739.9888, 55: 783.9909, 56: 830.6094, 57: 880.0000, 58: 932.3275, 59: 987.7666,
    60: 1046.502, 61: 1108.731, 62: 1174.659, 63: 1244.509, 64: 1318.510, 65: 1396.913, 66: 1479.978, 67: 1567.982, 68: 1661.219, 69: 1760.000, 70: 1864.655, 71: 1975.533,
    72: 2093.005, 73: 2217.461, 74: 2349.318, 75: 2489.018, 76: 2637.020, 77: 2793.826, 78: 2959.955, 79: 3135.963, 80: 3322.438, 81: 3520.000, 82: 3729.310, 83: 3951.066,
    84: 4186.009, 85: 4434.922, 86: 4698.636, 87: 4978.036, 88: 5274.041, 89: 5587.652, 90: 5919.911, 91: 6271.927, 92: 6644.875, 93: 7040.000, 94: 7458.620, 95: 7902.133,
    96: 8372.018
};

const DrawMode = {
    BIT: 0x00,
    POINT: 0x01,
    SIGN: 0x02,
    STRING: 0x03,
    SCROLLDRAW: 0x04,
    CLEAR: 0x07
};

const RATIO_CONVERT_ANALOG_TO_ANGLE = 0.3515625;

class ArduinoBase extends BaseModule {
    constructor () {
        super();
        this.state = this.newTypedState();
    }

    newTypedState () {throw new Error('������ �ʿ�');}

    setSerialPort (serialPort) {
        this._serialPort = serialPort;
    }

    /**
     * ���ʿ� Ŀ�ؼ��� �̷���� ���� �ʱ� ����.
     * handler �� ��ũ�����̽��� ����� �����͸� json ȭ �ϴ� ������Ʈ�Դϴ�. (datahandler/json ����)
     * config �� module.json ������Ʈ�Դϴ�.
     */
    init (handler, config) {
        this._lastTime = Date.now();
        this.reset();
    }

    reset () {
        this.state = this.newTypedState();

        this._receiveBuffer = [];
        this._sendBuffer = [];
    }

    /**
     * ���� �� �ʱ⿡ �۽��� �����Ͱ� �ʿ��� ��� ����մϴ�.
     * requestInitialData �� ����� ��� checkInitialData �� �ʼ��Դϴ�.
     * �� �� �Լ��� ���ǵǾ��־�� ������ �����մϴ�. �ʿ������ �ۼ����� �ʾƵ� �˴ϴ�.
     */
    requestInitialData () {
        return this._getRequestAllVersionCommand();
    }

    /**
     * ���� �� �ʱ⿡ ���Ź޾Ƽ� ���󿬰������� Ȯ���ؾ��ϴ� ��� ����մϴ�.
     * @param {any} data
     * @param {any} config
     */
    checkInitialData (data, config) {
        const bytes = [];
        for (let i = 0; i < data.length; i++) {
            bytes.push(data[i]);
        }

        this._version = {model: 0, firmware: 0};
        this._processReceiveData(bytes);
        if (this._version.firmware == this.targetVersion.firmware && this._version.firmware % 2 == 0) {
            return this._version.model == this.targetVersion.model;
        }
    }

    // �ֱ������� �ϵ����� ���� �������� ������ �ʿ��� ��� ����մϴ�.
    validateLocalData (data) {
        return true;
    }

    /**
    * �ϵ���� ��⿡ ������ �����͸� ��ȯ�մϴ�.
    * slave ����� ��� duration �Ӽ� �������� ���������� ��⿡ ��û�� �����ϴ�.
    */
    requestLocalData () {
        const buffer = [];
        for (let i = 0; i < this._sendBuffer.length; i++) {
            const bytes = this._sendBuffer.shift();
            if (bytes && bytes.length > 0) {
                buffer.push(...bytes);
            }
        }

        //  ���� ���� ���� 
        const time = Date.now() - this._lastTime;
        if (time >= 3000) {
            this._serialPort.close();
        } else if (time >= 1000) {
            buffer.push(...this._getConnectionCheckCommand());
        }
        return buffer;
    }

    // �ϵ����� �� ������ ó��
    handleLocalData (data) {
        this._receiveBuffer.push(...data);
        this._lastTime = Date.now();
        while (this._receiveBuffer.length > 0) {
            const length = this._receiveBuffer.length;
            this._processReceiveData(this._receiveBuffer);

            // ������ �߰��� ������ �����Ǿ� ������ ������ �߰����� ���� ��� ���� ������ �����ϱ� ����
            if (length == this._receiveBuffer.length && Date.now() - this._lastTime >= 200) {
                this._receiveBuffer.splice(0, 1);
            }
        }
    }

    /**
     * ��Ʈ���� ������ ������
     * @param {any} handler handler.write(key, value) ...
     */
    requestRemoteData (handler) {
        handler.write("state", {pin: this.state.pin, rx: this.state.rx});
    }

    /**
     * ��Ʈ������ ���� �����Ϳ� ���� ó��
     * @param {any} handler  const value = handler.read(key) ...
     */
    handleRemoteData (handler) {
        const keys = Object.keys(handler.serverData);
        if (keys.length == 0) return;

        keys.forEach(key => this.execute(key, handler.read(key)));
    }

    execute (command, data) {
        const keys = data ? Object.keys(data) : [];
        switch (command) {
            case 'reset': {
                this.reset();
            } break;
            case 'setDigital': {
                keys.forEach(key => this.setDigital(data[key].pin, data[key].value));
            } break;
            case 'setMotor': {
                const motors = [];
                keys.forEach(key => motors.push(data[key]));
                this.setMotor(motors);
            } break;
            case 'setServo': {
                keys.forEach(key => this._setServo(data[key].pin, data[key].angle));
            } break;
            case 'setRgbLedColor': {
                keys.forEach(key => this._setRgbLedColor(data[key].pin, data[key].color));
            } break;
            case 'changeRgbLedBrightnessBy': {
                keys.forEach(key => this._changeRgbLedBrightnessBy(data[key].pin, data[key].brightness));
            } break;
            case 'setRgbLedBrightnessTo': {
                keys.forEach(key => this._setRgbLedBrightnessTo(data[key].pin, data[key].brightness));
            } break;
            case 'setPiezoBuzzer': {
                keys.forEach(key => this._setPiezoBuzzer(data[key].pin, data[key].note, data[key].duration));
            } break;
            case 'enableDigitalInput': {
                keys.forEach(key => this._enableDigitalInput(data[key].pin));
            } break;
            case 'enableAnalogInput': {
                keys.forEach(key => this._enableAnalogInput(data[key].pin));
            } break;
            case 'enableSonarSensor': {
                keys.forEach(key => this._enableSonarSensor(data[key].pin));
            } break;
            case 'enableTemperatureSensor': {
                keys.forEach(key => this._enableTemperatureSensor(data[key].pin));
            } break;
            case 'enableRotaryPositionSensor': {
                keys.forEach(key => this._enableRotaryPositionSensor(data[key].pin));
            } break;
            case 'resetRotaryPositionSensor': {
                keys.forEach(key => this._resetRotaryPositionSensor(data[key].pin, data[key].type, data[key].value));
            } break;
        }
    }

    get targetVersion () {
        throw new Error('������ �ʿ�');
    }

    _getConnectionCheckCommand () {
        return this._getRequestBatteryVoltageCommand();
    }

    /**
     * ��ġ �ʱ�ȭ ��ɾ� ��ȯ
     */
    _getResetDeviceCommand () {
        return [FirmataCMD.RESET, 0x00, 0x00];
    }

    /**
     * ������ �� Ȱ��ȭ
     */
    _getDigitalPinEnableCommand () {
        return [FirmataCMD.ENABLE_DIGITAL, 0x01, FirmataCMD.ENABLE_DIGITAL + 1, 0x01];
    }

    /**
     * ���͸� ���� ��û
     */
    _getRequestBatteryVoltageCommand () {
        return [SysexCMD.START, SysexCMD.GET, Instruction.GET_VOLTAGE, 0x00, SysexCMD.END];
    }

    /**
     * ��ü ���� ��û
     */
    _getRequestAllVersionCommand () {
        return [SysexCMD.START, SysexCMD.GET, Instruction.GET_VERSION, 0x00, SysexCMD.END];
    }

    /**
     * 
     * @param {number} pin [2, 19]
     * @param {PinMode} mode
     * @returns {boolean} ���� ���� �������� ���� �� ��尡 ������ ��� true, ������ ��� false
     */
    setPinMode (pin, mode) {
        if (pin < 2 || pin > 19 || this.isEqualsPinMode(pin, mode)) return false;
        //�� ��尡 ���� �� ��� �ݺ������� �ٽ� ������ ��� 
        ////��� �����̻��� �ǹǷ� �켱������ �ɸ�� �� ��� ���� ������ ����
        //if (pin < 2 || pin > 19 || this._isEqualsPinMode(pin, mode) || this.isSetPinMode(pin)) return false;
        this.state.getPinInfo(pin).mode = mode;
        this._sendBuffer.push([FirmataCMD.SET_PIN_MODE, pin, mode]);
        return true;
    }

    /**
     * �� ��尡 ���� �Ǿ��ִ��� ���� Ȯ��
     * @param {number} pin [2, 19]
     * @returns {boolean} �� ��尡 ���� ���� [������-true/ �����ȵ�-false]
     */
    isSetPinMode (pin) {
        return typeof pin === 'number' && typeof this.state.getPinInfo(pin).mode === 'number';
    }

    /**
     * �����Ǿ��ִ� �� ���� ���� ���� Ȯ��
     * @param {number} pin [2, 19]
     * @param {PinMode} mode
     * @returns {boolean} �� ��尡 mode�� ���� ��� true
     */
    isEqualsPinMode (pin, mode) {
        return mode !== undefined && mode === this.state.getPinInfo(pin).mode;
    }

    /**
     * 
     * @param {number} pin [2, 15]
     */
    _isDigitalPin (pin) {
        return typeof pin === 'number' && 2 <= pin && pin <= 15;
    }

    /**
     * 
     * @param {number} pin [14, 19]
     */
    _isAnalogPin (pin) {
        return typeof pin === 'number' && 14 <= pin && pin <= 19;
    }

    /**
     * 
     * @param {number} pin [14, 19]
     */
    _measureAnalogPin (pin) {
        const analogPin = pin - 14;
        return Math.min(5, Math.max(0, analogPin));
    }

    /**
    * [2, 15] �ɿ� ������ ���� ����ϴ� �Լ�
    * @param {number} pin [2, 15]
    * @param {number} value [0, 1]
    */
    setDigital (pin, value) {
        if (!this._isDigitalPin(pin)) return;

        this.setPinMode(pin, PinMode.OUTPUT);

        const clampValue = Math.min(1, Math.max(0, value));
        if (this.state.tx.digital[pin] == clampValue) {
            return;
        }

        this.state.tx.digital[pin] = Math.min(1, Math.max(0, clampValue));
        const data = this._digitalHighValueSum(pin);

        this._sendBuffer.push(data);
    }

    /**
     * [0, 7] �Ǵ� [8, 15] ���� ������ ���� �ջ��Ͽ� 16���� �����ͷ� �����ϴ� �Լ�
     * @param {number} pin [2, 15]
     */
    _digitalHighValueSum (pin) {
        const data = [0x00, 0x00, 0x00];

        data[0] = pin > 7 ? FirmataCMD.DIGITAL_CH1 : FirmataCMD.DIGITAL_CH0;
        const first = pin > 7 ? 8 : 0;
        const last = Math.min(7 + first, Math.max(this.state.tx.digital.length, first + 1));

        for (let i = first; i < last; i++) {
            if (this.state.tx.digital[i] && this.state.tx.digital[i] == 1) {
                data[1] += (0x01 << (i - first));
            }
        }

        if (this.state.tx.digital[7 + first] && this.state.tx.digital[7 + first] == 1) {
            data[2] = 0x01;
        }
        return data;
    }

    /**
     * ���� ���� �Լ�
     * @param {object} motors motor json datas
     */
    setMotor (motors) {
        const data = [];
        for (let i = 0; i < motors.length; i++) {
            const m = motors[i];
            if (!m) continue;

            const num = m.motor;
            const index = num - 1;
            const firstPin = 4 + (num - 1) * 2;
            let pin = 0;
            for (let j = 0; j < 2; j++) {
                pin = (num == 1 || num == 3) ? firstPin + j : firstPin + 1 - j;
                this.setPinMode(pin, PinMode.OUTPUT);
            }

            m.speed = (typeof m.speed === 'number') ? Math.min(15, Math.max(0, m.speed)) : 0;
            const obj = this.state.getTxMotor(index);
            if (Object.entries(obj).toString() === Object.entries(m).toString()) {
                continue;
            } else {
                obj.motor = m.motor;
                obj.speed = m.speed;
                obj.state = m.state;
            }

            let speed = (m.speed > 0) ? m.speed * 14 + 36 : 0;
            let msb = 0x00;
            let lsb = 0x00;

            if (m.state > 0) {
                lsb = speed & 0x7F;
                msb = (speed >> 7) & 0x01;
            }
            data.push(lsb);

            let state = index << 4;
            if (m.state > 0) {
                state += (m.state - 1) << 3;
            }
            state += msb;
            data.push(state);
        }

        if (data.length > 0) {
            data.unshift(SysexCMD.START, SysexCMD.SET, Instruction.SET_MOTOR, data.length);
            data.push(SysexCMD.END);
            this._sendBuffer.push(data);
        }
    }

    /**
     * �������� ���� �Լ�
     * @param {number} pin [2, 15]
     * @param {number} angle [-120, 120]
     */
    _setServo (pin, angle) {
        if (!this._isDigitalPin(pin)) return;
        this.setPinMode(pin, PinMode.SERVO);

        angle = (typeof angle === 'number') ? -Math.min(120, Math.max(-120, angle)) + 120 : 0;
        if (this.state.tx.servo[pin] === angle) return;
        else this.state.tx.servo[pin] = angle;

        let data = [(angle & 0xFF), ((angle >> 8) & 0xFF)];
        const msb = (data[0] >> 7) & 0x01;

        data[0] = data[0] & 0x7F;
        data[1] = ((data[1] << 1) + msb) & 0x7F;

        this._sendBuffer.push([
            (0xE0 + pin),
            data[0],
            data[1]
        ]);
    }

    /**
     * RGB LED ����, ��� ���� �Լ�
     * @param {number} pin [2, 15]
     * @param {{r: number[0, 255], g: number[0, 255], b: number[0, 255], a: number[0, 255]}} color
     */
    _setRgbled (pin, color) {
        /**
         * RGBLED�� ���ε� ��忡���� �ǽð� ���� ����� ����Ҽ� �����Ƿ�
         * ������Ʈ �������� Ȯ������ �ʴ´�.
         */
        if (!this._isDigitalPin(pin)) return;

        let pinData = pin << 1 & 0x7F;
        if (this.setPinMode(pin, PinMode.RGBLED)) {
            // led �� ó�� �����Ͽ� ����ϴ� pixel led ���� �������ݷ� ����� ���Ϸ� ����ϹǷ� 1�� ����.
            let count = 1;
            this._sendBuffer.push([SysexCMD.START, SysexCMD.SET, Instruction.SET_RGBLED, 0x02, pinData, count, SysexCMD.END]);
        }

        if (!color) {
            color = {r: 0, g: 0, b: 0, a: 255};
        } else {
            color.r = (typeof color.r === 'number') ? Math.min(255, Math.max(0, color.r)) : 0;
            color.g = (typeof color.g === 'number') ? Math.min(255, Math.max(0, color.g)) : 0;
            color.b = (typeof color.b === 'number') ? Math.min(255, Math.max(0, color.b)) : 0;
            color.a = (typeof color.a === 'number') ? Math.min(255, Math.max(0, color.a)) : 255;
        }

        const obj = this.state.getTxRgbLed(pin);
        if (Object.entries(obj).toString() === Object.entries(color).toString()) return;
        else {
            obj.r = color.r;
            obj.g = color.g;
            obj.b = color.b;
            obj.a = color.a;
        }

        const maxRate = 0.395;
        const alphaRatio = 0.39215; // 255 ���� ����ϴ� a ���� 0~100���� ����ϱ� ���� ����
        const colorRate = Math.min(maxRate, Math.max(0, maxRate * (color.a * alphaRatio * 0.01)));

        const intColor = [];
        intColor[0] = Math.round(color.r * colorRate);
        intColor[1] = Math.round(color.g * colorRate);
        intColor[2] = Math.round(color.b * colorRate);

        let data = [(pinData + 0x01) & 0x7F, 0x01];
        let msb = 0x00;
        for (let i = 0; i < 3; i++) {
            msb += (((intColor[i] >> 7) & 0x01) << i);
            data.push(intColor[i] & 0x7F);
        }

        data.push(msb);
        data.unshift(SysexCMD.START, SysexCMD.SET, Instruction.SET_RGBLED, data.length);
        data.push(SysexCMD.END);
        this._sendBuffer.push(data);
    }

    /**
     * RGB LED ���� ���� �Լ�
     * @param {number} pin [2, 15]
     * @param {{r: number[0, 255], g: number[0, 255], b: number[0, 255]}} color
     */
    _setRgbLedColor (pin, color) {
        color.a = this.state.getTxRgbLed(pin).a;
        this._setRgbled(pin, color);
    }

    /**
     * RGB LED ��� ���� �Լ�
     * @param {number} pin [2, 15]
     * @param {any} gap 
     */
    _changeRgbLedBrightnessBy (pin, gap) {
        const alphaRatio = 0.39215; // 255 ���� ����ϴ� a ���� 0~100���� ����ϱ� ���� ����
        let brightness = (typeof this.state.getTxRgbLed(pin).a === 'number') ? this.state.getTxRgbLed(pin).a : 255;
        brightness = (brightness * alphaRatio) + gap;
        this._setRgbLedBrightnessTo(pin, brightness);
    }

    /**
     * RGB LED ��� ���� �Լ�
     * @param {number} pin [2, 15]
     * @param {number} brightness [0, 100]
     */
    _setRgbLedBrightnessTo (pin, brightness) {
        const color = JSON.parse(JSON.stringify(this.state.getTxRgbLed(pin)));
        color.a = Math.round(brightness * 2.55); // 255 �������� ��ȯ
        this._setRgbled(pin, color);
    }

    /**
     * �ǿ��� ���� �Ҹ� ���� �Լ�
     * @param {number} pin [2, 15]
     * @param {number} note
     * @param {number} duration
     */
    _setPiezoBuzzer (pin, note, duration) {
        if (!this._isDigitalPin(pin)) return;

        this.setPinMode(pin, PinMode.TONE);

        if (typeof note === 'number') {
            const max = Object.keys(Frequency).length;
            note = Math.min(max, Math.max(0, note));
        } else {
            note = 0;
        }
        duration = (typeof duration === 'number') ? duration = Math.max(0, duration) : 0;

        const obj = this.state.getTxPiezo(pin);
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
            SysexCMD.START,
            SysexCMD.TONE_DATA,
            0x00,
            pin & 0x7F,
            frequencies[0],
            frequencies[1],
            durations[0],
            durations[1],
            SysexCMD.END
        ]);

        // 0�� ����� �ݺ��� �ǹ̰� �����Ƿ� ����
        if (duration === 0) return;
        // ���� ���Ƶ� �ݺ������� �����ϱ� ���Ͽ� ��� �� �ʱ�ȭ
        const reset = setTimeout(() => {
            const obj = this.state.getTxPiezo(pin);
            if (Object.entries(obj).toString() === Object.entries({note, duration}).toString()) {
                obj.note = null;
                obj.duration = null;
                clearTimeout(reset);
            }
        }, msec * 0.8);
    }

    /**
     * ������ �Է� Ȱ��ȭ
     * @param {number} pin [2, 15]
     */
    _enableDigitalInput (pin) {
        if (this._isDigitalPin(pin)) this.setPinMode(pin, PinMode.INPUT);
    }

    /**
     * �Ƴ��α� �Է� Ȱ��ȭ
     * @param {number} pin [14, 19]
     */
    _enableAnalogInput (pin) {
        if (this._isAnalogPin(pin)) this.setPinMode(pin, PinMode.ANALOG);
    }

    /**
     * ���� Ȱ��ȭ
     * @override
     * @param {number} pin [2, 19]
     * @param {string} sensor
     */
    _enableSensorValue (pin, sensor) {
        switch (sensor) {
            case 'temperature': {
                this._enableTemperatureSensor(pin);
            } break;
            case 'rotaryposition': {
                this._enableRotaryPositionSensor(pin);
            } break;
            case 'ultrasonic': {
                this._enableSonarSensor(pin);
            } break;
            default: {
                this._enableAnalogInput(pin);
            } break;
        }
    }

    _enableSonarSensor (pin) {
        if (this._isDigitalPin(pin) && this.setPinMode(pin, PinMode.SONAR)) {
            this._sendBuffer.push([SysexCMD.START, SysexCMD.SONAR_CONFIG, pin, pin, 0xFF, 0x10, 0x03, SysexCMD.END]);
        }
    }


    /**
     *  ȸ�� ��ġ ���� Ȱ��ȭ �Լ�
     * @param {number} pin [14, 19]
     */
    _enableRotaryPositionSensor (pin) {
        if (!this._isAnalogPin(pin)) return;

        this.setPinMode(pin, PinMode.ANALOG);

        const analogPin = this._measureAnalogPin(pin);
        const obj = this.state.getRxRotaryPosition(analogPin);
        if (!obj.enable) {
            const gap = 64;
            const gaps = [(gap & 0xFF), ((gap >> 8) & 0xFF)];
            const gapMsb = (gaps[0] >> 7) & 0x01;
            gaps[0] = gaps[0] & 0x7F;
            gaps[1] = ((gaps[1] << 1) + gapMsb) & 0x7F;

            this._sendBuffer.push([SysexCMD.START, SysexCMD.SET, Instruction.SET_ADVANCED, 0x04, 0x05, analogPin, gaps[0], gaps[1], SysexCMD.END]);
            obj.enable = true;
        }
    }

    /**
     * ȸ�� ��ġ ���� ���� �ʱ�ȭ�ϴ� �Լ�
     * @param {string} pin [14, 19]
     * @param {string} type roration, position, angle
     * @param {number} value
     */
    _resetRotaryPositionSensor (pin, type, value) {
        if (!this._isAnalogPin(pin)) return;
        if (!value || typeof value !== 'number') {
            value = 0;
        }
        const isInteger = !value.toString().includes('.');
        const analogPin = this._measureAnalogPin(pin);
        let obj = this.state.getRxRotaryPosition(analogPin);
        if (!obj.enable) {
            this._enableRotaryPositionSensor(analogPin);
            obj.enable = true;
        }

        switch (type) {
            case 'rotation': {
                obj.points = [];
                if (obj.firstValue !== undefined) {
                    obj.points.push(this.state.rx.analog[analogPin]);
                }
                obj.rotation = value;
                obj.isIntegerRotation = isInteger;
            } break;
            case 'position': {
                obj.points = [];
                if (obj.firstValue !== undefined) {
                    obj.points.push(this.state.rx.analog[analogPin]);
                }
                obj.position = value;
                obj.isIntegerPosition = isInteger;
            } break;
            case 'angle': {
                if (obj.firstValue === undefined) {
                    obj.calibration = value;
                } else {
                    let angle = this._measureRotaryPositionSensorAngle(analogPin);
                    if (angle < 0) angle += 360;
                    obj.calibration = (value % 360) - angle;
                }
                obj.isIntegerAngle = isInteger;
            } break;
        }
    }

    /**
     * ��ġ�κ��� ���޹��� �Ƴ��α� ���� ȸ��, ��ġ ������ ����ϴ� �Լ�
     * @param {number} analogPin [0, 5]
     */
    _measureRotaryPositionSensorPosition (analogPin) {
        const obj = this.state.getRxRotaryPosition(analogPin);
        if (!obj || !obj.points) return 0;

        const points = obj.points;
        const length = points.length;
        let p1, p2, gap, dir, sum = 0;

        if (length > 1) {
            for (let i = 1; i < length; i++) {
                p1 = points[i - 1];
                p2 = points[i];
                gap = p2 - p1;
                dir = gap >= 0 ? 1 : -1;

                if (Math.abs(gap) > 512) {
                    if (dir == 1) {
                        gap -= 1024;
                    } else if (dir == -1) {
                        gap += 1024;
                    }
                } else {
                    gap = p2 - p1;
                }
                sum += gap;
            }
            points.splice(0, length - 1);

            sum = sum * RATIO_CONVERT_ANALOG_TO_ANGLE;
            obj.position += sum;
            obj.rotation += (sum / 360);
        }
    }

    /**
     * ��ġ�κ��� ���޹��� �Ƴ��α� ���� ���� ������ ����ϴ� �Լ�
     * @param {number} analogPin [0, 5]
     * @returns {number} [-180, 180]
     */
    _measureRotaryPositionSensorAngle (analogPin, useCalibration = false) {
        const analogValue = this.state.rx.analog[analogPin];
        let angle = 0;
        if (analogValue) {
            angle = (analogValue * RATIO_CONVERT_ANALOG_TO_ANGLE);
            if (angle > 180) {
                angle = angle - 360;
            }
        }

        const obj = this.state.getRxRotaryPosition(analogPin);
        if (obj) {
            if (useCalibration) {
                angle += obj.calibration % 360;
                if (angle < -180) {
                    angle = 360 + angle;
                } else if (angle > 180) {
                    angle = angle - 360;
                }
            }

            if (obj.isIntegerAngle) {
                angle = parseInt(Math.round(angle));
            }
        }

        if (useCalibration) obj.angle = angle;
        else obj.originAngle = angle;

        return angle;
    }

    /**
     * �µ� ���� ��� Ȱ��ȭ
     * @param {any} pin [14, 19]
     * @returns {number}
     */
    _enableTemperatureSensor (pin) {
        if (!this._isAnalogPin(pin)) return;

        this.setPinMode(pin, PinMode.ANALOG);

        let obj = this.state.getRxTemperature(this._measureAnalogPin(pin));
        if (!obj.enable) {
            obj.enable = true;
        }
    }

    /**
     * ��ġ�κ��� ���޹��� �Ƴ��α� ���� �µ� ������ ����ϴ� �Լ�
     * @param {number} analogPin [0, 5]
     */
    _measureTemperatureSensorValue (analogPin) {
        const obj = this.state.getRxTemperature(analogPin);
        const length = obj.values.length;

        if (length == 0) return 0;
        let max = 0, min = 0;

        for (let i = 0; i < length; i++) {
            const value = obj.values[i];
            if (min == 0) {
                min = value;
            }

            max = Math.max(max, value);
            min = Math.min(min, value);
        }

        obj.value = ((max + min) * 0.5 * 0.5).toFixed(1);
        if (length >= 5) {
            obj.values.splice(0, 1);
        }
    }

    _processReceiveData (data) {
        switch (data[0]) {
            //�����а�
            case FirmataCMD.DIGITAL_CH0:
            case FirmataCMD.DIGITAL_CH1: {
                if (data.length < 3) return;

                let startPin = 8 * (data[0] & 0x0F);
                let pin;

                for (let i = 0; i <= 7; i++) {
                    pin = i + startPin;
                    this.state.rx.digital[pin] = (i < 7) ? (data[1] >> i & 0x01) : data[2];
                }
                data.splice(0, 3);
            } break;
            //�Ƴ��αװ�
            case FirmataCMD.ANALOG_PIN0:
            case FirmataCMD.ANALOG_PIN1:
            case FirmataCMD.ANALOG_PIN2:
            case FirmataCMD.ANALOG_PIN3:
            case FirmataCMD.ANALOG_PIN4:
            case FirmataCMD.ANALOG_PIN5: {
                if (data.length < 3) return;

                let analogPin = data[0] & 0x0F;
                const value = data[1] + (data[2] << 7);

                this.state.rx.analog[analogPin] = value;
                data.splice(0, 3);

                const rotaryObj = this.state.getRxRotaryPosition(analogPin);
                if (rotaryObj && rotaryObj.enable) {
                    if (typeof rotaryObj.firstValue === 'number') {
                        rotaryObj.originAngle = this._measureRotaryPositionSensorAngle(analogPin);
                        rotaryObj.angle = this._measureRotaryPositionSensorAngle(analogPin, true);
                    } else {
                        rotaryObj.firstValue = value;
                        rotaryObj.points = [];

                        let angle = parseInt(this._measureRotaryPositionSensorAngle(analogPin));
                        if (angle < 0) angle += 360;
                        rotaryObj.calibration = (rotaryObj.calibration % 360) - angle;
                    }

                    const length = rotaryObj.points.length;
                    if (length == 0 || rotaryObj.points[length - 1] != value) {
                        rotaryObj.points.push(value);
                        this._measureRotaryPositionSensorPosition(analogPin);
                    }
                    return;
                }

                const temperatureObj = this.state.getRxTemperature(analogPin);
                if (temperatureObj && temperatureObj.enable) {
                    temperatureObj.values.push(value);
                    this._measureTemperatureSensorValue(analogPin);
                    return;
                }
            } break;
            case SysexCMD.START: {
                this._processSysexCMD(data);
            } break;
            default: {
                data.splice(0, 1);
            } return;
        }
    };

    _processSysexCMD (data) {
        if (data.length < 2) return;

        switch (data[1]) {
            case SysexCMD.GET: {
                this._processSysexCMD_Get(data);
            } break;
            case SysexCMD.SONAR: {
                if (data.length < 6) return;

                let pin = data[2] & 0x0F;
                this.state.rx.digital[pin] = data[3] + (data[4] << 7);

                data.splice(0, 6);
            } break;
            default: {
                data.splice(0, 1);
            } return;
        }
    }

    _processSysexCMD_Get (data) {
        if (data.length < 4) return;

        const length = data[3] + 5;
        if (data.length < length) return;
        if (data[length - 1] != 0xF7) {
            data.splice(0, length);
            return;
        }

        switch (data[2]) {
            // ���� üũ ��������
            case Instruction.GET_VOLTAGE: {
                this.voltage = data[4];
            } break;
            // �߿���, �ϵ���� ���� ��������
            case Instruction.GET_VERSION: {
                this._version = {
                    model: data[4],
                    hardware: data[5],
                    firmware: data[6]
                };
            } break;
        }
        data.splice(0, length);
    }

}

class ArduinoStateBase {
    /**
     * �۽�, ���� ���ҿ��� ����ϴ� ��ϵ��� ���ÿ� �����ϱ� ������ �����ʹ� �����Ͽ� ���
     */
    constructor () {
        /**
         * pin ��ü ��� [2, 19]
         * {
         *      mode: null, => protocol/roborobo/PinMode
         * }
         */
        this.pin = [];

        /**
         * ��ġ�� ���� ���¸� ����
         */
        this.tx = {
            /**
             * digital pin ��� [2, 13] ���������� ����ϱ� ���� [0, 1]�� ������� ����.
             * ���� ���´� 0 �Ǵ� 1
             */
            digital: [],
            /**
             * motor index ��� [0, 3]
             * motor num => [1, 4]
             * pin number => motor num 1:[4, 5] 2:[6, 7], 3:[8, 9], 4:[10, 11]
             * {
             *      motor: 1, => [1, 4] motor num
             *      speed: 0, => [0, 15]
             *      state: 0  => [0: ����, 1: ��ȸ��, 2: ��ȸ��]
             * }
             */
            motor: [],
            /**
             * ���� ���´� ���� ��(����), ������ [-120, 120]
             */
            servo: [],
            /**
             * {
             *      r: null,
             *      g: null,
             *      b: null,
             *      a: null
             * }
             */
            rgbLed: [],
            /**
             * {
             *      note: 0, => �ǹ� ��ȣ
             *      duration: 0 => ���� �ð�
             * }
             */
            piezo: [],
        };

        /**
         * ������ ���� �����Ͽ� ����
         */
        this.rx = {
            /**
             * digital pin ��� [2, 13] ���������� ����ϱ� ���� [0, 1]�� ������� ����.
             * ���� ���´� 0 �Ǵ� 1
             */
            digital: [],

            /**
             * analog pin ��� [0, 5] pin number => (0:14, 5:19)
             * ���� ���´� ����, ������ [0, 1024]
             */
            analog: [],
            /**
             * {
             *      value: 0,
             *      values: [],
             *      enable: false
             * }
             */
            temperature: [],
            /**
             * {
             *      firstValue: undefined,
             *      calibration: 0,
             *      enable: false,
             *      points: [],
             *      position: 0,
             *      rotation: 0,
             *      isIntegerPosition: true,
             *      isIntegerRotation: true,
             *      isIntegerAngle: true,
             * }
             */
            rotaryPosition: [],

        };
    }

    /**
     * 
     * @param {number} pin [2, 19]
     */
    getPinInfo (pin) {
        if (!this.pin[pin]) {
            this.pin[pin] = {
                mode: null
            };
        }
        return this.pin[pin];
    }

    /**
     * 
     * @param {number} index [0, 3]
     */
    getTxMotor (index) {
        if (!this.tx.motor[index]) {
            this.tx.motor[index] = {
                motor: null,
                speed: null,
                state: null
            };
        }
        return this.tx.motor[index];
    }

    /**
     * 
     * @param {number} pin [2, 15]
     */
    getTxPiezo (pin) {
        if (!this.tx.piezo[pin]) {
            this.tx.piezo[pin] = {
                note: null,
                duration: null
            };
        }
        return this.tx.piezo[pin];
    }

    /**
     * 
     * @param {number} pin [2, 15]
     */
    getTxRgbLed (pin) {
        if (!this.tx.rgbLed[pin]) {
            this.tx.rgbLed[pin] = {
                r: null,
                g: null,
                b: null,
                a: null
            };
        }
        return this.tx.rgbLed[pin];
    }

    /**
     * 
     * @param {number} analogPin [0, 5]
     */
    getRxTemperature (analogPin) {
        if (!this.rx.temperature[analogPin]) {
            this.rx.temperature[analogPin] = {
                value: 0,
                values: [],
                enable: false
            };
        }
        return this.rx.temperature[analogPin];
    }

    /**
     * 
     * @param {number} analogPin [0, 5]
     */
    getRxRotaryPosition (analogPin) {
        if (!this.rx.rotaryPosition[analogPin]) {
            this.rx.rotaryPosition[analogPin] = {
                firstValue: null,
                calibration: 0,
                enable: false,
                points: [],
                originAngle: 0,
                angle: 0,
                position: 0,
                rotation: 0,
                isIntegerPosition: true,
                isIntegerRotation: true,
                isIntegerAngle: true,
            };
        }
        return this.rx.rotaryPosition[analogPin];
    }
}

const Sleep = function (ms) {
    return new Promise(resolve => setTimeout(() => resolve(), ms));
};

module.exports = {
    ArduinoBase,
    ArduinoStateBase,

    FirmataCMD,
    PinMode,
    SysexCMD,
    Instruction,
    Frequency,
    DrawMode,

    THREAD_STEP_INTERVAL,
    THREAD_STEP_INTERVAL_COMPATIBILITY,

    Sleep
};
