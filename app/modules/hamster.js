'use strict';
function Module() {
	this.sensory = {
		signalStrength: 0,
		leftProximity: 0,
		rightProximity: 0,
		leftFloor: 0,
		rightFloor: 0,
		accelerationX: 0,
		accelerationY: 0,
		accelerationZ: 0,
		light: 0,
		temperature: 0,
		inputA: 0,
		inputB: 0,
		lineTracerState: 0,
		lineTracerStateId: 0,
		batteryState: 2
	};
	this.motoring = {
		leftWheel: 0,
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
		state: 0,
		count: 0
	};
	this.battery = {
		state: 2,
		data: new Array(10),
		sum: 0.0,
		index: 0,
		count: 0
	};
}

var Hamster = {
	LEFT_WHEEL: 'leftWheel',
	RIGHT_WHEEL: 'rightWheel',
	BUZZER: 'buzzer',
	OUTPUT_A: 'outputA',
	OUTPUT_B: 'outputB',
	TOPOLOGY: 'topology',
	LEFT_LED: 'leftLed',
	RIGHT_LED: 'rightLed',
	NOTE: 'note',
	LINE_TRACER_MODE: 'lineTracerMode',
	LINE_TRACER_MODE_ID: 'lineTracerModeId',
	LINE_TRACER_SPEED: 'lineTracerSpeed',
	IO_MODE_A: 'ioModeA',
	IO_MODE_B: 'ioModeB',
	CONFIG_PROXIMITY: 'configProximity',
	CONFIG_GRAVITY: 'configGravity',
	CONFIG_BAND_WIDTH: 'configBandWidth',
	COLOR_TO_RGB: [ [0, 0, 0], [0, 0, 255], [0, 255, 0], [0, 255, 255], [255, 0, 0], [255, 0, 255], [255, 255, 0], [255, 255, 255] ]
};

Module.prototype.toHex = function(number) {
	var value = parseInt(number);
	if(value < 0) value += 0x100;

	value = value.toString(16).toUpperCase();
	if(value.length > 1) return value;
	else return '0' + value;
};

