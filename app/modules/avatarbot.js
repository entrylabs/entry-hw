// 클래스 내부에서 사용될 필드
function Module() {
	/*
    this.digitalValue = new Array(14);
    this.analogValue = new Array(6);

    this.remoteDigitalValue = new Array(14);
    this.readablePorts = null;
    this.remainValue = null;
    */
    //
    this.sendBuffers = [];
    this.avatarBotDataSet = 230;
    this.dataSet_index = null;
    this.dataSet = new Array(230).fill(0);
    this.remoteDataSet = new Array(230).fill(0);
    this.BoardFunType = {
    	Info: 0,
    	Button:10,
        GPIO_LED_PWM0: 20,
        GPIO_LED_PWM1: 30,
        GPIO_LED_PWM2: 40,
        GPIO_LED_PWM3: 50,
        ADC: 60,
        DAC: 70,
        IR_Remote: 80,
        Buzzer: 90,
        PCA9568: 100,
        Servo_M0: 110,
        Servo_M1: 120,
        Servo_M2: 130,
        Servo_M3: 140,
        Servo_M4: 150,
        Servo_M5: 160,
        Servo_M6: 170,
        Servo_M7: 180,
        DC_M: 190,
        MPU6050: 200,
        LED_Strip: 210,
        ULTRA_SONIC: 220
	}
	this.Board_PWM = {
		Resolution: 13,
		Freq: 5000
	}
	this.Board_ADC = {
		Resolution: 12,
		Attenuation_0db: 0,
		Attenuation_2_5db: 1,
		Attenuation_6db: 2,
		Attenuation_11db: 3 // default db value.
	}
	this.Board_PCA9568 = {
		Osci: 27000000,
		Freq: 50
	}
	this.Board_Servo = {
		Pulse_Min: 150,
		Pulse_Max: 600,
		us_Min: 500,
		us_Max: 2400
	}
}

/*
최초에 커넥션이 이루어진 후의 초기 설정.
handler 는 워크스페이스와 통신하 데이터를 json 화 하는 오브젝트입니다. (datahandler/json 참고)
config 은 module.json 오브젝트입니다.
*/
   
Module.prototype.init = function(handler, config) {
	console.log('[jhkim] Module initialized with handler:', handler, 'and config:', config);
	var index = this.BoardFunType.Info;
	this.remoteDataSet[index+0] = 0x99;
	this.remoteDataSet[index+1] = 0x01;
	this.remoteDataSet[index+2] = 0x01;
	this.remoteDataSet[index+3] = this.avatarBotDataSet;
	
	// pwm. 2~5 pad
	for(var i=0; i<4; i++)
	{
		index = this.BoardFunType.GPIO_LED_PWM0 + (i*10);
		this.remoteDataSet[index+2] = (this.Board_PWM.Freq)&0xff;
		this.remoteDataSet[index+3] = (this.Board_PWM.Freq>>8)&0xff;
		this.remoteDataSet[index+4] = (this.Board_PWM.Freq>>16)&0xff;
		this.remoteDataSet[index+5] = (this.Board_PWM.Resolution)&0xff;
	}
	// adc
	index = this.BoardFunType.ADC;
	this.remoteDataSet[index+4] = (this.Board_ADC.Attenuation_11db)&0xff;
	this.remoteDataSet[index+5] = (this.Board_ADC.Resolution)&0xff;
	
	// pca9568
	index = this.BoardFunType.PCA9568;
	this.remoteDataSet[index+1] = (this.Board_PCA9568.Freq)&0xff;
	this.remoteDataSet[index+2] = (this.Board_PCA9568.Freq>>8)&0xff;
	this.remoteDataSet[index+3] = (this.Board_PCA9568.Freq>>16)&0xff;
	this.remoteDataSet[index+4] = (this.Board_PCA9568.Freq>>24)&0xff;
	
	this.remoteDataSet[index+5] = (this.Board_PCA9568.Osci)&0xff;
	this.remoteDataSet[index+6] = (this.Board_PCA9568.Osci>>8)&0xff;
	this.remoteDataSet[index+7] = (this.Board_PCA9568.Osci>>16)&0xff;
	this.remoteDataSet[index+8] = (this.Board_PCA9568.Osci>>24)&0xff;
	
	// servo moter
	for(var i=0; i<8; i++)
	{
		index = this.BoardFunType.Servo_M0 + (i*10);
		this.remoteDataSet[index+1] = (this.Board_Servo.Pulse_Min)&0xff;	
		this.remoteDataSet[index+2] = (this.Board_Servo.Pulse_Min>>8)&0xff;	
		
		this.remoteDataSet[index+3] = (this.Board_Servo.Pulse_Max)&0xff;	
		this.remoteDataSet[index+4] = (this.Board_Servo.Pulse_Max>>8)&0xff;	
		
		this.remoteDataSet[index+5] = (this.Board_Servo.us_Min)&0xff;	
		this.remoteDataSet[index+6] = (this.Board_Servo.us_Min>>8)&0xff;	
		
		this.remoteDataSet[index+7] = (this.Board_Servo.us_Max)&0xff;	
		this.remoteDataSet[index+8] = (this.Board_Servo.us_Max>>8)&0xff;	
	}
	
	// init... 
	this.dataSet_index = 0;
	this.dataSet = this.remoteDataSet.slice(); // copy data.
};

