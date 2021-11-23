
function Module() {
	this.sp = null;
	this.digitalValue = new Array(20);
	this.analogValue = new Array(4);

	//this.remoteDigitalValue = new Array(12);
	this.remoteDigitalValue = [0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0];
	this.readablePorts = null;
	this.remainValue = null;
	
	this.tmpBuffer = new Array(14);

	this.portMode = [0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,0,0,0,0,0];

	this.checkTime = null;
	this.address = null;
	this.lastTime = null;

	this.firstConnect = false;
	this.connectingCnt = 0;
	
	this.prevBuffer = [];
	this.servoValues= [];
	this.portOutValues= [];
	this.portModeValues= [];

	this.sendBuffer = new Array(13);
	this.prevSendBuffer = new Array(13);
	this.array = {
		SERVO_CONTROL: 0,
		HOME_CONTROL: 1,
		PORT_CONTROL: 2,
		PORT_OUT_CONTROL: 3,
		BUZZ_CONTROL: 4,
		SERVO_SPEED: 5,
		SET_SERVO_OFFSET_ZERO: 6,
		SET_SERVO_HOME_POS: 7,
		AIDESK_CONTROL: 8,
		REMOTE_DEVICE: 9,
		CONNECT_DEVICE: 10,
	};
	this.sensorData = {
        SENSOR: {
            A0: 0,
            A1: 0,
            A2: 0,
            A3: 0,
            A4: 0,
            A5: 0,
            A6: 0,
            A7: 0,
			A8: 0,
            A9 : 0,
            A10: 0,
            A11: 0,
            A12: 0,
            A13: 0,
            A14: 0,
			A15: 0,
			A16: 0,
			A17: 0,
			A18: 0,
			A19: 0,
        },
		AIDESK: {
            AD0: 0,
            AD1: 0,
            AD2: 0,
            AD3: 0,
            AD4: 0,
            AD5: 0,
        },
    };
	
}

Module.prototype.init = function(handler, config) {	
	var array = this.array;
	this.sendBuffer[array.SERVO_CONTROL] = new Buffer.alloc(14);
	this.sendBuffer[array.HOME_CONTROL] = new Buffer.alloc(14);
	this.sendBuffer[array.PORT_CONTROL] = new Buffer.alloc(14);
	this.sendBuffer[array.PORT_OUT_CONTROL] = new Buffer.alloc(14);
	this.sendBuffer[array.BUZZ_CONTROL] = new Buffer.alloc(14); 
	this.sendBuffer[array.SERVO_SPEED] = new Buffer.alloc(14); 
	this.sendBuffer[array.SET_SERVO_OFFSET_ZERO] = new Buffer.alloc(14); 
	this.sendBuffer[array.SET_SERVO_HOME_POS] = new Buffer.alloc(14);
	this.sendBuffer[array.AIDESK_CONTROL] =  new Buffer.alloc(14);
	this.sendBuffer[array.REMOTE_DEVICE] =  new Buffer.alloc(14);
	this.sendBuffer[array.CONNECT_DEVICE] =  new Buffer.alloc(14);

	this.prevSendBuffer[array.SERVO_CONTROL] = new Buffer.alloc(14);
	this.prevSendBuffer[array.HOME_CONTROL] = new Buffer.alloc(14);
	this.prevSendBuffer[array.PORT_CONTROL] = new Buffer.alloc(14);
	this.prevSendBuffer[array.PORT_OUT_CONTROL] = new Buffer.alloc(14);
	this.prevSendBuffer[array.BUZZ_CONTROL] = new Buffer.alloc(14); 
	this.prevSendBuffer[array.SERVO_SPEED] = new Buffer.alloc(14); 
	this.prevSendBuffer[array.SET_SERVO_OFFSET_ZERO] = new Buffer.alloc(14); 
	this.prevSendBuffer[array.SET_SERVO_HOME_POS] = new Buffer.alloc(14);
	this.prevSendBuffer[array.AIDESK_CONTROL] =  new Buffer.alloc(14);
	this.prevSendBuffer[array.REMOTE_DEVICE] =  new Buffer.alloc(14);
	this.prevSendBuffer[array.CONNECT_DEVICE] =  new Buffer.alloc(14);
	
};

