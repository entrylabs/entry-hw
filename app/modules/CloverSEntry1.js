










































function Module() 
{
    this.sp = null;
    
    
    this.MonitoringData = {
        M_SW1 : 0,
        M_SW2 : 0,
        
        
        
        
        
        M_ANALOG1 : 0,
        M_ANALOG2 : 0,
        M_ULTRASONIC : 0,
        M_CDS : 0,
        M_TEMP : 0,
        M_C_SW1 : 0,
        M_C_SW2 : 0,
        M_C_SW3 : 0,
        M_C_SW4 : 0,
        M_C_SW5 : 0,
        M_C_SW6 : 0,
        M_C_SW7 : 0,
        M_C_SW8 : 0,
    }
    
    
    
    this.sensorTypes = {
		 ALIVE :          0,               
         DIGITAL :        1,               
         ANALOG :         2,               
         PWM :            3,               
         SERVO :          4,               
         TONE :           5,               
         PULSEIN :        6,               
         ULTRASONIC :     7,               
         TIMER :          8,               
         MOTOR_L :        9,               
         MOTOR_R :        10,              
         CLOVER_FND :     11,              
         CLOVER_SW :      12,              
         CLOVER_LED :     13,              
         CLOVER_RGB :     14,              
         CLOVER_TEMP :    15,              
    };
    
    
    
    this.pinMaps = {
        SW1 :            2,               
        SW2 :            7,               
        LED_G :          17,              
        LED_B :          16,              
        BUZZ :           4,               
        CDS :            7,               
        
        Digital_Port0 :  17,              
        Digital_Port1 :  16,              
        Digital_Port2 :  3,               
        Digital_Port3 :  5,               
        Digital_Port4 :  6,               
        Digital_Port5 :  9,               
        Digital_Port6 :  10,              
        Digital_Port7 :  11,              
        Digital_Port8 :  12,              
        Digital_Port9 :  13,              
        
        Analog_Port0 :   14,              
        Analog_Port1 :   15,              
        
        DIR_L :           5,              
        EN_L :            6,              
        DIR_R :           9,              
        EN_R :            10,             
        
        Ultrasonic_TRIG : 13,             
        Ultrasonic_ECHO : 12,             
    };
    
    this.CloverMaps = {
        FND :             0,              
        MODULE0 :         39,             
        MODULE1 :         38,             
        MODULE2 :         37,             
        MODULE3 :         36,             
        MODULE4 :         35,             
        MODULE5 :         34,             
        MODULE6 :         33,             
        MODULE7 :         32,             
        RGB_LED :         0,              
    };

    this.actionTypes = {
        GET: 1,
        SET: 2,
        RESET: 3
    };

    this.sensorValueSize = {
        FLOAT: 2,
        SHORT: 3,
        BIT: 4,
    };

    this.digitalPortTimeList = new Buffer(18);  
    this.digitalPortList =  new Buffer(18);     
    

    
    
    
    
    
    
    
    
    
    
    
    this.cloverPortTimeList = new Buffer(102);
    this.cloverPortList = new Buffer(102);


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
        },
        ANALOG: {
            '0': 0,  
            '1': 0,  
            '7': 0,  
        },
        CLOVER: {
            '0': 0,
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0,
            '6': 0,
            '7': 0,
            '8': 0,
        },
        PULSEIN: { },
        TIMER: 0,
        TEMP : 10,
    };

    this.defaultOutput = { };
    this.recentCheckData = { };
    this.recentCheckDataClover = { };
    this.sendBuffers = [];
    this.receiveBuffer = [];

    this.lastTime = 0;
    this.lastSendTime = 0;
    this.isDraing = false;
    
    
    
    this.cloverModuleData = new Buffer(8);  
    this.cloverModuleMode = new Buffer(8);  
    
    this.tx_buffer = new Buffer([]);
    this.tx_time = 0;
    
    this.check_getDatas_old = 0;
    this.check_getDatas = 0;
    this.check_getClover_old = 0;
    this.check_getClover = 0;
    
    
    
    this.motor_left_data_type = 0;
    this.motor_left_data_direction = 0;
    this.motor_left_data_speed = 0;
    this.motor_right_data_type = 0;
    this.motor_right_data_direction = 0;
    this.motor_right_data_speed = 0;
}