//----------------------------------------------------------------------
/*
연결 후 초기에 송신할 데이터가 필요한 경우 사용합니다.
requestInitialData 를 사용한 경우 checkInitialData 가 필수입니다.
이 두 함수가 정의되어있어야 로직이 동작합니다. 필요없으면 작성하지 않아도 됩니다.
*/   
Module.prototype.requestInitialData = function() {
	// console.log('[jhkim] Module requestInitialData');
	// return this.makeSensorReadBuffer(this.sensorTypes.ANALOG, 0);
    return null;
};

// 연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
Module.prototype.checkInitialData = function(data, config) {
	// console.log('[jhkim] Module checkInitialData');
    return true;
};
//----------------------------------------------------------------------
// 주기적으로 하드웨어에서 받은 데이터의 검증이 필요한 경우 사용합니다.
Module.prototype.validateLocalData = function(data) {
	// console.log('[jhkim] Module validateLocalData');
    return true;
};

// 엔트리에서 받은 데이터에 대한 처리
/*
Module.prototype.handleRemoteData = function(handler) {
	console.log('[jhkim] Handling remote data...');
    this.readablePorts = handler.read('readablePorts');
    var digitalValue = this.remoteDigitalValue;
    for (var port = 0; port < 14; port++) {
        digitalValue[port] = handler.read(port);
    }
    // console.log('[jhkim] Remote digital values updated:', digitalValue);
};
*/
Module.prototype.handleRemoteData = function(handler) {
	// console.log('[jhkim] handleRemoteData(read entry)'); 
	var data = this.remoteDataSet;
    for (var index = 0; index < this.avatarBotDataSet; index++) {
        data[index] = handler.read(index); // remoteDataset shallow copy
    }
};

/*
하드웨어 기기에 전달할 데이터를 반환합니다.
slave 모드인 경우 duration 속성 간격으로 지속적으로 기기에 요청을 보냅니다.
*/
/*
Module.prototype.requestLocalData = function() {
    var queryString = [];

    var readablePorts = this.readablePorts; // Module 객체의 readablePorts 필드를 가져옴
    if (readablePorts) {
		// readablePorts가 존재할 경우
        for (var i in readablePorts) {
			// readablePorts의 각 항목에 대해 반복
            var query = (5 << 5) + (readablePorts[i] << 1);
            queryString.push(query); // 쿼리 스트링 배열에 추가
        }
    }
    var readablePortsValues =
        (readablePorts && Object.values(readablePorts)) || [];
 	// readablePorts의 값들을 배열 형태로 가져옴, 없으면 빈 배열    
    var digitalValue = this.remoteDigitalValue; // Module 객체의 remoteDigitalValue 필드를 가져옴
    for (var port = 0; port < 14; port++) {
        if (readablePortsValues.indexOf(port) > -1) {
            continue;
        }
        var value = digitalValue[port];
        if (value === 255 || value === 0) {
			// digital out
			// (0b111<<5) + [0~14]<<1 + [1 or 0] = 0b11100000 + 0b11110 + 0b1 
            var query = (7 << 5) + (port << 1) + (value == 255 ? 1 : 0);
            queryString.push(query); // 1byte
        } else if (value > 0 && value < 255) {
			// ADC write
			// (0b110<<5) + [0~14]<<1 + [0] = 0b11100000 + 0b11110 + 0bx
            var query = (6 << 5) + (port << 1) + (value >> 7);
            queryString.push(query); // 1byte
            // 0b0xxx_xxxx
            query = value & 127;
            queryString.push(query); // 1byte
        }
    }
    return queryString;
};
*/
Module.prototype.requestLocalData = function() {
    var queryString = [];
    var data = this.remoteDataSet; // Module 객체의 dataset table read. max length 200
    for (var index = 0; index < this.avatarBotDataSet; index++) {
        var query = (data[index])&0xff;
       	queryString.push(query); // 1byte
    }
    return queryString;
};

