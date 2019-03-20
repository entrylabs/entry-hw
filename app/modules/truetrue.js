function Module() {
    this.sp = null;
    this.sensory = {
        L2: 0,
        L1: 0,
        R1: 0,
        R2: 0,
        ProxiLeft: 0,
        ProxiRight: 0,
        AccX: 0,
        AccY: 0,
        AccZ: 0,
        AccStatus: 0,
        BColorKey: 0,
        BColorRed: 0,
        BColorGreen: 0,
        BColorBlue: 0,
        FColorLeftKey: 0,
        FColorRightKey: 0,
    };

    this.setting = {
        singlemotor: 0x0a,
        dualmotor: 0x0a,
        colorled: 0x08,
        leds: 0x46,
        linetracer: 0x4c,
        leftWheel: 0,
        rightWheel: 0,
        melody: 0,
        duration: 0,
        redLED: 0,
        greenLED: 0,
        blueLED: 0,
        ledPort: 0,
        ledONOFF: 0,
    };

    this.recentCheckData = {};

    this.sendBuffers = [];

    this.lastTime = 0;
    this.lastSendTime = 0;
    this.isDraing = false;

    this.delaytime = 0;
    this.starttime = new Date().getTime();
}

var TrueTrue = {
    LEFT_2: 'L2',
    LEFT_1: 'L1',
    RIGHT_1: 'R1',
    RIGHT_2: 'R2',
    PROXI_LEFT: 'ProxiLeft',
    PROXI_RIGHT: 'ProxiRight',
    ACC_X: 'AccX',
    ACC_Y: 'AccY',
    ACC_Z: 'AccZ',
    ACC_STATUS: 'AccStatus',
    BCOLOR_KEY: 'BColorKey',
    BCOLOR_RED: 'BColorRed',
    BCOLOR_GREEN: 'BColorGreen',
    BCOLOR_BLUE: 'BColorBlue',
    FCOLOR_LEFT_KEY: 'FColorLeftKey',
    FCOLOR_RIGHT_KEY: 'FColorRightKey',
    singlemotor: 'singlemotor',
    dualmotor: 'dualmotor',
    colorled: 'colorled',
    leds: 'leds',
};

var sensorIdx = 0;
var hexChar = [
    '0',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
];

Module.prototype.init = function(handler, config) {};

Module.prototype.setSerialPort = function(sp) {
    var self = this;
    this.sp = sp;
};

