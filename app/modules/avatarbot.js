// 클래스 내부에서 사용될 필드
function Module() {
    //
    this.sendBuffers = [];
    this.avatarBotDataSet = 210;
    this.dataSet_index = null;
    //
    this.dataSetHW = new Array(210).fill(0);
    this.dataSet = new Array(210).fill(0);
    this.remoteDataSet = new Array(210).fill(0);
    this.BoardFunType = {
    	Info: 0,
    	Button:10,
		OLED:12, // OLED : 12(EN),13(Sample)
        GPIO_PWM_SET: 20,
        GPIO_PWM: 30,
        ADC: 40,
        IR_Remote: 50,
        Buzzer: 60,
        PCA9568: 70,
        Servo_M0: 80,
        Servo_M1: 90,
        Servo_M2: 100,
        Servo_M3: 110,
        Servo_M4: 120,
        Servo_M5: 130,
        Servo_M6: 140,
        Servo_M7: 150,
        DC_M: 160,
        MPU6050_1: 170,
        MPU6050_2: 180,
        LED_Strip: 190,
        ULTRA_SONIC: 200
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

	this.Board_IR_Remote = {
		Flag: 0,
		Value: 0xff,
        Repeat: 0,
        Address: 0,
        Command: 0,
        Raw_data: 0
	}

	this.Board_PCA9568 = {
		Osci: 27000000,
		Freq: 50
	}
	this.Board_Servo = {
		Pulse_Min: 150,
		Pulse_Max: 600,
		us_Min: 400,
		us_Max: 2100
	}
	this.Board_LED_Strip = {
		En:0,
		sample: 0,
		led_num: 64,
		color_order: 0,
		r: 0,
		g: 0,
		b: 0,
		brightness:63,
		set_en: 0,
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
	
	// pwm pad	
	index = this.BoardFunType.GPIO_PWM_SET;
	this.remoteDataSet[index+1] = (this.Board_PWM.Freq)&0xff;
	this.remoteDataSet[index+2] = (this.Board_PWM.Freq>>8)&0xff;
	this.remoteDataSet[index+3] = (this.Board_PWM.Freq>>16)&0xff;
	this.remoteDataSet[index+4] = (this.Board_PWM.Resolution)&0xff;

	// adc
	index = this.BoardFunType.ADC;
	this.remoteDataSet[index+4] = (this.Board_ADC.Attenuation_11db)&0xff;
	this.remoteDataSet[index+5] = (this.Board_ADC.Resolution)&0xff;
	
	// ir receiver
	index = this.BoardFunType.IR_Remote;
	this.remoteDataSet[index+1] = (this.Board_IR_Remote.Value)&0xff;
	
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
	
	// led 
	index = this.BoardFunType.LED_Strip;
	this.remoteDataSet[index+2] = (this.Board_LED_Strip.led_num)&0xff;
	this.remoteDataSet[index+7] = (this.Board_LED_Strip.brightness)&0xff;
	
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
Module.prototype.handleRemoteData = function(handler) {
	console.log('[jhkim] handleRemoteData(read entry)', this.remoteDataSet[11]); 
	const cmd = handler.read('CMD');
	var data = this.remoteDataSet;
    console.log('[jhkim] handleRemoteData(read entry) data = ', data[11], ', cmd = ', cmd[11] ); 
    for (var index = 0; index < this.avatarBotDataSet; index++) {
        // data[index] = handler.read(index); // remoteDataset shallow copy
    	data[index] = cmd[index];
    }
    console.log('[jhkim] handleRemoteData(read entry) data = ', data[11], ', cmd = ', cmd[11], ', de = ', this.remoteDataSet[11]); 
    // console.log('[jhkim] handleRemoteData(read entry)', this.remoteDataSet[23]); 
    // console.log('[jhkim] originParsing - DataSet length = ', data.length); 
	/*
	for(var i=0; i<(data.length/10); i++)
	{
		var index = i*10;
		console.log('[jhkim] handleRemoteData - DataSet[', i, ']: ', 
			data[index+0], ' | ', data[index+1], ' | ', data[index+2], ' | ', 
			data[index+3], ' | ', data[index+4], ' | ', data[index+5], ' | ', 
			data[index+6], ' | ', data[index+7], ' | ', data[index+8], ' | ', 
			data[index+9]);
	}
	*/
};

/*
하드웨어 기기에 전달할 데이터를 반환합니다.
slave 모드인 경우 duration 속성 간격으로 지속적으로 기기에 요청을 보냅니다.
*/
Module.prototype.requestLocalData = function() {
    var queryString = [];
    var data = this.remoteDataSet; // Module 객체의 dataset table read. max length 200
    for (var index = 0; index < this.avatarBotDataSet; index++) {
        var query = (data[index])&0xff;
       	queryString.push(query); // 1byte
    }
    /*
    for(var i=0; i<(data.length/10); i++)
	{
		var index = i*10;
		console.log('[jhkim] requestLocalData - DataSet[', i, ']: ', 
			data[index+0], ' | ', data[index+1], ' | ', data[index+2], ' | ', 
			data[index+3], ' | ', data[index+4], ' | ', data[index+5], ' | ', 
			data[index+6], ' | ', data[index+7], ' | ', data[index+8], ' | ', 
			data[index+9]);
	}
	*/
    return queryString;
};

// 하드웨어에서 온 데이터 처리
Module.prototype.handleLocalData = function(data) {
	var self = this;	
	for (var i = 0; i < data.length; i++) {
        self.dataSet[self.dataSet_index+i] = data[i];
    }
    
    
    if(self.dataSet[0] === 0x99 && self.dataSet[1] === 0x01 && self.dataSet[2] === 0x01 && self.dataSet[3] === self.avatarBotDataSet) 
    {
 		self.dataSet_index = self.dataSet_index + data.length;
    }else{
		self.dataSet_index = 0;
        return;
	}
	
    if(self.dataSet_index == self.avatarBotDataSet){
		self.originParsing(self.dataSet);
		self.dataSet_index = 0;
		self.dataSet[0] = 0; // clear
		self.dataSet[1] = 0; // clear
		self.dataSet[2] = 0; // clear
		self.dataSet[3] = 0; // clear
		// 
		// console.log('[jhkim] handleLocalData - dataSet_index[11]  = ', self.dataSet[11]); 
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
Module.prototype.requestRemoteData = function(handler) {
	// console.log('[jhkim] requestRemoteData(to entry) : ', this.dataSet[11]); 
    /*
    for (var i = 0; i < this.avatarBotDataSet; i++) {
        var value = this.dataSet[i];
        handler.write(i, value);
    }
    */
    handler.write('CMD', this.dataSet);
    /*
    for(var i=0; i<(this.dataSet.length/10); i++)
	{
		var index = i*10;
		console.log('[jhkim] requestRemoteData - DataSet[', i, ']: ', 
			this.dataSet[index+0], ' | ', this.dataSet[index+1], ' | ', this.dataSet[index+2], ' | ', 
			this.dataSet[index+3], ' | ', this.dataSet[index+4], ' | ', this.dataSet[index+5], ' | ', 
			this.dataSet[index+6], ' | ', this.dataSet[index+7], ' | ', this.dataSet[index+8], ' | ', 
			this.dataSet[index+9]);
	}
	*/
};
//
Module.prototype.reset = function() {};

module.exports = new Module();
