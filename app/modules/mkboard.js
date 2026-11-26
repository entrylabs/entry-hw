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
        ULTRASONIC_1: 7,
        ULTRASONIC_2: 8,
        TIMER: 9,
        LCD: 10,  
        SEGMENT:11,
        OLED:12,
        MATRIX:13,
        NEOPIXEL:14,
        PMS5003:15,
        PMS5003_PM10:16,
        PMS5003_PM25:17,
        PMS5003_PM100:18,
        LSM303_ACCEL:19,
        LSM303_ACCEL_X:20,
        LSM303_ACCEL_Y:21,
        LSM303_ACCEL_Z:22,
        LSM303_COMPASS:23,         
        ULTRASONIC_1_USE: 24,
        ULTRASONIC_2_USE: 25,                
        UNKNOWN_SENSOR:99,
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

    this.sensorData = {
        ULTRASONIC_1: 0,
        ULTRASONIC_2: 0,
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
            '7': 0
        },
        PULSEIN: {
        },
        TIMER: 0,
        PMS5003_PM10: 0,
        PMS5003_PM25: 0,
        PMS5003_PM100: 0,
        LSM303_ACCEL_X: 0,
        LSM303_ACCEL_Y: 0,
        LSM303_ACCEL_Z: 0,
        LSM303_COMPASS: 0,        
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
    // console.log("1~~~~");    
};

Module.prototype.setSerialPort = function (sp) {
    var self = this;
    this.sp = sp;
    // console.log("2~~~~");    
};

Module.prototype.requestInitialData = function() {
    // console.log("3~~~~");    
    return this.makeSensorReadBuffer(this.sensorTypes.ANALOG, 0);
};

Module.prototype.checkInitialData = function(data, config) {
    // console.log("4~~~~");    
    return true;
    // 이후에 체크 로직 개선되면 처리
    // var datas = this.getDataByBuffer(data);
    // var isValidData = datas.some(function (data) {
    //     return (data.length > 4 && data[0] === 255 && data[1] === 85);
    // });
    // return isValidData;
};

Module.prototype.afterConnect = function(that, cb) {
    // console.log("5~~~~");        

    //if(cb) {
    //    cb('connected~~~');
    //}
};

Module.prototype.validateLocalData = function(data) {
    //console.log("6~~~~");    
    return true;
};

