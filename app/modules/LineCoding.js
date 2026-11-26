function Module() {
    this.sp = null;
    this.sensorTypes = 
	{
        ALIVE: 0,
        DIGITAL: 1,
        ANALOG: 2,
        //BUZZER: 3,
        SERVO: 4,
        TONE: 34,
        TEMP: 6,
        USONIC: 7,
        TIMER: 8,
        RD_BT: 9,
        WRT_BT: 10,
        RGBLED: 11,
        MOTOR: 12,
        RGBLEDSHOW: 13,
        PWM: 32,
        USONIC_SET: 33,
        I2C_SET: 34,
        LCD_SET: 40,
        LINE_EASY: 51,
        LINE_FW_SPEED: 55,
        LINE_TURN_SPEED: 56,
        LINE_CROSS_TIME: 57,
        LINE_EASY_MOTOR: 58,
        LINE_RESTART: 60,
        LINE_DELAY: 61,
        LINE_LINE: 62,
        LINE_TURN: 63,
        LINE_MOTOR: 64,
        LINE_BMOTOR: 65,
        LINE_BWMOTOR: 66,
        LINE_WHEEL: 67,
        LINE_SERVO: 70,
        LINE_SSERVO: 71,
        LINE_PORT: 72,
        LINE_BUZZER: 73,
        LINE_LED: 74,
        LINE_LINEDELAY: 75,
        LINE_SLINE: 76,
        LINE_LINEFIND: 77,
        LINE_LINELOST: 78,
        LINE_CLINE: 79,
        LINE_CLINE2: 80,
        LINE_FFMOTOR: 90,
        LINE_BBMOTOR: 91,
        LINE_MOTORSTOP: 92,
        LINE_PLINE: 93,
        LINE_START: 94,
        LINE_TIMER: 95,
        LINE_COLOR: 96,
        LINE_ABSH: 97,
        LINE_BLACKFORWARDF: 98,
        LINE_REMOT: 100,

    };

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
        STRING : 4,
        SHORTSHORT: 5,
    };

    this.digitalPortTimeList = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    this.sensorData = 
	{
        USONIC: 0,
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
            '14': 0,        //// 아날로그 포트도 디지털로 사용하기 위해 추가함
            '15': 0,
            '16': 0,
            '17': 0,
            '18': 0,
            '19': 0,
        },
        ANALOG: 
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
        },
        TEMP: 0,
        TIMER: 0,
		SERVO: 0,
        RD_BT: 0,
        COLOR_SEN: 
		{
            '0': 0,
            '1': 0,
            '2': 0,
        },
        GYRO_SEN: 
		{
            '0': 0,
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0,
        },
        
    };

    this.defaultOutput = {};

    this.recentCheckData = {};

    this.sendBuffers = [];

    this.lastTime = 0;
    this.lastSendTime = 0;
    this.isDraing = false;
}

let sensorIdx = 0;

//�ʿ�� Handler Data �ʱⰪ ����
Module.prototype.init = function(handler, config) {  /// 초기설정

};

// Serial Port ���� ���� ����
Module.prototype.setSerialPort = function(sp) {   /// 시리얼포트 정보를 가지고오기
    const self = this;
    this.sp = sp;
};

//�ʿ�� �������� Hardware�� ������ �ʱⰪ ����
Module.prototype.requestInitialData = function() {  /// 초기 송신 데이터
    // return null;
   return this.makeSensorReadBuffer(this.sensorTypes.ANALOG, 0);  
//                                            2, 0                          
};
   
//�������� Hardware���������� Inital�������� Vaildation
Module.prototype.checkInitialData = function(data, config) {   /// 초기 수신데이터 체크
    return true;
    // ���Ŀ� üũ ���� �����Ǹ� ó��
    // var datas = this.getDataByBuffer(data);
    // var isValidData = datas.some(function (data) {
    //     return (data.length > 4 && data[0] === 255 && data[1] === 85);
    // });
    // return isValidData;
};

