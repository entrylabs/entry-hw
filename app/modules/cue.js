'use strict';

function Module() {
	this.sp = null;
	this.hw_controller =
	{
		fheader: 255,
		sheader: 85,
		data_size: 0,
		index: 0,
		data: [],
		tail: 10
	};

	this.entry_controller =
	{
		seq: 0,
		category: 0,
		action: 0,
		param_cnt: 0,
		paramA: 0,
		paramB: 0,
		paramC: 0,
		paramD: 0,
		modeA: 0,
		modeB: 0
	};

	this.sendToEntry =
	{
		button0: 0,
		button1: 0,
		button2: 0,
		button3: 0,
		clap: 0,
		sound: 0,
		isPlaying: 0,
		pickup: 0,
		animation: 0,
		isDriving: 0,
		soundDirection: 0,
		barrier_front: 0,
		barrier_left: 0,
		barrier_right: 0,
		barrier_rear: 0
	};

	this.sensorInfo =
	{
		distance_left: 0,
		distance_right: 0,
		distance_rear: 0,
		wheel_left_l: 0,
		wheel_left_h: 0,
		wheel_left_d: 0,
		wheel_right_l: 0,
		wheel_right_h: 0,
		wheel_right_d: 0,
		wheel_distance_avg: 0
	};

	this.isfirst = true;
	this.isBuffering = 0;
	this.serialData_q = [];
}

var CueCmd =
{
	CMD_SEQ: 'seq',
	CMD_CATEGORY: 'category',
	CMD_ACTION: 'action',
	CMD_PARAM_CNT: 'param_cnt',
	CMD_PARAM_A: 'paramA',
	CMD_PARAM_B: 'paramB',
	CMD_PARAM_C: 'paramC',
	CMD_PARAM_D: 'paramD',
	CMD_MODE_A: 'modeA',
	CMD_MODE_B: 'modeB'
};

var sendBuffers = [];
var nowSeq = 0;
var compare_sensor_data = 0;
var sensor_check_cnt = 0;
var wait_action = false;

var barrier_distance_val = 5;

var CueCategoryCmd = { DRIVE: 1, START: 2, LOOK: 3, LIGHT: 4, SOUND: 5, ANIMATION: 6 };
var CueActionCmd_Drive = { FORWARD: 1, BACKWARD: 2, TURN_CW: 3, TURN_CCW: 4, WHEEL: 5, STOP: 6 };
var CueActionCmd_Look = { LEFT: 1, FORWARD: 2, RIGHT: 3, UP: 4, STRAIGHT: 5, DOWN: 6, FORWARD_VOICE: 7 };
var CueActionCmd_Light = { ALL: 1, LEFT_EAR: 2, RIGHT_EAR: 3, FRONT: 4, TAIL: 5, EYE_PATTERN: 6, TOP: 7 };
var CueActionCmd_Sound = { MY_SOUNDS: 1, SAY: 2 };
var CueParamCmd_Sound_Say =
{
	LAUGH: 1, SIGH: 2, WOOHOO: 3, OUCH: 4, SCARED: 5,
	MOVE: 6, START: 7, SUCCESS: 8, CLAP: 9, SENSOR: 10, PICKUP: 11, PUTDOWN: 12, HANDINFRONT: 13, HANDBEHIND: 14, FAIL: 15,
	SONG: 16, GOODBYE: 17, HAPPYBIRTHDAY: 18, HAPPYHOLIDAY: 19,
	CIRCLE: 20, TRIANGLE: 21, SQUARE: 22,
	RED: 23, ORNAGE: 24, YELLOW: 25, GREEN: 26, BLUE: 27,
	ONE: 28, TWO: 29, THREE: 30,
	FRONT: 31, BACK: 32, RIGHT: 33, LEFT: 34
};

Module.prototype.init = function (handler, config) { };

Module.prototype.setSerialPort = function (sp) {
	this.sp = sp;
};

Module.prototype.requestInitialData = function () {
	return null;
};

Module.prototype.checkInitialData = function (data, config) {
	return true;
};

Module.prototype.validateLocalData = function (data) {
	return true;
};

