'use strict';
var Zerone = {
	LEFT_WHEEL: 'leftWheel',
	RIGHT_WHEEL: 'rightWheel',
	LEFT_HEAD_RED: 'leftHeadRed',
	LEFT_HEAD_GREEN: 'leftHeadGreen',
	LEFT_HEAD_BLUE: 'leftHeadBlue',
	RIGHT_HEAD_RED: 'rightHeadRed',
	RIGHT_HEAD_GREEN: 'rightHeadGreen',
	RIGHT_HEAD_BLUE: 'rightHeadBlue',
	LEFT_TAIL_RED: 'leftTailRed',
	LEFT_TAIL_GREEN: 'leftTailGreen',
	LEFT_TAIL_BLUE: 'leftTailBlue',
	RIGHT_TAIL_RED: 'rightTailRed',
	RIGHT_TAIL_GREEN: 'rightTailGreen',
	RIGHT_TAIL_BLUE: 'rightTailBlue',
	BUZZER: 'buzzer',
	PULSE: 'pulse',
	PULSE_ID: 'pulseId',
	NOTE: 'note',
	SOUND: 'sound',
	SOUND_REPEAT: 'soundRepeat',
	SOUND_ID: 'soundId',
	MOTION_ID: 'motionId',
	MOTION_TYPE: 'motionType',
	MOTION_UNIT: 'motionUnit',
	MOTION_SPEED: 'motionSpeed',
	MOTION_VALUE: 'motionValue',
	MOTION_RADIUS: 'motionRadius',
	SENSOR_MODE: 'sensorMode',
	CM_TO_PULSE: 642.0 / 7,
	DEG_TO_PULSE: 1122.0 / 360,
	DEFAULT_SPEED: 50
};

