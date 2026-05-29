//const _ = require('lodash');
const BaseModule = require('./baseModule');

const Loglevel = {
	ERROR:			0x00,
	WARNING:		0x01,
	DEBUG:			0x02,
	INFO:			0x03,
}

const TelliotEvent = {
	EVENT_CMD_STATUS:				0x8001,
	EVENT_CMD_VOICE_TO_TEXT : 		0x8002,
	EVENT_CMD_SENSOR_DETECTED : 	0x8003,
	EVENT_CMD_RFID_TAG_DETECTED : 	0x8004
}

const Instruction = {
	// Voice Command
	VOICE_TRIGGER_PRESSED_CMD: 	0x0001,
	VOICE_TRIGGER_RELEASED_CMD: 0x0002,
	VOICE_TRIGGER_CLICK_CMD:    0x0003,
	VOICE_TO_TEXT_CMD: 			0x0004,
	TEXT_TO_VOICE_CMD: 			0x0005,
	ADD_CHATBOT_CMD:			0x0006,
	ADD_PROMPT_CMD:				0x0007,
	ASK_AI_VIA_TEXT_CMD:		0x0008,

	// Volume Command
	VOLUME_CMD: 				0x0011,

	// External device command
	EXT_DEVICE_PRE_ACTION_CMD:	0x0100,
	EXT_DEVICE_MOTOR_CTRL_CMD:	0x0101,
	EXT_DEVICE_LINE_TRACE_CMD:	0x0102,
	EXT_DEVICE_LED_CTRL_CMD:	0x0103,
	EXT_DEVICE_SENSOR_CMD:		0x0104,
	EXT_DEVICE_TAG_DETECT:		0x0105,

	// Setting Command
	SETTING_VOICE_CMD:			0x0200,

	// Genernal Request
	GET_STATUS:					0xFFFE,

	// PING Request
	TELLIOT_PING:				0xFFFF,
}

const TELLIOT_PACKET_HEADER = 0xAA55

class TelliotBase extends BaseModule {
	constructor () {
		super();
		this.sp = null;
		this._sendBuffers = [];
		this._receiveBuffer = [];
		this._pingpacket = [];
		this._stt_data = [];
		this._deviceid = 0x0000;
		this._loglevel = Loglevel.DEBUG;
		this._isConnected = false;
		this._sendEntry = false;

		this.state = {
			sensors: [],
			rfid: []
		}
	}

    // ��Ʈ�� �������� ����Ǿ����� ȣ���
    init(handler, config) {
		this._writeDebug(Loglevel.DEBUG, 'Initialize');
		this._lasttime = Date.now();
    }

    // ���� ����õ�(handshake) ���� �Ŀ� ȣ���
    setSerialPort(sp) {
		this._writeDebug(Loglevel.DEBUG, 'setSerialPort');
        this.sp = sp;
    }

    // ���� ����õ��� ����̽��� ���� ������. checkInitialData �� ����Ǿ��ִٸ� �ʼ�
    requestInitialData() {
		this._writeDebug(Loglevel.DEBUG, 'requestInitialData Telliot Base');

		this._make_telliot_ping_packet();

		return this._pingpacket;
    }

    // ���� ����õ����� ����̽��� �����͸� �޾�, ���ϴ� �����Ͱ� �´��� �Ǵ��ϴ� ����
    // requestInitialData �� ����Ǿ��ִٸ� �ʼ�
    checkInitialData(data, config) {
		this._writeDebug(Loglevel.DEBUG, 'checkInitialData Telliot Base');
        return true;
    }

    // �ش� �Լ��� �����ϸ�, ����̽����� �����͸� �޾ƿ� �� validate �� ��ģ��. ������ �״�� ó���������� �����Ѵ�.
    validateLocalData(data) {
        return true;
    }

    // ����̽����� �����͸� �޾ƿ� ��, �������� �����͸� ������ ���� ȣ��Ǵ� ����. handler �� �����ϴ� ������ ���� ���� �� �ִ�.
    // handler.write(key, value) �� ������ ���� Entry.hw.portData ���� �޾ƺ� �� �ִ�.
    requestRemoteData(handler) {
		if (this._sendEntry) {
			this._writeDebug(Loglevel.DEBUG, 'requestRemoteData(send to browser)');
			handler.write("state", {sensors: this.state.sensors, rfid: this.state.rfid});
			this._sendEntry = false;
		} else {
			handler.write("state", {sensors: [], rfid: []});
		}
		//if (this._stt_data.length > 0) {
		//	handler.write('telliot_talk', this._stt_data);
		//	this._stt_data = [];
		//}
    }

