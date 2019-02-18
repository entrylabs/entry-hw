function Module() {
	this.hdLocalData = { 
		type: [0, 0, 0, 0],
		id: [0, 0, 0, 0],
		no: [0, 0, 0, 0],
		len: [0, 0, 0, 0],
		data: [0, 0, 0, 0]
	};
	this.hdRemoteData = { 
		TIME:[false, null, null, null, null],
		DC_MOTOR:[false, null, null, null, null],
		SERVO_MOTOR:[false, null, null, null, null],
		BUZZER:[false, null, null, null, null],
		LED_R:[false, null, null, null, null],
		LED_G:[false, null, null, null, null],
		LED_B:[false, null, null, null, null],
		ALL_OFF: [false, null, null, null, null]
	};
	this.rqRemoteData = { 
		IR:[null, null, null, null],
		CDS:[null, null, null, null],
		POT:[null, null, null, null],
		TACT_SWITCH:[null, null, null, null],
	};
	this.setZero = { 
		set_zero: false
	};
	this.receiveData = [];
}

var PalmKit = {
	// minicell
	HEAD1_IDX: 0,
	HEAD2_IDX: 1,
	TYPE_RX_IDX: 2, 
	TYPE_TX_IDX: 3,
	DATA_LEN_IDX: 4, 
	IDNOLEN_IDX: [5, 6, 7, 8],
	DATA_MIN_IDX: 9,

	HEAD1: 0x16,
	HEAD2: 0x02,

	PACKET_VALUE_MAX_SIZE: 4,
	MAX_NUMBER_OF_MODULES: 4,

	MIN_LEN: 0x0e,
	FLAG: 0,
	// key table
	SET_ZERO: "set_zero",
	// output_keytable
	TIME: "time",
	DC_MOTOR: "dc_motor",
	SERVO_MOTOR: "servo_motor",
	STOP: "stop",
	BUZZER: "buzzer",
	LED_R: "led_r",  
	LED_G: "led_g",  
	LED_B: "led_b",
	ALL_OFF: "all_off"
};

var InputCMD = {
	0x00: "NULL", 
	0x11: "IR", 
	0x16: "CDS", 
	0x1d: "POT", 
	0x1e: "TACT_SWITCH", 
	0x1f: "DIP_SWITCH"
};

var OutputCMD = {
	NULL: 0x00,
	TIME: 0x01,
	DC_MOTOR: 0x02,
	SERVO_MOTOR: 0x03,
	BUZZER: 0x05,
	LED_R: 0x07,  
	LED_G: 0x08,  
	LED_B: 0x09,
	ALL_OFF: 0x3f
};

Module.prototype.requestInitialData = function() {
	return null;
};

Module.prototype.checkInitialData = function(data, config) {
	return true;
};

Module.prototype.validateLocalData = function(data) {
	return true;
};

