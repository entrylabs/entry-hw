function Module()
{
    this.sp = null;
    this.sensorTypes = 
	{
        ALIVE: 0,
        SENSOR: 1,
        MOTOR: 2,
        BUZZER: 3,
        RGBLED: 4,
        TONE: 5,
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
        SENSOR: 
		{
            Brightness: 0,
            BLeft_IR: 0,
            Front_IR: 0,
            BRight_IR: 0,
            Sound: 0,
            Right_IR: 0,
            BMid_IR: 0,
            Left_IR: 0,
            Real_T: 0,
            Real_H: 0,
        }
    }

    this.defaultOutput = {};

    this.recentCheckData = {};

    this.sendBuffers = [];

    this.lastTime = 0;
    this.lastSendTime = 0;
    this.isDraing = false;
}

var sensorIdx = 0;

// Handler Data 
Module.prototype.init = function(handler, config)   /// 초기설정, 엔트리 브라우저와 연결되었을 때 호출됨
{

};

// Serial Port 
Module.prototype.setSerialPort = function (sp)   /// 시리얼포트 정보를 가지고오기, 최초 연결시도 성공 후에 호출
{
    var self = this;
    this.sp = sp;
};

// Hardware
Module.prototype.requestInitialData = function() /// 초기 송신 데이터(최초 연결시 디바이스에 보낼 데이터)
{
    return null;
    //return this.makeSensorReadBuffer(this.sensorTypes.ANALOG, 0);  
};
   
// Hardware Vaildation
Module.prototype.checkInitialData = function(data, config)    /// 초기 수신데이터 체크
{
    // 최초 연결시도에서 디바이스의 데이터를 받아, 원하는 데이터가 맞는지 판단하는 로직
    // requestInitialData 가 선언되어있다면 필수
    return true;
};

Module.prototype.afterConnect = function(that, cb) 
{
    ///cb 은 화면의 이벤트를 보내는 로직입니다. 여기서는 connected 
    //라는 신호를 보내 강제로 연결됨 화면으로 넘어갑니다.
    that.connected = true;
    if (cb) {
        cb('connected');
    };
};

// 1. Hardware Vaildation
Module.prototype.validateLocalData = function(data) 
{
    return true;
};