//cb 은 화면의 이벤트를 보내는 로직입니다. 여기서는 connected 라는 신호를 보내 강제로 연결됨 화면으로 넘어갑니다.
Module.prototype.afterConnect = function(that, cb) {  
    that.connected = true;
    if (cb) {
        cb('connected');
    }
};

// 1. Hardware���� ������ ��� �������� Vaildation
Module.prototype.validateLocalData = function(data) { 
    return true; 
};

// 2. getDataByBuffer

Module.prototype.getDataByBuffer = function(buffer) {  // 해당 코드 내에서만 쓰는 함수입니다.
    let datas = [];
    let lastIndex = 0;
	
 /*   buffer.forEach(function (value,idx) {  //--
        if (value == 0x0d && buffer[idx + 1] == 0x0a) {
            datas.push(buffer.subarray (lastIndex, idx));
            lastIndex = idx + 2;
        }
    });
*/
    buffer.forEach((value,idx) => {  //--
        if (value == 0x0d && buffer[idx + 1] == 0x0a) {
            datas.push(buffer.subarray (lastIndex, idx));
            lastIndex = idx + 2;
        }
    });
    return datas;
};

/*
ff 55 idx size data a
*/
// 3. Hardware���� ������ ������ ����
Module.prototype.handleLocalData = function(data) {   
    // 하드웨어에서 보내준 정보를 가공합니다. 여기선 하드웨어에서 정보를 읽어서 처리하지 않습니다.
    const self = this;
    const datas = this.getDataByBuffer(data);
//	let count = 0;
    
    
    datas.forEach ((data) => {  //--
        if (data.length <= 6 || data[0] !== 255 || data[1] !== 85) {
            return;                
        }
		const readData = data.subarray(2, data.length);
		
        let value;
        let value2;
        let type = readData[readData.length - 1];    /// 
        const port = readData[readData.length - 2];
        switch (readData[0]) {
            case self.sensorValueSize.FLOAT: {  //2
                value = new Buffer(readData.subarray(1, 5)).readFloatLE();
                value = Math.round(value * 100) / 100;                    
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
            case self.sensorValueSize.SHORTSHORT: {  //5
                value = new Buffer(readData.subarray(1, 3)).readInt16LE();
                value2 = new Buffer(readData.subarray(3, 5)).readInt16LE();
                break;
            }
            case 0x10: { // 기본 패킷 수신인 경우 (디지털 데이터  + 아날로그 4개 A1~A4)
                type = 100;
                break;
            }
            case 0x11: { // 기본 패킷2 수신인 경우 (디지털 데이터 + 아날로그 4개 A5~A8)
                type = 101;
                break;
            }
            case 0x12: { // 컬러센서
                type = 102;
                break;
            }
            case 0x13: { // 자이로센서
                type = 103;
                break;
            }

            default: {
                value = 0;
                break;
            }
        }


	
        switch (type) {
            case 100: {
                self.sensorData.DIGITAL[1] = (readData[1]) & 0x01;	
                self.sensorData.DIGITAL[2] = (readData[1] >> 1) & 0x01;	
                self.sensorData.DIGITAL[3] = (readData[1] >> 2) & 0x01;	
                self.sensorData.DIGITAL[4] = (readData[1] >> 3) & 0x01;	
                self.sensorData.DIGITAL[5] = (readData[1] >> 4) & 0x01;	
                self.sensorData.DIGITAL[6] = (readData[1] >> 5) & 0x01;
                self.sensorData.DIGITAL[7] = (readData[1] >> 6) & 0x01;     	
                self.sensorData.DIGITAL[8] = (readData[1] >> 7) & 0x01;     	

                self.sensorData.DIGITAL[9] = (readData[2]) & 0x01;
                self.sensorData.DIGITAL[10] = (readData[2] >> 1) & 0x01;
                self.sensorData.DIGITAL[11] = (readData[2] >> 2) & 0x01;
                self.sensorData.DIGITAL[12] = (readData[2] >> 3) & 0x01;	
                self.sensorData.DIGITAL[14] = (readData[2] >> 4) & 0x01;
                self.sensorData.DIGITAL[14] = (readData[2] >> 5) & 0x01;
                self.sensorData.DIGITAL[15] = (readData[2] >> 6) & 0x01;
                self.sensorData.DIGITAL[16] = (readData[2] >> 7) & 0x01;
                
                self.sensorData.ANALOG[1] = readData[3];
                self.sensorData.ANALOG[2] = readData[4];
                self.sensorData.ANALOG[3] = readData[5];
                self.sensorData.ANALOG[4] = readData[6];
                break;
            }
            case 101: {       ///  
                self.sensorData.ANALOG[0] = readData[1];
                self.sensorData.DIGITAL[0] = (readData[1]) & 0x01;

                self.sensorData.DIGITAL[9] = (readData[2]) & 0x01;
                self.sensorData.DIGITAL[10] = (readData[2] >> 1) & 0x01;
                self.sensorData.DIGITAL[11] = (readData[2] >> 2) & 0x01;
                self.sensorData.DIGITAL[12] = (readData[2] >> 3) & 0x01;	
                self.sensorData.DIGITAL[13] = (readData[2] >> 4) & 0x01;
                self.sensorData.DIGITAL[14] = (readData[2] >> 5) & 0x01;
                self.sensorData.DIGITAL[15] = (readData[2] >> 6) & 0x01;
                self.sensorData.DIGITAL[16] = (readData[2] >> 7) & 0x01;

                self.sensorData.ANALOG[5] = readData[3];
                self.sensorData.ANALOG[6] = readData[4];
                self.sensorData.ANALOG[7] = readData[5];
                self.sensorData.ANALOG[8] = readData[6];
                break;
            }
            case 102: {       ///  컬러
                self.sensorData.COLOR_SEN[0] = readData[1];
                self.sensorData.COLOR_SEN[1] = readData[2];
                self.sensorData.COLOR_SEN[2] = readData[3];
                break;
            }
            case 103: {       ///  자이로
                self.sensorData.GYRO_SEN[0] = new Buffer(readData.subarray(1, 5)).readFloatLE();
                self.sensorData.GYRO_SEN[1] = new Buffer(readData.subarray(5, 9)).readFloatLE();
                self.sensorData.GYRO_SEN[2] = new Buffer(readData.subarray(9, 13)).readFloatLE();
                self.sensorData.GYRO_SEN[3] = new Buffer(readData.subarray(13, 17)).readFloatLE();
                self.sensorData.GYRO_SEN[4] = new Buffer(readData.subarray(17, 21)).readFloatLE();
                self.sensorData.GYRO_SEN[5] = new Buffer(readData.subarray(21, 25)).readFloatLE();


                //    value = new Buffer(readData.subarray(6, 10)).readFloatLE();
                //    value = Math.round(value * 100) / 100;    
                //    self.sensorData.TEMP = value;
                    break;
                }
            case self.sensorTypes.ANALOG: {
                self.sensorData.ANALOG[((port >> 4) & 0x0f) - 1] = value;
                self.sensorData.ANALOG[(port & 0x0f) - 1] = value2;
                break;
            }
            case self.sensorTypes.TEMP: {
                self.sensorData.TEMP = value;
                break;
            }			
            case self.sensorTypes.USONIC: {
                self.sensorData.USONIC = value / 10;			
                break;
            }
            case self.sensorTypes.SERVO: {
                self.sensorData.SERVO = value;
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
Module.prototype.requestRemoteData = function(handler) { 
    /// 엔트리에 전달할 데이터. 이 코드에서는 하드웨어에서 어떤 정보도 전달하지 않습니다.
    const self = this;
    if (!self.sensorData) {
        return;
    }
    Object.keys(this.sensorData).forEach((key) => { //--
        if (self.sensorData[key] != undefined) {
            handler.write(key, self.sensorData[key]);           
        }
    });
};

// 5. �������� ������ ������ ����
Module.prototype.handleRemoteData = function(handler) {   
    /// 엔트리에서 전달된 데이터 처리(Entry.hw.sendQueue로 보낸 데이터)
    const self = this;
    const getDatas = handler.read('GET');
    const setDatas = handler.read('SET') || this.defaultOutput;
    const time = handler.read('TIME');
    let buffer = new Buffer([]);
				
    if (getDatas) {			
        const keys = Object.keys(getDatas);
			
        keys.forEach((key) => {            //--
            let isSend = false;
            const dataObj = getDatas[key];
            if (typeof dataObj.port === 'string' || typeof dataObj.port === 'number') {
                const time = self.digitalPortTimeList[dataObj.port];
                if (dataObj.time > time) {
                    isSend = true;
                    self.digitalPortTimeList[dataObj.port] = dataObj.time;
                }
            } else if (Array.isArray(dataObj.port)) {
                isSend = dataObj.port.every((port) => {  //--
                    const time = self.digitalPortTimeList[port];
                    return dataObj.time > time;
                });

                if (isSend) {
                    dataObj.port.forEach((port) => {   //--
                        self.digitalPortTimeList[port] = dataObj.time;
                    });
                }
            }

            if (isSend) {
                if (!self.isRecentData(dataObj.port, key, dataObj.data)) {  
                    // 여기서의  비교로 같은 명령어의 반복실행을 방지
                    self.recentCheckData[dataObj.port] = 
					{
                        type: key,
                        data: dataObj.data,
                    };
                    buffer = Buffer.concat([buffer, self.makeSensorReadBuffer(key, 
                        dataObj.port, dataObj.data)]);						
                }
            }
        });        
    }

    if (setDatas) {   // 출력
        const setKeys = Object.keys(setDatas);
        setKeys.forEach((port) => {  /// port에 해당하는 데이터를 분석하여 처리  //--
            const data = setDatas[port];
            if (data) {
                if (self.digitalPortTimeList[port] < data.time) { // 데이터 생성시간과 현 시간보다 이전 이면 
                    self.digitalPortTimeList[port] = data.time;

                    if (!self.isRecentData(port, data.type, data.data)) {
                        self.recentCheckData[port] = 
						{
                            type: data.type,
                            data: data.data,
                        };
                        buffer = Buffer.concat([buffer, self.makeOutputBuffer(data.type, 
                            port, data.data)]);
                    };     /// 전송 패킷 생성하여 버퍼에 저장
                }
            }
        });
    }

    if (buffer.length) {
        this.sendBuffers.push(buffer);
    }
};

// 6. Hardware�� ���� ������ ����
Module.prototype.requestLocalData = function() { // 하드웨어에 명령을 전송합니다.
    const self = this;
	
     if (!this.isDraing && this.sendBuffers.length > 0) {
        this.isDraing = true;
        this.sp.write(this.sendBuffers.shift(), () => {  //-
            if (self.sp) {
               self.sp.drain(() => {   //--
                    self.isDraing = false;
               });
            }
        });        
    }

    return null;
};

Module.prototype.isRecentData = function(port, type, data) {
    let isRecent = false;
	
    if (port in this.recentCheckData) {
        if (type != this.sensorTypes.TONE && this.recentCheckData[port].type === type && 
        this.recentCheckData[port].data === data) {   
                // 톤 명령이 아니고 타입과 데이터가 같고 같은 자료형 이면 
                //if (port > 20) {  LINE_EASY
                if (type != this.sensorTypes.LINE_EASY && type != this.sensorTypes.LINE_EASY_MOTOR &&
                    type != this.sensorTypes.LINE_DELAY && type != this.sensorTypes.LINE_LINE &&
                    type != this.sensorTypes.LINE_TURN && type != this.sensorTypes.LINE_MOTOR &&
                    type != this.sensorTypes.LINE_BMOTOR && type != this.sensorTypes.LINE_BWMOTOR &&
                    type != this.sensorTypes.LINE_SERVO && type != this.sensorTypes.LINE_PORT) {
                    isRecent = true;
                }
        }
    }
//    isRecent = true;
    return isRecent;
};


/*
ff 55 len idx action device port  slot  data a
0  1  2   3   4      5      6     7     8
*/

Module.prototype.makeSensorReadBuffer = function(device, port, data) {  // 센서값 리드하 패킷
    let buffer;
    const dummy = new Buffer([10]);
	
    if (device == this.sensorTypes.USONIC) {
        buffer = new Buffer([255, 85, 5, sensorIdx, this.actionTypes.GET, device, 
            port[0], port[1], 10]);	
	} else if (device == this.sensorTypes.TEMP) {
        buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, 
            port[0], port[1], 10]);			
    } else if (device == this.sensorTypes.SERVO) {
        buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, 
            device, port[0], port[1], 10]);	
    } else if (device == this.sensorTypes.RD_BT) {
        buffer = new Buffer([255, 85, 5, sensorIdx, this.actionTypes.GET, device, port, 10]);	
    } else if (!data) {
        buffer = new Buffer([255, 85, 5, sensorIdx, this.actionTypes.GET, device, port, 10]);	
    } else {
        const value = new Buffer(2);
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

//0xff 0x55 0x6 0x0 0x1 0xa 0x9 0x0 0x0 0xa
Module.prototype.makeOutputBuffer = function(device, port, data) {   /// 출력 설정
    let buffer;
    const value = new Buffer(2);
    const dummy = new Buffer([10]);
    const time = new Buffer(2);
		
    switch (device) {
        case this.sensorTypes.LINE_EASY:   // 쉬운주행
        case this.sensorTypes.LINE_FW_SPEED:
        case this.sensorTypes.LINE_TURN_SPEED:
        case this.sensorTypes.LINE_RESTART:
            buffer = new Buffer([255, 85, 5, sensorIdx, this.actionTypes.SET, 
            device, port,data]);
            buffer = Buffer.concat([buffer, dummy]);
            break;

        case this.sensorTypes.LINE_CROSS_TIME:   // 쉬운주행
        case this.sensorTypes.LINE_DELAY:
            if ($.isPlainObject(data)) {
                time.writeInt16LE(data.time);
            } else {
                time.writeInt16LE(0);
            }
            buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, 
            device, port]);
            buffer = Buffer.concat([buffer, time, dummy]);
            break;

        case this.sensorTypes.LINE_EASY_MOTOR:
            if ($.isPlainObject(data)) {
                time.writeInt16LE(data.time);
            } else {
                time.writeInt16LE(0);
            }
            buffer = new Buffer([255, 85, 7, sensorIdx, this.actionTypes.SET, 
            device, port, data.direction]);
            buffer = Buffer.concat([buffer, time, dummy]);
            break;

        case this.sensorTypes.LINE_LINE:
        case this.sensorTypes.LINE_TURN:
        case this.sensorTypes.LINE_MOTOR:
            if ($.isPlainObject(data)) {
                time.writeInt16LE(data.time);
            } else {
                time.writeInt16LE(0);
            }
            buffer = new Buffer([255, 85, 8, sensorIdx, this.actionTypes.SET, 
            device, port, data.cross, data.speed]);
            buffer = Buffer.concat([buffer, time, dummy]);
            break;

        case this.sensorTypes.LINE_BMOTOR:
        case this.sensorTypes.LINE_BWMOTOR:
            buffer = new Buffer([255, 85, 8, sensorIdx, this.actionTypes.SET, 
            device, port, data.mode, data.lspeed, data.rspeed, data.sensor]);
            buffer = Buffer.concat([buffer, dummy]);
            break;

        case this.sensorTypes.LINE_WHEEL:   // wheel
        case this.sensorTypes.LINE_FFMOTOR:
        case this.sensorTypes.LINE_BBMOTOR:
        case this.sensorTypes.LINE_MOTORSTOP:    
            buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, 
            device, port, data.lspeed, data.rspeed]);
            buffer = Buffer.concat([buffer, dummy]);
			break; 

        case this.sensorTypes.LINE_SERVO:    // 서보모터제어
            buffer = new Buffer([255, 85, 7, sensorIdx, this.actionTypes.SET, 
            device, port, data.sport, data.angle, data.speed]);
			buffer = Buffer.concat([buffer, dummy]);
			break;
				
        case this.sensorTypes.LINE_PORT:   //디지털 출력 제어
        case this.sensorTypes.LINE_REMOT:
			value.writeInt16LE(data);
            buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, 
            device, port, data.dport, data.value]);
			buffer = Buffer.concat([buffer, dummy]);
			break;

        case this.sensorTypes.LINE_ABSH:
            value.writeInt16LE(data);
            buffer = new Buffer([255, 85, 10, sensorIdx, this.actionTypes.SET, 
            device, port, data.absh1, data.absh2, data.absh3, data.absh4, data.absh5, data.absh6]);
            buffer = Buffer.concat([buffer, dummy]);
            break;

        case this.sensorTypes.LINE_BLACKFORWARDF:
            value.writeInt16LE(data);
            buffer = new Buffer([255, 85, 9, sensorIdx, this.actionTypes.SET, 
            device, port, data.fsp, data.bsp, data.count, data.lsen, data.rsen]);
            buffer = Buffer.concat([buffer, dummy]);
            break;

        case this.sensorTypes.LINE_BUZZER:
        case this.sensorTypes.LINE_LINEDELAY:   // 라인딜레이 
            if ($.isPlainObject(data)) {
                value.writeInt16LE(data.linetime);
                time.writeInt16LE(data.time);
            } else {
                value.writeInt16LE(0);
                time.writeInt16LE(0);
            }
            buffer = new Buffer([255, 85, 9, sensorIdx, 
            this.actionTypes.SET, device, port, data.speed]);
            buffer = Buffer.concat([buffer, value, time, dummy]);
            break;

        case this.sensorTypes.LINE_LED:   // 라인 LED 
            if ($.isPlainObject(data)) {
                value.writeInt16LE(data.ontime);
                time.writeInt16LE(data.offtime);
            } else {
                value.writeInt16LE(0);
                time.writeInt16LE(0);
            }
            buffer = new Buffer([255, 85, 10, sensorIdx, 
            this.actionTypes.SET, device, port, data.count, data.outport]);
            buffer = Buffer.concat([buffer, value, time, dummy]);
            break;
			
        case this.sensorTypes.TONE:          // 스피커 제어 
				if ($.isPlainObject(data)) {
					value.writeInt16LE(data.value);
					time.writeInt16LE(data.duration);
				} else {
					value.writeInt16LE(0);
					time.writeInt16LE(0);
				}
                buffer = new Buffer([255, 85, 7, sensorIdx, 
                this.actionTypes.SET, device]);
				buffer = Buffer.concat([buffer, value, time, dummy]);
				break;
        
        case this.sensorTypes.PWM:           // 아날로그 출력 제어
                buffer = new Buffer([255, 85, 5, sensorIdx, 
                this.actionTypes.SET, device, port, data]);
				buffer = Buffer.concat([buffer, dummy]);
                break;

        case this.sensorTypes.LCD_SET:          // LCD 제어
                if (port == 3) {     // 프린트
                    buffer = new Buffer([255, 85, 26, sensorIdx, this.actionTypes.SET, 
                    device, port,data.line,data.column,data.text0,data.text1,data.text2,
                    data.text3,data.text4,data.text5,data.text6,data.text7,data.text8,
                    data.text9,data.text10,data.text11,data.text12,data.text13,data.text14,
                    data.text15,data.text16,data.text17,data.text18,data.text19]);
                    buffer = Buffer.concat([buffer,dummy]);

                } else {
                    buffer = new Buffer([255, 85, 7, sensorIdx, this.actionTypes.SET, 
                    device, port, data[0], data[1],data[2]]);
                    buffer = Buffer.concat([buffer, dummy]);
                }
                break;
     }           //
    return buffer;
};

Module.prototype.disconnect = function(connect) {
    const self = this;
    connect.close();
    if (self.sp) {
        delete self.sp;
    }
};

// ���� Connect ����� �� ����
Module.prototype.reset = function() {
    this.lastTime = 0;
    this.lastSendTime = 0;
};

module.exports = new Module();
