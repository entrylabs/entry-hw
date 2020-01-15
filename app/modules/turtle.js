'use strict';
var Turtle = {
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
	LINE_TRACER_GAIN: 'lineTracerGain',
	LINE_TRACER_SPEED: 'lineTracerSpeed',
	MOTION_ID: 'motionId',
	MOTION_TYPE: 'motionType',
	MOTION_UNIT: 'motionUnit',
	MOTION_SPEED: 'motionSpeed',
	MOTION_VALUE: 'motionValue',
	MOTION_RADIUS: 'motionRadius',
	CM_TO_PULSE: 106.8,
	DEG_TO_PULSE: 1570,
	WHEEL_DISTANCE: 2.3125,
	DEFAULT_SPEED: 50
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
		batteryState: 2
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
		lineTracerGain: 5,
		lineTracerSpeed: 5,
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
		state: 0,
		count: 0
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
		flag: 0,
		event: 0,
		state: 0,
		count: 0
	};
	this.event = {
		button: 0,
		colorNumber: -1,
		colorPattern: -1,
		pulseCount: 0
	};
	this.alignment = {
		state: 0,
		count: 0,
		distance: Turtle.WHEEL_DISTANCE,
		spinRight: 0,
		pivotRight: 0,
		spinLeft: 0,
		pivotLeft: 0,
		offset: 0
	};
	this.battery = {
		state: 2,
		data: new Array(10),
		sum: 0.0,
		index: 0,
		count: 0
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

Module.prototype.calculateSpeed = function(speed, radius) {
	return speed * (radius - this.alignment.distance) / (radius + this.alignment.distance);
};

Module.prototype.calculatePulse = function(deg, radius, offset) {
	return Math.round(deg * (Turtle.DEG_TO_PULSE + offset) * (radius + this.alignment.distance) / 360.0 / this.alignment.distance);
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
	str = data.slice(10, 12);
	value = parseInt(str, 16);
	if(value > 0x7f) value -= 0x100;
	alignment.offset = (value + 1) * 256;
	str = data.slice(12, 14);
	value = parseInt(str, 16);
	if(value > 0x7f) value -= 0x100;
	alignment.offset += value + 1;
	alignment.distance = Turtle.WHEEL_DISTANCE + alignment.offset / 10000.0;
	if(alignment.distance <= 0) alignment.distance = Turtle.WHEEL_DISTANCE;
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
			return 'B000000000000000000000000000000000004400-' + this.address + '\r';
		}
		alignment.count ++;
	} else if(alignment.state == 2) {
		alignment.state = 3;
		return '7000000000000000000000000000000000004400-' + this.address + '\r';
	}
};