Module.prototype.setSerialPort = function(sp) {
	this.sp = sp;
}
Module.prototype.connect = function() {	
	
}

// 하드웨어 연결 해제 시 호출
Module.prototype.disconnect = function(connect) {
	var self = this;
	this.reset();
	connect.close();
	if(self.sp)
	{
		delete self.sp;
	}
}

// 연결 종료 후 처리 코드
Module.prototype.reset = function() {
	this.checkTime = null;
	this.lastTime = null;
	this.address = null;
	this.firstConnect = true;
	this.connectingCnt=0;
	for(var i = 0; i < 13; i++)
	{
		this.sendBuffer[i] = [];
	}
}

// 연결 초기에 보냄
Module.prototype.requestInitialData = function() {

	this.firstConnect = true;
	this.connectingCnt=0;
	return true;
};

Module.prototype.checkInitialData = function(data, config) {
	return true;
};

Module.prototype.validateLocalData = function(data) {
	return true;
};

Module.prototype.saveDeviceVal = function() {
	var dv = this.deviceVal;
	
}
Module.prototype.checkBuffer = function(buff1,buff2,cnt) {
	for(var i=0;i<cnt;i++){
		if(buff1[i] != buff2[i])return true;
	}
	return false;

}
// Web Socket 데이터 처리
Module.prototype.handleRemoteData = function(handler) {
		
	var getData = new Array(13);
    var rHandler = handler.read('SEND');
	var array = this.array;
	var sval = this.servoValues;
	var checkTime = this.checkTime;
    var address = this.address;
	var port;
	var val;
	var remote;

	getData[array.SERVO_CONTROL] = rHandler[array.SERVO_CONTROL];	
	getData[array.HOME_CONTROL] = rHandler[array.HOME_CONTROL];	
	getData[array.PORT_CONTROL] = rHandler[array.PORT_CONTROL];	
	getData[array.PORT_OUT_CONTROL] = rHandler[array.PORT_OUT_CONTROL];	
	getData[array.BUZZ_CONTROL] = rHandler[array.BUZZ_CONTROL];	
	getData[array.SERVO_SPEED] = rHandler[array.SERVO_SPEED];	
	getData[array.SET_SERVO_OFFSET_ZERO] = rHandler[array.SET_SERVO_OFFSET_ZERO];	
	getData[array.SET_SERVO_HOME_POS] = rHandler[array.SET_SERVO_HOME_POS];	
	getData[array.AIDESK_CONTROL] = rHandler[array.AIDESK_CONTROL];	
	getData[array.REMOTE_DEVICE] = rHandler[array.REMOTE_DEVICE];	

	if(getData[array.SERVO_CONTROL])
	{
		sval[0] = getData[array.SERVO_CONTROL].servo1;
		sval[1] = getData[array.SERVO_CONTROL].servo2;
		sval[2] = getData[array.SERVO_CONTROL].servo3;
		sval[3] = getData[array.SERVO_CONTROL].servo4;
		sval[4] = getData[array.SERVO_CONTROL].servo5;
		sval[5] = getData[array.SERVO_CONTROL].servo6;
		checkTime = getData[array.SERVO_CONTROL].Time;
		remote = getData[array.SERVO_CONTROL].remote;
        address = array.SERVO_CONTROL;
		this.sendBuffer[array.SERVO_CONTROL] = this.makeSendBuffServo(66,remote,sval[0],sval[1],sval[2],sval[3],sval[4],sval[5]);

	}	
	if(getData[array.PORT_CONTROL])
	{				
		port = getData[array.PORT_CONTROL].port;
		val  = getData[array.PORT_CONTROL].mode;
		checkTime = getData[array.PORT_CONTROL].Time;
		remote = getData[array.PORT_CONTROL].remote;
        address = array.PORT_CONTROL;				
		
		//console.log(this.prevSendBuffer[array.PORT_CONTROL]);
		this.sendBuffer[array.PORT_CONTROL] = this.makeSendBuffPort(80,remote,port,val,255,255,255,255,255,255,255,255,255,255);
		/*
		if(  this.checkBuffer(this.sendBuffer[array.PORT_CONTROL],this.prevSendBuffer[array.PORT_CONTROL],5) == false){
			this.sendBuffer[array.PORT_CONTROL] = [];
			this.prevSendBuffer[array.PORT_CONTROL] = this.sendBuffer[array.PORT_CONTROL];	
		}				*/
		//console.log(this.sendBuffer[array.PORT_CONTROL]);	
	}	
	if(getData[array.PORT_OUT_CONTROL])
	{
		port = getData[array.PORT_OUT_CONTROL].port;
		val  = getData[array.PORT_OUT_CONTROL].val;	
		checkTime = getData[array.PORT_OUT_CONTROL].Time;
		remote  = getData[array.PORT_OUT_CONTROL].remote;	
        address = array.PORT_OUT_CONTROL;
		this.sendBuffer[array.PORT_OUT_CONTROL] = this.makeSendBuffPort(68,remote,port,val,255,255,255,255,255,255,255,255,255,255);
	}
	if(getData[array.BUZZ_CONTROL])
	{
		var melody = getData[array.BUZZ_CONTROL].melody;
		remote = getData[array.BUZZ_CONTROL].remote;
		checkTime = getData[array.BUZZ_CONTROL].Time;
        address = array.BUZZ_CONTROL;
		this.sendBuffer[array.BUZZ_CONTROL] = this.makeSendBuffShort(77,remote,melody,0,0);
	}
	if(getData[array.SERVO_SPEED])
	{		
		speed = getData[array.SERVO_SPEED].speed;
		remote = getData[array.SERVO_SPEED].remote;
		checkTime = getData[array.SERVO_SPEED].Time;
        address = array.SERVO_SPEED;
		this.sendBuffer[array.SERVO_SPEED] = this.makeSendBuffShort(83,remote,speed,0,0);
	}
	if(getData[array.SET_SERVO_OFFSET_ZERO])
	{		
		remote = getData[array.SET_SERVO_OFFSET_ZERO].remote;
		checkTime = getData[array.SET_SERVO_OFFSET_ZERO].Time;
        address = array.SET_SERVO_OFFSET_ZERO;
		this.sendBuffer[array.SET_SERVO_OFFSET_ZERO] = this.makeSendBuffShort(67,remote,0,0,0);
	}
	if(getData[array.HOME_CONTROL])
	{		
		remote = getData[array.HOME_CONTROL].remote;
		checkTime = getData[array.HOME_CONTROL].Time;
        address = array.HOME_CONTROL;
		this.sendBuffer[array.HOME_CONTROL] = this.makeSendBuffShort(72,remote,0,0,0);		
	}	
	if(getData[array.SET_SERVO_HOME_POS])
	{		
		sval[0] = getData[array.SET_SERVO_HOME_POS].servo1;
		sval[1] = getData[array.SET_SERVO_HOME_POS].servo2;
		sval[2] = getData[array.SET_SERVO_HOME_POS].servo3;
		sval[3] = getData[array.SET_SERVO_HOME_POS].servo4;
		sval[4] = getData[array.SET_SERVO_HOME_POS].servo5;
		sval[5] = getData[array.SET_SERVO_HOME_POS].servo6;
		checkTime = getData[array.SET_SERVO_HOME_POS].Time;
		remote = getData[array.SET_SERVO_HOME_POS].remote;
        address = array.SET_SERVO_HOME_POS;
		this.sendBuffer[array.SET_SERVO_HOME_POS] = this.makeSendBuffServo(67,remote,sval[0],sval[1],sval[2],sval[3],sval[4],sval[5]);
	}	
	if(getData[array.AIDESK_CONTROL])
	{		
		remote = getData[array.AIDESK_CONTROL].remote;
		var func = getData[array.AIDESK_CONTROL].func;
		var var1 = getData[array.AIDESK_CONTROL].var1;
		var var2 = getData[array.AIDESK_CONTROL].var2;
		var var3 = getData[array.AIDESK_CONTROL].var3;
		checkTime = getData[array.AIDESK_CONTROL].Time;
        address = array.AIDESK_CONTROL;
		if(var1<0)var1=65536+var1;
		if(var2<0)var2=65536+var2;
		if(var3<0)var3=65536+var3;
		
		this.sendBuffer[array.AIDESK_CONTROL] = this.makeSendBuffAIDesk(75,remote,func,var1,var2,var3);
	}	
	if(getData[array.REMOTE_DEVICE])
	{		
		remote = getData[array.REMOTE_DEVICE].remote;
		var var1 = getData[array.REMOTE_DEVICE].var1;
		var var2 = getData[array.REMOTE_DEVICE].var2;
		var var3 = getData[array.REMOTE_DEVICE].var3;
		checkTime = getData[array.REMOTE_DEVICE].Time;
        address = array.REMOTE_DEVICE;		
		this.sendBuffer[array.REMOTE_DEVICE] = this.makeSendBuffShort(90,remote,var1,var2,var3);		
	}	
	if(getData[array.CONNECT_DEVICE])
	{		
		checkTime = getData[array.CONNECT_DEVICE].Time;
        address = array.CONNECT_DEVICE;		
		this.sendBuffer[array.CONNECT_DEVICE] = this.makeSendBuffShort(65,1,0,0,0);		
	}	

	this.checkTime = checkTime;
    this.address = address;
		
};
// 하드웨어에 전달할 데이터
Module.prototype.requestLocalData = function() {

	var sendToHardware = new Buffer.alloc(14);
	var lastTime = this.lastTime;
	var currentTime = this.checkTime;
	var address = this.address;	
	//console.log("send");console.log(this.sendBuffer[address]);
	if(lastTime != currentTime && this.sendBuffer[address].length > 0)
	{		
		sendToHardware = this.sendBuffer[address];
		this.lastTime = currentTime;
		this.sendBuffer[address] = [];	
		//console.log("send to hw");console.log(sendToHardware);
		return sendToHardware;
	}	
	
};