var sensorIdx = 0;


Module.prototype.init = function(handler, config) {};




Module.prototype.requestInitialData = function() 
{
    var self = this;
  
    tx_buffer = self.makeOutputBuffer(this.sensorTypes.CLOVER_FND, 0, 0);  
    
    
    if(tx_buffer.length) { this.sendBuffers.push(tx_buffer); }
    for(var i=0; i<this.cloverModuleData.length; i++) { this.cloverModuleData[i] = 0xFF; }  
    
    
    self.check_getDatas = new Date().getTime();
    self.check_getClover = new Date().getTime();
    
    return this.makeSensorReadBuffer(this.sensorTypes.ANALOG, 0);
};




Module.prototype.checkInitialData = function(data, config) {
    return true;
    
    
    
    
    
    
};




Module.prototype.requestLocalData = function() 
{
    var self = this;
    
     if(!this.isDraing && this.sendBuffers.length > 0) 
     {
        this.isDraing = true;
        this.sp.write(this.sendBuffers.shift(), function() 
        {
            if(self.sp) 
            {
                self.sp.drain(function(){self.isDraing = false;});
            }
        });
            
    }
    

    return null;
};




/*  ff 55 idx size data a  */
Module.prototype.handleLocalData = function(data) 
{
    this.handleRemoteData(null);
    
    var self = this;
    var stx_ok;  
    var data;  
   
    
    if(this.receiveBuffer.length == 0)
    {
        this.receiveBuffer = data;
    }
    else
    {
        this.receiveBuffer = Buffer.concat([this.receiveBuffer, data]);
    }
  
    
    while(true)
    {
        
        stx_ok = false;
        data_ok = false;
        
        if(this.receiveBuffer.length >= 2 )  
        {
            if(this.receiveBuffer[0] == 0xFF && this.receiveBuffer[1] == 0x55)
            {
                stx_ok = true;
            }
            else
            {
                
                this.receiveBuffer = this.receiveBuffer.subarray(1, this.receiveBuffer.length);
            }
        }
        else
        {
            
            break;
        }
        
        if(stx_ok == true)
        {
            
            if(this.receiveBuffer.length >= 4 && this.receiveBuffer[2] == 0x0D && this.receiveBuffer[3] == 0x0A)
            {
                
                data_ok = true;
                this.receiveBuffer = this.receiveBuffer.subarray(4, this.receiveBuffer.length);  
            }
            
            
            if(data_ok == false && this.receiveBuffer.length >= 11 && this.receiveBuffer[9] == 0x0D && this.receiveBuffer[10] == 0x0A)
            {
                
                data_ok = true;
                data = this.receiveBuffer.subarray(0, 11);  
                this.handleLocalDataProcess(data);  
                this.receiveBuffer = this.receiveBuffer.subarray(11, this.receiveBuffer.length);  
            }
            
            
            if(data_ok == false && this.receiveBuffer.length >= 12 && this.receiveBuffer[10] == 0x0D && this.receiveBuffer[11] == 0x0A)
            {
                
                data_ok = true;
                data = this.receiveBuffer.subarray(0, 12);  
                this.handleLocalDataProcess(data);  
                this.receiveBuffer = this.receiveBuffer.subarray(12, this.receiveBuffer.length);  
            }
            
            
            if(data_ok == false)
            {
                if(this.receiveBuffer >= 12) 
                {
                    this.receiveBuffer = this.receiveBuffer.subarray(12, this.receiveBuffer.length);
                }
                else
                {
                    break;
                }
            }
        }
                
        
        if(this.receiveBuffer.length > 0xFF)
        {
            
            
            this.receiveBuffer = [];
            break;
        }
    }
};




