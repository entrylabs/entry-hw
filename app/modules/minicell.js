function Module() {
	this.hdLocalData = { // 12byte 배열 데이터 INDEX별 임시 저장 버퍼
		type: [0, 0, 0, 0],
		id: [0, 0, 0, 0],
		no: [0, 0, 0, 0],
		len: [0, 0, 0, 0],
		data: [0, 0, 0, 0]
	};
	this.hdRemoteData = { // HCell로 보내는 데이터 객체. true = 전송 전, false = 전송 후
		TIME:[false, null, null, null, null],
		DC_MOTOR:[false, null, null, null, null],
		SERVO_MOTOR:[false, null, null, null, null],
		BUZZER:[false, null, null, null, null],
		LED_R:[false, null, null, null, null],
		LED_G:[false, null, null, null, null],
		LED_B:[false, null, null, null, null],
		ALL_OFF: [false, null, null, null, null]
	};
	this.rqRemoteData = { // 엔트리로 보내는 데이터 객체. Backup 용으로 현재 저장기능만 수행.
		IR:[null, null, null, null],
		CDS:[null, null, null, null],
		POT:[null, null, null, null],
		TACT_SWITCH:[null, null, null, null],
	};
	this.setZero = { // 엔트리 스크립트 종료시 true로 변경. hdRemoteData 객체 초기화.
		set_zero: false
	};
	this.receiveData = []; // HCell에서 올라온 데이터를 저장하는 임시 버퍼
}

var Minicell = {
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
	0x11: "IR", // 바닥감지센서
	0x16: "CDS", // 조도센서
	0x1d: "POT", // 가변저항
	0x1e: "TACT_SWITCH", // 버튼
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
	if(handler.e(Minicell.STOP) && ((!hdRemoteData.DC_MOTOR[Minicell.FLAG]) || (!hdRemoteData.SERVO_MOTOR[Minicell.FLAG]))) {
		buf = handler.read(Minicell.STOP);
		if(hdRemoteData.DC_MOTOR[1]!=0 || hdRemoteData.DC_MOTOR[2]!=0 || hdRemoteData.DC_MOTOR[3]!=0 || hdRemoteData.DC_MOTOR[4]!=0) {
			hdRemoteData.DC_MOTOR[Minicell.FLAG] = true;
			for(var i=0; i<Minicell.MAX_NUMBER_OF_MODULES; i++)
				hdRemoteData.DC_MOTOR[i+1] = 0;
		}
		if(hdRemoteData.SERVO_MOTOR[1]!=0 || hdRemoteData.SERVO_MOTOR[2]!=0 || hdRemoteData.SERVO_MOTOR[3]!=0 || hdRemoteData.SERVO_MOTOR[4]!=0) {
			hdRemoteData.SERVO_MOTOR[Minicell.FLAG] = true;
			for(var i=0; i<Minicell.MAX_NUMBER_OF_MODULES; i++)
				hdRemoteData.SERVO_MOTOR[i+1] = 0xff;
		}
	} 
	if(handler.e(Minicell.DC_MOTOR)) {
		buf = handler.read(Minicell.DC_MOTOR);
		var value = new Array();
		value.push(buf.dir);
		value.push(buf.speed); 
		if(JSON.stringify(hdRemoteData.DC_MOTOR[buf.idx]) !== JSON.stringify(value) 
			&& (!hdRemoteData.DC_MOTOR[Minicell.FLAG])) {
			hdRemoteData.DC_MOTOR[Minicell.FLAG] = true;
			hdRemoteData.DC_MOTOR[buf.idx] = value;
		}
	} 
	if(handler.e(Minicell.SERVO_MOTOR)) {
		buf = handler.read(Minicell.SERVO_MOTOR);
		var value = new Array();
		value.push(buf.angle);
		value.push(buf.speed); 
		if(JSON.stringify(hdRemoteData.SERVO_MOTOR[buf.idx]) !== JSON.stringify(value) 
			&& (!hdRemoteData.DC_MOTOR[Minicell.FLAG])) {
			hdRemoteData.SERVO_MOTOR[Minicell.FLAG] = true;
			hdRemoteData.SERVO_MOTOR[buf.idx] = value;
		}
	} 
	if(handler.e(Minicell.BUZZER)) {
		buf = handler.read(Minicell.BUZZER);
		if(hdRemoteData.BUZZER[buf.idx]!=buf.value && (!hdRemoteData.BUZZER[Minicell.FLAG])) {
			hdRemoteData.BUZZER[Minicell.FLAG] = true;
			hdRemoteData.BUZZER[buf.idx] = buf.value;	
		}
	} 
	if(handler.e(Minicell.LED_R)) {
		buf = handler.read(Minicell.LED_R);
		if(hdRemoteData.LED_R[buf.idx]!=buf.value_r && (!hdRemoteData.LED_R[Minicell.FLAG])) {
			hdRemoteData.LED_R[Minicell.FLAG] = true;
			hdRemoteData.LED_R[buf.idx] = buf.value_r;
		}
	}
	if(handler.e(Minicell.LED_G)) {
		buf = handler.read(Minicell.LED_G);
		if(hdRemoteData.LED_G[buf.idx]!=buf.value_g && (!hdRemoteData.LED_G[Minicell.FLAG])) {
			hdRemoteData.LED_G[Minicell.FLAG] = true;
			hdRemoteData.LED_G[buf.idx] = buf.value_g;
		}
	}
	if(handler.e(Minicell.LED_B)) {
		buf = handler.read(Minicell.LED_B);
		if(hdRemoteData.LED_B[buf.idx]!=buf.value_b && (!hdRemoteData.LED_B[Minicell.FLAG])) {
			hdRemoteData.LED_B[Minicell.FLAG] = true;
			hdRemoteData.LED_B[buf.idx] = buf.value_b;
		}
	}

	if(handler.e(Minicell.SET_ZERO)) { // Always footer position in handleRemoteData function
		setZero.set_zero = true;
		hdRemoteData.ALL_OFF[Minicell.FLAG] = true;
		hdRemoteData.ALL_OFF[1] = 0;
	}
};