    // ��Ʈ�� ���������� �� �����͸� ó���Ѵ�. handler.read �� �������� �����͸� �о�� �� �ִ�.
    // handler �� ���� Entry.hw.sendQueue �� ������ ���� ����.
    handleRemoteData(handler) {
		const keys = Object.keys(handler.serverData);

		if (keys.length == 0)
			return;

		this._writeDebug(Loglevel.DEBUG, 'handleRemoteData : ' + keys);

		keys.forEach(key => this._processRequestData(key, handler.read(key)));
    }

    // ����̽��� �����͸� ������ ����. control: slave �� ��� duration �ֱ⿡ ���� ����̽��� �����͸� ������.
    // return ������ ���۸� ��ȯ�ϸ� ����̽��� �����͸� ������, �Ƶ��̳��� ��� ���Ž� �ڵ带 ������ �ִ�.
    requestLocalData() {
		if (this.sp === null)
			return null;

		if (this._pingpacket.length === 0) {
			this._make_telliot_ping_packet();
		}

		//this._writeDebug(Loglevel.DEBUG, 'requestLocalData : Send Ping Data (size = ' + this._pingpacket.length + ')');

		this.sp.write(this._pingpacket);

		return null;
    }

	// ����̽����� �� �����͸� ó���ϴ� ����. ���⼭�� ó���� �����Ͱ� ���� ��ŵ�Ͽ���.
    handleLocalData(data) {
		//this._writeDebug(Loglevel.DEBUG, 'handleLocalData (from device)');
		this.state.sensors = []
		this.state.rfid = []
		this._processReveivedData(data);
		//this._receiveBuffer.push(...data);

		//while(this._receiveBuffer.length > 0) {
		//	let length = this._receiveBuffer.length;
		//	this._processReveivedData(this._receiveBuffer);

		//	if (length == this._receiveBuffer.length)
		//		this._receiveBuffer.splice(0, 1);
		//}
    }

    // Ŀ���Ͱ� ���������� �� ȣ��Ǵ� ����, ��ĵ ���� Ȥ�� ����̽� ���� ������ ȣ��ȴ�.
    disconnect(connector) {
		this._writeDebug(Loglevel.DEBUG, 'disconnect Telliot Base');
        connector.close();
        if (this.sp) {
            delete this.sp;
			this.sp = null;
        }
    }

    // ��Ʈ�� ���������� ���� ������ �������� �� �߻��ϴ� ����.
    reset() {
		this._writeDebug(Loglevel.DEBUG, 'reset');
    }

	/*************************************************************************
	 * Name: checkLogLevel
	 *
	 * Description: Check Log Level
	 *
	 * Returned Value :
	 *************************************************************************/
	_checkLogLevel(level)
	{
		if (level > this._loglevel) {
			return false;
		} else {
			return true;
		}
	}

	/*************************************************************************
	 * Name: checkLogLevel
	 *
	 * Description: Check Log Level
	 *
	 * Returned Value :
	 *************************************************************************/
	_writeDebug(level, message)
	{
		if (this._checkLogLevel(level) == true) {
			console.log('[', level, '] : ', message);
		}
	}

	/*************************************************************************
	 * Name: writeArrayData
	 *
	 * Description: Debugging Log Function
	 *
	 * Returned Value :
	 *************************************************************************/
	_writeArrayData(level, buffer, iscommand) {
		if (this._checkLogLevel(level) == true) {
			var messages = Array.from(buffer, function (byte) {
									return ('0' + (byte & 0xff).toString(16)).slice(-2);
								}).join(' ');
			if (iscommand)
				console.log('    [ command ] : '  + messages);
			else
				console.log('    [  event  ] : '  + messages);
		}
	}

	/*************************************************************************
	 * Name: _isTelliotPacket
	 *
	 * Description:
	 *
	 * Returned Value :
	 *************************************************************************/
	_isTelliotPacket(data)
	{
		if(data[0] == 0xAA && data[1] == 0x55)
			return true;
		else
			return false;
	}

	/*************************************************************************
	 * Name: makeCRCdata
	 *
	 * Description:
	 *
	 * buffer - Command buffer data
	 *
	 * Returned Value :
	 *************************************************************************/
	_add_CRC_data(buffer)
	{
		const crcdata = [0x00, 0x00];
		var crc = 0;
		const len = buffer.length;

		this._writeDebug(Loglevel.DEBUG, '_add_CRC_data : buffer length = ' + len);

		for (let index = 0; index < len; index++) {
			crc += buffer[index];
		}

		crc += 1;

		this._writeDebug(Loglevel.DEBUG, '_add_CRC_data : CRC Data = ' + crc);

		crcdata[0] = crc;
		crcdata[1] = crc >> 8;

		buffer.push(...crcdata);

		return;
	}