Module.prototype.handleLocalData = function (data) {
	if (data.length > 0) {
		var hw_controller = this.hw_controller;

		if (this.serialData_q == null) this.serialData_q = new Array();

		for (var i = 0; i < data.length; i++) {
			if (this.isfirst && data[i] != hw_controller.fheader) {
				continue;
			}
			else {
				this.isfirst = false;
			}
			this.serialData_q.push(data[i]);
		}

		if (this.serialData_q.shift() == hw_controller.fheader || this.isBuffering > 0) {
			this.isBuffering = 1;
			if (this.serialData_q.length < 1) return;
		}
		else {
			this.isBuffering = 0;
			return;
		}

		if (this.serialData_q.shift() == hw_controller.sheader || this.isBuffering > 1) {
			this.isBuffering = 2;
			if (this.serialData_q.length < 1) return;
		}
		else {
			this.isBuffering = 0;
			return;
		}

		if (this.serialData_q[0] + 2 >= this.serialData_q.length) {
			this.isBuffering = 3;
			return;
		}
		else {
			hw_controller.data_size = this.serialData_q.shift();
		}

		hw_controller.data = [];
		for (var i = 0; i < hw_controller.data_size; i++) {
			hw_controller.data.push(this.serialData_q.shift());
		}

		if (this.serialData_q.shift() == hw_controller.tail) {
			hw_controller.index = hw_controller.data.shift();
			console.log(hw_controller.data);
			if (hw_controller.index == 1) {
				this.sendToEntry.button0 = (hw_controller.data[8] & 0x10);
				this.sendToEntry.button1 = (hw_controller.data[8] & 0x20);
				this.sendToEntry.button2 = (hw_controller.data[8] & 0x40);
				this.sendToEntry.button3 = (hw_controller.data[8] & 0x80);
				this.sendToEntry.clap = (hw_controller.data[11] & 0x1);
				this.sendToEntry.isPlaying = (hw_controller.data[11] & 0x2);
				this.sendToEntry.pickup = (hw_controller.data[11] & 0x4);
				this.sendToEntry.animation = (hw_controller.data[11] & 0x40);
				this.sendToEntry.soundDirection = hw_controller.data[15] == 0x04;

				if (hw_controller.data[7] > 30) {
					this.sendToEntry.sound = 1;
				}
				else {
					this.sendToEntry.sound = 0;
				}

				if (wait_action && this.sendToEntry.soundDirection) {
					var sound_dr = (hw_controller.data[13] << 8) + hw_controller.data[12];
					sound_dr = ((sound_dr > 180) ? sound_dr - 360 : sound_dr) * 100;
					sendBuffers.push([0xff, 0x55, 0x04, 0x00, 0x06, (sound_dr & 0xFF00) >> 8, sound_dr & 0xFF, 0x0a]);
					this.sendSerialData(sendBuffers)
					sendBuffers = []
					wait_action = false;
				}
			}
			else if (hw_controller.index == 2) {
				this.sensorInfo.distance_left = hw_controller.data[7];
				this.sensorInfo.distance_right = hw_controller.data[6];
				this.sensorInfo.distance_rear = hw_controller.data[8];
				this.sensorInfo.wheel_left_l = hw_controller.data[10];
				this.sensorInfo.wheel_left_h = hw_controller.data[11];
				this.sensorInfo.wheel_left_d = (this.sensorInfo.wheel_left_l + (this.sensorInfo.wheel_left_h * 255)) * 7.85 * 3.14 / 1200;
				this.sensorInfo.wheel_right_l = hw_controller.data[14];
				this.sensorInfo.wheel_right_h = hw_controller.data[15];
				this.sensorInfo.wheel_right_d = (this.sensorInfo.wheel_right_l + (this.sensorInfo.wheel_right_h * 255)) * 7.85 * 3.14 / 1200;
				this.sensorInfo.wheel_distance_avg = (this.sensorInfo.wheel_left_d + this.sensorInfo.wheel_right_d) / 2;

				this.sendToEntry.barrier_front = ((this.sensorInfo.distance_left + this.sensorInfo.distance_right) / 2) > barrier_distance_val;
				this.sendToEntry.barrier_left = this.sensorInfo.distance_right > barrier_distance_val;
				this.sendToEntry.barrier_right = this.sensorInfo.distance_left > barrier_distance_val;
				this.sendToEntry.barrier_rear = this.sensorInfo.distance_rear > barrier_distance_val;

				if (compare_sensor_data != this.sensorInfo.wheel_distance_avg) {
					this.sendToEntry.isDriving = 1;
					compare_sensor_data = this.sensorInfo.wheel_distance_avg;
				}
				else {
					if ((sensor_check_cnt++) == 10) {
						this.sendToEntry.isDriving = 0;
						sensor_check_cnt = 0;
					}
				}
			}
		}
		this.isBuffering = 0;
	}
	return;
};

