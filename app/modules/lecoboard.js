function Module() {
    this.sp = null;
    this.sensorTypes = {
        ALIVE: 0,
        DIGITAL: 1,
        ANALOG: 2,
        PWM: 3,
        SERVO_PIN: 4,
        TONE: 5,
        PULSEIN: 6,
        ULTRASONIC: 7,
        TIMER: 8,
        LCD: 9,
        LCD_COMMAND: 10,
        BLE_WRITE: 11,
        BLE_READ: 12,
        ARM_XYZ: 13,
        ARM_WG: 14,
    };

    this.actionTypes = {
        GET: 1,
        SET: 2,
        RESET: 3,
    };

    this.sensorValueSize = {
        FLOAT: 2,
        SHORT: 3,
        STRING: 4,
    };

    this.digitalPortTimeList = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    this.sensorData = {
        ULTRASONIC: 0,
        DIGITAL: {
            '0': 0,
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0,
            '6': 0,
            '7': 0,
            '8': 0,
            '9': 0,
            '10': 0,
            '11': 0,
            '12': 0,
            '13': 0,
            '14': 0,
            '15': 0,
            '16': 0,
            '17': 0,
            '18': 0,
            '19': 0,
            '20': 0,
            '21': 0,
            '22': 0,
            '23': 0,
            '24': 0,
            '25': 0,
            '26': 0,
            '27': 0,
            '28': 0,
            '29': 0,
            '30': 0,
            '31': 0,
            '32': 0,
            '33': 0,
        },
        ANALOG: {
            '0': 0,
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0,
            '6': 0,
            '7': 0,
        },
        PULSEIN: {},
        TIMER: 0,
        BLE_READ: 0,
    };

    this.defaultOutput = {};

    this.recentCheckData = {};

    this.sendBuffers = [];

    this.lastTime = 0;
    this.lastSendTime = 0;
    this.isDraing = false;
}

let sensorIdx = 0;

Module.prototype.init = function(handler, config) {

    console.log('init......');

};

Module.prototype.setSerialPort = function(sp) {
    const self = this;
    this.sp = sp;
    console.log('setSerialPort');  

};

Module.prototype.requestInitialData = function() {
    //console.log('request initial data');
    return this.makeSensorReadBuffer(this.sensorTypes.ANALOG, 0);
};

Module.prototype.checkInitialData = function(data, config) {
    //console.log('checkInitialData');
    return true;
    // 이후에 체크 로직 개선되면 처리
    //var datas = this.getDataByBuffer(data);
    //var isValidData = datas.some(function (data) {
    //    return (data.length > 4 && data[0] === 255 && data[1] === 85);
    //});
    //return isValidData;
};

Module.prototype.afterConnect = function(that, cb) {
    //console.log('connected');
    that.connected = true;
    if (cb) {
        cb('connected');
    }
};

Module.prototype.validateLocalData = function(data) {
    return true;
};

Module.prototype.requestRemoteData = function(handler) {
    //console.log('requestRemoteData');
    const self = this;

    if (!self.sensorData) {
        return;
    }

    Object.keys(this.sensorData).forEach((key) => {
        if (self.sensorData[key] != undefined) {
            handler.write(key, self.sensorData[key]);
            //console.log("sensor data key = "+ key);
        }
    });

    handler.write('4', this.sensorData.DIGITAL[4] ? 0 : 1);
    handler.write('28', this.sensorData.DIGITAL[28] ? 0 : 1);
    handler.write('29', this.sensorData.DIGITAL[29] ? 0 : 1);
    handler.write('1', this.sensorData.DIGITAL[1] ? 0 : 1);
    handler.write('0', this.sensorData.DIGITAL[0] ? 0 : 1);
    handler.write('a0', this.sensorData.ANALOG[0]);
    handler.write('a1', this.sensorData.ANALOG[1]);
    handler.write('a2', this.sensorData.ANALOG[2]);
    handler.write('a3', this.sensorData.ANALOG[3]);
    handler.write('a4', this.sensorData.ANALOG[4]);
    handler.write('a5', this.sensorData.ANALOG[5]);
    handler.write('a6', this.sensorData.ANALOG[6]);
    handler.write('a7', this.sensorData.ANALOG[7]);
};