Module.prototype.requestLocalData = function() {
	var rqLocalData = new Array();
	var hdRemoteData = this.hdRemoteData;
	var setZero = this.setZero;
	var cnt = 0, index = 0, rowLength; 
	
	for(var key in hdRemoteData) {
		if(hdRemoteData[key][Minicell.FLAG]) {
			for(var i=1; i<Minicell.MAX_NUMBER_OF_MODULES+1; i++) {
				if(hdRemoteData[key][i] != null)
					cnt += 1;
			}
		}
	}
	if(cnt == 0) return;
	var bufs = new Array();
	var rowLength = parseInt((cnt-1)/Minicell.MAX_NUMBER_OF_MODULES)+1;

	for(var i=0; i<rowLength; i++)
		bufs[i] = [	Minicell.HEAD1, Minicell.HEAD2, 
					0, 0, // TYPE_RX, TYPE_TX
					0, // DATA_LENGTH
					0, 0, 0, 0]; // ID,NO,LEN[1 ~ 4]

	for(var key in hdRemoteData) {
		if(!hdRemoteData[key][Minicell.FLAG])
			continue;
		for(var i=1; i<5; i++) {
			if(hdRemoteData[key][i] != null) {
				var rows = parseInt(index/Minicell.MAX_NUMBER_OF_MODULES),
					cols = index % Minicell.MAX_NUMBER_OF_MODULES;
				bufs[rows][Minicell.TYPE_TX_IDX] |= (this.msbToLsb2Bit(OutputCMD[key]) << (6 - cols*2));
				var data = hdRemoteData[key][i];
				var bb = this.convertByteArray(data);
				bufs[rows][Minicell.IDNOLEN_IDX[cols]] = this.lsbToMsb(OutputCMD[key]) + this.lsbTo2Bit(i-1) + this.lsb2BitExt(bb.length - 1);
				for(var j=0; j<bb.length; j++) {
					bufs[rows].push(bb[j]);
				}
				index += 1;
			}
		}
	}

	var rows = parseInt((cnt - 1) / Minicell.PACKET_VALUE_MAX_SIZE);
	var add = 4 - parseInt(1 * (parseInt((cnt+3)/4) - parseInt((cnt+2)/4))
				  + 2 * (parseInt((cnt+2)/4) - parseInt((cnt+1)/4))
				  + 3 * (parseInt((cnt+1)/4) - parseInt((cnt)/4))
				  + 4 * (parseInt((cnt)/4) - parseInt((cnt-1)/4)));
	for(var i=0; i<add; i++) {
		bufs[rows].push(0);
	}

	for(var i=0; i<bufs.length; i++) {
		var len = bufs[i].length + 1;
		bufs[i][Minicell.DATA_LEN_IDX] = len;
		bufs[i].push(this.generateCRC(bufs[i]));
	}

	if(setZero.set_zero){
		for(var key in hdRemoteData){
			hdRemoteData[key] = [false, null, null, null, null];			
		}
		setZero.set_zero = false;
	} else {
		for(var key in hdRemoteData)
			hdRemoteData[key][Minicell.FLAG] = false;
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
	if(this.receiveData.length < Minicell.MIN_LEN) return;
	while(this.receiveData.length >= Minicell.MIN_LEN) {
		var _len = this.receiveData[Minicell.DATA_LEN_IDX];
		var _data = this.receiveData.splice(0, _len);

		var value;
		var hdLocalData = this.hdLocalData;
		var _type, _idnolen, _crc;
		var data_idx = [Minicell.DATA_MIN_IDX, 0, 0, 0];

		_type = _data[Minicell.TYPE_RX_IDX];
		_idnolen = _data.slice(5, 9);
		_crc = _data.pop();

		if(!(_crc == this.generateCRC(_data))) continue;

		for(var i=0; i<Minicell.PACKET_VALUE_MAX_SIZE; i++) {
			hdLocalData.type[i] = (_type >> (6 - i*2)) & 0x03;
			var idnolen = _idnolen[i];
			hdLocalData.id[i] = (idnolen >> 4) & 0x0f;
			hdLocalData.no[i] = (idnolen >> 2) & 0x03;
			hdLocalData.len[i] = (idnolen & 0x03) + 1;
		}

		for(var i=1; i<Minicell.PACKET_VALUE_MAX_SIZE; i++) {
			data_idx[i] = data_idx[i-1] + hdLocalData.len[i-1];
		}

		for(var i=0; i<Minicell.PACKET_VALUE_MAX_SIZE; i++) {
			var data = _data.slice(data_idx[i], data_idx[i] + hdLocalData.len[i]);

			hdLocalData.data[i] = this.convertInteger(data);
		}

		// data input ...
		for(var i=0; i<Minicell.MAX_NUMBER_OF_MODULES; i++){ 
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
	if(this.receiveData[Minicell.HEAD1_IDX] != Minicell.HEAD1 ||
		this.receiveData[Minicell.HEAD2_IDX] != Minicell.HEAD2) this.validateReceiveData();
	else {
		var len = this.receiveData[Minicell.DATA_LEN_IDX];
		if(len < Minicell.MIN_LEN || len > this.receiveData.length) this.validateReceiveData();
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

Module.prototype.lsb4BitExt = function(number){
	var value = parseInt(number);
	value = value & 0x0F;
	return value;
};

Module.prototype.lsbToMsb = function(number){
	var value = parseInt(number);
	value = (value << 4) & 0xF0;
	return value;
};

Module.prototype.lsbToMsb2Bit = function(number){
	var value = parseInt(number);
	value = (value << 4) & 0x30;
	return value;
};

Module.prototype.lsbTo2Bit = function(number) {
	var value = parseInt(number);
	value = (value << 2) & 0x0c;
	return value;
}
	
Module.prototype.lsb2BitExt = function(number) {
	var value = parseInt(number);
	value = value & 0x03;
	return value;
}

Module.prototype.msbToLsb2Bit = function(number){
	var value = parseInt(number);
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
		if(this.receiveData[i] == Minicell.HEAD1) {
			this.receiveData = this.receiveData.splice(i, this.receiveData.length-i);
			i = 0;
			if(this.receiveData.length < Minicell.MIN_LEN) {
				this.receiveData = [];
				return;
			} else if(this.receiveData[Minicell.HEAD2_IDX] == Minicell.HEAD2) {
				var len = this.receiveData[Minicell.DATA_LEN_IDX];
				if(len <= this.receiveData.length && len >= Minicell.MIN_LEN) return; // OK;
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