function Module() {
	this.sensory = {
		signalStrength: 0,
		leftProximity: 0,
		rightProximity: 0,
		frontProximity: 0,
		rearProximity: 0,
		colorRed: 0,
		colorGreen: 0,
		colorBlue: 0,
		colorClear: 0,
		gesture: -1,
		gestureId: 0,
		colorNumber: -1,
		pulseCount: 0,
		wheelState: -1,
		wheelStateId: 0,
		soundState: -1,
		soundStateId: 0,
		batteryState: 2
	};
	this.motoring = {
		leftWheel: 0,
		rightWheel: 0,
		leftHeadRed: 0,
		leftHeadGreen: 0,
		leftHeadBlue: 0,
		rightHeadRed: 0,
		rightHeadGreen: 0,
		rightHeadBlue: 0,
		leftTailRed: 0,
		leftTailGreen: 0,
		leftTailBlue: 0,
		rightTailRed: 0,
		rightTailGreen: 0,
		rightTailBlue: 0,
		buzzer: 0,
		pulse: 0,
		pulseId: 0,
		note: 0,
		sound: 0,
		soundRepeat: 1,
		soundId: 0,
		motionId: 0,
		motionType: 0,
		motionUnit: 0,
		motionSpeed: 0,
		motionValue: 0,
		motionRadius: 0,
		sensorMode: 0,
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
		stateId: -1
	};
	this.sound = {
		written: false,
		flag: 0,
		event: 0,
		stateId: -1
	};
	this.event = {
		gestureId: -1,
		colorNumberId: -1,
		pulseCount: -1,
		batteryState: -1,
		touchId: -1
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
			if(info[1] == 'Zerone' && info[2] == '0F' && info[4].length >= 12) {
				config.id = '020F' + info[3];
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
	
	var str = data.slice(0, 1);
	var value = parseInt(str, 16);
	if(value != 1) return; // invalid data
	
	var sensory = this.sensory;
	var event = this.event;
	var id;
	// mode
	str = data.slice(1, 2);
	value = parseInt(str, 16);
	if((value & 0x01) == 0) { // gesture mode
		// gesture id
		str = data.slice(2, 4);
		id = parseInt(str, 16);
		if(id != event.gestureId) {
			if(event.gestureId != -1) {
				// gesture
				str = data.slice(4, 6);
				value = parseInt(str, 16);
				switch(value) {
					case 1: sensory.gesture = 1; break;
					case 2: sensory.gesture = 0; break;
					case 3: sensory.gesture = 3; break;
					case 4: sensory.gesture = 2; break;
					case 5: sensory.gesture = 4; break;
					case 6: sensory.gesture = 5; break;
					default: sensory.gesture = -1; break;
				}
				sensory.gestureId = (sensory.gestureId % 255) + 1;
			}
			event.gestureId = id;
		}
		
		// proximity
		str = data.slice(6, 8);
		sensory.rightProximity = parseInt(str, 16);
		str = data.slice(8, 10);
		sensory.leftProximity = parseInt(str, 16);
		str = data.slice(10, 12);
		sensory.rearProximity = parseInt(str, 16);
		str = data.slice(12, 14);
		sensory.frontProximity = parseInt(str, 16);
		
		sensory.colorNumber = -1;
		sensory.colorRed = 0;
		sensory.colorGreen = 0;
		sensory.colorBlue = 0;
		sensory.colorClear = 0;
	} else { // color mode
		// color number id
		str = data.slice(2, 4);
		id = parseInt(str, 16);
		// color number
		str = data.slice(4, 6);
		value = parseInt(str, 16);
		switch(value) {
			case 0: sensory.colorNumber = -1; break;
			case 1: sensory.colorNumber = 1; break;
			case 2: sensory.colorNumber = 2; break;
			case 3: sensory.colorNumber = 3; break;
			case 4: sensory.colorNumber = 4; break;
			case 5: sensory.colorNumber = 5; break;
			case 6: sensory.colorNumber = 6; break;
			default: sensory.colorNumber = -1; break;
		}
		// r, g, b, c
		str = data.slice(6, 10);
		var r = parseInt(str, 16);
		str = data.slice(10, 14);
		var g = parseInt(str, 16);
		str = data.slice(14, 18);
		var b = parseInt(str, 16);
		str = data.slice(18, 22);
		value = parseInt(str, 16);
		
		r = parseInt(r * 255 / 1023);
		g = parseInt(g * 255 / 1023);
		b = parseInt(b * 255 / 1023);
		value = parseInt(value * 255 / 1023);
		if(r > 255) r = 255;
		else if(r < 0) r = 0;
		if(g > 255) g = 255;
		else if(g < 0) g = 0;
		if(b > 255) b = 255;
		else if(b < 0) b = 0;
		if(value > 255) value = 255;
		else if(value < 0) value = 0;
		
		sensory.colorRed = r;
		sensory.colorGreen = g;
		sensory.colorBlue = b;
		sensory.colorClear = value;
		
		sensory.gesture = -1;
		sensory.leftProximity = 0;
		sensory.rightProximity = 0;
		sensory.frontProximity = 0;
		sensory.rearProximity = 0;
	}
	
	// click, long touch
	str = data.slice(26, 28);
	id = parseInt(str, 16);
	if(id != event.touchId) {
		if(event.touchId != -1) {
			str = data.slice(28, 30);
			value = parseInt(str, 16);
			if(value == 6) {
				sensory.gesture = 6;
				sensory.gestureId = (sensory.gestureId % 255) + 1;
			} else if(value == 4) {
				sensory.gesture = 7;
				sensory.gestureId = (sensory.gestureId % 255) + 1;
			}
		}
		event.touchId = id;
	}
	
	// pulse count
	str = data.slice(30, 34);
	sensory.pulseCount = parseInt(str, 16);
	
	// internal state
	str = data.slice(34, 36);
	value = parseInt(str, 16);
	// wheel state
	id = (value >> 6) & 0x03;
	var wheel = this.wheel;
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
	// sound state
	id = (value >> 4) & 0x03;
	var sound = this.sound;
	if(sound.event == 1) {
		if((id != sound.stateId) && (sound.stateId != -1)) {
			var motoring = this.motoring;
			sound.event = 0;
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
	var state = value & 0x01;
	// battery
	str = data.slice(38, 40);
	value = parseInt(str, 16);
	value = (value + 200) / 100.0;
	if(state == 0) {
		if(value < 3.65) state = 1;
		else state = 2;
	} else {
		state = 0;
	}
	sensory.batteryState = state;
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
	sensory.gesture = -1;
	sensory.wheelState = -1;
	sensory.soundState = -1;
};

Module.prototype.handleRemoteData = function(handler) {
	var motoring = this.motoring;
	var t;
	// left wheel
	if(handler.e(Zerone.LEFT_WHEEL)) {
		t = handler.read(Zerone.LEFT_WHEEL);
		if(t < -100) t = -100;
		else if(t > 100) t = 100;
		motoring.leftWheel = t;
	}
	// right wheel
	if(handler.e(Zerone.RIGHT_WHEEL)) {
		t = handler.read(Zerone.RIGHT_WHEEL);
		if(t < -100) t = -100;
		else if(t > 100) t = 100;
		motoring.rightWheel = t;
	}
	// left head led
	if(handler.e(Zerone.LEFT_HEAD_RED)) {
		t = handler.read(Zerone.LEFT_HEAD_RED);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.leftHeadRed = t;
	}
	if(handler.e(Zerone.LEFT_HEAD_GREEN)) {
		t = handler.read(Zerone.LEFT_HEAD_GREEN);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.leftHeadGreen = t;
	}
	if(handler.e(Zerone.LEFT_HEAD_BLUE)) {
		t = handler.read(Zerone.LEFT_HEAD_BLUE);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.leftHeadBlue = t;
	}
	// right head led
	if(handler.e(Zerone.RIGHT_HEAD_RED)) {
		t = handler.read(Zerone.RIGHT_HEAD_RED);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.rightHeadRed = t;
	}
	if(handler.e(Zerone.RIGHT_HEAD_GREEN)) {
		t = handler.read(Zerone.RIGHT_HEAD_GREEN);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.rightHeadGreen = t;
	}
	if(handler.e(Zerone.RIGHT_HEAD_BLUE)) {
		t = handler.read(Zerone.RIGHT_HEAD_BLUE);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.rightHeadBlue = t;
	}
	// left tail led
	if(handler.e(Zerone.LEFT_TAIL_RED)) {
		t = handler.read(Zerone.LEFT_TAIL_RED);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.leftTailRed = t;
	}
	if(handler.e(Zerone.LEFT_TAIL_GREEN)) {
		t = handler.read(Zerone.LEFT_TAIL_GREEN);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.leftTailGreen = t;
	}
	if(handler.e(Zerone.LEFT_TAIL_BLUE)) {
		t = handler.read(Zerone.LEFT_TAIL_BLUE);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.leftTailBlue = t;
	}
	// right tail led
	if(handler.e(Zerone.RIGHT_TAIL_RED)) {
		t = handler.read(Zerone.RIGHT_TAIL_RED);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.rightTailRed = t;
	}
	if(handler.e(Zerone.RIGHT_TAIL_GREEN)) {
		t = handler.read(Zerone.RIGHT_TAIL_GREEN);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.rightTailGreen = t;
	}
	if(handler.e(Zerone.RIGHT_TAIL_BLUE)) {
		t = handler.read(Zerone.RIGHT_TAIL_BLUE);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.rightTailBlue = t;
	}
	// buzzer
	if(handler.e(Zerone.BUZZER)) {
		t = handler.read(Zerone.BUZZER);
		if(t < 0) t = 0;
		else if(t > 6500) t = 6500;
		motoring.buzzer = t;
	}
	// pulse
	if(handler.e(Zerone.PULSE_ID)) {
		t = handler.read(Zerone.PULSE_ID);
		if(t != motoring.pulseId) {
			motoring.pulseId = t;
			if(handler.e(Zerone.PULSE)) {
				t = handler.read(Zerone.PULSE);
				if(t < 0) t = 0;
				else if(t > 65535) t = 65535;
				motoring.pulse = t;
				this.wheel.written = true;
			}
		}
	}
	// note
	if(handler.e(Zerone.NOTE)) {
		t = handler.read(Zerone.NOTE);
		if(t < 0) t = 0;
		else if(t > 88) t = 88;
		motoring.note = t;
	}
	// sound
	if(handler.e(Zerone.SOUND_ID)) {
		t = handler.read(Zerone.SOUND_ID);
		if(t != motoring.soundId) {
			motoring.soundId = t;
			if(handler.e(Zerone.SOUND) && handler.e(Zerone.SOUND_REPEAT)) {
				t = handler.read(Zerone.SOUND);
				if(t < 0) t = 0;
				else if(t > 127) t = 127;
				var t2 = handler.read(Zerone.SOUND_REPEAT);
				this.runSound(t, t2);
			}
		}
	}
	// motion
	if(handler.e(Zerone.MOTION_ID)) {
		t = handler.read(Zerone.MOTION_ID);
		if(t != motoring.motionId) {
			motoring.motionId = t;
			if(handler.e(Zerone.MOTION_UNIT)) {
				t = handler.read(Zerone.MOTION_UNIT);
				if(t < 0) t = 0;
				else if(t > 3) t = 3;
				motoring.motionUnit = t;
			}
			if(handler.e(Zerone.MOTION_SPEED)) {
				t = handler.read(Zerone.MOTION_SPEED);
				if(t < 0) t = 0;
				else if(t > 100) t = 100;
				motoring.motionSpeed = t;
			}
			if(handler.e(Zerone.MOTION_VALUE)) {
				t = handler.read(Zerone.MOTION_VALUE);
				if(t < 0) t = 0;
				else if(t > 2147483647) t = 2147483647;
				motoring.motionValue = t;
			}
			if(handler.e(Zerone.MOTION_RADIUS)) {
				t = handler.read(Zerone.MOTION_RADIUS);
				if(t < 0) t = 0;
				else if(t > 2147483647) t = 2147483647;
				motoring.motionRadius = t;
			}
			if(handler.e(Zerone.MOTION_TYPE)) {
				t = handler.read(Zerone.MOTION_TYPE);
				if(t < 0) t = 0;
				else if(t > 8) t = 8;
				motoring.motionType = t;
				this.motion.written = true;
			}
		}
	}
	// sensor mode
	if(handler.e(Zerone.SENSOR_MODE)) {
		t = handler.read(Zerone.SENSOR_MODE);
		if(t < 0) t = 0;
		else if(t > 1) t = 1;
		motoring.sensorMode = t;
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
		if(motion.type < 0 || motion.type > 8) {
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
					switch(motion.type) {
						case 1: // MOTION_MOVE_FORWARD
						case 2: // MOTION_MOVE_BACKWARD
							wheel.pulse = Math.round(value * Zerone.CM_TO_PULSE);
							break;
						case 3: // MOTION_TURN_LEFT
						case 4: // MOTION_TURN_RIGHT
							wheel.pulse = Math.round(value * Zerone.DEG_TO_PULSE);
							break;
						case 5: // MOTION_PIVOT_LEFT_FORWARD
						case 6: // MOTION_PIVOT_LEFT_BACKWARD
						case 7: // MOTION_PIVOT_RIGHT_FORWARD
						case 8: // MOTION_PIVOT_RIGHT_BACKWARD
							wheel.pulse = Math.round(value * Zerone.DEG_TO_PULSE * 2);
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
	if(speed == 0) speed = Zerone.DEFAULT_SPEED;
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
	}
	
	var str = '1';
	if(motoring.sensorMode == 1) str += '1';
	else str += '0';
	str += self.toHex(leftWheel);
	str += self.toHex(rightWheel);
	
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
	
	str += self.toHex(motoring.leftHeadRed);
	str += self.toHex(motoring.leftHeadGreen);
	str += self.toHex(motoring.leftHeadBlue);
	str += self.toHex(motoring.rightHeadRed);
	str += self.toHex(motoring.rightHeadGreen);
	str += self.toHex(motoring.rightHeadBlue);
	str += self.toHex(motoring.leftTailRed);
	str += self.toHex(motoring.leftTailGreen);
	str += self.toHex(motoring.leftTailBlue);
	str += self.toHex(motoring.rightTailRed);
	str += self.toHex(motoring.rightTailGreen);
	str += self.toHex(motoring.rightTailBlue);
	
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
		case 5: sndid = 0x14; break;
		case 8: sndid = 0x15; break;
		case 9: sndid = 0x17; break;
		case 12: sndid = 0x18; break;
		case 13: sndid = 0x19; break;
		case 14: sndid = 0x1a; break;
		case 15: sndid = 0x1b; break;
		case 6: sndid = 0x1c; break;
		case 7: sndid = 0x1d; break;
	}
	if(sound.written) {
		sound.written = false;
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
		var tmp = parseInt(motoring.buzzer * 10) + 512;
		str += self.toHex2(tmp);
	}
	str += '-';
	str += self.address;
	str += '\r';
	return str;
};

Module.prototype.reset = function() {
	this.cancelTimeout();
	var motoring = this.motoring;
	motoring.leftWheel = 0;
	motoring.rightWheel = 0;
	motoring.leftHeadRed = 0;
	motoring.leftHeadGreen = 0;
	motoring.leftHeadBlue = 0;
	motoring.rightHeadRed = 0;
	motoring.rightHeadGreen = 0;
	motoring.rightHeadBlue = 0;
	motoring.leftTailRed = 0;
	motoring.leftTailGreen = 0;
	motoring.leftTailBlue = 0;
	motoring.rightTailRed = 0;
	motoring.rightTailGreen = 0;
	motoring.rightTailBlue = 0;
	motoring.buzzer = 0;
	motoring.pulse = 0;
	motoring.pulseId = 0;
	motoring.note = 0;
	motoring.sound = 0;
	motoring.soundRepeat = 1;
	motoring.soundId = 0;
	motoring.motionId = 0;
	motoring.motionType = 0;
	motoring.motionUnit = 0;
	motoring.motionSpeed = 0;
	motoring.motionValue = 0;
	motoring.motionRadius = 0;
	motoring.sensorMode = 0;

	var sensory = this.sensory;
	sensory.gesture = -1;
	sensory.gestureId = 0;
	sensory.colorNumber = -1;
	sensory.pulseCount = 0;
	sensory.wheelState = -1;
	sensory.wheelStateId = 0;
	sensory.soundState = -1;
	sensory.soundStateId = 0;
	sensory.batteryState = 2;

	var motion = this.motion;
	motion.written = false;
	motion.type = 0;
	motion.speed = 0;

	var wheel = this.wheel;
	wheel.written = false;
	wheel.pulse = 0;
	wheel.pulsePrev = -1;
	wheel.event = 0;
	wheel.stateId = -1;

	var sound = this.sound;
	sound.written = false;
	sound.event = 0;
	sound.stateId = -1;

	var event = this.event;
	event.gestureId = -1;
	event.colorNumberId = -1;
	event.pulseCount = -1;
	event.batteryState = -1;
	event.touchId = -1;
};

module.exports = new Module();