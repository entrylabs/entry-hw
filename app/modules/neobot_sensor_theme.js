function Module() {
	this.localBuffer = new Array(8);
	this.remoteBuffer = new Array(5);

	this.LOCAL_MAP = [
		'IN1',
		'IN2',
		'IN3',
		'IR',
		'BAT'
	];

	this.REMOTE_MAP = [
		'OUT1',
		'OUT2',
		'OUT3',
		'DCL',
		'DCR',
		'SND',
		'FND',
		'OPT'
	];
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
		if(data[i] === 171 && data[i + 1] === 205 ) {
			var dataSet = data.slice(i, i + 8);
			var dataSum = dataSet.reduce(function (result, value, idx) {
				if(idx < 2 || idx >= dataSet.length-1) {
					return result;
				}
				return result + value;
			}, 0);
			if((dataSum & 255) === dataSet[dataSet.length-1]) {
				state = true;
			}
			break;
		}
	}
	
	return state;
};

//로컬 데이터 처리
// data: Native Buffer
Module.prototype.handleLocalData = function(data) {
	var buffer = this.remoteBuffer;
	for(var i = 0; i < data.length - 1; i++) {
		if(data[i] === 171 && data[i + 1] === 205 ) {
			var dataSet = data.slice(i + 2, i + 7);

			dataSet.forEach(function (value, idx) {
				buffer[idx] = value;
			});

			break;
		}
	}
};

//리모트 데이터 전송
Module.prototype.requestRemoteData = function(handler) {
	var buffer = this.remoteBuffer;
	for(var i = 0; i < 5; i++) {
		handler.write(this.LOCAL_MAP[i], buffer[i]);
	}
};

//리모트 데이처 처리
Module.prototype.handleRemoteData = function(handler) {
	var buffer = this.localBuffer;

	this.REMOTE_MAP.forEach(function (key, idx) {
		buffer[idx] = handler.read(key);
	});
};

//로컬 데이터 전송
Module.prototype.requestLocalData = function() {
	var requestData = [];
	var buffer = this.localBuffer;

	// 시작 바이트
	requestData.push(0xCD);
	requestData.push(0xAB);

	var checksum = 0;
	var isFnd = false;
	buffer.forEach(function (value, idx) {
		if(idx === 6 && value > 0) {
			isFnd = true;
		} else if(idx === 7 && isFnd) {
			value = value | 8;
		}
		requestData.push(value);
		checksum += value;
	});

	checksum = checksum & 255;
	//체크썸
	requestData.push(checksum);

	return requestData;
};

Module.prototype.reset = function() {
};

module.exports = new Module();
