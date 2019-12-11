//---[ 모듈에서 사용할 필드 선언]-----------------------------------------------
function Module() 
{
    this.sp = null;
    this.sensorTypes = {
		 ALIVE :          0,               // 사용안함
         DIGITAL :        1,               // 디지털 포트 제어용
         ANALOG :         2,               // 아나로그 포트 입력용
         PWM :            3,               // 디지털 포트 PWM 출력용
         SERVO :          4,               // 서보모터 제어용
         TONE :           5,               // 부저 소리 출력용
         PULSEIN :        6,               // 사용안함
         ULTRASONIC :     7,               // 초음파센서 거리측적용
         TIMER :          8,               // 사용안함
         MOTOR_L :        9,               // 왼쪽 DC모터
         MOTOR_R :        10,              // 오른쪽 DC모터
         CLOVER_FND :     11,              // 클로버 FND 모듈
         CLOVER_SW :      12,              // 클로버 SW모듈
         CLOVER_LED :     13,              // 클로버 LED모듈
         CLOVER_RGB :     14,              // 클로버 RGB모듈
    },
    
    // 입출력 포트 설정 - I/O Mapping
    
    this.pinMaps = 
    {
        SW1 :            2,               // Switch1
        SW2 :            7,               // Switch2
        LED_G :          17,              // Green LED
        LED_B :          16,              // Blue LED
        BUZZ :           4,               // Buzzer
        CDS :            7,               // CDS 센서
        
        Digital_Port0 :  17,              // 0번, Green LED
        Digital_Port1 :  16,              // 1번, Blue LED
        Digital_Port2 :  3,               // 2번, Servo Motor1
        Digital_Port3 :  5,               // 3번, Servo Motor2
        Digital_Port4 :  6,               // 4번, Servo Motor3
        Digital_Port5 :  9,               // 5번, Servo Motor4
        Digital_Port6 :  10,              // 6번, Servo Motor5
        Digital_Port7 :  11,              // 7번, MOSI
        Digital_Port8 :  12,              // 8번, MISO
        Digital_Port9 :  13,              // 9번, SCK
        
        Analog_Port0 :   14,              // 0번, AD0
        Analog_Port1 :   15,              // 1번, AD1
        
        DIR_L :           5,              // 왼쪽 모터의 방향 
        EN_L :            6,              // 왼쪽 모터의 구동 (1:off)
        DIR_R :           9,              // 오른쪽 모터의 방향
        EN_R :            10,             // 오른쪽 모터의 구동 (1:off)
        
        Ultrasonic_TRIG : 13,             // 초음파 센서
        Ultrasonic_ECHO : 12,             // 초음파 센서
    },
    
    this.CloverMaps =
    {
        FND :             0,              // FND
        MODULE0 :         39,             // 클로버 모듈 0번 (0x27)
        MODULE1 :         38,             // 클로버 모듈 2번 (0x26)
        MODULE2 :         37,             // 클로버 모듈 3번 (0x25)
        MODULE3 :         36,             // 클로버 모듈 4번 (0x24)
        MODULE4 :         35,             // 클로버 모듈 5번 (0x23)
        MODULE5 :         34,             // 클로버 모듈 6번 (0x22)
        MODULE6 :         33,             // 클로버 모듈 7번 (0x21)
        MODULE7 :         32,             // 클로버 모듈 8번 (0x20)
        RGB_LED :         0,              // 클로버에서는 밝기 값 사용할 예정
    },

    this.actionTypes = {
        GET: 1,
        SET: 2,
        RESET: 3
    };

    this.sensorValueSize = {
        FLOAT: 2,
        SHORT: 3,
        BIT: 4,
    }

    this.digitalPortTimeList = new Buffer(18);  // pin번호 + 1
    this.digitalPortList =  new Buffer(18) ;    // pin번호 + 1
    

    // port list (클로버 module 고유 핀 번호)
    // 0 : fnd
    // 1 ~ 10 : module0
    // 11 ~ 20 : module1
    // 21 ~ 30 : module2
    // 31 ~ 40 : module3
    // 41 ~ 50 : module4
    // 51 ~ 60 : module5
    // 61 ~ 70 : module6
    // 71 ~ 80 : module7
    // 101 : rgb led
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
            '17': 0
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
            '8': 0
        },
        PULSEIN: { },
        TIMER: 0,
    }

    this.defaultOutput = { };
    this.recentCheckData = { };
    this.recentCheckDataClover = { };
    this.sendBuffers = [];
    this.receiveBuffer = [];

    this.lastTime = 0;
    this.lastSendTime = 0;
    this.isDraing = false;
    
    // SW값 경우 개별제어가 아니므로 기존값을 갖고 있어되며,
    // 모듈 위치가 바뀌기 때문에 Data를 저장할 모듈별 각 변수가 필요.
    this.cloverModuleData = new Buffer(8);  // Clover Module Data 0 번
}

