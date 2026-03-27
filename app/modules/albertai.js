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
		micTouch: 0,
		volumeUpTouch: 0,
		volumeDownTouch: 0,
		playTouch: 0,
		backTouch: 0,
		micClicked: 0,
		micClickedId: 0,
		volumeUpClicked: 0,
		volumeUpClickedId: 0,
		volumeDownClicked: 0,
		volumeDownClickedId: 0,
		playClicked: 0,
		playClickedId: 0,
		backClicked: 0,
		backClickedId: 0,
		micLongPressed: 0,
		micLongPressedId: 0,
		volumeUpLongPressed: 0,
		volumeUpLongPressedId: 0,
		volumeDownLongPressed: 0,
		volumeDownLongPressedId: 0,
		playLongPressed: 0,
		playLongPressedId: 0,
		backLongPressed: 0,
		backLongPressedId: 0,
		micLongLongPressed: 0,
		micLongLongPressedId: 0,
		volumeUpLongLongPressed: 0,
		volumeUpLongLongPressedId: 0,
		volumeDownLongLongPressed: 0,
		volumeDownLongLongPressedId: 0,
		playLongLongPressed: 0,
		playLongLongPressedId: 0,
		backLongLongPressed: 0,
		backLongLongPressedId: 0,
		tap: 0,
		tapId: 0,
		oidMode: 0,
		oid: -1,
		lift: 0,
		pulseCount: 0,
		wheelState: -1,
		wheelStateId: 0,
		soundState: -1,
		soundStateId: 0,
		batteryState: 2,
		tilt: 0
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
	this.event = {
		micTouch: -1,
		volumeUpTouch: -1,
		volumeDownTouch: -1,
		playTouch: -1,
		backTouch: -1,
		micClicked: false,
		volumeUpClicked: false,
		volumeDownClicked: false,
		playClicked: false,
		backClicked: false,
		micLongPressed: false,
		volumeUpLongPressed: false,
		volumeDownLongPressed: false,
		playLongPressed: false,
		backLongPressed: false,
		micLongLongPressed: false,
		volumeUpLongLongPressed: false,
		volumeDownLongLongPressed: false,
		playLongLongPressed: false,
		backLongLongPressed: false,
		tapId: -1,
		oidModeId: -1,
		oid: -2,
		lift: -1,
		pulseCount: -1,
		batteryState: -1,
		tilt: -4
	};
	this.touchChecker = {
		mic: { down: false, clicked: false, longPressed: false, longLongPressed: false, checkLongPressed: false, checkLongLongPressed: false, pressedTime: 0 },
		volumeUp: { down: false, clicked: false, longPressed: false, longLongPressed: false, checkLongPressed: false, checkLongLongPressed: false, pressedTime: 0 },
		volumeDown: { down: false, clicked: false, longPressed: false, longLongPressed: false, checkLongPressed: false, checkLongLongPressed: false, pressedTime: 0 },
		play: { down: false, clicked: false, longPressed: false, longLongPressed: false, checkLongPressed: false, checkLongLongPressed: false, pressedTime: 0 },
		back: { down: false, clicked: false, longPressed: false, longLongPressed: false, checkLongPressed: false, checkLongLongPressed: false, pressedTime: 0 },
		__reset: function(checker) {
			checker.down = false;
			checker.clicked = false;
			checker.longPressed = false;
			checker.longLongPressed = false;
			checker.checkLongPressed = false;
			checker.checkLongLongPressed = false;
			checker.pressedTime = 0;
		},
		reset: function() {
			this.__reset(this.mic);
			this.__reset(this.volumeUp);
			this.__reset(this.volumeDown);
			this.__reset(this.play);
			this.__reset(this.back);
		}
	};
	this.timerId = undefined;
}