Module.prototype.requestRemoteData = function(handler) {
    var self = this;
    //console.log("7~~~~");    
    if(!self.sensorData) {
        return;
    }
    Object.keys(this.sensorData).forEach(function (key) {
        if(self.sensorData[key] != undefined) {
            handler.write(key, self.sensorData[key]);           
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

    // console.log("8~~~~");    

    if(port in this.recentCheckData) {
        if(type != this.sensorTypes.TONE && this.recentCheckData[port].type === type && this.recentCheckData[port].data === data) {
            isRecent = true;
        }
    }

    return isRecent;
}

Module.prototype.requestLocalData = function() {
    var self = this;

    //console.log("9~~~~");    
    
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
// 하드웨어 디바이스에서 엔트리로 들어오는 데이터
Module.prototype.handleLocalData = function(data) {
    var self = this;
    var datas = this.getDataByBuffer(data);

    //console.log("10~~~~");    

    datas.forEach(function (data) {
        if(data.length <= 4 || data[0] !== 255 || data[1] !== 85) {
            return;
        }
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
            case self.sensorTypes.ULTRASONIC_1: {                
                //console.log("ULTRASONIC_1");    
                //console.log(value);    
                self.sensorData.ULTRASONIC_1 = value;
                break;
            }
            case self.sensorTypes.ULTRASONIC_2: {                
                self.sensorData.ULTRASONIC_2 = value;
                break;
            }            
            case self.sensorTypes.TIMER: {
                self.sensorData.TIMER = value;
                break;
            }
            case self.sensorTypes.PMS5003_PM10: {
                self.sensorData.PMS5003_PM10 = value;
                break;
            }           
            case self.sensorTypes.PMS5003_PM25: {
                self.sensorData.PMS5003_PM25 = value;
                break;
            }        
            case self.sensorTypes.PMS5003_PM100: {
                self.sensorData.PMS5003_PM100 = value;
                break;
            }     
            case self.sensorTypes.LSM303_ACCEL_X: {
                self.sensorData.LSM303_ACCEL_X = value;
                break;
            }
            case self.sensorTypes.LSM303_ACCEL_Y: {
                self.sensorData.LSM303_ACCEL_Y = value;
                break;
            }           
            case self.sensorTypes.LSM303_ACCEL_Z: {
                self.sensorData.LSM303_ACCEL_Z = value;
                break;
            }        
            case self.sensorTypes.LSM303_COMPASS: {
                self.sensorData.LSM303_COMPASS = value;
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
// 엔트리에서 하드웨어 디바이스로 데이터 요청 --> GET
Module.prototype.makeSensorReadBuffer = function(device, port, data) {
    var buffer;
    var dummy = new Buffer([10]);
    var pin_no = new Buffer(2);

    // console.log("11~~~~");    

    if(device == this.sensorTypes.ULTRASONIC_1) 
    {
        //console.log("ULTRASONIC_1~~~~");    
        //console.log(port[0]);    
        //console.log(port[1]);    
        // buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, port[0], port[1], 10]);
        buffer = new Buffer([255, 85, 4, sensorIdx, this.actionTypes.GET, device, 10]);
    }
    if(device == this.sensorTypes.ULTRASONIC_2) 
    {
        // console.log("ULTRASONIC_2~~~~");    
        //console.log(port[0]);    
        //console.log(port[1]);            
        // buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, port[0], port[1], 10]);
        buffer = new Buffer([255, 85, 4, sensorIdx, this.actionTypes.GET, device, 10]);
    }    
    else if(!data) 
    {
        //console.log("***port***");
        //console.log(device);
        //console.log(port);
        pin_no[0] = port[0];
        pin_no[1] = port[1];
        //console.log(pin_no[0]);
        //console.log(pin_no[1]);
        buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, pin_no[0], pin_no[1], 10]);
        //buffer = new Buffer([255, 85, 7, sensorIdx, this.actionTypes.GET, device, port, 10]);
        //buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, port, 10]);
    } 
    else 
    {
        // console.log("^^^data error^^^");    
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

//0xff 0x55 0x6(보낼 데이터길이) 0x0 0x1 0xa 0x9 0x0 0x0 0xa
// 엔트리에서 하드웨어 디바이스로 데이터 요청 --> SET
Module.prototype.makeOutputBuffer = function(device, port, data) {
    var buffer;
    var value = new Buffer(2);
    var dummy = new Buffer([10]);
    var cmd = new Buffer(2);
   
    //console.log("makeOutputBuffer");    

    // console.log("12~~~~");    

    switch(device) {
        case this.sensorTypes.SERVO_PIN:
        case this.sensorTypes.DIGITAL:
        case this.sensorTypes.PWM: {
            //console.log("digital,pwm");
            value.writeInt16LE(data);

            //console.log("DEVICE");
            //console.log(device);
            //console.log("VALUE");
            //console.log(value);

            buffer = new Buffer([255, 85, 7, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, value, dummy]);
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
            buffer = new Buffer([255, 85, 9, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, value, time, dummy]);
            break;
        }
        case this.sensorTypes.ULTRASONIC_1_USE: {            
            var trig = new Buffer(2);
            var echo = new Buffer(2);
            
            
            if($.isPlainObject(data)) {
                trig.writeInt16LE(data.trig);
                echo.writeInt16LE(data.echo);
            } else {
                trig.writeInt16LE(0);
                echo.writeInt16LE(0);
            } 
            
            //console.log("ULTRASONIC_1_USE ~~ SET");
            //console.log(trig);
            //console.log(echo);             

            buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, device, trig[0], echo[0]]);      
            buffer = Buffer.concat([buffer, dummy]);      
            break;
        }     
        case this.sensorTypes.ULTRASONIC_2_USE: {            
            var trig = new Buffer(2);
            var echo = new Buffer(2);

            
            if($.isPlainObject(data)) {
                trig.writeInt16LE(data.trig);
                echo.writeInt16LE(data.echo);
            } else {
                trig.writeInt16LE(0);
                echo.writeInt16LE(0);
            }            
            
            //console.log("ULTRASONIC_2_USE ~~ SET");
            //console.log(trig);
            //console.log(echo);

            buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, device, trig[0], echo[0]]);      
            buffer = Buffer.concat([buffer, dummy]);       
            break;
        }
        case this.sensorTypes.LCD: {
            //console.log("LCD ~~~");

            if($.isPlainObject(data)) 
            {
                cmd.writeInt16LE(data.cmd);
            }
            else 
            {
                cmd.writeInt16LE(99);
            }            

            if(cmd[0] == 0)
            {
                // LCD 초기화
                //console.log("LCD initialize");
                //console.log(cmd);

                if($.isPlainObject(data))
                    value.writeInt16LE(data.value);   
                else
                    value.writeInt16LE(0);

                cmd[0] = 0;
                cmd[1] = 0;

                //console.log(value);

                buffer = new Buffer([255, 85, 8, sensorIdx, this.actionTypes.SET, device]);                
                buffer = Buffer.concat([buffer, cmd, value, dummy]);

            }
            else if(cmd[0] == 1)
            {
                // LCD 명령어
                //console.log("LCD command");
                //console.log(cmd);

                if($.isPlainObject(data))
                    value.writeInt16LE(data.value);   
                else
                    value.writeInt16LE(0);

                cmd[0] = 1;
                cmd[1] = 1;
                //console.log(value);

                buffer = new Buffer([255, 85, 8, sensorIdx, this.actionTypes.SET, device]);
                buffer = Buffer.concat([buffer, cmd, value, dummy]);

            }
            else if(cmd[0] == 2)
            {
                // LCD 프린트
                //console.log("LCD print");
                //console.log(cmd);

                var line = new Buffer(2);
                var column = new Buffer(2); 

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
                    line.writeInt16LE(data.line);
                    column.writeInt16LE(data.column);
                } 
                else 
                {
                    //console.log("line data error");
                    line.writeInt16LE(0);
                    column.writeInt16LE(0);
                }

                cmd[0] = 2;
                cmd[1] = 2;
                
                //console.log("line, col");
                //console.log(line);
                //console.log(column);

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

                buffer = new Buffer([255, 85, 42, sensorIdx, this.actionTypes.SET, device]);                
                buffer = Buffer.concat([buffer, cmd, line, column, text0, text1, text2, text3, text4, text5, text6, text7, text8, text9, text10,text11, text12, text13, text14, text15,dummy]);                
            }            
            else
            {
                //console.log("lcd==>else");

                // 아무 명령어도 아닌 경우
                buffer = new Buffer([255, 85, 1]);
                buffer = Buffer.concat([buffer, dummy]); 
            }

            break;
        } // case this.sensorTypes.LCD
        case this.sensorTypes.SEGMENT: {
        
            //console.log("SEGMENT_TEST~~~~~");

            if($.isPlainObject(data)) 
            {
                cmd.writeInt16LE(data.cmd);
            }
            else 
            {
                cmd.writeInt16LE(99);
            }            

            if(cmd[0] == 0)
            {
                var port_clk = new Buffer(2);
                var port_dio = new Buffer(2); 

                // Segment 초기화
                //console.log("SEGMENT initialize");
                //console.log(cmd);
                //console.log("device");
                //console.log(device);


                if($.isPlainObject(data))
                {
                    port_clk.writeInt16LE(data.port_clk);
                    port_dio.writeInt16LE(data.port_dio);   
                }
                else
                {
                    port_clk.writeInt16LE(0);
                    port_dio.writeInt16LE(0);
                }

                cmd[0] = 0;
                cmd[1] = 0;

                //console.log(port_clk);
                //console.log(port_dio);

                buffer = new Buffer([255, 85, 10, sensorIdx, this.actionTypes.SET, device]);                
                buffer = Buffer.concat([buffer, cmd, port_clk, port_dio, dummy]);

            }
            else if(cmd[0] == 1)
            {
                // SEGMENT 명령어

                var bright = new Buffer(2); 

                //console.log("SEGMENT bright");
                //console.log(cmd);
                //console.log("device");
                //console.log(device);


                if($.isPlainObject(data))
                {
                    bright.writeInt16LE(data.bright);   
                }
                else
                {
                    bright.writeInt16LE(0);
                }

                cmd[0] = 1;
                cmd[1] = 1;

                //console.log(bright);

                buffer = new Buffer([255, 85, 8, sensorIdx, this.actionTypes.SET, device]);
                buffer = Buffer.concat([buffer, cmd, bright, dummy]);

            }
            else if(cmd[0] == 2)
            {
                // SEGMENT 출력

                var number = new Buffer(2); 
                var segment_comma = new Buffer(2); 
                var on_off = new Buffer(2); 

                //console.log("SEGMENT print");
                //console.log(cmd);
                //console.log("device");
                //console.log(device);

                if($.isPlainObject(data)) 
                {
                    number.writeInt16LE(data.number);
                    segment_comma.writeInt16LE(data.segment_comma);
                    on_off.writeInt16LE(data.on_off);
                } 
                else 
                {
                    number.writeInt16LE(0);
                    segment_comma.writeInt16LE(0);
                    on_off.writeInt16LE(0);
                }

                cmd[0] = 2;
                cmd[1] = 2;
                
                //console.log("number, segment_comma, on_off");
                //console.log(number);
                //console.log(segment_comma);  
                //console.log(on_off);
                buffer = new Buffer([255, 85, 12, sensorIdx, this.actionTypes.SET, device]);                
                buffer = Buffer.concat([buffer, cmd, number, segment_comma, on_off, dummy]);
            }            
            else if(cmd[0] == 3)
            {
                // SEGMENT Clear 명령어

                // var bright = new Buffer(2); 

                //console.log("SEGMENT clear");
                //console.log(cmd);
                //console.log("device");
                //console.log(device);

                cmd[0] = 3;
                cmd[1] = 3;

                //console.log(bright);

                buffer = new Buffer([255, 85, 7, sensorIdx, this.actionTypes.SET, device]);
                buffer = Buffer.concat([buffer, cmd, dummy]);

            }            
            else
            {
                //console.log("segment->else");

                // 아무 명령어도 아닌 경우
                buffer = new Buffer([255, 85, 1]);
                buffer = Buffer.concat([buffer, dummy]);            
                //buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, UNKNOWN_SENSOR]);
                //buffer = Buffer.concat([buffer, cmd, dummy]);                
            }

            break;
        } // case this.sensorTypes.SEGMENT

       case this.sensorTypes.OLED: {
        
            //console.log("OLED_TEST~~~~~");


            if($.isPlainObject(data)) 
            {
                cmd.writeInt16LE(data.cmd);
            }
            else 
            {
                cmd.writeInt16LE(99);
            }            

            if(cmd[0] == 0)
            {
                var oled_init = new Buffer(2);

                // OLED 초기화
                //console.log("OLED initialize");
                //console.log("cmd=");
                //console.log(cmd[0]);

                
                if($.isPlainObject(data))
                {
                    oled_init.writeInt16LE(data.oled_init);
                }
                else
                {
                    oled_init.writeInt16LE(0);
                }                

                cmd[0] = 0;
                cmd[1] = 0;

                // console.log(oled_init);


                buffer = new Buffer([255, 85, 8, sensorIdx, this.actionTypes.SET, device]);                
                buffer = Buffer.concat([buffer, cmd, oled_init, dummy]);

            }
            else if(cmd[0] == 1)
            {
                // OLED 문자 출력

                // console.log("OLED String");

                var line = new Buffer(2);
                var column = new Buffer(2); 

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
                    line.writeInt16LE(data.line);
                    column.writeInt16LE(data.column);
                } 
                else 
                {
                    line.writeInt16LE(0);
                    column.writeInt16LE(0);
                }

                cmd[0] = 1;
                cmd[1] = 1;
                
                //console.log("line, col");
                //console.log(line);
                //console.log(column);

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

                buffer = new Buffer([255, 85, 42, sensorIdx, this.actionTypes.SET, device]);                
                buffer = Buffer.concat([buffer, cmd, line, column, text0, text1, text2, text3, text4, text5, text6, text7, text8, text9, text10,text11, text12, text13, text14, text15,dummy]); 

            }
            else if(cmd[0] == 2)
            {
                // OLED 출력

                var line = new Buffer(2);
                var column = new Buffer(2); 
                var number = new Buffer(2); 
                var oled_comma = new Buffer(2); 

                //console.log("OLED Number");
                // console.log(cmd);

                if($.isPlainObject(data)) 
                {
                    line.writeInt16LE(data.line);
                    column.writeInt16LE(data.column);
                    number.writeInt16LE(data.number);
                    oled_comma.writeInt16LE(data.oled_comma);
                } 
                else 
                {
                    line.writeInt16LE(0);
                    column.writeInt16LE(0);
                    number.writeInt16LE(0);
                    oled_comma.writeInt16LE(0);
                }

                cmd[0] = 2;
                cmd[1] = 2;
                
                //console.log("line, column, number, oled_comma");
                //console.log(line);
                //console.log(column);  
                //console.log(number);
                //console.log(oled_comma);
                buffer = new Buffer([255, 85, 14, sensorIdx, this.actionTypes.SET, device]);                
                buffer = Buffer.concat([buffer, cmd, line, column, number, oled_comma, dummy]);
            }
            else if(cmd[0] == 3)
            {               

                // OLED Clear
                // console.log("OLED Clear");

                cmd[0] = 3;
                cmd[1] = 3;

                buffer = new Buffer([255, 85, 7, sensorIdx, this.actionTypes.SET, device]);                
                buffer = Buffer.concat([buffer, cmd, dummy]);

            }                        
            else
            {
                // console.log("oled->else");

                // 아무 명령어도 아닌 경우
                buffer = new Buffer([255, 85, 1]);
                buffer = Buffer.concat([buffer, dummy]);               
            }

            break;
        } // case this.sensorTypes.OLED        
       case this.sensorTypes.MATRIX: {
        
            // console.log("MATRIX_TEST~~~~~");

            if($.isPlainObject(data)) 
            {
                cmd.writeInt16LE(data.cmd);
            }
            else 
            {
                cmd.writeInt16LE(99);
            }            

            if(cmd[0] == 0)
            {
                var matrix_num = new Buffer(2);
                var port_data = new Buffer(2);
                var port_clk = new Buffer(2);
                var port_cs = new Buffer(2);

                // MATRIX 초기화
                // console.log("MATRIX initialize");
                // console.log(cmd);

                if($.isPlainObject(data))
                {
                    matrix_num.writeInt16LE(data.matrix_num);
                    port_data.writeInt16LE(data.port_data);
                    port_clk.writeInt16LE(data.port_clk);
                    port_cs.writeInt16LE(data.port_cs);
                }
                else
                {
                    matrix_num.writeInt16LE(0);
                    port_data.writeInt16LE(0);
                    port_clk.writeInt16LE(0);
                    port_cs.writeInt16LE(0);
                }

                cmd[0] = 0;
                cmd[1] = 0;

                //console.log(matrix_num);
                //console.log(port_data);
                //console.log(port_clk);
                //console.log(port_cs);

                buffer = new Buffer([255, 85, 14, sensorIdx, this.actionTypes.SET, device]);                
                buffer = Buffer.concat([buffer, cmd, matrix_num, port_data, port_clk, port_cs, dummy]);

            }
            else if(cmd[0] == 1)
            {
                var matrix_num = new Buffer(2);
                var bright = new Buffer(2);

                // MATRIX 밝기
                // console.log("MATRIX Bright");
                // console.log(cmd);

                if($.isPlainObject(data))
                {
                    matrix_num.writeInt16LE(data.matrix_num);
                    bright.writeInt16LE(data.bright);
                }
                else
                {
                    matrix_num.writeInt16LE(0);
                    bright.writeInt16LE(0);
                }

                cmd[0] = 1;
                cmd[1] = 1;

                //console.log(matrix_num);
                //console.log(bright);

                buffer = new Buffer([255, 85, 10, sensorIdx, this.actionTypes.SET, device]);                
                buffer = Buffer.concat([buffer, cmd, matrix_num, bright,dummy]);

            }            
            else if(cmd[0] == 2)
            {
                var matrix_num = new Buffer(2);

                // MATRIX Clear
                // console.log("MATRIX Clear");
                // console.log(cmd);

                if($.isPlainObject(data))
                {
                    matrix_num.writeInt16LE(data.matrix_num);
                }
                else
                {
                    matrix_num.writeInt16LE(0);
                }

                cmd[0] = 2;
                cmd[1] = 2;

                // console.log(matrix_num);

                buffer = new Buffer([255, 85, 8, sensorIdx, this.actionTypes.SET, device]);                
                buffer = Buffer.concat([buffer, cmd, matrix_num, dummy]);
            }         
            else if(cmd[0] == 3)
            {
                var matrix_num = new Buffer(2);
                var matrix_row = new Buffer(2);
                var matrix_col = new Buffer(2);
                var matrix_on_off = new Buffer(2);

                // MATRIX ON/OFF
                // console.log("MATRIX ON/OFF");
                // console.log(cmd);

                if($.isPlainObject(data))
                {
                    matrix_num.writeInt16LE(data.matrix_num);
                    matrix_row.writeInt16LE(data.matrix_row);
                    matrix_col.writeInt16LE(data.matrix_col);
                    matrix_on_off.writeInt16LE(data.matrix_on_off);
                }
                else
                {
                    matrix_num.writeInt16LE(0);
                    matrix_row.writeInt16LE(0);
                    matrix_col.writeInt16LE(0);
                    matrix_on_off.writeInt16LE(0);
                }

                cmd[0] = 3;
                cmd[1] = 3;

                //console.log(matrix_num);
                //console.log(matrix_row);
                //console.log(matrix_col);
                //console.log(matrix_on_off);

                buffer = new Buffer([255, 85, 14, sensorIdx, this.actionTypes.SET, device]);                
                buffer = Buffer.concat([buffer, cmd, matrix_num, matrix_row, matrix_col, matrix_on_off, dummy]);
            }
            else if(cmd[0] == 4)
            {
                var matrix_num = new Buffer(2);
                var matrix_row = new Buffer(2);

                var text0 = new Buffer(2);
                var text1 = new Buffer(2);
                var text2 = new Buffer(2);
                var text3 = new Buffer(2);
                var text4 = new Buffer(2);
                var text5 = new Buffer(2);
                var text6 = new Buffer(2);
                var text7 = new Buffer(2);                

                // MATRIX Row
                // console.log("MATRIX Row");
                // console.log(cmd);

                if($.isPlainObject(data))
                {
                    matrix_num.writeInt16LE(data.matrix_num);
                    matrix_row.writeInt16LE(data.matrix_row);
                }
                else
                {
                    matrix_num.writeInt16LE(0);
                    matrix_row.writeInt16LE(0);
                }

                cmd[0] = 4;
                cmd[1] = 4;

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
                }                

                // console.log(matrix_row);

                buffer = new Buffer([255, 85, 26, sensorIdx, this.actionTypes.SET, device]);                
                buffer = Buffer.concat([buffer, cmd, matrix_num, matrix_row, text0, text1, text2, text3, text4, text5, text6, text7, dummy]);
            }          
            else if(cmd[0] == 5)
            {
                var matrix_num = new Buffer(2);
                var matrix_col = new Buffer(2);

                var text0 = new Buffer(2);
                var text1 = new Buffer(2);
                var text2 = new Buffer(2);
                var text3 = new Buffer(2);
                var text4 = new Buffer(2);
                var text5 = new Buffer(2);
                var text6 = new Buffer(2);
                var text7 = new Buffer(2);                

                // MATRIX Col
                // console.log("MATRIX Col");
                // console.log(cmd);

                if($.isPlainObject(data))
                {
                    matrix_num.writeInt16LE(data.matrix_num);
                    matrix_col.writeInt16LE(data.matrix_col);
                }
                else
                {
                    matrix_num.writeInt16LE(0);
                    matrix_col.writeInt16LE(0);
                }

                cmd[0] = 5;
                cmd[1] = 5;

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
                }                

                // console.log(matrix_row);

                buffer = new Buffer([255, 85, 26, sensorIdx, this.actionTypes.SET, device]);                
                buffer = Buffer.concat([buffer, cmd, matrix_num, matrix_col, text0, text1, text2, text3, text4, text5, text6, text7, dummy]);
            }
            else if(cmd[0] == 6)
            {
                var matrix_num = new Buffer(2);
                var text0 = new Buffer(2);       

                // MATRIX Char
                // console.log("MATRIX Char");
                // console.log(cmd);

                if($.isPlainObject(data))
                {
                    matrix_num.writeInt16LE(data.matrix_num);
                }
                else
                {
                    matrix_num.writeInt16LE(0);
                }

                cmd[0] = 6;
                cmd[1] = 6;

                if($.isPlainObject(data)) 
                {
                    text0.writeInt16LE(data.text0);
                } 
                else 
                {
                    text0.writeInt16LE(0);
                }

                buffer = new Buffer([255, 85, 10, sensorIdx, this.actionTypes.SET, device]);                
                buffer = Buffer.concat([buffer, cmd, matrix_num, text0, dummy]);
            }                 
            else
            {
                // console.log("matrix->else");

                // 아무 명령어도 아닌 경우
                buffer = new Buffer([255, 85, 1]);
                buffer = Buffer.concat([buffer, dummy]);                
            }

            break;            
        }   // case this.sensorTypes.MATRIX     

       case this.sensorTypes.NEOPIXEL: {
        
            // console.log("NEOPIXEL_TEST~~~~~");

            if($.isPlainObject(data)) 
            {
                cmd.writeInt16LE(data.cmd);
            }
            else 
            {
                cmd.writeInt16LE(99);
            }            

            if(cmd[0] == 0)
            {
                var port_no = new Buffer(2);
                var led_count = new Buffer(2);
                var rgb = new Buffer(2);

                // OLED 초기화
                // console.log("NEOPIXEL initialize");
                // console.log(cmd);

                if($.isPlainObject(data))
                {
                    port_no.writeInt16LE(data.port_no);
                    led_count.writeInt16LE(data.led_count);
                    rgb.writeInt16LE(data.rgb);
                }
                else
                {
                    port_no.writeInt16LE(0);
                    led_count.writeInt16LE(0);
                    rgb.writeInt16LE(0);
                }

                cmd[0] = 0;
                cmd[1] = 0;

                //console.log(port_no);
                //console.log(led_count);
                //console.log(rgb);

                buffer = new Buffer([255, 85, 12, sensorIdx, this.actionTypes.SET, device]);                
                buffer = Buffer.concat([buffer, cmd, port_no, led_count, rgb, dummy]);

            }
            else if(cmd[0] == 1)
            {
                var led_no = new Buffer(2);                
                var r_val = new Buffer(2);
                var g_val = new Buffer(2);
                var b_val = new Buffer(2);

                // NEOPIXEL 초기화
                // console.log("NEOPIXEL RGB SET");
                // console.log(cmd);

                if($.isPlainObject(data))
                {
                    led_no.writeInt16LE(data.led_no);                    
                    r_val.writeInt16LE(data.r_val);
                    g_val.writeInt16LE(data.g_val);
                    b_val.writeInt16LE(data.b_val);
                }
                else
                {
                    led_no.writeInt16LE(0);                    
                    r_val.writeInt16LE(0);
                    g_val.writeInt16LE(0);
                    b_val.writeInt16LE(0);
                }

                cmd[0] = 1;
                cmd[1] = 1;

                //console.log(led_no);                
                //console.log(r_val);
                //console.log(g_val);
                //console.log(b_val);

                buffer = new Buffer([255, 85, 14, sensorIdx, this.actionTypes.SET, device]);                
                buffer = Buffer.concat([buffer, cmd, led_no, r_val, g_val, b_val, dummy]);
            }
            else if(cmd[0] == 2)
            {
                var led_no = new Buffer(2);                
                var r_val = new Buffer(2);
                var g_val = new Buffer(2);
                var b_val = new Buffer(2);
                var w_val = new Buffer(2);

                // NEOPIXEL 초기화
                // console.log("NEOPIXEL RGBW SET");
                // console.log(cmd);

                if($.isPlainObject(data))
                {
                    led_no.writeInt16LE(data.led_no);                    
                    r_val.writeInt16LE(data.r_val);
                    g_val.writeInt16LE(data.g_val);
                    b_val.writeInt16LE(data.b_val);
                    w_val.writeInt16LE(data.w_val);
                }
                else
                {
                    led_no.writeInt16LE(0);                    
                    r_val.writeInt16LE(0);
                    g_val.writeInt16LE(0);
                    b_val.writeInt16LE(0);
                    w_val.writeInt16LE(0);
                }

                cmd[0] = 2;
                cmd[1] = 2;

                //console.log(led_no);                
                //console.log(r_val);
                //console.log(g_val);
                //console.log(b_val);
                //console.log(w_val);

                buffer = new Buffer([255, 85, 16, sensorIdx, this.actionTypes.SET, device]);                
                buffer = Buffer.concat([buffer, cmd, led_no, r_val, g_val, b_val, w_val, dummy]);
            }            
            else if(cmd[0] == 3)
            {
                
                // console.log("NEOPIXEL ON/OFF");
                // console.log(cmd);

                if($.isPlainObject(data))
                {
                    value.writeInt16LE(data.value);
                }
                else
                {
                    value.writeInt16LE(0);
                }

                cmd[0] = 3;
                cmd[1] = 3;

                // console.log(value);

                buffer = new Buffer([255, 85, 8, sensorIdx, this.actionTypes.SET, device]);                
                buffer = Buffer.concat([buffer, cmd, value, dummy]);
            }            
            else
            {
                // console.log("neopixel->else");

                // 아무 명령어도 아닌 경우
                buffer = new Buffer([255, 85, 1]);
                buffer = Buffer.concat([buffer, dummy]);                 
            }

            break;            
        }   // case this.sensorTypes.NEOPIXEL     

       case this.sensorTypes.PMS5003: {
        
            // console.log("PMS5003_TEST~~~~~");

            if($.isPlainObject(data)) 
            {
                cmd.writeInt16LE(data.cmd);
            }
            else 
            {
                cmd.writeInt16LE(99);
            }            

            if(cmd[0] == 0)
            {
                var port_rx = new Buffer(2);
                var port_tx = new Buffer(2);

                // PMS5003 초기화
                // console.log("PMS5003 initialize");
                // console.log(cmd);

                if($.isPlainObject(data))
                {
                    port_rx.writeInt16LE(data.port_rx);
                    port_tx.writeInt16LE(data.port_tx);
                }
                else
                {
                    port_rx.writeInt16LE(0);
                    port_tx.writeInt16LE(0);
                }

                cmd[0] = 0;
                cmd[1] = 0;

                //console.log(port_rx);
                //console.log(port_tx);

                buffer = new Buffer([255, 85, 10, sensorIdx, this.actionTypes.SET, device]);                
                buffer = Buffer.concat([buffer, cmd, port_rx, port_tx, dummy]);

            }
            else if(cmd[0] == 1)
            {

                // OLED 초기화
                //console.log("PMS5003 measure");
                //console.log(cmd);

                cmd[0] = 1;
                cmd[1] = 1;

                buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, device]);                
                buffer = Buffer.concat([buffer, cmd, dummy]);
            }          
            else
            {
                // console.log("pms5003->else");

                // 아무 명령어도 아닌 경우
                buffer = new Buffer([255, 85, 1]);
                buffer = Buffer.concat([buffer, dummy]);                 
            }

            break;            
        }   // case this.sensorTypes.PMS5003     

       case this.sensorTypes.LSM303_ACCEL: {
        
            // console.log("LSM303_ACCEL_TEST~~~~~");

            if($.isPlainObject(data)) 
            {
                cmd.writeInt16LE(data.cmd);
            }
            else 
            {
                cmd.writeInt16LE(99);
            }            

            if(cmd[0] == 0)
            {
                // LSM303_ACCEL 초기화
                // console.log("LSM303_ACCEL initialize");
                // console.log(cmd);

                cmd[0] = 0;
                cmd[1] = 0;

                buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, device]);                
                buffer = Buffer.concat([buffer, cmd, dummy]);

            }
            else if(cmd[0] == 1)
            {

                // LSM303_ACCEL 초기화
                // console.log("LSM303_ACCEL measure");
                // console.log(cmd);

                cmd[0] = 1;
                cmd[1] = 1;

                buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, device]);                
                buffer = Buffer.concat([buffer, cmd, dummy]);
            }          
            else
            {
                // console.log("lsm3003_accel->else");

                // 아무 명령어도 아닌 경우
                buffer = new Buffer([255, 85, 1]);
                buffer = Buffer.concat([buffer, dummy]);                 
            }

            break;            
        }   // case this.sensorTypes.LSM303_ACCEL

       case this.sensorTypes.LSM303_COMPASS: {
        
            // console.log("LSM303_COMPASS_TEST~~~~~");

            if($.isPlainObject(data)) 
            {
                cmd.writeInt16LE(data.cmd);
            }
            else 
            {
                cmd.writeInt16LE(99);
            }            

            if(cmd[0] == 0)
            {
                // LSM303_COMPASS 초기화
                // console.log("LSM303_COMPASS initialize");
                // console.log(cmd);

                cmd[0] = 0;
                cmd[1] = 0;

                buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, device]);                
                buffer = Buffer.concat([buffer, cmd, dummy]);

            }
            else if(cmd[0] == 1)
            {

                // LSM303_ACCEL 초기화
                // console.log("LSM303_COMPASS measure");
                // console.log(cmd);

                cmd[0] = 1;
                cmd[1] = 1;

                buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, device]);                
                buffer = Buffer.concat([buffer, cmd, dummy]);
            }          
            else
            {
                // console.log("lsm3003_compass->else");

                // 아무 명령어도 아닌 경우
                buffer = new Buffer([255, 85, 1]);
                buffer = Buffer.concat([buffer, dummy]);                 
            }

            break;            
        }   // case this.sensorTypes.LSM303_COMPASS            
    }

    return buffer;
};

Module.prototype.getDataByBuffer = function(buffer) {
    var datas = [];
    var lastIndex = 0;

    // console.log("13~~~~");    

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

    // console.log("14~~~~");    

    connect.close();
    if(self.sp) {
        delete self.sp;
    }
};

Module.prototype.reset = function() {
    this.lastTime = 0;
    this.lastSendTime = 0;

    // console.log("15~~~~");    

     this.sensorData.PULSEIN = {
    }
};

module.exports = new Module();