Module.prototype.requestRemoteData = function (handler) {
	var sendToEntry = this.sendToEntry;

	for (var key in sendToEntry) {
		handler.write(key, sendToEntry[key]);
	}
	return;
};

Module.prototype.handleRemoteData = function (handler) {
	var entry_controller = this.entry_controller;
	if (handler.e(CueCmd.CMD_SEQ)) {
		entry_controller.seq = handler.read(CueCmd.CMD_SEQ);
		if (entry_controller.seq == 0) {
			if (nowSeq != 0) {
				// sendBuffers.push([0xFF, 0x55, 0x01, 0x07, 0x0A]);
				// this.sendSerialData(sendBuffers)
				// sendBuffers = []
			}
			nowSeq = 0;
		}
		else if (entry_controller.seq > 0) {
			if (nowSeq == entry_controller.seq) return;
			nowSeq = entry_controller.seq;
			if (handler.e(CueCmd.CMD_CATEGORY)) entry_controller.category = handler.read(CueCmd.CMD_CATEGORY);
			if (handler.e(CueCmd.CMD_ACTION)) entry_controller.action = handler.read(CueCmd.CMD_ACTION);
			if (handler.e(CueCmd.CMD_PARAM_CNT)) entry_controller.param_cnt = handler.read(CueCmd.CMD_PARAM_CNT);
			if (handler.e(CueCmd.CMD_PARAM_A)) entry_controller.paramA = handler.read(CueCmd.CMD_PARAM_A);
			if (handler.e(CueCmd.CMD_PARAM_B)) entry_controller.paramB = handler.read(CueCmd.CMD_PARAM_B);
			if (handler.e(CueCmd.CMD_PARAM_C)) entry_controller.paramC = handler.read(CueCmd.CMD_PARAM_C);
			if (handler.e(CueCmd.CMD_PARAM_D)) entry_controller.paramD = handler.read(CueCmd.CMD_PARAM_D);
			if (handler.e(CueCmd.CMD_MODE_A)) entry_controller.modeA = handler.read(CueCmd.CMD_MODE_A);
			if (handler.e(CueCmd.CMD_MODE_B)) entry_controller.modeB = handler.read(CueCmd.CMD_MODE_B);

			var buffer = this.getCueCommand(entry_controller.category, entry_controller.action, entry_controller.param_cnt, entry_controller.paramA, entry_controller.paramB, entry_controller.paramC, entry_controller.paramD);
			if (buffer.length) {
				buffer.unshift(this.hw_controller.fheader, this.hw_controller.sheader, buffer.length);
				buffer.push(0x0a);
				sendBuffers.push(buffer);
				this.sendSerialData(sendBuffers)
				sendBuffers = []
			}
		}
	}
	return;
};