Module.prototype.handleLocalDataProcess = function(data) 
{
    var self = this;
    var dataType;
    var value;
    var port;
    var device;
    
    
    switch(data.length)
    {
        case 11:
                device = data[8];
                break;
        
        case 12:
                device = data[9];
                break;
        
        default:
                device = 0;
    }
    
    dataType = data[2];  
    port = data[7];  
    
    
    switch(dataType)
    {
        case self.sensorValueSize.FLOAT :
                value = new Buffer(data.subarray(3, 7)).readFloatLE();
                value = Math.round(value * 100) / 100; 
                break;
        
        case self.sensorValueSize.SHORT :
                value = new Buffer(data.subarray(3, 5)).readInt16LE();
                break;
                
        case self.sensorValueSize.BIT :
                value = data[6];
                break;
                      
        default : 
                value = 0;
                break;
    }
    
    
    switch(device)
    {
        case self.sensorTypes.DIGITAL :
                self.sensorData.DIGITAL[port] = value;
                break;
        
        case self.sensorTypes.ANALOG :
                self.sensorData.ANALOG[port] = value;
                break;
            
        case self.sensorTypes.PULSEIN :
                self.sensorData.PULSEIN[port] = value;
                break;
            
        case self.sensorTypes.ULTRASONIC :
                self.sensorData.ULTRASONIC = value;
                break;
            
        case self.sensorTypes.CLOVER_SW :
        case self.sensorTypes.CLOVER_LED :
        {           
                port = self.CloverMaps.MODULE0 - port + 1;  
                self.sensorData.CLOVER[port] = value;
                break;
        }
        case self.sensorTypes.TIMER :
                self.sensorData.TIMER[port] = value;
                break;
        case self.sensorTypes.CLOVER_TEMP :
                self.sensorData.TEMP = value;
                break;
    }
};




Module.prototype.validateLocalData = function(data) 
{
    return true;
};




Module.prototype.requestRemoteData = function(handler) 
{
    var self = this;
    if(!self.sensorData) {
        return;
    }
    Object.keys(this.sensorData).forEach(function (key) {
        if(self.sensorData[key] != undefined) {
            handler.write(key, self.sensorData[key]);           
        }
    })
    
    
    var MonitoringData = this.MonitoringData;
    
    MonitoringData.M_SW1 = (self.sensorData.DIGITAL[2] == 0) ? 'ON' : 'OFF' ;
    MonitoringData.M_SW2 = (self.sensorData.DIGITAL[7] == 0) ? 'ON' : 'OFF' ;
    MonitoringData.M_ANALOG1 = self.sensorData.ANALOG[0];
    MonitoringData.M_ANALOG2 = self.sensorData.ANALOG[1];
    MonitoringData.M_ULTRASONIC = (Math.round(self.sensorData.ULTRASONIC*10) / 10);
    MonitoringData.M_CDS = self.sensorData.ANALOG[7];
    MonitoringData.M_TEMP = (Math.round(self.sensorData.TEMP*10) / 10);
    
    MonitoringData.M_C_SW1 = (self.sensorData.CLOVER[1] & 0x01) == 0x01 ? 'ON' : 'OFF';
    MonitoringData.M_C_SW2 = (self.sensorData.CLOVER[1] & 0x02) == 0x02 ? 'ON' : 'OFF';
    MonitoringData.M_C_SW3 = (self.sensorData.CLOVER[1] & 0x04) == 0x04 ? 'ON' : 'OFF';
    MonitoringData.M_C_SW4 = (self.sensorData.CLOVER[1] & 0x08) == 0x08 ? 'ON' : 'OFF';
    MonitoringData.M_C_SW5 = (self.sensorData.CLOVER[1] & 0x10) == 0x10 ? 'ON' : 'OFF';
    MonitoringData.M_C_SW6 = (self.sensorData.CLOVER[1] & 0x20) == 0x20 ? 'ON' : 'OFF';
    MonitoringData.M_C_SW7 = (self.sensorData.CLOVER[1] & 0x40) == 0x40 ? 'ON' : 'OFF';
    MonitoringData.M_C_SW8 = (self.sensorData.CLOVER[1] & 0x80) == 0x80 ? 'ON' : 'OFF';
    
    for(var key in MonitoringData) {
		handler.write(key, self.MonitoringData[key]);
	}
    
};




