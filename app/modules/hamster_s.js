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
		freeFall: 0,
		freeFallId: 0,
		tap: 0,
		tapId: 0,
		readSerial: new Array(19),
		readSerialId: 0,
		pulseCount: 0,
		wheelState: -1,
		wheelStateId: 0,
		soundState: -1,
		soundStateId: 0,
		lineTracerState: 0,
		lineTracerStateId: 0,
		batteryState: 2,
		serialState: 0,
		serialStateId: 0
	};
	this.motoring = {
		leftWheel: 0,
		rightWheel: 0,
		leftRed: 0,
		leftGreen: 0,
		leftBlue: 0,
		rightRed: 0,
		rightGreen: 0,
		rightBlue: 0,
		buzzer: 0,
		outputA: 0,
		outputB: 0,
		pulse: 0,
		pulseId: 0,
		note: 0,
		sound: 0,
		soundRepeat: 1,
		soundId: 0,
		lineTracerMode: 0,
		lineTracerModeId: 0,
		lineTracerGain: 4,
		lineTracerSpeed: 5,
		ioModeA: 0,
		ioModeB: 0,
		writeSerial: new Array(19),
		writeSerialId: 0,
		motionId: 0,
		motionType: 0,
		motionUnit: 0,
		motionSpeed: 0,
		motionValue: 0,
		motionRadius: 0,
		motorMode: 0,
		configProximity: 2,
		configGravity: 0,
		configBandWidth: 0
	};
	this.motion = {
		written: false,
		type: 0,
		speed: 0
	};
	this.wheel = {
		written: false,
		id: 0,
		pulse: 0,
		pulsePrev: -1,
		event: 0,
		state: 0,
		count: 0,
		move: false,
		moveCount: 0
	};
	this.sound = {
		written: false,
		flag: 0,
		event: 0,
		state: 0,
		count: 0
	};
	this.lineTracer = {
		written: false,
		id: 0,
		event: 0,
		state: 0,
		count: 0
	};
	this.event = {
		freeFallId: -1,
		tapId: -1,
		serialId: -1,
		pulseCount: 0,
		batteryState: 2
	};
	this.command = {
		serialId: 0,
		serialWritten: false
	};
	this.port = {
		ackId: -1,
		serial: false
	};
	this.serial = {
		sendId: 0,
		sendPrevId: 0
	};
	this.packetSent = 0;
	this.packetReceived = 0;
	this.timerId = undefined;
}

