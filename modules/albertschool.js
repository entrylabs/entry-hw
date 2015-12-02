'use strict';
function Module() {
	this.sensory = {
		signalStrength: 0,
		leftProximity: 0,
		rightProximity: 0,
		light: 0,
		battery: 0,
		oidEvent: 0,
		oid: -1,
		leftWheel: 0,
		rightWheel: 0,
		buzzer: 0
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
		frontLed: 0
	};
	this.battery = {
		sum: 0,
		data: undefined,
		count: 0,
		initial: true
	};
	this.oidEvent = 0;
	this.oid = -2;
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
	SIGNAL_STRENGTH: 'signalStrength',
	LEFT_PROXIMITY: 'leftProximity',
	RIGHT_PROXIMITY: 'rightProximity',
	LIGHT: 'light',
	BATTERY: 'battery',
	OID_EVENT: 'oidEvent',
	OID: 'oid'
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
	for(var i = value.length; i < 6; ++i)
		result += '0';
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

Module.prototype.calculateBattery = function(value) {
	var battery = this.battery;
	var calculate = function(data) {
		if(data >= 165)
			data = (data - 165) * 1.889 + 15.0;
		else
			data = data - 150;
		if(data > 100) data = 100;
		else if(data < 0) data = 0;
		return parseInt(data);
	};
	
	if(!battery.data) {
		battery.data = new Array(256);
		for(var i = 0; i < 256; ++i) {
			battery.data[i] = 0;
		}
	}
	if(++battery.count < 100) {
		battery.data[value] ++;
	} else {
		var max = 0;
		var index = 0;
		for(var i = 0; i < 256; ++i) {
			if(battery.data[i] >= max) {
				max = battery.data[i];
				index = i;
			}
			battery.data[i] = 0;
		}
		battery.count = 0;
		battery.initial = false;
		battery.value = calculate(index);
	}
	if(battery.initial) {
		battery.sum += value;
		var tmp = battery.sum / battery.count;
		battery.value = calculate(tmp);
	}
	return battery.value;
};

Module.prototype.calculateOid = function(low, mid, high) {
	var data = -2;
	if((low & 0xe0) == 0) 
	{
		if((low & 0x10) != 0)
			data = -1;
		else
			data = ((mid & 0xff) << 8) | (high & 0xff);
	}
	return data;
};

Module.prototype.handleLocalData = function(data) { // data: string
	if(data.length != 53) {
		return;
	}
	var sensory = this.sensory;
	var str = data.slice(4, 5);
	if(str == '1') {
		// signal strength
		str = data.slice(6, 8);
		var value = parseInt(str, 16);
		value -= 0x100;
		sensory.signalStrength = value;
		// battery
		str = data.slice(8, 10);
		value = parseInt(str, 16);
		sensory.battery = this.calculateBattery(value);
		// left proximity
		str = data.slice(10, 12);
		value = parseInt(str, 16);
		sensory.leftProximity = value;
		// right proximity
		str = data.slice(12, 14);
		value = parseInt(str, 16);
		sensory.rightProximity = value;
		// light
		str = data.slice(14, 18);
		value = parseInt(str, 16);
		sensory.light = value;
		// oid
		str = data.slice(18, 20);
		var oidEvent = parseInt(str, 16);
		str = data.slice(20, 22);
		var low = parseInt(str, 16);
		str = data.slice(32, 34);
		var mid = parseInt(str, 16);
		str = data.slice(34, 36);
		var high = parseInt(str, 16);
		value = this.calculateOid(low, mid, high);
		if(value == -2) {
			if(this.oid == -2)
				value = -1;
			else
				value = this.oid;
		} else {
			if(oidEvent != this.oidEvent || value != this.oid) {
				this.oidEvent = oidEvent;
				this.oid = value;
				sensory.oid = value;
				sensory.oidEvent ++;
				if(sensory.oidEvent > 255)
					sensory.oidEvent = 0;
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
	var sensory = this.sensory;
	var t;
	// left wheel
	if(handler.e(Albert.LEFT_WHEEL)) {
		t = handler.read(Albert.LEFT_WHEEL);
		if(t < -100) t = -100;
		else if(t > 100) t = 100;
		motoring.leftWheel = t;
		sensory.leftWheel = t;
	}
	// right wheel
	if(handler.e(Albert.RIGHT_WHEEL)) {
		t = handler.read(Albert.RIGHT_WHEEL);
		if(t < -100) t = -100;
		else if(t > 100) t = 100;
		motoring.rightWheel = t;
		sensory.rightWheel = t;
	}
	// buzzer
	if(handler.e(Albert.BUZZER)) {
		t = handler.read(Albert.BUZZER);
		if(t < 0) t = 0;
		else if(t > 167772.15) t = 167772.15;
		motoring.buzzer = t;
		sensory.buzzer = t;
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
		motoring.buzzer = 0;
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
	var sensory = this.sensory;
	sensory.oidEvent = 0;
	sensory.oid = -1;
	sensory.leftWheel = 0;
	sensory.rightWheel = 0;
	sensory.buzzer = 0;
	this.oidEvent = 0;
	this.oid = -2;
};

module.exports = new Module();