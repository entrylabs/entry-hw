const _ = require('lodash');
const BaseModule = require('./baseModule');

const MICROBIT_BUFFER_SIZE = 16;
const functionKeys = {
    TEST_MESSAGE: 0xfa,
    RESET: 0xfe,
    CHECK_READY: 0xff,
    SET_LED: 0x01,
    SET_STRING: 0x02,
    SET_IMAGE: 0x03,
    SET_DIGITAL: 0x07,
    SET_ANALOG: 0x08,
    RESET_SCREEN: 0x09,
    SET_ANALOG_PERIOD: 0x10,
    SET_SERVO: 0x11,
    SET_SERVE_PERIOD: 0x12,
    GET_LED: 0x31,
    GET_ANALOG: 0x32,
    GET_DIGITAL: 0x33,
    GET_BUTTON: 0x34,
    GET_LIGHT_LEVEL: 0x35,
    GET_TEMPERATURE: 0x36,
    GET_COMPASS_HEADING: 0x37,
    GET_ACCELEROMETER: 0x38,

    PLAY_NOTE: 0x04,
    CHANGE_BPM: 0x05,
    SET_BPM: 0x06,
};

class Microbit2 extends BaseModule {
    constructor() {
        super();
        this.sendBuffers = [];
        this.recentCheckData = [];
        this.startChecksum = [0xff, 0x01];
        this.endChecksum = [0x0d, 0x0a];

        this.resetMicrobitStatusMap();
        this.commandQueue = [];
    }

    resetMicrobitStatusMap() {
        this.microbitStatusMap = {
            payload: undefined,
            sensorData: {
                digital: {},
                analog: {},
                led: {},
                button: false,
                lightLevel: 0,
                temperature: 0,
                compassHeading: 0,
                accelerometer: {
                    x: 0,
                    y: 0,
                    strength: 0,
                },
            },
        };
    }

    /**
     * payload 에 앞, 뒤 고정 버퍼를 추가한다.
     * @param {number} key
     * @param {number[]?} payload
     * @returns {Buffer}
     */
    makeBuffer(key, payload) {
        const payloadLength = MICROBIT_BUFFER_SIZE
            - this.startChecksum.length
            - this.endChecksum.length
            - 1; // key length

        // payload 는 최대 payloadLength 까지. 이보다 적은 경우 0 으로 fill.
        // payload 가 없는 경우는 빈 배열로 대체한다.
        const slicedPayload = _
            .chain(_.fill(Array(payloadLength), 0))
            .zipWith(payload || [], (original, input) => input || 0)
            .slice(0, payloadLength)
            .value();

        return Buffer.from(
            this.startChecksum
                .concat([key])
                .concat(...slicedPayload)
                .concat(this.endChecksum),
        );
    }

    // socketReconnection() {
    //     this.socket.send(this.handler.encode());
    // }

    requestInitialData() {
        const aa = this.makeBuffer(functionKeys.CHECK_READY);
        console.log('send to : ', aa);
        return aa;
    }

    // validateLocalData(data) {
    //     return data[0] === this.BUFFER_END_ACK_FLAG;
    // }

    setSerialPort(sp) {
        this.sp = sp;
    }

    setSocket(socket) {
        this.socket = socket;
    }

    /**
     * 정상 handshake response 는 [ff 11 22 33 ~ 0d 0a] 이다.
     * @param {Buffer} data
     * @param config
     * @returns {boolean}
     */
    checkInitialData(data, config) {
        // data[1~4] 는 commandId 로, 체크하지 않는다.
        console.log('checkInitialData : ', data);
        // return true;
        return (
            data[0] === functionKeys.CHECK_READY &&
            data[1] === 0x11 &&
            data[2] === 0x22 &&
            data[3] === 0x33
        );
    }

    requestRemoteData(handler) {
        handler.write('payload', this.microbitStatusMap);
    }

    lostController(connector, stateCallback) {
        // 아무일도 안하지만, 해당 함수가 선언되면 lostTimer 가 선언되지 않음.
    }

    handleRemoteData(handler) {
        const id = handler.read('id') || undefined;
        const type = handler.read('type') || undefined;
        const payload = handler.read('payload') || {};


        // 리퀘스트 목록이 마지막으로 확인한 버전과 다르기 때문에, 업데이트한다.
        // 업데이트는 중복되지 않는 id 의 커맨드만 뒤에 추가한다.
        this.commandQueue.push({
            id, type, payload,
        });
    }