Module.prototype.toHex2 = function(number) {
	var value = parseInt(number);
	if(value < 0) value += 0x10000;

	value = value.toString(16).toUpperCase();
	var result = '';
	for(var i = value.length; i < 4; ++i) {
		result += '0';
	}
	return result + value;
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

Module.prototype.colorToRgb = function(color) {
	if(color > 7) color = 7;
	else if(color < 0) color = 0;
	return Hamster.COLOR_TO_RGB[color];
};

Module.prototype.speedToGain = function(speed) {
	if(speed > 10) speed = 10;
	else if(speed < 1) speed = 1;
	switch(speed) {
		case 1:
		case 2: return 6;
		case 3:
		case 4: return 5;
		case 5:
		case 6: return 4;
		case 7:
		case 8: return 3;
		case 9:
		case 10: return 2;
	}
	return 2;
};

Module.prototype.requestInitialData = function() {
	return 'FF\r';
};

Module.prototype.checkInitialData = function(data, config) {
	if(data && data.slice(0, 2) == 'FF') {
		var info = data.split(/[,\n]+/);
		if(info && info.length >= 5) {
			if(info[1] == 'Hamster' && info[2] == '04' && info[4].length >= 12) {
				config.id = '0204' + info[3];
				this.address = info[4].substring(0, 12);
				this.isHamsterS = false;
				return true;
			} else if(info[2] == '0E' && info[4].length >= 12) {
				config.id = '0204' + info[3];
				this.address = info[4].substring(0, 12);
				this.isHamsterS = true;
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

Module.prototype.handleLocalData = function(data) { // data: string
	if(data.length != 53) return;

	if(this.isHamsterS) {
		var str = data.slice(0, 1);
		var value = parseInt(str, 16);
		if(value != 1) return; // invalid data
		
		var sensory = this.sensory;
		// left proximity
		str = data.slice(6, 8);
		value = parseInt(str, 16);
		sensory.leftProximity = value;
		// right proximity
		str = data.slice(8, 10);
		value = parseInt(str, 16);
		sensory.rightProximity = value;
		str = data.slice(38, 40);
		var value2 = parseInt(str, 16);
		if((value2 & 0x01) == 0) { // flag
			// light
			str = data.slice(10, 14);
			value = parseInt(str, 16);
			sensory.light = value;
		} else {
			// temperature
			str = data.slice(10, 12);
			value = parseInt(str, 16);
			if(value > 0x7f) value -= 0x100;
			value = value / 2.0 + 23;
			value = value.toFixed(1);
			sensory.temperature = value;
		}
		// left floor
		str = data.slice(14, 16);
		value = parseInt(str, 16);
		sensory.leftFloor = value;
		// right floor
		str = data.slice(16, 18);
		value = parseInt(str, 16);
		sensory.rightFloor = value;
		// acceleration x
		str = data.slice(18, 22);
		value = parseInt(str, 16);
		if(value > 0x7fff) value -= 0x10000;
		sensory.accelerationX = value;
		// acceleration y
		str = data.slice(22, 26);
		value = parseInt(str, 16);
		if(value > 0x7fff) value -= 0x10000;
		sensory.accelerationY = value;
		// acceleration z
		str = data.slice(26, 30);
		value = parseInt(str, 16);
		if(value > 0x7fff) value -= 0x10000;
		sensory.accelerationZ = value;
		// input a
		str = data.slice(30, 32);
		value = parseInt(str, 16);
		sensory.inputA = value;
		// input b
		str = data.slice(32, 34);
		value = parseInt(str, 16);
		sensory.inputB = value;
		// signal strength
		str = data.slice(36, 38);
		value = parseInt(str, 16);
		value -= 0x100;
		sensory.signalStrength = value;
		value = (value2 >> 6) & 0x03;
		if((value & 0x02) != 0) {
			var lineTracer = this.lineTracer;
			if(lineTracer.event == 1) {
				if(value == 0x02) {
					if(++lineTracer.count > 5) lineTracer.event = 2;
				} else {
					lineTracer.event = 2;
				}
			}
			if(lineTracer.event == 2) {
				if(value != lineTracer.state || lineTracer.count > 5) {
					lineTracer.state = value;
					sensory.lineTracerState = (value << 5);
					sensory.lineTracerStateId = (sensory.lineTracerStateId % 255) + 1;
					if(value == 0x02) {
						lineTracer.event = 0;
						lineTracer.count = 0;
					}
				}
			}
		}
		// battery state
		value = (value2 >> 1) & 0x03;
		if(value == 0) value = 2;
		else if(value >= 2) value = 0;
		var batt = this.battery;
		if(value != batt.state) {
			batt.state = value;
			sensory.batteryState = value;
		}
	} else {
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
		str = data.slice(8, 10);
		value = parseInt(str, 16);
		sensory.leftProximity = value;
		// right proximity
		str = data.slice(10, 12);
		value = parseInt(str, 16);
		sensory.rightProximity = value;
		// left floor
		str = data.slice(12, 14);
		value = parseInt(str, 16);
		sensory.leftFloor = value;
		// right floor
		str = data.slice(14, 16);
		value = parseInt(str, 16);
		sensory.rightFloor = value;
		// acceleration x
		str = data.slice(16, 20);
		value = parseInt(str, 16);
		if(value > 0x7fff) value -= 0x10000;
		sensory.accelerationX = value;
		// acceleration y
		str = data.slice(20, 24);
		value = parseInt(str, 16);
		if(value > 0x7fff) value -= 0x10000;
		sensory.accelerationY = value;
		// acceleration z
		str = data.slice(24, 28);
		value = parseInt(str, 16);
		if(value > 0x7fff) value -= 0x10000;
		sensory.accelerationZ = value;
		// flag
		str = data.slice(28, 30);
		var flag = parseInt(str, 16);
		if(flag == 0) {
			// light
			str = data.slice(30, 34);
			value = parseInt(str, 16);
			sensory.light = value;
		} else {
			// temperature
			str = data.slice(30, 32);
			value = parseInt(str, 16);
			if(value > 0x7f) value -= 0x100;
			value = value / 2.0 + 24;
			value = value.toFixed(1);
			sensory.temperature = value;
			// battery
			str = data.slice(32, 34);
			value = parseInt(str, 16);
			value = value / 100.0 + 2;
			var batt = this.battery;
			if(batt.count < 10) {
				++ batt.count;
			} else {
				batt.index %= 10;
				batt.sum -= batt.data[batt.index];
			}
			batt.sum += value;
			batt.data[batt.index] = value;
			++ batt.index;
			value = batt.sum / batt.count;
			var state = 2;
			if(value < 3.0) state = 0;
			else if(value < 3.6) state = 1;
			if(state != batt.state) {
				batt.state = state;
				sensory.batteryState = state;
			}
		}
		// input a
		str = data.slice(34, 36);
		value = parseInt(str, 16);
		sensory.inputA = value;
		// input b
		str = data.slice(36, 38);
		value = parseInt(str, 16);
		sensory.inputB = value;
		// line tracer state
		str = data.slice(38, 40);
		value = parseInt(str, 16);
		if((value & 0x40) != 0) {
			var lineTracer = this.lineTracer;
			if(lineTracer.event == 1) {
				if(value != 0x40) {
					lineTracer.event = 2;
				}
			}
			if(lineTracer.event == 2) {
				if(value != lineTracer.state) {
					lineTracer.state = value;
					sensory.lineTracerState = value;
					sensory.lineTracerStateId = (sensory.lineTracerStateId % 255) + 1;
					if(value == 0x40) {
						lineTracer.event = 0;
					}
				}
			}
		}
	}
};

Module.prototype.requestRemoteData = function(handler) {
	var sensory = this.sensory;
	for(var key in sensory) {
		handler.write(key, sensory[key]);
	}
	sensory.lineTracerState = 0;
};

Module.prototype.handleRemoteData = function(handler) {
	var motoring = this.motoring;
	var t;
	// left wheel
	if(handler.e(Hamster.LEFT_WHEEL)) {
		t = handler.read(Hamster.LEFT_WHEEL);
		if(t < -100) t = -100;
		else if(t > 100) t = 100;
		motoring.leftWheel = t;
	}
	// right wheel
	if(handler.e(Hamster.RIGHT_WHEEL)) {
		t = handler.read(Hamster.RIGHT_WHEEL);
		if(t < -100) t = -100;
		else if(t > 100) t = 100;
		motoring.rightWheel = t;
	}
	// buzzer
	if(handler.e(Hamster.BUZZER)) {
		t = handler.read(Hamster.BUZZER);
		if(t < 0) t = 0;
		else if(t > 167772.15) t = 167772.15;
		motoring.buzzer = t;
	}
	// output a
	if(handler.e(Hamster.OUTPUT_A)) {
		t = handler.read(Hamster.OUTPUT_A);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.outputA = t;
	}
	// output b
	if(handler.e(Hamster.OUTPUT_B)) {
		t = handler.read(Hamster.OUTPUT_B);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.outputB = t;
	}
	// topology
	if(handler.e(Hamster.TOPOLOGY)) {
		t = handler.read(Hamster.TOPOLOGY);
		if(t < 0) t = 0;
		else if(t > 15) t = 15;
		motoring.topology = t;
	}
	// left led
	if(handler.e(Hamster.LEFT_LED)) {
		t = handler.read(Hamster.LEFT_LED);
		if(t < 0) t = 0;
		else if(t > 7) t = 7;
		motoring.leftLed = t;
	}
	// right led
	if(handler.e(Hamster.RIGHT_LED)) {
		t = handler.read(Hamster.RIGHT_LED);
		if(t < 0) t = 0;
		else if(t > 7) t = 7;
		motoring.rightLed = t;
	}
	// note
	if(handler.e(Hamster.NOTE)) {
		t = handler.read(Hamster.NOTE);
		if(t < 0) t = 0;
		else if(t > 88) t = 88;
		motoring.note = t;
	}
	// line tracer mode
	if(handler.e(Hamster.LINE_TRACER_MODE_ID)) {
		t = handler.read(Hamster.LINE_TRACER_MODE_ID);
		if(t != motoring.lineTracerModeId) {
			motoring.lineTracerModeId = t;

			if(handler.e(Hamster.LINE_TRACER_MODE)) {
				t = handler.read(Hamster.LINE_TRACER_MODE);
				if(t < 0) t = 0;
				else if(t > 15) t = 15;
				motoring.lineTracerMode = t;
				this.lineTracer.written = true;
			}
		}
	}
	// line tracer speed
	if(handler.e(Hamster.LINE_TRACER_SPEED)) {
		t = handler.read(Hamster.LINE_TRACER_SPEED);
		if(t < 1) t = 1;
		else if(t > 8) t = 8;
		motoring.lineTracerSpeed = t;
	}
	// io mode a
	if(handler.e(Hamster.IO_MODE_A)) {
		t = handler.read(Hamster.IO_MODE_A);
		if(t < 0) t = 0;
		else if(t > 15) t = 15;
		motoring.ioModeA = t;
	}
	// io mode b
	if(handler.e(Hamster.IO_MODE_B)) {
		t = handler.read(Hamster.IO_MODE_B);
		if(t < 0) t = 0;
		else if(t > 15) t = 15;
		motoring.ioModeB = t;
	}
	// config proximity
	if(handler.e(Hamster.CONFIG_PROXIMITY)) {
		t = handler.read(Hamster.CONFIG_PROXIMITY);
		if(t < 1) t = 1;
		else if(t > 7) t = 7;
		motoring.configProximity = t;
	}
	// config gravity
	if(handler.e(Hamster.CONFIG_GRAVITY)) {
		t = handler.read(Hamster.CONFIG_GRAVITY);
		if(t < 0) t = 0;
		else if(t > 3) t = 3;
		motoring.configGravity = t;
	}
	// config band width
	if(handler.e(Hamster.CONFIG_BAND_WIDTH)) {
		t = handler.read(Hamster.CONFIG_BAND_WIDTH);
		if(t < 1) t = 1;
		else if(t > 8) t = 8;
		motoring.configBandWidth = t;
	}
};

Module.prototype.requestLocalData = function() {
	var motoring = this.motoring;
	var lineTracer = this.lineTracer;
	if(this.isHamsterS) {
		var str = '10';
		if(motoring.leftWheel < 0) str += this.toHex(motoring.leftWheel * 1.14 - 0.5);
		else str += this.toHex(motoring.leftWheel * 1.14 + 0.5);
		if(motoring.rightWheel < 0) str += this.toHex(motoring.rightWheel * 1.14 - 0.5);
		else str += this.toHex(motoring.rightWheel * 1.14 + 0.5);
		var tmp = this.colorToRgb(motoring.leftLed);
		str += this.toHex(tmp[0]);
		str += this.toHex(tmp[1]);
		str += this.toHex(tmp[2]);
		tmp = this.colorToRgb(motoring.rightLed);
		str += this.toHex(tmp[0]);
		str += this.toHex(tmp[1]);
		str += this.toHex(tmp[2]);
		str += '000000';
		tmp = motoring.lineTracerMode & 0x0f;
		if(tmp > 7) tmp ++;
		if(lineTracer.written) {
			lineTracer.written = false;
			lineTracer.count = 0;
			if(tmp > 0) {
				lineTracer.flag = (lineTracer.flag % 15) + 1;
				lineTracer.event = 1;
			} else {
				lineTracer.event = 0;
			}
		}
		tmp |= (lineTracer.flag & 0x0f) << 4;
		str += this.toHex(tmp);
		tmp = (motoring.lineTracerSpeed & 0x0f) << 4;
		tmp |= this.speedToGain(motoring.lineTracerSpeed) & 0x0f;
		str += this.toHex(tmp);
		tmp = (motoring.configProximity & 0x07) << 5;
		tmp |= (motoring.configBandWidth & 0x07) << 2;
		tmp |= (motoring.configGravity & 0x03);
		str += this.toHex(tmp);
		tmp = (motoring.ioModeA & 0x0f) << 4;
		tmp |= (motoring.ioModeB & 0x0f);
		str += this.toHex(tmp);
		str += this.toHex(motoring.outputA);
		str += this.toHex(motoring.outputB);
		if(motoring.note > 0) {
			str += '01';
			str += this.toHex(motoring.note);
		} else {
			str += this.toHex2(motoring.buzzer * 10 + 512);
		}
		str += '-';
		str += this.address;
		str += '\r';
		return str;
	} else {
		var str = this.toHex(motoring.topology & 0x0f);
		str += '0010';
		str += this.toHex(motoring.leftWheel);
		str += this.toHex(motoring.rightWheel);
		str += this.toHex(motoring.leftLed);
		str += this.toHex(motoring.rightLed);
		str += this.toHex3(motoring.buzzer * 100);
		str += this.toHex(motoring.note);
		if(lineTracer.written) {
			lineTracer.written = false;
			if(motoring.lineTracerMode > 0) {
				lineTracer.flag ^= 0x80;
				lineTracer.event = 1;
			}
		}
		var tmp = (motoring.lineTracerMode & 0x0f) << 3;
		tmp |= ((motoring.lineTracerSpeed - 1) & 0x07);
		tmp |= lineTracer.flag & 0x80;
		str += this.toHex(tmp);
		str += this.toHex(motoring.configProximity);
		tmp = (motoring.configGravity & 0x0f) << 4;
		tmp |= (motoring.configBandWidth & 0x0f);
		str += this.toHex(tmp);
		tmp = (motoring.ioModeA & 0x0f) << 4;
		tmp |= (motoring.ioModeB & 0x0f);
		str += this.toHex(tmp);
		str += this.toHex(motoring.outputA);
		str += this.toHex(motoring.outputB);
		str += '000000-';
		str += this.address;
		str += '\r';
		return str;
	}
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
	sensory.batteryState = 2;
	var lineTracer = this.lineTracer;
	lineTracer.written = false;
	lineTracer.event = 0;
	lineTracer.state = 0;
	lineTracer.count = 0;
	var batt = this.battery;
	batt.state = 2;
	batt.sum = 0.0;
	batt.index = 0;
	batt.count = 0;
};

module.exports = new Module();