// 2. getDataByBuffer
Module.prototype.getDataByBuffer = function(buffer)   // 해당 코드 내에서만 쓰는 함수입니다.
{
    var datas = [];
    var lastIndex = 0;
	
    buffer.forEach(function (value, idx) 
	{
        //console.log(value, "  :  ", idx);	
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
// 3. Hardware
Module.prototype.handleLocalData = function(data) 
{  
    // 하드웨어에서 보내준 정보를 가공합니다. 여기선 하드웨어에서 정보를 읽어서 처리하지 않습니다.
    var self = this;
    var datas = this.getDataByBuffer(data);	
  
    datas.forEach(function (data) 
	{
        if(data.length <= 4 || data[0] !== 255 || data[1] !== 85) {
            return;
        }           
		var readData = data.subarray(2, data.length);

        var type = readData[readData.length - 1];
        var port = readData[readData.length - 2];
		
        var value;         
        
        switch(readData[0]) {
            case self.sensorValueSize.FLOAT:   //2
			{
                value = new Buffer(readData.subarray(1, 5)).readFloatLE();
                value = Math.round(value * 100) / 100;
                //console.log(value, "  :  ", port);	
                break;
            }
            case self.sensorValueSize.SHORT: { //3
                value = new Buffer(readData.subarray(1, 3)).readInt16LE();
                break;
            }
            case self.sensorValueSize.STRING: { //4
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
            case self.sensorTypes.SENSOR: {
                self.sensorData.SENSOR[port] = value;
                
                break;
            }
            default: {
                break;
            }
        }
    });
};


// 4. 
Module.prototype.requestRemoteData = function(handler) 
{
    // 디바이스에서 데이터를 받아온 후, 브라우저로 데이터를 보내기 위해 호출되는 로직. handler 를 세팅하는 것으로 값을 보낼 수 있다.
    // handler.write(key, value) 로 세팅한 값은 Entry.hw.portData 에서 받아볼 수 있다.
    /// 엔트리에 전달할 데이터. 이 코드에서는 하드웨어에서 어떤 정보도 전달하지 않습니다.
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

var Motor_loop_turn = true;
var One_Buzzer_loop_turn = true;
var One_Tone_loop_turn = true;
var LED_loop_turn = true;
var pre_data_time_tone = 0;
var pre_data_value_tone = 0;
var pre_data_value_buzzer = 0;
var pre_data_mode_motor = 0;
var pre_data_value_motor = 0;
var pre_data_r_led = 0;
var pre_data_g_led = 0;
var pre_data_b_led = 0;

// 5. 
Module.prototype.handleRemoteData = function(handler) 
{
    // 엔트리 브라우저에서 온 데이터를 처리한다. handler.read 로 브라우저의 데이터를 읽어올 수 있다.
    // handler 의 값은 Entry.hw.sendQueue 에 세팅한 값과 같다.
    /// 엔트리에서 전달된 데이터 처리(Entry.hw.sendQueue로 보낸 데이터)
    var self = this;
    var getDatas = handler.read('GET');
    var setDatas = handler.read('SET') || this.defaultOutput;
    var time = handler.read('TIME');
    var buffer = new Buffer([]);
        
    if(getDatas) 
	{			
        var keys = Object.keys(getDatas);         

        keys.forEach(function(key)   /// key에 해당하는 데이터를 분석하여 처리
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
                if(!self.isRecentData(dataObj.port, key, dataObj.data))   // 여기서의  비교로 같은 명령어의 반복실행을 방지
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

    if(setDatas)   // 출력
	{
        var setKeys = Object.keys(setDatas);
        setKeys.forEach(function (port)  /// port에 해당하는 데이터를 분석하여 처리
		{
            var data = setDatas[port];
            if(data) 
			{
                if(self.digitalPortTimeList[port] < data.time)  // 데이터 생성시간과 현 시간보다 이전 이면 
                {
                    self.digitalPortTimeList[port] = data.time;

                    if(!self.isRecentData(port, data.type, data.data)) 
                    {
                        self.recentCheckData[port] = 
                        {
                            type: data.type,
                            data: data.data
                        }
                        //console.log("data.type: ", data.type);
                        //console.log("loop_turn: ", Motor_loop_turn);
                        //buffer = Buffer.concat([buffer, self.makeOutputBuffer(data.type, port, data.data)]);
                        
                        switch(data.type) 
                        {
                            case 2:  // 모터제어
                                //console.log("모터: ", data.data.value, pre_data_value_motor, data.data.mode, pre_data_mode_motor);
                                if((data.data.value != pre_data_value_motor) || (data.data.mode != pre_data_mode_motor))
                                {
                                    buffer = Buffer.concat([buffer, self.makeOutputBuffer(data.type, port, data.data)]);
                                    pre_data_mode_motor = data.data.mode;
                                    pre_data_value_motor = data.data.value;
                                }
                                else{}
                                break;
                            case 3:  // Buzzer제어
                                //console.log("Buzzer: ", data.data, pre_data_value_buzzer);
                                if(!One_Tone_loop_turn || (data.data != pre_data_value_buzzer))
                                {
                                    buffer = Buffer.concat([buffer, self.makeOutputBuffer(data.type, port, data.data)]);
                                    pre_data_value_buzzer = data.data;
                                    pre_data_value_tone = 0;
                                    pre_data_time_tone = 0;
                                    One_Tone_loop_turn = true;
                                }
                                else{}
                                break;
                            case 4:  // RGB제어
                                //console.log("LED: ", data.data.r, pre_data_r_led, data.data.g, pre_data_g_led, data.data.b, pre_data_b_led);
                                if((data.data.r != pre_data_r_led) || (data.data.g != pre_data_g_led) || (data.data.b != pre_data_b_led))
                                {
                                    buffer = Buffer.concat([buffer, self.makeOutputBuffer(data.type, port, data.data)]);
                                    pre_data_r_led = data.data.r;
                                    pre_data_g_led = data.data.g;
                                    pre_data_b_led = data.data.b;
                                }
                                else{}
                                break;
                            case 5:  // Tone 제어
                                //console.log("Tone: ", data.data.value, pre_data_value_tone, data.data.duration, pre_data_time_tone);
                                if((data.data.value != pre_data_value_tone) || (data.data.duration != pre_data_time_tone))
                                {
                                    buffer = Buffer.concat([buffer, self.makeOutputBuffer(data.type, port, data.data)]);
                                    pre_data_value_tone = data.data.value;
                                    pre_data_time_tone = data.data.duration;
                                }
                                else{}
                                break;
                            default:
                                buffer = Buffer.concat([buffer, self.makeOutputBuffer(data.type, port, data.data)]);
                                break;
                        }
                    }     /// 전송 패킷 생성하여 버퍼에 저장
                }
            }
        });
    }

    if(buffer.length) {
        this.sendBuffers.push(buffer);
    }
};

// 6. Hardware
Module.prototype.requestLocalData = function()  // 하드웨어에 명령을 전송합니다.
{
    // 디바이스로 데이터를 보내는 로직. control: slave 인 경우 duration 주기에 맞춰 디바이스에 데이터를 보낸다.
    // return 값으로 버퍼를 반환하면 디바이스로 데이터를 보내나, 아두이노의 경우 레거시 코드를 따르고 있다.
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
        // 톤 명령이 아니고 타입과 데이터가 같고 같은 자료형 이면 
		{
            isRecent = true;
        }
    }
    //   isRecent = true;   참 들어가면 통신 데이터 무조건 안 보냄.
    
    return isRecent;
}


/*
ff 55 len idx action device port  slot  data a
0  1  2   3   4      5      6     7     8
*/

Module.prototype.makeSensorReadBuffer = function(device, port, data)   // 센서값 리드하는 패킷
{
    var buffer;
    var dummy = new Buffer([10]);      
    
    if(!data) 
	{
        buffer = new Buffer([255, 85, 5, sensorIdx, this.actionTypes.GET, device, port, 10]);	
        //console.log("GET: %s %s %s %s", sensorIdx, this.actionTypes.GET, device, port);	            
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
Module.prototype.makeOutputBuffer = function(device, port, data)     /// 출력 설정
{
    var buffer;
    var value = new Buffer(2);
    var dummy = new Buffer([10]);

    switch(device) 
    {    
        case this.sensorTypes.MOTOR:  // 모터제어
                var mode = new Buffer(2);
                mode.writeInt16LE(data.mode);
                value.writeInt16LE(data.value);
                buffer = new Buffer([255, 85, 9, sensorIdx, this.actionTypes.SET, device, port]);
                buffer = Buffer.concat([buffer, mode, value, dummy]);
                //console.log("MOTOR: ", buffer);                   
                break;   

        case this.sensorTypes.BUZZER:   // 스피커 제어
    //				value.writeInt16LE(data); //writeFloatLE//!@#$
                buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, device, port, data]);
                buffer = Buffer.concat([buffer, dummy]);
                //console.log("Buzzer : ", buffer);	
                break;

        case this.sensorTypes.RGBLED: 
                buffer = new Buffer([255, 85, 8, sensorIdx, this.actionTypes.SET, device, port, data.r, data.g, data.b]);
                buffer = Buffer.concat([buffer, dummy]);
                //console.log("RGBLED: ", buffer);
                break;
                                
        case this.sensorTypes.TONE:           // 스피커 제어 
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
                buffer = new Buffer([255, 85, 9, sensorIdx, this.actionTypes.SET, device, port]);
                buffer = Buffer.concat([buffer, value, time, dummy]);    
                //console.log("Tone : ", buffer);  
                One_Tone_loop_turn = false;               
                break;
    }
    return buffer;
};

Module.prototype.disconnect = function(connect) 
{
    // 커넥터가 연결해제될 때 호출되는 로직, 스캔 정지 혹은 디바이스 연결 해제시 호출된다.
    var self = this;
	
    connect.close();
    if(self.sp) {
        delete self.sp;
    }
};

// Connect
Module.prototype.reset = function() 
{
        // 엔트리 브라우저와의 소켓 연결이 끊어졌을 때 발생하는 로직.
    this.lastTime = 0;
    this.lastSendTime = 0;
};

module.exports = new Module();
