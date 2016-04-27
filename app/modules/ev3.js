function Module() {
	this.sensors = [];
	this.INIT_SEQ =new Buffer([0x07,0x00,0x00,0x00,0x80,0x00,0x00,0x02,0x01]);
	this.INIT_DOWNLOAD_SEQ = new Buffer("2500010001920F0100002F6D6E742F72616D6469736B2F70726A732F6D6F62696C652E72626600", "hex"); 
	this.STOP_DOWNLOAD_SEQ = new Buffer("0600030001980000", "hex"); 
	//multi - motor - single touch sensor
	this.RUN_PROGRAM_SEQ = new Buffer("2D000400800020C00801842F6D6E742F72616D6469736B2F70726A732F6D6F62696C652E7262660040440301404440", "hex" ); 
	this.PROGRAM_SEQ = new Buffer("140102000193004C45474F0F01000065000500050000004C00000000000000080000000B01000000000000000000000C01000000000000000000000D01000000000000000000000E0100000000000000000000841200841300820000820000841C01820000820000842E2E2F617070732F427269636B2050726F6772616D2F4F6E427269636B496D6167653132008400821B08300060858332000000403482020046646046821300348205004768604782080031604430006005444161820B00A5000161A6000140820400A30001004162820B00A5000262A6000240820400A30002004163820B00A5000463A6000440820400A30004004164820B00A5000864A6000840820400A30008008640408285FF0A0A0A0A0A", "hex"); 

	this.INIT_DATA = [this.INIT_SEQ, this.INIT_DOWNLOAD_SEQ, this.PROGRAM_SEQ, this.STOP_DOWNLOAD_SEQ, this.RUN_PROGRAM_SEQ];
	this.OUTPUT_HEADER_SEQ = "000004";
	this.OUTPUT_DELIMITER_SEQ = "30";
	this.OUTPUT_BODY_SEQ = "407E018200008";
	this.TERMINATE_SEQ = new Buffer("070055008000000201","hex");


	this.S_TYPE_COLOR = "1d";
	this.SM_COL_COLOR = 2;

	//-------------- Sensor ---------------------
	this.S_TYPE_IR = 0;
	this.S_TYPE_TOUCH = "10";
	this.S_TYPE_COLOR = "1d";
	this.S_TYPE_USONIC = 0;
	this.S_TYPE_GYRO = 0;

	//color sensor modes
	this.SM_COL_RINTENSITY = 0;
	this.SM_COL_AINTENSITY = 1;
	this.SM_COL_COLOR = 2;

	this.sp = null;
	this.sensors = [];
	this.PORT_MAP = {
		A: 0,
		B: 0,
		C: 0,
		D: 0
	}	
	this.SENSOR_MAP = {
		'1': undefined,
		'2': undefined,
		'3': undefined,
		'4': undefined
	}

	this.CHECK_PORT_MAP = {
	}

	this.CHECK_SENSOR_MAP = {
	}

	this.SENSOR_COUNTER_LIST = {};

	this.returnData = {};

	this.deviceType = {
		NxtTouch: 1,
		NxtLight: 2,
		NxtSound: 3,
		NxtColor: 4,
		NxtUltrasonic: 5,
		NxtTemperature: 6,
		LMotor: 7,
		MMotor: 8,
		Touch: 16,
		Color: 29,
		Ultrasonic: 30,
		Gyroscope: 32,
		Infrared: 33,
		Initializing: 0x7d,
		Empty: 0x7e,
		WrongPort: 0x7f,
		Unknown: 0xff
	}
}

var counter = 0;

Module.prototype.init = function(handler, config) {
};

Module.prototype.setSerialPort = function (sp) {
	this.sp = sp;
};

Module.prototype.requestInitialData = function(sp) {
	var that = this;

	var initMotor = [255,255, this.getCounter(), 128, 0, 0, 163, 129, 0, 129, 15, 129, 0];
	checkByteSize(initMotor);
	// return this.INIT_DATA.shift();
	// sp.write(this.INIT_SEQ, function () {
	// 	sp.write(that.INIT_DOWNLOAD_SEQ, function () {
	// 		sp.write(that.PROGRAM_SEQ, function () {
	// 			sp.write(that.STOP_DOWNLOAD_SEQ, function () {
	// 				sp.write(that.RUN_PROGRAM_SEQ, function () {
	// 					console.log('RUN_PROGRAM_SEQ');

						
	// 				});
	// 			});
	// 		});
	// 	});
	// });
	return initMotor;
};

Module.prototype.checkInitialData = function(data, config) {
	return true;
};