Module.prototype.handleRemoteData = function(handler) 
{
    var self = this;
    var getDatas;
    var setDatas;
    var time;  
    var getClover;
    var setClover;
    var buffer = new Buffer([]);
    
    
    
    if(handler != null)
    {
        getDatas = handler.read('GET');
        setDatas = handler.read('SET');
        getClover = handler.read('GET_CLOVER');
        setClover = handler.read('SET_CLOVER');
    }
    else
    {
        getDatas = false;
        setDatas = false;
        getClover = false;
        setClover = false;
    }
    
    if(getDatas) 
    {
        var keys = Object.keys(getDatas);
        
        
        keys.forEach(function(key) {
            var isSend = false;
            var dataObj = getDatas[key];
            if(typeof dataObj.port === 'string' || typeof dataObj.port === 'number') {
                var time = self.digitalPortTimeList[dataObj.port];
                if(dataObj.time > time) 
                {
                    isSend = true;
                    self.digitalPortTimeList[dataObj.port] = dataObj.time;
                }
            }
            else if(Array.isArray(dataObj.port)) {
                isSend = dataObj.port.every(function(port) {
                    var time = self.digitalPortTimeList[port];
                    return dataObj.time > time;
                });

                if(isSend) 
                {
                    dataObj.port.forEach(function(port) {
                        self.digitalPortTimeList[port] = dataObj.time;
                    });
                }
            }

            if(isSend) 
            {
                if(!self.isRecentData(dataObj.port, key, dataObj.data)) {
                    self.recentCheckData[dataObj.port] = {
                        type: key,
                        data: dataObj.data
                    };
                    
                    buffer = Buffer.concat([buffer, self.makeSensorReadBuffer(key, dataObj.port, dataObj.data)]);
                }
            }
            
            
            if(self.check_getDatas_old != self.check_getDatas)  
            {
                var keyInt = parseInt(key);
    
                self.check_getDatas_old = self.check_getDatas;
                switch(keyInt)
                {
                    case self.sensorTypes.ULTRASONIC :
                        dataObj.port = new Buffer(2);
                        dataObj.port[0] = 13; dataObj.port[1] = 12;
                        buffer = Buffer.concat([buffer, self.makeSensorReadBuffer(key, dataObj.port, dataObj.data)]);
                        break;
                        
                }
            }
        });        
    }

    if(setDatas) {
        var setKeys = Object.keys(setDatas);
        setKeys.forEach(function (port) {
            var data = setDatas[port];
            if(data)
            {
                if(self.digitalPortTimeList[port] < data.time) 
                {
                    
                    if(data.type == self.sensorTypes.MOTOR_L)
                    {
                        if((self.motor_left_data_type != data.type) 
                            || (self.motor_left_data_direction != data.data.direction) 
                            || (self.motor_left_data_speed != data.data.speed)
                            )
                        {
                            self.motor_left_data_type = data.type;
                            self.motor_left_data_direction = data.data.direction;
                            self.motor_left_data_speed = data.data.speed;
                            
                            buffer = Buffer.concat([buffer, self.makeOutputBuffer(data.type, port, data.data)]);
                        }
                    }
                    else if(data.type == self.sensorTypes.MOTOR_R)
                    {
                        if((self.motor_right_data_type != data.type) 
                            || (self.motor_right_data_direction != data.data.direction) 
                            || (self.motor_right_data_speed != data.data.speed)
                            )
                        {
                            self.motor_right_data_type = data.type;
                            self.motor_right_data_direction = data.data.direction;
                            self.motor_right_data_speed = data.data.speed;
                            
                            buffer = Buffer.concat([buffer, self.makeOutputBuffer(data.type, port, data.data)]);
                        }
                    }
                    else
                    {
                        self.digitalPortTimeList[port] = data.time;
                        if(!self.isRecentData(port, data.type, data.data))
                        {
                            self.recentCheckData[port] = 
                            {
                                type: data.type,
                                data: data.data
                            };
                            buffer = Buffer.concat([buffer, self.makeOutputBuffer(data.type, port, data.data)]);  
                        }
                    }
                }
            }
        });
    }
    
    if(getClover) {
        var keys = Object.keys(getClover);
        keys.forEach(function(key) {
            var isSend = false;
            var dataObj = getClover[key];
            var indexClover;
            var portClover;
            
            if(typeof dataObj.port === 'string' || typeof dataObj.port === 'number') 
            {
                indexClover = self.CloverMaps.MODULE0 - dataObj.port;
                portClover = 1 + (indexClover * 10);
                
                var time = self.cloverPortTimeList[portClover];
                if(dataObj.time > time) 
                {
                    isSend = true;
                    self.cloverPortTimeList[portClover] = dataObj.time;
                };
            }
            
            if(isSend) 
            {
                if(!self.isRecentDataClover(portClover, key, dataObj.data)) 
                {
                    self.cloverModuleMode[indexClover] = 1;  
                    self.recentCheckDataClover[portClover] = {
                        type: key,
                        data: dataObj.data
                    };
                    buffer = Buffer.concat([buffer, self.makeSensorReadBuffer(key, dataObj.port, dataObj.data)]);
                };
            }
            
            if(self.check_getClover_old != self.check_getClover)  
            {
                var keyInt = parseInt(key);
    
                self.check_getClover_old = self.check_getClover;
                if(self.sensorTypes.CLOVER_SW == keyInt)
                {
                    for(var z=0; z<self.cloverModuleMode.length; z++)
                    {
                        if(self.cloverModuleMode[z] == 1)  
                        {
                            dataObj.port = self.CloverMaps.MODULE0 - z;
                            buffer = Buffer.concat([buffer, self.makeSensorReadBuffer(key, dataObj.port, dataObj.data)]);
                        }
                    }
                }
            }
        });        
    }
    
    if(setClover)
    {
        var setKeys = Object.keys(setClover);
        setKeys.forEach(function (port) {
            var data = setClover[port];
            var isRecent = false;
            
            if(data)
            {
                if(self.cloverPortTimeList[port] < data.time) 
                {
                    port = parseInt(port);
                    
                    
                    
                    
                    
                    if(port == 0)  
                    {
                        if(!self.isRecentDataClover(port, data.type, data.data))
                        { 
                           self.recentCheckDataClover[port] = 
                           {
                               type: data.type,
                               data: data.data
                           };
                           port = self.CloverMaps.FND;  
                           
                           buffer = Buffer.concat([buffer, self.makeOutputBuffer(data.type, port, data.data)]);
                        }
                    }
                    else if(port <= 80)  
                    {
                        if(!self.isRecentDataClover(port, data.type, data.data))
                        {
                            self.recentCheckDataClover[port] = 
                            {
                                type: data.type,
                                data: data.data
                            };
                            
                            port = parseInt(port);
                            
                            if((port >= 1 ) && (port <= 10)) { port = self.CloverMaps.MODULE0; }
                            else if((port >= 11) && (port <= 20)) { port = self.CloverMaps.MODULE1; }
                            else if((port >= 21) && (port <= 30)) { port = self.CloverMaps.MODULE2; }
                            else if((port >= 31) && (port <= 40)) { port = self.CloverMaps.MODULE3; }
                            else if((port >= 41) && (port <= 50)) { port = self.CloverMaps.MODULE4; }
                            else if((port >= 51) && (port <= 60)) { port = self.CloverMaps.MODULE5; }
                            else if((port >= 61) && (port <= 70)) { port = self.CloverMaps.MODULE6; }
                            else if((port >= 71) && (port <= 80)) { port = self.CloverMaps.MODULE7; }
                            
                            var datas = new Buffer(2);
                            datas[0] = data.num;
                            datas[1] = data.data;
                            
                            buffer = Buffer.concat([buffer, self.makeOutputBuffer(data.type, port, datas)]);
                        }
                    }
                    else if(port <= 100)  
                    {
                        
                    }
                    else if(port == 101)  
                    {
                        if(!self.isRecentDataClover(port, data.type, data.data))
                        { 
                           self.recentCheckDataClover[port] = 
                           {
                               type: data.type,
                               data: data.data
                           };
                           port = self.CloverMaps.RGB_LED;  
                           
                           buffer = Buffer.concat([buffer, self.makeOutputBuffer(data.type, port, data.data)]);
                        }
                    }
                
                }
            }
            
        });
    }
    
    if(typeof tx_buffer == 'undefined') { tx_buffer = new Buffer([]); }
    if(typeof tx_time == 'undefined') { tx_time = 0; }
    
    if(buffer.length)
    {
        
        
        tx_buffer = Buffer.concat([tx_buffer, buffer]);
    }

    var now_time = new Date().getTime();
    var time_different = 0;
    
    time_different = now_time - tx_time;
    if(time_different > 10 )  
    {
        tx_time = now_time; 
        
        if(tx_buffer.length == 0)
        {
            buffer = new Buffer([]);
        }
        else if(tx_buffer.length <= 20)
        {
            buffer = tx_buffer.subarray(0, tx_buffer.length);
            tx_buffer = new Buffer([]);
        }
        else
        {
            buffer = tx_buffer.subarray(0, 20);
            tx_buffer = tx_buffer.subarray(20, tx_buffer.length);
        }
    }
    else 
    {
        buffer = new Buffer([]);
    }
    
    if(buffer.length) 
    {
        this.sendBuffers.push(buffer);
        
    }
};