var sensorIdx = 0;

//---[ 최초 커넥션이 된 후 초기 설정 ]----------------------------------------------------------------------------------
Module.prototype.init = function(handler, config) {};



//---[ 연결 후 초기에 송신할 데이터가 필요한 경우 사용 ]----------------------------------------------------------------
Module.prototype.requestInitialData = function() 
{
    for(var i=0; i<this.cloverModuleData.length; i++) { this.cloverModuleData[i] = 0xFF; }
    return this.makeSensorReadBuffer(this.sensorTypes.ANALOG, 0);
};



//---[ 연결 후 초기에 수신받아서 정상연결인지 확인해야 하는 경우 사용 ]-------------------------------------------------
Module.prototype.checkInitialData = function(data, config) {
    return true;
    // 이후에 체크 로직 개선되면 처리
    // var datas = this.getDataByBuffer(data);
    // var isValidData = datas.some(function (data) {
    //     return (data.length > 4 && data[0] === 255 && data[1] === 85);
    // });
    // return isValidData;
};



//---[ 하드웨어로 보낼 데이터 ]-----------------------------------------------------------------------------------------
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



//---[ 하드웨어로부터 온 데이터 ]---------------------------------------------------------------------------------------
/*  ff 55 idx size data a  */
Module.prototype.handleLocalData = function(data) 
{
    var self = this;
    var stx_ok;  // stx 검출용 boolean
    var data;  // data 임시보관용
   
    // buffer에 저장.    
    if(this.receiveBuffer.length == 0)
    {
        this.receiveBuffer = data;
    }
    else
    {
        this.receiveBuffer = Buffer.concat([this.receiveBuffer, data]);
    }
  
    // 데이터 검출 시작.
    while(true)
    {
        // var init
        stx_ok = false;
        data_ok = false;
        
        if(this.receiveBuffer.length >= 2 )  // stx 검출
        {
            if(this.receiveBuffer[0] == 0xFF && this.receiveBuffer[1] == 0x55)
            {
                stx_ok = true;
            }
            else
            {
                // 앞의 1byte삭제 후 다시 stx검출
                this.receiveBuffer = this.receiveBuffer.subarray(1, this.receiveBuffer.length);
                //console.log('stx error');
            }
        }
        else
        {
            // 2byte 미만이면 break;
            break;
        }
        
        if(stx_ok == true)
        {
            // 4byte Data
            if(this.receiveBuffer.length >= 4 && this.receiveBuffer[2] == 0x0D && this.receiveBuffer[3] == 0x0A)
            {
                // Call ok
                data_ok = true;
                this.receiveBuffer = this.receiveBuffer.subarray(4, this.receiveBuffer.length);  // 4byte buffer delete
            }
            
            // 11byte Data
            if(data_ok == false && this.receiveBuffer.length >= 11 && this.receiveBuffer[9] == 0x0D && this.receiveBuffer[10] == 0x0A)
            {
                // 11byte data
                data_ok = true;
                data = this.receiveBuffer.subarray(0, 11);  // Data 추출
                this.handleLocalDataProcess(data);  // Data 처리.
                this.receiveBuffer = this.receiveBuffer.subarray(11, this.receiveBuffer.length);  // 11byte buffer delete
            }
            
            // 12byte Data(max)
            if(data_ok == false && this.receiveBuffer.length >= 12 && this.receiveBuffer[10] == 0x0D && this.receiveBuffer[11] == 0x0A)
            {
                // 12byte data
                data_ok = true;
                data = this.receiveBuffer.subarray(0, 12);  // Data 추출
                this.handleLocalDataProcess(data);  // Data 처리.
                this.receiveBuffer = this.receiveBuffer.subarray(12, this.receiveBuffer.length);  // 12byte buffer delete
            }
            
            // 데이터 최대 길이만큼 데이터 format 일치 하지 않으면, 해당구간 삭제
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
                
        // buffer가 많으면 초기화.
        if(this.receiveBuffer.length > 0xFF)
        {
            // 테스트 결과, 10ms 이하 속도로 수신받아도 데이터 전부 즉시처리되어,
            // buffer clear event 발생되지 않으나, 노이즈 예방차원에서 에러처리 함.
            this.receiveBuffer = [];
            break;
        }
    }
};



// handleLocalData 함수( 하드웨어에서 받은 데이터) 에서 추출된 데이터 처리
Module.prototype.handleLocalDataProcess = function(data) 
{
    var self = this;
    var dataType;
    var value;
    var port;
    var device;

    // 데이터 길이에 따른 Device ID 값위치 조정.
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
    
    dataType = data[2];  // DataType
    port = data[7];  // Port
    
    // float 데이터 처리
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
    
    // 각 pin에 데이터 업데이트
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
                port = self.CloverMaps.MODULE0 - port + 1;  // 0부터 시작이아니라 1번부터시작
                self.sensorData.CLOVER[port] = value;
                break;
        }
        case self.sensorTypes.TIMER :
           self.sensorData.TIMER[port] = value;
           break;

        // SOUND_IN 관련 변수 없어서 일단 주석처리. (? 에러 발생하지 않음...?)
        // case self.sensorTypes.SOUND_IN: {
            // self.sensorData.ANALOG[port] = value;
            // break;
        // }
    }
        
    //console.log(self.sensorData.ULTRASONIC);
};



