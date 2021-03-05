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
        READ_BLUETOOTH: 9,
        WRITE_BLUETOOTH: 10,
        LCD: 11,
        DHT : 12,
        //RGBLED: 12,
        DCMOTOR: 13,
        OLED: 14,
        PIR : 15,
        FND : 16,   
    };
    
    this.actionTypes = {
        GET: 1,
        SET: 2,
        MODULE: 3,
        RESET: 4,
    };

    this.sensorValueSize = {
        FLOAT: 2,
        SHORT: 3,
        STRING: 4,
        FLOATEXT:6,
    };

    this.digitalPortTimeList = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

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
        },
        ANALOG: {
            '0': 0,
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0,
        },
        PULSEIN: {},
        TIMER: 0,
        READ_BLUETOOTH: 0,
        DHT: 0,                 // DHT Added
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
};

Module.prototype.setSerialPort = function(sp) {
    const self = this;
    this.sp = sp;
};

Module.prototype.requestInitialData = function() {
    return true;
};


Module.prototype.checkInitialData = function(data, config) {
    return true;
};

Module.prototype.afterConnect = function(that, cb) {
    that.connected = true;
    if (cb) {
        cb('connected');
    }
};

Module.prototype.validateLocalData = function(data) {
    return true;
};

Module.prototype.requestRemoteData = function(handler) {
    // 디바이스에서 데이터를 받아온 후, 브라우저로 데이터를 보내기 위해 호출되는 로직. handler 를 세팅하는 것으로 값을 보낼 수 있다.
    // handler.write(key, value) 로 세팅한 값은 Entry.hw.portData 에서 받아볼 수 있다.
    const self = this;
    if (!self.sensorData) {
        return;
    }
    Object.keys(this.sensorData).forEach((key) => {
        if (self.sensorData[key] != undefined) {
            handler.write(key, self.sensorData[key]);
        }
    });
};

// Because there are no testino hw code, digitalPin Module wasn't available.
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
            if (typeof dataObj.port === 'string' || typeof dataObj.port === 'number') {
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
                // buffer = Buffer.concat([buffer, self.makeSensorReadBuffer(key, dataObj.port, dataObj.data)]);
                if (!self.isRecentData(dataObj.port, key, dataObj.data)) {
                    self.recentCheckData[dataObj.port] = {
                        type: key,
                        data: dataObj.data,
                    };

                    buffer = Buffer.concat([buffer, self.makeSensorReadBuffer(key, dataObj.port, dataObj.data)]);
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
                        buffer = Buffer.concat([buffer, self.makeOutputBuffer(data.type, port, data.data)]);
                    }
                }
            }
        });
    }

    // send data to device
    if (buffer.length) {
        this.sendBuffers.push(buffer);
    }

    // Anyway, Data was sent to Device, dosen't matter whether set or get data.
};

Module.prototype.isRecentData = function(port, type, data) {
    let isRecent = false;

    if (port in this.recentCheckData) {
        if (type != this.sensorTypes.TONE && this.recentCheckData[port].type === type && this.recentCheckData[port].data === data) {
            isRecent = true;
        }
    }

    return isRecent;
};

Module.prototype.requestLocalData = function() {
    const self = this;
    if (!this.isDraing && this.sendBuffers.length > 0) {
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
    //  unit from device data processing
    datas.forEach((data) => {
        if (data.length <= 4 || data[0] !== 255 || data[1] !== 85) {
            return;
        }
        const readData = data.subarray(2, data.length);
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
            case self.sensorValueSize.FLOATEXT: {
                value = new Buffer(readData.subarray(1, 9)).readFloatLE();
                value = Math.round(value * 100) / 100;
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
                self.sensorData.DIGITAL[port] = value;
                break;
            }
            case self.sensorTypes.ANALOG: {
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
            case self.sensorTypes.READ_BLUETOOTH: {
                self.sensorData.READ_BLUETOOTH = value;
                break;
            }
            case self.sensorTypes.DHT: {
                self.sensorData.DHT = value;
                break;
                // DHT SensorData-Type Added By Remoted 2021-02-25
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
// key port data 
Module.prototype.makeSensorReadBuffer = function(device, port, data) {
    let buffer;
    let value;
    const dummy = new Buffer([10]);
    if ((device == this.sensorTypes.DIGITAL) || (device == this.sensorTypes.DHT)) {
        // data  PullDown 0 or Pullup 2
        if (!data) {
            buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, port, 0, 10]);
        } else {
            buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, port, data, 10]);
        }
    } else if (device == this.sensorTypes.ANALOG) {
        // data  PullDown 0 or Pullup 2
        if (!data) {
            buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, port, 0, 10]);
        } else {
            buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, port, data, 10]);
        }
    } else if (device == this.sensorTypes.ULTRASONIC) {
        buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, port[0], port[1], 10]);
    } else if (device == this.sensorTypes.READ_BLUETOOTH) {
        buffer = new Buffer([255, 85, 5, sensorIdx, this.actionTypes.GET, device, port, 10]);
    } else {
        value = new Buffer(2);
        value.writeInt16LE(data);
        buffer = new Buffer([255, 85, 7, sensorIdx, this.actionTypes.GET, device, port, 10]);
        buffer = Buffer.concat([buffer, value, dummy]);
    }
    sensorIdx++;
    if (sensorIdx > 254) {
        sensorIdx = 0;
    }

    return buffer;
};

