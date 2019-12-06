const _ = require('lodash');
const BaseModule = require('./baseModule');

/**
 * NOTE
 * microbit getGesture 결과 목록표
 * MICROBIT_ACCELEROMETER_EVT_TILT_UP	1
 * MICROBIT_ACCELEROMETER_EVT_TILT_DOWN	2
 * MICROBIT_ACCELEROMETER_EVT_TILT_LEFT	3
 * MICROBIT_ACCELEROMETER_EVT_TILT_RIGHT	4
 * MICROBIT_ACCELEROMETER_EVT_FACE_UP	5
 * MICROBIT_ACCELEROMETER_EVT_FACE_DOWN	6
 * MICROBIT_ACCELEROMETER_EVT_FREEFALL	7
 * MICROBIT_ACCELEROMETER_EVT_3G	8
 * MICROBIT_ACCELEROMETER_EVT_6G	9
 * MICROBIT_ACCELEROMETER_EVT_8G	10
 * MICROBIT_ACCELEROMETER_EVT_SHAKE	11
 *
 */

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
    SET_SERVO_PERIOD: 0x12,
    GET_LED: 0x31,
    GET_ANALOG: 0x32,
    GET_DIGITAL: 0x33,
    GET_BUTTON: 0x34,
    GET_LIGHT_LEVEL: 0x35,
    GET_TEMPERATURE: 0x36,
    GET_COMPASS_HEADING: 0x37,
    GET_ACCELEROMETER: 0x38,
    GET_PITCH: 0x39,
    GET_ROLL: 0x40,
    GET_GESTURE: 0x41,
    PLAY_NOTE: 0x04,
    CHANGE_BPM: 0x05,
    SET_BPM: 0x06,
    ACC_REGULAR: 0xaa,
    SENSOR_REGULAR: 0xab,
    LED_1: 0xca,
    LED_2: 0xcb,
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
                led: {
                    0: [0, 0, 0, 0, 0],
                    1: [0, 0, 0, 0, 0],
                    2: [0, 0, 0, 0, 0],
                    3: [0, 0, 0, 0, 0],
                    4: [0, 0, 0, 0, 0],
                },
                button: false,
                lightLevel: 0,
                temperature: 0,
                compassHeading: 0,
                accelerometer: {
                    x: 0,
                    y: 0,
                    z: 0,
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
        const payloadLength =
            MICROBIT_BUFFER_SIZE -
            this.startChecksum.length -
            this.endChecksum.length -
            1; // key length

        // payload 는 최대 payloadLength 까지. 이보다 적은 경우 0 으로 fill.
        // payload 가 없는 경우는 빈 배열로 대체한다.
        const slicedPayload = _.chain(_.fill(Array(payloadLength), 0))
            .zipWith(payload || [], (original, input) => input || 0)
            .slice(0, payloadLength)
            .value();

        return Buffer.from(
            this.startChecksum
                .concat([key])
                .concat(...slicedPayload)
                .concat(this.endChecksum)
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
        const type = handler.read('type') || undefined;
        const payload = handler.read('payload') || {};

        // 리퀘스트 목록이 마지막으로 확인한 버전과 다르기 때문에, 업데이트한다.
        // 업데이트는 중복되지 않는 id 의 커맨드만 뒤에 추가한다.
        this.commandQueue.push({
            type,
            payload,
        });
    }

    requestLocalData() {
        if (this.commandQueue.length !== 0 && !this.pending) {
            this.pending = true;
            const { type, payload } = this.commandQueue.shift();
            // console.log(`type : ${type} payload : ${payload}`);
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
                        dummyCacheLedValue =
                            _.get(
                                this.microbitStatusMap,
                                ['sensorData', 'led', x, y],
                                0
                            ) === 0
                                ? 1
                                : 0;
                    } else {
                        dummyCacheLedValue = valueType[value];
                    }
                    // _.set(
                    //     this.microbitStatusMap,
                    //     ['sensorData', 'led', x, y],
                    //     dummyCacheLedValue
                    // );
                    return this.makeBuffer(functionKeys.SET_LED, [
                        x,
                        y,
                        valueType[value],
                    ]);
                }
                // case functionKeys.GET_LED: {
                //     const { x, y } = payload;
                //     return this.makeBuffer(functionKeys.GET_LED, [x, y]);
                // }
                case functionKeys.RESET:
                    this.resetMicrobitStatusMap();
                    return this.makeBuffer(functionKeys.RESET);
                case functionKeys.SET_STRING:
                    return this.makeBuffer(
                        functionKeys.SET_STRING,
                        Buffer.from(payload).toJSON().data
                    );
                case functionKeys.SET_DIGITAL: {
                    const { pinNumber, value } = payload;
                    return this.makeBuffer(functionKeys.SET_DIGITAL, [
                        pinNumber,
                        value,
                    ]);
                }
                // 전달값이 uint8_t 이상인 경우
                case functionKeys.SET_ANALOG:
                case functionKeys.SET_SERVO_PERIOD:
                case functionKeys.SET_ANALOG_PERIOD: {
                    const { pinNumber, value } = payload;
                    const uInt8Value = [];
                    let targetValue = value;
                    while (targetValue) {
                        uInt8Value.push(targetValue & 0xff);
                        targetValue >>= 8;
                    }
                    return this.makeBuffer(type, [pinNumber, ...uInt8Value]);
                }
                // 필요한 값이 value property 하나인 경우 전부
                case functionKeys.SET_SERVO:
                case functionKeys.GET_ANALOG:
                case functionKeys.GET_DIGITAL:
                case functionKeys.SET_IMAGE:
                case functionKeys.RESET_SCREEN:
                case functionKeys.GET_LIGHT_LEVEL:
                    return this.makeBuffer(type);

                // 그냥 값 없이 바로 커맨드만 보내는 경우
                case functionKeys.GET_BUTTON:
                case functionKeys.GET_TEMPERATURE:
                case functionKeys.GET_PITCH:
                case functionKeys.GET_ROLL:
                case functionKeys.GET_ACCELEROMETER:
                case functionKeys.GET_COMPASS_HEADING:
                case functionKeys.GET_GESTURE:
                case functionKeys.GET_LED:
                default:
                    return null;
            }
        }
    }

    /**
     *
     * @param {string|string[]} path
     * @param value
     */
    setStatusMap(path, value) {
        _.set(this.microbitStatusMap, path, value);
    }

    handleLocalData(data) {
        this.pending = false;
        console.log('received from microbit : ', data);
        const receivedCommandType = data[0];
        switch (receivedCommandType) {
            case functionKeys.GET_ANALOG: {
                // data = [pinNumber, value{2} ]
                this.setStatusMap(
                    ['sensorData', 'analog', data[1]],
                    Buffer.from([data[2], data[3]]).readInt16LE(0)
                );
                break;
            }
            case functionKeys.GET_LIGHT_LEVEL: {
                // data = [pinNumber, value]
                const light = Number(Buffer.from([data[1]]).readUInt8(0));
                console.log(light);
                this.setStatusMap(['sensorData', 'lightLevel'], light);
                break;
            }
            case functionKeys.GET_DIGITAL: {
                // data = [pinNumber, value]
                this.setStatusMap(['sensorData', 'analog', data[1]], data[2]);
                break;
            }

            case functionKeys.ACC_REGULAR: {
                // console.log('ACC_REGULAR RECEIVED');
                const x = Number(
                    Buffer.from([data[1], data[2]]).readInt16LE(0)
                );
                const y = Number(
                    Buffer.from([data[3], data[4]]).readInt16LE(0)
                );
                const z = Number(
                    Buffer.from([data[5], data[6]]).readInt16LE(0)
                );
                const strength = Math.sqrt(x * x + y * y + z * z);
                const pitch = Number(
                    Buffer.from([data[7], data[8]]).readInt16LE(0)
                );
                const roll = Number(
                    Buffer.from([data[9], data[10]]).readInt16LE(0)
                );
                const light = Number(Buffer.from([data[11]]).readUInt8(0));
                const temperature = Number(
                    Buffer.from([data[12]]).readUInt8(0)
                );
                const button = Number(Buffer.from([data[13]]).readUInt8(0));
                // console.log(x, y, z, 'ACC', pitch, roll);
                // console.log(light, temperature, button);

                this.setStatusMap(['sensorData', 'accelerometer', 'x'], x);
                this.setStatusMap(['sensorData', 'accelerometer', 'y'], y);
                this.setStatusMap(['sensorData', 'accelerometer', 'z'], z);

                this.setStatusMap(
                    ['sensorData', 'accelerometer', 'strength'],
                    strength
                );
                this.setStatusMap(['sensorData', 'tilt', 'pitch']);
                this.setStatusMap(['sensorData', 'tilt', 'roll'], roll);
                this.setStatusMap(['sensorData', 'lightLevel'], light);
                this.setStatusMap(['sensorData', 'temperature'], temperature);
                this.setStatusMap(['sensorData', 'button'], button);
                break;
            }
            case functionKeys.SENSOR_REGULAR: {
                // console.log('SENSOR_REGULAR RECEIVED');
                this.setStatusMap(
                    ['sensorData', 'compassHeading'],
                    Buffer.from([data[1], data[2]]).readUInt16LE(0)
                );
                this.setStatusMap(
                    ['sensorData', 'gesture'],
                    Buffer.from([data[3]]).readUInt8(0)
                );
                break;
            }
            case functionKeys.LED_1: {
                for (let i = 0; i < 13; i++) {
                    let x = i % 5;
                    let y = i / 5;
                    let value = Buffer.from([data[i + 1]]).readUInt8(0);
                }
            }
            case functionKeys.LED_2: {
                for (let i = 0; i < 12; i++) {
                    let offset = 13;
                    let x = (i + offset) % 5;
                    let y = (i + offset) / 5;
                    let value = Buffer.from([data[i + 1]]).readUInt8(0);
                }
            }
            // LED_1: 0xca,
            // LED_2: 0xcb,
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
