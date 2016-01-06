function Module() {
	this.initialBuffer = new Array(6);
	this.sendBuffer = new Array(10);
	this.receiveBuffer = new Array(10);
	
	for(var i = 0; i < 10; ++i) {
		this.sendBuffer[i] = 0;
	}
	
	this.initialBuffer[0] = 0xAA; // header1
	this.initialBuffer[1] = 0x55; // header2
	this.initialBuffer[2] = 0x01; // command
	this.initialBuffer[3] = 0x00; // length
	this.initialBuffer[4] = 0x0D; // tail1
	this.initialBuffer[5] = 0x0A; // tail2
	
	this.sendBuffer[0] = 0xAA; // header1
	this.sendBuffer[1] = 0x55; // header2
	this.sendBuffer[2] = 0x02; // command
	this.sendBuffer[3] = 4; // length
	this.sendBuffer[8] = 0x0D; // tail1
	this.sendBuffer[9] = 0x0A; // tail2
	
	this.sensory = {
		ir1: 0,
		ir2: 0
	};
	this.packetPos = 0;
	this.state = 0;
	this.length = 0;
	this.command = 0;
}

Module.prototype.init = function(handler, config) {
};

Module.prototype.requestInitialData = function() {
	return this.initialBuffer;
};

Module.prototype.checkInitialData = function(data, config) {
	if(data.length >= 8 && data[0] === 0xAA && data[1] === 0x55 && data[2] == 0x01 && data[3] == 0x02 && data[4] == 0x04 && data[5] == 0x01 && data[6] === 0x0D && data[7] === 0x0A) {
		return true;
	}
};

Module.prototype.handleRemoteData = function(handler) {
	var buffer = this.sendBuffer;
	var value = handler.read('led1');
	if(value !== undefined) {
		buffer[4] = value;
	}
	value = handler.read('led2');
	if(value !== undefined) {
		buffer[5] = value;
	}
};

Module.prototype.requestLocalData = function() {
	return this.sendBuffer;
};

Module.prototype.handleReceived = function() {
	var buffer = this.receiveBuffer;
	if(this.length === 4) {
		var sensory = this.sensory;
		sensory.ir1 = buffer[0];
		sensory.ir2 = buffer[1];
	}
};

Module.prototype.handleLocalData = function(data) { // data: Native Buffer
	if(data && data.length > 0) {
		var bufferLength = this.receiveBuffer.length;
		var c;
		for(var i = 0, len = data.length; i < len; ++i) {
			c = data[i];
			switch(this.state) {
				case 0: // STATE_IDLE
					if(c == 0xAA) // HEADER1
						this.state = 1; // STATE_HEADER
					break;
				case 1: // STATE_HEADER
					if(c == 0x55) // HEADER2
						this.state = 2; // STATE_COMMAND
					else
						this.state = 0; // STATE_IDLE
					break;
				case 2: // STATE_COMMAND
					this.command = c;
					this.state = 3; // STATE_LENGTH
					break;
				case 3: // STATE_LENGTH
					this.length = c;
					this.state = 4; // STATE_DATA
					this.packetPos = 0;
					break;
				case 4: // STATE_DATA
					if(this.packetPos >= bufferLength) {
						this.packetPos = 0;
						this.state = 0; // STATE_IDLE
					} else if(this.packetPos < this.length) {
						this.receiveBuffer[this.packetPos++] = c;
					} else if(c == 0x0D) { // TAIL1
						this.state = 5; // STATE_TAIL
					} else {
						this.packetPos = 0;
						this.state = 0; // STATE_IDLE
					}
					break;
				case 5: // STATE_TAIL
					if(c == 0x0A) { // TAIL2
						this.packetPos = 0;
						this.state = 0; // STATE_IDLE
						this.handleReceived();
					} else {
						this.packetPos = 0;
						this.state = 0; // STATE_IDLE
					}
					break;
				default:
					this.packetPos = 0;
					this.state = 0; // STATE_IDLE
					break;
			}
		}
	}
};

Module.prototype.requestRemoteData = function(handler) {
	var sensory = this.sensory;
	handler.write('ir1', sensory.ir1);
	handler.write('ir2', sensory.ir2);
};

Module.prototype.reset = function() {
	this.sendBuffer[4] = 0;
	this.sendBuffer[5] = 0;
	this.sendBuffer[6] = 0;
	this.sendBuffer[7] = 0;
};

module.exports = new Module();