Module.prototype.handleRemoteData = function(handler) {
    const self = this;
    const getDatas = handler.read('GET');
    const setDatas = handler.read('SET') || this.defaultOutput;
    const time = handler.read('TIME');
    let buffer = new Buffer([]);

    if (getDatas) {
        const keys = Object.keys(getDatas);
        keys.forEach((key) => {
            let isSend = false;
            const dataObj = getDatas[key];
            if (
                typeof dataObj.port === 'string' ||
                typeof dataObj.port === 'number'
            ) {
                const time = self.digitalPortTimeList[dataObj.port];
                if (dataObj.time > time) {
                    isSend = true;
                    self.digitalPortTimeList[dataObj.port] = dataObj.time;
                }
            } else if (Array.isArray(dataObj.port)) {
                isSend = dataObj.port.every((port) => {
                    const time = self.digitalPortTimeList[port];
                    return dataObj.time > time;
                });

                if (isSend) {
                    dataObj.port.forEach((port) => {
                        self.digitalPortTimeList[port] = dataObj.time;
                    });
                }
            }

            if (isSend) {
                if (!self.isRecentData(dataObj.port, key, dataObj.data)) {
                    self.recentCheckData[dataObj.port] = {
                        type: key,
                        data: dataObj.data,
                    };
                    buffer = Buffer.concat([
                        buffer,
                        self.makeSensorReadBuffer(
                            key,
                            dataObj.port,
                            dataObj.data,
                        ),
                    ]);
                }
            }
        });
    }

    if (setDatas) {
        const setKeys = Object.keys(setDatas);
        setKeys.forEach((port) => {
            const data = setDatas[port];
            if (data) {
                if (self.digitalPortTimeList[port] < data.time) {
                    self.digitalPortTimeList[port] = data.time;

                    if (!self.isRecentData(port, data.type, data.data)) {
                        self.recentCheckData[port] = {
                            type: data.type,
                            data: data.data,
                        };
                        buffer = Buffer.concat([
                            buffer,
                            self.makeOutputBuffer(data.type, port, data.data),
                        ]);
                    }
                }
            }
        });
    }

    if (buffer && buffer.length) {
        this.sendBuffers.push(buffer);
    }
};

Module.prototype.isRecentData = function(port, type, data) {
    const that = this;
    let isRecent = false;

    if (type == this.sensorTypes.ULTRASONIC) {
        const portString = port.toString();
        let isGarbageClear = false;
        Object.keys(this.recentCheckData).forEach((key) => {
            const recent = that.recentCheckData[key];
            if (key === portString) {

            }
            if (key !== portString && recent.type == that.sensorTypes.ULTRASONIC) {
                delete that.recentCheckData[key];
                isGarbageClear = true;
            }
        });

        if ((port in this.recentCheckData && isGarbageClear) || !(port in this.recentCheckData)) {
            isRecent = false;
        } else {
            isRecent = true;
        }
    } else if (port in this.recentCheckData && type != this.sensorTypes.TONE) {
        if (
            this.recentCheckData[port].type === type &&
            this.recentCheckData[port].data === data
        ) {
            isRecent = true;
        }
    }

    return isRecent;
};

Module.prototype.requestLocalData = function() {
    const self = this;
    //console.log('requestLocalData');
    if (!this.isDraing && this.sendBuffers && this.sendBuffers.length > 0) {
        this.isDraing = true;
        this.sp.write(this.sendBuffers.shift(), () => {
            if (self.sp) {
                self.sp.drain(() => {
                    self.isDraing = false;
                });
            }
        });
    }

    return null;
};

