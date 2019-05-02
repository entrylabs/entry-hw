const _ = require('lodash');
const BaseModule = require('./baseModule');

const FUNCTION_KEYS = {
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
    RESET: 0xfe,
};

class Microbit extends BaseModule {
    constructor() {
        super();
        this.sendIndex = 0;
        this.sendBuffers = [];
        this.completeIds = [];
        this.executeCount = 0;
        this.drainTime = 0;
        this.recentCheckData = [];
        this.executeCheckList = [];
        this.frontBuffer = new Buffer([0xff, 0x01]);
        this.backBuffer = new Buffer([0x0d, 0x0a]);
    }

    connect() {
        setTimeout(() => {
            this.sp.write(this.makeData('RST'));
        }, 500);
        // this.sp.write(this.makeData('RST'));
    }

    socketReconnection() {
        this.socket.send(this.handler.encode());
    }

    requestInitialData() {
        return this.makeData('RST');
    }

    setSerialPort(sp) {
        this.sp = sp;
    }

    setSocket(socket) {
        this.socket = socket;
    }

    checkInitialData(data, config) {
        return true;
    }

    validateLocalData(data) {
        return true;
    }

    requestRemoteData(handler) {
    }

    handleRemoteData({ receiveHandler = {} }) {
        const { data: handlerData } = receiveHandler;
        if (_.isEmpty(handlerData)) {
            return;
        }

        Object.keys(handlerData).forEach((id) => {
            const { type, data } = handlerData[id] || {};
            if (
                _.findIndex(this.sendBuffers, { id }) === -1 &&
                this.executeCheckList.indexOf(id) === -1
            ) {
                const sendData = this.makeData(type, data);
                this.sendBuffers.push({
                    id,
                    data: sendData,
                    index: this.executeCount,
                });
            }
        });
    }

    requestLocalData() {
        if (!this.isDraing && this.sendBuffers.length > 0) {
            const sendData = this.sendBuffers.shift();
            this.isDraing = true;
            this.sp.write(sendData.data, () => {
                if (this.sp) {
                    this.sp.drain(() => {
                        this.executeCheckList[sendData.index] = sendData.id;
                    });
                }
            });
        }
        return;
    }

    handleLocalData(data) {
        const count = data[data.length - 3];
        const blockId = this.executeCheckList[count];
        if (blockId) {
            const socketData = this.handler.encode();
            socketData.blockId = blockId;
            this.setSocketData({
                data,
                socketData,
            });
            this.socket.send(socketData);
        }
    }

    setSocketData({ socketData, data }) {
        const key = data[2];
        let drainTime = 0;
        switch (key) {
            case FUNCTION_KEYS.SET_IMAGE: {
                drainTime = 25;
                break;
            }
            case FUNCTION_KEYS.GET_LED: {
                const value = data[5];
                socketData.LED = value;
                break;
            }
            case FUNCTION_KEYS.GET_ANALOG: {
                const value = Buffer([data[3], data[4]]);
                socketData.GET_ANALOG = value.readInt16LE();
                break;
            }
            case FUNCTION_KEYS.GET_DIGITAL: {
                socketData.GET_DIGITAL = data[3];
                break;
            }
            case FUNCTION_KEYS.GET_BUTTON: {
                socketData.GET_BUTTON = data[3];
                break;
            }
            case FUNCTION_KEYS.GET_LIGHT_LEVEL:
            case FUNCTION_KEYS.GET_TEMPERATURE:
            case FUNCTION_KEYS.GET_COMPASS_HEADING: {
                socketData.GET_SENSOR = data[3];
                break;
            }
            case FUNCTION_KEYS.GET_ACCELEROMETER: {
                const value = Buffer([data[3], data[4]]);
                socketData.GET_ACCELEROMETER = value.readInt16LE();
                break;
            }
            default:
                break;
        }

        setTimeout(() => {
            this.isDraing = false;
        }, drainTime);
    }

