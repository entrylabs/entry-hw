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
        OLED: 241,
        COM: 242
    }

    this.actionTypes = {
        GET: 1,
        SET: 2,
        RESET: 3
    };

    this.sensorValueSize = {
        FLOAT: 2,
        SHORT: 3
    }

    this.digitalPortTimeList = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    //this.digitalPortTimeList = [0, 0, 0, 0, 0, 0, 0, 0];

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
            '13': 0
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
        PULSEIN: {
        },
        TIMER: 0,
    }

    this.defaultOutput = {
    }

    this.recentCheckData = {

    }

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
    this.sp = sp;
};

// Module.prototype.lostController = function () {};

Module.prototype.requestInitialData = function() {
    return this.makeSensorReadBuffer(this.sensorTypes.ANALOG, 0);
};

Module.prototype.checkInitialData = function(data, config) {
    return true;
    // 이후에 체크 로직 개선되면 처리
    // var datas = this.getDataByBuffer(data);
    // var isValidData = datas.some(function (data) {
    //     return (data.length > 4 && data[0] === 255 && data[1] === 85);
    // });
    // return isValidData;
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

Module.prototype.requestRemoteData = function(handler) {
    var self = this;
    if(!self.sensorData) {
        return;
    }
    Object.keys(this.sensorData).forEach(function (key) {
        if(self.sensorData[key] != undefined) {
            handler.write(key, self.sensorData[key]);
			if (key == "DIGITAL")
			{
				var dObj = self.sensorData["DIGITAL"];
				//console.log("send : sensorData = " + dObj[6]);
            }
            
        }
    })
};

Module.prototype.handleRemoteData = function(handler) {
    var self = this;
    var getDatas = handler.read('GET');
    var setDatas = handler.read('SET') || this.defaultOutput;
    var time = handler.read('TIME');
    var buffer = new Buffer([]);

    if(getDatas) {
        var keys = Object.keys(getDatas);
        keys.forEach(function(key) {
            var isSend = false;
            var dataObj = getDatas[key];
            if(typeof dataObj.port === 'string' || typeof dataObj.port === 'number') {
                var time = self.digitalPortTimeList[dataObj.port];
                if(dataObj.time > time) {
                    isSend = true;
                    self.digitalPortTimeList[dataObj.port] = dataObj.time;
                }
            } else if(Array.isArray(dataObj.port)){
                isSend = dataObj.port.every(function(port) {
                    var time = self.digitalPortTimeList[port];
                    return dataObj.time > time;
                });

                if(isSend) {
                    dataObj.port.forEach(function(port) {
                        self.digitalPortTimeList[port] = dataObj.time;
                    });
                }
            }

            if(isSend) {
                if(!self.isRecentData(dataObj.port, key, dataObj.data)) {
                    self.recentCheckData[dataObj.port] = {
                        type: key,
                        data: dataObj.data
                    }
                    buffer = Buffer.concat([buffer, self.makeSensorReadBuffer(key, dataObj.port, dataObj.data)]);
                }
            }
        });        
    }

    if(setDatas) {
        var setKeys = Object.keys(setDatas);
        setKeys.forEach(function (port) {
            var data = setDatas[port];
            if(data) {
                if(self.digitalPortTimeList[port] < data.time) {
                    self.digitalPortTimeList[port] = data.time;

                    if(!self.isRecentData(port, data.type, data.data)) {
                        self.recentCheckData[port] = {
                            type: data.type,
                            data: data.data
                        }
                        buffer = Buffer.concat([buffer, self.makeOutputBuffer(data.type, port, data.data)]);
                    }
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
    /*    
    if(type == this.sensorTypes.ULTRASONIC) 
    {
        isRecent = false;
        return isRecent;
    }
    */
    if(type == this.sensorTypes.COM) 
    {
        isRecent = false;
        return isRecent;
    }

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

/*
ff 55 idx size data a
*/
Module.prototype.handleLocalData = function(data) {
    var self = this;
    var datas = this.getDataByBuffer(data);

    datas.forEach(function (data) {
        if(data.length <= 4) {// || data[0] === 255 && data[1] === 86 ) {
            return;        
        }

        if(data[0] === 255 && data[1] === 85) {
            self.originParsing(data);
        } else if (data[0] === 255 && data[1] === 86) {
            self.kParsing(data);
        } else {
            return;
        }
        
    });

    
};


/* Original Parsing FF 55 ~ */
Module.prototype.originParsing = function(data) {
	var self = this;
    var readData = data.subarray(2, data.length);      
    var value;
    switch(readData[0]) {
        case self.sensorValueSize.FLOAT: {
            value = new Buffer(readData.subarray(1, 5)).readFloatLE();
            value = Math.round(value * 100) / 100;                    
            break;
        }
        case self.sensorValueSize.SHORT: {
            value = new Buffer(readData.subarray(1, 3)).readInt16LE();
            break;
        }
        default: {
            value = 0;
            break;
        }
    }

    var type = readData[readData.length - 1];
    var port = readData[readData.length - 2];

    switch(type) {
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
        default: {
            break;
        }
    }
};

/* K-Board Parsing FF 56 ~ */
Module.prototype.kParsing = function(data) {
    var self = this;
	var readData = data.subarray(2, data.length);    
	var value;
	
	
	
	for(var i = 0; i<8; i++) {
		if(bit_test(readData[0], i))
		{
		    self.sensorData.DIGITAL[i + 2] = 1;   			
		} else {
		    self.sensorData.DIGITAL[i + 2] = 0;   			
		}
	}

	var index = 0;
	for(var i = 1; i<19; i = i + 2){
		value = new Buffer(readData.subarray(i, i+2)).readInt16LE();
        value = Math.round(value * 100) / 100;   

		if(	value > 1023 || value < 0)
			value = 0;
		
		if(index != 8)
		{
            if(index == 0)
            {
                if((1023 - (value * 1.72)) > 0)
                    self.sensorData.ANALOG[index] = parseInt(Math.abs(1023 - (value * 1.72)));
                else
                self.sensorData.ANALOG[index] = 0;	
            }
            else
                self.sensorData.ANALOG[index] = value;   			    
			//console.log("self.sensorData.ANALOG" + index + " = " + self.sensorData.ANALOG[index]);
		} else	{
			self.sensorData.ULTRASONIC = value;   			
			//console.log("self.sensorData.ULTRASONIC" + index + " = " + self.sensorData.ULTRASONIC);
		}

		//console.log("value=" + value);

		index = index + 1;
	}
	

	
    
};

function bit_test(num, bit){
    return ((num>>bit) % 2 != 0)
}

/*
ff 55 len idx action device port  slot  data a
0  1  2   3   4      5      6     7     8
*/

Module.prototype.makeSensorReadBuffer = function(device, port, data) {
    var buffer;
    var dummy = new Buffer([10]);
    if(device == this.sensorTypes.ULTRASONIC) {
        buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, port[0], port[1], 10]);
    } else if(!data) {
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

//0xff 0x55 0x6 0x0 0x1 0xa 0x9 0x0 0x0 0xa
Module.prototype.makeOutputBuffer = function(device, port, data) {
    var buffer;
    var value = new Buffer(2);
    var dummy = new Buffer([10]);
    switch(device) {
        case this.sensorTypes.SERVO_PIN:
        case this.sensorTypes.DIGITAL:
        case this.sensorTypes.PWM: {
            value.writeInt16LE(data);
            buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, value, dummy]);
            console.log(buffer);
            break;
        }
        case this.sensorTypes.TONE: {
            var time = new Buffer(2);
            if($.isPlainObject(data)) {
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
        case this.sensorTypes.TONE: {
        }
        case this.sensorTypes.OLED: {
            var arr = [];
            var i;
           data = data.toString();

            for(i=0; i<data.length; i++)
            {
                arr[i] = data.charCodeAt(i);
                //console.log(arr[i]);
            }
            var msgLength = data.length + 4;
            buffer = new Buffer([255, 85, msgLength, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, Buffer.from(arr), dummy]);
            break;
        }
        case this.sensorTypes.COM: {
            value.writeInt16LE(data);
            buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, value, dummy]);
            break;
        }
    }

    return buffer;
};

Module.prototype.getDataByBuffer = function(buffer) {
    var datas = [];
    var lastIndex = 0;
	var tempData;
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

     this.sensorData.PULSEIN = {
    }
};

module.exports = new Module();
