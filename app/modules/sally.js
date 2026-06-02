'use strict';
var Sally = {
	LEFT_WHEEL: 'leftWheel',
	RIGHT_WHEEL: 'rightWheel',
	LED_RED: 'ledRed',
	LED_GREEN: 'ledGreen',
	LED_BLUE: 'ledBlue',
	BUZZER: 'buzzer',
	PULSE: 'pulse',
	PULSE_ID: 'pulseId',
	NOTE: 'note',
	SOUND: 'sound',
	SOUND_REPEAT: 'soundRepeat',
	SOUND_ID: 'soundId',
	LINE_TRACER_MODE: 'lineTracerMode',
	LINE_TRACER_MODE_ID: 'lineTracerModeId',
	LINE_TRACER_SPEED: 'lineTracerSpeed',
	MOTION_ID: 'motionId',
	MOTION_TYPE: 'motionType',
	MOTION_UNIT: 'motionUnit',
	MOTION_SPEED: 'motionSpeed',
	MOTION_VALUE: 'motionValue',
	MOTION_RADIUS: 'motionRadius',
	CM_TO_PULSE: 917 / 9.8426,
	MOVE_FORWARD_CM: 10.0,
	MOVE_FORWARD_CM_10000: 100000,
	DEG_TO_PULSE_SPIN_RIGHT: 1127.0,
	DEG_TO_PULSE_SPIN_LEFT: 1127.0,
	DEG_TO_PULSE_PIVOT_RIGHT: 2272.0,
	DEG_TO_PULSE_PIVOT_LEFT: 2272.0,
	WHEEL_CENTER_DISTANCE: 1.945,
	WHEEL_CENTER_DISTANCE_10000: 19450,
	DEFAULT_SPEED: 40
};

function Module() {
	this.sensory = {
		signalStrength: 0,
		colorRed: 0,
		colorGreen: 0,
		colorBlue: 0,
		colorClear: 0,
		floor: 0,
		accelerationX: 0,
		accelerationY: 0,
		accelerationZ: 0,
		temperature: 0,
		button: 0,
		clicked: 0,
		clickedId: 0,
		doubleClicked: 0,
		doubleClickedId: 0,
		longPressed: 0,
		longPressedId: 0,
		colorNumber: -1,
		colorPattern: -1,
		colorPatternId: 0,
		pulseCount: 0,
		wheelState: -1,
		wheelStateId: 0,
		soundState: -1,
		soundStateId: 0,
		lineTracerState: 0,
		lineTracerStateId: 0,
		tilt: 0,
		batteryState: 2,
		freeFall: 0,
		freeFallId: 0,
		tap: 0,
		tapId: 0
	};
	this.motoring = {
		leftWheel: 0,
		rightWheel: 0,
		ledRed: 0,
		ledGreen: 0,
		ledBlue: 0,
		buzzer: 0,
		pulse: 0,
		pulseId: 0,
		note: 0,
		sound: 0,
		soundRepeat: 1,
		soundId: 0,
		lineTracerMode: 0,
		lineTracerModeId: 0,
		lineTracerSpeed: 4,
		motionId: 0,
		motionType: 0,
		motionUnit: 0,
		motionSpeed: 0,
		motionValue: 0,
		motionRadius: 0
	};
	this.motion = {
		written: false,
		type: 0,
		speed: 0
	};
	this.acceleration = {
		x: new Array(10),
		y: new Array(10),
		z: new Array(10),
		sumx: 0.0,
		sumy: 0.0,
		sumz: 0.0,
		index: 0,
		count: 0
	};
	this.button = {
		clickId: -1,
		longPressId: -1
	};
	this.wheel = {
		written: false,
		id: 0,
		pulse: 0,
		pulsePrev: -1,
		event: 0,
		stateId: -1,
		move: false,
		moveCount: 0
	};
	this.sound = {
		written: false,
		flag: 0,
		event: 0,
		stateId: -1
	};
	this.lineTracer = {
		written: false,
		flag: 0,
		event: 0,
		stateId: -1
	};
	this.event = {
		colorNumberId: -1,
		colorPatternId: -1,
		freeFallId: -1,
		tapId: -1
	};
	this.alignment = {
		state: 0,
		count: 0,
		distance: Sally.WHEEL_CENTER_DISTANCE,
		spinRight: 0,
		pivotRight: 0,
		spinLeft: 0,
		pivotLeft: 0,
		offset: 0,
		cmToPulse: Sally.CM_TO_PULSE,
		cmOffset: 0
	};
	this.timerId = undefined;
}

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