	/*************************************************************************
	 * Name: _request_telliot_command
	 *
	 * Description:
	 *
	 * Returned Value :
	 *************************************************************************/
	_request_telliot_command(cmd, param, param_length = 0)
	{
		let len = 0;
		const buffer = []; //Buffer.alloc(8);

		len = param_length + 2; // length + CRC

		this._writeDebug(Loglevel.DEBUG, 'make_Command : CMD = ' + cmd);

		buffer.push(TELLIOT_PACKET_HEADER, TELLIOT_PACKET_HEADER >> 8);
		buffer.push(this._deviceid, this._deviceid >> 8);
		buffer.push(cmd, cmd >> 8);
		buffer.push(len, len >> 8);
		if (param_length > 0) {
			this._writeDebug(Loglevel.DEBUG, 'make_Command : param length = ' + param_length);
			buffer.push(...param);
		}

		this._sendBuffers.length = 0;
		this._sendBuffers.push(...buffer);

		this._add_CRC_data(this._sendBuffers);

		this.sp.write(this._sendBuffers);
	}

	/*************************************************************************
	 * Name: _make_telliot_ping_packet
	 *
	 * Description:
	 *
	 * Returned Value :
	 *************************************************************************/
	_make_telliot_ping_packet()
	{
		let len = 0;
		const buffer = Buffer.alloc(8);

		len = 2; // CRC

		buffer[0] = TELLIOT_PACKET_HEADER;
		buffer[1] = TELLIOT_PACKET_HEADER >> 8;
		buffer[2] = this._deviceid;
		buffer[3] = this._deviceid >> 8;
		buffer[4] = Instruction.TELLIOT_PING;
		buffer[5] = Instruction.TELLIOT_PING >> 8;
		buffer[6] = len;
		buffer[7] = len >> 8;

		this._pingpacket.length = 0;
		this._pingpacket.push(...buffer);

		this._add_CRC_data(this._pingpacket);
	}

	/*************************************************************************
	 * Name: _processReveivedData
	 *
	 * Description:
	 *
	 * Returned Value :
	 *************************************************************************/
	_processReveivedData (data) {
		var received_data = data.slice();

		if (this._isTelliotPacket(received_data) === true) {
			let telliot_event = received_data[4] | received_data[5] << 8;
			let len = received_data[6] | received_data[7] << 8;

			if (telliot_event != 0xFFFF) {
				this._writeArrayData(Loglevel.DEBUG, received_data, false);
				this._writeDebug(Loglevel.DEBUG, 'Event : ' + telliot_event + '  len : ' + len);
			}

			switch (telliot_event)
			{
				case TelliotEvent.EVENT_CMD_STATUS :
					this._writeDebug(Loglevel.DEBUG, 'Received the EVENT_CMD_STATUS');
					break;
				case TelliotEvent.EVENT_CMD_VOICE_TO_TEXT :
					this._stt_data = [];
					this._stt_data.push(data.slice(8, len - 2));
					break;
				case TelliotEvent.EVENT_CMD_SENSOR_DETECTED :
					let sensor_data = received_data[8] | received_data[9] << 8;
					this._writeDebug(Loglevel.DEBUG, 'Received the EVENT_CMD_SENSOR_DETECTED');

					this._writeDebug(Loglevel.DEBUG, 'Sensor Data : ' + sensor_data);
					this.state.sensors = sensor_data;
					this._sendEntry = true;
					break;
				case TelliotEvent.EVENT_CMD_RFID_TAG_DETECTED :
					let tag_id = received_data[8] | received_data[9] << 8;
					this._writeDebug(Loglevel.DEBUG, 'Received the EVENT_CMD_RFID_TAG_DETECTED');

					this._writeDebug(Loglevel.DEBUG, 'Tag ID : ' + tag_id);
					this.state.rfid[tag_id - 1] = 1;
					this._sendEntry = true;
					break;
				default :
					break;
			}
		} else {
			data.slice(0,1);
		}
	}

	_toUTF8Array(str) {
		let utf8 = [];
		for (let i = 0; i < str.length; i++) {
			let charcode = str.charCodeAt(i);
			if (charcode < 0x80) utf8.push(charcode);
			else if (charcode < 0x800) {
				utf8.push(0xc0 | (charcode >> 6),
						  0x80 | (charcode & 0x3f));
			}
			else if (charcode < 0xd800 || charcode >= 0xe000) {
				utf8.push(0xe0 | (charcode >> 12),
						  0x80 | ((charcode>>6) & 0x3f),
						  0x80 | (charcode & 0x3f));
			}
			// surrogate pair
			else {
				i++;
				// UTF-16 encodes 0x10000-0x10FFFF by
				// subtracting 0x10000 and splitting the
				// 20 bits of 0x0-0xFFFFF into two halves
				charcode = 0x10000 + (((charcode & 0x3ff)<<10)
						  | (str.charCodeAt(i) & 0x3ff));
				utf8.push(0xf0 | (charcode >>18),
						  0x80 | ((charcode>>12) & 0x3f),
						  0x80 | ((charcode>>6) & 0x3f),
						  0x80 | (charcode & 0x3f));
			}
		}
		return utf8;
	}

