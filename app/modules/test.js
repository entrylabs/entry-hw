const BaseModule = require('./baseModule');

class Test extends BaseModule {
    constructor() {
        super();
        this.counter = 0;
        this.commandResponseSize = 8;
        this.wholeResponseSize = 0x32;
        this.isSendInitData = false;
        this.isSensorCheck = false;
        this.isConnect = false;
        this.sp = null;
        this.sensors = [];
        this.CHECK_PORT_MAP = {};
        this.SENSOR_COUNTER_LIST = {};
        this.returnData = {};
        this.PORT_MAP = {
            A: {
                type: this.motorMovementTypes.Power,
                power: 0,
            },
            B: {
                type: this.motorMovementTypes.Power,
                power: 0,
            },
            C: {
                type: this.motorMovementTypes.Power,
                power: 0,
            },
            D: {
                type: this.motorMovementTypes.Power,
                power: 0,
            },
        };
        this.SENSOR_MAP = {
            '1': {
                type: this.deviceTypes.Touch,
                mode: 0,
            },
            '2': {
                type: this.deviceTypes.Touch,
                mode: 0,
            },
            '3': {
                type: this.deviceTypes.Touch,
                mode: 0,
            },
            '4': {
                type: this.deviceTypes.Touch,
                mode: 0,
            },
        };
        this.isSensing = false;
        this.LAST_PORT_MAP = null;
    }

    get motorMovementTypes() {
        return {
            Degrees: 0,
            Power: 1,
        };
    }
    get deviceTypes() {
        return {
            NxtTouch: 1,
            NxtLight: 2,
            NxtSound: 3,
            NxtColor: 4,
            NxtUltrasonic: 5,
            NxtTemperature: 6,
            LMotor: 7,
            MMotor: 8,
            Touch: 0x0e,
            Color: 0x1d,
            Ultrasonic: 0x1e,
            Gyroscope: 0x20,
            Infrared: 0x21,
            Initializing: 0x7d,
            Empty: 0x7e, // 126
            WrongPort: 0x7f,
            Unknown: 0xff,
        };
    }
    get outputPort() {
        return {
            A: 1,
            B: 2,
            C: 4,
            D: 8,
            ALL: 0x0f,
        };
    }

    get CURRENT_STATUS_COLOR() {
        return {
            COLOR: this.STATUS_COLOR_MAP.GREEN,
            APPLIED: true,
        };
    }

    get BUTTON_MAP() {
        return {
            UP: {
                key: 1,
            },
            DOWN: {
                key: 3,
            },
            LEFT: {
                key: 5,
            },
            RIGHT: {
                key: 4,
            },
            BACK: {
                key: 6,
            },
            ENTER: {
                key: 2,
            },
        };
    }

    get STATUS_COLOR_MAP() {
        return {
            OFF: {
                key: 0,
            },
            GREEN: {
                key: 1,
            },
            RED: {
                key: 2,
            },
            ORANGE: {
                key: 3,
            },
            GREEN_FLASH: {
                key: 4,
            },
            RED_FLASH: {
                key: 5,
            },
            ORANGE_FLASH: {
                key: 6,
            },
            GREEN_PULSE: {
                key: 7,
            },
            RED_PULSE: {
                key: 8,
            },
            ORANGE_PULSE: {
                key: 9,
            },
        };
    }

    checkInitialData(data) {
        return true;
    }

    requestInitialData(sp) {
        const initBuf = this.makeInitBuffer([0x80], [0, 0]);
        const motorStop = new Buffer([0xa3, 0x81, 0, 0x81, 0x0f, 0x81, 0]);
        const initMotor = Buffer.concat([initBuf, motorStop]);
        this.checkByteSize(initMotor);
        console.log(initMotor);
        return initMotor.toJSON().data;
        // sp.write(initMotor, () => {
        //     this.sensorChecking();
        // });
    }

    sensorCheck() {
        if (!this.isSensing) {
            // this.isSensing = true;
            const initBuf = this.makeInitBuffer(
                [0],
                [this.wholeResponseSize, 0]
            );
            const counter = initBuf.readInt16LE(2); // initBuf의 index(2) 부터 2byte 는 counter 에 해당
            this.SENSOR_COUNTER_LIST[counter] = true;
            let sensorBody = [];
            let index = 0;
            Object.keys(this.SENSOR_MAP).forEach((p) => {
                let mode = 0;
                if (this.returnData[p] && this.returnData[p].type) {
                    mode = this.SENSOR_MAP[p].mode || 0;
                }
                const port = Number(p) - 1;
                index = port * this.commandResponseSize;
                const modeSet = new Buffer([
                    0x99,
                    0x05,
                    0,
                    port,
                    0xe1,
                    index,
                    0xe1,
                    index + 1,
                ]);
                const readySi = new Buffer([
                    0x99,
                    0x1d,
                    0,
                    port,
                    0,
                    mode,
                    1,
                    0xe1,
                    index + 2,
                ]);

                if (!sensorBody.length) {
                    sensorBody = Buffer.concat([modeSet, readySi]);
                } else {
                    sensorBody = Buffer.concat([sensorBody, modeSet, readySi]);
                }
            });
            /*
			리팩토링 없는 isButtonPressed 시작
			sensorBody
			* */
            let offsetAfterPortResponse = 4 * this.commandResponseSize; // 포트는 [0~3] 까지다.
            Object.keys(this.BUTTON_MAP).forEach((button) => {
                const buttonPressedCommand = new Buffer([
                    0x83, // opUI_BUTTON
                    0x09, // pressed
                    this.BUTTON_MAP[button].key,
                    0xe1,
                    offsetAfterPortResponse++,
                ]);

                sensorBody = Buffer.concat([sensorBody, buttonPressedCommand]);
            });

            /*
            리팩토링 없는 isButtonPressed 종료
             */
            const totalLength = initBuf.length + sensorBody.length;
            const sendBuffer = Buffer.concat(
                [initBuf, sensorBody],
                totalLength
            );
            this.checkByteSize(sendBuffer);
            return sendBuffer.toJSON().data;
        }
    }

    getCounter() {
        const counterBuf = new Buffer(2);
        counterBuf.writeInt16LE(this.counter);
        if (this.counter >= 32767) {
            this.counter = 0;
        }
        this.counter++;
        return counterBuf;
    }

    checkByteSize(buffer) {
        const bufferLength = buffer.length - 2;
        buffer[0] = bufferLength;
        buffer[1] = bufferLength >> 8; // buffer length 가 2^8 을 넘는 값일경우, 남은 값을 다음 size byte 에 씌운다.
    }

    makeInitBuffer(replyModeByte, allocHeaderByte) {
        const size = new Buffer([0xff, 0xff]); // dummy 에 가깝다. #checkByteSize 에서 갱신된다.
        const counter = this.getCounter();
        const reply = new Buffer(replyModeByte);
        const header = new Buffer(allocHeaderByte);
        return Buffer.concat([size, counter, reply, header]);
    }
}

module.exports = new Test();