Module.prototype.calculateInnerSpeed = function(speed, radius) {
	return speed * (radius - this.alignment.distance) / (radius + this.alignment.distance);
};

Module.prototype.calculateCirclePulse = function(degToPulse, deg, radius, offset) {
	return Math.round(deg * (degToPulse + offset) * (radius + this.alignment.distance) / 360.0 / this.alignment.distance);
};

Module.prototype.cancelTimeout = function() {
	if(this.timerId !== undefined) clearTimeout(this.timerId);
	this.timerId = undefined;
};

Module.prototype.parseAlignment = function(data) {
	var alignment = this.alignment;
	var str = data.slice(2, 4);
	var value = parseInt(str, 16);
	if(value > 0x7f) value -= 0x100;
	alignment.spinRight = value + 1;
	str = data.slice(4, 6);
	value = parseInt(str, 16);
	if(value > 0x7f) value -= 0x100;
	alignment.pivotRight = value + 1;
	str = data.slice(6, 8);
	value = parseInt(str, 16);
	if(value > 0x7f) value -= 0x100;
	alignment.spinLeft = value + 1;
	str = data.slice(8, 10);
	value = parseInt(str, 16);
	if(value > 0x7f) value -= 0x100;
	alignment.pivotLeft = value + 1;
	str = data.slice(12, 18);
	value = parseInt(str, 16);
	if(value > 0x7fffff) value -= 0x1000000;
	alignment.cmOffset = value + 1;
	var moveForwardCm = Sally.MOVE_FORWARD_CM + alignment.cmOffset / 10000.0;
	if(moveForwardCm <= 0) moveForwardCm = Sally.MOVE_FORWARD_CM;
	alignment.cmToPulse = Sally.CM_TO_PULSE * Sally.MOVE_FORWARD_CM / moveForwardCm;
	str = data.slice(18, 24);
	value = parseInt(str, 16);
	if(value > 0x7fffff) value -= 0x1000000;
	alignment.offset = value + 1;
	alignment.distance = Sally.WHEEL_CENTER_DISTANCE + alignment.offset / 10000.0;
	if(alignment.distance <= 0) alignment.distance = Sally.WHEEL_CENTER_DISTANCE;
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
	var alignment = this.alignment;
	if(alignment.state == 0) {
		return 'FF\r';
	} else if(alignment.state == 1) {
		if(alignment.count % 10 == 0) {
			return 'B000000000000000030000000000000000000000-' + this.address + '\r';
		}
		alignment.count ++;
	} else if(alignment.state == 2) {
		alignment.state = 3;
		return '7000000000000000030000000000000000000000-' + this.address + '\r';
	}
};

Module.prototype.checkInitialData = function(data, config) {
	var alignment = this.alignment;
	if(alignment.state == 0) {
		if(data && data.slice(0, 2) == 'FF') {
			var info = data.split(/[,\n]+/);
			if(info && info.length >= 5) {
				if((info[2] == '10' || info[2] == '11') && info[4].length >= 12) {
					config.id = '0211' + info[3];
					this.address = info[4].substring(0, 12);
					alignment.state = 1;
				} else {
					return false;
				}
			}
		}
	} else if(alignment.state == 1) {
		if(data && data.slice(0, 2) == 'B0') {
			this.parseAlignment(data);
			alignment.state = 2;
		}
	} else if(alignment.state == 3) {
		var data1 = data.slice(0, 1);
		var data2 = data.slice(1, 2);
		if(data1 == 'B' && data2 == '0') {
			this.parseAlignment(data);
			alignment.state = 2;
		} else if(data1 == '1') {
			alignment.state = 0;
			alignment.count = 0;
			return true;
		}
	}
};

