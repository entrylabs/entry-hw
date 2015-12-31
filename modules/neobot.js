function Module() {
	this.digitalValue = new Array(14);
	this.remoteBuffer = new Array(8);
	this.localBuffer = {
		"1" : 0,
	    "2" : 0,
	    "3" : 0,
	    "SERVO1" : 0,
	    "SERVO2" : 0,
	    "SERVO1_SPEED" : 0,
	    "SERVO2_SPEED" : 0,
	    "LMOT" : 0,
	    "RMOT" : 0,
		"note" : 0,
		"octave" : 0,
		"duration" : 0,
		"sound_check" : 0
	};
	this.send_cnt = 0;

	this.melodySended = true;
	this.motorSended = true;
	this.servo1Sended = true;
	this.servo2Sended = true;
}


Module.prototype.PORT_MAP = [
    "1",
    "2",
    "3",
    "SERVO1",
    "SERVO2",
    "SERVO1_SPEED",
    "SERVO2_SPEED",
    "LMOT",
    "RMOT",
	"note",
	"octave",
	"duration",
	"sound_check"
];

Module.prototype.NOTE_MAP = [
    "note",
	"octave",
	"duration",
	"sound_check"
];

Module.prototype.MOTOR_MAP = [
    "LMOT",
	"RMOT"
];

Module.prototype.SERVO1_MAP = [
    "SERVO1",
    "SERVO1_SPEED",

];
Module.prototype.SERVO2_MAP = [
    "SERVO2",
    "SERVO2_SPEED"
];



Module.prototype.init = function(handler, config) {
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
	// console.log('hhh');
	var buffer = this.localBuffer;

	for (var i = 0; i < this.PORT_MAP.length; i++ ) {
		var port = this.PORT_MAP[i];
		var value = Number(handler.read(port));
		if (value === undefined)
			continue;

		if(this.NOTE_MAP.indexOf(port) > -1) {
			if (buffer[port] !== value)
				this.melodySended = false;
		}
		if(this.MOTOR_MAP.indexOf(port) > -1) {
			if (buffer[port] !== value)
				this.motorSended = false;
		}
		if(this.SERVO1_MAP.indexOf(port) > -1) {
			if (buffer[port] !== value)
				this.servo1Sended = false;
		}
		if(this.SERVO2_MAP.indexOf(port) > -1) {
			if (buffer[port] !== value)
				this.servo2Sended = false;
		}
		buffer[port] = value;
	}
};

Module.prototype.requestRemoteData = function(handler) {
	// console.log('rr');
	var buffer = this.remoteBuffer;
	for(var i = 0; i < 8; i = i + 2) {
		handler.write(buffer[i], buffer[i + 1]);
	}
};

Module.prototype.requestLocalData = function() {
	var send_data = [];
	var buffer = this.localBuffer;

	if (!this.melodySended) {
		send_data.push(0x90 + buffer.note);
		send_data.push(16 * buffer.duration + buffer.octave);
		this.melodySended = true;
	}

	if (!this.motorSended) {
		if(buffer.LMOT > 0 && buffer.RMOT > 0) {
			send_data.push(0x41); 
			send_data.push(16 * buffer.LMOT + buffer.RMOT);
		} else if(buffer.LMOT < 0 && buffer.RMOT < 0){
			send_data.push(0x42); 
			send_data.push(- 16 * buffer.LMOT - buffer.RMOT);
		} else if (buffer.LMOT === 0) {
			send_data.push(0x40 + (buffer.RMOT > 0 ? 1 : 2));
			send_data.push(Math.abs(buffer.RMOT));
		} else if (buffer.RMOT === 0) {
			send_data.push(0x40 + (buffer.LMOT > 0 ? 1 : 2));
			send_data.push(16 * Math.abs(buffer.LMOT));
		} else {
			var direction = 0;
			var speed = 0;
			if(buffer.LMOT > buffer.RMOT) 
			{
				direction = 4;
				speed = buffer.LMOT;
			} else {
				direction = 3;
				speed = buffer.RMOT;
			}
			send_data.push(16 * 5 + direction); 
			send_data.push(16 * speed);
		}
		this.motorSended = true;
	}

	if (!this.servo1Sended) {
		send_data.push(0x60 + buffer.SERVO1_SPEED);
		send_data.push(buffer.SERVO1);
		this.servo1Sended = true;
	}

	if (!this.servo2Sended) {
		send_data.push(0x70 + buffer.SERVO2_SPEED);
		send_data.push(buffer.SERVO2);
		this.servo2Sended = true;
	}

	if(send_data.length > 0) {
		send_data.unshift(send_data.length);
		send_data.unshift(0xaa);
	} else {
		send_data = null;	
	}

	return send_data;
};

Module.prototype.handleLocalData = function(data) { // data: Native Buffer
	// console.log('hh');

	var buffer = this.remoteBuffer;

	if(data && data.length == 8) {
		for(var i = 0; i < 8; ++i) {
			buffer[i] = data[i];
		}
	}
};

Module.prototype.reset = function() {
	this.localBuffer = {
		"1" : 0,
	    "2" : 0,
	    "3" : 0,
	    "SERVO1" : 0,
	    "SERVO2" : 0,
	   	"SERVO1_SPEED" : 0,
	    "SERVO2_SPEED" : 0,
	    "LMOT" : 0,
	    "RMOT" : 0,
		"note" : 0,
		"octave" : 0,
		"duration" : 0,
		"sound_check" : 0
	};
};

module.exports = new Module();
