function Module() {
	// Constants
	this.PACKET_SIZE = 15;
	this.DATA_HEADER_BYTE1 = 0xAB;
	this.DATA_HEADER_BYTE2 = 0x10;
	this.DATA_CHKSUM_OPERATOR = 0xFF;

	// Vars
	/* this.localBuffer = new Array(12); */
	this.remoteBuffer = new Array(12);
	this.LOCAL_MAP = [
		'JoystickX',
		'JoystickY',
		'GyroX',
		'GyroY',
		'Acceleration',
		'BtnPressEvent',
		'JoystickPressEvent',
		'JoystickMoveEvent'
	];
	/* this.REMOTE_MAP = [
		'JoystickXL',
		'JoystickXH',
		'JoystickYL',
		'JoystickYH',
		'GyroXL',
		'GyroXH',
		'GyroYL',
		'GyroYH',
		'Acceleration',
		'BtnPressEvent',
		'JoystickPressEvent',
		'JoystickMoveEvent'
	]; */
}

Module.prototype.init = function(handler, config) {
};

Module.prototype.requestInitialData = function() {
	return null;
};

Module.prototype.checkInitialData = function(data, config) {
	return true;
};

Module.prototype.validateLocalData = function(data) {
	var state = false;

	for(var i = 0; i < data.length - 1; i++) {
		if(data[i] === this.DATA_HEADER_BYTE1 
			&& data[i + 1] === this.DATA_HEADER_BYTE2) {
			var dataSet = data.slice(i, i + this.PACKET_SIZE);
			var dataSum = dataSet.reduce(function (result, value, idx) {
				if(idx < 2 || idx >= dataSet.length-1) {
					return result;
				}
				return result + value;
			}, 0);
			if((dataSum & this.DATA_CHKSUM_OPERATOR) === dataSet[dataSet.length-1]) {
				state = true;
			}
			break;
		}
	}
	
	return state;
};

Module.prototype.handleLocalData = function(data) {
	var buffer = this.remoteBuffer;
	for(var i = 0; i < data.length - 1; i++) {
		if(data[i] === this.DATA_HEADER_BYTE1 
			&& data[i + 1] === this.DATA_HEADER_BYTE2 ) {
			var dataSet = data.slice(i + 2, i + 14);

			dataSet.forEach(function (value, idx) {
				buffer[idx] = value;
			});

			break;
		}
	}
};

Module.prototype.requestRemoteData = function(handler) {
	var buffer = this.remoteBuffer;

	/* handler.write(this.LOCAL_MAP['JoystickX'], (buffer[0] << 8) + buffer[1]);
	handler.write(this.LOCAL_MAP['JoystickY'], (buffer[2] << 8) + buffer[3]);
	handler.write(this.LOCAL_MAP['GyroX'], (buffer[4] << 8) + buffer[5]);
	handler.write(this.LOCAL_MAP['GyroY'], (buffer[6] << 8) + buffer[7]); */

	var joystickX = ((buffer[0] + (buffer[1] << 8)) - 1000) / 3.75;
	var joystickY = ((buffer[2] + (buffer[3] << 8)) - 1000) / 6.67;
	var gyroX = ((buffer[4] + (buffer[5] << 8)) - 1000) / 3.75;
	var gyroY = ((buffer[6] + (buffer[7] << 8)) - 1000) / 6.67;
	handler.write(this.LOCAL_MAP[0], joystickX);
	handler.write(this.LOCAL_MAP[1], joystickY);
	handler.write(this.LOCAL_MAP[2], gyroX);
	handler.write(this.LOCAL_MAP[3], gyroY);

	for(var i = 4; i < 8; i++) {
		handler.write(this.LOCAL_MAP[i], buffer[i+4]);
	}
};

////
Module.prototype.handleRemoteData = function(handler) {
	/* var buffer = this.localBuffer;

	this.REMOTE_MAP.forEach(function (key, idx) {
		buffer[idx] = handler.read(key);
	}); */
};

Module.prototype.requestLocalData = function() {
	//var buffer = this.localBuffer;
	var requestData = [];

/* 	// 시작 바이트
	requestData.push(0x10);
	requestData.push(0xAB);

	var checksum = 0;
	buffer.forEach(function (value, idx) {
		requestData.push(value);
		checksum += value;
	});

	checksum = checksum & 255;
	//체크썸
	requestData.push(checksum); */

	return requestData;
};
Module.prototype.reset = function() {
};

module.exports = new Module();
