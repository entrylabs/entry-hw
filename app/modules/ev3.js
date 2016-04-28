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

	this.CHECK_PORT_MAP = {};
	this.CHECK_SENSOR_MAP = {};
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
	this.outputPort = {
		A: 1,
		B: 2,
		C: 4,
		D: 8,
		ALL: 15
	}
}

var counter = 0;
var mode = 0;
var responseSize = 11;
var isSendInitData = false;
var isSensorCheck = false;

var makeInitBuffer = function(mode) {
	var size = new Buffer([255,255]);
	var counter = getCounter();
	var reply = new Buffer(mode);
	return Buffer.concat([size, counter, reply]);
}

var getCounter = function(){
	var counterBuf = new Buffer(2);
	counterBuf.writeInt16LE(counter);
	if(counter>=65535) {
		counter = 0;
	}
	counter++;
	return counterBuf;
}

var checkByteSize = function (buffer) {
	var bufferLength = buffer.length - 2;
	buffer[0] = bufferLength;
	buffer[1] = bufferLength >> 8;
}

Module.prototype.init = function(handler, config) {
};

Module.prototype.setSerialPort = function (sp) {
	this.sp = sp;
};

Module.prototype.requestInitialData = function(sp) {
	var that = this;

	if(!this.sp) {
		this.sp = sp;
	}
	
	if(!isSendInitData) {
		var initBuf = makeInitBuffer([128, 0, 0]);
		var motorStop = new Buffer([163, 129, 0, 129, 15, 129, 0]);
		var initMotor = Buffer.concat([initBuf, motorStop]);
		checkByteSize(initMotor);
		// return this.INIT_DATA.shift();
		sp.write(initMotor, function () {
			sensorChecking(that);
		});
	}
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
	return null;
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
	var that = this;
	var isSendData = false;
	var initBuf = makeInitBuffer([128, 0, 0]);
	var time = 0;
	var sendBody;
	Object.keys(this.PORT_MAP).forEach(function (port) {
		if(that.PORT_MAP[port] !== that.CHECK_PORT_MAP[port]) {
			isSendData = true;
		}

		var power = Number(that.PORT_MAP[port]);
		var brake = 0;
		if(power > 100) {
			power = 100;
		} else if(power < -100) {
			power = -100;
		} else if(power == 0) {
			brake = 1;
		}
		//timeset mode 232, 3 === 1000ms
		// var portOut = new Buffer([173, 129, 0, 129, that.outputPort[port], 129, power, 131, 0, 0, 0, 0, 131, 232, 3, 0, 0, 131, 0, 0, 0, 0, 129, brake]);
		// ifinity output port mode
		var portOut = new Buffer([164, 129, 0, 129, that.outputPort[port], 129, power, 166, 129, 0, 129, that.outputPort[port]]);

		if(!sendBody) {
			sendBody = new Buffer(portOut);
		} else {
			sendBody = Buffer.concat([sendBody, portOut]);
		}

		that.CHECK_PORT_MAP[port] = that.PORT_MAP[port];
	});

	if(isSendData) {
		var totalLength = initBuf.length + sendBody.length;
		var sendBuffer = Buffer.concat([initBuf, sendBody], totalLength);
		checkByteSize(sendBuffer);
		console.log(sendBuffer);
		return sendBuffer;
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

Module.prototype.sensorCheck = function () {
	var that = this;
	var initBuf = makeInitBuffer([0, 94, 0]);
	var counter = initBuf.readInt16LE(2);
	this.SENSOR_COUNTER_LIST[counter] = true;
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

	var totalLength = initBuf.length + sensorBody.length;
	var sendBuffer = Buffer.concat([initBuf, sensorBody], totalLength);
	checkByteSize(sendBuffer);
	that.sp.write(sendBuffer);
	
}


var sensorChecking = function(that) {
	if(!isSensorCheck) {
		that.sensing = setInterval(function(){
			that.sensorCheck();
		}, 200);
		isSensorCheck = true;
	}
}

Module.prototype.connect = function() {
};

Module.prototype.disconnect = function(connect) {
	clearInterval(this.sensing);
	if(this.sp) {
		this.sp.write(this.TERMINATE_SEQ,function(err){
			if(err) {
				console.log(err);
			}
			connect.close();
		}); 
	} else {
		connect.close();
	}
};

Module.prototype.reset = function() {
};

module.exports = new Module();