// 255 85   36  0   1   10  9   0    0  10
//0xff 0x55 0x6 0x0 0x1 0xa 0x9 0x0 0x0 0xa
// data.type(device), port, data
Module.prototype.makeOutputBuffer = function(device, port, data) {
    let buffer;
    const value = new Buffer(2);
    const dummy = new Buffer([10]);
    switch (device) {
        case this.sensorTypes.SERVO_PIN:
        case this.sensorTypes.DIGITAL:
        case this.sensorTypes.PWM: {
            value.writeInt16LE(data);
            buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, value, dummy]);
            break;
        }
        case this.sensorTypes.RGBLED: {
            const redValue = new Buffer(2);
            const greenValue = new Buffer(2);
            const blueValue = new Buffer(2);
            if ($.isPlainObject(data)) {
                redValue.writeInt16LE(data.redValue);
                greenValue.writeInt16LE(data.greenValue);
                blueValue.writeInt16LE(data.blueValue);
            } else {
                redValue.writeInt16LE(0);
                greenValue.writeInt16LE(0);
                blueValue.writeInt16LE(0);
            }
            buffer = new Buffer([255, 85, 10, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, redValue, greenValue, blueValue, dummy]);
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
            buffer = new Buffer([255, 85, 8, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, value, time, dummy]);
            break;
        }
        case this.sensorTypes.DCMOTOR: {
            const directionPort = new Buffer(2);
            const speedPort = new Buffer(2);
            const directionValue = new Buffer(2);
            const speedValue = new Buffer(2);
            if ($.isPlainObject(data)) {
                directionPort.writeInt16LE(data.port0);
                speedPort.writeInt16LE(data.port1);
                directionValue.writeInt16LE(data.value0);
                speedValue.writeInt16LE(data.value1);
            } else {
                directionPort.writeInt16LE(0);
                speedPort.writeInt16LE(0);
                directionValue.writeInt16LE(0);
                speedValue.writeInt16LE(0);
            }
            buffer = new Buffer([255, 85, 12, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, directionPort, speedPort, directionValue, speedValue, dummy]);
            break;    
        }
        case this.sensorTypes.WRITE_BLUETOOTH:
        case this.sensorTypes.LCD: {
            const text0 = Buffer.alloc(2);
            const text1 = Buffer.alloc(2);
            const text2 = Buffer.alloc(2);
            const text3 = Buffer.alloc(2);
            const text4 = Buffer.alloc(2);
            const text5 = Buffer.alloc(2);
            const text6 = Buffer.alloc(2);
            const text7 = Buffer.alloc(2);
            const text8 = Buffer.alloc(2);
            const text9 = Buffer.alloc(2);
            const text10 = Buffer.alloc(2);
            const text11 = Buffer.alloc(2);
            const text12 = Buffer.alloc(2);
            const text13 = Buffer.alloc(2);
            const text14 = Buffer.alloc(2);
            const text15 = Buffer.alloc(2);
            const displayRow = Buffer.alloc(2);
            const displayCol = Buffer.alloc(2);
            const lcdBlockIndex = Buffer.alloc(2);

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
                displayRow.writeInt16LE(data.displayRow);
                displayCol.writeInt16LE(data.displayCol);
                lcdBlockIndex.writeInt16LE(data.block_index);
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
                displayRow.writeInt16LE(0);
                displayCol.writeInt16LE(0);
                lcdBlockIndex.writeInt16LE(0);
            }

            /* 
            Only device address value need to set.
            Writed By Remoted 2020-12-17
            Row and Col variable added for using new block structure.
            Writed By Remoted 2021-03-01
            */
            buffer = Buffer.from([255, 85, 36, sensorIdx, this.actionTypes.MODULE, device, port]);
            buffer = Buffer.concat([buffer, lcdBlockIndex, displayRow, displayCol, text0, text1, text2, text3, text4, text5, text6, text7, text8, text9, text10, text11, text12, text13, text14, text15, dummy]);
            break;
        }
        
        case this.sensorTypes.OLED: {
            const coodinateX = new Buffer(2);
            const coodinateY = new Buffer(2);
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
            if ($.isPlainObject(data)) {
                coodinateX.writeInt16LE(data.value0);
                coodinateY.writeInt16LE(data.value1);
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
                coodinateX.writeInt16LE(0);
                coodinateY.writeInt16LE(0);
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
            buffer = new Buffer([255, 85, 40, sensorIdx, this.actionTypes.MODULE, device, port]);
            buffer = Buffer.concat([buffer, coodinateX, coodinateY, text0, text1, text2, text3, text4, text5, text6, text7, text8, text9, text10, text11, text12, text13, text14, text15, dummy]);

            break;
        }
        case this.sensorTypes.FND: {
            const fndClk = Buffer.alloc(2);
            const fndDio = Buffer.alloc(2);            
            const fndBrightnessLev =  Buffer.alloc(2);
            const fndOnOff =  Buffer.alloc(2);
            const fndBlockIndex = Buffer.alloc(2);
            const fndDelayMs = Buffer.alloc(2);
            const fndDisplayStrLength = Buffer.alloc(2);
            const fndDisplayStr0 = Buffer.alloc(2);    
            const fndDisplayStr1 = Buffer.alloc(2);
            const fndDisplayStr2 = Buffer.alloc(2);
            const fndDisplayStr3 = Buffer.alloc(2);

            if ($.isPlainObject(data)) {
                fndClk.writeInt16LE(data.clk_pin);
                fndDio.writeInt16LE(data.dio_pin);
                // FND Init Block Area Above

                fndBrightnessLev.writeInt16LE(data.level_val);
                fndBlockIndex.writeInt16LE(data.block_index);                
                // FND Display Block Area Above

                fndOnOff.writeInt16LE(data.onoff);                
                fndDelayMs.writeInt16LE(data.delay_ms);

                fndDisplayStrLength.writeInt16LE(data.str_length);
                fndDisplayStr0.writeInt16LE(data.data_0);
                fndDisplayStr1.writeInt16LE(data.data_1);
                fndDisplayStr2.writeInt16LE(data.data_2);
                fndDisplayStr3.writeInt16LE(data.data_3);
            } else {
                fndClk.writeInt16LE(0);
                fndDio.writeInt16LE(0);    
                // FND Init Block Area Above   

                fndBrightnessLev.writeInt16LE(0);
                fndBlockIndex.writeInt16LE(0);
                // FND Display Block Area Above

                fndOnOff.writeInt16LE(0);            
                fndDelayMs.writeInt16LE(0);         

                fndDisplayStrLength.writeInt16LE(0);
                fndDisplayStr0.writeInt16LE(0);
                fndDisplayStr1.writeInt16LE(0);
                fndDisplayStr2.writeInt16LE(0);
                fndDisplayStr3.writeInt16LE(0);        
            }

            buffer = Buffer.from([255, 85, 26, sensorIdx, this.actionTypes.MODULE, device, port]);
            buffer = Buffer.concat([buffer, fndBlockIndex, fndClk, fndDio, fndBrightnessLev, fndOnOff, fndDisplayStrLength, fndDisplayStr0, fndDisplayStr1, fndDisplayStr2, fndDisplayStr3, fndDelayMs, dummy]);
            break;  
        }
        case this.sensorTypes.DHT: { 
            const dhtPin = Buffer.alloc(2);
            const dhtVerInfo = Buffer.alloc(2);
            const dhtBlockIndex = Buffer.alloc(2);
            const dhtTempMode = Buffer.alloc(2);

            if ($.isPlainObject(data)) {
                dhtPin.writeInt16LE(data.dht_pin);
                dhtVerInfo.writeInt16LE(data.ver_info);
                dhtBlockIndex.writeInt16LE(data.dht_block_index);

                dhtTempMode.writeInt16LE(data.tempMode);
            } else {
                dhtPin.writeInt16LE(0);
                dhtVerInfo.writeInt16LE(0);
                dhtBlockIndex.writeInt16LE(0);    

                dhtTempMode.writeInt16LE(0);      
            }

            buffer = Buffer.from([255, 85, 12, sensorIdx, this.actionTypes.MODULE, device, port]);
            buffer = Buffer.concat([buffer, dhtBlockIndex, dhtPin, dhtVerInfo, dhtTempMode, dummy]);
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

    return datas;
};

Module.prototype.disconnect = function(connect) {
    const self = this;
    connect.close();
    if (self.sp) {
        delete self.sp;
    }
};

Module.prototype.reset = function() {
    this.lastTime = 0;
    this.lastSendTime = 0;

    this.sensorData.PULSEIN = {};
};

module.exports = new Module();