var HamsterS = {
	LEFT_WHEEL: 'leftWheel',
	RIGHT_WHEEL: 'rightWheel',
	LEFT_RED: 'leftRed',
	LEFT_GREEN: 'leftGreen',
	LEFT_BLUE: 'leftBlue',
	RIGHT_RED: 'rightRed',
	RIGHT_GREEN: 'rightGreen',
	RIGHT_BLUE: 'rightBlue',
	BUZZER: 'buzzer',
	OUTPUT_A: 'outputA',
	OUTPUT_B: 'outputB',
	PULSE: 'pulse',
	PULSE_ID: 'pulseId',
	NOTE: 'note',
	SOUND: 'sound',
	SOUND_REPEAT: 'soundRepeat',
	SOUND_ID: 'soundId',
	LINE_TRACER_MODE: 'lineTracerMode',
	LINE_TRACER_MODE_ID: 'lineTracerModeId',
	LINE_TRACER_GAIN: 'lineTracerGain',
	LINE_TRACER_SPEED: 'lineTracerSpeed',
	IO_MODE_A: 'ioModeA',
	IO_MODE_B: 'ioModeB',
	WRITE_SERIAL: 'writeSerial',
	WRITE_SERIAL_ID: 'writeSerialId',
	MOTION_ID: 'motionId',
	MOTION_TYPE: 'motionType',
	MOTION_UNIT: 'motionUnit',
	MOTION_SPEED: 'motionSpeed',
	MOTION_VALUE: 'motionValue',
	MOTION_RADIUS: 'motionRadius',
	WHEEL_CENTER_DISTANCE: 1.685234,
	DEG_TO_PULSE: 3.975,
	DEG_TO_PULSE_PIVOT_PEN: 3.895,
	CM_TO_PULSE: 137.3078, // 136.5934 ~ 137.8455
	PEN_CENTER_DISTANCE: 2.452266, // 2.417 ~ 2.4825
	DEFAULT_SPEED: 30
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

Module.prototype.calculateInnerSpeed = function(speed, radius) {
	return speed * (radius - HamsterS.WHEEL_CENTER_DISTANCE) / (radius + HamsterS.WHEEL_CENTER_DISTANCE);
};

Module.prototype.calculateSwingPulse = function(deg, radius, degToPulse) {
	return Math.round(deg * degToPulse * (radius + HamsterS.WHEEL_CENTER_DISTANCE) / HamsterS.WHEEL_CENTER_DISTANCE);
};

Module.prototype.cancelTimeout = function() {
	if(this.timerId !== undefined) clearTimeout(this.timerId);
	this.timerId = undefined;
};

Module.prototype.runSound = function(sound, count) {
	if(typeof count != 'number') count = 1;
	if(count < 0) count = -1;
	if(count) {
		var motoring = this.motoring;
		motoring.sound = sound;
		motoring.soundRepeat = count;
		this.sound.written = true;
	}
};

Module.prototype.requestInitialData = function() {
	return 'FF\r';
};

Module.prototype.checkInitialData = function(data, config) {
	if(data && data.slice(0, 2) == 'FF') {
		var info = data.split(/[,\n]+/);
		if(info && info.length >= 5) {
			if(info[2] == '0E' && info[4].length >= 12) {
				config.id = '020E' + info[3];
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

Module.prototype.handleLocalData = function(data) { // data: string
	if(data.length != 53) return;

	this.packetReceived = 0;
	var str = data.slice(0, 1);
	var value = parseInt(str, 16);
	if(value == 1) { // normal
		var motoring = this.motoring;
		var sensory = this.sensory;
		var event = this.event;
		// pulse count
		str = data.slice(2, 6);
		value = parseInt(str, 16);
		if(value != event.pulseCount) {
			event.pulseCount = value;
			sensory.pulseCount = value;
		}
		// left proximity
		str = data.slice(6, 8);
		value = parseInt(str, 16);
		sensory.leftProximity = value;
		// right proximity
		str = data.slice(8, 10);
		value = parseInt(str, 16);
		sensory.rightProximity = value;
		// flag
		str = data.slice(38, 40);
		var value2 = parseInt(str, 16);
		if((value2 & 0x01) == 0) {
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
		if(motoring.ioModeA == 5) { // IO_MODE_VOLTAGE_INPUT
			value = value * 3.6 / 255;
			value = value.toFixed(2);
		}
		sensory.inputA = value;
		// input b
		str = data.slice(32, 34);
		value = parseInt(str, 16);
		if(motoring.ioModeB == 5) { // IO_MODE_VOLTAGE_INPUT
			value = value * 3.6 / 255;
			value = value.toFixed(2);
		}
		sensory.inputB = value;
		// internal state
		str = data.slice(34, 36);
		value = parseInt(str, 16);
		// free fall
		var id = (value >> 6) & 0x03;
		if(event.freeFallId < 0) {
			event.freeFallId = id;
		} else if(id != event.freeFallId) {
			event.freeFallId = id;
			sensory.freeFall = 1;
			sensory.freeFallId = (sensory.freeFallId % 255) + 1;
		}
		// tap
		var wheel = this.wheel;
		id = (value >> 4) & 0x03;
		if(event.tapId < 0) {
			event.tapId = id;
		} else if(id != event.tapId) {
			event.tapId = id;
			sensory.tap = 1;
			sensory.tapId = (sensory.tapId % 255) + 1;
		}
		// wheel state
		var state = (value >> 2) & 0x03;
		if(wheel.event == 1) {
			if(state == 2) {
				if(wheel.pulse > 0 && wheel.pulse < 15) {
					if(++wheel.count > 5) wheel.event = 2;
				}
			} else if(state == 3) {
				wheel.event = 2;
			}
		}
		if(wheel.event == 2) {
			if(state != wheel.state || wheel.count > 5) {
				wheel.state = state;
				sensory.wheelState = state;
				sensory.wheelStateId = (sensory.wheelStateId % 255) + 1;
				if(state == 2) {
					wheel.event = 0;
					wheel.count = 0;
					this.motion.type = 0;
				}
			}
		}
		if(wheel.event == -1) {
			wheel.state = state;
			sensory.wheelState = 2;
			sensory.wheelStateId = (sensory.wheelStateId % 255) + 1;
			wheel.event = 0;
			wheel.count = 0;
			this.motion.type = 0;
		}
		// sound state
		state = (value >> 1) & 0x01;
		var sound = this.sound;
		if(sound.event == 1) {
			if(state == 0) {
				if(++sound.count > 5) sound.event = 2;
			} else {
				sound.event = 2;
			}
		}
		if(sound.event == 2) {
			if(state != sound.state || sound.count > 5) {
				sound.state = state;
				sensory.soundState = state;
				if(state == 0) {
					sound.event = 0;
					sound.count = 0;
					if(motoring.sound > 0) {
						if(motoring.soundRepeat < 0) {
							this.runSound(motoring.sound, -1);
						} else if(motoring.soundRepeat > 1) {
							motoring.soundRepeat --;
							this.runSound(motoring.sound, motoring.soundRepeat);
						} else {
							motoring.sound = 0;
							motoring.soundRepeat = 1;
							sensory.soundState = state;
							sensory.soundStateId = (sensory.soundStateId % 255) + 1;
						}
					} else {
						motoring.sound = 0;
						motoring.soundRepeat = 1;
						sensory.soundState = state;
						sensory.soundStateId = (sensory.soundStateId % 255) + 1;
					}
				} else if(state != sensory.soundState) {
					sensory.soundState = state;
					sensory.soundStateId = (sensory.soundStateId % 255) + 1;
				}
			}
		}
		// signal strength
		str = data.slice(36, 38);
		value = parseInt(str, 16);
		value -= 0x100;
		sensory.signalStrength = value;
		// linetracer state
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
					sensory.lineTracerState = value << 5;
					sensory.lineTracerStateId = (sensory.lineTracerStateId % 255) + 1;
					if(value == 0x02) {
						lineTracer.event = 0;
						lineTracer.count = 0;
					}
				}
			}
		}
		// battery state
		state = (value2 >> 1) & 0x03;
		if(state == 0) state = 2; // normal
		else if(state >= 2) state = 0; // empty
		if(state != event.batteryState) {
			event.batteryState = state;
			sensory.batteryState = state;
		}
		var port = this.port;
		id = (value2 >> 5) & 0x01;
		if(id != port.ackId) {
			if(port.ackId != -1) {
				if(motoring.ioModeA > 10) {
					port.serial = true;
				} else {
					port.serial = false;
				}
			}
			port.ackId = id;
		}
		this.packetReceived = 1;
	} else if(value == 2) { // serial
		str = data.slice(1, 2);
		var id = parseInt(str, 16);
		var event = this.event;
		if(id != event.serialId) {
			if(event.serialId != -1) {
				str = data.slice(2, 4);
				var len = parseInt(str, 16);
				if(len > 18) len = 18;
				var readSerial = sensory.readSerial;
				readSerial[0] = len;
				for(var i = 1, j = 4; i <= len; ++i, j += 2) {
					str = data.slice(j, j + 2);
					readSerial[i] = parseInt(str, 16);
				}
				for(var i = len + 1; i <= 18; ++i) {
					readSerial[i] = 0;
				}
				sensory.readSerialId = (sensory.readSerialId % 255) + 1;
			}
			event.serialId = id;
		}
		this.packetReceived = 3;
	}
	var serial = this.serial;
	if(serial.sendId != serial.sendPrevId) {
		serial.sendPrevId = serial.sendId;
		sensory.serialState = 1;
		sensory.serialStateId = (sensory.serialStateId % 255) + 1;
	}
};

Module.prototype.requestRemoteData = function(handler) {
	var sensory = this.sensory;
	for(var key in sensory) {
		handler.write(key, sensory[key]);
	}
	sensory.freeFall = 0;
	sensory.tap = 0;
	sensory.wheelState = -1;
	sensory.soundState = -1;
	sensory.lineTracerState = 0;
	sensory.serialState = 0;
};

Module.prototype.handleRemoteData = function(handler) {
	var motoring = this.motoring;
	var t;
	// left wheel
	if(handler.e(HamsterS.LEFT_WHEEL)) {
		t = handler.read(HamsterS.LEFT_WHEEL);
		if(t < -100) t = -100;
		else if(t > 100) t = 100;
		motoring.leftWheel = t;
	}
	// right wheel
	if(handler.e(HamsterS.RIGHT_WHEEL)) {
		t = handler.read(HamsterS.RIGHT_WHEEL);
		if(t < -100) t = -100;
		else if(t > 100) t = 100;
		motoring.rightWheel = t;
	}
	// left led
	if(handler.e(HamsterS.LEFT_RED)) {
		t = handler.read(HamsterS.LEFT_RED);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.leftRed = t;
	}
	if(handler.e(HamsterS.LEFT_GREEN)) {
		t = handler.read(HamsterS.LEFT_GREEN);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.leftGreen = t;
	}
	if(handler.e(HamsterS.LEFT_BLUE)) {
		t = handler.read(HamsterS.LEFT_BLUE);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.leftBlue = t;
	}
	// right led
	if(handler.e(HamsterS.RIGHT_RED)) {
		t = handler.read(HamsterS.RIGHT_RED);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.rightRed = t;
	}
	if(handler.e(HamsterS.RIGHT_GREEN)) {
		t = handler.read(HamsterS.RIGHT_GREEN);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.rightGreen = t;
	}
	if(handler.e(HamsterS.RIGHT_BLUE)) {
		t = handler.read(HamsterS.RIGHT_BLUE);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.rightBlue = t;
	}
	// buzzer
	if(handler.e(HamsterS.BUZZER)) {
		t = handler.read(HamsterS.BUZZER);
		if(t < 0) t = 0;
		else if(t > 6500.0) t = 6500.0;
		motoring.buzzer = t;
	}
	// output a
	if(handler.e(HamsterS.OUTPUT_A)) {
		t = handler.read(HamsterS.OUTPUT_A);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.outputA = t;
	}
	// output b
	if(handler.e(HamsterS.OUTPUT_B)) {
		t = handler.read(HamsterS.OUTPUT_B);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.outputB = t;
	}
	// pulse
	if(handler.e(HamsterS.PULSE_ID)) {
		t = handler.read(HamsterS.PULSE_ID);
		if(t != motoring.pulseId) {
			motoring.pulseId = t;
			if(handler.e(HamsterS.PULSE)) {
				t = handler.read(HamsterS.PULSE);
				if(t < 0) t = 0;
				else if(t > 65535) t = 65535;
				motoring.pulse = t;
				this.wheel.written = true;
			}
		}
	}
	// note
	if(handler.e(HamsterS.NOTE)) {
		t = handler.read(HamsterS.NOTE);
		if(t < 0) t = 0;
		else if(t > 88) t = 88;
		motoring.note = t;
	}
	// sound
	if(handler.e(HamsterS.SOUND_ID)) {
		t = handler.read(HamsterS.SOUND_ID);
		if(t != motoring.soundId) {
			motoring.soundId = t;
			if(handler.e(HamsterS.SOUND) && handler.e(HamsterS.SOUND_REPEAT)) {
				t = handler.read(HamsterS.SOUND);
				if(t < 0) t = 0;
				else if(t > 127) t = 127;
				var t2 = handler.read(HamsterS.SOUND_REPEAT);
				this.runSound(t, t2);
			}
		}
	}
	// line tracer mode
	if(handler.e(HamsterS.LINE_TRACER_MODE_ID)) {
		t = handler.read(HamsterS.LINE_TRACER_MODE_ID);
		if(t != motoring.lineTracerModeId) {
			motoring.lineTracerModeId = t;
			if(handler.e(HamsterS.LINE_TRACER_MODE)) {
				t = handler.read(HamsterS.LINE_TRACER_MODE);
				if(t < 0) t = 0;
				else if(t > 15) t = 15;
				motoring.lineTracerMode = t;
				this.lineTracer.written = true;
			}
		}
	}
	// line tracer gain
	if(handler.e(HamsterS.LINE_TRACER_GAIN)) {
		t = handler.read(HamsterS.LINE_TRACER_GAIN);
		if(t < 1) t = 1;
		else if(t > 10) t = 10;
		motoring.lineTracerGain = t;
	}
	// line tracer speed
	if(handler.e(HamsterS.LINE_TRACER_SPEED)) {
		t = handler.read(HamsterS.LINE_TRACER_SPEED);
		if(t < 1) t = 1;
		else if(t > 10) t = 10;
		motoring.lineTracerSpeed = t;
	}
	// io mode a
	if(handler.e(HamsterS.IO_MODE_A)) {
		t = handler.read(HamsterS.IO_MODE_A);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.ioModeA = t;
	}
	// io mode b
	if(handler.e(HamsterS.IO_MODE_B)) {
		t = handler.read(HamsterS.IO_MODE_B);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.ioModeB = t;
	}
	// write serial
	if(handler.e(HamsterS.WRITE_SERIAL_ID)) {
		t = handler.read(HamsterS.WRITE_SERIAL_ID);
		if(t != motoring.writeSerialId) {
			motoring.writeSerialId = t;
			if(handler.e(HamsterS.WRITE_SERIAL)) {
				t = handler.read(HamsterS.WRITE_SERIAL);
				motoring.writeSerial = t;
				this.command.serialWritten = true;
			}
		}
	}
	// motion
	if(handler.e(HamsterS.MOTION_ID)) {
		t = handler.read(HamsterS.MOTION_ID);
		if(t != motoring.motionId) {
			motoring.motionId = t;
			if(handler.e(HamsterS.MOTION_UNIT)) {
				t = handler.read(HamsterS.MOTION_UNIT);
				if(t < 0) t = 0;
				else if(t > 3) t = 3;
				motoring.motionUnit = t;
			}
			if(handler.e(HamsterS.MOTION_SPEED)) {
				t = handler.read(HamsterS.MOTION_SPEED);
				if(t < 0) t = 0;
				else if(t > 100) t = 100;
				motoring.motionSpeed = t;
			}
			if(handler.e(HamsterS.MOTION_VALUE)) {
				t = handler.read(HamsterS.MOTION_VALUE);
				if(t < 0) t = 0;
				else if(t > 2147483647) t = 2147483647;
				motoring.motionValue = t;
			}
			if(handler.e(HamsterS.MOTION_RADIUS)) {
				t = handler.read(HamsterS.MOTION_RADIUS);
				if(t < 0) t = 0;
				else if(t > 2147483647) t = 2147483647;
				motoring.motionRadius = t;
			}
			if(handler.e(HamsterS.MOTION_TYPE)) {
				t = handler.read(HamsterS.MOTION_TYPE);
				if(t < 0) t = 0;
				else if(t > 24) t = 24;
				motoring.motionType = t;
				this.motion.written = true;
			}
		}
	}
};

Module.prototype.requestLocalData = function() {
	var self = this;
	var motoring = self.motoring;
	var lineTracer = self.lineTracer;
	var port = self.port;
	
	// serial
	if(port.serial && self.command.serialWritten && self.packetSent != 3) {
		self.command.serialWritten = false;
		self.packetSent = 3;
		self.serial.sendId = (self.serial.sendId % 255) + 1;
		
		var writeSerial = motoring.writeSerial;
		if(writeSerial) {
			var len = writeSerial[0];
			if(len > 0) {
				if(len > 18) len = 18;
				var command = self.command;
				command.serialId = (command.serialId % 15) + 1;
				var tmp = 0x20 | (command.serialId & 0x0f);
				var str = self.toHex(tmp);
				str += self.toHex(len);
				for(var i = 1; i <= len; ++i) {
					str += self.toHex(writeSerial[i]);
				}
				for(var i = len + 1; i <= 18; ++i) {
					str += '00';
				}
				str += '-';
				str += address;
				str += '\r';
				return str;
			}
		}
	}
	
	var motion = self.motion;
	var wheel = self.wheel;
	var leftWheel = motoring.leftWheel, rightWheel = motoring.rightWheel;
	if(motion.written) {
		self.cancelTimeout();
		motion.type = parseInt(motoring.motionType);
		if(motion.type < 0 || motion.type > 24) {
			motion.type = 0;
		}
		if(motion.type != 0) {
			motion.speed = motoring.motionSpeed;
			wheel.pulse = 0;
			var unit = parseInt(motoring.motionUnit);
			var value = motoring.motionValue;
			if(unit == 2) { // UNIT_SEC
				if(value == 0) {
					leftWheel = 0;
					rightWheel = 0;
					wheel.count = 0;
					wheel.event = -1;
					motion.type = 0;
				} else {
					self.timerId = setTimeout(function() {
						self.cancelTimeout();
						leftWheel = 0;
						rightWheel = 0;
						wheel.count = 0;
						wheel.event = -1;
						motion.type = 0;
					}, value * 1000);
				}
			} else {
				if(unit == 3) { // UNIT_PULSE
					wheel.pulse = Math.round(value);
				} else if(unit == 1) { // UNIT_CM_DEG
					var alignment = self.alignment;
					switch(motion.type) {
						case 1: // MOTION_MOVE_FORWARD
						case 2: // MOTION_MOVE_BACKWARD
							wheel.pulse = Math.round(value * HamsterS.CM_TO_PULSE);
							break;
						case 3: // MOTION_TURN_LEFT
						case 4: // MOTION_TURN_RIGHT
							wheel.pulse = Math.round(value * HamsterS.DEG_TO_PULSE);
							break;
						case 5: // MOTION_PIVOT_LEFT_FORWARD
						case 6: // MOTION_PIVOT_LEFT_BACKWARD
						case 7: // MOTION_PIVOT_RIGHT_FORWARD
						case 8: // MOTION_PIVOT_RIGHT_BACKWARD
							wheel.pulse = Math.round(value * HamsterS.DEG_TO_PULSE * 2);
							break;
						case 9: // MOTION_SWING_LEFT_FORWARD
						case 10: // MOTION_SWING_LEFT_BACKWARD
						case 11: // MOTION_SWING_RIGHT_FORWARD
						case 12: // MOTION_SWING_RIGHT_BACKWARD
							wheel.pulse = self.calculateSwingPulse(value, motoring.motionRadius, HamsterS.DEG_TO_PULSE);
							break;
						case 13: // MOTION_PIVOT_LEFT_PEN_FORWARD
						case 14: // MOTION_PIVOT_LEFT_PEN_BACKWARD
						case 15: // MOTION_PIVOT_RIGHT_PEN_FORWARD
						case 16: // MOTION_PIVOT_RIGHT_PEN_BACKWARD
							wheel.pulse = self.calculateSwingPulse(value, HamsterS.PEN_CENTER_DISTANCE, HamsterS.DEG_TO_PULSE_PIVOT_PEN);
							break;
						case 17: // MOTION_SWING_LEFT_PEN_LEFT_FORWARD
						case 18: // MOTION_SWING_LEFT_PEN_LEFT_BACKWARD
						case 19: // MOTION_SWING_RIGHT_PEN_RIGHT_FORWARD
						case 20: // MOTION_SWING_RIGHT_PEN_RIGHT_BACKWARD
							wheel.pulse = self.calculateSwingPulse(value, motoring.motionRadius + HamsterS.PEN_CENTER_DISTANCE, HamsterS.DEG_TO_PULSE);
							break;
						case 21: // MOTION_SWING_LEFT_PEN_RIGHT_FORWARD
						case 22: // MOTION_SWING_LEFT_PEN_RIGHT_BACKWARD
						case 23: // MOTION_SWING_RIGHT_PEN_LEFT_FORWARD
						case 24: // MOTION_SWING_RIGHT_PEN_LEFT_BACKWARD
							if(motoring.motionRadius >= HamsterS.PEN_CENTER_DISTANCE) {
								wheel.pulse = self.calculateSwingPulse(value, motoring.motionRadius - HamsterS.PEN_CENTER_DISTANCE, HamsterS.DEG_TO_PULSE);
							} else {
								wheel.pulse = self.calculateSwingPulse(value, HamsterS.PEN_CENTER_DISTANCE - motoring.motionRadius, HamsterS.DEG_TO_PULSE);
							}
							break;
						default:
							motion.type = 0;
							break;
					}
				}
				if(wheel.pulse == 0) {
					leftWheel = 0;
					rightWheel = 0;
					wheel.count = 0;
					wheel.event = -1;
					motion.type = 0;
				}
			}
		}
	}
	if(motion.type == 0) wheel.pulse = motoring.pulse;
	
	var speed = motion.speed;
	if(speed == 0) speed = HamsterS.DEFAULT_SPEED;
	switch(motion.type) {
		case 1: // MOTION_MOVE_FORWARD
			leftWheel = speed;
			rightWheel = speed;
			break;
		case 2: // MOTION_MOVE_BACKWARD
			leftWheel = -speed;
			rightWheel = -speed;
			break;
		case 3: // MOTION_TURN_LEFT
			leftWheel = -speed;
			rightWheel = speed;
			break;
		case 4: // MOTION_TURN_RIGHT
			leftWheel = speed;
			rightWheel = -speed;
			break;
		case 5: // MOTION_PIVOT_LEFT_FORWARD
			leftWheel = 0;
			rightWheel = speed;
			break;
		case 6: // MOTION_PIVOT_LEFT_BACKWARD
			leftWheel = 0;
			rightWheel = -speed;
			break;
		case 7: // MOTION_PIVOT_RIGHT_FORWARD
			leftWheel = speed;
			rightWheel = 0;
			break;
		case 8: // MOTION_PIVOT_RIGHT_BACKWARD
			leftWheel = -speed;
			rightWheel = 0;
			break;
		case 9: // MOTION_SWING_LEFT_FORWARD
			leftWheel = self.calculateInnerSpeed(speed, motoring.motionRadius);
			rightWheel = speed;
			break;
		case 10: // MOTION_SWING_LEFT_BACKWARD
			leftWheel = -self.calculateInnerSpeed(speed, motoring.motionRadius);
			rightWheel = -speed;
			break;
		case 11: // MOTION_SWING_RIGHT_FORWARD
			leftWheel = speed;
			rightWheel = self.calculateInnerSpeed(speed, motoring.motionRadius);
			break;
		case 12: // MOTION_SWING_RIGHT_BACKWARD
			leftWheel = -speed;
			rightWheel = -self.calculateInnerSpeed(speed, motoring.motionRadius);
			break;
		case 13: // MOTION_PIVOT_LEFT_PEN_FORWARD
			leftWheel = self.calculateInnerSpeed(speed, HamsterS.PEN_CENTER_DISTANCE);
			rightWheel = speed;
			break;
		case 14: // MOTION_PIVOT_LEFT_PEN_BACKWARD
			leftWheel = -self.calculateInnerSpeed(speed, HamsterS.PEN_CENTER_DISTANCE);
			rightWheel = -speed;
			break;
		case 15: // MOTION_PIVOT_RIGHT_PEN_FORWARD
			leftWheel = speed;
			rightWheel = self.calculateInnerSpeed(speed, HamsterS.PEN_CENTER_DISTANCE);
			break;
		case 16: // MOTION_PIVOT_RIGHT_PEN_BACKWARD
			leftWheel = -speed;
			rightWheel = -self.calculateInnerSpeed(speed, HamsterS.PEN_CENTER_DISTANCE);
			break;
		case 17: // MOTION_SWING_LEFT_PEN_LEFT_FORWARD
			leftWheel = self.calculateInnerSpeed(speed, motoring.motionRadius + HamsterS.PEN_CENTER_DISTANCE);
			rightWheel = speed;
			break;
		case 18: // MOTION_SWING_LEFT_PEN_LEFT_BACKWARD
			leftWheel = -self.calculateInnerSpeed(speed, motoring.motionRadius + HamsterS.PEN_CENTER_DISTANCE);
			rightWheel = -speed;
			break;
		case 19: // MOTION_SWING_LEFT_PEN_RIGHT_FORWARD
			if(motoring.motionRadius >= HamsterS.PEN_CENTER_DISTANCE) {
				leftWheel = speed;
				rightWheel = self.calculateInnerSpeed(speed, motoring.motionRadius - HamsterS.PEN_CENTER_DISTANCE);
			} else {
				leftWheel = -self.calculateInnerSpeed(speed, HamsterS.PEN_CENTER_DISTANCE - motoring.motionRadius);
				rightWheel = -speed;
			}
			break;
		case 20: // MOTION_SWING_LEFT_PEN_RIGHT_BACKWARD
			if(motoring.motionRadius >= HamsterS.PEN_CENTER_DISTANCE) {
				leftWheel = -speed;
				rightWheel = -self.calculateInnerSpeed(speed, motoring.motionRadius - HamsterS.PEN_CENTER_DISTANCE);
			} else {
				leftWheel = self.calculateInnerSpeed(speed, HamsterS.PEN_CENTER_DISTANCE - motoring.motionRadius);
				rightWheel = speed;
			}
			break;
		case 21: // MOTION_SWING_RIGHT_PEN_LEFT_FORWARD
			if(motoring.motionRadius >= HamsterS.PEN_CENTER_DISTANCE) {
				leftWheel = self.calculateInnerSpeed(speed, motoring.motionRadius - HamsterS.PEN_CENTER_DISTANCE);
				rightWheel = speed;
			} else {
				leftWheel = -speed;
				rightWheel = -self.calculateInnerSpeed(speed, HamsterS.PEN_CENTER_DISTANCE - motoring.motionRadius);
			}
			break;
		case 22: // MOTION_SWING_RIGHT_PEN_LEFT_BACKWARD
			if(motoring.motionRadius >= HamsterS.PEN_CENTER_DISTANCE) {
				leftWheel = -self.calculateInnerSpeed(speed, motoring.motionRadius - HamsterS.PEN_CENTER_DISTANCE);
				rightWheel = -speed;
			} else {
				leftWheel = speed;
				rightWheel = self.calculateInnerSpeed(speed, HamsterS.PEN_CENTER_DISTANCE - motoring.motionRadius);
			}
			break;
		case 23: // MOTION_SWING_RIGHT_PEN_RIGHT_FORWARD
			leftWheel = speed;
			rightWheel = self.calculateInnerSpeed(speed, motoring.motionRadius + HamsterS.PEN_CENTER_DISTANCE);
			break;
		case 24: // MOTION_SWING_RIGHT_PEN_RIGHT_BACKWARD
			leftWheel = -speed;
			rightWheel = -self.calculateInnerSpeed(speed, motoring.motionRadius + HamsterS.PEN_CENTER_DISTANCE);
			break;
	}
	
	var str = '10';
	if(leftWheel == 0 && rightWheel == 0) {
		if(wheel.move && ++wheel.moveCount > 5) {
			wheel.move = false;
		}
	} else {
		wheel.move = true;
		wheel.moveCount = 0;
	}
	if(leftWheel < 0) str += self.toHex(leftWheel * 1.14 - 0.5);
	else str += self.toHex(leftWheel * 1.14 + 0.5);
	if(rightWheel < 0) str += self.toHex(rightWheel * 1.14 - 0.5);
	else str += self.toHex(rightWheel * 1.14 + 0.5);
	str += self.toHex(motoring.leftRed);
	str += self.toHex(motoring.leftGreen);
	str += self.toHex(motoring.leftBlue);
	str += self.toHex(motoring.rightRed);
	str += self.toHex(motoring.rightGreen);
	str += self.toHex(motoring.rightBlue);
	if(motion.written || wheel.written) {
		motion.written = false;
		wheel.written = false;
		if(wheel.pulse != 0 || wheel.pulsePrev != 0) {
			wheel.id = (wheel.id % 255) + 1;
		}
		wheel.count = 0;
		if(wheel.pulse > 0) {
			wheel.event = 1;
		} else if(wheel.event != -1) {
			wheel.event = 0;
		}
		wheel.pulsePrev = wheel.pulse;
	}
	str += self.toHex(wheel.id);
	str += self.toHex2(wheel.pulse);
	var tmp = motoring.lineTracerMode & 0x0f;
	if(tmp > 7) tmp ++;
	if(lineTracer.written) {
		lineTracer.written = false;
		lineTracer.count = 0;
		if(tmp > 0) {
			lineTracer.id = (lineTracer.id % 15) + 1;
			lineTracer.event = 1;
		} else {
			lineTracer.event = 0;
		}
	}
	tmp |= (lineTracer.id & 0x0f) << 4;
	str += self.toHex(tmp);
	tmp = (motoring.lineTracerSpeed & 0x0f) << 4;
	tmp |= motoring.lineTracerGain & 0x0f;
	str += self.toHex(tmp);
	tmp = (motoring.configProximity & 0x07) << 5;
	tmp |= (motoring.configBandWidth & 0x07) << 2;
	tmp |= (motoring.configGravity & 0x03);
	str += self.toHex(tmp);
	if(motoring.ioModeA >= 176) { // IO_MODE_SERIAL_9600
		tmp = motoring.ioModeA;
	} else {
		var v = motoring.ioModeA;
		if(v == 5) v = 4; // IO_MODE_VOLTAGE_INPUT --> IO_MODE_ANALOG_INPUT_ABSOLUTE
		tmp = (v & 0x0f) << 4;
		v = motoring.ioModeB;
		if(v == 5) v = 4; // IO_MODE_VOLTAGE_INPUT --> IO_MODE_ANALOG_INPUT_ABSOLUTE
		tmp |= (v & 0x0f);
	}
	str += self.toHex(tmp);
	str += self.toHex(motoring.outputA);
	str += self.toHex(motoring.outputB);
	
	// sound
	var sound = self.sound;
	var sndid = 0;
	switch(motoring.sound) {
		case 0: sndid = 0x00; break;
		case 1: sndid = 0x01; break;
		case 2: sndid = 0x05; break;
		case 10: sndid = 0x07; break;
		case 3: sndid = 0x09; break;
		case 4: sndid = 0x0b; break;
		case 11: sndid = 0x12; break;
		case 5: sndid = 0x20; break;
		case 8: sndid = 0x21; break;
		case 9: sndid = 0x23; break;
		case 12: sndid = 0x30; break;
		case 13: sndid = 0x31; break;
		case 14: sndid = 0x32; break;
		case 15: sndid = 0x33; break;
		case 6: sndid = 0x34; break;
		case 7: sndid = 0x35; break;
	}
	if(sound.written) {
		sound.written = false;
		sound.count = 0;
		if(sndid > 0) {
			sound.flag ^= 0x80;
			sound.event = 1;
		} else {
			sound.event = 0;
		}
	}
	if(sndid > 0) { // sound
		str += '00';
		str += self.toHex(sndid | sound.flag);
	} else if(motoring.note > 0) { // note
		str += '01';
		str += self.toHex(motoring.note);
	} else { // buzzer
		tmp = parseInt(motoring.buzzer * 10) + 512;
		str += self.toHex2(tmp);
	}
	str += '-';
	str += self.address;
	str += '\r';
	self.packetSent = 1;
	return str;
};

Module.prototype.reset = function() {
	this.cancelTimeout();
	var motoring = this.motoring;
	motoring.leftWheel = 0;
	motoring.rightWheel = 0;
	motoring.leftRed = 0;
	motoring.leftGreen = 0;
	motoring.leftBlue = 0;
	motoring.rightRed = 0;
	motoring.rightGreen = 0;
	motoring.rightBlue = 0;
	motoring.buzzer = 0;
	motoring.outputA = 0;
	motoring.outputB = 0;
	motoring.pulse = 0;
	motoring.pulseId = 0;
	motoring.note = 0;
	motoring.sound = 0;
	motoring.soundRepeat = 1;
	motoring.soundId = 0;
	motoring.lineTracerMode = 0;
	motoring.lineTracerModeId = 0;
	motoring.lineTracerGain = 4;
	motoring.lineTracerSpeed = 5;
	motoring.ioModeA = 0;
	motoring.ioModeB = 0;
	motoring.writeSerialId = 0;
	motoring.motionId = 0;
	motoring.motionType = 0;
	motoring.motionUnit = 0;
	motoring.motionSpeed = 0;
	motoring.motionValue = 0;
	motoring.motionRadius = 0;
	motoring.motorMode = 0;
	motoring.configProximity = 2;
	motoring.configGravity = 0;
	motoring.configBandWidth = 0;
	
	var sensory = this.sensory;
	sensory.freeFall = 0;
	sensory.freeFallId = 0;
	sensory.tap = 0;
	sensory.tapId = 0;
	sensory.readSerialId = 0;
	sensory.pulseCount = 0;
	sensory.wheelState = -1;
	sensory.wheelStateId = 0;
	sensory.soundState = -1;
	sensory.soundStateId = 0;
	sensory.lineTracerState = 0;
	sensory.lineTracerStateId = 0;
	sensory.batteryState = 2;
	sensory.serialState = 0;
	sensory.serialStateId = 0;
	
	var motion = this.motion;
	motion.written = false;
	motion.type = 0;
	motion.speed = 0;
	
	var wheel = this.wheel;
	wheel.written = false;
	wheel.pulse = 0;
	wheel.pulsePrev = -1;
	wheel.event = 0;
	wheel.state = 0;
	wheel.count = 0;
	wheel.move = false;
	wheel.moveCount = 0;
	
	var sound = this.sound;
	sound.written = false;
	sound.event = 0;
	sound.state = 0;
	sound.count = 0;
	
	var lineTracer = this.lineTracer;
	lineTracer.written = false;
	lineTracer.event = 0;
	lineTracer.state = 0;
	lineTracer.count = 0;
	
	var event = this.event;
	event.freeFallId = -1;
	event.tapId = -1;
	event.serialId = -1;
	event.pulseCount = 0;
	event.batteryState = 2;
	
	this.command.serialWritten = false;

	var port = this.port;
	port.ackId = -1;
	port.serial = false;
	
	var serial = this.serial;
	serial.sendId = 0;
	serial.sendPrevId = 0;
	
	this.packetSent = 0;
	this.packetReceived = 0;
};

module.exports = new Module();