var AlbertAi = {
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
	CM_TO_PULSE: 41.7,
	DEG_TO_PULSE: 970,
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
			if(info[1] == 'Albert AI' && info[2] == '0A' && info[4].length >= 12) {
				config.id = '020A' + info[3];
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

Module.prototype.handleLocalData = function(data) { // data: string
	if(data.length != 53) return;
	
	var str = data.slice(0, 1);
	var value = parseInt(str, 16);
	if(value != 1) return; // invalid data
	
	var sensory = this.sensory;
	var event = this.event;
	var wheel = this.wheel;
	// tap
	str = data.slice(1, 2);
	value = parseInt(str, 16);
	value = (value >> 2) & 0x01;
	if(value != event.tapId) {
		if(event.tapId != -1 && !wheel.move) {
			sensory.tap = 1;
			sensory.tapId = (sensory.tapId % 255) + 1;
		}
		event.tapId = value;
	}
	// signal strength
	str = data.slice(36, 38);
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
	// battery
	str = data.slice(38, 40);
	value = parseInt(str, 16);
	value = (value + 300) / 100.0;
	var state = 2;
	if(value <= 3.55) state = 0;
	else if(value <= 3.59) state = 1;
	sensory.batteryState = state;
	
	// touch
	str = data.slice(10, 12);
	var tmp = parseInt(str, 16);
	sensory.playTouch = (tmp >> 7) & 0x01;
	sensory.backTouch = (tmp >> 6) & 0x01;
	sensory.micTouch = (tmp >> 2) & 0x01;
	sensory.volumeUpTouch = (tmp >> 1) & 0x01;
	sensory.volumeDownTouch = tmp & 0x01;
	this.checkTouch(this.touchChecker.mic, sensory.micTouch);
	this.checkTouch(this.touchChecker.volumeUp, sensory.volumeUpTouch);
	this.checkTouch(this.touchChecker.volumeDown, sensory.volumeDownTouch);
	this.checkTouch(this.touchChecker.play, sensory.playTouch);
	this.checkTouch(this.touchChecker.back, sensory.backTouch);
	value = this.touchChecker.mic.clicked;
	if(value != event.micClicked) {
		if(value) {
			sensory.micClicked = 1;
			sensory.micClickedId = (sensory.micClickedId % 255) + 1;
		}
		event.micClicked = value;
	}
	value = this.touchChecker.volumeUp.clicked;
	if(value != event.volumeUpClicked) {
		if(value) {
			sensory.volumeUpClicked = 1;
			sensory.volumeUpClickedId = (sensory.volumeUpClickedId % 255) + 1;
		}
		event.volumeUpClicked = value;
	}
	value = this.touchChecker.volumeDown.clicked;
	if(value != event.volumeDownClicked) {
		if(value) {
			sensory.volumeDownClicked = 1;
			sensory.volumeDownClickedId = (sensory.volumeDownClickedId % 255) + 1;
		}
		event.volumeDownClicked = value;
	}
	value = this.touchChecker.play.clicked;
	if(value != event.playClicked) {
		if(value) {
			sensory.playClicked = 1;
			sensory.playClickedId = (sensory.playClickedId % 255) + 1;
		}
		event.playClicked = value;
	}
	value = this.touchChecker.back.clicked;
	if(value != event.backClicked) {
		if(value) {
			sensory.backClicked = 1;
			sensory.backClickedId = (sensory.backClickedId % 255) + 1;
		}
		event.backClicked = value;
	}
	value = this.touchChecker.mic.longPressed;
	if(value != event.micLongPressed) {
		if(value) {
			sensory.micLongPressed = 1;
			sensory.micLongPressedId = (sensory.micLongPressedId % 255) + 1;
		}
		event.micLongPressed = value;
	}
	value = this.touchChecker.volumeUp.longPressed;
	if(value != event.volumeUpLongPressed) {
		if(value) {
			sensory.volumeUpLongPressed = 1;
			sensory.volumeUpLongPressedId = (sensory.volumeUpLongPressedId % 255) + 1;
		}
		event.volumeUpLongPressed = value;
	}
	value = this.touchChecker.volumeDown.longPressed;
	if(value != event.volumeDownLongPressed) {
		if(value) {
			sensory.volumeDownLongPressed = 1;
			sensory.volumeDownLongPressedId = (sensory.volumeDownLongPressedId % 255) + 1;
		}
		event.volumeDownLongPressed = value;
	}
	value = this.touchChecker.play.longPressed;
	if(value != event.playLongPressed) {
		if(value) {
			sensory.playLongPressed = 1;
			sensory.playLongPressedId = (sensory.playLongPressedId % 255) + 1;
		}
		event.playLongPressed = value;
	}
	value = this.touchChecker.back.longPressed;
	if(value != event.backLongPressed) {
		if(value) {
			sensory.backLongPressed = 1;
			sensory.backLongPressedId = (sensory.backLongPressedId % 255) + 1;
		}
		event.backLongPressed = value;
	}
	value = this.touchChecker.mic.longLongPressed;
	if(value != event.micLongLongPressed) {
		if(value) {
			sensory.micLongLongPressed = 1;
			sensory.micLongLongPressedId = (sensory.micLongLongPressedId % 255) + 1;
		}
		event.micLongLongPressed = value;
	}
	value = this.touchChecker.volumeUp.longLongPressed;
	if(value != event.volumeUpLongLongPressed) {
		if(value) {
			sensory.volumeUpLongLongPressed = 1;
			sensory.volumeUpLongLongPressedId = (sensory.volumeUpLongLongPressedId % 255) + 1;
		}
		event.volumeUpLongLongPressed = value;
	}
	value = this.touchChecker.volumeDown.longLongPressed;
	if(value != event.volumeDownLongLongPressed) {
		if(value) {
			sensory.volumeDownLongLongPressed = 1;
			sensory.volumeDownLongLongPressedId = (sensory.volumeDownLongLongPressedId % 255) + 1;
		}
		event.volumeDownLongLongPressed = value;
	}
	value = this.touchChecker.play.longLongPressed;
	if(value != event.playLongLongPressed) {
		if(value) {
			sensory.playLongLongPressed = 1;
			sensory.playLongLongPressedId = (sensory.playLongLongPressedId % 255) + 1;
		}
		event.playLongLongPressed = value;
	}
	value = this.touchChecker.back.longLongPressed;
	if(value != event.backLongLongPressed) {
		if(value) {
			sensory.backLongLongPressed = 1;
			sensory.backLongLongPressedId = (sensory.backLongLongPressedId % 255) + 1;
		}
		event.backLongLongPressed = value;
	}
	// oid mode
	str = data.slice(30, 32);
	value = parseInt(str, 16);
	var id = (value >> 4) & 0x0f;
	var oidMode = value & 0x0f;
	sensory.oidMode = oidMode;
	// oid
	var lift = 0;
	if(oidMode == 0) { // far
		value = -1;
		lift = 1;
		sensory.positionX = -1;
		sensory.positionY = -1;
		sensory.orientation = -200;
	} else if(oidMode == 0x0f) { // no oid
		value = -1;
	} else {
		if(oidMode == 1) { // position mode
			value = -1;
			str = data.slice(22, 26);
			sensory.positionX = parseInt(str, 16);
			str = data.slice(26, 30);
			sensory.positionY = parseInt(str, 16);
		} else { // oid mode
			str = data.slice(22, 24);
			var oidMost = parseInt(str, 16);
			str = data.slice(24, 26);
			var oidHigh = parseInt(str, 16);
			str = data.slice(26, 28);
			var oidMiddle = parseInt(str, 16);
			str = data.slice(28, 30);
			var oidLow = parseInt(str, 16);
			if(oidMode == 2) { // oid version 2
				if(oidMost == 0 && (oidHigh & 0x40) != 0 && (oidHigh & 0x20) == 0) {
					value = ((oidHigh & 0x03) << 16) | ((oidMiddle & 0xff) << 8) | (oidLow & 0xff);
					if(value < 0x010000) {
					} else if(value < 0x03fff0) {
						value = -1;
					} else if(value > 0x03fffb && value < 0x040000) {
						value = -1;
					}
				} else {
					value = -2; // unknown
				}
			} else if(oidMode == 3) { // oid version 3
				if((oidMost & 0xf0) == 0) {
					value = ((oidMost & 0x0f) << 24) | ((oidHigh & 0xff) << 16) | ((oidMiddle & 0xff) << 8) | (oidLow & 0xff);
				} else {
					value = -2; // unknown
				}
			} else {
				value = -2; // unknown
			}
			if(value == -2) {
				if(event.oid == -2) {
					value = -1;
				} else {
					value = event.oid;
				}
			}
			sensory.positionX = -1;
			sensory.positionY = -1;
		}
		str = data.slice(32, 36);
		sensory.orientation = parseInt(str, 16);
		if(sensory.orientation > 180) sensory.orientation -= 360;
	}
	sensory.oid = value;
	
	// lift
	sensory.lift = lift;
	
	// pulse count
	str = data.slice(12, 16);
	sensory.pulseCount = parseInt(str, 16);
	// wheel state
	value = (tmp >> 4) & 0x03;
	if(wheel.event == 1) {
		if(value == 3) {
			wheel.event = 2;
		}
	}
	if(wheel.event == 2) {
		if(value != wheel.state) {
			wheel.state = value;
			sensory.wheelState = value;
			sensory.wheelStateId = (sensory.wheelStateId % 255) + 1;
			if(value == 2) {
				wheel.event = 0;
				wheel.count = 0;
				this.motion.type = 0;
			}
		}
	}
	if(wheel.event == -1) {
		wheel.state = value;
		sensory.wheelState = 2;
		sensory.wheelStateId = (sensory.wheelStateId % 255) + 1;
		wheel.event = 0;
		wheel.count = 0;
		this.motion.type = 0;
	}
	// sound state
	value = (tmp >> 3) & 0x01;
	var sound = this.sound;
	if(sound.event == 1) {
		if(value != 0) {
			sound.event = 2;
		}
	}
	if(sound.event == 2) {
		if(value != sound.state) {
			sound.state = value;
			sensory.soundState = value;
			if(value == 0) {
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
};

Module.prototype.requestRemoteData = function(handler) {
	var sensory = this.sensory;
	for(var key in sensory) {
		handler.write(key, sensory[key]);
	}
	sensory.micClicked = 0;
	sensory.volumeUpClicked = 0;
	sensory.volumeDownClicked = 0;
	sensory.playClicked = 0;
	sensory.backClicked = 0;
	sensory.micLongPressed = 0;
	sensory.volumeUpLongPressed = 0;
	sensory.volumeDownLongPressed = 0;
	sensory.playLongPressed =0;
	sensory.backLongPressed = 0;
	sensory.micLongLongPressed =0;
	sensory.volumeUpLongLongPressed = 0;
	sensory.volumeDownLongLongPressed = 0;
	sensory.playLongLongPressed = 0;
	sensory.backLongLongPressed = 0;
	sensory.tap = 0;
	sensory.wheelState = -1;
	sensory.soundState = -1;
};

Module.prototype.handleRemoteData = function(handler) {
	var motoring = this.motoring;
	var t;
	// left wheel
	if(handler.e(AlbertAi.LEFT_WHEEL)) {
		t = handler.read(AlbertAi.LEFT_WHEEL);
		if(t < -100) t = -100;
		else if(t > 100) t = 100;
		motoring.leftWheel = t;
	}
	// right wheel
	if(handler.e(AlbertAi.RIGHT_WHEEL)) {
		t = handler.read(AlbertAi.RIGHT_WHEEL);
		if(t < -100) t = -100;
		else if(t > 100) t = 100;
		motoring.rightWheel = t;
	}
	// left eye
	if(handler.e(AlbertAi.LEFT_RED)) {
		t = handler.read(AlbertAi.LEFT_RED);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.leftRed = t;
	}
	if(handler.e(AlbertAi.LEFT_GREEN)) {
		t = handler.read(AlbertAi.LEFT_GREEN);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.leftGreen = t;
	}
	if(handler.e(AlbertAi.LEFT_BLUE)) {
		t = handler.read(AlbertAi.LEFT_BLUE);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.leftBlue = t;
	}
	// right eye
	if(handler.e(AlbertAi.RIGHT_RED)) {
		t = handler.read(AlbertAi.RIGHT_RED);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.rightRed = t;
	}
	if(handler.e(AlbertAi.RIGHT_GREEN)) {
		t = handler.read(AlbertAi.RIGHT_GREEN);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.rightGreen = t;
	}
	if(handler.e(AlbertAi.RIGHT_BLUE)) {
		t = handler.read(AlbertAi.RIGHT_BLUE);
		if(t < 0) t = 0;
		else if(t > 255) t = 255;
		motoring.rightBlue = t;
	}
	// buzzer
	if(handler.e(AlbertAi.BUZZER)) {
		t = handler.read(AlbertAi.BUZZER);
		if(t < 0) t = 0;
		else if(t > 6553.5) t = 6553.5;
		motoring.buzzer = t;
	}
	// pulse
	if(handler.e(AlbertAi.PULSE_ID)) {
		t = handler.read(AlbertAi.PULSE_ID);
		if(t != motoring.pulseId) {
			motoring.pulseId = t;
			if(handler.e(AlbertAi.PULSE)) {
				t = handler.read(AlbertAi.PULSE);
				if(t < 0) t = 0;
				else if(t > 65535) t = 65535;
				motoring.pulse = t;
				this.wheel.written = true;
			}
		}
	}
	// note
	if(handler.e(AlbertAi.NOTE)) {
		t = handler.read(AlbertAi.NOTE);
		if(t < 0) t = 0;
		else if(t > 88) t = 88;
		motoring.note = t;
	}
	// sound
	if(handler.e(AlbertAi.SOUND_ID)) {
		t = handler.read(AlbertAi.SOUND_ID);
		if(t != motoring.soundId) {
			motoring.soundId = t;
			if(handler.e(AlbertAi.SOUND) && handler.e(AlbertAi.SOUND_REPEAT)) {
				t = handler.read(AlbertAi.SOUND);
				if(t < 0) t = 0;
				else if(t > 127) t = 127;
				var t2 = handler.read(AlbertAi.SOUND_REPEAT);
				this.runSound(t, t2);
			}
		}
	}
	// board width
	if(handler.e(AlbertAi.BOARD_WIDTH)) {
		t = handler.read(AlbertAi.BOARD_WIDTH);
		if(t < 0) t = 0;
		else if(t > 268435455) t = 268435455;
		motoring.boardWidth = t;
	}
	// board height
	if(handler.e(AlbertAi.BOARD_HEIGHT)) {
		t = handler.read(AlbertAi.BOARD_HEIGHT);
		if(t < 0) t = 0;
		else if(t > 268435455) t = 268435455;
		motoring.boardHeight = t;
	}
	// motion
	if(handler.e(AlbertAi.MOTION_ID)) {
		t = handler.read(AlbertAi.MOTION_ID);
		if(t != motoring.motionId) {
			motoring.motionId = t;
			if(handler.e(AlbertAi.MOTION_UNIT)) {
				t = handler.read(AlbertAi.MOTION_UNIT);
				if(t < 0) t = 0;
				else if(t > 3) t = 3;
				motoring.motionUnit = t;
			}
			if(handler.e(AlbertAi.MOTION_SPEED)) {
				t = handler.read(AlbertAi.MOTION_SPEED);
				if(t < 0) t = 0;
				else if(t > 100) t = 100;
				motoring.motionSpeed = t;
			}
			if(handler.e(AlbertAi.MOTION_VALUE)) {
				t = handler.read(AlbertAi.MOTION_VALUE);
				if(t < 0) t = 0;
				else if(t > 2147483647) t = 2147483647;
				motoring.motionValue = t;
			}
			if(handler.e(AlbertAi.MOTION_RADIUS)) {
				t = handler.read(AlbertAi.MOTION_RADIUS);
				if(t < 0) t = 0;
				else if(t > 2147483647) t = 2147483647;
				motoring.motionRadius = t;
			}
			if(handler.e(AlbertAi.MOTION_TYPE)) {
				t = handler.read(AlbertAi.MOTION_TYPE);
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
							wheel.pulse = Math.round(value * AlbertAi.CM_TO_PULSE);
							break;
						case 3: // MOTION_TURN_LEFT
						case 4: // MOTION_TURN_RIGHT
							wheel.pulse = Math.round(value * AlbertAi.DEG_TO_PULSE / 360.0);
							break;
						case 5: // MOTION_PIVOT_LEFT_FORWARD
						case 6: // MOTION_PIVOT_LEFT_BACKWARD
						case 7: // MOTION_PIVOT_RIGHT_FORWARD
						case 8: // MOTION_PIVOT_RIGHT_BACKWARD
							wheel.pulse = Math.round(value * 2 * AlbertAi.DEG_TO_PULSE / 360.0);
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
	if(speed == 0) speed = AlbertAi.DEFAULT_SPEED;
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
	if(leftWheel < 0) leftWheel = parseInt(leftWheel * 1.27 - 0.5);
	else leftWheel = parseInt(leftWheel * 1.27 + 0.5);
	if(leftWheel > 127) leftWheel = 127;
	else if(leftWheel < -127) leftWheel = -127;
	if(rightWheel < 0) rightWheel = parseInt(rightWheel * 1.27 - 0.5);
	else rightWheel = parseInt(rightWheel * 1.27 + 0.5);
	if(rightWheel > 127) rightWheel = 127;
	else if(rightWheel < -127) rightWheel = -127;
	if(leftWheel == 0 && rightWheel == 0) {
		if(wheel.move && ++wheel.moveCount > 5) {
			wheel.move = false;
		}
	} else {
		wheel.move = true;
		wheel.moveCount = 0;
	}
	str += self.toHex(leftWheel);
	str += self.toHex(rightWheel);
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
	str += self.toHex(0);
	str += self.toHex(0);
	str += self.toHex(0);
	str += self.toHex(motoring.leftRed);
	str += self.toHex(motoring.leftGreen);
	str += self.toHex(motoring.leftBlue);
	str += self.toHex(motoring.rightRed);
	str += self.toHex(motoring.rightGreen);
	str += self.toHex(motoring.rightBlue);
	var sound = self.sound;
	var tmp = 0;
	switch(motoring.sound) {
		case 0: tmp = 0x00; break;
		case 1: tmp = 0x01; break;
		case 2: tmp = 0x05; break;
		case 10: tmp = 0x07; break;
		case 3: tmp = 0x10; break;
		case 4: tmp = 0x20; break;
		case 5: tmp = 0x30; break;
	}
	if(sound.written) {
		sound.written = false;
		sound.count = 0;
		if(tmp > 0) {
			sound.flag ^= 0x80;
			sound.event = 1;
		} else {
			sound.flag = 0;
			sound.event = 0;
		}
	}
	tmp |= sound.flag;
	str += self.toHex(tmp);
	str += self.toHex(motoring.note);
	str += self.toHex2(motoring.buzzer * 10);
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
	sensory.micTouch = 0;
	sensory.volumeUpTouch = 0;
	sensory.volumeDownTouch = 0;
	sensory.playTouch = 0;
	sensory.backTouch = 0;
	sensory.micClicked = 0;
	sensory.micClickedId = 0;
	sensory.volumeUpClicked = 0;
	sensory.volumeUpClickedId = 0;
	sensory.volumeDownClicked = 0;
	sensory.volumeDownClickedId = 0;
	sensory.playClicked = 0;
	sensory.playClickedId = 0;
	sensory.backClicked = 0;
	sensory.backClickedId = 0;
	sensory.micLongPressed = 0;
	sensory.micLongPressedId = 0;
	sensory.volumeUpLongPressed = 0;
	sensory.volumeUpLongPressedId = 0;
	sensory.volumeDownLongPressed = 0;
	sensory.volumeDownLongPressedId = 0;
	sensory.playLongPressed = 0;
	sensory.playLongPressedId = 0;
	sensory.backLongPressed = 0;
	sensory.backLongPressedId = 0;
	sensory.micLongLongPressed = 0;
	sensory.micLongLongPressedId = 0;
	sensory.volumeUpLongLongPressed = 0;
	sensory.volumeUpLongLongPressedId = 0;
	sensory.volumeDownLongLongPressed = 0;
	sensory.volumeDownLongLongPressedId = 0;
	sensory.playLongLongPressed = 0;
	sensory.playLongLongPressedId = 0;
	sensory.backLongLongPressed = 0;
	sensory.backLongLongPressedId = 0;
	sensory.tap = 0;
	sensory.tapId = 0;
	sensory.oidMode = 0;
	sensory.oid = -1;
	sensory.lift = 0;
	sensory.pulseCount = 0;
	sensory.wheelState = -1;
	sensory.wheelStateId = 0;
	sensory.soundState = -1;
	sensory.soundStateId = 0;
	sensory.batteryState = 2;
	sensory.tilt = 0;
	
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
	wheel.move = false;
	wheel.moveCount = 0;
	
	var sound = this.sound;
	sound.written = false;
	sound.event = 0;
	sound.state = 0;
	sound.count = 0;
	
	var event = this.event;
	event.micTouch = -1;
	event.volumeUpTouch = -1;
	event.volumeDownTouch = -1;
	event.playTouch = -1;
	event.backTouch = -1;
	event.micClicked = false;
	event.volumeUpClicked = false;
	event.volumeDownClicked = false;
	event.playClicked = false;
	event.backClicked = false;
	event.micLongPressed = false;
	event.volumeUpLongPressed = false;
	event.volumeDownLongPressed = false;
	event.playLongPressed = false;
	event.backLongPressed = false;
	event.micLongLongPressed = false;
	event.volumeUpLongLongPressed = false;
	event.volumeDownLongLongPressed = false;
	event.playLongLongPressed = false;
	event.backLongLongPressed = false;
	event.tapId = -1;
	event.oidModeId = -1;
	event.oid = -2;
	event.lift = -1;
	event.pulseCount = -1;
	event.batteryState = -1;
	event.tilt = -4;
	
	this.touchChecker.reset();
};

module.exports = new Module();