Module.prototype.makeSendBuffServo = function(cmd, id , s1,s2,s3,s4,s5,s6) {	
	return	this.cmdBuild(   cmd, id 
					,s1>>8, s1&0xff
					,s2>>8, s2&0xff
					,s3>>8, s3&0xff
					,s4>>8, s4&0xff
					,s5>>8, s5&0xff
					,s6>>8, s6&0xff
				);
};
Module.prototype.makeSendBuffPort = function(cmd, id , p0, v0, p1, v1, p2, v2, p3, v3, p4, v4, p5, v5) {	
	return this.cmdBuild(cmd, id , p0, v0, p1, v1, p2, v2, p3, v3, p4, v4, p5, v5);
};
Module.prototype.makeSendBuffShort = function(cmd, id , d0, d1, d2) {	
	return this.cmdBuildShort(cmd,id,d0,d1,d2);
};
Module.prototype.makeSendBuffAIDesk = function(cmd, id , d0, d1, d2, d3) {	
	var tbuff = new Array(14);	
	tbuff[0] = cmd; // header1
	tbuff[1] = id; // header2
	tbuff[2] = d0;
	tbuff[3] = 0;
	tbuff[4] = d1>>8;	tbuff[5] = d1&0xff;
	tbuff[6] = d2>>8;	tbuff[7] = d2&0xff;
	tbuff[8] = d3>>8;	tbuff[9] = d3&0xff;
    tbuff[10] = 255;	tbuff[11] = 255;
	tbuff[12] = 255;	tbuff[13] = 255;
	//console.log(tbuff);
	return tbuff;
};
Module.prototype.cmdBuild = function(cmd, id , d0, d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, d11) {
	var tbuff = new Array(14);
	tbuff[0] = cmd; // header1
	tbuff[1] = id; // header2
	tbuff[2] = d0;
	tbuff[3] = d1;
	tbuff[4] = d2;
	tbuff[5] = d3;
	tbuff[6] = d4;
	tbuff[7] = d5;	
	tbuff[8] = d6;
    tbuff[9] = d7;
	tbuff[10] = d8;
	tbuff[11] = d9;	
	tbuff[12] = d10;
    tbuff[13] = d11; 
	//console.log(tbuff);
	return tbuff;
};
Module.prototype.cmdBuildShort = function(cmd, id , d0, d1, d2) {
	var tbuff = new Array(14);
	tbuff[0] = cmd; // header1
	tbuff[1] = id; // header2
	tbuff[2] = d0;
	tbuff[3] = d1;
	tbuff[4] = d2;
	tbuff[5] = 255;
	tbuff[6] = 255;
	tbuff[7] = 255;	
	tbuff[8] = 255;
    tbuff[9] = 255;
	tbuff[10] = 255;
	tbuff[11] = 255;	
	tbuff[12] = 255;
    tbuff[13] = 255; 
	return tbuff;
};