    requestLocalData() {
        if (this.commandQueue.length !== 0 && !this.pending) {
            this.pending = true;
            const { type, payload } = this.commandQueue.shift();
            console.log(`type : ${type} payload : ${payload}`);
            switch (type) {
                case functionKeys.SET_LED: {
                    const { x, y, value } = payload;
                    const valueType = {
                        on: 1,
                        off: 0,
                        toggle: 2,
                    };
                    // 임시로 statusMap 을 업데이트 한다.
                    // 실제 값은 getLED 시 다시 업데이트 된다.
                    let dummyCacheLedValue = 0;
                    if (value === 'toggle') {
                        dummyCacheLedValue = _.get(
                            this.microbitStatusMap,
                            ['sensorData', 'led', x, y],
                            0) === 0 ? 1 : 0;
                    } else {
                        dummyCacheLedValue = valueType[value];
                    }
                    _.set(this.microbitStatusMap, ['sensorData', 'led', x, y], dummyCacheLedValue);
                    return this.makeBuffer(functionKeys.SET_LED, [x, y, valueType[value]]);
                }
                case functionKeys.GET_LED: {
                    const { x, y } = payload;
                    return this.makeBuffer(functionKeys.GET_LED, [x, y]);
                }
                case functionKeys.RESET:
                    this.resetMicrobitStatusMap();
                    return this.makeBuffer(functionKeys.RESET);
                case functionKeys.SET_STRING:
                    return this.makeBuffer(
                        functionKeys.SET_STRING,
                        Buffer.from(payload).toJSON().data,
                    );
                case functionKeys.SET_DIGITAL: {
                    const { pinNumber, value } = payload;
                    return this.makeBuffer(functionKeys.SET_DIGITAL, [pinNumber, value]);
                }
                // 전달값이 uint8_t 이상인 경우
                case functionKeys.SET_ANALOG:
                case functionKeys.SET_SERVE_PERIOD:
                case functionKeys.SET_ANALOG_PERIOD: {
                    const { pinNumber, value } = payload;
                    const uInt8Value = [];
                    let targetValue = value;
                    while (targetValue) {
                        uInt8Value.push(targetValue & 0xFF);
                        targetValue >>= 8;
                    }
                    return this.makeBuffer(
                        functionKeys.SET_ANALOG_PERIOD,
                        [pinNumber, ...uInt8Value],
                    );
                }
                // 필요한 값이 value property 하나인 경우 전부
                case functionKeys.SET_SERVO:
                case functionKeys.GET_ANALOG:
                case functionKeys.GET_DIGITAL:
                case functionKeys.SET_IMAGE:
                case functionKeys.GET_ACCELEROMETER: {
                    const { value } = payload;
                    return this.makeBuffer(type, [value]);
                }
                // 그냥 값 없이 바로 커맨드만 보내는 경우
                case functionKeys.GET_BUTTON:
                case functionKeys.GET_LIGHT_LEVEL:
                case functionKeys.GET_TEMPERATURE:
                case functionKeys.GET_COMPASS_HEADING:
                case functionKeys.RESET_SCREEN:
                    return this.makeBuffer(type);
                default:
                    return this.makeBuffer(functionKeys.TEST_MESSAGE);
            }
        }
        // 0xff, 0x01 = startChecksum
        // ~8 개
        // switch (str) {
        //     case 'SET_LED': {
        //         const { x, y, value } = data;
        //         let state = 2;
        //         if (value === 'on') {
        //             state = 1;
        //         } else if (value === 'off') {
        //             state = 0;
        //         }
        //
        //         // returnData.fill(
        //         //     Buffer([FUNCTION_KEYS.SET_LED, x, y, state]),
        //         //     0,
        //         //     4,
        //         // );
        //         break;
        //     }
        //     case 'GET_LED': {
        //         const { x, y } = data;
        //         // returnData.fill(
        //         //     Buffer([FUNCTION_KEYS.GET_LED, x, y]),
        //         //     0,
        //         //     3,
        //         // );
        //         break;
        //     }
        //     case 'SET_STRING': {
        //         let { value = '' } = data;
        //         if (value.length > 20) {
        //             value = value.substr(0, 20);
        //         }
        //         // returnData.fill(
        //         //     Buffer.concat([Buffer([FUNCTION_KEYS.SET_STRING]), Buffer(value)]),
        //         //     0,
        //         //     value.length + 1,
        //         // );
        //         // returnData[58] = value.length;
        //         break;
        //     }
        //     case 'SET_IMAGE': {
        //         const { value } = data;
        //         // returnData.fill(
        //         //     Buffer([FUNCTION_KEYS.SET_IMAGE, value]),
        //         //     0,
        //         //     2,
        //         // );
        //         break;
        //     }
        //     case 'GET_ANALOG': {
        //         const { value } = data;
        //         // returnData.fill(
        //         //     Buffer([FUNCTION_KEYS.GET_ANALOG, value]),
        //         //     0,
        //         //     2,
        //         // );
        //         break;
        //     }
        //     case 'GET_DIGITAL': {
        //         const { value } = data;
        //         // returnData.fill(
        //         //     Buffer([FUNCTION_KEYS.GET_DIGITAL, value]),
        //         //     0,
        //         //     2,
        //         // );
        //         break;
        //     }
        //     case 'GET_BUTTON': {
        //         const { value } = data;
        //         // returnData.fill(
        //         //     Buffer([FUNCTION_KEYS.GET_BUTTON, value]),
        //         //     0,
        //         //     2,
        //         // );
        //         break;
        //     }
        //     case 'GET_SENSOR': {
        //         const { value } = data;
        //         // let type = '';
        //         // if (value === 'lightLevel') {
        //         //     type = FUNCTION_KEYS.GET_LIGHT_LEVEL;
        //         // } else if (value === 'temperature') {
        //         //     type = FUNCTION_KEYS.GET_TEMPERATURE;
        //         // } else {
        //         //     type = FUNCTION_KEYS.GET_COMPASS_HEADING;
        //         // }
        //         // returnData.fill(
        //         //     Buffer([type]),
        //         //     0,
        //         //     1,
        //         // );
        //         break;
        //     }
        //     case 'GET_ACCELEROMETER': {
        //         const { value } = data;
        //         // returnData.fill(
        //         //     Buffer([FUNCTION_KEYS.GET_ACCELEROMETER, value]),
        //         //     0,
        //         //     2,
        //         // );
        //         break;
        //     }
        //     case 'PLAY_NOTE': {
        //         const { note, beat } = data;
        //         // returnData.fill(
        //         //     Buffer([FUNCTION_KEYS.PLAY_NOTE, 0, 0, beat]),
        //         //     0,
        //         //     4,
        //         // );
        //         // returnData.writeInt16LE(note, 1);
        //         break;
        //     }
        //     case 'CHANGE_BPM': {
        //         const { value } = data;
        //         // returnData.fill(
        //         //     Buffer([FUNCTION_KEYS.CHANGE_BPM]),
        //         //     0,
        //         //     1,
        //         // );
        //         // returnData.writeInt16LE(value, 1);
        //         break;
        //     }
        //     case 'SET_BPM': {
        //         const { value } = data;
        //         // returnData.fill(
        //         //     Buffer([FUNCTION_KEYS.SET_BPM]),
        //         //     0,
        //         //     1,
        //         // );
        //         // returnData.writeInt16LE(value, 1);
        //         break;
        //     }
        //     case 'RST':
        //         // returnData.fill(Buffer([FUNCTION_KEYS.RESET]), 0, 1);
        //         break;
        //     default:
        //         return this.makeBuffer([FUNCTION_KEYS.TEST_MESSAGE]);
        // }
    }


