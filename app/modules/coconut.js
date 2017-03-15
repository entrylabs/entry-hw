// 2017.02.22 : LTW : Connection Completed, source clensing
// 2017.02.23 : LTW : Sensor Receive
// 2017.02.24 : LTW : Sensor Msg Send Logic Modified
// 2017.03.15 : LTW : Source Refactoring
'use strict';
function Module() {
	this.sensory = {
		msgStatus: "end",
		msg:[0,0,0],
		
		leftFloorValue: 0,					
		rightFloorValue: 0,					
		BothFloorDetection: 0,				

		leftProximityValue: 0,				
		rightProximityValue: 0,				
		BothProximityDetection: 0,			

		obstacleDetection: 0,				
		light: 0,							
		temp: 0,		     				
		extIrA2 : 0,						
		extIrA3 : 0,						
	};
	this.motoring = {
		
		msg: [],
		rightWheel: 0,
		buzzer: 0,
		outputA: 0,
		outputB: 0,
		topology: 0,
		leftLed: 0,
		rightLed: 0,
		note: 0,
		lineTracerMode: 0,
		lineTracerModeId: -1,
		lineTracerSpeed: 5,
		ioModeA: 0,
		ioModeB: 0,
		configProximity: 2,
		configGravity: 0,
		configBandWidth: 3
	};
	this.lineTracer = {
		written: false,
		flag: 0,
		event: 0,
		state: 0
	};
}

var isSending = true;				//전문 보내는 상태
var isBlockedJSSending = false;     //대기중이던 전문을 보내는 상태
var blockedJSMsg;					//대기중인 전문
var msgSentTime = 0;				//센서보낸 시간
var sensorDurationTime = 200;		//센서수집 전문 주기
var isInitialBle = false;			//블루투스 초기화 상태

var sensorCorrectMsg = ["0xff","0x56","0x02","0x00","0x05"];

var Coconut = {		
	MSG_VALUE: 'msgValue',	
};


/* 2016.11.02 : SCS */
Module.prototype.lostController = function () {}

Module.prototype.toHex = function(number) {
	var value = parseInt(number);
	if(value < 0) value += 0x100;

	value = value.toString(16).toUpperCase();
	if(value.length > 1) return value;
	else return '0' + value;
};
	
Module.prototype.toHex3 = function(number) {
	var value = parseInt(number);
	if(value < 0) value += 0x1000000;
	
	value = value.toString(16).toUpperCase();
	var result = '';
	for(var i = value.length; i < 6; ++i) {
		result += '0';
	}
	return result + value;
};

Module.prototype.requestInitialData = function() {
	// 2017.0.13 : SCS : 
	//var arrMsg = ["0xff","0x55","0x08","0x00","0x02","0x03","0x00","0x06", "0x01", "0x32", "0x00", "0xff","0x55","0x08","0x00","0x02","0x03","0x00","0x01", "0x01", "0x32", "0x00"];	
	var arrMsg = ["0xff","0x55","0x06","0x00","0x02","0x19", "0x00", "0x00", "0x04"];
	//var arrMsg = ["0xff","0x56","0x02","0x00","0x05"]; //
	return arrMsg;
};

Module.prototype.checkInitialData = function(data, config) {
	// Serial
	var response_format = [0x53, 0x03, 0x00, 0x00, 0xff, 0x45];	
	var response_real = stringToAsciiByteArray(data);
	var is_same = (response_format.length == response_real.length) && response_format.every(function(element, index) {
    return element === response_real[index]; 
	});	
	if (is_same) 
	{
		console.log("serial connected");
		return true;
	}

    // Bluetooth1		
	var response_format = [0xff, 0x55];
	var is_same = (response_format.length == response_real.length) && response_format.every(function(element, index) {
    return element === response_real[index]; 
	});	
	if (is_same) 
	{
		console.log("ble1 connected");
		return true;
	}
		
    // Bluetooth2		
	if (response_real[0] == 0xff && response_real[1] == 0x56)
	{
		console.log("ble2 connected");
		return true;
	}
		
	// Hello Message
	var response_format ="Corea Coding Nut...COCONUT";
	if (response_format == data)
	{
		console.log("msg connected");
		return true;
	}
	else
		return false; 
};

function h2d(ch)
{
	var d;
	if (ch >= 48 && ch <= 57) d = ch - 48;
	else if(ch >= 65 && ch <= 70 ) d = ch - 55;
	else {
		//throw new Error('Character ' + String.fromCharCode(ch) + 'can\`t be convert');
	}

	return d;
}

function stringToAsciiByteArray(str)
{
    var bytes = [];
   for (var i = 0; i < str.length; ++i)
   {
       var charCode = str.charCodeAt(i);
       if (charCode >= 0xFF) charCode = 0xff; // 2017.01.13 : SCS
      //if (charCode > 0xFF)  // char > 1 byte since charCodeAt returns the UTF-16 value
      //{
      //    throw new Error('Character ' + String.fromCharCode(charCode) + ' can\'t be represented by a US-ASCII byte.');
      //}
       bytes.push(charCode);
   }
    return bytes;
}

Module.prototype.validateLocalData = function(data) {
	return true;
};