Module.prototype.handleRemoteData = function(handler) {
	var rqRemoteData = this.rqRemoteData;
	var hdRemoteData = this.hdRemoteData;
	var setZero = this.setZero;
	var buf;
	if(handler.e(PalmKit.STOP) && ((!hdRemoteData.DC_MOTOR[PalmKit.FLAG]) || (!hdRemoteData.SERVO_MOTOR[PalmKit.FLAG]))) {
		buf = handler.read(PalmKit.STOP);
		if(hdRemoteData.DC_MOTOR[1]!=0 || hdRemoteData.DC_MOTOR[2]!=0 || hdRemoteData.DC_MOTOR[3]!=0 || hdRemoteData.DC_MOTOR[4]!=0) {
			hdRemoteData.DC_MOTOR[PalmKit.FLAG] = true;
			for(var i=0; i<PalmKit.MAX_NUMBER_OF_MODULES; i++)
				hdRemoteData.DC_MOTOR[i+1] = 0;
		}
		if(hdRemoteData.SERVO_MOTOR[1]!=0 || hdRemoteData.SERVO_MOTOR[2]!=0 || hdRemoteData.SERVO_MOTOR[3]!=0 || hdRemoteData.SERVO_MOTOR[4]!=0) {
			hdRemoteData.SERVO_MOTOR[PalmKit.FLAG] = true;
			for(var i=0; i<PalmKit.MAX_NUMBER_OF_MODULES; i++)
				hdRemoteData.SERVO_MOTOR[i+1] = 0xff;
		}
	} 
	if(handler.e(PalmKit.DC_MOTOR)) {
		buf = handler.read(PalmKit.DC_MOTOR);
		var value = new Array();
		value.push(buf.dir);
		value.push(buf.speed); 
		if(JSON.stringify(hdRemoteData.DC_MOTOR[buf.idx]) !== JSON.stringify(value) 
			&& (!hdRemoteData.DC_MOTOR[PalmKit.FLAG])) {
			hdRemoteData.DC_MOTOR[PalmKit.FLAG] = true;
			hdRemoteData.DC_MOTOR[buf.idx] = value;
		}
	} 
	if(handler.e(PalmKit.SERVO_MOTOR)) {
		buf = handler.read(PalmKit.SERVO_MOTOR);
		var value = new Array();
		value.push(buf.angle);
		value.push(buf.speed); 
		if(JSON.stringify(hdRemoteData.SERVO_MOTOR[buf.idx]) !== JSON.stringify(value) 
			&& (!hdRemoteData.DC_MOTOR[PalmKit.FLAG])) {
			hdRemoteData.SERVO_MOTOR[PalmKit.FLAG] = true;
			hdRemoteData.SERVO_MOTOR[buf.idx] = value;
		}
	} 
	if(handler.e(PalmKit.BUZZER)) {
		buf = handler.read(PalmKit.BUZZER);
		if(hdRemoteData.BUZZER[buf.idx]!=buf.value && (!hdRemoteData.BUZZER[PalmKit.FLAG])) {
			hdRemoteData.BUZZER[PalmKit.FLAG] = true;
			hdRemoteData.BUZZER[buf.idx] = buf.value;	
		}
	} 
	if(handler.e(PalmKit.LED_R)) {
		buf = handler.read(PalmKit.LED_R);
		if(hdRemoteData.LED_R[buf.idx]!=buf.value_r && (!hdRemoteData.LED_R[PalmKit.FLAG])) {
			hdRemoteData.LED_R[PalmKit.FLAG] = true;
			hdRemoteData.LED_R[buf.idx] = buf.value_r;
		}
	}
	if(handler.e(PalmKit.LED_G)) {
		buf = handler.read(PalmKit.LED_G);
		if(hdRemoteData.LED_G[buf.idx]!=buf.value_g && (!hdRemoteData.LED_G[PalmKit.FLAG])) {
			hdRemoteData.LED_G[PalmKit.FLAG] = true;
			hdRemoteData.LED_G[buf.idx] = buf.value_g;
		}
	}
	if(handler.e(PalmKit.LED_B)) {
		buf = handler.read(PalmKit.LED_B);
		if(hdRemoteData.LED_B[buf.idx]!=buf.value_b && (!hdRemoteData.LED_B[PalmKit.FLAG])) {
			hdRemoteData.LED_B[PalmKit.FLAG] = true;
			hdRemoteData.LED_B[buf.idx] = buf.value_b;
		}
	}

	if(handler.e(PalmKit.SET_ZERO)) { // Always footer position in handleRemoteData function
		setZero.set_zero = true;
		hdRemoteData.ALL_OFF[PalmKit.FLAG] = true;
		hdRemoteData.ALL_OFF[1] = 0;
	}
};

