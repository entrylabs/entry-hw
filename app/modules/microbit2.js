const _ = require('lodash');
const BaseModule = require('./baseModule');

const MICROBIT_BUFFER_SIZE = 10;
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
        this.statusChangedProperty = undefined;
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
            - this.endChecksum.length;

        // payload 는 최대 payloadLength 까지. 이보다 적은 경우 0 으로 fill.
        // payload 가 없는 경우는 빈 배열로 대체한다.
        const slicedPayload = payload ? _
            .clone(payload)
            .fill(0, MICROBIT_BUFFER_SIZE)
            .slice(0, payloadLength) : [];
        return Buffer.from(
            this.startChecksum
                .concat([key, ...slicedPayload])
                .concat(this.endChecksum),
        );
    }

    // socketReconnection() {
    //     this.socket.send(this.handler.encode());
    // }

    requestInitialData() {
        return this.makeBuffer(functionKeys.CHECK_READY);
    }

    // setSerialPort(sp) {
    //     this.sp = sp;
    // }

    // setSocket(socket) {
    //     this.socket = socket;
    // }

    /**
     *
     * @param {Buffer} data
     * @param config
     * @returns {boolean}
     */
    checkInitialData(data, config) {
        return (
            data[0] === 0x11 &&
            data[1] === 0x22 &&
            data[2] === 0x33
        );
    }

    requestRemoteData(handler) {
        handler.write('keykey', this.microbitStatusMap);
    }

    handleRemoteData(handler) {
        const commandType = handler.read('type');
        const data = handler.read('data');

        // console.log('received From Entry : ', commandType, data);

        switch (commandType) {
            // microbit2_led_toggle
            case functionKeys.SET_LED: {
                break;
            }
            case functionKeys.RESET: {
                break;
            }
        }
        // const { data: handlerData } = receiveHandler;
        // if (_.isEmpty(handlerData)) {
        //     return;
        // }
        //
        // Object.keys(handlerData).forEach((id) => {
        //     const { type, data } = handlerData[id] || {};
        //     if (
        //         _.findIndex(this.sendBuffers, { id }) === -1 &&
        //         this.executeCheckList.indexOf(id) === -1
        //     ) {
        //         const sendData = this.makeData(type, data);
        //         this.sendBuffers.push({
        //             id,
        //             data: sendData,
        //             index: this.executeCount,
        //         });
        //     }
        // });
    }

    requestLocalData() {
        return this.makeBuffer(functionKeys.TEST_MESSAGE);
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
