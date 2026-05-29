const BaseModule = require('./baseModule');
const _ = global.$;

class EV3HID extends BaseModule {
    constructor() {
        super();
        this.counter = 0;
        this.commandResponseSize = 8;
        this.wholeResponseSize = 0x32;
        this.sp = null;
        this.sensors = [];
        this.CHECK_PORT_MAP = {};
        this.SENSOR_COUNTER_LIST = {};
        this.returnData = {};
        this.LAST_PORT_MAP = null;

        this.deviceTypes = {
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

        this.outputPort = {
            A: 1,
            B: 2,
            C: 4,
            D: 8,
            ALL: 0x0f,
        };

        this.BUTTON_MAP = {
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

        this.STATUS_COLOR_MAP = {
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
            }
            ,
        };

        this.motorMovementTypes = {
            Degrees: 0,
            Power: 1,
        };

        this.CURRENT_STATUS_COLOR = {
            COLOR: this.STATUS_COLOR_MAP.GREEN,
            APPLIED: true,
        };

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
    }


    checkInitialData(data) {
        return true;
    }

    registerIntervalSend(register) {
        register(() => this._sensorCheck(), 200);
    }

    getData(buffer) {
        const data = buffer.toJSON().data;
        data.unshift(0x00);
        return data;
    }

    requestInitialData(sp) {
        const initBuf = this._makeInitBuffer([0x00], [0, 0]);
        const motorStop = Buffer.from([0xa3, 0x81, 0, 0x81, 0x0f, 0x81, 0]);
        const initMotor = Buffer.concat([initBuf, motorStop]);

        this._injectByteSize(initMotor);
        return this.getData(initMotor);
    }

    requestLocalData() {
        let isSendData = false;
        let sendBody;
        let skipPortOutput = false;

        //이전 포트결과에서 변한부분이 있는지 확인
        if (this.LAST_PORT_MAP) {
            const arr = Object.keys(this.PORT_MAP).filter((port) => {
                const map1 = this.PORT_MAP[port];
                const map2 = this.LAST_PORT_MAP[port];
                return !(map1.type === map2.type && map1.power === map2.power);
            });
            skipPortOutput = arr.length === 0;
        }

        //변한부분이 있다면 포트에 보낼 데이터를 생성
        if (!skipPortOutput) {
            isSendData = true;
            this.LAST_PORT_MAP = _.cloneDeep(this.PORT_MAP);
            sendBody = this._makePortCommandBuffer(isSendData);
        }

        //상판 LED 컬러 변경 요청이 있는 경우 변경 커맨드를 페이로드에 추가
        if (this.CURRENT_STATUS_COLOR.APPLIED === false) {
            isSendData = true;
            const statusLedCommand = this._makeStatusColorCommandBuffer(
                sendBody,
            );

            if (!sendBody) {
                sendBody = statusLedCommand;
            } else {
                sendBody = Buffer.concat([sendBody, statusLedCommand]);
            }
        }

        if (isSendData && sendBody) {
            const initBuf = this._makeInitBuffer([0x80], [0, 0]);
            const totalLength = initBuf.length + sendBody.length;
            const sendBuffer = Buffer.concat([initBuf, sendBody], totalLength);
            this._injectByteSize(sendBuffer);
            console.log('send', sendBuffer);
            return this.getData(sendBuffer);
        }
    }

    requestRemoteData(handler) {
        Object.keys(this.returnData).forEach((key) => {
            if (this.returnData[key] !== undefined) {
                handler.write(key, this.returnData[key]);
            }
        });
    }

    handleRemoteData(handler) {
        Object.keys(this.PORT_MAP).forEach((port) => {
            this.PORT_MAP[port] = handler.read(port);
        });
        Object.keys(this.SENSOR_MAP).forEach((port) => {
            this.SENSOR_MAP[port] = handler.read(port);
        });

        const receivedStatusColor = this.STATUS_COLOR_MAP[
            handler.read('STATUS_COLOR')
            ];
        if (
            receivedStatusColor !== undefined &&
            this.CURRENT_STATUS_COLOR.COLOR !== receivedStatusColor
        ) {
            this.CURRENT_STATUS_COLOR = {
                COLOR: receivedStatusColor,
                APPLIED: false,
            };
        }
    }

    handleLocalData(data) {
        // data: Native Buffer
        if (data[0] === this.wholeResponseSize + 3 && data[1] === 0) {
            const countKey = data.readInt16LE(2);
            if (countKey in this.SENSOR_COUNTER_LIST) {
                delete this.SENSOR_COUNTER_LIST[countKey];
                data = data.slice(5); // 앞의 4 byte 는 size, counter 에 해당한다. 이 값은 할당 후 삭제한다.
                let index = 0;

                Object.keys(this.SENSOR_MAP).forEach((p) => {
                    const port = Number(p) - 1;
                    index = port * this.commandResponseSize;

                    const type = data[index];
                    const mode = data[index + 1];
                    const siValue = Number(
                        (data.readFloatLE(index + 2) || 0).toFixed(1),
                    );
                    this.returnData[p] = {
                        type,
                        mode,
                        siValue,
                    };
                });

                index = 4 * this.commandResponseSize;
                Object.keys(this.BUTTON_MAP).forEach((button) => {
                    if (data[index] === 1) {
                        console.log(`${button} button is pressed`);
                    }

                    this.returnData[button] = {
                        pressed: data[index++] === 1,
                    };
                });
            }
        }
    }

    _sensorCheck() {
        const initBuf = this._makeInitBuffer(
            [0],
            [this.wholeResponseSize, 0],
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
            const modeSet = Buffer.from([
                0x99,
                0x05,
                0,
                port,
                0xe1,
                index,
                0xe1,
                index + 1,
            ]);
            const readySi = Buffer.from([
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

        let offsetAfterPortResponse = 4 * this.commandResponseSize; // 포트는 [0~3] 까지다.
        Object.keys(this.BUTTON_MAP).forEach((button) => {
            const buttonPressedCommand = Buffer.from([
                0x83, // opUI_BUTTON
                0x09, // pressed
                this.BUTTON_MAP[button].key,
                0xe1,
                offsetAfterPortResponse++,
            ]);

            sensorBody = Buffer.concat([sensorBody, buttonPressedCommand]);
        });

        const totalLength = initBuf.length + sensorBody.length;
        const sendBuffer = Buffer.concat(
            [initBuf, sensorBody],
            totalLength,
        );
        this._injectByteSize(sendBuffer);
        console.log('sensorCheck', sendBuffer);
        return this.getData(sendBuffer);
    }

    _makeInitBuffer(replyModeByte, allocHeaderByte) {
        const size = Buffer.from([0xff, 0xff]); // dummy 에 가깝다. #_injectByteSize 에서 갱신된다.
        const counter = this._getCounter();
        const reply = Buffer.from(replyModeByte);
        const header = Buffer.from(allocHeaderByte);
        return Buffer.concat([size, counter, reply, header]);
    }

    _makePortCommandBuffer() {
        let sendBody = null;
        Object.keys(this.PORT_MAP).forEach((port) => {
            let backBuffer;
            let frontBuffer;
            const portMap = this.PORT_MAP[port];
            let brake = 0;
            const checkPortMap = this.CHECK_PORT_MAP[port];
            if (!checkPortMap || portMap.id !== checkPortMap.id) {
                let portOut;
                let power = Number(portMap.power);
                if (portMap.type === this.motorMovementTypes.Power) {
                    const time = Number(portMap.time) || 0;
                    brake = 0;
                    if (power > 100) {
                        power = 100;
                    } else if (power < -100) {
                        power = -100;
                    } else if (power === 0) {
                        brake = 1;
                    }

                    if (time <= 0) {
                        // infinity output port mode
                        portOut = Buffer.from([
                            0xa4,
                            0x81,
                            0,
                            0x81,
                            this.outputPort[port],
                            0x81,
                            power,
                            0xa6,
                            0x81,
                            0,
                            0x81,
                            this.outputPort[port],
                        ]);
                    } else {
                        // time set mode 232, 3 === 1000ms
                        frontBuffer = Buffer.from([
                            0xad,
                            0x81,
                            0,
                            0x81,
                            this.outputPort[port],
                            0x81,
                            power,
                            0x83,
                            0,
                            0,
                            0,
                            0,
                            0x83,
                        ]);
                        backBuffer = Buffer.from([
                            0x83,
                            0,
                            0,
                            0,
                            0,
                            0x81,
                            brake,
                        ]);
                        const timeBuffer = new Buffer(4);
                        timeBuffer.writeInt32LE(time);
                        portOut = Buffer.concat([
                            frontBuffer,
                            timeBuffer,
                            backBuffer,
                        ]);
                    }
                } else {
                    const degree = Number(portMap.degree) || 0;
                    frontBuffer = Buffer.from([
                        0xac,
                        0x81,
                        0,
                        0x81,
                        this.outputPort[port],
                        0x81,
                        power,
                        0x83,
                        0,
                        0,
                        0,
                        0,
                        0x83,
                    ]);
                    backBuffer = Buffer.from([0x83, 0, 0, 0, 0, 0x81, brake]);
                    const degreeBuffer = new Buffer(4);
                    degreeBuffer.writeInt32LE(degree);
                    portOut = Buffer.concat([
                        frontBuffer,
                        degreeBuffer,
                        backBuffer,
                    ]);
                }

                if (portOut) {
                    if (!sendBody) {
                        sendBody = Buffer.from(portOut);
                    } else {
                        sendBody = Buffer.concat([sendBody, portOut]);
                    }
                }

                this.CHECK_PORT_MAP[port] = this.PORT_MAP[port];
            }
        });
        return sendBody;
    }

    _makeStatusColorCommandBuffer() {
        this.CURRENT_STATUS_COLOR.APPLIED = true;
        return Buffer.from([
            0x82,
            0x1b,
            this.CURRENT_STATUS_COLOR.COLOR.key,
        ]);
    }

    /**
     * 카운터를 가져온다. 카운터 값은 request & response 가 동일하여, 정상값 체크를 위해 사용된다.
     * 이 값은 2^15 이상인 경우 0으로 초기화한다.
     * @returns {Buffer} little endian 2byte
     */
    _getCounter() {
        const counterBuf = new Buffer(2);
        counterBuf.writeInt16LE(this.counter, 0);
        if (this.counter >= 32767) {
            this.counter = 0;
        }
        this.counter++;
        return counterBuf;
    }

    _injectByteSize(buffer) {
        const bufferLength = buffer.length - 2;
        buffer[0] = bufferLength;
        buffer[1] = bufferLength >> 8; // buffer length 가 2^8 을 넘는 값일경우, 남은 값을 다음 size byte 에 씌운다.
    }
}

module.exports = new EV3HID();
