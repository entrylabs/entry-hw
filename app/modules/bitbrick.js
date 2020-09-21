function Module() {
	this.initialBuffer = new Array(20);
	this.localBuffer = new Array(20);
	this.remoteBuffer = new Array(17);
	
	for(var i = 0; i < 20; ++i) {
		this.initialBuffer[i] = 0;
		this.localBuffer[i] = 0;
	}
	for(var i = 0; i < 17; ++i) {
		this.remoteBuffer[i] = 0;
	}
	this.initialBuffer[0] = 0xFF;
	this.initialBuffer[1] = 0xFF;
	this.initialBuffer[18] = 0xFE;
	this.initialBuffer[19] = 0xFE;
	this.localBuffer[0] = 0xFF;
	this.localBuffer[1] = 0xFF;
	this.localBuffer[18] = 0xFE;
	this.localBuffer[19] = 0xFE;
}


Module.prototype.SENSOR_MAP = {
	1: "light",
	2: "IR", 
	3: "touch", 
	4: "potentiometer",
	5: "MIC",
	6: "ultrasonicSensor",
	10: "vibrationSensor",
    21: "UserSensor",
    11: "UserInput",
	20: "LED",
	19: "SERVO",
	18: "DC"
};

Module.prototype.PORT_MAP = {
	"buzzer": 2,
	"5": 4,
	"6": 6,
	"7": 8,
	"8": 10,
	"LEDR": 12,
	"LEDG": 14,
	"LEDB": 16
};

Module.prototype.init = function(handler, config) {
};

Module.prototype.requestInitialData = function() {
	return this.initialBuffer;
};

Module.prototype.checkInitialData = function(data, config) {
	if(data && data.length == 17) {
		if(data[0] === 0xFF && data[1] === 0xFF && data[15] === 0xFE && data[16] === 0xFE) {
			return true;
		} else {
			return false;
		}
	}
};

Module.prototype.handleRemoteData = function(handler) {
	var buffer = this.localBuffer;
	for (var key in this.PORT_MAP) {
		var port = this.PORT_MAP[key];
		var value = handler.read(key);
		if (value === undefined)
			continue;
		buffer[port] = value >> 8;
		buffer[port + 1] = value & (Math.pow(2, 9) - 1);
	}
};

Module.prototype.requestLocalData = function() {
	return this.localBuffer;
};

Module.prototype.handleLocalData = function(data) { // data: Native Buffer
	var buffer = this.remoteBuffer;
	if(data && data.length == 17) {
		if(data[0] === 0xFF && data[1] === 0xFF && data[15] === 0xFE && data[16] === 0xFE) {
			for(var i = 0; i < 17; ++i) {
				buffer[i] = data[i];
			}
		}
	}
};

Module.prototype.requestRemoteData = function(handler) {
	var buffer = this.remoteBuffer;
	for(var i = 2; i < 17; i+=1) {
		var value = buffer[i] * Math.pow(2, 8) + buffer[i + 1];
		var sensorType = this.SENSOR_MAP[buffer[i]];
		if (i < 10)
			sensorType = this.SENSOR_MAP[buffer[i] >> 2];
		var sensorValue = value & (Math.pow(2, 10) - 1);
		if (i < 10) {
			if (sensorType)
				handler.write(i/2, {type: sensorType, value: sensorValue});
			else
				handler.write(i/2, null);
			i+=1;
		} else {
			if (sensorType)
				handler.write((i-5), {type: sensorType});
			else
				handler.write((i-5), null);
		}
	}
};

Module.prototype.reset = function() {
	var buffer = this.localBuffer;
	for(var i = 2; i < 18; ++i) {
		buffer[i] = 0;
	}
};

module.exports = new Module();