Module.prototype.validateLocalData = function(data) {
	return (data.length == 53);
};

Module.prototype.handleLocalData = function(data) { // data: string
	if(data.length != 53) return;
	
	var str = data.slice(0, 1);
	var value = parseInt(str, 16);
	if(value != 1) return; // invalid data
	
	var sensory = this.sensory;

	// r, g, b
	str = data.slice(2, 4);
	var r = parseInt(str, 16);
	str = data.slice(4, 6);
	var g = parseInt(str, 16);
	str = data.slice(6, 8);
	var b = parseInt(str, 16);
	str = data.slice(8, 10);
	value = parseInt(str, 16);
	
	sensory.colorRed = r;
	sensory.colorGreen = g;
	sensory.colorBlue = b;
	sensory.colorClear = value;
	
	var event = this.event;
	// color number
	str = data.slice(10, 12);
	value = parseInt(str, 16);
	var id = (value >> 4) & 0x0f;
	if(id != event.colorNumberId) {
		value = value & 0x0f;
		if(value == 15) value = -2;
		else if(value < 0 || value > 8) value = -1;
		sensory.colorNumber = value;
		event.colorNumberId = id;
	}
	
	// color pattern
	str = data.slice(12, 14);
	value = parseInt(str, 16);
	id = (value >> 6) & 0x03;
	if(id != event.colorPatternId) {
		if(event.colorPatternId != -1) {
			sensory.colorPattern = ((value >> 3) & 0x07) * 10 + (value & 0x07);
			if(sensory.colorPattern < 0) sensory.colorPattern = -1;
			sensory.colorPatternId = (sensory.colorPatternId % 255) + 1;
		}
		event.colorPatternId = id;
	}
	
	// floor
	str = data.slice(14, 16);
	value = parseInt(str, 16);
	sensory.floor = value;
	
	// pulse count
	str = data.slice(16, 20);
	sensory.pulseCount = parseInt(str, 16);
	
	// button
	str = data.slice(20, 22);
	value = parseInt(str, 16);
	sensory.button = value & 0x01;
	
	// clicked / double clicked / long pressed
	var clickId = (value >> 4) & 0x03;
	var longPressId = (value >> 6) & 0x03;
	var button = this.button;
	if(button.clickId < 0) {
		button.clickId = clickId;
	} else if(clickId != button.clickId) {
		button.clickId = clickId;
		value = (value >> 1) & 0x07;
		if(value == 1) {
			sensory.clicked = 1;
			sensory.clickedId = (sensory.clickedId % 255) + 1;
		} else if(value == 2) {
			sensory.doubleClicked = 1;
			sensory.doubleClickedId = (sensory.doubleClickedId % 255) + 1;
		}
	}
	if(button.longPressId < 0) {
		button.longPressId = longPressId;
	} else if(longPressId != button.longPressId) {
		button.longPressId = longPressId;
		sensory.longPressed = 1;
		sensory.longPressedId = (sensory.longPressedId % 255) + 1;
	}
	
	// free fall
	str = data.slice(22, 24);
	value = parseInt(str, 16);
	id = (value >> 4) & 0x0f;
	if(id != event.freeFallId) {
		if(event.freeFallId != -1) {
			sensory.freeFall = 1;
			sensory.freeFallId = (sensory.freeFallId % 255) + 1;
		}
		event.freeFallId = id;
	}
	
	// tap
	var wheel = this.wheel;
	id = value & 0x0f;
	if(id != event.tapId) {
		if(event.tapId != -1 && !wheel.move) {
			sensory.tap = 1;
			sensory.tapId = (sensory.tapId % 255) + 1;
		}
		event.tapId = id;
	}
	
	// acceleration
	var acc = this.acceleration;
	if(acc.count < 10) {
		++ acc.count;
	} else {
		acc.index %= 10;
		acc.sumx -= acc.x[acc.index];
		acc.sumy -= acc.y[acc.index];
		acc.sumz -= acc.z[acc.index];
	}
	// acceleration x
	str = data.slice(26, 28);
	value = parseInt(str, 16);
	if(value > 0x7f) value -= 0x100;
	value *= -256;
	acc.sumx += value;
	acc.x[acc.index] = value;
	// acceleration y
	str = data.slice(28, 30);
	value = parseInt(str, 16);
	if(value > 0x7f) value -= 0x100;
	value *= -256;
	acc.sumy += value;
	acc.y[acc.index] = value;
	// acceleration z
	str = data.slice(30, 32);
	value = parseInt(str, 16);
	if(value > 0x7f) value -= 0x100;
	value *= 256;
	acc.sumz += value;
	acc.z[acc.index] = value;
	++ acc.index;
	sensory.accelerationX = Math.round(acc.sumx / acc.count);
	sensory.accelerationY = Math.round(acc.sumy / acc.count);
	sensory.accelerationZ = Math.round(acc.sumz / acc.count);
	// tilt
	if(sensory.accelerationZ < 8192 && sensory.accelerationX > 8192 && sensory.accelerationY > -4096 && sensory.accelerationY < 4096) value = 1;
	else if(sensory.accelerationZ < 8192 && sensory.accelerationX < -8192 && sensory.accelerationY > -4096 && sensory.accelerationY < 4096) value = -1;
	else if(sensory.accelerationZ < 8192 && sensory.accelerationY > 8192 && sensory.accelerationX > -4096 && sensory.accelerationX < 4096) value = 2;
	else if(sensory.accelerationZ < 8192 && sensory.accelerationY < -8192 && sensory.accelerationX > -4096 && sensory.accelerationX < 4096) value = -2;
	else if(sensory.accelerationZ > 12288 && sensory.accelerationX > -8192 && sensory.accelerationX < 8192 && sensory.accelerationY > -8192 && sensory.accelerationY < 8192) value = 3;
	else if(sensory.accelerationZ < -12288 && sensory.accelerationX > -4096 && sensory.accelerationX < 4096 && sensory.accelerationY > -4096 && sensory.accelerationY < 4096) value = -3;
	else value = 0;
	sensory.tilt = value;
	
	// wheel state
	str = data.slice(32, 34);
	value = parseInt(str, 16);
	id = (value >> 6) & 0x03;
	if(wheel.event == 1) {
		if((id != wheel.stateId) && (wheel.stateId != -1)) {
			sensory.wheelState = 0;
			sensory.wheelStateId = (sensory.wheelStateId % 255) + 1;
			wheel.event = 0;
			this.motion.type = 0;
		}
	} else if(wheel.event == -1) {
		if(wheel.stateId != -1) {
			sensory.wheelState = 0;
			sensory.wheelStateId = (sensory.wheelStateId % 255) + 1;
			wheel.event = 0;
			this.motion.type = 0;
		}
	}
	wheel.stateId = id;
	
	// linetracer state
	id = (value >> 4) & 0x03;
	var lineTracer = this.lineTracer;
	if(lineTracer.event == 1) {
		if((id != lineTracer.stateId) && (lineTracer.stateId != -1)) {
			sensory.lineTracerState = 0x02;
			sensory.lineTracerStateId = (sensory.lineTracerStateId % 255) + 1;
			lineTracer.event = 0;
		}
	}
	lineTracer.stateId = id;
	
	// sound state
	id = (value >> 2) & 0x03;
	var sound = this.sound;
	if(sound.event == 1) {
		if((id != sound.stateId) && (sound.stateId != -1)) {
			sound.event = 0;
			var motoring = this.motoring;
			if(motoring.sound > 0) {
				if(motoring.soundRepeat < 0) {
					this.runSound(motoring.sound, -1);
				} else if(motoring.soundRepeat > 1) {
					motoring.soundRepeat --;
					this.runSound(motoring.sound, motoring.soundRepeat);
				} else {
					motoring.sound = 0;
					motoring.soundRepeat = 1;
					sensory.soundState = 0;
					sensory.soundStateId = (sensory.soundStateId % 255) + 1;
				}
			} else {
				motoring.sound = 0;
				motoring.soundRepeat = 1;
				sensory.soundState = 0;
				sensory.soundStateId = (sensory.soundStateId % 255) + 1;
			}
		}
	}
	sound.stateId = id;
	
	// battery state
	var state = value & 0x03;
	if(state == 0) state = 2; // normal
	else if(state >= 2) state = 0; // empty
	sensory.batteryState = state;
	
	// temperature
	str = data.slice(34, 36);
	value = parseInt(str, 16);
	if(value > 0x7f) value -= 0x100;
	value = value / 2.0 + 23;
	sensory.temperature = parseInt(value);
	
	// signal strength
	str = data.slice(36, 38);
	value = parseInt(str, 16);
	value -= 0x100;
	sensory.signalStrength = value;
};