Module.prototype.setSerialPort = function (sp) 
{
    var self = this;
    this.sp = sp;
};




Module.prototype.afterConnect = function(that, cb) 
{
    that.connected = true;
    if(cb) {
        cb('connected');
    }
};



Module.prototype.isRecentData = function(port, type, data)
{
    
    var self = this;
    var value;
    if(self.recentCheckData[port] == null)
    {
        self.recentCheckData[port] =
        {
            type : 0,
            data : 0,
            time : 0,
        };
        return false;
    }
    
    if((self.sensorTypes.TONE == type) && (typeof data != 'number'))
    {
        if(self.recentCheckData[port].data.value == data.value)
        {
            return true;
        }
        else
        {
            return false;
        }
    }
    else if (self.sensorTypes.MOTOR_L == type || self.sensorTypes.MOTOR_R == type)
    {
        
        return true;
    }
    else if(self.recentCheckData[port].type == type && self.recentCheckData[port].data == data)
    {
        return true;
    }
    return false;
}



Module.prototype.isRecentDataClover = function(port, type, data)
{
    var self = this;
    if(self.recentCheckDataClover[port] == null)
    {
        self.recentCheckDataClover[port] =
        {
            type : 0,
            data : 0,
            time : 0,
        };
        return false;
    }
    
    if(self.recentCheckDataClover[port].type == type && self.recentCheckDataClover[port].data == data)
    {
        return true;
    }
    return false;
}