Module.prototype.checkInitialData = function(data, config) {
	var alignment = this.alignment;
	if(alignment.state == 0) {
		if(data && data.slice(0, 2) == 'FF') {
			var info = data.split(/[,\n]+/);
			if(info && info.length >= 5) {
				if(info[1] == 'Turtle' && info[2] == '09' && info[4].length >= 12) {
					config.id = '0209' + info[3];
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
	str = data.slice(2, 6);
	var red = parseInt(str, 16);
	str = data.slice(6, 10);
	var green = parseInt(str, 16);
	str = data.slice(10, 14);
	var blue = parseInt(str, 16);
	str = data.slice(14, 16);
	value = parseInt(str, 16);

	var r = parseInt(red * 255 / 1023);
	var g = parseInt(green * 255 / 1023);
	var b = parseInt(blue * 255 / 1023);
	if(r > 255) r = 255;
	else if(r < 0) r = 0;
	if(g > 255) g = 255;
	else if(g < 0) g = 0;
	if(b > 255) b = 255;
	else if(b < 0) b = 0;

	sensory.colorRed = r;
	sensory.colorGreen = g;
	sensory.colorBlue = b;
	sensory.colorClear = value;

	// color number
	var colorNumber = -1;
	if(value < 75) {
		if(red > 600 && green > 600 && blue > 600) {
			colorNumber = 8;
		} else if(green < red * 3/10 && blue < red * 3/10 && red > 350) {
			colorNumber = 1;
		} else if(blue < red * 5/10 && blue < green * 6/10 && red > 300 && green > 250) {
			if(green < red * 15/20) {
				colorNumber = 2;
			} else {
				colorNumber = 3;
			}
		} else if(red < green * 6/10 && blue < green * 6/10 && green > 300) {
			colorNumber = 4;
		} else if(red < blue * 6/10 && green < blue * 7/10 && blue > 250) {
			colorNumber = 6;
		} else if(red < green * 6/10 && red < blue * 6/10 && blue > 250 && green > 250) {
			colorNumber = 5;
		} else if(green < red * 7/10 && green < blue * 7/10 && red > 250) {
			colorNumber = 7;
		} else if(red < 300 && green < 300 && blue < 250) {
			colorNumber = 0;
		}
	}
	var event = this.event;
	if(colorNumber != event.colorNumber) {
		event.colorNumber = colorNumber;
		sensory.colorNumber = colorNumber;
	}

	// clicked / double clicked / long pressed
	str = data.slice(16, 18);
	value = parseInt(str, 16);
	var clickId = (value >> 2) & 0x03;
	var longPressId = (value >> 4) & 0x03;
	var button = this.button;
	if(button.clickId < 0) {
		button.clickId = clickId;
	} else if(clickId != button.clickId) {
		button.clickId = clickId;
		value = value & 0x03;
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

	// floor
	str = data.slice(18, 20);
	value = parseInt(str, 16);
	sensory.floor = value;
	// color pattern / button
	str = data.slice(20, 22);
	value = parseInt(str, 16);
	var pattern = (value >> 1) & 0x7f;
	if(event.colorPattern < 0) {
		event.colorPattern = pattern;
	} else if(pattern != event.colorPattern) {
		event.colorPattern = pattern;
		var pattern1 = (pattern >> 3) & 0x07;
		if(pattern1 > 1) pattern1++;
		var pattern2 = pattern & 0x07;
		if(pattern2 > 1) pattern2++;
		sensory.colorPattern = pattern1 * 10 + pattern2;
		sensory.colorPatternId = (sensory.colorPatternId % 255) + 1;
	}
	value = value & 0x01;
	if(value != event.button) {
		event.button = value;
		sensory.button = value;
	}
	// pulse count
	str = data.slice(22, 26);
	value = parseInt(str, 16);
	if(value != event.pulseCount) {
		event.pulseCount = value;
		sensory.pulseCount = value;
	}

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
	value *= 256;
	acc.sumx += value;
	acc.x[acc.index] = value;
	// acceleration y
	str = data.slice(28, 30);
	value = parseInt(str, 16);
	if(value > 0x7f) value -= 0x100;
	value *= 256;
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

	// temperature
	str = data.slice(32, 34);
	value = parseInt(str, 16);
	if(value > 0x7f) value -= 0x100;
	value = value / 2.0 + 24;
	sensory.temperature = parseInt(value);
	// signal strength
	str = data.slice(34, 36);
	value = parseInt(str, 16);
	value -= 0x100;
	sensory.signalStrength = value;
	// battery
	str = data.slice(36, 38);
	value = parseInt(str, 16);
	value = value / 100.0 + 2;
	// battery state
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
	if(value < 3.63) state = 0;
	else if(value < 3.65) state = 1;
	if(state != event.batteryState) {
		event.batteryState = state;
		sensory.batteryState = state;
	}
	// wheel state / sound state / linetracer state
	str = data.slice(38, 40);
	value = parseInt(str, 16);
	state = (value >> 4) & 0x01;
	var wheel = this.wheel;
	if(wheel.event == 1) {
		if(state == 0) {
			if(wheel.pulse > 0 && wheel.pulse < 12) {
				if(++wheel.count > 5) wheel.event = 2;
			}
		} else {
			wheel.event = 2;
		}
	}
	if(wheel.event == 2) {
		if(state != wheel.state || wheel.count > 5) {
			wheel.state = state;
			sensory.wheelState = state;
			sensory.wheelStateId = (sensory.wheelStateId % 255) + 1;
			if(state == 0) {
				wheel.event = 0;
				wheel.count = 0;
				this.motion.type = 0;
			}
		}
	}
	if(wheel.event == -1) {
		wheel.state = state;
		sensory.wheelState = 0;
		sensory.wheelStateId = (sensory.wheelStateId % 255) + 1;
		wheel.event = 0;
		wheel.count = 0;
		this.motion.type = 0;
	}
	state = value & 0x03;
	if(state > 1) state = 1;
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
	state = (value >> 2) & 0x03;
	if((state & 0x02) != 0) {
		var lineTracer = this.lineTracer;
		if(lineTracer.event == 1) {
			if(state == 0x02) {
				if(++lineTracer.count > 5) lineTracer.event = 2;
			} else {
				lineTracer.event = 2;
			}
		}
		if(lineTracer.event == 2) {
			if(state != lineTracer.state || lineTracer.count > 5) {
				lineTracer.state = state;
				sensory.lineTracerState = state;
				sensory.lineTracerStateId = (sensory.lineTracerStateId % 255) + 1;
				if(state == 0x02) {
					lineTracer.event = 0;
					lineTracer.count = 0;
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
	sensory.clicked = 0;
	sensory.doubleClicked = 0;
	sensory.longPressed = 0;
	sensory.colorPattern = -1;
	sensory.wheelState = -1;
	sensory.soundState = -1;
	sensory.lineTracerState = 0;
};

Module.prototype.handleRemoteData = function(handler) {
	var motoring = this.motoring;
	var t;
	// left wheel
	if(handler.e(Turtle.LEFT_WHEEL)) {
		t = handler.read(Turtle.LEFT_WHEEL);
		if(t < -400) t = -400;
		else if(t > 400) t = 400;
		motoring.leftWheel = t;
	}
	// right wheel
	if(handler.e(Turtle.RIGHT_WHEEL)) {
		t = handler.read(Turtle.RIGHT_WHEEL);
		if(t < -400) t = -400;
		else if(t > 400) t = 400;
		motoring.rightWheel = t;
	}
	// led
	if(handler.e(Turtle.LED_RED)) {
		t = handler.read(Turtle.LED_RED);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.ledRed = t;
	}
	if(handler.e(Turtle.LED_GREEN)) {
		t = handler.read(Turtle.LED_GREEN);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.ledGreen = t;
	}
	if(handler.e(Turtle.LED_BLUE)) {
		t = handler.read(Turtle.LED_BLUE);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.ledBlue = t;
	}
	// buzzer
	if(handler.e(Turtle.BUZZER)) {
		t = handler.read(Turtle.BUZZER);
		if(t < 0) t = 0;
		else if(t > 167772.15) t = 167772.15;
		motoring.buzzer = t;
	}
	// pulse
	if(handler.e(Turtle.PULSE_ID)) {
		t = handler.read(Turtle.PULSE_ID);
		if(t != motoring.pulseId) {
			motoring.pulseId = t;
			if(handler.e(Turtle.PULSE)) {
				t = handler.read(Turtle.PULSE);
				if(t < 0) t = 0;
				else if(t > 65535) t = 65535;
				motoring.pulse = t;
				this.wheel.written = true;
			}
		}
	}
	// note
	if(handler.e(Turtle.NOTE)) {
		t = handler.read(Turtle.NOTE);
		if(t < 0) t = 0;
		else if(t > 88) t = 88;
		motoring.note = t;
	}
	// sound
	if(handler.e(Turtle.SOUND_ID)) {
		t = handler.read(Turtle.SOUND_ID);
		if(t != motoring.soundId) {
			motoring.soundId = t;
			if(handler.e(Turtle.SOUND) && handler.e(Turtle.SOUND_REPEAT)) {
				t = handler.read(Turtle.SOUND);
				if(t < 0) t = 0;
				else if(t > 127) t = 127;
				var t2 = handler.read(Turtle.SOUND_REPEAT);
				this.runSound(t, t2);
			}
		}
	}
	// line tracer mode
	if(handler.e(Turtle.LINE_TRACER_MODE_ID)) {
		t = handler.read(Turtle.LINE_TRACER_MODE_ID);
		if(t != motoring.lineTracerModeId) {
			motoring.lineTracerModeId = t;
			if(handler.e(Turtle.LINE_TRACER_MODE)) {
				t = handler.read(Turtle.LINE_TRACER_MODE);
				if(t < 0) t = 0;
				else if(t > 127) t = 127;
				motoring.lineTracerMode = t;
				this.lineTracer.written = true;
			}
		}
	}
	// line tracer gain
	if(handler.e(Turtle.LINE_TRACER_GAIN)) {
		t = handler.read(Turtle.LINE_TRACER_GAIN);
		if(t < 1) t = 1;
		else if(t > 8) t = 8;
		motoring.lineTracerGain = t;
	}
	// line tracer speed
	if(handler.e(Turtle.LINE_TRACER_SPEED)) {
		t = handler.read(Turtle.LINE_TRACER_SPEED);
		if(t < 1) t = 1;
		else if(t > 8) t = 8;
		motoring.lineTracerSpeed = t;
	}
	// motion
	if(handler.e(Turtle.MOTION_ID)) {
		t = handler.read(Turtle.MOTION_ID);
		if(t != motoring.motionId) {
			motoring.motionId = t;
			if(handler.e(Turtle.MOTION_UNIT)) {
				t = handler.read(Turtle.MOTION_UNIT);
				if(t < 0) t = 0;
				else if(t > 3) t = 3;
				motoring.motionUnit = t;
			}
			if(handler.e(Turtle.MOTION_SPEED)) {
				t = handler.read(Turtle.MOTION_SPEED);
				if(t < 0) t = 0;
				else if(t > 400) t = 400;
				motoring.motionSpeed = t;
			}
			if(handler.e(Turtle.MOTION_VALUE)) {
				t = handler.read(Turtle.MOTION_VALUE);
				if(t < 0) t = 0;
				else if(t > 2147483647) t = 2147483647;
				motoring.motionValue = t;
			}
			if(handler.e(Turtle.MOTION_RADIUS)) {
				t = handler.read(Turtle.MOTION_RADIUS);
				if(t < 0) t = 0;
				else if(t > 2147483647) t = 2147483647;
				motoring.motionRadius = t;
			}
			if(handler.e(Turtle.MOTION_TYPE)) {
				t = handler.read(Turtle.MOTION_TYPE);
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
		if(motion.type < 0 || motion.type > 12) { // MOTION_SWING_RIGHT_TAIL
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
							wheel.pulse = Math.round(value * Turtle.CM_TO_PULSE);
							break;
						case 3: // MOTION_TURN_LEFT
							wheel.pulse = Math.round(value * (Turtle.DEG_TO_PULSE + alignment.spinLeft) / 360.0);
							break;
						case 4: // MOTION_TURN_RIGHT
							wheel.pulse = Math.round(value * (Turtle.DEG_TO_PULSE + alignment.spinRight) / 360.0);
							break;
						case 5: // MOTION_PIVOT_LEFT_HEAD
						case 6: // MOTION_PIVOT_LEFT_TAIL
							wheel.pulse = Math.round(value * (2 * Turtle.DEG_TO_PULSE + alignment.pivotLeft) / 360.0);
							break;
						case 7: // MOTION_PIVOT_RIGHT_HEAD
						case 8: // MOTION_PIVOT_RIGHT_TAIL
							wheel.pulse = Math.round(value * (2 * Turtle.DEG_TO_PULSE + alignment.pivotRight) / 360.0);
							break;
						case 9: // MOTION_SWING_LEFT_HEAD
						case 10: // MOTION_SWING_LEFT_TAIL
							wheel.pulse = self.calculatePulse(value, motoring.motionRadius, alignment.spinLeft);
							break;
						case 11: // MOTION_SWING_RIGHT_HEAD
						case 12: // MOTION_SWING_RIGHT_TAIL
							wheel.pulse = self.calculatePulse(value, motoring.motionRadius, alignment.spinRight);
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
	if(speed == 0) speed = Turtle.DEFAULT_SPEED;
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
		case 5: // MOTION_PIVOT_LEFT_HEAD
			leftWheel = 0;
			rightWheel = speed;
			break;
		case 6: // MOTION_PIVOT_LEFT_TAIL
			leftWheel = 0;
			rightWheel = -speed;
			break;
		case 7: // MOTION_PIVOT_RIGHT_HEAD
			leftWheel = speed;
			rightWheel = 0;
			break;
		case 8: // MOTION_PIVOT_RIGHT_TAIL
			leftWheel = -speed;
			rightWheel = 0;
			break;
		case 9: // MOTION_SWING_LEFT_HEAD
			leftWheel = self.calculateSpeed(speed, motoring.motionRadius);
			rightWheel = speed;
			break;
		case 10: // MOTION_SWING_LEFT_TAIL
			leftWheel = -self.calculateSpeed(speed, motoring.motionRadius);
			rightWheel = -speed;
			break;
		case 11: // MOTION_SWING_RIGHT_HEAD
			leftWheel = speed;
			rightWheel = self.calculateSpeed(speed, motoring.motionRadius);
			break;
		case 12: // MOTION_SWING_RIGHT_TAIL
			leftWheel = -speed;
			rightWheel = -self.calculateSpeed(speed, motoring.motionRadius);
			break;
	}

	var str = '10';
	if(leftWheel < 0) str += self.toHex2(leftWheel * 10.68 - 0.5);
	else str += self.toHex2(leftWheel * 10.68 + 0.5);
	if(rightWheel < 0) str += self.toHex2(rightWheel * 10.68 - 0.5);
	else str += self.toHex2(rightWheel * 10.68 + 0.5);
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

	var lineTracer = self.lineTracer;
	var tmp = 0;
	switch(motoring.lineTracerMode) {
		case 0: tmp = 0x00; break;
		case 10: tmp = 0x08; break;
		case 11: tmp = 0x09; break;
		case 13: tmp = 0x0b; break;
		case 15: tmp = 0x0d; break;
		case 17: tmp = 0x0f; break;
		case 20: tmp = 0x10; break;
		case 30: tmp = 0x18; break;
		case 40: tmp = 0x20; break;
		case 50: tmp = 0x28; break;
		case 61: tmp = 0x31; break;
		case 62: tmp = 0x32; break;
		case 63: tmp = 0x33; break;
		case 64: tmp = 0x34; break;
		case 65: tmp = 0x35; break;
		case 66: tmp = 0x36; break;
		case 67: tmp = 0x37; break;
		case 71: tmp = 0x39; break;
		case 73: tmp = 0x3b; break;
		case 75: tmp = 0x3d; break;
		case 77: tmp = 0x3f; break;
	}
	if(lineTracer.written) {
		lineTracer.written = false;
		lineTracer.count = 0;
		if(tmp > 0) {
			lineTracer.flag ^= 0x80;
			lineTracer.event = 1;
		} else {
			lineTracer.event = 0;
		}
	}
	tmp |= lineTracer.flag;
	str += self.toHex(tmp);
	str += self.toHex(motoring.ledRed);
	str += self.toHex(motoring.ledGreen);
	str += self.toHex(motoring.ledBlue);
	tmp = (motoring.lock & 0x01) << 4;
	tmp |= (1 - motoring.lamp) & 0x01;
	str += self.toHex(tmp);
	str += self.toHex3(motoring.buzzer * 100);
	str += self.toHex(motoring.note);

	var sound = self.sound;
	tmp = 0;
	switch(motoring.sound) {
		case 0: tmp = 0x00; break;
		case 1: tmp = 0x01; break;
		case 2: tmp = 0x05; break;
		case 3: tmp = 0x10; break;
		case 4: tmp = 0x20; break;
		case 5: tmp = 0x30; break;
		case 6: tmp = 0x40; break;
		case 7: tmp = 0x41; break;
		case 8: tmp = 0x42; break;
		case 9: tmp = 0x43; break;
	}
	if(sound.written) {
		sound.written = false;
		sound.count = 0;
		if(tmp > 0) {
			sound.flag ^= 0x80;
			sound.event = 1;
		} else {
			sound.event = 0;
		}
	}
	tmp |= sound.flag;
	str += self.toHex(tmp);
	tmp = ((motoring.lineTracerGain - 1) & 0x0f) << 4;
	tmp |= (motoring.lineTracerSpeed - 1) & 0x0f;
	str += self.toHex(tmp);
	str += '00-';
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
	motoring.lineTracerGain = 5;
	motoring.lineTracerSpeed = 5;
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
	sensory.batteryState = 2;

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
	wheel.state = 0;
	wheel.count = 0;

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
	event.button = 0;
	event.colorNumber = -1;
	event.colorPattern = -1;
	event.pulseCount = 0;
	
	var batt = this.battery;
	batt.state = 2;
	batt.sum = 0.0;
	batt.index = 0;
	batt.count = 0;
};

module.exports = new Module();
