const {
    ArduinoBase,
    ArduinoStateBase,
    // protocol
    PinMode,
    FirmataCMD
} = require('./roborobo_base');

class Roduino extends ArduinoBase {
    constructor () {
        super();
    }

    /**
     * @override
     */
    newTypedState () {
        return new ArduinoStateBase();
    }

    init (handler, config) {
        super.init(handler, config);
    }

    reset () {
        super.reset();

        this._sendBuffer.push(this._getResetDeviceCommand());
        this._sendBuffer.push(this._getDigitalPinEnableCommand());
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
        super.requestRemoteData(handler);

        for (let i = 2; i <= 8; i++) {
            let value = this.state.rx.digital[i];
            value = this.isEqualsPinMode(i, PinMode.INPUT) && typeof value === 'number' ? value : 0;
            handler.write('digital_' + i, value);
        }

        for (let i = 0; i <= 5; i++) {
            let value = this.state.rx.analog[i];
            value = this.isEqualsPinMode(i + 14, PinMode.ANALOG) && typeof value === 'number' ? value : 0;
            handler.write('analog_' + i, value);
        }
    }

    handleRemoteData (handler) {
        super.handleRemoteData(handler);
    }

    execute (command, data) {
        super.execute(command, data);
    }

    /**
     * @override
     */
    get targetVersion () {
        return {model: 1, hardware: 1, firmware: 2};
    }

    /**
     * @override
     */
    _getConnectionCheckCommand () {
        return this._getRequestAllVersionCommand();
    }

    /**
     * @override
     */
    setMotor (motors) {
        for (let i = 0; i < motors.length; i++) {
            const m = motors[i];
            if (!m) continue;

            const num = m.motor;
            const index = num - 1;

            const firstPin = 9 + (num - 1) * 2;
            let pin = 0;
            for (let j = 0; j < 2; j++) {
                pin = firstPin + j;
                this.setPinMode(pin, PinMode.OUTPUT);
            }

            const obj = this.state.getTxMotor(index);

            if (Object.entries(obj).toString() === Object.entries(m).toString()) {
                continue;
            } else {
                obj.motor = m.motor;
                obj.state = m.state;
            }

            if (num % 2 == 1) {
                this.setDigital(firstPin, m.state == 2 ? 1 : 0);
                this.setDigital(firstPin + 1, m.state == 1 ? 1 : 0);
            } else {
                this.setDigital(firstPin, m.state == 1 ? 1 : 0);
                this.setDigital(firstPin + 1, m.state == 2 ? 1 : 0);
            }
        }
    }
}

module.exports = new Roduino();