/*  ff 55 len idx action device port  slot  data a
     0  1  2   3   4      5      6     7     8       */

Module.prototype.makeSensorReadBuffer = function(device, port, data) {
    var buffer;
    
    var dummy = new Buffer([10]);
    if(device == this.sensorTypes.ULTRASONIC) 
    {
        buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, port[0], port[1], 10]);
    }
    else if (device == this.sensorTypes.CLOVER_SW)
    {
        buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, port, 0, 10]);
    }
    else if(device == this.sensorTypes.MOTOR_L || device == this.sensorTypes.MOTOR_R) 
    {
        buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, port[0], port[1], 10]);
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




Module.prototype.makeOutputBuffer = function(device, port, data) {
    var buffer;
    var value = new Buffer(2);
    var dummy = new Buffer([10]);
    switch(device) {
        case this.sensorTypes.SERVO:
        case this.sensorTypes.DIGITAL:
        case this.sensorTypes.PWM: 
        {
            value.writeInt16LE(data);
            buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, value, dummy]);
            break;
        }
        case this.sensorTypes.TONE: {
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
        }
        case this.sensorTypes.MOTOR_R: 
        case this.sensorTypes.MOTOR_L: 
        {
            var direction = new Buffer(2);
            var speed = new Buffer(2);
            if($.isPlainObject(data)) {
                direction.writeInt16LE(data.direction);
                speed.writeInt16LE(data.speed);
            } else {
                direction.writeInt16LE(0);
                speed.writeInt16LE(0);
            }
            buffer = new Buffer([255, 85, 8, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, direction, speed, dummy]);
            
            break;
        }
        case this.sensorTypes.ULTRASONIC : 
        {
            break;
        }
        case this.sensorTypes.CLOVER_FND : 
        {
            data = parseInt(data);
    
            
            if(data < 0 ) { data = 0; }
            else if(data > 9999) { data = 9999; }
            
            value = this.FloatToByte(data);
            
            buffer = new Buffer([255, 85, 9, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, value, dummy]);
            
            break;
        }
        case this.sensorTypes.CLOVER_LED :
        {
            var module_id = this.CloverMaps.MODULE0 - port;  
            var led_num = data[0];
            var led_status = data[1];
            
            this.cloverModuleData[module_id] &= ~(0x01 << led_num);
            this.cloverModuleData[module_id] |= (led_status << led_num);
        
            value[0] = this.cloverModuleData[module_id];
            
            buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, value, dummy]);
            
            break;
        }
        case this.sensorTypes.CLOVER_RGB :
        {
            value = new Buffer(4);
            value[0] = (data & 0xFF000000) >> 24;
            value[1] = (data & 0x00FF0000) >> 16;
            value[2] = (data & 0x0000FF00) >> 8;
            value[3] = (data & 0x000000FF) >> 0;
            
            buffer = new Buffer([255, 85, 9, sensorIdx, this.actionTypes.SET, device, 0x0A]);
            buffer = Buffer.concat([buffer, value, dummy]);
            break;
        }
    }

    return buffer;
};



