'use strict';
function Module() {
	this.sensory = {
		signalStrength: 0,
		leftProximity: 0,
		rightProximity: 0,
		accelerationX: 0,
		accelerationY: 0,
		accelerationZ: 0,
		positionX: -1,
		positionY: -1,
		orientation: -200,
		light: 0,
		temperature: 0,
		frontOid: -1,
		backOid: -1,
		batteryState: 2,
		tilt: 0
	};
	this.motoring = {
		leftWheel: 0,
		rightWheel: 0,
		buzzer: 0,
		topology: 0,
		leftEye: 0,
		rightEye: 0,
		note: 0,
		bodyLed: 0,
		frontLed: 0,
		padWidth: 0,
		padHeight: 0
	};
	this.oid = {
		front: -2,
		rear: -2
	};
}

var Albert = {
	LEFT_WHEEL: 'leftWheel',
	RIGHT_WHEEL: 'rightWheel',
	BUZZER: 'buzzer',
	TOPOLOGY: 'topology',
	LEFT_EYE: 'leftEye',
	RIGHT_EYE: 'rightEye',
	NOTE: 'note',
	BODY_LED: 'bodyLed',
	FRONT_LED: 'frontLed',
	PAD_WIDTH: 'padWidth',
	PAD_HEIGHT: 'padHeight'
};

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
	return 'FF\r';
};

Module.prototype.checkInitialData = function(data, config) {
	if(data.slice(0, 2) == 'FF') {
		var info = data.split(/[,\n]+/);
		if(info && info.length >= 5) {
			if(info[1] == 'Albert School' && info[2] == '05' && info[4].length >= 12) {
				config.id = '0205' + info[3];
				this.address = info[4].substring(0, 12);
				return true;
			} else {
				return false;
			}
		}
	}
};

Module.prototype.validateLocalData = function(data) {
	return (data.length == 53);
};

Module.prototype.calculateOid = function(low, mid, high) {
	var data = -2;
	if((low & 0x40) != 0 && (low & 0x20) == 0) {
		var value = ((low & 0x03) << 16) | ((mid & 0xff) << 8) | (high & 0xff);
		if(value < 0x010000) data = value; // index
		else if(value < 0x03fff0) data = -1;
		else if(value > 0x03fffb && value < 0x040000) data = -1;
	}
	return data;
};

Module.prototype.handleLocalData = function(data) { // data: string
	if(data.length != 53) return;
	
	var str = data.slice(4, 5);
	var value = parseInt(str, 16);
	if(value != 1) return; // invalid data

	var sensory = this.sensory;
	// signal strength
	str = data.slice(6, 8);
	value = parseInt(str, 16);
	value -= 0x100;
	sensory.signalStrength = value;
	// left proximity
	str = data.slice(10, 12);
	value = parseInt(str, 16);
	sensory.leftProximity = value;
	// right proximity
	str = data.slice(12, 14);
	value = parseInt(str, 16);
	sensory.rightProximity = value;
	// flag
	str = data.slice(30, 32);
	var flag = parseInt(str, 16);
	// acceleration
	str = data.slice(32, 36);
	value = parseInt(str, 16);
	if(value > 0x7fff) value -= 0x10000;
	value = Math.round(value / 4);
	if(flag == 0) sensory.accelerationX = value;
	else if(flag == 1) sensory.accelerationY = value;
	else if(flag == 2) sensory.accelerationZ = value;
	// tilt
	if(sensory.accelerationZ < 2048 && sensory.accelerationX > 2048 && sensory.accelerationY > -1024 && sensory.accelerationY < 1024) value = 1;
	else if(sensory.accelerationZ < 2048 && sensory.accelerationX < -2048 && sensory.accelerationY > -1024 && sensory.accelerationY < 1024) value = -1;
	else if(sensory.accelerationZ < 2048 && sensory.accelerationY > 2048 && sensory.accelerationX > -1024 && sensory.accelerationX < 1024) value = 2;
	else if(sensory.accelerationZ < 2048 && sensory.accelerationY < -2048 && sensory.accelerationX > -1024 && sensory.accelerationX < 1024) value = -2;
	else if(sensory.accelerationZ > 3072 && sensory.accelerationX > -2048 && sensory.accelerationX < 2048 && sensory.accelerationY > -2048 && sensory.accelerationY < 2048) value = 3;
	else if(sensory.accelerationZ < -3072 && sensory.accelerationX > -1024 && sensory.accelerationX < 1024 && sensory.accelerationY > -1024 && sensory.accelerationY < 1024) value = -3;
	else value = 0;
	sensory.tilt = value;
	// light
	str = data.slice(14, 18);
	value = parseInt(str, 16);
	sensory.light = value;
	// temperature
	str = data.slice(36, 38);
	value = parseInt(str, 16);
	if(value > 0x7f) value -= 0x100;
	value = value / 2.0 + 24;
	sensory.temperature = parseInt(value);
	// battery
	str = data.slice(8, 10);
	value = parseInt(str, 16);
	value = (value + 200) / 100.0;
	var state = 2;
	if(value <= 3.6) state = 0;
	else if(value <= 3.65) state = 1;
	sensory.batteryState = state;
	// front oid
	var oid = this.oid;
	str = data.slice(18, 20);
	var low = parseInt(str, 16);
	str = data.slice(20, 22);
	var mid = parseInt(str, 16);
	str = data.slice(22, 24);
	var high = parseInt(str, 16);
	var v1 = this.calculateOid(low, mid, high);
	if(v1 == -2) {
		if(oid.front == -2) v1 = -1;
		else v1 = oid.front;
	} else {
		if(v1 != oid.front) {
			sensory.frontOid = v1;
			oid.front = v1;
		}
	}
	// rear oid
	str = data.slice(24, 26);
	low = parseInt(str, 16);
	str = data.slice(26, 28);
	mid = parseInt(str, 16);
	str = data.slice(28, 30);
	high = parseInt(str, 16);
	var v2 = this.calculateOid(low, mid, high);
	if(v2 == -2) {
		if(oid.rear == -2) v2 = -1;
		else v2 = oid.rear;
	} else {
		if(v2 != oid.rear) {
			sensory.backOid = v2;
			oid.rear = v2;
		}
	}
	var motoring = this.motoring;
	if(motoring.padWidth > 0 && motoring.padHeight > 0) {
		if(v1 > 0 && v1 <= 40000) {
			var x = (v1 - 1) % motoring.padWidth;
			var y = motoring.padHeight - parseInt((v1 - 1) / motoring.padWidth) - 1;
			if(x >= 0 && x < motoring.padWidth) sensory.positionX = x;
			if(y >= 0 && y < motoring.padHeight) sensory.positionY = y;
		}
		if(v2 > 0 && v2 <= 40000 && sensory.positionX >= 0 && sensory.positionY >= 0) {
			var x = (v2 - 1) % motoring.padWidth;
			var y = motoring.padHeight - parseInt((v2 - 1) / motoring.padWidth) - 1;
			if(x >= 0 && x < motoring.padWidth && y >= 0 && y < motoring.padHeight) {
				x = sensory.positionX - x;
				y = sensory.positionY - y;
				sensory.orientation = parseInt(Math.atan2(y, x) * 180.0 / 3.14159265);
			}
		}
	}
};