//---[ 하드웨어로부터 온 데이터의 검증]---------------------------------------------------------------------------------
Module.prototype.validateLocalData = function(data) 
{
    return true;
};



//---[ 소프트웨어로 전달할 데이터 ]-------------------------------------------------------------------------------------
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
};



//---[ 소프트웨어로부터 온 데이터 ]-------------------------------------------------------------------------------------
Module.prototype.handleRemoteData = function(handler) 
{
    var self = this;
    var getDatas = handler.read('GET');
    var setDatas = handler.read('SET') || this.defaultOutput;
    var time;  //  = handler.read('TIME');  변수로만 사용함.
    var getClover = handler.read('GET_CLOVER');
    var setClover = handler.read('SET_CLOVER');
    var buffer = new Buffer([]);
    
    if(getDatas) 
    {
        var keys = Object.keys(getDatas);
        
        keys.forEach(function(key) {
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
                if(!self.isRecentData(dataObj.port, key, dataObj.data)) 
                {
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
                        buffer = Buffer.concat([buffer, self.makeOutputBuffer(data.type, port, data.data)]);  // 원본
                    }
                }
            }
        });
    }
    
    if(getClover) 
    {
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
                //console.log('indexClover : ' + indexClover + ' / '+'portClover : ' + portClover);
                
                var time = self.cloverPortTimeList[portClover];
                if(dataObj.time > time) 
                {
                    isSend = true;
                    self.cloverPortTimeList[portClover] = dataObj.time;
                }
            }
            
            if(isSend) 
            {
                if(!self.isRecentDataClover(portClover, key, dataObj.data)) 
                {
                    self.recentCheckDataClover[portClover] = {
                        type: key,
                        data: dataObj.data
                    }
                    buffer = Buffer.concat([buffer, self.makeSensorReadBuffer(key, dataObj.port, dataObj.data)]);
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
                    
                    // self.makeOutputBuffer() 에서 case 구분 인자값은 data.type (sensorTypes)으로
                    // 구분해서 데이터를 처리함.
                    // ※ port 번호는 self.makeOutputBuffer()에 영향을 주지 않음.
                    
                    if(port == 0)  // FND
                    {
                        if(!self.isRecentDataClover(port, data.type, data.data))
                        { 
                           self.recentCheckDataClover[port] = 
                           {
                               type: data.type,
                               data: data.data
                           }
                           port = self.CloverMaps.FND;  // port값으로 사용하지 않으며, CloverID로 값 전송
                           
                           buffer = Buffer.concat([buffer, self.makeOutputBuffer(data.type, port, data.data)]);
                        }
                    }
                    else if(port <= 80)  // MODULE 0 ~ 7번
                    {
                        if(!self.isRecentDataClover(port, data.type, data.data))
                        {
                            self.recentCheckDataClover[port] = 
                            {
                                type: data.type,
                                data: data.data
                            }
                            
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
                    else if(port <= 100)  //
                    {
                        // 예비 (아무짓도 안함)
                    }
                    else if(port == 101)  // LED RGB
                    {
                        if(!self.isRecentDataClover(port, data.type, data.data))
                        { 
                           self.recentCheckDataClover[port] = 
                           {
                               type: data.type,
                               data: data.data
                           }
                           port = self.CloverMaps.RGB_LED;  // led 밝기 조절로 사용할 예정임.
                           
                           buffer = Buffer.concat([buffer, self.makeOutputBuffer(data.type, port, data.data)]);
                        }
                    }
                
                }
            }
            
        });
    }
    
    if(buffer.length) 
    {
        this.sendBuffers.push(buffer);
        this.Console_Tx_Data(buffer);
    }
};






