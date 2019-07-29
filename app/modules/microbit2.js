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
    PLAY_NOTE: 0x04,
    CHANGE_BPM: 0x05,
    SET_BPM: 0x06,
    GET_LED: 0x31,
    GET_ANALOG: 0x32,
    GET_DIGITAL: 0x33,
    GET_BUTTON: 0x34,
    GET_LIGHT_LEVEL: 0x35,
    GET_TEMPERATURE: 0x36,
    GET_COMPASS_HEADING: 0x37,
    GET_ACCELEROMETER: 0x38,
};

class Microbit2 extends BaseModule {
    constructor() {
        super();
        this.sendBuffers = [];
        this.recentCheckData = [];
        this.startChecksum = [0xff, 0x01];
        this.endChecksum = [0x0d, 0x0a];
        this.BUFFER_END_ACK_FLAG = 0xff;

        this.microbitStatusMap = {
            payload: undefined,
            sensorData: {
                accelerometer: {
                    x: 0,
                    y: 0,
                    strength: 0,
                },
            },
        };
        this.commandQueue = [];
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

    // setSerialPort(sp) {
    //     this.sp = sp;
    // }

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
        return true;
        return (
            data[0] === this.BUFFER_END_ACK_FLAG &&
            data[1] === functionKeys.CHECK_READY &&
            data[2] === 0x11 &&
            data[3] === 0x22 &&
            data[4] === 0x33
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
        if (this.commandQueue.length !== 0) {
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
                    return this.makeBuffer(functionKeys.SET_LED, [x, y, valueType[value]]);
                }
                case functionKeys.RESET:
                    return this.makeBuffer(functionKeys.RESET);
                case functionKeys.SET_STRING:
                    return this.makeBuffer(
                        functionKeys.SET_STRING,
                        Buffer.from(payload).toJSON().data,
                    );
                case functionKeys.GET_ACCELEROMETER:
                    return this.makeBuffer(functionKeys.GET_ACCELEROMETER);
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
        console.log('received from microbit : ', data);
        const receivedCommandType = data[1];
        const payload = data[2];
        switch (receivedCommandType) {
            case functionKeys.GET_ACCELEROMETER:
                this.microbitStatusMap.sensorData.accelerometer.strength = payload;
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