    handleLocalData(data) {
        this.pending = false;
        console.log('received from microbit : ', data);
        const receivedCommandType = data[0];
        switch (receivedCommandType) {
            case functionKeys.GET_ACCELEROMETER: {
                const value = Buffer.from([data[1], data[2]]);
                _.set(this.microbitStatusMap, 'sensorData.accelerometer', value.readInt16LE(0));
                break;
            }
            case functionKeys.GET_LED: {
                const x = data[1];
                const y = data[2];
                _.set(this.microbitStatusMap, ['sensorData', 'led', x, y], data[3]);
                break;
            }
            case functionKeys.GET_ANALOG: {
                const pinNumber = data[1];
                const value = Buffer.from([data[2], data[3]]);
                _.set(
                    this.microbitStatusMap,
                    ['sensorData', 'analog', pinNumber],
                    value.readInt16LE(0),
                );
                break;
            }
            case functionKeys.GET_DIGITAL: {
                const pinNumber = data[1];
                const value = data[2];
                _.set(
                    this.microbitStatusMap,
                    ['sensorData', 'digital', pinNumber],
                    value,
                );
                break;
            }
            case functionKeys.GET_BUTTON: {
                const buttonState = data[1];
                _.set(
                    this.microbitStatusMap,
                    ['sensorData', 'button'],
                    buttonState,
                );
                break;
            }
            case functionKeys.GET_LIGHT_LEVEL: {
                const lightLevel = Buffer.from([data[1]]).readUInt8(0);
                _.set(
                    this.microbitStatusMap,
                    ['sensorData', 'lightLevel'],
                    lightLevel,
                );
                break;
            }
            case functionKeys.GET_TEMPERATURE: {
                const temperature = Buffer.from([data[1]]).readInt8(0);
                _.set(
                    this.microbitStatusMap,
                    ['sensorData', 'temperature'],
                    temperature,
                );
                break;
            }
            case functionKeys.GET_COMPASS_HEADING: {
                const compassHeading = Buffer.from([data[1], data[2]]).readUInt16LE(0);
                _.set(
                    this.microbitStatusMap,
                    ['sensorData', 'compassHeading'],
                    compassHeading,
                );
                break;
            }
        }
        // this.socket.send('abcde');
        // const count = data[data.length - 3];
        // const blockId = this.executeCheckList[count];
        // if (blockId) {
        //     const socketData = this.handler.encode();
        //     socketData.blockId = blockId;
        //     this.setSocketData({
        //         data,
        //         socketData,
        //     });
        //     this.socket.send(socketData);
        // }
    }

    disconnect(connect) {
        connect.close();
        this.sendBuffers = [];
        this.recentCheckData = [];
        this.isDraing = false;
        this.sp = null;
    }

    reset() {
        this.sp = null;
    }
}

module.exports = new Microbit2();