Module.prototype.getCueCommand = function (c, a, cnt, pa, pb, pc, pd) {
	var buffer = [0x00];
	switch (c) {
		case CueCategoryCmd.DRIVE:
			switch (a) {
				case CueActionCmd_Drive.FORWARD:
				case CueActionCmd_Drive.BACKWARD:
					var speed = 0;
					switch (pb) {
						case 1:
							speed = 17;
							break;
						case 2:
							speed = 22;
							break;
						case 3:
							speed = 27;
							break;
						case 4:
							speed = 32;
							break;
						case 5:
							speed = 37;
							break;
					}
					var time = parseInt((pa / speed) * 1000);
					pa = a == CueActionCmd_Drive.FORWARD ? pa * 10 : (pa * 10 * (-1)) + 0x4000;
					var c6 = (pa & 0xFF00) >> 8;
					var c1 = pa & 0xFF;
					var c4 = (time & 0xFF00) >> 8;
					var c5 = time & 0xFF;
					var c8 = a == CueActionCmd_Drive.FORWARD ? 0x80 : 0x81;
					buffer.push(0x23, c1, 0x00, 0x00, c4, c5, c6, 0x00, c8);
					break;
				case CueActionCmd_Drive.TURN_CW:
				case CueActionCmd_Drive.TURN_CCW:
					var time = parseInt(pa / 30) * 100;
					var c4 = (time & 0xFF00) >> 8;
					var c5 = time & 0xFF;
					pa = a == CueActionCmd_Drive.TURN_CW ? pa = pa * -1 : pa;
					var rawDegrees = parseInt(pa * 628 / 360);
					var c7 = rawDegrees > 0 ? 0x00 : 0xC0;
					rawDegrees = rawDegrees > 0 ? rawDegrees : 0x400 + rawDegrees;
					var c3 = rawDegrees & 0xFF;
					var c6 = ((rawDegrees & 0xFF00) >> 8) << 6;
					buffer.push(0x23, 0x00, 0x00, c3, c4, c5, c6, c7, 0x80);
					break;
				case CueActionCmd_Drive.WHEEL:
					var left = pb;
					var right = pd;
					if (pa == 0x01) {
						left *= 30;
					}
					else if (pa == 0x02) {
						left *= (-30);
					}
					if (pc == 0x01) {
						right *= 30;
					}
					else if (pc == 0x02) {
						right *= (-30);
					}
					buffer.push(0x01, (left & 0xFF00) >> 8, left & 0xFF, (right & 0xFF00) >> 8, right & 0xff);
					break;
				case CueActionCmd_Drive.STOP:
					buffer.push(0x02, 0x00, 0x00, 0x00);
					break;
			}
			break;
		case CueCategoryCmd.START:
			break;
		case CueCategoryCmd.LOOK:
			switch (a) {
				case CueActionCmd_Look.LEFT:
				case CueActionCmd_Look.RIGHT:
					if (pa > 120) return [];
					var angle = (a == CueActionCmd_Look.LEFT) ? pa * 100 * -1 : pa * 100;
					buffer.push(0x06, (angle & 0xFF00) >> 8, angle & 0xFF);
					break;
				case CueActionCmd_Look.FORWARD:
					buffer.push(0x06, 0x00, 0x00);
					break;
				case CueActionCmd_Look.UP:
					buffer.push(0x07, 0x08, 0xca);
					break;
				case CueActionCmd_Look.DOWN:
					buffer.push(0x07, 0xfd, 0x44);
					break;
				case CueActionCmd_Look.STRAIGHT:
					buffer.push(0x07, 0x00, 0x00);
					break;
				case CueActionCmd_Look.FORWARD_VOICE:
					wait_action = true;
					return [];
			}
			break;
		case CueCategoryCmd.LIGHT:
			switch (a) {
				case CueActionCmd_Light.TAIL:
					buffer.push((a == CueActionCmd_Light.TAIL) ? 0x04 : 0x0d, pa);
					break;
				case CueActionCmd_Light.EYE_PATTERN:
					switch (pa) {
						case 0x00: buffer.push(0x08, 0xFF, 0x09, 0x00, 0x00); break;
						case 0x01: buffer.push(0x08, 0xFF, 0x09, 0x09, 0xF2); break;
						case 0x02: buffer.push(0x08, 0xFF, 0x09, 0x09, 0x72); break;
						case 0x03: buffer.push(0x08, 0xFF, 0x09, 0x04, 0xE4); break;
						case 0x04: buffer.push(0x08, 0xFF, 0x09, 0x08, 0x42); break;
						case 0x05: buffer.push(0x08, 0xFF, 0x09, 0x0F, 0xFF); break;
					}
					break;
				case CueActionCmd_Light.ALL:
				case CueActionCmd_Light.LEFT_EAR: buffer.push(0xb, pa, pb, pc); if (a == CueActionCmd_Light.LEFT_EAR) break;
				case CueActionCmd_Light.RIGHT_EAR: buffer.push(0xc, pa, pb, pc); if (a == CueActionCmd_Light.RIGHT_EAR) break;
				case CueActionCmd_Light.TOP: buffer.push(0x30, pa, pb, pc); if (a == CueActionCmd_Light.TOP) break;
				case CueActionCmd_Light.FRONT: buffer.push(0x3, pa, pb, pc); break;
			}
			break;
		case CueCategoryCmd.SOUND:
			buffer.push(0x18, 0x53);
			switch (a) {
				case CueActionCmd_Sound.MY_SOUNDS:
					switch (pa) {
						case 0: buffer.push(0x59, 0x53, 0x54, 0x56, 0x4f, 0x49, 0x43, 0x45, 0x30); break;
						case 1: buffer.push(0x59, 0x53, 0x54, 0x56, 0x4f, 0x49, 0x43, 0x45, 0x31); break;
						case 2: buffer.push(0x59, 0x53, 0x54, 0x56, 0x4f, 0x49, 0x43, 0x45, 0x32); break;
						case 3: buffer.push(0x59, 0x53, 0x54, 0x56, 0x4f, 0x49, 0x43, 0x45, 0x33); break;
						case 4: buffer.push(0x59, 0x53, 0x54, 0x56, 0x4f, 0x49, 0x43, 0x45, 0x34); break;
						case 5: buffer.push(0x59, 0x53, 0x54, 0x56, 0x4f, 0x49, 0x43, 0x45, 0x35); break;
						case 6: buffer.push(0x59, 0x53, 0x54, 0x56, 0x4f, 0x49, 0x43, 0x45, 0x36); break;
						case 7: buffer.push(0x59, 0x53, 0x54, 0x56, 0x4f, 0x49, 0x43, 0x45, 0x37); break;
						case 8: buffer.push(0x59, 0x53, 0x54, 0x56, 0x4f, 0x49, 0x43, 0x45, 0x38); break;
						case 9: buffer.push(0x59, 0x53, 0x54, 0x56, 0x4f, 0x49, 0x43, 0x45, 0x39); break;
					}
					break;
				case CueActionCmd_Sound.SAY:
					switch (pa) {
						case CueParamCmd_Sound_Say.LAUGH: buffer.push(0x4E, 0x50, 0x45, 0x47, 0x49, 0x47, 0x47, 0x41, 0x4e, 0x4c, 0x41); break;
						case CueParamCmd_Sound_Say.SIGH: buffer.push(0x4E, 0x5a, 0x45, 0x53, 0x49, 0x47, 0x48, 0x32); break;
						case CueParamCmd_Sound_Say.WOOHOO: buffer.push(0x4E, 0x50, 0x45, 0x57, 0x4f, 0x4f, 0x48, 0x4f, 0x4f); break;
						case CueParamCmd_Sound_Say.OUCH: buffer.push(0x4E, 0x50, 0x45, 0x4f, 0x55, 0x43, 0x48); break;
						case CueParamCmd_Sound_Say.SCARED: buffer.push(0x4E, 0x50, 0x45, 0x41, 0x48, 0x48); break;
						case CueParamCmd_Sound_Say.MOVE: buffer.push(0x4E, 0x50, 0x45, 0x48, 0x45, 0x52, 0x45, 0x49, 0x47, 0x4f); break;
						case CueParamCmd_Sound_Say.START: buffer.push(0x4E, 0x50, 0x45, 0x4c, 0x45, 0x54, 0x53, 0x44, 0x4f, 0x54); break;
						case CueParamCmd_Sound_Say.SUCCESS: buffer.push(0x4E, 0x50, 0x45, 0x4d, 0x49, 0x53, 0x53, 0x44, 0x45, 0x41, 0x43); break;
						case CueParamCmd_Sound_Say.CLAP: buffer.push(0x4E, 0x50, 0x45, 0x4c, 0x45, 0x54, 0x53, 0x48, 0x45, 0x41); break;
						case CueParamCmd_Sound_Say.SENSOR: buffer.push(0x4E, 0x50, 0x45, 0x53, 0x45, 0x54, 0x54, 0x55, 0x50, 0x53, 0x45, 0x53); break;
						case CueParamCmd_Sound_Say.PICKUP: buffer.push(0x4E, 0x50, 0x45, 0x50, 0x49, 0x43, 0x4b, 0x4d, 0x45, 0x55, 0x50, 0x41); break;
						case CueParamCmd_Sound_Say.PUTDOWN: buffer.push(0x4E, 0x50, 0x45, 0x4f, 0x4b, 0x49, 0x4d, 0x52); break;
						case CueParamCmd_Sound_Say.HANDINFRONT: buffer.push(0x4E, 0x50, 0x45, 0x50, 0x55, 0x54, 0x59, 0x4f, 0x48, 0x41, 0x49); break;
						case CueParamCmd_Sound_Say.HANDBEHIND: buffer.push(0x4E, 0x50, 0x45, 0x50, 0x55, 0x54, 0x59, 0x4f, 0x48, 0x41, 0x42); break;
						case CueParamCmd_Sound_Say.FAIL: buffer.push(0x4E, 0x50, 0x45, 0x54, 0x49, 0x4d, 0x45, 0x46, 0x4f, 0x41, 0x4e); break;
						case CueParamCmd_Sound_Say.SONG: buffer.push(0x4E, 0x50, 0x45, 0x48, 0x45, 0x4c, 0x4c, 0x48, 0x45, 0x48, 0x45, 0x57); break;
						case CueParamCmd_Sound_Say.GOODBYE: buffer.push(0x4E, 0x50, 0x45, 0x53, 0x45, 0x45, 0x59, 0x4f, 0x4c, 0x41); break;
						case CueParamCmd_Sound_Say.HAPPYBIRTHDAY: buffer.push(0x4E, 0x50, 0x45, 0x48, 0x41, 0x50, 0x50, 0x42, 0x49); break;
						case CueParamCmd_Sound_Say.HAPPYHOLIDAY: buffer.push(0x4E, 0x50, 0x45, 0x48, 0x41, 0x50, 0x50, 0x48, 0x4f); break;
						case CueParamCmd_Sound_Say.CIRCLE: buffer.push(0x4E, 0x50, 0x45, 0x43, 0x49, 0x52, 0x43, 0x4c, 0x45); break;
						case CueParamCmd_Sound_Say.TRIANGLE: buffer.push(0x4E, 0x50, 0x45, 0x54, 0x52, 0x49, 0x41, 0x4e, 0x47, 0x4c, 0x45); break;
						case CueParamCmd_Sound_Say.SQUARE: buffer.push(0x4E, 0x50, 0x45, 0x53, 0x51, 0x55, 0x41, 0x52, 0x45); break;
						case CueParamCmd_Sound_Say.RED: buffer.push(0x4E, 0x50, 0x45, 0x52, 0x45, 0x44); break;
						case CueParamCmd_Sound_Say.ORNAGE: buffer.push(0x4E, 0x50, 0x45, 0x4f, 0x52, 0x41, 0x4e, 0x47, 0x45); break;
						case CueParamCmd_Sound_Say.YELLOW: buffer.push(0x4E, 0x50, 0x45, 0x59, 0x45, 0x4c, 0x4c, 0x4f, 0x57); break;
						case CueParamCmd_Sound_Say.GREEN: buffer.push(0x4E, 0x50, 0x45, 0x47, 0x52, 0x45, 0x45, 0x4e); break;
						case CueParamCmd_Sound_Say.BLUE: buffer.push(0x4E, 0x50, 0x45, 0x42, 0x4c, 0x55, 0x45); break;
						case CueParamCmd_Sound_Say.ONE: buffer.push(0x4E, 0x50, 0x45, 0x4f, 0x4e, 0x45); break;
						case CueParamCmd_Sound_Say.TWO: buffer.push(0x4E, 0x50, 0x45, 0x54, 0x57, 0x4f); break;
						case CueParamCmd_Sound_Say.THREE: buffer.push(0x4E, 0x50, 0x45, 0x54, 0x48, 0x52, 0x45, 0x45); break;
						case CueParamCmd_Sound_Say.FRONT: buffer.push(0x4E, 0x50, 0x45, 0x46, 0x52, 0x4f, 0x4e, 0x54); break;
						case CueParamCmd_Sound_Say.BACK: buffer.push(0x4E, 0x50, 0x45, 0x42, 0x41, 0x43, 0x4b); break;
						case CueParamCmd_Sound_Say.RIGHT: buffer.push(0x4E, 0x50, 0x45, 0x52, 0x49, 0x47, 0x48, 0x54, 0x33); break;
						case CueParamCmd_Sound_Say.LEFT: buffer.push(0x4E, 0x50, 0x45, 0x4c, 0x45, 0x46, 0x54); break;
					}
					break;
			}
			break;
	}
	return buffer;
};

