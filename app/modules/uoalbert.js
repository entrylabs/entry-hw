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
		light: 0,
		temperature: 0,
		touch: 0,
		oid: -1,
		pulseCount: 0,
		wheelState: -1,
		wheelStateId: 0,
		soundState: -1,
		soundStateId: 0,
		batteryState: 2,
		tilt: 0,
		clicked: 0,
		clickedId: 0,
		longPressed: 0,
		longPressedId: 0,
		longLongPressed: 0,
		longLongPressedId: 0
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
		pulse: 0,
		pulseId: 0,
		note: 0,
		sound: 0,
		soundRepeat: 1,
		soundId: 0,
		boardWidth: 0,
		boardHeight: 0,
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
	this.event = {
		touch: -1,
		oid: -2,
		pulseCount: -1,
		batteryState: -1,
		tilt: -4,
		clicked: false,
		longPressed: false,
		longLongPressed: false
	};
	this.touchChecker = {
		down: false,
		clicked: false,
		longPressed: false,
		longLongPressed: false,
		checkLongPressed: false,
		checkLongLongPressed: false,
		pressedTime: 0,
		reset: function() {
			this.down = false;
			this.clicked = false;
			this.longPressed = false;
			this.longLongPressed = false;
			this.checkLongPressed = false;
			this.checkLongLongPressed = false;
			this.pressedTime = 0;
		}
	};
	this.timerId = undefined;
}

