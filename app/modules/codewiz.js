'use strict';

function Module() {
    this.sp = null;
    this.sensorTypes = {

        BUZZER:1,
        NEOPIXEL:2,
        OLED:3,
        DIGITAL_OUTPUT:4,

    };
    this.defaultSensorList = [
        'SOUND','LIGHT','DIST','HALL',
        "touchPin_13", "touchPin_14", "touchPin_15",
		"touchPin_27", "touchPin_32", "touchPin_33", 
		"switchButton_4", "switchButton_26",
        'GYRO_X', 'GYRO_Y', 'GYRO_Z', "tempSensor",
    ]
    this.actionTypes = {
        GET: 1,
        SET: 2,
        RESET: 3,
        READ:1,
        RUN:0
    };

    this.sensorValueSize = {
        SENSOR_TYPE1: 0,
        SENSOR_TYPE2: 1,
        FLOAT: 2,
        SHORT: 3,
    };

    this.digitalPortTimeList = [
        0, 0, 0, 0, 0, 
        0, 0, 0, 0, 0, 
        0, 0, 0, 0, 0, 
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
    ];

    this.sensorData = {
        SOUND:0,
        LIGHT:0,
        DIST:0,
        HALL:0,
        touchPin_13:0,
        touchPin_14:0,
        touchPin_15:0,
        touchPin_27:0,
        touchPin_32:0,
        touchPin_33:0,
        switchButton_4:0,
        switchButton_26:0,
        tempSensor:0.0,
        GYRO_X:0,
        GYRO_Y:0,
        GYRO_Z:0,
        
        TIMER: 0,
        //ISRUN:1,
    };

    this.defaultOutput = {
    };

    this.recentCheckData = {
    };

    this.sendBuffers = [];

    this.lastTime = 0;
    this.lastSendTime = 0;
    this.isDraing = false;
}

var sensorIdx = 0;

Module.prototype.init = function(handler, config) {
};

Module.prototype.setSerialPort = function (sp) {
    var self = this;
    //"select_com_port": true,
    //if(!this.sp) {
        this.sp = sp;
        sp.set({dtr: false,rts:true});
        sp.set({dtr: false,rts:false});
    //}
};

Module.prototype.requestInitialData = function(sp) {
    //if(!this.sp) {
        this.sp = sp;
        sp.set({dtr: false,rts:true});
        sp.set({dtr: false,rts:false});
    //}
    return true;
    //return this.makeSensorReadBuffer(this.sensorTypes.ANALOG, 0);
};

Module.prototype.checkInitialData = function(data, config) {
    return true;
};

Module.prototype.afterConnect = function(that, cb) {
    that.connected = true;
    if(cb) {
        cb('connected');
    }
};

Module.prototype.validateLocalData = function(data) {
    return true;
};

Module.prototype.lostController = function(self, cb) {
    // console.log(this.sp);
};

Module.prototype.requestRemoteData = function(handler) {
    var self = this;
    if(!self.sensorData) {
        return;
    }
    Object.keys(this.sensorData).forEach(function (key) {
        if(self.sensorData[key] != undefined) {
            handler.write(key, self.sensorData[key]);
        }
    });
};

Module.prototype.handleRemoteData = function(handler) {
    var self = this;
    var getDatas = handler.read('GET');
    var setDatas = handler.read('SET') || this.defaultOutput;
    var isReset = handler.read('RESET');
    var buffer = new Buffer([]);
    if(isReset) {
        // this.sp.set({dtr: false,rts:true});
        // this.sp.set({dtr: false,rts:false});
        this.sp.write([254,255,3,1,0]);
    }
    if(getDatas) {
        var keys = Object.keys(getDatas);
        keys.forEach(function(key) {
            //var isSend = false;
            var dataObj = getDatas[key];
            // if(typeof dataObj.port === 'string' || typeof dataObj.port === 'number') {
            //         isSend = true;
            // } 
            

            //if(isSend) {
                if(!self.isRecentData(dataObj.port, key, dataObj.data)) {
                    self.recentCheckData[dataObj.port] = {
                        type: key,
                        data: dataObj.data
                    }
                    buffer = Buffer.concat([buffer, self.makeSensorReadBuffer(key, dataObj.port, dataObj.data)]);
                }
            //}
        });
    }

    if(setDatas) {
        var setKeys = Object.keys(setDatas);
        setKeys.forEach(function (port) {   
            var data = setDatas[port];
            if(data) {

                    if(!self.isRecentData(port, data.type, data.value)) {
                        self.recentCheckData[port] = {
                            type: data.type,
                            data: data.value
                        }
                        buffer = Buffer.concat([buffer, self.makeOutputBuffer(data.type, port ,data.value)]);
                        //delete setDatas[port]
                    }
            }
        });
    }
    if(buffer.length) {
        this.sendBuffers.push(buffer);
    }
};