	/*************************************************************************
	 * Name: _predefined_action
	 *
	 * Description:
	 *
	 * Returned Value :
	 *************************************************************************/
	_predefined_action(action_id, action_value) {
		var param = { action_id, action_value };

		this._writeDebug(Loglevel.DEBUG, 'data : ' + action_id + '  ' + action_value);
					//this._request_telliot_command(Instruction.EXT_DEVICE_PRE_ACTION_CMD, param, param.length);
	}

	/*************************************************************************
	 * Name: _processRequestData
	 *
	 * Description:
	 *
	 * Returned Value :
	 *************************************************************************/
	_processRequestData (command, data) {
		const keys = data ? Object.keys(data) : [];

		this._writeDebug(Loglevel.DEBUG, 'command : ' + command);

		switch(command) {
			case 'req_voice_trigger_btn_pressed':
				break;
			case 'req_voice_trigger_btn_released':
				break;
			case 'req_voice_trigger_click' :
				this._request_telliot_command(Instruction.VOICE_TRIGGER_CLICK_CMD, keys, keys.length);
				break;
			case 'req_stt':
				break;
			case 'req_tts':
				let str = unescape(data.toString());
				var arr = this._toUTF8Array(str);

				this._writeDebug(Loglevel.DEBUG, 'data : ' + str);
				this._writeArrayData(Loglevel.DEBUG, arr, true);

				this._request_telliot_command(Instruction.TEXT_TO_VOICE_CMD, arr, arr.length);
				break;
			case 'add_chatbot' :
				break;
			case 'add_prompt' :
				let ai_prompt = unescape(data.toString());
				var arr_data = this._toUTF8Array(ai_prompt);

				this._writeDebug(Loglevel.DEBUG, 'data : ' + ai_prompt);
				this._writeArrayData(Loglevel.DEBUG, arr_data, true);

				this._request_telliot_command(Instruction.ADD_PROMPT_CMD, arr_data, arr_data.length);
				break;
			case 'req_volume' :
				break;
			case 'req_mute_unmute' :
				break;
			case 'pre_action' :
				{
					const predefined_action = [];

					keys.forEach(key => predefined_action.push(data[key]));
					this._writeDebug(Loglevel.DEBUG, 'data : ' + predefined_action);
					this._request_telliot_command(Instruction.EXT_DEVICE_PRE_ACTION_CMD, predefined_action, predefined_action.length);
				}
				break;
			case 'motor_ctrl' :
				{
					const motor = [];

					keys.forEach(key => motor.push(data[key]));
					this._writeDebug(Loglevel.DEBUG, 'data : ' + motor);
					this._request_telliot_command(Instruction.EXT_DEVICE_MOTOR_CTRL_CMD, motor, motor.length);
				}
				break;
			case 'line_trace' :
				{
					const line_trace_data = [];

					keys.forEach(key => line_trace_data.push(data[key]));
					this._writeDebug(Loglevel.DEBUG, 'data : ' + line_trace_data);
					this._request_telliot_command(Instruction.EXT_DEVICE_LINE_TRACE_CMD, line_trace_data, line_trace_data.length);
				}
				break;
			case 'sensor_detect' :
				{
					const sensor_data = [];

					keys.forEach(key => sensor_data.push(data[key]));
					this._writeDebug(Loglevel.DEBUG, 'data : ' + sensor_data);
					this._request_telliot_command(Instruction.EXT_DEVICE_SENSOR_CMD, sensor_data, sensor_data.length);
				}
				break;
			case 'rfid_detect' :
				this._writeDebug(Loglevel.DEBUG, 'data : ' + keys);
				this._request_telliot_command(Instruction.VOICE_TRIGGER_CLICK_CMD, keys, keys.length);
				break;
			default :
				break;
		}
	}

	/*************************************************************************
	 * Name: _request_telliot_status
	 *
	 * Description: Make command to check port status & values
	 *
	 * Returned Value :
	 *************************************************************************/
	_request_telliot_status()
	{
		this._writeDebug(Loglevel.DEBUG, '_request_telliot_status');

		this._request_telliot_command(Instruction.GET_STATUS, null);

		//this.sp.write(this._sendBuffers);
		this._sendBuffers = [];
	}
}

module.exports = { TelliotBase,	Loglevel, TelliotEvent };