Module.prototype.requestLocalData = function() {
	var rqLocalData = new Array();
	var hdRemoteData = this.hdRemoteData;
	var setZero = this.setZero;
	var cnt = 0, index = 0, rowLength; 
	
	for(var key in hdRemoteData) {
		if(hdRemoteData[key][PalmKit.FLAG]) {
			for(var i=1; i<PalmKit.MAX_NUMBER_OF_MODULES+1; i++) {
				if(hdRemoteData[key][i] != null)
					cnt += 1;
			}
		}
	}
	if(cnt == 0) return;
	var bufs = new Array();
	var rowLength = parseInt((cnt-1)/PalmKit.MAX_NUMBER_OF_MODULES, 10)+1;

	for(var i=0; i<rowLength; i++)
		bufs[i] = [	PalmKit.HEAD1, PalmKit.HEAD2, 
					0, 0, // TYPE_RX, TYPE_TX
					0, // DATA_LENGTH
					0, 0, 0, 0]; // ID,NO,LEN[1 ~ 4]

	for(var key in hdRemoteData) {
		if(!hdRemoteData[key][PalmKit.FLAG])
			continue;
		for(var i=1; i<5; i++) {
			if(hdRemoteData[key][i] != null) {
				var rows = parseInt(index/PalmKit.MAX_NUMBER_OF_MODULES, 10),
					cols = index % PalmKit.MAX_NUMBER_OF_MODULES;
				bufs[rows][PalmKit.TYPE_TX_IDX] |= (this.msbToLsb2Bit(OutputCMD[key]) << (6 - cols*2));
				var data = hdRemoteData[key][i];
				var bb = this.convertByteArray(data);
				bufs[rows][PalmKit.IDNOLEN_IDX[cols]] = this.lsbToMsb(OutputCMD[key]) + this.lsbTo2Bit(i-1) + this.lsb2BitExt(bb.length - 1);
				for(var j=0; j<bb.length; j++) {
					bufs[rows].push(bb[j]);
				}
				index += 1;
			}
		}
	}

	var rows = parseInt((cnt - 1) / PalmKit.PACKET_VALUE_MAX_SIZE, 10);
	var add = 4 - parseInt(1 * (parseInt((cnt+3)/4, 10) - parseInt((cnt+2)/4, 10))
				  + 2 * (parseInt((cnt+2)/4, 10) - parseInt((cnt+1)/4, 10))
				  + 3 * (parseInt((cnt+1)/4, 10) - parseInt((cnt)/4, 10))
				  + 4 * (parseInt((cnt)/4, 10) - parseInt((cnt-1)/4, 10)));
	for(var i=0; i<add; i++) {
		bufs[rows].push(0);
	}

	for(var i=0; i<bufs.length; i++) {
		var len = bufs[i].length + 1;
		bufs[i][PalmKit.DATA_LEN_IDX] = len;
		bufs[i].push(this.generateCRC(bufs[i]));
	}

	if(setZero.set_zero){
		for(var key in hdRemoteData){
			hdRemoteData[key] = [false, null, null, null, null];			
		}
		setZero.set_zero = false;
	} else {
		for(var key in hdRemoteData)
			hdRemoteData[key][PalmKit.FLAG] = false;
	}

	for(var i=0; i<bufs.length; i++){
		for(var d in bufs[i])
			rqLocalData.push(bufs[i][d]);
	}

	console.log(rqLocalData);
	return rqLocalData;
};

Module.prototype.requestRemoteData = function(handler) {
	var rqRemoteData = this.rqRemoteData;
	if(this.receiveData.length < PalmKit.MIN_LEN) return;
	while(this.receiveData.length >= PalmKit.MIN_LEN) {
		var _len = this.receiveData[PalmKit.DATA_LEN_IDX];
		var _data = this.receiveData.splice(0, _len);

		var value;
		var hdLocalData = this.hdLocalData;
		var _type, _idnolen, _crc;
		var data_idx = [PalmKit.DATA_MIN_IDX, 0, 0, 0];

		_type = _data[PalmKit.TYPE_RX_IDX];
		_idnolen = _data.slice(5, 9);
		_crc = _data.pop();

		if(!(_crc == this.generateCRC(_data))) continue;

		for(var i=0; i<PalmKit.PACKET_VALUE_MAX_SIZE; i++) {
			hdLocalData.type[i] = (_type >> (6 - i*2)) & 0x03;
			var idnolen = _idnolen[i];
			hdLocalData.id[i] = (idnolen >> 4) & 0x0f;
			hdLocalData.no[i] = (idnolen >> 2) & 0x03;
			hdLocalData.len[i] = (idnolen & 0x03) + 1;
		}

		for(var i=1; i<PalmKit.PACKET_VALUE_MAX_SIZE; i++) {
			data_idx[i] = data_idx[i-1] + hdLocalData.len[i-1];
		}

		for(var i=0; i<PalmKit.PACKET_VALUE_MAX_SIZE; i++) {
			var data = _data.slice(data_idx[i], data_idx[i] + hdLocalData.len[i]);

			hdLocalData.data[i] = this.convertInteger(data);
		}

		// data input ...
		for(var i=0; i<PalmKit.MAX_NUMBER_OF_MODULES; i++){ 
			var key = InputCMD[this.lsbToMsb2Bit(hdLocalData.type[i]) + hdLocalData.id[i]];
			switch(key) {
				case "NULL": break;
				default: 
					rqRemoteData[key][hdLocalData.no[i]] = hdLocalData.data[i];
					handler.write(key + hdLocalData.no[i], hdLocalData.data[i]);
					//console.log("key: "+ key + hdLocalData.no[i] + " value: " + hdLocalData.data[i]);
				break;
			}
		}

		this.validateReceiveData(); // 함수끝에 삽입
	}
};