/*
ff 55 idx size data a
*/
Module.prototype.handleLocalData = function(data) {
    const self = this;
    const datas = this.getDataByBuffer(data);

    datas.forEach((data) => {
        if (data.length <= 4 || data[0] !== 255 || data[1] !== 85) {
            return;
        }
        const readData = data.subarray(2, data.length) || [];
        let value;
        switch (readData[0]) {
            case self.sensorValueSize.FLOAT: {
                value = new Buffer(readData.subarray(1, 5)).readFloatLE();
                value = Math.round(value * 100) / 100;
                break;
            }
            case self.sensorValueSize.SHORT: {
                value = new Buffer(readData.subarray(1, 3)).readInt16LE();
                break;
            }
            case self.sensorValueSize.STRING: {
                value = new Buffer(readData[1] + 3);
                value = readData.slice(2, readData[1] + 3);
                value = value.toString('ascii', 0, value.length);

                break;
            }
            default: {
                value = 0;
                break;
            }
        }

        const type = readData[readData.length - 1];
        const port = readData[readData.length - 2];

        switch (type) {
            case self.sensorTypes.DIGITAL: {
                if (port == 4) {
                    //console.log('port=%d, value=%d', port, value);
                }
                self.sensorData.DIGITAL[port] = value;
                break;
            }
            case self.sensorTypes.ANALOG: {
                if (port == 1) {
                    //console.log('port=%d, value=%d', port, value);
                }
                self.sensorData.ANALOG[port] = value;
                break;
            }
            case self.sensorTypes.PULSEIN: {
                self.sensorData.PULSEIN[port] = value;
                break;
            }
            case self.sensorTypes.ULTRASONIC: {
                self.sensorData.ULTRASONIC = value;
                break;
            }
            case self.sensorTypes.TIMER: {
                self.sensorData.TIMER = value;
                break;
            }
            case self.sensorTypes.BLE_READ: {
                self.sensorData.BLE_READ = value;
                break;
            }
            default: {
                break;
            }
        }
    });
};

/*
ff 55 len idx action device port  slot  data a
0  1  2   3   4      5      6     7     8
*/

Module.prototype.makeSensorReadBuffer = function(device, port, data) {
    //console.log('makeSensorReadBuffer');
    let buffer;
    const dummy = new Buffer([10]);
    if (device == this.sensorTypes.ULTRASONIC) {
        buffer = new Buffer([
            255,
            85,
            6,
            sensorIdx,
            this.actionTypes.GET,
            device,
            port[0],
            port[1],
            10,
        ]);
    } else if (!data) {
        buffer = new Buffer([
            255,
            85,
            5,
            sensorIdx,
            this.actionTypes.GET,
            device,
            port,
            10,
        ]);
    } else if (device == this.sensorTypes.LCD || device == this.sensorTypes.LCD_COMMAND) {
        buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, port[0], port[1], 10]);
    } else if (device == this.sensorTypes.BLE_READ) {
        buffer = new Buffer([255, 85, 5, sensorIdx, this.actionTypes.GET, device, port, 10]);
    } else {
        value = new Buffer(2);
        value.writeInt16LE(data);
        buffer = new Buffer([
            255,
            85,
            7,
            sensorIdx,
            this.actionTypes.GET,
            device,
            port,
            10,
        ]);
        buffer = Buffer.concat([buffer, value, dummy]);
    }
    sensorIdx++;
    if (sensorIdx > 254) {
        sensorIdx = 0;
    }

    return buffer;
};