Module.prototype.getDataByBuffer = function(buffer) 
{
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







Module.prototype.Console_Rx_Data = function(buffer)  
{
        console.log('buffer length : ' + buffer.length);
        var hexString = '';
        for(var i=0; i<buffer.length; i++)
        {
            if(buffer[i] < 0x10)
                hexString += '0';
            
            hexString += buffer[i].toString(16).toUpperCase();
            hexString += ' ';
        }
        console.log(hexString);
}



Module.prototype.Console_Tx_Data = function(buffer)  
{
    var hexString = '';
    for(var i=0; i<buffer.length; i++)
    {
        if(buffer[i] <= 0x0f) { hexString += '0' + buffer[i].toString(16).toUpperCase(); }
        else { hexString += buffer[i].toString(16).toUpperCase(); }
        hexString += ' ';
    }
    console.log('Tx Data : 0x' + hexString);
}



Module.prototype.FloatToByte = function(float_value)
{
    
    if(typeof float_value != 'number') { return null; }
    
    
    var f32;  
    var f32_byte;  
    var f32_byte_reversal;
    
    
    f32 = new Float32Array(1);
    f32[0] = float_value;
    
    
    f32_byte = new Uint8Array(f32.buffer);
    
    
    f32_byte_reversal = new Buffer(4);
    f32_byte_reversal[0] = f32_byte[0];
    f32_byte_reversal[1] = f32_byte[1];
    f32_byte_reversal[2] = f32_byte[2];
    f32_byte_reversal[3] = f32_byte[3];
    
    return f32_byte_reversal;
}



Module.prototype.ByteToFloat = function(arr_value)
{
    
    if(arr_value.length != 4) { return null; }
    if(typeof arr_value[0] != 'number') { return null; }
    if(typeof arr_value[1] != 'number') { return null; }
    if(typeof arr_value[2] != 'number') { return null; }
    if(typeof arr_value[3] != 'number') { return null; }
    
    
    var f32;  
    var f32_byte;  
    
    
    f32_byte = new Uint8Array(4);
    f32_byte[0] = arr_value[3];
    f32_byte[1] = arr_value[2];
    f32_byte[2] = arr_value[1];
    f32_byte[3] = arr_value[0];
    
    f32 = new Float32Array(f32_byte.buffer);
    
    return f32[0];
}






Module.prototype.disconnect = function(connect) {
    var self = this;
    connect.close();
    if(self.sp) {
        delete self.sp;
    }
};



Module.prototype.reset = function() 
{
    consloe.log('reset');
    this.lastTime = 0;
    this.lastSendTime = 0;

     this.sensorData.PULSEIN = {
    }
};



module.exports = new Module();