Module.prototype.requestRemoteData = function(handler) {
	var sensory = this.sensory;
	for(var key in sensory) {
		handler.write(key, sensory[key]);
	}
};

Module.prototype.handleRemoteData = function(handler) {
	var motoring = this.motoring;
	var t;
	// left wheel
	if(handler.e(Albert.LEFT_WHEEL)) {
		t = handler.read(Albert.LEFT_WHEEL);
		if(t < -100) t = -100;
		else if(t > 100) t = 100;
		motoring.leftWheel = t;
	}
	// right wheel
	if(handler.e(Albert.RIGHT_WHEEL)) {
		t = handler.read(Albert.RIGHT_WHEEL);
		if(t < -100) t = -100;
		else if(t > 100) t = 100;
		motoring.rightWheel = t;
	}
	// buzzer
	if(handler.e(Albert.BUZZER)) {
		t = handler.read(Albert.BUZZER);
		if(t < 0) t = 0;
		else if(t > 167772.15) t = 167772.15;
		motoring.buzzer = t;
	}
	// topology
	if(handler.e(Albert.TOPOLOGY)) {
		t = handler.read(Albert.TOPOLOGY);
		if(t < 0) t = 0;
		else if(t > 15) t = 15;
		motoring.topology = t;
	}
	// left eye
	if(handler.e(Albert.LEFT_EYE)) {
		t = handler.read(Albert.LEFT_EYE);
		if(t < 0) t = 0;
		else if(t > 7) t = 7;
		motoring.leftEye = t;
	}
	// right eye
	if(handler.e(Albert.RIGHT_EYE)) {
		t = handler.read(Albert.RIGHT_EYE);
		if(t < 0) t = 0;
		else if(t > 7) t = 7;
		motoring.rightEye = t;
	}
	// note
	if(handler.e(Albert.NOTE)) {
		t = handler.read(Albert.NOTE);
		if(t < 0) t = 0;
		else if(t > 88) t = 88;
		motoring.note = t;
	}
	// body led
	if(handler.e(Albert.BODY_LED)) {
		t = handler.read(Albert.BODY_LED);
		if(t < 0) t = 0;
		else if(t > 1) t = 1;
		motoring.bodyLed = t;
	}
	// front led
	if(handler.e(Albert.FRONT_LED)) {
		t = handler.read(Albert.FRONT_LED);
		if(t < 0) t = 0;
		else if(t > 1) t = 1;
		motoring.frontLed = t;
	}
	// pad width
	if(handler.e(Albert.PAD_WIDTH)) {
		t = handler.read(Albert.PAD_WIDTH);
		if(t < 0) t = 0;
		else if(t > 40000) t = 40000;
		motoring.padWidth = t;
	}
	// pad height
	if(handler.e(Albert.PAD_HEIGHT)) {
		t = handler.read(Albert.PAD_HEIGHT);
		if(t < 0) t = 0;
		else if(t > 40000) t = 40000;
		motoring.padHeight = t;
	}
};

Module.prototype.requestLocalData = function() {
	var motoring = this.motoring;
	var str = this.toHex(motoring.topology & 0x0f);
	str += '0010';
	str += this.toHex(motoring.leftWheel);
	str += this.toHex(motoring.rightWheel);
	str += this.toHex(motoring.leftEye);
	str += this.toHex(motoring.rightEye);
	str += this.toHex3(motoring.buzzer * 100);
	str += this.toHex(motoring.note);
	str += this.toHex(motoring.bodyLed);
	str += this.toHex(motoring.frontLed);
	str += '00000000000000-';
	str += this.address;
	str += '\r';
	return str;
};

Module.prototype.reset = function() {
	var motoring = this.motoring;
	motoring.leftWheel = 0;
	motoring.rightWheel = 0;
	motoring.buzzer = 0;
	motoring.topology = 0;
	motoring.leftEye = 0;
	motoring.rightEye = 0;
	motoring.note = 0;
	motoring.bodyLed = 0;
	motoring.frontLed = 0;
	motoring.padWidth = 0;
	motoring.padHeight = 0;
	var oid = this.oid;
	oid.front = -2;
	oid.rear = -2;
};

module.exports = new Module();