// 하드웨어 데이터 처리
Module.prototype.handleLocalData = function(data) { // data: Native Buffer
	var sd = this.sensorData.SENSOR;
	var ad = this.sensorData.AIDESK;
    var val = 0;
	
	if(this.firstConnect && this.connectingCnt > 5){	
		this.connectingCnt=0;
		this.lastTime=0;this.checkTime=1;
		this.address = this.array.CONNECT_DEVICE;
		this.sendBuffer[this.array.CONNECT_DEVICE] = this.makeSendBuffShort(65,1,0,0,0);
		this.firstConnect = false;

		return;				
	}

	if(data[0]==73 && data[1]==1){  //'I'
		for (var i = 0; i < 4; i++) {
			sd[i] = data[2+i];	
		}
        for (var i = 0; i < 4; i++) {
			val = (((data[6+i*2] & 0xFF) << 8) | (data[6+i*2+1] & 0xFF));
			sd[4+i] = val;  	
		}
	}
	if(data[14+0]==73 && data[14+1]==2){//'I'
		for (var i = 0; i < 4; i++) {
			sd[8+i] = data[14+2+i];	
		}
        for (var i = 0; i < 4; i++) {
			val = (((data[14+6+i*2] & 0xFF) << 8) | (data[14+6+i*2+1] & 0xFF));
			sd[8+4+i] = val;  	
		}
		this.connectingCnt++;
	}	
	var s = 0;
	if(data[s]==88 && data[s+1]==1){//'X'
		for (var i = 0; i < 6; i++) {
			val = (((data[s+2+i*2] & 0xFF) << 8) | (data[s+2+i*2+1] & 0xFF));
			if(val>32767)val=val-65536;
			if(val>-2000 && val<2000)ad[i] = val;  	
			
		}
		this.connectingCnt++;
	}	
	/*
	if(data[s+4]==88 && data[s+5]==2){//'X'		
		var result = "";
		var length=0;	
		sd[18] = data[s+6];
		length = data[s+7];
		for (var i = 0; i < length; i++) {
	  		result += String.fromCharCode(parseInt(data[s+8+i]));
		}		
		sd[19] = result;
	}
	*/
	
};
// Web Socket(엔트리)에 전달할 데이터
Module.prototype.requestRemoteData = function(handler) {
	
	const self = this;
/*
	for(var key in this.sensorData)
	{
		handler.write(key, this.sensorData[key]);
	}
*/

    Object.keys(this.sensorData).forEach((key) => {
        if (self.sensorData[key] != undefined) {
            handler.write(key, self.sensorData[key]);
        }
    });
	
	for (var i = 0; i < 20; i++) {
		var value = this.sensorData.SENSOR[i];
		handler.write('A' + i, value);
	}
	for (var i = 0; i < 6; i++) {
		var value = this.sensorData.AIDESK[i];
		handler.write('AD' + i, value);
	}
};

Module.prototype.reset = function() {
};

module.exports = new Module();