Module.prototype.isRecentData = function(port, type, data) {
    var isRecent = false;

    if(port in this.recentCheckData) {
        if(type != this.sensorTypes.TONE && this.recentCheckData[port].type === type && this.recentCheckData[port].data === data) {
            isRecent = true;
        }
    }

    return isRecent;
}

Module.prototype.requestLocalData = function() {
    var self = this;

    if(!this.isDraing && this.sendBuffers.length > 0) {
        this.isDraing = true;
        this.sp.write(this.sendBuffers.shift(), function () {
            if(self.sp) {
                self.sp.drain(function () {
                    self.isDraing = false;
                });
            }
        });
    }

    return null;
};
// Module.prototype.isOkSign = function(data) {
//     let isOk = true;
//     let chkVal = [255, 85, 2, 6]
//     for(let i=0; i<chkVal.length; ++i) {
//         if(data[i]!==chkVal[i]) {
//             isOk=false;
//             break;
//         }
//     }
//     return isOk;
// }
/*
ff 55 idx size data a
*/
Module.prototype.handleLocalData = function(data) {
    var self = this;
    var datas = this.getDataByBuffer(data);
    
    datas.forEach(function (data) {
        //let customFormat = false;
        // if(this.isOkSign(data)) {
        //     self.sensorData['ISRUN']=1;
        //     return;
        // }
        if(data.length <= 4 || data[0] !== 255 || data[1] !== 85) {
            return;
        }
        var readData = data.subarray(2, data.length);
        var value;
        switch(readData[0]) {
            case self.sensorValueSize.SENSOR_TYPE1: {
                for(let i=0; 2*i<readData.length; ++i) {
                    value = (readData[i*2 + 1]<<8) | readData[i*2 + 2];
                    if(i===2) {
                        if(value < 3000) {
                            self.sensorData['DIST'] = value;
                        }
                    } else if(i===3) {
                        self.sensorData[self.defaultSensorList[i]] = value-300;
                    } else {
                        self.sensorData[self.defaultSensorList[i]] = value;
                    }
                }

                return;
            }
            case self.sensorValueSize.SENSOR_TYPE2: {
                let _value;
                for (let i = 4; i < 4 + 8; ++i) {
                    _value = ((readData[1] >> (i - 4)) & 1);//===0? 0:1;
                    self.sensorData[self.defaultSensorList[i]]= _value;
                }
                for(let i=12; i<12+3; ++i) {
                    _value=readData[i-10];
                    if(_value <= 180) {
                        self.sensorData[self.defaultSensorList[i]]= _value-90;
                    }
                }
                //temperature
                _value = (readData[5] << 8) | readData[6];
                _value -= 400;
                _value /= 10.0;
                if (_value < 81) {
                    self.sensorData['tempSensor'] = _value;
                }
                return;
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
    var buffer;
    var dummy = new Buffer([10]);
    if(!data) {
        buffer = new Buffer([255, 85, 5, sensorIdx, this.actionTypes.GET, device, port, 10]);
    } else {
        value = new Buffer(2);
        value.writeInt16LE(data);
        buffer = new Buffer([255, 85, 7, sensorIdx, this.actionTypes.GET, device, port, 10]);
        buffer = Buffer.concat([buffer, value, dummy]);
    }
    sensorIdx++;
    if(sensorIdx > 254) {
        sensorIdx = 0;
    }

    return buffer;
};

Module.prototype.makeOutputBuffer = function(device, port, data) {
    var buffer;
    switch(device) {        
        case this.sensorTypes.BUZZER:{
            if ($.isPlainObject(data)) {
                let octave = new Buffer(1); 
                let note = new Buffer(1); 
                let beat = new Buffer(1);
                octave.writeUInt8(data.octave);
                note.writeUInt8(data.note);
                beat.writeUInt8(data.beat);

                buffer = new Buffer([254, 255, 6, this.actionTypes.RUN, device]);
                buffer = Buffer.concat([buffer, octave,note,beat]);
                //buffer = Buffer.concat([buffer, new Buffer(data)]);
                //this.sensorData['ISRUN']=0;
            }
            break;
        } // END BUZZER
        case this.sensorTypes.NEOPIXEL:{
            if ($.isPlainObject(data)) {
                let opcode = Number.parseInt(data.opcode);
                if(opcode === 0) {
                    buffer = new Buffer([
                        254, 255, 
                        4, this.actionTypes.RUN, device+opcode, Number.parseInt(data.value)
                    ]);
                } else if(opcode === 1) {
                    buffer = new Buffer([
                        254, 255, 
                        7, this.actionTypes.RUN, device+opcode, Number.parseInt(data.num),
                        Number.parseInt(data.value.r), Number.parseInt(data.value.g), Number.parseInt(data.value.b)
                    ]);
                }
                else if(opcode === 2) {
                    buffer = new Buffer([
                        254, 255, 
                        4, this.actionTypes.RUN, device+opcode, Number.parseInt(data.num)
                    ]);
                }
                else if(opcode === 3) {
                    buffer = new Buffer([
                        254, 255, 
                        6, this.actionTypes.RUN, device+opcode, 
                        Number.parseInt(data.value.r), Number.parseInt(data.value.g), Number.parseInt(data.value.b)
                    ]);
                }
                else if(opcode === 4) {
                    buffer = new Buffer([
                        254, 255, 
                        3, this.actionTypes.RUN, device+opcode
                    ]);
                }                
            }
            break;
        } // END NEOPIXEL
        case this.sensorTypes.OLED:{
            if ($.isPlainObject(data)) {
                let opcode = Number.parseInt(data.opcode);  // 0~16
                if(opcode === 0) {
                    buffer = new Buffer([
                        254, 255, 
                        3, this.actionTypes.RUN, 7+opcode
                    ]);
                } else if(opcode === 1) {
                    buffer = new Buffer([
                        254, 255, 
                        4, this.actionTypes.RUN, 7+opcode, Number.parseInt(data.isTrue)
                    ]);                   
                }
                else if(opcode === 2) {
                    buffer = new Buffer([
                        254, 255, 
                        4, this.actionTypes.RUN, 7+opcode, Number.parseInt(data.size)
                    ]);  
                }
                else if(opcode === 3) {
                    buffer = new Buffer([
                        254, 255, 
                        5, this.actionTypes.RUN, 7+opcode, Number.parseInt(data.x), Number.parseInt(data.y)
                    ]);  
                }
                else if(opcode === 4) {
                    let text = data.text;
                    // let arr = [254, 255, 3+text.length+1, this.actionTypes.RUN, 7+opcode]
                    // arr.push(text.length);
                    let arr = [254, 255, 3+text.length, this.actionTypes.RUN, 7+opcode]
                    for(let i=0; i<text.length; ++i) {
                        arr.push(text[i].charCodeAt());
                    }
                    buffer = new Buffer(arr); 
                }
                else if(opcode === 5) {
                    buffer = new Buffer([
                        254, 255, 
                        4, this.actionTypes.RUN, 7+opcode, Number.parseInt(data.isTrue)
                    ]);   
                }
                else if(opcode === 6) {
                    buffer = new Buffer([
                        254, 255, 
                        4, this.actionTypes.RUN, 7+opcode, Number.parseInt(data.c)
                    ]);  
                }
                else if(opcode === 7) {
                    buffer = new Buffer([
                        254, 255, 
                        5, this.actionTypes.RUN, 7+opcode, Number.parseInt(data.font), Number.parseInt(data.size)
                    ]);
                }
                else if(opcode === 8) {
                    buffer = new Buffer([
                        254, 255, 
                        6, this.actionTypes.RUN, 7+opcode, 
                        Number.parseInt(data.direction),
                        Number.parseInt(data.start),
                        Number.parseInt(data.end)
                    ]);
                }
                else if(opcode === 9) {
                    buffer = new Buffer([
                        254, 255, 
                        3, this.actionTypes.RUN, 7+opcode
                    ]);
                }
                else if(opcode === 10) {
                    buffer = new Buffer([
                        254, 255, 
                        6, this.actionTypes.RUN, 7+opcode, 
                        Number.parseInt(data.x),
                        Number.parseInt(data.y),
                        Number.parseInt(data.color)
                    ]);
                }
                else if(opcode === 11) {
                    buffer = new Buffer([
                        254, 255, 
                        8, this.actionTypes.RUN, 7+opcode, 
                        Number.parseInt(data.sx),
                        Number.parseInt(data.sy),
                        Number.parseInt(data.ex),
                        Number.parseInt(data.ey),
                        Number.parseInt(data.color)
                    ]);
                }
                else if(opcode === 12) {
                    buffer = new Buffer([
                        254, 255, 
                        7, this.actionTypes.RUN, 7+opcode, 
                        Number.parseInt(data.sx),
                        Number.parseInt(data.sy),
                        Number.parseInt(data.len),
                        Number.parseInt(data.color)
                    ]);
                }
                else if(opcode === 13) {
                    buffer = new Buffer([
                        254, 255, 
                        7, this.actionTypes.RUN, 7+opcode, 
                        Number.parseInt(data.sx),
                        Number.parseInt(data.sy),
                        Number.parseInt(data.len),
                        Number.parseInt(data.color)
                    ]);
                }
                else if(opcode === 14) {
                    buffer = new Buffer([
                        254, 255, 
                        9, this.actionTypes.RUN, 7+opcode, 
                        Number.parseInt(data.x),
                        Number.parseInt(data.y),
                        Number.parseInt(data.width),
                        Number.parseInt(data.height),
                        Number.parseInt(data.isFill),
                        Number.parseInt(data.color)
                    ]);
                }
                else if(opcode === 15) {
                    buffer = new Buffer([
                        254, 255, 
                        8, this.actionTypes.RUN, 7+opcode, 
                        Number.parseInt(data.x),
                        Number.parseInt(data.y),
                        Number.parseInt(data.rad),
                        Number.parseInt(data.isFill),
                        Number.parseInt(data.color)
                    ]);
                }
                else if(opcode === 16) {
                    buffer = new Buffer([
                        254, 255, 
                        11, this.actionTypes.RUN, 7+opcode, 
                        Number.parseInt(data.x1),
                        Number.parseInt(data.y1),
                        Number.parseInt(data.x2),
                        Number.parseInt(data.y2),
                        Number.parseInt(data.x3),
                        Number.parseInt(data.y3),
                        Number.parseInt(data.isFill),
                        Number.parseInt(data.color)
                    ]);
                }
            }
            break;
        } // END OLED
        case this.sensorTypes.DIGITAL_OUTPUT:{
            if ($.isPlainObject(data)) {
                let opcode = Number.parseInt(data.opcode);
                if(opcode === 0) {
                    buffer = new Buffer([
                        254, 255, 
                        3, this.actionTypes.RUN, 24+opcode
                    ]);
                } else if(opcode === 1) {
                    buffer = new Buffer([
                        254, 255, 
                        5, this.actionTypes.RUN, 24+opcode,
                        Number.parseInt(data.pin), Number.parseInt(data.output)
                    ]);
                }
                else if(opcode === 2) {
                    buffer = new Buffer([
                        254, 255, 
                        5, this.actionTypes.RUN, 24+opcode, 
                        Number.parseInt(data.pin), Number.parseInt(data.writeVal)
                    ]);
                }
            }
            break;
        } //END DIGITAL_OUTPUT 
    }

    return buffer;
};

Module.prototype.getDataByBuffer = function(buffer) {
    var datas = [];
    var lastIndex = 0;
    buffer.forEach(function (value, idx) {
        if(value == 13 && buffer[idx + 1] == 10) {
            datas.push(buffer.subarray(lastIndex, idx));
            lastIndex = idx + 2;
        }
    });

    return datas;
};

Module.prototype.disconnect = function(connect) {
    var self = this;
    connect.close();
    if(self.sp) {
        delete self.sp;
    }
};

Module.prototype.reset = function() {
    this.lastTime = 0;
    this.lastSendTime = 0;

};

module.exports = new Module();