//0xff 0x55 0x6 0x0 0x1 0xa 0x9 0x0 0x0 0xa
Module.prototype.makeOutputBuffer = function(device, port, data) {
    let buffer;
    const value = new Buffer(2);
    const dummy = new Buffer([10]);

    const text0 = new Buffer(2);
    const text1 = new Buffer(2);
    const text2 = new Buffer(2);
    const text3 = new Buffer(2);
    const text4 = new Buffer(2);
    const text5 = new Buffer(2);
    const text6 = new Buffer(2);
    const text7 = new Buffer(2);
    const text8 = new Buffer(2);
    const text9 = new Buffer(2);
    const text10 = new Buffer(2);
    const text11 = new Buffer(2);
    const text12 = new Buffer(2);
    const text13 = new Buffer(2);
    const text14 = new Buffer(2);
    const text15 = new Buffer(2);

    switch (device) {  
        case this.sensorTypes.ARM_XYZ:
            const value_x = new Buffer(2);
            const value_y = new Buffer(2);
            const value_z = new Buffer(2);
            value_x.writeInt16LE(data.value_x);
            value_y.writeInt16LE(data.value_y);
            value_z.writeInt16LE(data.value_z);
            buffer = new Buffer([
                255,
                85,
                10,
                sensorIdx,
                this.actionTypes.SET,
                device,
                port,
            ]);
            buffer = Buffer.concat([buffer, value_x,value_y,value_z, dummy]);
            break;
        case this.sensorTypes.ARM_WG:
            const value_w = new Buffer(2);
            const value_g = new Buffer(2);
            value_w.writeInt16LE(data.value_w);
            value_g.writeInt16LE(data.value_g);
            buffer = new Buffer([
                255,
                85,
                8,
                sensorIdx,
                this.actionTypes.SET,
                device,
                port,
            ]);
            buffer = Buffer.concat([buffer, value_w,value_g, dummy]);
            break;
        case this.sensorTypes.SERVO_PIN:
        case this.sensorTypes.DIGITAL:
        case this.sensorTypes.PWM: {
            value.writeInt16LE(data);
            buffer = new Buffer([
                255,
                85,
                6,
                sensorIdx,
                this.actionTypes.SET,
                device,
                port,
            ]);
            buffer = Buffer.concat([buffer, value, dummy]);
            break;
        }
        case this.sensorTypes.TONE: {
            const time = new Buffer(2);
            if ($.isPlainObject(data)) {
                value.writeInt16LE(data.value);
                time.writeInt16LE(data.duration);
            } else {
                value.writeInt16LE(0);
                time.writeInt16LE(0);
            }
            buffer = new Buffer([
                255,
                85,
                8,
                sensorIdx,
                this.actionTypes.SET,
                device,
                port,
            ]);
            buffer = Buffer.concat([buffer, value, time, dummy]);
            break;
        }
        case this.sensorTypes.LCD: {
            //console.log("LCD");

            const line = new Buffer(2);
            const column = new Buffer(2);

            if ($.isPlainObject(data)) {
                line.writeInt16LE(data.line);
                column.writeInt16LE(data.column);
            } else {
                line.writeInt16LE(0);
                column.writeInt16LE(0);
            }
            //if (true) {
            if ($.isPlainObject(data)) {
                text0.writeInt16LE(data.text0);
                text1.writeInt16LE(data.text1);
                text2.writeInt16LE(data.text2);
                text3.writeInt16LE(data.text3);
                text4.writeInt16LE(data.text4);
                text5.writeInt16LE(data.text5);
                text6.writeInt16LE(data.text6);
                text7.writeInt16LE(data.text7);
                text8.writeInt16LE(data.text8);
                text9.writeInt16LE(data.text9);
                text10.writeInt16LE(data.text10);
                text11.writeInt16LE(data.text11);
                text12.writeInt16LE(data.text12);
                text13.writeInt16LE(data.text13);
                text14.writeInt16LE(data.text14);
                text15.writeInt16LE(data.text15);
            } else {
                text0.writeInt16LE(0);
                text1.writeInt16LE(0);
                text2.writeInt16LE(0);
                text3.writeInt16LE(0);
                text4.writeInt16LE(0);
                text5.writeInt16LE(0);
                text6.writeInt16LE(0);
                text7.writeInt16LE(0);
                text8.writeInt16LE(0);
                text9.writeInt16LE(0);
                text10.writeInt16LE(0);
                text11.writeInt16LE(0);
                text12.writeInt16LE(0);
                text13.writeInt16LE(0);
                text14.writeInt16LE(0);
                text15.writeInt16LE(0);
            }


            //buffer = new Buffer([255, 85, 8, sensorIdx, this.actionTypes.SET, device, port]);
            //buffer = Buffer.concat([buffer, line, column, dummy]);

            buffer = new Buffer([255, 85, 40, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, line, column, text0, text1, text2, text3, text4, text5, text6, text7, text8, text9, text10, text11, text12, text13, text14, text15, dummy]);

            //console.log(buffer);

            break;
        }
        case this.sensorTypes.LCD_COMMAND: {
            //console.log("LCD_COMMAND");


            const command = new Buffer(2);
            if ($.isPlainObject(data)) {
                value.writeInt16LE(data.value);
            } else {
                value.writeInt16LE(0);
            }

            if ($.isPlainObject(data)) {
                command.writeInt16LE(data.command);
            } else {
                command.writeInt16LE(0);
            }


            buffer = new Buffer([255, 85, 7, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, value, command, dummy]);


            //console.log(buffer);

            break;
        }
        case this.sensorTypes.BLE_WRITE: {
            //console.log("BLE_WRITE");

            //if (true) {
            if ($.isPlainObject(data)) {
                text0.writeInt16LE(data.text0);
                text1.writeInt16LE(data.text1);
                text2.writeInt16LE(data.text2);
                text3.writeInt16LE(data.text3);
                text4.writeInt16LE(data.text4);
                text5.writeInt16LE(data.text5);
                text6.writeInt16LE(data.text6);
                text7.writeInt16LE(data.text7);
                text8.writeInt16LE(data.text8);
                text9.writeInt16LE(data.text9);
                text10.writeInt16LE(data.text10);
                text11.writeInt16LE(data.text11);
                text12.writeInt16LE(data.text12);
                text13.writeInt16LE(data.text13);
                text14.writeInt16LE(data.text14);
                text15.writeInt16LE(data.text15);
            } else {
                text0.writeInt16LE(0);
                text1.writeInt16LE(0);
                text2.writeInt16LE(0);
                text3.writeInt16LE(0);
                text4.writeInt16LE(0);
                text5.writeInt16LE(0);
                text6.writeInt16LE(0);
                text7.writeInt16LE(0);
                text8.writeInt16LE(0);
                text9.writeInt16LE(0);
                text10.writeInt16LE(0);
                text11.writeInt16LE(0);
                text12.writeInt16LE(0);
                text13.writeInt16LE(0);
                text14.writeInt16LE(0);
                text15.writeInt16LE(0);
            }

            //buffer = new Buffer([255, 85, 8, sensorIdx, this.actionTypes.SET, device, port]);
            //buffer = Buffer.concat([buffer, line, column, dummy]);

            buffer = new Buffer([255, 85, 36, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, text0, text1, text2, text3, text4, text5, text6, text7, text8, text9, text10, text11, text12, text13, text14, text15, dummy]);

            //console.log(buffer);

            break;
        }
    }

    return buffer;
};

Module.prototype.getDataByBuffer = function(buffer) {
    const datas = [];
    let lastIndex = 0;
    buffer.forEach((value, idx) => {
        if (value == 13 && buffer[idx + 1] == 10) {
            datas.push(buffer.subarray(lastIndex, idx));
            lastIndex = idx + 2;
        }
    });
    //console.log(datas);
    return datas;
};

Module.prototype.disconnect = function(connect) {
    const self = this;
    //console.log('disconnected');
    connect.close();
    if (self.sp) {
        delete self.sp;
    }
};

Module.prototype.reset = function() {
    //console.log('reset');
    this.lastTime = 0;
    this.lastSendTime = 0;

    this.sensorData.PULSEIN = {};
};

module.exports = new Module();