// 하드웨어 데이터 처리
Module.prototype.handleLocalData = function(data) { // data: Native Buffer
	var that = this;
	if(data[0] === 97 && data[1] === 0) {
		var countKey = data.readInt16LE(2);

		if(countKey in this.SENSOR_COUNTER_LIST) {
			delete this.SENSOR_COUNTER_LIST[countKey];
			data = data.slice(5);
			var index = 0;
			Object.keys(this.SENSOR_MAP).forEach(function(p) {
				var port = Number(p) - 1;
				index = port * responseSize;

				var type = data[index];
				var mode = data[index + 1];;
				var siValue = data.readFloatLE(index + 2).toFixed(1);
				var readyRaw = data.readInt32LE(index + 6);
				var readyPercent = data[index + 10];

				that.returnData[p] = {
					'type': type,
					'mode': mode,
					'siValue': siValue,
					'readyRaw': readyRaw,
					'readyPercent': readyPercent
				}
			});

		}
	}

	
	// this.sensorResponse(data.toString('hex').substr(4,4),data.toString('hex'));
};

// Web Socket(엔트리)에 전달할 데이터
Module.prototype.requestRemoteData = function(handler) {
	// console.log(this.sensors);
	// 
	// console.log(this.returnData);
	var that = this;
	Object.keys(this.returnData).forEach(function (key) {
		if(that.returnData[key] != undefined) {
			handler.write(key, that.returnData[key]);			
		}
	})
};

// Web Socket 데이터 처리
Module.prototype.handleRemoteData = function(handler) {
	var that = this;
	// console.log(handler);
	// var  readablePorts = handler.read('readablePorts');
	Object.keys(this.PORT_MAP).forEach(function (port) {
		that.PORT_MAP[port] = Number(handler.read(port));
	});	

	// var isReadSensor = false;
	// Object.keys(this.SENSOR_MAP).forEach(function (port) {
	// 	that.SENSOR_MAP[port] = handler.read(port);
	// 	if(!that.SENSOR_MAP[port]) {
	// 		that.returnData[port] = undefined;
	// 		that.unRegisterSensor(port);
	// 	} else if(that.CHECK_SENSOR_MAP[port] !== that.SENSOR_MAP[port]) {
	// 		(function (port) {
	// 			that.registerSensor(port, that.S_TYPE_TOUCH, 0);
	// 			that.registerSensorListener(port, function(result){
	// 				that.returnData[port] = result;
	// 		  	});
	// 		})(port);
	// 	}

	// 	that.CHECK_SENSOR_MAP[port] = that.SENSOR_MAP[port];
	// });


	// console.log(that.SENSOR_MAP);
	// var a= that.getCounter();
	// this.sp.write(new Buffer("0B00"+a+"0001009A000"+ 3 + this.S_TYPE_TOUCH +"0"+ 0 +"60","hex"));
};


// 하드웨어에 전달할 데이터
Module.prototype.requestLocalData = function() {
	var isSendData = false;
	var that = this;

	Object.keys(this.PORT_MAP).forEach(function (port) {
		if(that.PORT_MAP[port] !== that.CHECK_PORT_MAP[port]) {
			isSendData = true;
		}
		that.CHECK_PORT_MAP[port] = that.PORT_MAP[port];
	});

	if(isSendData) {
		return this.getOutputSequence(this.PORT_MAP.A, this.PORT_MAP.B, this.PORT_MAP.C, this.PORT_MAP.D);
	} else {
		return null;
	}
	// a++;
	// if(a % 2 === 0) {
	// 	// return this.getOutputSequence(20, 0, 0, 20);
	// } else {
		// return new Buffer("0B00"+this.getCounter()+"0001009A000"+ 3 + this.S_TYPE_TOUCH +"0"+ 0 +"60","hex");
	// }
	// return [255,255,5,0,0,94,0,153,5,129,0,129,0,225,0,225,1,153,29,129,0,129,0,129,0,129,0,129,1,225,2,153,28,129,0,129,0,129,0,129,0,129,1,225,6,153,27,129,0,129,0,129,0,129,0,129,1,225,10,153,5,129,0,129,1,225,11,225,12,153,29,129,0,129,1,129,0,129,0,129,1,225,13,153,28,129,0,129,1,129,0,129,0,129,1,225,17,153,27,129,0,129,1,129,0,129,0,129,1,225,21,153,5,129,0,129,2,225,22,225,23,153,29,129,0,129,2,129,0,129,0,129,1,225,24,153,28,129,0,129,2,129,0,129,0,129,1,225,28,153,27,129,0,129,2,129,0,129,0,129,1,225,32,153,5,129,0,129,3,225,33,225,34,153,29,129,0,129,3,129,0,129,0,129,1,225,35,153,28,129,0,129,3,129,0,129,0,129,1,225,39,153,27,129,0,129,3,129,0,129,0,129,1,225,43,153,5,129,0,129,16,225,44,225,45,153,29,129,0,129,16,129,0,129,0,129,1,225,46,153,28,129,0,129,16,129,0,129,0,129,1,225,50,153,27,129,0,129,16,129,0,129,0,129,1,225,54,153,5,129,0,129,17,225,55,225,56,153,29,129,0,129,17,129,0,129,0,129,1,225,57,153,28,129,0,129,17,129,0,129,0,129,1,225,61,153,27,129,0,129,17,129,0,129,0,129,1,225,65,153,5,129,0,129,18,225,66,225,67,153,29,129,0,129,18,129,0,129,0,129,1,225,68,153,28,129,0,129,18,129,0,129,0,129,1,225,72,153,27,129,0,129,18,129,0,129,0,129,1,225,76,153,5,129,0,129,19,225,77,225,78,153,29,129,0,129,19,129,0,129,0,129,1,225,79,153,28,129,0,129,19,129,0,129,0,129,1,225,83,153,27,129,0,129,19,129,0,129,0,129,1,225,87,131,9,129,6,225,88,131,9,129,5,225,89,131,9,129,1,225,90,131,9,129,4,225,91,131,9,129,3,225,92,131,9,129,2,225,93];
};