Module.prototype.requestRemoteData = function(handler) {
	var sensory = this.sensory;
	for(var key in sensory) {
		handler.write(key, sensory[key]);
	}
	sensory.clicked = 0;
	sensory.doubleClicked = 0;
	sensory.longPressed = 0;
	sensory.colorPattern = -1;
	sensory.wheelState = -1;
	sensory.soundState = -1;
	sensory.lineTracerState = 0;
	sensory.freeFall = 0;
	sensory.tap = 0;
};

Module.prototype.handleRemoteData = function(handler) {
	var motoring = this.motoring;
	var t;
	// left wheel
	if(handler.e(Sally.LEFT_WHEEL)) {
		t = handler.read(Sally.LEFT_WHEEL);
		if(t < -100) t = -100;
		else if(t > 100) t = 100;
		motoring.leftWheel = t;
	}
	// right wheel
	if(handler.e(Sally.RIGHT_WHEEL)) {
		t = handler.read(Sally.RIGHT_WHEEL);
		if(t < -100) t = -100;
		else if(t > 100) t = 100;
		motoring.rightWheel = t;
	}
	// led
	if(handler.e(Sally.LED_RED)) {
		t = handler.read(Sally.LED_RED);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.ledRed = t;
	}
	if(handler.e(Sally.LED_GREEN)) {
		t = handler.read(Sally.LED_GREEN);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.ledGreen = t;
	}
	if(handler.e(Sally.LED_BLUE)) {
		t = handler.read(Sally.LED_BLUE);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.ledBlue = t;
	}
	// buzzer
	if(handler.e(Sally.BUZZER)) {
		t = handler.read(Sally.BUZZER);
		if(t < 0) t = 0;
		else if(t > 167772.15) t = 167772.15;
		motoring.buzzer = t;
	}
	// pulse
	if(handler.e(Sally.PULSE_ID)) {
		t = handler.read(Sally.PULSE_ID);
		if(t != motoring.pulseId) {
			motoring.pulseId = t;
			if(handler.e(Sally.PULSE)) {
				t = handler.read(Sally.PULSE);
				if(t < 0) t = 0;
				else if(t > 65535) t = 65535;
				motoring.pulse = t;
				this.wheel.written = true;
			}
		}
	}
	// note
	if(handler.e(Sally.NOTE)) {
		t = handler.read(Sally.NOTE);
		if(t < 0) t = 0;
		else if(t > 88) t = 88;
		motoring.note = t;
	}
	// sound
	if(handler.e(Sally.SOUND_ID)) {
		t = handler.read(Sally.SOUND_ID);
		if(t != motoring.soundId) {
			motoring.soundId = t;
			if(handler.e(Sally.SOUND) && handler.e(Sally.SOUND_REPEAT)) {
				t = handler.read(Sally.SOUND);
				if(t < 0) t = 0;
				else if(t > 127) t = 127;
				var t2 = handler.read(Sally.SOUND_REPEAT);
				this.runSound(t, t2);
			}
		}
	}
	// line tracer mode
	if(handler.e(Sally.LINE_TRACER_MODE_ID)) {
		t = handler.read(Sally.LINE_TRACER_MODE_ID);
		if(t != motoring.lineTracerModeId) {
			motoring.lineTracerModeId = t;
			if(handler.e(Sally.LINE_TRACER_MODE)) {
				t = handler.read(Sally.LINE_TRACER_MODE);
				if(t < 0) t = 0;
				else if(t > 15) t = 15;
				motoring.lineTracerMode = t;
				this.lineTracer.written = true;
			}
		}
	}
	// line tracer speed
	if(handler.e(Sally.LINE_TRACER_SPEED)) {
		t = handler.read(Sally.LINE_TRACER_SPEED);
		if(t < 1) t = 1;
		else if(t > 8) t = 8;
		motoring.lineTracerSpeed = t;
	}
	// motion
	if(handler.e(Sally.MOTION_ID)) {
		t = handler.read(Sally.MOTION_ID);
		if(t != motoring.motionId) {
			motoring.motionId = t;
			if(handler.e(Sally.MOTION_UNIT)) {
				t = handler.read(Sally.MOTION_UNIT);
				if(t < 0) t = 0;
				else if(t > 3) t = 3;
				motoring.motionUnit = t;
			}
			if(handler.e(Sally.MOTION_SPEED)) {
				t = handler.read(Sally.MOTION_SPEED);
				if(t < 0) t = 0;
				else if(t > 100) t = 100;
				motoring.motionSpeed = t;
			}
			if(handler.e(Sally.MOTION_VALUE)) {
				t = handler.read(Sally.MOTION_VALUE);
				if(t < 0) t = 0;
				else if(t > 2147483647) t = 2147483647;
				motoring.motionValue = t;
			}
			if(handler.e(Sally.MOTION_RADIUS)) {
				t = handler.read(Sally.MOTION_RADIUS);
				if(t < 0) t = 0;
				else if(t > 2147483647) t = 2147483647;
				motoring.motionRadius = t;
			}
			if(handler.e(Sally.MOTION_TYPE)) {
				t = handler.read(Sally.MOTION_TYPE);
				if(t < 0) t = 0;
				else if(t > 12) t = 12;
				motoring.motionType = t;
				this.motion.written = true;
			}
		}
	}
};

