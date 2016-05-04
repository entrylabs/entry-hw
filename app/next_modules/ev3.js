function Module() {
	this.sp = null;
	this.sensors = [];
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
	this.motorMovementTypes = {
		Degrees: 0,
		Power: 1
	};
	this.deviceTypes = {
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
	this.sensorMode = {
		Touch: 0,
		Color: 2,
		Ultrasonic: 0,
		Gyroscope: 0
	}
	this.PORT_MAP = {
		A: {
			type: this.motorMovementTypes.Power,
			power: 0
		},
		B: {
			type: this.motorMovementTypes.Power,
			power: 0
		},
		C: {
			type: this.motorMovementTypes.Power,
			power: 0
		},
		D: {
			type: this.motorMovementTypes.Power,
			power: 0
		}
	}	
}

var counter = 0;
var responseSize = 11;
var isSendInitData = false;
var isSensorCheck = false;
var isConnect = false;

var makeInitBuffer = function(mode) {
	var size = new Buffer([255,255]);
	var counter = getCounter();
	var reply = new Buffer(mode);
	return Buffer.concat([size, counter, reply]);
}

var getCounter = function(){
	var counterBuf = new Buffer(2);
	counterBuf.writeInt16LE(counter);
	if(counter >= 32767) {
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


var sensorChecking = function(that) {
	if(!isSensorCheck) {
		that.sensing = setInterval(function(){
			that.sensorCheck();
		}, 200);
		isSensorCheck = true;
	}
}

var getSensorType = function(that, type) {
	var returnType;
	for(var key in that.deviceTypes) {
		if(that.deviceTypes[key] == type) {
			returnType = key;
			break;
		}
	}
	return returnType;
}
Module.prototype.init = function(handler, config) {
};

Module.prototype.setSerialPort = function (sp) {
	this.sp = sp;
};

Module.prototype.requestInitialData = function(sp) {
	var that = this;
	isConnect = true;
	if(!this.sp) {
		this.sp = sp;
	}
	
	if(!isSendInitData) {
		var initBuf = makeInitBuffer([128, 0, 0]);
		var motorStop = new Buffer([163, 129, 0, 129, 15, 129, 0]);
		var initMotor = Buffer.concat([initBuf, motorStop]);
		checkByteSize(initMotor);
		sp.write(initMotor, function () {
			sensorChecking(that);
		});
	}
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
				var mode = data[index + 1];
				var siValue = data.readFloatLE(index + 2) || 0;
				siValue = Number(siValue.toFixed(1));
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
};

// Web Socket(엔트리)에 전달할 데이터
Module.prototype.requestRemoteData = function(handler) {
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
	Object.keys(this.PORT_MAP).forEach(function (port) {
		that.PORT_MAP[port] = handler.read(port);
	});	

};


// 하드웨어에 전달할 데이터
Module.prototype.requestLocalData = function() {
	var that = this;
	var isSendData = false;
	var initBuf = makeInitBuffer([128, 0, 0]);
	var time = 0;
	var sendBody;
	Object.keys(this.PORT_MAP).forEach(function (port) {
		var portMap = that.PORT_MAP[port];
		var checkPortMap = that.CHECK_PORT_MAP[port];
		if((!checkPortMap) || (portMap.id !== checkPortMap.id)) {
			isSendData = true;

			var portOut;
			var power = Number(portMap.power);
			if(portMap.type == that.motorMovementTypes.Power) {
				var time = Number(portMap.time) || 0;
				var brake = 0;
				if(power > 100) {
					power = 100;
				} else if(power < -100) {
					power = -100;
				} else if(power == 0) {
					brake = 1;
				}

				if(time <= 0) {
					// ifinity output port mode
					portOut = new Buffer([164, 129, 0, 129, that.outputPort[port], 129, power, 166, 129, 0, 129, that.outputPort[port]]);
				} else {
					// timeset mode 232, 3 === 1000ms
					var frontBuffer = new Buffer([173, 129, 0, 129, that.outputPort[port], 129, power, 131, 0, 0, 0, 0, 131]);
					var backBuffer = new Buffer([131, 0, 0, 0, 0, 129, brake]);
					var timeBuffer = new Buffer(4);
					timeBuffer.writeInt32LE(time);
					portOut = Buffer.concat([ frontBuffer, timeBuffer, backBuffer]);
				}
			} else {
				var degree = Number(portMap.degree) || 0;
				var frontBuffer = new Buffer([172, 129, 0, 129, that.outputPort[port], 129, power, 131, 0, 0, 0, 0, 131]);
				var backBuffer = new Buffer([131, 0, 0, 0, 0, 129, brake]);
				var degreeBuffer = new Buffer(4);
				degreeBuffer.writeInt32LE(degree);
				portOut = Buffer.concat([ frontBuffer, degreeBuffer, backBuffer]);
			}

			if(portOut) {
				if(!sendBody) {
					sendBody = new Buffer(portOut);
				} else {
					sendBody = Buffer.concat([sendBody, portOut]);
				}	
			}

			that.CHECK_PORT_MAP[port] = that.PORT_MAP[port];
		}	
	});

	if(isSendData && sendBody) {
		var totalLength = initBuf.length + sendBody.length;
		var sendBuffer = Buffer.concat([initBuf, sendBody], totalLength);
		checkByteSize(sendBuffer);
		return sendBuffer;
	} else {
		return null;
	}
};

Module.prototype.sensorCheck = function () {
	var that = this;
	var initBuf = makeInitBuffer([0, 94, 0]);
	var counter = initBuf.readInt16LE(2);
	this.SENSOR_COUNTER_LIST[counter] = true;
	var sensorBody;
	var index = 0;
	Object.keys(this.SENSOR_MAP).forEach(function(p) {
		var mode = 0;
		if(that.returnData[p] && that.returnData[p]['type']) {
			var type = getSensorType(that, that.returnData[p]['type']);
			mode = that.sensorMode[type] || 0;
		}
		var port = Number(p) - 1;
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

Module.prototype.connect = function() {
};

Module.prototype.disconnect = function(connect) {
	if(isConnect) {
		clearInterval(this.sensing);
		counter = 0;
		responseSize = 11;
		isSendInitData = false;
		isSensorCheck = false;
		// this.sp.flush();
		isConnect = false;

		if(this.sp) {
			var that = this;
			this.sp.write(new Buffer("070055008000000201","hex"), function(err){
				that.sp = null;
				if(err) {
					console.log(err);
				}
				connect.close();
			}); 
		} else {
			connect.close();
		}
	}
};

Module.prototype.reset = function() {
};

module.exports = new Module();