Module.prototype.getOutputSequence = function(a,b,c,d){
	//modify header
	var header = this.OUTPUT_HEADER_SEQ; 

	var body_a =  "";
	if(a != null) body_a = this.OUTPUT_DELIMITER_SEQ + this.getHexOutput(a) + this.OUTPUT_BODY_SEQ + "301000000830100000040";

	var body_b =  "";
	if(b != null) body_b = this.OUTPUT_DELIMITER_SEQ + this.getHexOutput(b) + this.OUTPUT_BODY_SEQ + "302000000830200000040";

	var body_c =  "";
	if(c != null) body_c = this.OUTPUT_DELIMITER_SEQ + this.getHexOutput(c) + this.OUTPUT_BODY_SEQ + "303000000830300000040";

	var body_d =  "";
	if(d != null) body_d = this.OUTPUT_DELIMITER_SEQ + this.getHexOutput(d) + this.OUTPUT_BODY_SEQ + "304000000830400000040";

	//get counter
	var size = ((this.getCounter()+header+body_a+body_b+body_c+body_d).length/2).toString(16); //check this 
	var prefix = size + "00" + this.getCounter() + header ;
	var body = prefix + body_a + body_b + body_c + body_d; 
	// console.log(body.toUpperCase());
	return  new Buffer( body.toUpperCase(), "hex");
};

Module.prototype.getCounter = function(){
	var cstring = counter.toString(16);
	if(cstring.length ==  1){
		cstring = "000"+ cstring ;
		//console.log(cstring);
	} else if (cstring.length ==  2){
		cstring = "00" + cstring;
	} else if (cstring.length ==  3){
		cstring = "0" + cstring;
	}
	if(counter>=65535) {
		counter = 0;
	}
	counter++;
	return cstring;
}

Module.prototype.getHexOutput = function(output){
	var res = "";
    if(output < 0 && output >= -32) {
		output = 256 + output;
		res =  output.toString(16);
		
	}
	else if ( output < -32 ){
		output = 256 + output;
		res =  output.toString(16);
		res = "81" + res;
	}
	
	if (output >= 0 && output < 32) {
		res =  output.toString(16);
	}
	else if ( output >= 32 ) {
		res =  output.toString(16);
		res = "81" + res;
	}
	
	//one digit
	if (res.length == 1){
		res = "0" +res;
	}	
	
	return res;
}


Module.prototype.sensorResponse = function(counter, value){
	this.sensors.forEach(function (sensor) {
		if(sensor) {
			sensor.processData(counter,value);
		}
	})
};

Module.prototype.unRegisterSensor = function(port, type, mode){
	port = Number(port);
	if(port>4 || port<1) {return; }//should return error
	this.sensors[port-1] = undefined;
};

Module.prototype.registerSensor = function(port, type, mode){
	port = Number(port);
	if(port>4 || port<1) {return; }//should return error
	if(type == this.S_TYPE_COLOR){
		this.sensors[port-1] = new ColorSensor(port,type,mode);
	}

	if(type == this.S_TYPE_TOUCH){
		this.sensors[port-1] = new TouchSensor(port,type,mode);
	}	
}

Module.prototype.registerSensorListener = function(port,callback){
	this.sensors[port-1].pushCallback(callback);
}