Module.prototype.requestLocalData = function() {
	var self = this;
	var motoring = self.motoring;
	var motion = self.motion;
	var wheel = self.wheel;
	var leftWheel = motoring.leftWheel, rightWheel = motoring.rightWheel;
	if(motion.written) {
		self.cancelTimeout();
		motion.type = parseInt(motoring.motionType);
		if(motion.type < 0 || motion.type > 12) { // MOTION_CIRCLE_RIGHT_BACKWARD
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
					wheel.event = -1;
					motion.type = 0;
				} else {
					self.timerId = setTimeout(function() {
						self.cancelTimeout();
						leftWheel = 0;
						rightWheel = 0;
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
							wheel.pulse = Math.round(value * alignment.cmToPulse);
							break;
						case 3: // MOTION_TURN_LEFT
							wheel.pulse = Math.round(value * (Sally.DEG_TO_PULSE_SPIN_LEFT + alignment.spinLeft) / 360.0);
							break;
						case 4: // MOTION_TURN_RIGHT
							wheel.pulse = Math.round(value * (Sally.DEG_TO_PULSE_SPIN_RIGHT + alignment.spinRight) / 360.0);
							break;
						case 5: // MOTION_PIVOT_LEFT_FORWARD
						case 6: // MOTION_PIVOT_LEFT_BACKWARD
							wheel.pulse = Math.round(value * (Sally.DEG_TO_PULSE_PIVOT_LEFT + alignment.pivotLeft) / 360.0);
							break;
						case 7: // MOTION_PIVOT_RIGHT_FORWARD
						case 8: // MOTION_PIVOT_RIGHT_BACKWARD
							wheel.pulse = Math.round(value * (Sally.DEG_TO_PULSE_PIVOT_RIGHT + alignment.pivotRight) / 360.0);
							break;
						case 9: // MOTION_CIRCLE_LEFT_FORWARD
						case 10: // MOTION_CIRCLE_LEFT_BACKWARD
							wheel.pulse = self.calculateCirclePulse(Sally.DEG_TO_PULSE_SPIN_LEFT, value, motoring.motionRadius, alignment.spinLeft);
							break;
						case 11: // MOTION_CIRCLE_RIGHT_FORWARD
						case 12: // MOTION_CIRCLE_RIGHT_BACKWARD
							wheel.pulse = self.calculateCirclePulse(Sally.DEG_TO_PULSE_SPIN_RIGHT, value, motoring.motionRadius, alignment.spinRight);
							break;
						default:
							motion.type = 0;
							break;
					}
				}
				if(wheel.pulse == 0) {
					leftWheel = 0;
					rightWheel = 0;
					wheel.event = -1;
					motion.type = 0;
				}
			}
		}
	}
	if(motion.type == 0) wheel.pulse = motoring.pulse;
	
	var speed = motion.speed;
	if(speed == 0) speed = Sally.DEFAULT_SPEED;
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
		case 9: // MOTION_CIRCLE_LEFT_FORWARD
			leftWheel = self.calculateInnerSpeed(speed, motoring.motionRadius);
			rightWheel = speed;
			break;
		case 10: // MOTION_CIRCLE_LEFT_BACKWARD
			leftWheel = -self.calculateInnerSpeed(speed, motoring.motionRadius);
			rightWheel = -speed;
			break;
		case 11: // MOTION_CIRCLE_RIGHT_FORWARD
			leftWheel = speed;
			rightWheel = self.calculateInnerSpeed(speed, motoring.motionRadius);
			break;
		case 12: // MOTION_CIRCLE_RIGHT_BACKWARD
			leftWheel = -speed;
			rightWheel = -self.calculateInnerSpeed(speed, motoring.motionRadius);
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
	if(leftWheel < 0) str += self.toHex2(leftWheel * 10 - 0.5);
	else str += self.toHex2(leftWheel * 10 + 0.5);
	if(rightWheel < 0) str += self.toHex2(rightWheel * 10 - 0.5);
	else str += self.toHex2(rightWheel * 10 + 0.5);
	if(motion.written || wheel.written) {
		motion.written = false;
		wheel.written = false;
		if(wheel.pulse != 0 || wheel.pulsePrev != 0) {
			wheel.id = (wheel.id % 255) + 1;
		}
		if(wheel.pulse > 0) {
			wheel.event = 1;
		} else if(wheel.event != -1) {
			wheel.event = 0;
		}
		wheel.pulsePrev = wheel.pulse;
	}
	str += self.toHex(wheel.id);
	str += self.toHex2(wheel.pulse);
	
	var lineTracer = self.lineTracer;
	var tmp = motoring.lineTracerMode;
	if(lineTracer.written) {
		lineTracer.written = false;
		if(tmp > 0) {
			lineTracer.flag ^= 0x80;
			lineTracer.event = 1;
		} else {
			lineTracer.event = 0;
		}
	}
	tmp = (tmp & 0x0f) << 3;
	tmp |= lineTracer.flag;
	tmp |= (motoring.lineTracerSpeed - 1) & 0x07;
	str += self.toHex(tmp);
	str += self.toHex(motoring.ledRed);
	str += self.toHex(motoring.ledGreen);
	str += self.toHex(motoring.ledBlue);
	str += '00';
	str += self.toHex3(motoring.buzzer * 100);
	str += self.toHex(motoring.note);
	
	var sound = self.sound;
	tmp = 0;
	switch(motoring.sound) {
		case 0: tmp = 0x00; break;
		case 1: tmp = 0x01; break;
		case 2: tmp = 0x05; break;
		case 10: tmp = 0x07; break;
		case 3: tmp = 0x09; break;
		case 4: tmp = 0x0b; break;
		case 11: tmp = 0x12; break;
		case 5: tmp = 0x14; break;
		case 8: tmp = 0x15; break;
		case 9: tmp = 0x17; break;
		case 12: tmp = 0x18; break;
		case 13: tmp = 0x19; break;
		case 14: tmp = 0x1a; break;
		case 15: tmp = 0x1b; break;
		case 6: tmp = 0x1c; break;
		case 7: tmp = 0x1d; break;
	}
	if(sound.written) {
		sound.written = false;
		if(tmp > 0) {
			sound.flag ^= 0x80;
			sound.event = 1;
		} else {
			sound.event = 0;
		}
	}
	tmp |= sound.flag;
	str += self.toHex(tmp);
	str += '0000-';
	str += self.address;
	str += '\r';
	return str;
};