Module.prototype.handleLocalData = function(data) {
	Array.prototype.push.apply(this.receiveData, data);
	if(this.receiveData[PalmKit.HEAD1_IDX] != PalmKit.HEAD1 ||
		this.receiveData[PalmKit.HEAD2_IDX] != PalmKit.HEAD2) this.validateReceiveData();
	else {
		var len = this.receiveData[PalmKit.DATA_LEN_IDX];
		if(len < PalmKit.MIN_LEN || len > this.receiveData.length) this.validateReceiveData();
	}
};

Module.prototype.reset = function() {
	var hdRemoteData = this.hdRemoteData;
	var hdLocalData = this.hdLocalData;

	for(var key in hdRemoteData)
		hdRemoteData[key] = [false, null, null, null, null];

	hdLocalData.type = [0, 0, 0, 0];
	hdLocalData.id = [0, 0, 0, 0];
	hdLocalData.no = [0, 0, 0, 0];
	hdLocalData.len = [0, 0, 0, 0];
	hdLocalData.data = [0, 0, 0, 0];
	hdLocalData.crc = 0;
};


Module.prototype.lsbToMsb = function(number){
	var value = parseInt(number, 10);
	value = (value << 4) & 0xF0;
	return value;
};

Module.prototype.lsbToMsb2Bit = function(number){
	var value = parseInt(number, 10);
	value = (value << 4) & 0x30;
	return value;
};

Module.prototype.lsbTo2Bit = function(number) {
	var value = parseInt(number, 10);
	value = (value << 2) & 0x0c;
	return value;
}
	
Module.prototype.lsb2BitExt = function(number) {
	var value = parseInt(number, 10);
	value = value & 0x03;
	return value;
}

Module.prototype.msbToLsb2Bit = function(number){
	var value = parseInt(number, 10);
	value = (value >> 4) & 0x03;
	return value;
};

Module.prototype.convertByteArray = function(number) {
	if(number instanceof Array) {
		var b = new Array(number.length);
		for(var i=0; i<number.length; i++) {
			b[i] = number[i] & 0xff;
		}
		return b;
	} else {
		var b;
		if(this.isBetween(number, -128, 255)) {
			b = [0];
			b[0] = number & 0xff;
		} else if(this.isBetween(number, -32768, 32767)) {
			b = [0, 0];
			for(var i=0; i<b.length; i++) {
				b[i] = (number >> 8*i) & 0xff;
			}
		} else if(this.isBetween(number, -2147483648, 2147483647)) {
			b = [0, 0, 0, 0];
			for(var i=0; i<b.length; i++) {
				b[i] = (number >> 8*i) & 0xff;
			}
		}		
		return b;
	}
};

Module.prototype.isBetween = function(i, min, max) {
    if (i >= min && i <= max)
        return true;
    else
        return false;
};

Module.prototype.generateCRC = function(data){
	var value = 0;
	
	for(var i=0;i<data.length; i++) {
		value ^= data[i];
	}
	var result = value & 0xff;

	return result;
};

Module.prototype.convertInteger = function(arr) {
	var len = arr.length;
	if(len == 1) {
	    return arr[0] & 0xff;
	} else if(len == 2) {
	    var result = 0;
	    for(var i=0; i<len; i++) {
	        result |= (arr[i] & 0xff) << 8*i;
	    }
	    return result & 0xffff;
	} else {
	    var result = 0;
	    for(var i=0; i<len; i++) {
	        result |= (arr[i] & 0xff) << 8*i;
	    }
	    return result & 0xffffffff;
	}
};

Module.prototype.validateReceiveData = function(){
	for(var i=1; i<this.receiveData.length; i++) {
		if(this.receiveData[i] == PalmKit.HEAD1) {
			this.receiveData = this.receiveData.splice(i, this.receiveData.length-i);
			i = 0;
			if(this.receiveData.length < PalmKit.MIN_LEN) {
				this.receiveData = [];
				return;
			} else if(this.receiveData[PalmKit.HEAD2_IDX] == PalmKit.HEAD2) {
				var len = this.receiveData[PalmKit.DATA_LEN_IDX];
				if(len <= this.receiveData.length && len >= PalmKit.MIN_LEN) return; // OK;
				else {
					this.receiveData = [];
					return; // IndexOutofBoundsException, IllegalArgumentException
				}
			} // ok;
			else continue;
		}
	}
	this.receiveData = [];
};

module.exports = new Module();