Module.prototype.pullReadings = function(){
	var that = this;
	this.sensors.forEach(function (sensor) {
		if(sensor) {
			sensor.pullReading(that.getCounter(), that.sp);
		}
	})
	// for (i =0 ; i<this.sensors.length; i++){
	// 	this.sensors[i].pullReading(this.getCounter(),this.sp);
	// }
}

var Sensor = function(port,type,mode){
	var port = port;
	var type = type;
	this.mode = mode;
	this.callbacks = [];
	var pull_command =  null; 
	this.request_counter = -1;

	this.pushCallback = function(callback){
		this.callbacks.push(callback);
	};

	this.pullReading = function(counter,sp){
		this.request_counter = counter;
		//construct buffer
		pull_command = new Buffer("0B00"+counter+"0001009A000"+ (port-1) + type +"0"+ mode +"60","hex");
		//console.log(pull_command.toString("hex"));
		sp.write(pull_command);
	}
}

Sensor.prototype.processData = function(counter){
	if(counter != this.request_counter){
		return
	}
}


//inherited sensors
var ColorSensor = function(port,type,mode){
	//paratistic inheritance
	//http://www.crockford.com/javascript/inheritance.html
	var sensor = new Sensor(port,type,mode);
	sensor.processData =function(counter,value){
		if(counter != this.request_counter){
			return
		}
		var payload = value.substr(10,2);

		//if mode is light intensity, change the result to numeric value
		if(this.mode == 0 || this.mode ==1 ){
			payload = parseInt(payload,16);
		}

		for(i=0; i < this.callbacks.length ; i++){
			this.callbacks[i](payload);
		}
	}

	return sensor;
}

var TouchSensor = function(port,type,mode){
	//paratistic inheritance
	//http://www.crockford.com/javascript/inheritance.html
	var sensor = new Sensor(port,type,mode);
	sensor.processData = function(counter,value){
		if(counter != this.request_counter){
			return
		}

		var payload = value.substr(10,2);
		var result = false;
		if(payload == "00") { result = false; } else if(payload == "64") { result=true; }
		for(i=0; i < this.callbacks.length ; i++){
			this.callbacks[i](result);
		}
	}

	return sensor;
}

var checkByteSize = function (buffer) {
	buffer[0] = buffer.length;
	buffer[1] = buffer.length >> 8;
}

var responseSize = 11;
var mode = 0;
Module.prototype.sensorCheck = function () {
	var that = this;
	var counter = new Buffer(2);
	var size = new Buffer([255, 255]);
	counter.writeInt16LE('0x' + this.getCounter(), 0);
	this.SENSOR_COUNTER_LIST[counter.readInt16LE()] = true;
	var sensorReady = new Buffer([0, 94, 0]);
	var sensorBody;
	var index = 0;
	Object.keys(this.SENSOR_MAP).forEach(function(p) {
		var port = Number(p) - 1;;
		index = port * responseSize;
		var modeSet = new Buffer([153, 5, 129, 0, 129, port, 225, index, 225, index+1]);
		var readySi = new Buffer([153, 29, 129, 0, 129, port, 129, 0, 129, mode, 129, 1, 225, index+2]);
		var readyRaw = new Buffer([153, 28, 129, 0, 129, port, 129, 0, 129, mode, 129, 1, 225, index+6]);
		var readyPercent = new Buffer([153, 27, 129, 0, 129, port, 129, 0, 129, mode, 129, 1, 225, index+10]);

		if(!sensorBody) {
			sensorBody = Buffer.concat([modeSet, readySi, readyRaw, readyPercent]);
		} else {
			sensorBody = Buffer.concat([sensorBody, modeSet, readySi, readyRaw, readyPercent]);
		}
	});

	var totalLength = size.length +  counter.length +  sensorReady.length +  sensorBody.length;
	size[0] = totalLength - 2;
	size[1] = (totalLength-2) >> 8;
	var sendBuffer = Buffer.concat([size, counter, sensorReady, sensorBody], totalLength);
	that.sp.write(sendBuffer);
	
}

Module.prototype.connect = function() {
	var that = this;
	this.sensing = setInterval(function(){
		that.sensorCheck();
	}, 200);
};

Module.prototype.disconnect = function(connect) {
	clearInterval(this.sensing);
	if(this.sp) {
		this.sp.write(this.TERMINATE_SEQ,function(err){
			if(err) {
				console.log(err);
			}
			 // if(callback != null) callback(err);		
			connect.close();
		}); 
	} else {
		connect.close();
	}
};

Module.prototype.reset = function() {
};

module.exports = new Module();