// 하드웨어에서 온 데이터 처리
/*
Module.prototype.handleLocalData = function(data) {
    // data: Native Buffer
    var pointer = 0;
    for (var i = 0; i < 32; i++) {
        var chunk;
        if (!this.remainValue) {
            chunk = data[i];
        } else {
            chunk = this.remainValue;
            i--;
        }
        if (chunk >> 7) {
            if ((chunk >> 6) & 1) {
				// 0b11xx_xxxx => adc value
                var nextChunk = data[i + 1];
                if (!nextChunk && nextChunk !== 0) {
                    this.remainValue = chunk;
                } else {
                    this.remainValue = null;

                    var port = (chunk >> 3) & 7;
                    this.analogValue[port] =
                        ((chunk & 7) << 7) + (nextChunk & 127); // 3bit + 7bit = 10bit adc
                }
                i++;
            } else {
				// 0b10xx_xxxx => digital value
                var port = (chunk >> 2) & 15;
                this.digitalValue[port] = chunk & 1;
            }
        }
    }
};
*/
Module.prototype.handleLocalData = function(data) {
	var self = this;
	for (var i = 0; i < data.length; i++) {
        self.dataSet[self.dataSet_index+i] = data[i];
    }
    
    if(self.dataSet[0] === 0x99 && self.dataSet[1] === 0x01 && self.dataSet[2] === 0x01 && self.dataSet[3] === self.avatarBotDataSet) {
 		self.dataSet_index = self.dataSet_index + data.length;
    }else{
		self.dataSet_index = 0;
        return;
	}
	
	/*
	console.log('[jhkim] handleLocalData - DataSet length = ', data.length); 
	console.log('[jhkim] handleLocalData - dataSet_index  = ', self.dataSet_index); 
	*/
	
    if(self.dataSet_index == self.avatarBotDataSet){
		self.originParsing(self.dataSet);
		self.dataSet_index = 0;
		self.dataSet[0] = 0; // clear
		self.dataSet[1] = 0; // clear
		self.dataSet[2] = 0; // clear
		self.dataSet[3] = 0; // clear
	}
};

/* Original Parsing FF 55 ~ */
Module.prototype.originParsing = function(data) {
	/*
	console.log('[jhkim] originParsing - DataSet length = ', data.length); 
	for(var i=0; i<(data.length/10); i++)
	{
		var index = i*10;
		console.log('[jhkim] originParsing - DataSet[', i, ']: ', 
			data[index+0], ' | ', data[index+1], ' | ', data[index+2], ' | ', 
			data[index+3], ' | ', data[index+4], ' | ', data[index+5], ' | ', 
			data[index+6], ' | ', data[index+7], ' | ', data[index+8], ' | ', 
			data[index+9]);
	}
	*/
};

// 엔트리로 전달할 데이터
/*
Module.prototype.requestRemoteData = function(handler) {
    for (var i = 0; i < this.analogValue.length; i++) {
        var value = this.analogValue[i];
        handler.write('a' + i, value);
    }
    for (var i = 0; i < this.digitalValue.length; i++) {
        var value = this.digitalValue[i];
        handler.write(i, value);
    }
};
*/
Module.prototype.requestRemoteData = function(handler) {
	// console.log('[jhkim] requestRemoteData(to entry)'); 
    for (var i = 0; i < this.avatarBotDataSet; i++) {
        var value = this.dataSet[i];
        handler.write(i, value);
    }
};
//
Module.prototype.reset = function() {};

module.exports = new Module();