Module.prototype.requestInitialData = function() {
    //Send Initial Start Packet to (Dongle)Robot
    var buffer;
    //    buffer = new Buffer([0x5F, 0x7E, 0x0E, 0x00, 0x07, 0x00, 0x00, 0x00, 0x0D, 0x0A]);
    buffer = new Buffer([0x5f, 0x7e, 0x0e, 0x00, 0x07, 0x00, 0x00, 0x00]);
    return buffer;
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

Module.prototype.toHex = function(number) {
    var value = parseInt(number);
    //	var value = number;
    if (value < 0) value += 0x100;

    value = value.toString(16).toUpperCase();
    if (value.length > 1) return value;
    else return '0' + value;
};

/*
Module.prototype.buf2hex = function(buffer) { // buffer is an ArrayBuffer
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
}

Module.prototype.buf2hex = function(arr) { // buffer is an ArrayBuffer
 var str ='';
 for(var i = 0; i < arr.length ; i++) {
 str += ((arr[i] < 16) ? "0":"") + arr[i].toString(16);
 }
 return str;
}
*/

Module.prototype.buf2hex = function(b) {
    return hexChar[(b >> 4) & 0x0f] + hexChar[b & 0x0f];
};

Module.prototype.validateLocalData = function(data) {
    return true;
};

Module.prototype.requestRemoteData = function(handler) {
    // Send sensor data EntryHW -> EntryJS
    var sensory = this.sensory;
    for (var key in sensory) {
        handler.write(key, sensory[key]);
    }
};

Module.prototype.handleRemoteData = function(handler) {
    // Entry blocks -> EntryHW -> Buffer
    // Only process for setting & control robots
    var self = this;
    var setDatas = handler.read('SET');
    var buffer = new Buffer([]);

    if (setDatas) {
        var setKeys = Object.keys(setDatas);
        setKeys.forEach(function(device) {
            var data = setDatas[device];
            if (data) {
                if (!self.isRecentData(device, data.port, data)) {
                    // Check for recent data

					//console.log('D:'+device+' P:'+data.port+' A:'+data.dataA+' B:'+data.dataB+' C:'+data.dataC);

                    self.recentCheckData[device] = {
                        port: data.port,
                        data1: data.dataA,
                        data2: data.dataB,
                        data3: data.dataC,
                    };
                    self.sp.write(self.makeOutputBuffer(device, data));
                }
            }
        });
    }
};

Module.prototype.isRecentData = function(device, port, data) {
    var isRecent = false;

    if (device in this.recentCheckData) {
        if (
            this.recentCheckData[device].port == port &&
            this.recentCheckData[device].data1 == data.dataA &&
            this.recentCheckData[device].data2 == data.dataB &&
            this.recentCheckData[device].data3 == data.dataC
        ) {
            //			if(device== setting.dualmotor) isRecent = false;
            //			else isRecent = true;
            isRecent = true;
        }
    }
    return isRecent;
};

Module.prototype.requestLocalData = function() {
    // make a buffer data for EntryHW -> Robot follow firmata protocol
    /*
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
*/
    return null;
};

Module.prototype.handleLocalData = function(data) {
    // Robot data -> EntryHW, save to sensory data
	var str = '';
	var j = 100;
	var sensory = this.sensory;

    if (data.length) {
        for (var i = 0; i < data.length; i++) {
            str = str + this.buf2hex(data[i]);
			if( this.buf2hex(data[i]) == '5F' && this.buf2hex(data[i+1]) == '7E' && this.buf2hex(data[i+18]) == '0D' && this.buf2hex(data[i+19]) == '0A' ){
				j = i;
				sensory.L2 = data[j+2];
				sensory.L1 = data[j+3];
				sensory.R1 = data[j+4];
				sensory.R2 = data[j+5];
				sensory.ProxiLeft = data[j+6];
				sensory.ProxiRight = data[j+7];

				sensory.AccX = data[j+8];
				sensory.AccY = data[j+9];
				sensory.AccZ = data[j+10];
				sensory.AccStatus = data[j+11];
				
				sensory.BColorKey = data[j+14];
				sensory.BColorRed = data[j+15];
				sensory.BColorGreen = data[j+16];
				sensory.BColorBlue = data[j+17];
				sensory.FColorLeftKey = data[j+12];
				sensory.FColorRightKey = data[j+13];

			}
        }
    }
   
};

//0xff 0x55 0x6 0x0 0x1 0xa 0x9 0x0 0x0 0xa
Module.prototype.makeOutputBuffer = function(device, data) {
    var self = this;
    var buffer;
    setting = this.setting;

    // console.log('D:'+device+' P:'+data.port+' A:'+data.dataA+' B:'+data.dataB+' C:'+data.dataC);

    //	if(device==setting.singlemotor){
    //		buffer = new Buffer([0xFF, 0x55, 6, 0, 2, device, data.port, data.dataA, data.dataB]);
    //	}else
    if (device == setting.dualmotor) {
        if (this.delaytime > 0) {
            var cur = new Date().getTime();
            while (cur - this.starttime < this.delaytime) {
                cur = new Date().getTime();
            }
        }

        //dualmotor
        if (data.port == 0x0b)
            buffer = new Buffer([
                0xff,
                0x55,
                6,
                0,
                2,
                device,
                data.port,
                data.dataA,
                data.dataB,
                data.dataC,
            ]);
        else
            buffer = new Buffer([
                0xff,
                0x55,
                6,
                0,
                2,
                device,
                data.port,
                data.dataA,
                data.dataB,
            ]);
        /*
		if(data.dataC>0) {
			this.starttime=new Date().getTime(); // delaytime 얻어내기
			// delaytime 이후에 정지명령 전송하기
			this.delaytime=data.dataC*1000;
			console.log("###D:"+device+ " P:"+data.port+" T:"+this.delaytime);
			window.setTimeout(function(){
				buffer = new Buffer([0xFF, 0x55, 6, 0, 2, 10, 11, 0, 0, 0]);
				self.sp.write(buffer);
			 }, this.delaytime);
		}else{
			this.delaytime=0;
		}
*/
    } else if (device == setting.colorled) {
        buffer = new Buffer([
            0xff,
            0x55,
            6,
            0,
            2,
            device,
            data.dataA,
            data.dataB,
            data.dataC,
        ]);
    } else if (device == setting.leds) {
        buffer = new Buffer([
            0xff,
            0x55,
            6,
            0,
            2,
            device,
            data.port,
            data.dataA,
            0xf0,
        ]);
    } else if (device == setting.linetracer) {
        buffer = new Buffer([
            0xff,
            0x55,
            6,
            0,
            2,
            device,
            data.port,
            data.dataA,
            0xf0,
        ]);
    } else {
        //buffer = new Buffer([]);
    }

    return buffer;
};

Module.prototype.getDataByBuffer = function(buffer) {
    var datas = [];
    var lastIndex = 0;
    buffer.forEach(function(value, idx) {
        if (value == 13 && buffer[idx + 1] == 10) {
            datas.push(buffer.subarray(lastIndex, idx));
            lastIndex = idx + 2;
        }
    });

    return datas;
};

Module.prototype.disconnect = function(connect) {
    var self = this;
    connect.close();
    if (self.sp) {
        delete self.sp;
    }
};

Module.prototype.reset = function() {
    this.lastTime = 0;
    this.lastSendTime = 0;

    var sensory = this.sensory;
};

module.exports = new Module();