Module.prototype.reset = function() {
	this.cancelTimeout();
	var motoring = this.motoring;
	motoring.leftWheel = 0;
	motoring.rightWheel = 0;
	motoring.ledRed = 0;
	motoring.ledGreen = 0;
	motoring.ledBlue = 0;
	motoring.buzzer = 0;
	motoring.pulse = 0;
	motoring.pulseId = 0;
	motoring.note = 0;
	motoring.sound = 0;
	motoring.soundRepeat = 1;
	motoring.soundId = 0;
	motoring.lineTracerMode = 0;
	motoring.lineTracerModeId = 0;
	motoring.lineTracerSpeed = 4;
	motoring.motionId = 0;
	motoring.motionType = 0;
	motoring.motionUnit = 0;
	motoring.motionSpeed = 0;
	motoring.motionValue = 0;
	motoring.motionRadius = 0;

	var sensory = this.sensory;
	sensory.button = 0;
	sensory.clicked = 0;
	sensory.clickedId = 0;
	sensory.doubleClicked = 0;
	sensory.doubleClickedId = 0;
	sensory.longPressed = 0;
	sensory.longPressedId = 0;
	sensory.colorNumber = -1;
	sensory.colorPattern = -1;
	sensory.colorPatternId = 0;
	sensory.pulseCount = 0;
	sensory.wheelState = -1;
	sensory.wheelStateId = 0;
	sensory.soundState = -1;
	sensory.soundStateId = 0;
	sensory.lineTracerState = 0;
	sensory.lineTracerStateId = 0;
	sensory.tilt = 0;
	sensory.batteryState = 2;
	sensory.freeFall = 0;
	sensory.freeFallId = 0;
	sensory.tap = 0;
	sensory.tapId = 0;

	var motion = this.motion;
	motion.written = false;
	motion.type = 0;
	motion.speed = 0;

	var acc = this.acceleration;
	acc.sumx = 0.0;
	acc.sumy = 0.0;
	acc.sumz = 0.0;
	acc.index = 0;
	acc.count = 0;

	var button = this.button;
	button.clickId = -1;
	button.longPressId = -1;

	var wheel = this.wheel;
	wheel.written = false;
	wheel.pulse = 0;
	wheel.pulsePrev = -1;
	wheel.event = 0;
	wheel.stateId = -1;
	wheel.move = false;
	wheel.moveCount = 0;

	var sound = this.sound;
	sound.written = false;
	sound.event = 0;
	sound.stateId = -1;

	var lineTracer = this.lineTracer;
	lineTracer.written = false;
	lineTracer.event = 0;
	lineTracer.stateId = -1;

	var event = this.event;
	event.colorNumberId = -1;
	event.colorPatternId = -1;
	event.freeFallId = -1;
	event.tapId = -1;
};

module.exports = new Module();