Module.prototype.sendSerialData = function (data) {
	this.sp.write(data.shift(), (error) => {
		this.sp.drain((error) => {
			data = []
		})
	})
}

Module.prototype.requestLocalData = function () {

};

Module.prototype.afterConnect = function (that, cb) {
	that.connected = true;
	if (cb) {
		cb('connected');
	}
};

Module.prototype.disconnect = function (connect) {
	connect.close();
	if (this.sp) {
		delete this.sp;
	}
};

Module.prototype.reset = function () {
	var hw_controller = this.hw_controller;
	hw_controller.fheader = 255;
	hw_controller.sheader = 85;
	hw_controller.data_size = 0;
	hw_controller.index = 0;
	hw_controller.data = 0;
	hw_controller.tail = 10;

	var entry_controller = this.entry_controller;
	entry_controller.seq = 0;
	entry_controller.category = 0;
	entry_controller.action = 0;
	entry_controller.param_cnt = 0;
	entry_controller.paramA = 0;
	entry_controller.paramB = 0;
	entry_controller.paramC = 0;
	entry_controller.paramD = 0;
	entry_controller.modeA = 0;
	entry_controller.modeB = 0;

	this.isfirst = true;
	this.isBuffering = 0;
	this.serialData_q = [];
	sendBuffers = [];
};

module.exports = new Module();