Module.prototype.handleLocalData = function(data) { // data: string
	var array = stringToAsciiByteArray(data);	
	var sensory = this.sensory;		
	var now = new Date();
	if (array[0] == 0xff && array[1] == 0x55)
	{		
		sensory.msgStatus = "end";	
		isSending = false;
		console.log("end");
		this.motoring.msg = "";
	} 
	else if (array[0] == 0xff && array[1] == 0x56)
	{
		
		console.log("sensor");
		sensory.msgStatus = "sensor";		
		sensory.leftProximityValue = readInt16(array, 2);
		sensory.rightProximityValue = readInt16(array, 4);
		sensory.BothProximityDetection = readInt8(array, 6);
		sensory.leftFloorValue = readInt8(array, 7);
		sensory.rightFloorValue = readInt8(array, 8);
		sensory.BothFloorDetection = readInt8(array, 9);
		sensory.temperature = readInt16(array, 10);

		sensory.accelerationX = accCalibrate(readInt16(array, 12));
		sensory.accelerationY = accCalibrate(readInt16(array, 14));
		sensory.accelerationZ = accCalibrate(readInt16(array, 16));
		sensory.light = analogCalibrate(readInt16(array, 18));
		sensory.extIrA2 = analogCalibrate(readInt16(array, 20));
		sensory.extIrA3 = analogCalibrate(readInt16(array, 22));	
		isSending = false;
	}
	else
	{
		sensory.msgStatus = "continue";	
	}

	return;
};


Module.prototype.requestRemoteData = function(handler) {
	var sensory = this.sensory;
	for(var key in sensory) {
		handler.write(key, sensory[key]);
	}
	sensory.lineTracerState = 0;
};

Module.prototype.handleRemoteData = function(handler) {
	var now = new Date();
		
	if(handler.e(Coconut.MSG_VALUE)) {
		var t = handler.read(Coconut.MSG_VALUE);
		if (t != "")
		{
			console.log(now + " : handleRemoteData : " + handler.read(Coconut.MSG_VALUE));
			this.motoring.msg = t;
		} 	
	}

};

Module.prototype.requestLocalData = function() {
	var now = new Date();
	var motoring = this.motoring;
	

	if (isSending == true )
	{

		if (!isInitialBle) //�������� ���ᶧ����....
		{
			isInitialBle = true;
			//console.log(now + " : initialMsg : "  + sensorCorrectMsg);
			return sensorCorrectMsg;
		} 	
		console.log("isSending = true");
		return;
	} 
	if (isBlockedJSSending) // ���� ������ ������ ���� ���ٸ��� ���� ����
	{
		isSending= true;
		console.log(now + " : requestLocalData Run : "  + blockedJSMsg);	
		isBlockedJSSending = false;
		return blockedJSMsg;
	}

	if (now - msgSentTime >= sensorDurationTime) //�����ð����� ���� ���� ����
	{
		if (motoring.msg.length > 0 )
		{	
			blockedJSMsg = motoring.msg;
			isBlockedJSSending = true;
		} else {
			blockedJSMsg = "";	
		}
		saveLastSensorTime(now);
		isSending = true;
		console.log(now + " : requestLocalData Sensor : "  + sensorCorrectMsg);
		return sensorCorrectMsg;
	} 
	
	if (motoring.msg.length > 0)
	{		
		isSending = true;
		console.log(now + " : requestLocalData Run : "  + motoring.msg);		
		return motoring.msg;		
	}
	return;
};

Module.prototype.reset = function() {
	var motoring = this.motoring;
	motoring.leftWheel = 0;
	motoring.rightWheel = 0;
	motoring.buzzer = 0;
	motoring.outputA = 0;
	motoring.outputB = 0;
	motoring.topology = 0;
	motoring.leftLed = 0;
	motoring.rightLed = 0;
	motoring.note = 0;
	motoring.lineTracerMode = 0;
	motoring.lineTracerModeId = -1;
	motoring.lineTracerSpeed = 5;
	motoring.ioModeA = 0;
	motoring.ioModeB = 0;
	motoring.configProximity = 2;
	motoring.configGravity = 0;
	motoring.configBandWidth = 3;
	var sensory = this.sensory;
	sensory.lineTracerState = 0;
	sensory.lineTracerStateId = 0;
	var lineTracer = this.lineTracer;
	lineTracer.written = false;
	lineTracer.flag = 0;
	lineTracer.event = 0;
	lineTracer.state = 0;
};

	function readInt16(arr, position) {
	   var charCode = h2d(arr[position+0]) * 16 + h2d(arr[position+1]);
	   return charCode;	
	}
	
	function accCalibrate(value){
		if (value > 0x7f)
		{
			value = value - 0x100;
		}
		
		return value;
	}

	function analogCalibrate(value) {
		return value = value * 9;		
	}

	function readInt8(arr, position) {
	   var charCode = h2d(arr[position]);
	   return charCode;	
	}

	function readFloat(arr, position) {
		// 2017.01.17 : SCS
		// IEEE 754 Format: [0] [1] [2] [3]
		// arduino  Format: [3] [2] [1] [0]
			
		var f3 = arr[position+3] << 24;
		f3 = f3 | arr[position+2] << 16;
		f3 = f3 | arr[position+1] << 8 ;
		f3 = f3 | arr[position+0];
		
		return Bytes2Float32(f3);
		
		return 0.0;
	}//function
	


	// IEEE 754 Converter
	// https://www.h-schmidt.net/FloatConverter/IEEE754.html
	function Bytes2Float32(bytes) {
	    var sign = (bytes & 0x80000000) ? -1 : 1;
	    var exponent = ((bytes >> 23) & 0xFF) - 127;
	    var significand = (bytes & ~(-1 << 23));
	
	    if (exponent == 128) 
	        return sign * ((significand) ? Number.NaN : Number.POSITIVE_INFINITY);
	
	    if (exponent == -127) {
	        if (significand == 0) return sign * 0.0;
	        exponent = -126;
	        significand /= (1 << 22);
	    } else significand = (significand | (1 << 23)) / (1 << 23);
	
	    return sign * significand * Math.pow(2, exponent);
	}
	
	// LTW : Sensor Msg Send Time Save
	function saveLastSensorTime(time){
		msgSentTime = time;
	}

module.exports = new Module();

// =================================== End of File =====================================
