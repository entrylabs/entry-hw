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
        this.CURRENT_STATUS_COLOR = {
            COLOR: this.STATUS_COLOR_MAP.GREEN,
            APPLIED: true,
        };

        this.motorMovementTypes = {
            Degrees: 0,
            Power: 1,
        };

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
    }


    checkInitialData(data) {
        return true;
    }

    registerIntervalSend(register) {
        register.push(this._sensorCheck(), 3000);
    }

    requestInitialData(sp) {
        const initBuf = this._makeInitBuffer([0x00], [0, 0]);
        const motorStop = Buffer.from([0xa3, 0x81, 0, 0x81, 0x0f, 0x81, 0]);
        const initMotor = Buffer.concat([initBuf, motorStop]);

        this._injectByteSize(initMotor);
        return initMotor.toJSON().data;
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
            sendBody = this.makePortCommandBuffer(isSendData);
        }

        //상판 LED 컬러 변경 요청이 있는 경우 변경 커맨드를 페이로드에 추가
        if (this.CURRENT_STATUS_COLOR.APPLIED === false) {
            isSendData = true;
            const statusLedCommand = this.makeStatusColorCommandBuffer(
                sendBody,
            );

            if (!sendBody) {
                sendBody = statusLedCommand;
            } else {
                sendBody = Buffer.concat([sendBody, statusLedCommand]);
            }
        }

        if (isSendData && sendBody) {
            const initBuf = this.makeInitBuffer([0x80], [0, 0]);
            const totalLength = initBuf.length + sendBody.length;
            const sendBuffer = Buffer.concat([initBuf, sendBody], totalLength);
            this.checkByteSize(sendBuffer);
            return sendBuffer;
        }

        return undefined;
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

    _sensorCheck() {
        if (!this.isSensing) {
            this.isSensing = true;
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
            /*
			리팩토링 없는 isButtonPressed 시작
			sensorBody
			* */
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

            /*
            리팩토링 없는 isButtonPressed 종료
             */
            const totalLength = initBuf.length + sensorBody.length;
            const sendBuffer = Buffer.concat(
                [initBuf, sensorBody],
                totalLength,
            );
            this._injectByteSize(sendBuffer);
            return sendBuffer.toJSON().data;
        }
    }

    _makeInitBuffer(replyModeByte, allocHeaderByte) {
        const size = Buffer.from([0xff, 0xff]); // dummy 에 가깝다. #_injectByteSize 에서 갱신된다.
        const counter = this._getCounter();
        const reply = Buffer.from(replyModeByte);
        const header = Buffer.from(allocHeaderByte);
        return Buffer.concat([size, counter, reply, header]);
    }

    _injectByteSize(buffer) {
        const bufferLength = buffer.length - 2;
        buffer[0] = bufferLength;
        buffer[1] = bufferLength >> 8; // buffer length 가 2^8 을 넘는 값일경우, 남은 값을 다음 size byte 에 씌운다.
    }
}

module.exports = new Test();
