function Module()
{
    this.sp = null;
    this.sensorTypes = 
	{
        ALIVE: 0,
        DIGITAL: 1,
        ANALOG: 2,
        BUZZER: 3,
        SERVO: 4,
        TONE: 5,
        TEMP: 6,
        USONIC: 7,
        TIMER: 8,
        RD_BT: 9,
        WRT_BT: 10,
        RGBLED: 11,
        MOTOR: 12,
        LASER: 13,
    }

    this.actionTypes = 
	{
        GET: 1,
        SET: 2,
        RESET: 3,
		MODULE:4,
    };

    this.sensorValueSize = 
	{
        FLOAT: 2,
        SHORT: 3,
        STRING : 4
    }

    this.digitalPortTimeList = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    this.sensorData = 
	{
        USONIC: 
		{
            '0': 0,
            '1': 0,	
            '2': 0,
            '3': 0,						
		},
        DIGITAL: 
		{
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
        ANALOG: 
		{
            '0': 0,
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0,
        },
        TEMP: 
		{
            '0': 0,
            '1': 0,			
		},
        TIMER: 0,
        SERVO: 
		{
            '0': 0,
            '1': 0,	
            '2': 0,
            '3': 0,						
		},        
        RD_BT: 0
    }

    this.defaultOutput = {};

    this.recentCheckData = {};

    this.sendBuffers = [];

    this.lastTime = 0;
    this.lastSendTime = 0;
    this.isDraing = false;
}

var sensorIdx = 0;

//�ʿ�� Handler Data �ʱⰪ ����
Module.prototype.init = function(handler, config) 
{

};

// Serial Port ���� ���� ����
Module.prototype.setSerialPort = function (sp) 
{
    var self = this;
    this.sp = sp;
};

//�ʿ�� �������� Hardware�� ������ �ʱⰪ ����
Module.prototype.requestInitialData = function() 
{
    // return null;
    // MRT ���� �ڵ� ���� �� : �ּ� ó�� �� �ڻ� �ٸ� �߿������ ���� ���� ����
    return this.makeSensorReadBuffer(this.sensorTypes.ANALOG, 0);  
};
   
//�������� Hardware���������� Inital�������� Vaildation
Module.prototype.checkInitialData = function(data, config) 
{
    return true;
    // ���Ŀ� üũ ���� �����Ǹ� ó��
    // var datas = this.getDataByBuffer(data);
    // var isValidData = datas.some(function (data) {
    //     return (data.length > 4 && data[0] === 255 && data[1] === 85);
    // });
    // return isValidData;
};

Module.prototype.afterConnect = function(that, cb) 
{
    that.connected = true;
    if(cb) cb('connected');
};

// 1. Hardware���� ������ ��� �������� Vaildation
Module.prototype.validateLocalData = function(data) 
{
    return true;
};

// 2. getDataByBuffer
Module.prototype.getDataByBuffer = function(buffer) 
{
    var datas = [];
    var lastIndex = 0;
	
    buffer.forEach(function (value, idx) 
	{
        if(value == 13 && buffer[idx + 1] == 10) 
		{
            datas.push(buffer.subarray(lastIndex, idx));
            lastIndex = idx + 2;
        }
    });

    return datas;
};

/*
ff 55 idx size data a
*/
// 3. Hardware���� ������ ������ ����
Module.prototype.handleLocalData = function(data) 
{
    var self = this;
    var datas = this.getDataByBuffer(data);
	var count = 0;
	
    datas.forEach(function (data) 
	{
        if(data.length <= 4 || data[0] !== 255 || data[1] !== 85) return;                
		var readData = data.subarray(2, data.length);
		
        var type = readData[readData.length - 1];
        var port = readData[readData.length - 2];
		
        var value, value2;
        switch(readData[0]) {
            case self.sensorValueSize.FLOAT: 
			{
                value = new Buffer(readData.subarray(1, 5)).readFloatLE();
                value = Math.round(value * 100) / 100;      
            
				if(type === self.sensorTypes.TEMP)  // Add for TEMP Sensor
                {                  
                    value2 = new Buffer(readData.subarray(6, 10)).readFloatLE();                   
                    value2 = Math.round(value2 * 100) / 100;                    
                }				
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
	
        switch(type) {
            case self.sensorTypes.DIGITAL: {
                self.sensorData.DIGITAL[port] = value;	
                break;
            }
            case self.sensorTypes.ANALOG: {
                self.sensorData.ANALOG[port] = value;
                break;
            }
            case self.sensorTypes.TEMP: {
                self.sensorData.TEMP[0] = value;
                self.sensorData.TEMP[1] = value2;  
//             console.log("TEMP[0~1]: %s %s", value, value2);	           
                break;
            }			
            case self.sensorTypes.USONIC: {
                self.sensorData.USONIC[port] = value;		 	
                break;
            }
            case self.sensorTypes.SERVO: {
                self.sensorData.SERVO[port] = value;
//                console.log("port: %s value: %s", port, value);	             
                break;
            }			
            case self.sensorTypes.TIMER: {
                self.sensorData.TIMER = value;
                break;
            }
            case self.sensorTypes.RD_BT: {
                self.sensorData.RD_BT = value;
                break;
            }
            default: {
                break;
            }
        }
    });
};


// 4. ������ ���� ������ ����
Module.prototype.requestRemoteData = function(handler) 
{
    var self = this;
    if(!self.sensorData) return;
	
    Object.keys(this.sensorData).forEach(function (key) 
	{
        if(self.sensorData[key] != undefined) 
		{
            handler.write(key, self.sensorData[key]);           
        }
    })
};

// 5. �������� ������ ������ ����
Module.prototype.handleRemoteData = function(handler) 
{
    var self = this;
    var getDatas = handler.read('GET');
    var setDatas = handler.read('SET') || this.defaultOutput;
    var time = handler.read('TIME');
    var buffer = new Buffer([]);
				
    if(getDatas) 
	{			
        var keys = Object.keys(getDatas);
			
        keys.forEach(function(key) 
		{
            var isSend = false;
            var dataObj = getDatas[key];
            if(typeof dataObj.port === 'string' || typeof dataObj.port === 'number') 
			{
                var time = self.digitalPortTimeList[dataObj.port];
                if(dataObj.time > time) 
				{
                    isSend = true;
                    self.digitalPortTimeList[dataObj.port] = dataObj.time;
                }
            } 
			else if(Array.isArray(dataObj.port))
			{
                isSend = dataObj.port.every(function(port) 
				{
                    var time = self.digitalPortTimeList[port];
                    return dataObj.time > time;
                });

                if(isSend) 
				{
                    dataObj.port.forEach(function(port) 
					{
                        self.digitalPortTimeList[port] = dataObj.time;
                    });
                }
            }

            if(isSend) 
			{
                if(!self.isRecentData(dataObj.port, key, dataObj.data)) 
				{
                    self.recentCheckData[dataObj.port] = 
					{
                        type: key,
                        data: dataObj.data
                    }
                    buffer = Buffer.concat([buffer, self.makeSensorReadBuffer(key, dataObj.port, dataObj.data)]);						
                }
            }
        });        
    }

    if(setDatas) 
	{
        var setKeys = Object.keys(setDatas);
        setKeys.forEach(function (port) 
		{
            var data = setDatas[port];
            if(data) 
			{
                if(self.digitalPortTimeList[port] < data.time) 
				{
                    self.digitalPortTimeList[port] = data.time;

                    if(!self.isRecentData(port, data.type, data.data)) 
					{
                        self.recentCheckData[port] = 
						{
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

// 6. Hardware�� ���� ������ ����
Module.prototype.requestLocalData = function() 
{
    var self = this;
	
     if(!this.isDraing && this.sendBuffers.length > 0) 
	 {
        this.isDraing = true;
        this.sp.write(this.sendBuffers.shift(), function () 
		{
            if(self.sp) 
			{
                self.sp.drain(function () 
				{
                    self.isDraing = false;
                });
            }
        });        
    }

    return null;
};

Module.prototype.isRecentData = function(port, type, data) 
{
    var isRecent = false;
	
    if(port in this.recentCheckData) 
	{
        if(type != this.sensorTypes.TONE && this.recentCheckData[port].type === type && this.recentCheckData[port].data === data) 
		{
            isRecent = true;
        }
    }

    // Add for TEMP/USONIC/SERVO
    if ((type === '6')||(type === '7')||(type === '4')) isRecent = false;

    return isRecent;
}


/*
ff 55 len idx action device port  slot  data a
0  1  2   3   4      5      6     7     8
*/

Module.prototype.makeSensorReadBuffer = function(device, port, data) 
{
    var buffer;
    var dummy = new Buffer([10]);
	
    if(device == this.sensorTypes.USONIC) 
	{
        buffer = new Buffer([255, 85, 5, sensorIdx, this.actionTypes.GET, device, port, 10]);	
  //   console.log("%s %s %s %s", sensorIdx, this.actionTypes.GET, device, port);	
	}
    else if(device == this.sensorTypes.TEMP) 
	{
        buffer = new Buffer([255, 85, 5, sensorIdx, this.actionTypes.GET, device, port, 10]);    
//        console.log("GET: %s %s %s %s", sensorIdx, this.actionTypes.GET, device, port);	                
    } 
    else if(device == this.sensorTypes.SERVO) 
	{
        buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, port[0], port[1], 10]);	
//        console.log("GET: %s %s %s %s %s", sensorIdx, this.actionTypes.GET, device, port[0], port[1]);	        
    } 	
	else if(device == this.sensorTypes.RD_BT) 
	{
        buffer = new Buffer([255, 85, 5, sensorIdx, this.actionTypes.GET, device, port, 10]);	
    } 
	else if(!data) 
	{
        buffer = new Buffer([255, 85, 5, sensorIdx, this.actionTypes.GET, device, port, 10]);	
    } 
	else 
	{
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
Module.prototype.makeOutputBuffer = function(device, port, data) 
{
    var buffer;
    var value = new Buffer(2);
    var dummy = new Buffer([10]);
		
    switch(device) 
	{
        case this.sensorTypes.MOTOR:
				buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, device, port, data[0], data[1]]);
                buffer = Buffer.concat([buffer, dummy]);
    //            console.log("SET: %s %s %s %s %s %s", sensorIdx, this.actionTypes.SET, device, port, data[0], data[1]);	                   
				break;        
				
        case this.sensorTypes.SERVO:
				buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, device, port, data[0], data[1]]);
                buffer = Buffer.concat([buffer, dummy]);
//                console.log("SET: %s %s %s %s %s %s", sensorIdx, this.actionTypes.SET, device, port, data[0], data[1]);	                  
				break;        
				
		case this.sensorTypes.DIGITAL:
				value.writeInt16LE(data);
				buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, device, port]);
				buffer = Buffer.concat([buffer, value, dummy]);
				break;

		case this.sensorTypes.BUZZER: 
                buffer = new Buffer([255, 85, 5, sensorIdx, this.actionTypes.SET, device, port, data]);     
				buffer = Buffer.concat([buffer, dummy]);
				break;
            
        case this.sensorTypes.LASER: 
                buffer = new Buffer([255, 85, 5, sensorIdx, this.actionTypes.SET, device, port, data]);
//                console.log("SET: %s %s %s %s %s", sensorIdx, this.actionTypes.GET, device, port, data);	                   
                buffer = Buffer.concat([buffer, dummy]);                 
                break;

        case this.sensorTypes.RGBLED: 
				buffer = new Buffer([255, 85, 7, sensorIdx, this.actionTypes.SET, device, port, data.r, data.g, data.b]);
				buffer = Buffer.concat([buffer, dummy]);
				break;
                                
        case this.sensorTypes.TONE: 
				var time = new Buffer(2);
				if($.isPlainObject(data))
				{
					value.writeInt16LE(data.value);
					time.writeInt16LE(data.duration);
				} 
				else 
				{
					value.writeInt16LE(0);
					time.writeInt16LE(0);
				}
				buffer = new Buffer([255, 85, 8, sensorIdx, this.actionTypes.SET, device, port]);
				buffer = Buffer.concat([buffer, value, time, dummy]);
				break;

        case this.sensorTypes.WRT_BT:
				var text0 = new Buffer(2);
				var text1 = new Buffer(2);
				var text2 = new Buffer(2);
				var text3 = new Buffer(2);
				var text4 = new Buffer(2);
				var text5 = new Buffer(2);
				var text6 = new Buffer(2);
				var text7 = new Buffer(2);
				var text8 = new Buffer(2);
				var text9 = new Buffer(2);
				var text10 = new Buffer(2);
				var text11 = new Buffer(2);
				var text12 = new Buffer(2);
				var text13 = new Buffer(2);
				var text14 = new Buffer(2);
				var text15 = new Buffer(2);
				if($.isPlainObject(data))
				{
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
				} 
				else 
				{
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
				buffer = new Buffer([255, 85, 36, sensorIdx, this.actionTypes.MODULE, device, port]);
				buffer = Buffer.concat([buffer, text0, text1, text2, text3, text4, text5, text6, text7, text8, text9, text10,text11, text12, text13, text14, text15, dummy]);
				break;
    }
    return buffer;
};

Module.prototype.disconnect = function(connect) 
{
    var self = this;
	
    connect.close();
    if(self.sp) {
        delete self.sp;
    }
};

// ���� Connect ����� �� ����
Module.prototype.reset = function() 
{
    this.lastTime = 0;
    this.lastSendTime = 0;
};

module.exports = new Module();
