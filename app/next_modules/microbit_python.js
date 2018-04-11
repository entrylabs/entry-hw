const _ = require('lodash');
const BaseModule = require('./baseModule');

const FUNCTION_KEYS = {
    LED: 0x01,
    NOTE: 0x02,
    GET_LED: 0x31,
    GET_ANALOG: 0x32,
    GET_DIGITAL: 0x33,
    GET_BUTTON: 0x34,
    TEMPERATURE: 0x35,
    COMPASS_HEADING: 0x36,
    ACCELEROMETER: 0x37,
    ACCELEROMETER_VALUES: 0x38,
    RADIO: 0x39,
    RESET: 0xfe,
};

class Microbit extends BaseModule {
    constructor() {
        super();
        this.sendIndex = 0;
        this.sendBuffers = [];
        this.completeIds = [];
        this.executeCount = 0;
        this.recentCheckData = [];
        this.executeCheckList = [];
        this.frontBuffer = new Buffer([0xff, 0x01]);
        this.backBuffer = new Buffer([0x0d, 0x0a]);
        this.radioInterval = -1;
    }

    connect() {
        this.sp.write(this.makeData('RST'));
        // this.radioInterval = setInterval(() => {
        //     this.sp.write(this.makeData('RADIO_READ'));
        // }, 1000);
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

    requestRemoteData(handler) {}

    handleRemoteData({ receiveHandler = {} }) {
        const { data: handlerData } = receiveHandler;
        if (_.isEmpty(handlerData)) {
            return;
        }

        Object.keys(handlerData).forEach((id) => {
            const { type, data } = handlerData[id] || {};
            console.log(
                _.findIndex(this.sendBuffers, { id }) === -1,
                this.sendBuffers,
                id
            );
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
                        // this.executeCheckList.push(sendData.id);
                        this.isDraing = false;
                    });
                }
            });
        }
        return;
    }

    handleLocalData(data) {
        const buff = this.parseData(data);
        console.log(buff, Buffer(data).toString());
        const count = buff[buff.length - 1];
        const blockId = this.executeCheckList[count];
        if (blockId || count === 255) {
            const socketData = this.handler.encode();
            socketData.blockId = blockId;
            this.setSocketData({
                socketData,
                data: buff,
            });
            this.socket.send(socketData);
        }
    }

    setSocketData({ socketData, data }) {
        const key = data[2];
        switch (key) {
            case FUNCTION_KEYS.GET_LED: {
                const value = data[3];
                socketData.LED = value;
                break;
            }
            case FUNCTION_KEYS.GET_ANALOG: {
                const value = Buffer.from([data[3], data[4]]);
                socketData.GET_ANALOG = value.readInt16LE();
                break;
            }
            case FUNCTION_KEYS.GET_DIGITAL: {
                const value = Buffer.from([data[3], data[4]]);
                socketData.GET_DIGITAL = value.readInt16LE();
                break;
            }
            case FUNCTION_KEYS.GET_BUTTON: {
                const value = Buffer.from([data[3], data[4]]);
                socketData.GET_BUTTON = value.readInt16LE();
                break;
            }
            case FUNCTION_KEYS.TEMPERATURE: {
                const value = data[3];
                socketData.GET_SENSOR = value;
                break;
            }
            case FUNCTION_KEYS.COMPASS_HEADING: {
                const value = Buffer.from([data[3], data[4]]);
                socketData.GET_SENSOR = value.readInt16LE();
                break;
            }
            case FUNCTION_KEYS.ACCELEROMETER: {
                const value = Buffer.from([data[3], data[4]]);
                socketData.GET_ACCELEROMETER = value.readInt16LE();
                break;
            }
            case FUNCTION_KEYS.ACCELEROMETER_VALUES: {
                const x = Buffer.from([data[3], data[4]]);
                const y = Buffer.from([data[5], data[6]]);
                const z = Buffer.from([data[7], data[8]]);
                const intX = x.readInt16LE();
                const intY = y.readInt16LE();
                const intZ = z.readInt16LE();
                socketData.GET_ACCELEROMETER = Math.floor(
                    Math.sqrt(intX * intX + intY * intY + intZ * intZ)
                );
                break;
            }
            case FUNCTION_KEYS.RADIO: {
                const radioData = Buffer(
                    data.slice(3, data.length - 1)
                ).toString();
                if (radioData) {
                    socketData.RADIO = {
                        value: radioData,
                        time: performance.now(),
                    };
                }
                break;
            }
            default:
                break;
        }
    }

    parseData(data) {
        const headIndex = _.findLastIndex(data, (byte, idx, buffer) => {
            if (buffer[idx - 1] === 10 && buffer[idx - 2] === 13) {
                return true;
            }
        });

        const tailIndex = _.findLastIndex(data, (byte, idx, buffer) => {
            if (buffer[idx + 1] === 255 && byte === 254) {
                return true;
            }
        });

        return data.slice(headIndex, tailIndex);
    }

    makeData(key, data) {
        let returnCommand = '';
        const count = this.getExecuteCount();
        const commandObject = {
            count,
        };
        switch (key) {
            case 'SET_LED': {
                const { x, y, value } = data;
                if (value === 'on') {
                    _.assign(commandObject, {
                        command: `display.set_pixel(${x}, ${y} 9)`,
                        type: 'write',
                        key: FUNCTION_KEYS.LED,
                    });
                    // returnCommand = `display.set_pixel(${x}, ${y} 9)`;
                    // returnCommand += `\r\nsendAckBuff(${
                    //     FUNCTION_KEYS.LED
                    // }, ${count})`;
                } else if (value === 'off') {
                    _.assign(commandObject, {
                        command: `display.set_pixel(${x}, ${y} 0)`,
                        type: 'write',
                        key: FUNCTION_KEYS.LED,
                    });
                    // returnCommand += `\r\nsendAckBuff(${
                    //     FUNCTION_KEYS.LED
                    // }, ${count})`;
                } else {
                    _.assign(commandObject, {
                        command: `toggleLed(${x}, ${y}, ${count})`,
                        type: 'write',
                        key: FUNCTION_KEYS.LED,
                    });
                    // returnCommand += `\r\nsendAckBuff(${
                    //     FUNCTION_KEYS.LED
                    // }, ${count})`;
                }
                break;
            }
            case 'GET_LED': {
                const { x, y } = data;
                returnCommand = `sendBoolBuff(display.get_pixel(${x}, ${y}) > 0, ${
                    FUNCTION_KEYS.GET_LED
                }, ${count})`;
                _.assign(commandObject, {
                    command: `display.get_pixel(${x}, ${y}) > 0`,
                    type: 'read',
                    key: FUNCTION_KEYS.GET_LED,
                });
                break;
            }
            case 'STRING': {
                const { value = '' } = data;
                let command = '';
                if (value.length === 1) {
                    command = `display.show(\\'${value}\\')`;
                } else {
                    command = `display.scroll(\\'${value}\\')`;
                }
                returnCommand += `\r\nsendAckBuff(${
                    FUNCTION_KEYS.LED
                }, ${count})`;

                _.assign(commandObject, {
                    command,
                    type: 'write',
                    key: FUNCTION_KEYS.LED,
                });
                break;
            }
            case 'IMAGE': {
                const { value } = data;
                returnCommand = `display.show(${value})`;
                returnCommand += `\r\nsendAckBuff(${
                    FUNCTION_KEYS.LED
                }, ${count})`;

                _.assign(commandObject, {
                    command: `display.show(${value})`,
                    type: 'write',
                    key: FUNCTION_KEYS.LED,
                });
                break;
            }
            case 'GET_ANALOG': {
                const { value } = data;
                returnCommand = `gc.collect()\r\nsendInt16LEBuff(${value}.read_analog(), ${
                    FUNCTION_KEYS.GET_ANALOG
                }, ${count})`;
                _.assign(commandObject, {
                    command: `${value}.read_analog()`,
                    type: 'read',
                    key: FUNCTION_KEYS.GET_ANALOG,
                });
                break;
            }
            case 'GET_DIGITAL': {
                const { value } = data;
                returnCommand = `sendBoolBuff(${value}.read_digital(), ${
                    FUNCTION_KEYS.GET_DIGITAL
                }, ${count})`;
                _.assign(commandObject, {
                    command: `${value}.read_digital()`,
                    type: 'read',
                    key: FUNCTION_KEYS.GET_DIGITAL,
                });
                break;
            }
            case 'GET_BUTTON': {
                const { value } = data;
                returnCommand = `sendBoolBuff(${value}.is_pressed(), ${
                    FUNCTION_KEYS.GET_BUTTON
                }, ${count})`;
                _.assign(commandObject, {
                    command: `${value}.is_pressed()`,
                    type: 'read',
                    key: FUNCTION_KEYS.GET_BUTTON,
                });
                break;
            }
            case 'GET_SENSOR': {
                const { value } = data;
                if (value === 'temperature') {
                    returnCommand = `sendInt8Buff(temperature(), ${
                        FUNCTION_KEYS.TEMPERATURE
                    }, ${count})`;
                    _.assign(commandObject, {
                        command: `temperature()`,
                        type: 'read',
                        key: FUNCTION_KEYS.TEMPERATURE,
                    });
                } else {
                    returnCommand = `getCompassHeading(${count})`;
                    _.assign(commandObject, {
                        command: `getCompassHeading(${count})`,
                        type: 'run',
                        key: FUNCTION_KEYS.COMPASS_HEADING,
                    });
                }
                break;
            }
            case 'GET_ACCELEROMETER': {
                const { value } = data;
                if (value === 'values') {
                    returnCommand = `gc.collect()\r\ngetAccelerometerValues(${count})`;
                    _.assign(commandObject, {
                        command: `getAccelerometerValues(${count})`,
                        type: 'run',
                        key: FUNCTION_KEYS.ACCELEROMETER_VALUES,
                    });
                } else {
                    returnCommand = `gc.collect()\r\ngetAccelerometer('${value}', ${count})`;
                    _.assign(commandObject, {
                        command: `getAccelerometer('${value}', ${count})`,
                        type: 'run',
                        key: FUNCTION_KEYS.ACCELEROMETER,
                    });
                }
                break;
            }
            case 'PLAY_NOTE': {
                const { value } = data;
                returnCommand = `music.play('${value}')`;
                returnCommand += `\r\nsendAckBuff(${
                    FUNCTION_KEYS.NOTE
                }, ${count})`;
                _.assign(commandObject, {
                    command: `music.play('${value}')`,
                    type: 'write',
                    key: FUNCTION_KEYS.NOTE,
                });
                break;
            }
            case 'CHANGE_BPM': {
                const { value } = data;
                returnCommand = `changeTempo(${value})`;
                returnCommand += `\r\nsendAckBuff(${
                    FUNCTION_KEYS.NOTE
                }, ${count})`;
                _.assign(commandObject, {
                    command: `changeTempo('${value}')`,
                    type: 'write',
                    key: FUNCTION_KEYS.NOTE,
                });
                break;
            }
            case 'SET_BPM': {
                const { value } = data;
                returnCommand = `music.set_tempo(bpm=${value})`;
                returnCommand += `\r\nsendAckBuff(${
                    FUNCTION_KEYS.NOTE
                }, ${count})`;
                _.assign(commandObject, {
                    command: `music.set_tempo(bpm=${value})`,
                    type: 'write',
                    key: FUNCTION_KEYS.NOTE,
                });
                break;
            }
            case 'RADIO_READ': {
                returnCommand = `sendStringBuff(radio.receive(), ${
                    FUNCTION_KEYS.RADIO
                }, 255)`;
                break;
            }
            case 'RST':
                returnCommand = `clear(${count})`;
                _.assign(commandObject, {
                    command: `clear(${count})`,
                    type: `run`,
                    key: FUNCTION_KEYS.RESET,
                });
                break;
            default:
                break;
        }

        // let command = `callMethod('${returnCommand}', ${count})\r\n`;
        const command = this.parseCommandObject(commandObject);
        console.log(command);
        return command;
    }

    parseCommandObject({command, type, key, count}) {
        return `callMethod('${command}', '${type}', ${key}, ${count})\r\n`;
    }

    getExecuteCount() {
        if (this.executeCount === 50) {
            console.time('s');
        }
        if (this.executeCount === 150) {
            console.timeEnd('s');
        }
        if (this.executeCount < 200) {
            this.executeCount++;
        } else {
            this.executeCount = 0;
        }
        return this.executeCount;
    }

    lostController() {}

    disconnect(connect) {
        clearInterval(this.radioInterval);
        connect.close();
        this.sendBuffers = [];
        this.completeIds = [];
        this.recentCheckData = [];
        this.isDraing = false;
        this.sp = null;
        this.executeCount = 0;
    }

    reset() {
        this.sp = null;
    }
}

module.exports = new Microbit();