    makeData(key, data) {
        let returnData = new Buffer(59);
        switch (key) {
            case 'SET_LED': {
                const { x, y, value } = data;
                let state = 2;
                if (value === 'on') {
                    state = 1;
                } else if (value === 'off') {
                    state = 0;
                }

                returnData.fill(
                    Buffer([FUNCTION_KEYS.SET_LED, x, y, state]),
                    0,
                    4
                );
                break;
            }
            case 'GET_LED': {
                const { x, y } = data;
                returnData.fill(
                    Buffer([FUNCTION_KEYS.GET_LED, x, y]),
                    0,
                    3
                );
                break;
            }
            case 'SET_STRING': {
                let { value = '' } = data;
                if(value.length > 20) {
                    value = value.substr(0, 20)
                }
                returnData.fill(
                    Buffer.concat([Buffer([FUNCTION_KEYS.SET_STRING]), Buffer(value)]),
                    0,
                    value.length + 1
                );
                returnData[58] = value.length;
                break;
            }
            case 'SET_IMAGE': {
                const { value } = data;
                returnData.fill(
                    Buffer([FUNCTION_KEYS.SET_IMAGE, value]),
                    0,
                    2
                );
                break;
            }
            case 'GET_ANALOG': {
                const { value } = data;
                returnData.fill(
                    Buffer([FUNCTION_KEYS.GET_ANALOG, value]),
                    0,
                    2
                );
                break;
            }
            case 'GET_DIGITAL': {
                const { value } = data;
                returnData.fill(
                    Buffer([FUNCTION_KEYS.GET_DIGITAL, value]),
                    0,
                    2
                );
                break;
            }
            case 'GET_BUTTON': {
                const { value } = data;
                returnData.fill(
                    Buffer([FUNCTION_KEYS.GET_BUTTON, value]),
                    0,
                    2
                );
                break;
            }
            case 'GET_SENSOR': {
                const { value } = data;
                let type = '';
                if (value === 'lightLevel') {
                    type = FUNCTION_KEYS.GET_LIGHT_LEVEL;
                } else if (value === 'temperature') {
                    type = FUNCTION_KEYS.GET_TEMPERATURE;
                } else {
                    type = FUNCTION_KEYS.GET_COMPASS_HEADING;
                }
                returnData.fill(
                    Buffer([type]),
                    0,
                    1
                );
                break;
            }
            case 'GET_ACCELEROMETER': {
                const { value } = data;
                returnData.fill(
                    Buffer([FUNCTION_KEYS.GET_ACCELEROMETER, value]),
                    0,
                    2
                );
                break;
            }
            case 'PLAY_NOTE': {
                const { note, beat } = data;
                returnData.fill(
                    Buffer([FUNCTION_KEYS.PLAY_NOTE, 0, 0, beat]),
                    0,
                    4
                );
                returnData.writeInt16LE(note, 1);
                break;
            }
            case 'CHANGE_BPM': {
                const { value } = data;
                returnData.fill(
                    Buffer([FUNCTION_KEYS.CHANGE_BPM]),
                    0,
                    1
                );
                returnData.writeInt16LE(value, 1);
                break;
            }
            case 'SET_BPM': {
                const { value } = data;
                returnData.fill(
                    Buffer([FUNCTION_KEYS.SET_BPM]),
                    0,
                    1
                );
                returnData.writeInt16LE(value, 1);
                break;
            }
            case 'RST':
                returnData.fill(Buffer([FUNCTION_KEYS.RESET]), 0, 1);
                break;
            default:
                break;
        }
        const command = Buffer.concat([
            this.frontBuffer,
            returnData,
            this.getExecuteCount(),
            this.backBuffer,
        ]);
        return command;
    }

    getExecuteCount() {
        if (this.executeCount < 255) {
            this.executeCount++;
        } else {
            this.executeCount = 0;
        }
        return Buffer([this.executeCount]);
    }

    lostController() {}

    disconnect(connect) {
        connect.close();
        this.sendBuffers = [];
        this.completeIds = [];
        this.recentCheckData = [];
        this.isDraing = false;
        this.sp = null;
    }

    reset() {
        this.sp = null;
    }
}

module.exports = new Microbit();