//---[ 추가적인 함수 들.. ]---------------------------------------------------------------------------------------------

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



Module.prototype.isRecentData = function(port, type, data) {
    var isRecent = false;

    if(port in this.recentCheckData) {
        if(type != this.sensorTypes.TONE && this.recentCheckData[port].type === type && this.recentCheckData[port].data === data) {
            isRecent = true;
        }
    }

    return isRecent;
}

Module.prototype.isRecentDataClover = function(port, type, data) {
    var isRecent = false;

    if(port in this.recentCheckDataClover) 
    {
        if(this.recentCheckDataClover[port].type === type && this.recentCheckDataClover[port].data === data)
        {
            isRecent = true;
        }
    }

    return isRecent;
}



/*  ff 55 len idx action device port  slot  data a
     0  1  2   3   4      5      6     7     8       */

Module.prototype.makeSensorReadBuffer = function(device, port, data) {
    var buffer;
    var dummy = new Buffer([10]);
    if(device == this.sensorTypes.ULTRASONIC) 
    {
        console.log('ULTRASONIC');
        buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, port[0], port[1], 10]);
    }
    else if (device == this.sensorTypes.CLOVER_SW)
    {
        console.log('CLOVER_SW ' + this.sensorTypes.CLOVER_SW);
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



//0xff 0x55 0x6 0x0 0x1 0xa 0x9 0x0 0x0 0xa
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
    
            // 예외처리 범위값 처리
            if(data < 0 ) { data = 0; }
            else if(data > 9999) { data = 9999; }
            
            value = this.FloatToByte(data);
            
            buffer = new Buffer([255, 85, 9, sensorIdx, this.actionTypes.SET, device, port]);
            buffer = Buffer.concat([buffer, value, dummy]);
            
            break;
        }
        case this.sensorTypes.CLOVER_LED :
        {
            var module_id = this.CloverMaps.MODULE0 - port;  // 0번부터 시작
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
            console.log('data : ' + data);
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






//---[ Clover 추가함수 ] -----------------------------------------------------------------------------------------------
Module.prototype.Console_Rx_Data = function(buffer)  // Debug용
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



Module.prototype.Console_Tx_Data = function(buffer)  // Debug용
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
    // 에러처리 : number 아니면 리턴 (float도 8byte number로 취급)
    if(typeof float_value != 'number') { return null; }
    
    // 변수 선언
    var f32;  // float
    var f32_byte;  // byte
    var f32_byte_reversal;
    
    // 변수 초기화 및 값 대입
    f32 = new Float32Array(1);
    f32[0] = float_value;
    
    // float -> byte 변환
    f32_byte = new Uint8Array(f32.buffer);
    
    // 값 buffer로 변경
    f32_byte_reversal = new Buffer(4);
    f32_byte_reversal[0] = f32_byte[0];
    f32_byte_reversal[1] = f32_byte[1];
    f32_byte_reversal[2] = f32_byte[2];
    f32_byte_reversal[3] = f32_byte[3];
    
    return f32_byte_reversal;
}



Module.prototype.ByteToFloat = function(arr_value)
{
    // 에러처리 : 배열이 4개가 아니면 return, 정수가 아니면 return
    if(arr_value.length != 4) { return null; }
    if(typeof arr_value[0] != 'number') { return null; }
    if(typeof arr_value[1] != 'number') { return null; }
    if(typeof arr_value[2] != 'number') { return null; }
    if(typeof arr_value[3] != 'number') { return null; }
    
    // 변수 선언
    var f32;  // float
    var f32_byte;  // byte
    
    // 변수 초기화 및 값 대입
    f32_byte = new Uint8Array(4);
    f32_byte[0] = arr_value[3];
    f32_byte[1] = arr_value[2];
    f32_byte[2] = arr_value[1];
    f32_byte[3] = arr_value[0];
    
    f32 = new Float32Array(f32_byte.buffer);
    
    return f32[0];
}





//---[ 그외.. ]---------------------------------------------------------------------------------------------------------
Module.prototype.disconnect = function(connect) {
    var self = this;
    connect.close();
    if(self.sp) {
        delete self.sp;
    }
};



Module.prototype.reset = function() 
{
    this.lastTime = 0;
    this.lastSendTime = 0;

     this.sensorData.PULSEIN = {
    }
};



module.exports = new Module();