var UoAlbert = {
	LEFT_WHEEL: 'leftWheel',
	RIGHT_WHEEL: 'rightWheel',
	LEFT_RED: 'leftRed',
	LEFT_GREEN: 'leftGreen',
	LEFT_BLUE: 'leftBlue',
	RIGHT_RED: 'rightRed',
	RIGHT_GREEN: 'rightGreen',
	RIGHT_BLUE: 'rightBlue',
	BUZZER: 'buzzer',
	PULSE: 'pulse',
	PULSE_ID: 'pulseId',
	NOTE: 'note',
	SOUND: 'sound',
	SOUND_REPEAT: 'soundRepeat',
	SOUND_ID: 'soundId',
	BOARD_WIDTH: 'boardWidth',
	BOARD_HEIGHT: 'boardHeight',
	MOTION_ID: 'motionId',
	MOTION_TYPE: 'motionType',
	MOTION_UNIT: 'motionUnit',
	MOTION_SPEED: 'motionSpeed',
	MOTION_VALUE: 'motionValue',
	MOTION_RADIUS: 'motionRadius',
	CM_TO_PULSE: 82.6,
	DEG_TO_PULSE: 1922,
	DEFAULT_SPEED: 50
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
	if(data.slice(0, 2) == 'FF') {
		var info = data.split(/[,\n]+/);
		if(info && info.length >= 5) {
			if(info[1] == 'UO Albert' && info[2] == '07' && info[4].length >= 12) {
				config.id = '0207' + info[3];
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

Module.prototype.checkTouch = function(touch, touched) {
	if(touch.down) {
		if(touched) {
			touch.clicked = false;
			if(touch.checkLongPressed) {
				if(Date.now() - touch.pressedTime > 1500) {
					touch.checkLongPressed = false;
					touch.longPressed = true;
				}
			}
			if(touch.checkLongLongPressed) {
				if(Date.now() - touch.pressedTime > 3000) {
					touch.checkLongLongPressed = false;
					touch.longLongPressed = true;
				}
			}
		} else { // down -> up
			if(Date.now() - touch.pressedTime < 750) {
				touch.clicked = true;
			}
			touch.longPressed = false;
			touch.longLongPressed = false;
			touch.checkLongPressed = false;
			touch.checkLongLongPressed = false;
		}
	} else {
		touch.clicked = false;
		touch.longPressed = false;
		touch.longLongPressed = false;
		if(touched) { // up -> down
			touch.checkLongPressed = true;
			touch.checkLongLongPressed = true;
			touch.pressedTime = Date.now();
		} else {
			touch.checkLongPressed = false;
			touch.checkLongLongPressed = false;
		}
	}
	touch.down = touched;
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
	
	var str = data.slice(0, 1);
	var value = parseInt(str, 16);
	if(value != 1) return; // invalid data

	var sensory = this.sensory;
	var event = this.event;
	
	// signal strength
	str = data.slice(32, 34);
	value = parseInt(str, 16);
	value -= 0x100;
	sensory.signalStrength = value;
	// left proximity
	str = data.slice(2, 4);
	value = parseInt(str, 16);
	sensory.leftProximity = value;
	// right proximity
	str = data.slice(4, 6);
	value = parseInt(str, 16);
	sensory.rightProximity = value;
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
	str = data.slice(16, 18);
	var accX = parseInt(str, 16);
	if(accX > 0x7f) accX -= 0x100;
	accX <<= 6;
	acc.sumx += accX;
	acc.x[acc.index] = accX;
	// acceleration y
	str = data.slice(18, 20);
	var accY = parseInt(str, 16);
	if(accY > 0x7f) accY -= 0x100;
	accY <<= 6;
	acc.sumy += accY;
	acc.y[acc.index] = accY;
	// acceleration z
	str = data.slice(20, 22);
	var accZ = parseInt(str, 16);
	if(accZ > 0x7f) accZ -= 0x100;
	accZ <<= 6;
	acc.sumz += accZ;
	acc.z[acc.index] = accZ;
	++ acc.index;
	sensory.accelerationX = Math.round(acc.sumx / acc.count);
	sensory.accelerationY = Math.round(acc.sumy / acc.count);
	sensory.accelerationZ = Math.round(acc.sumz / acc.count);
	// tilt
	if(accZ < 2048 && accX > 2048 && accY > -1024 && accY < 1024) value = 1;
	else if(accZ < 2048 && accX < -2048 && accY > -1024 && accY < 1024) value = -1;
	else if(accZ < 2048 && accY > 2048 && accX > -1024 && accX < 1024) value = 2;
	else if(accZ < 2048 && accY < -2048 && accX > -1024 && accX < 1024) value = -2;
	else if(accZ > 3072 && accX > -2048 && accX < 2048 && accY > -2048 && accY < 2048) value = 3;
	else if(accZ < -3072 && accX > -1024 && accX < 1024 && accY > -1024 && accY < 1024) value = -3;
	else value = 0;
	sensory.tilt = value;
	// light
	str = data.slice(6, 10);
	value = parseInt(str, 16);
	sensory.light = value;
	// temperature
	str = data.slice(30, 32);
	value = parseInt(str, 16);
	if(value > 0x7f) value -= 0x100;
	value = value / 2.0 + 24;
	sensory.temperature = parseInt(value);
	// battery
	str = data.slice(34, 36);
	value = parseInt(str, 16);
	value = (value + 200) / 100.0;
	var state = 2;
	if(value <= 3.5) state = 0;
	else if(value <= 3.55) state = 1;
	sensory.batteryState = state;
	// touch
	str = data.slice(10, 12);
	sensory.touch = parseInt(str, 16);
	this.checkTouch(this.touchChecker, sensory.touch);
	value = this.touchChecker.clicked;
	if(value != event.clicked) {
		if(value) {
			sensory.clicked = 1;
			sensory.clickedId = (sensory.clickedId % 255) + 1;
		}
		event.clicked = value;
	}
	value = this.touchChecker.longPressed;
	if(value != event.longPressed) {
		if(value) {
			sensory.longPressed = 1;
			sensory.longPressedId = (sensory.longPressedId % 255) + 1;
		}
		event.longPressed = value;
	}
	value = this.touchChecker.longLongPressed;
	if(value != event.longLongPressed) {
		if(value) {
			sensory.longLongPressed = 1;
			sensory.longLongPressedId = (sensory.longLongPressedId % 255) + 1;
		}
		event.longLongPressed = value;
	}
	// oid
	str = data.slice(24, 26);
	var low = parseInt(str, 16);
	str = data.slice(26, 28);
	var mid = parseInt(str, 16);
	str = data.slice(28, 30);
	var high = parseInt(str, 16);
	var v1 = this.calculateOid(low, mid, high);
	if(v1 == -2) {
		if(event.oid == -2) v1 = -1;
		else v1 = event.oid;
	} else {
		if(v1 != event.oid) {
			sensory.oid = v1;
			event.oid = v1;
		}
	}
	// pulse count
	str = data.slice(12, 16);
	sensory.pulseCount = parseInt(str, 16);
	// wheel state
	str = data.slice(22, 24);
	value = parseInt(str, 16);
	var wheel = this.wheel;
	if(wheel.event == 1) {
		if(value == 1) {
			wheel.event = 2;
		}
	}
	if(wheel.event == 2) {
		if(value != wheel.state) {// || wheel.count > 5) {
			wheel.state = value;
			sensory.wheelState = value;
			sensory.wheelStateId = (sensory.wheelStateId % 255) + 1;
			if(value == 0) {
				wheel.event = 0;
				wheel.count = 0;
				this.motion.type = 0;
			}
		}
	}
	if(wheel.event == -1) {
		wheel.state = value;
		sensory.wheelState = 0;
		sensory.wheelStateId = (sensory.wheelStateId % 255) + 1;
		wheel.event = 0;
		wheel.count = 0;
		this.motion.type = 0;
	}
	// sound state
	str = data.slice(36, 38);
	value = parseInt(str, 16);
	var sound = this.sound;
	if(sound.event == 1) {
		if(value != 0) {
			sound.event = 2;
		}
	}
	var motoring = this.motoring;
	if(sound.event == 2) {
		if(value != sound.state) {// || sound.count > 5) {
			sound.state = value;
			sensory.soundState = value;
			if(value == 0) {
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
						sensory.soundState = value;
						sensory.soundStateId = (sensory.soundStateId % 255) + 1;
					}
				} else {
					motoring.sound = 0;
					motoring.soundRepeat = 1;
					sensory.soundState = value;
					sensory.soundStateId = (sensory.soundStateId % 255) + 1;
				}
			} else if(value != sensory.soundState) {
				sensory.soundState = value;
				sensory.soundStateId = (sensory.soundStateId % 255) + 1;
			}
		}
	}
	if(motoring.boardWidth > 0 && motoring.boardHeight > 0) {
		if(v1 > 0 && v1 <= 40000) {
			var x = (v1 - 1) % motoring.boardWidth; // x
			var y = motoring.boardHeight - parseInt((v1 - 1) / motoring.boardWidth) - 1; // y
			if(x >= 0 && x < motoring.boardWidth) sensory.positionX = x;
			if(y >= 0 && y < motoring.boardHeight) sensory.positionY = y;
		}
	}
};

Module.prototype.requestRemoteData = function(handler) {
	var sensory = this.sensory;
	for(var key in sensory) {
		handler.write(key, sensory[key]);
	}
	sensory.wheelState = -1;
	sensory.soundState = -1;
	sensory.clicked = 0;
	sensory.longPressed = 0;
	sensory.longLongPressed =0;
};

Module.prototype.handleRemoteData = function(handler) {
	var motoring = this.motoring;
	var t;
	// left wheel
	if(handler.e(UoAlbert.LEFT_WHEEL)) {
		t = handler.read(UoAlbert.LEFT_WHEEL);
		if(t < -100) t = -100;
		else if(t > 100) t = 100;
		motoring.leftWheel = t;
	}
	// right wheel
	if(handler.e(UoAlbert.RIGHT_WHEEL)) {
		t = handler.read(UoAlbert.RIGHT_WHEEL);
		if(t < -100) t = -100;
		else if(t > 100) t = 100;
		motoring.rightWheel = t;
	}
	// left eye
	if(handler.e(UoAlbert.LEFT_RED)) {
		t = handler.read(UoAlbert.LEFT_RED);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.leftRed = t;
	}
	if(handler.e(UoAlbert.LEFT_GREEN)) {
		t = handler.read(UoAlbert.LEFT_GREEN);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.leftGreen = t;
	}
	if(handler.e(UoAlbert.LEFT_BLUE)) {
		t = handler.read(UoAlbert.LEFT_BLUE);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.leftBlue = t;
	}
	// right eye
	if(handler.e(UoAlbert.RIGHT_RED)) {
		t = handler.read(UoAlbert.RIGHT_RED);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.rightRed = t;
	}
	if(handler.e(UoAlbert.RIGHT_GREEN)) {
		t = handler.read(UoAlbert.RIGHT_GREEN);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.rightGreen = t;
	}
	if(handler.e(UoAlbert.RIGHT_BLUE)) {
		t = handler.read(UoAlbert.RIGHT_BLUE);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.rightBlue = t;
	}
	// buzzer
	if(handler.e(UoAlbert.BUZZER)) {
		t = handler.read(UoAlbert.BUZZER);
		if(t < 0) t = 0;
		else if(t > 167772.15) t = 167772.15;
		motoring.buzzer = t;
	}
	// pulse
	if(handler.e(UoAlbert.PULSE_ID)) {
		t = handler.read(UoAlbert.PULSE_ID);
		if(t != motoring.pulseId) {
			motoring.pulseId = t;
			if(handler.e(UoAlbert.PULSE)) {
				t = handler.read(UoAlbert.PULSE);
				if(t < 0) t = 0;
				else if(t > 65535) t = 65535;
				motoring.pulse = t;
				this.wheel.written = true;
			}
		}
	}
	// note
	if(handler.e(UoAlbert.NOTE)) {
		t = handler.read(UoAlbert.NOTE);
		if(t < 0) t = 0;
		else if(t > 88) t = 88;
		motoring.note = t;
	}
	// sound
	if(handler.e(UoAlbert.SOUND_ID)) {
		t = handler.read(UoAlbert.SOUND_ID);
		if(t != motoring.soundId) {
			motoring.soundId = t;
			if(handler.e(UoAlbert.SOUND) && handler.e(UoAlbert.SOUND_REPEAT)) {
				t = handler.read(UoAlbert.SOUND);
				if(t < 0) t = 0;
				else if(t > 127) t = 127;
				var t2 = handler.read(UoAlbert.SOUND_REPEAT);
				this.runSound(t, t2);
			}
		}
	}
	// board width
	if(handler.e(UoAlbert.BOARD_WIDTH)) {
		t = handler.read(UoAlbert.BOARD_WIDTH);
		if(t < 0) t = 0;
		else if(t > 40000) t = 40000;
		motoring.boardWidth = t;
	}
	// board height
	if(handler.e(UoAlbert.BOARD_HEIGHT)) {
		t = handler.read(UoAlbert.BOARD_HEIGHT);
		if(t < 0) t = 0;
		else if(t > 40000) t = 40000;
		motoring.boardHeight = t;
	}
	// motion
	if(handler.e(UoAlbert.MOTION_ID)) {
		t = handler.read(UoAlbert.MOTION_ID);
		if(t != motoring.motionId) {
			motoring.motionId = t;
			if(handler.e(UoAlbert.MOTION_UNIT)) {
				t = handler.read(UoAlbert.MOTION_UNIT);
				if(t < 0) t = 0;
				else if(t > 3) t = 3;
				motoring.motionUnit = t;
			}
			if(handler.e(UoAlbert.MOTION_SPEED)) {
				t = handler.read(UoAlbert.MOTION_SPEED);
				if(t < 0) t = 0;
				else if(t > 100) t = 100;
				motoring.motionSpeed = t;
			}
			if(handler.e(UoAlbert.MOTION_VALUE)) {
				t = handler.read(UoAlbert.MOTION_VALUE);
				if(t < 0) t = 0;
				else if(t > 2147483647) t = 2147483647;
				motoring.motionValue = t;
			}
			if(handler.e(UoAlbert.MOTION_RADIUS)) {
				t = handler.read(UoAlbert.MOTION_RADIUS);
				if(t < 0) t = 0;
				else if(t > 2147483647) t = 2147483647;
				motoring.motionRadius = t;
			}
			if(handler.e(UoAlbert.MOTION_TYPE)) {
				t = handler.read(UoAlbert.MOTION_TYPE);
				if(t < 0) t = 0;
				else if(t > 8) t = 8;
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
		if(motion.type < 0 || motion.type > 8) { // MOTION_PIVOT_RIGHT_BACKWARD
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
					switch(motion.type) {
						case 1: // MOTION_MOVE_FORWARD
						case 2: // MOTION_MOVE_BACKWARD
							wheel.pulse = Math.round(value * UoAlbert.CM_TO_PULSE);
							break;
						case 3: // MOTION_TURN_LEFT
						case 4: // MOTION_TURN_RIGHT
							wheel.pulse = Math.round(value * UoAlbert.DEG_TO_PULSE / 360.0);
							break;
						case 5: // MOTION_PIVOT_LEFT_FORWARD
						case 6: // MOTION_PIVOT_LEFT_BACKWARD
						case 7: // MOTION_PIVOT_RIGHT_FORWARD
						case 8: // MOTION_PIVOT_RIGHT_BACKWARD
							wheel.pulse = Math.round(value * 2 * UoAlbert.DEG_TO_PULSE / 360.0);
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
	if(speed == 0) speed = UoAlbert.DEFAULT_SPEED;
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
	
	var str = '10';
	if(leftWheel < 0) str += self.toHex2(leftWheel * 8.26 - 0.5);
	else str += self.toHex2(leftWheel * 8.26 + 0.5);
	if(rightWheel < 0) str += self.toHex2(rightWheel * 8.26 - 0.5);
	else str += self.toHex2(rightWheel * 8.26 + 0.5);
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
	str += self.toHex(0x02);
	str += self.toHex(motoring.leftRed);
	str += self.toHex(motoring.leftGreen);
	str += self.toHex(motoring.leftBlue);
	str += self.toHex(motoring.rightRed);
	str += self.toHex(motoring.rightGreen);
	str += self.toHex(motoring.rightBlue);
	str += self.toHex(motoring.note);
	var sound = self.sound;
	var tmp = 0;
	switch(motoring.sound) {
		case 0: tmp = 0x00; break;
		case 1: tmp = 0x01; break;
		case 2: tmp = 0x10; break;
		case 3: tmp = 0x20; break;
		case 4: tmp = 0x30; break;
		case 5: tmp = 0x40; break;
		case 6: tmp = 0x41; break;
		case 7: tmp = 0x42; break;
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
	str += self.toHex3(motoring.buzzer * 100);
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
	motoring.leftRed = 0;
	motoring.leftGreen = 0;
	motoring.leftBlue = 0;
	motoring.rightRed = 0;
	motoring.rightGreen = 0;
	motoring.rightBlue = 0;
	motoring.buzzer = 0;
	motoring.pulse = 0;
	motoring.pulseId = 0;
	motoring.note = 0;
	motoring.sound = 0;
	motoring.soundRepeat = 1;
	motoring.soundId = 0;
	motoring.boardWidth = 0;
	motoring.boardHeight = 0;
	motoring.motionId = 0;
	motoring.motionType = 0;
	motoring.motionUnit = 0;
	motoring.motionSpeed = 0;
	motoring.motionValue = 0;
	motoring.motionRadius = 0;

	var sensory = this.sensory;
	sensory.touch = 0;
	sensory.oid = -1;
	sensory.pulseCount = 0;
	sensory.wheelState = -1;
	sensory.wheelStateId = 0;
	sensory.soundState = -1;
	sensory.soundStateId = 0;
	sensory.batteryState = 2;
	sensory.tilt = 0;
	sensory.clicked = 0;
	sensory.clickedId = 0;
	sensory.longPressed = 0;
	sensory.longPressedId = 0;
	sensory.longLongPressed = 0;
	sensory.longLongPressedId = 0;
	
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
	
	var event = this.event;
	event.touch = 0;
	event.oid = -1;
	event.pulseCount = 0;
	event.batteryState = 2;
	event.tilt = 0;
	event.clicked = false;
	event.longPressed = false;
	event.longLongPressed = false;
	
	this.touchChecker.reset();
};

module.exports = new Module();
