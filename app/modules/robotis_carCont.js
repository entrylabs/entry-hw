function Module() {
    isReadDataArrived = true;
    isConnected = true;
	this.addressToRead = [];
	this.varTimeout = null;

	this.prevInstruction = 0;
	this.prevAddress = [];
	this.prevLength = [];
	this.prevValue = [];

	this.receiveBuffer = [];	// buffer to receive from H/W
	this.dataBuffer = [];		// saved sensor value buffer
	this.robotisBuffer = [];	// buffer to save 'ROBOTIS_DATA'
	this.receiveAddress = -1;	// to check read packet
	this.receiveLength = -1;	// to check read packet
	this.defaultLength = -1;	// to check read packet
}

Module.prototype.init = function(handler, config) {
};

Module.prototype.lostController = function(self, callback) {
	self.timer = setInterval(function() {
		if (self.connected) {
			if (self.received == false) {
				if (isConnected == false) {
					self.connected = false;
					if (callback) {
						callback('lost');
					}
				}
				isConnected = false;
			}
			self.received = false;
		}
	}, 1000);
};

Module.prototype.requestInitialData = function() {
	isReadDataArrived = true;
	isConnected = true;
	this.addressToRead = [];
	this.varTimeout = null;

	this.prevInstruction = 0;
	this.prevAddress = [];
	this.prevLength = [];
	this.prevValue = [];

	this.receiveBuffer = [];
	this.dataBuffer = [];
	this.robotisBuffer = [];
	this.receiveAddress = -1;
	this.receiveLength = -1;
	this.defaultLength = -1;

	// car_cont, get sensor state of right touch.
	// return this.readPacket(200, 69, 1);

	// openC7.0, get sensor state of user button state.
	// this.robotisBuffer.push([INST_READ, 26, 1, 0]);
	// return this.readPacket(200, 26, 1);

	// ping : 0xFF, 0xFF, 0xFD, 0x00, 0xC8, 0x03, 0x00, 0x01, 0x3B, 0xFA

	this.robotisBuffer.push([INST_READ, 87, 1, 0], [INST_READ, 87, 1, 0]);
	return this.readPacket(200, 87, 1);
};

Module.prototype.checkInitialData = function(data, config) {
	return true;
};

Module.prototype.validateLocalData = function(data) {
	return true;
};

Module.prototype.requestRemoteData = function(handler) {
	for (var indexA = 0; indexA < this.dataBuffer.length; indexA++) {
		if (this.dataBuffer[indexA] != undefined) {
			handler.write(indexA, this.dataBuffer[indexA]);
		}
	}
};

Module.prototype.handleRemoteData = function(handler) {
	var data = handler.read('ROBOTIS_DATA');
	var setZero = handler.read('setZero');
/*
	if (setZero[0] == 1) {
		this.robotisBuffer = [];
	}
*/
	for (var index = 0; index < data.length; index++) {
		var instruction = data[index][0];
		var address = data[index][1];
		var length = data[index][2];
		var value = data[index][3];

		var doSend = false;

		if (instruction == INST_NONE) {
			doSend = false;
		// }else if (isReadDataArrived == false) {//TODO
			// dosend = false;
		}else if (instruction == INST_READ) {
			if (isReadDataArrived == false &&
				this.prevInstruction == INST_READ &&
				this.prevAddress == address &&
				this.prevLength == length &&
				this.prevValue == value) {
					doSend = false;
			} else {
				doSend = true;
			}
		} else if (instruction == INST_WRITE) {
			if (this.prevInstruction == INST_WRITE &&
				this.prevAddress == address &&
				this.prevLength == length &&
				this.prevValue == value) {
					doSend = false;
			} else {
				doSend = true;
			}
		}

		//if (doSend) {
			// if (this.robotisBuffer.length > 10) {
				// doSend = false;
			// } else {
            /*
				for (var indexA = 0; indexA < this.robotisBuffer.length; indexA++) {
					if (data[index][0] == this.robotisBuffer[indexA][0] &&
						data[index][1] == this.robotisBuffer[indexA][1] &&
						data[index][2] == this.robotisBuffer[indexA][2] &&
						data[index][3] == this.robotisBuffer[indexA][3]) {
						doSend = false;
						break;
					}
				}
                */
			// }
		//}

        if (setZero[0] == 1) {
            doSend = true;
        }
		// console.log('=> ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getMilliseconds() + '\n'
				  // + instruction + ', ' +
					// address + ', ' +
					// length + ', ' +
					// doSend + ', ' +
					// data.length);

		if (!doSend) {
			continue;
		}

		if (setZero[0] == 1) {
			this.prevInstruction = 0;
			this.prevAddress = [];
			this.prevLength = [];
			this.prevValue = [];
		} else {
			this.prevInstruction = instruction;
			this.prevAddress = address;
			this.prevLength = length;
			this.prevValue = value;
		}

		if (instruction == INST_WRITE) {
			this.robotisBuffer.push(data[index]);
		} else if (instruction == INST_READ) {
			if (this.addressToRead[address] == undefined || this.addressToRead[address] == 0) {
				this.addressToRead[address] = 1;
				this.robotisBuffer.push(data[index]);
			} else {
				// 10번 이상 읽지 못한다면 에러이므로 강제로 읽을 수 있도록 처리
				this.addressToRead[address] += 1;
				if (this.addressToRead[address] >= 10) {
					this.addressToRead[address] = 0;
				}
			}
		}
	}
};

Module.prototype.requestLocalData = function() {
	var sendBuffer = null;
	var dataLength = 0;

	// console.log('requestLocalData : ' + isReadDataArrived + ', ' + this.robotisBuffer);
	if (isReadDataArrived == false) {
		return sendBuffer;
	}

	/////////////////
	if (!isConnected) {
		this.receiveAddress = -1;
		return this.readPacket(200, 87, 1);
	}

	var data = this.robotisBuffer.shift();
	if (data == null) {
		// this.receiveAddress = -1;
		// return this.readPacket(200, 87, 1);
		return sendBuffer;
	}

	var instruction = data[0];
	var address = data[1];
	var length = data[2];
	var value = data[3];

	if (instruction == INST_WRITE) {
		if (length == 1) {
			sendBuffer = this.writeBytePacket(200, address, value);
		} else if (length == 2) {
            sendBuffer = this.writeWordPacket(200, address, value);
	    } else {
            sendBuffer = this.writeDWordPacket(200, address, value);
	    }

	} else if (instruction == INST_READ) {
		this.addressToRead[address] = 0;
		sendBuffer = this.readPacket(200, address, length);
	}

	if (sendBuffer[0] == 0xFF &&
		sendBuffer[1] == 0xFF &&
		sendBuffer[2] == 0xFD &&
		sendBuffer[3] == 0x00 &&
		sendBuffer[4] == 0xC8) {
		dataLength = this.makeWord(sendBuffer[5], sendBuffer[6]);

		if (sendBuffer[7] == 0x02) {
			// this.receiveAddress = this.makeWord(sendBuffer[8], sendBuffer[9]);
			this.receiveAddress = address;
			this.receiveLength = length;
			this.defaultLength = data[4];
			isReadDataArrived = false;

			if (this.varTimeout != null) {
				clearTimeout(this.varTimeout);
			}

			this.varTimeout = setTimeout(function() {
				isReadDataArrived = true;
				// console.log('!! ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getMilliseconds() + ' !!' + '\n'
					// + isReadDataArrived);
			}, 100);
		}
	}

	// if (sendBuffer != null) {
		// console.log('>> ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getMilliseconds() + '\n'
			 // + sendBuffer + '(' + this.robotisBuffer.length + ')');
	// }

	return sendBuffer;
};

Module.prototype.handleLocalData = function(data) { // data: Native Buffer
	for (var i = 0; i < data.length; i++) {
		this.receiveBuffer.push(data[i]);
	}

	if (this.receiveBuffer.length >= 11 + this.receiveLength) {
		isConnected = true;
		// console.log('<< 1 : ' + this.receiveLength + ' : ' + this.receiveBuffer);

		// while (this.receiveBuffer.length > 0) {
		while (this.receiveBuffer.length >= 11 + this.receiveLength) {
			if (this.receiveBuffer.shift() == 0xFF) {
				if (this.receiveBuffer.shift() == 0xFF) {
					if (this.receiveBuffer.shift() == 0xFD) {
						if (this.receiveBuffer.shift() == 0x00) {
							if (this.receiveBuffer.shift() == 0xC8) {
								var packetLength = this.makeWord(this.receiveBuffer.shift(), this.receiveBuffer.shift());
								// if (packetLength > 4) {
								// console.log("?? : " + this.receiveLength + ' / ' + (packetLength - 4));
								if (this.receiveLength == (packetLength - 4)) {
									this.receiveBuffer.shift(); // take 0x55 - status check byte
									this.receiveBuffer.shift(); // take 0x00 - error check byte

									var valueLength = packetLength - 4;
									var returnValue = [];

									for (var index = 0; index < valueLength / this.defaultLength; index++) {
										if (this.defaultLength == 1) {
											returnValue.push(this.receiveBuffer.shift());
										} else if (this.defaultLength == 2) {
											returnValue.push(this.receiveBuffer.shift() | (this.receiveBuffer.shift() << 8));
										} else if (this.defaultLength == 4) {
											returnValue.push(this.receiveBuffer.shift() | (this.receiveBuffer.shift() << 8) | (this.receiveBuffer.shift() << 16) | (this.receiveBuffer.shift() << 24));
										}
									}

									if (this.receiveAddress != -1) {
										if (this.varTimeout != null) {
											clearTimeout(this.varTimeout);
										}

										for (var index = 0; index < returnValue.length; index++) {
											this.dataBuffer[this.receiveAddress + index * this.defaultLength] = returnValue[index];
										}

										isReadDataArrived = true;
										// console.log('<- ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getMilliseconds() + '\n'
										 // + this.receiveAddress + ' : ' + returnValue);
									} else {
										// console.log('<- ' + new Date().getHours() + ':' + new Date().getMinutes() + ':' + new Date().getMilliseconds() + '\n' + '-1');
									}

									this.receiveBuffer.shift(); // take crc check byte
									this.receiveBuffer.shift(); // take crc check byte

									// break because this packet has no error.
									break;
								} else {
									for (var i = 0; i < packetLength; i++) {
										this.receiveBuffer.shift(); // take bytes of write status
									}
								}
							}
						}
					}
				}
			}

			// if (this.receiveBuffer.length > 0) {
				// this.receiveBuffer.shift();
			// }
		}

		// console.log('data check 2 : ' + data.length + ' / ' + this.receiveBuffer.length);
		// console.log('<< 2 : ' + this.receiveBuffer);
	}
};

Module.prototype.reset = function() {
	// console.log('reset');

	this.addressToRead = [];
	this.varTimeout = null;

	this.prevInstruction = 0;
	this.prevAddress = [];
	this.prevLength = [];
	this.prevValue = [];

	this.receiveBuffer = [];
	this.dataBuffer = [];
	this.robotisBuffer = [];
	this.receiveAddress = -1;
	this.receiveLength = -1;
	this.defaultLength = -1;
};

module.exports = new Module();

var INST_NONE = 0;
var INST_READ = 2;
var INST_WRITE = 3;

var isReadDataArrived = true;
var isConnected = true;

Module.prototype.writeBytePacket = function(id, address, value) {
	var packet = [];
	packet.push(0xff);
	packet.push(0xff);
	packet.push(0xfd);
	packet.push(0x00);
	packet.push(id);
	packet.push(0x06);
	packet.push(0x00);
	packet.push(INST_WRITE);
	packet.push(this.getLowByte(address));
	packet.push(this.getHighByte(address));
	packet.push(value);
    var crc = this.updateCRC(0, packet, packet.length);
    packet.push(this.getLowByte(crc));
    packet.push(this.getHighByte(crc));
	return packet;
};

Module.prototype.writeWordPacket = function(id, address, value) {
	var packet = [];
	packet.push(0xff);
	packet.push(0xff);
	packet.push(0xfd);
	packet.push(0x00);
	packet.push(id);
	packet.push(0x07);
	packet.push(0x00);
	packet.push(INST_WRITE);
	packet.push(this.getLowByte(address));
	packet.push(this.getHighByte(address));
	packet.push(this.getLowByte(value));
	packet.push(this.getHighByte(value));
    var crc = this.updateCRC(0, packet, packet.length);
    packet.push(this.getLowByte(crc));
    packet.push(this.getHighByte(crc));
	return packet;
};

Module.prototype.writeDWordPacket = function(id, address, value) {
	var packet = [];
	packet.push(0xff);
	packet.push(0xff);
	packet.push(0xfd);
	packet.push(0x00);
	packet.push(id);
	packet.push(0x09);
	packet.push(0x00);
	packet.push(INST_WRITE);
	packet.push(this.getLowByte(address));
	packet.push(this.getHighByte(address));
	packet.push(this.getLowByte(this.getLowWord(value)));
	packet.push(this.getHighByte(this.getLowWord(value)));
	packet.push(this.getLowByte(this.getHighWord(value)));
	packet.push(this.getHighByte(this.getHighWord(value)));
    var crc = this.updateCRC(0, packet, packet.length);
    packet.push(this.getLowByte(crc));
    packet.push(this.getHighByte(crc));
	return packet;
};

Module.prototype.readPacket = function(id, address, lengthToRead) {
	var packet = [];
	packet.push(0xff);
	packet.push(0xff);
	packet.push(0xfd);
	packet.push(0x00);
	packet.push(id);
	packet.push(0x07);
	packet.push(0x00);
	packet.push(INST_READ);
	packet.push(this.getLowByte(address));
	packet.push(this.getHighByte(address));
	packet.push(this.getLowByte(lengthToRead));
	packet.push(this.getHighByte(lengthToRead));
    var crc = this.updateCRC(0, packet, packet.length);
    packet.push(this.getLowByte(crc));
    packet.push(this.getHighByte(crc));
	return packet;
};

var crc_table = [0x0000,
		0x8005, 0x800F, 0x000A, 0x801B, 0x001E, 0x0014, 0x8011,
		0x8033, 0x0036, 0x003C, 0x8039, 0x0028, 0x802D, 0x8027,
		0x0022, 0x8063, 0x0066, 0x006C, 0x8069, 0x0078, 0x807D,
		0x8077, 0x0072, 0x0050, 0x8055, 0x805F, 0x005A, 0x804B,
		0x004E, 0x0044, 0x8041, 0x80C3, 0x00C6, 0x00CC, 0x80C9,
		0x00D8, 0x80DD, 0x80D7, 0x00D2, 0x00F0, 0x80F5, 0x80FF,
		0x00FA, 0x80EB, 0x00EE, 0x00E4, 0x80E1, 0x00A0, 0x80A5,
		0x80AF, 0x00AA, 0x80BB, 0x00BE, 0x00B4, 0x80B1, 0x8093,
		0x0096, 0x009C, 0x8099, 0x0088, 0x808D, 0x8087, 0x0082,
		0x8183, 0x0186, 0x018C, 0x8189, 0x0198, 0x819D, 0x8197,
		0x0192, 0x01B0, 0x81B5, 0x81BF, 0x01BA, 0x81AB, 0x01AE,
		0x01A4, 0x81A1, 0x01E0, 0x81E5, 0x81EF, 0x01EA, 0x81FB,
		0x01FE, 0x01F4, 0x81F1, 0x81D3, 0x01D6, 0x01DC, 0x81D9,
		0x01C8, 0x81CD, 0x81C7, 0x01C2, 0x0140, 0x8145, 0x814F,
		0x014A, 0x815B, 0x015E, 0x0154, 0x8151, 0x8173, 0x0176,
		0x017C, 0x8179, 0x0168, 0x816D, 0x8167, 0x0162, 0x8123,
		0x0126, 0x012C, 0x8129, 0x0138, 0x813D, 0x8137, 0x0132,
		0x0110, 0x8115, 0x811F, 0x011A, 0x810B, 0x010E, 0x0104,
		0x8101, 0x8303, 0x0306, 0x030C, 0x8309, 0x0318, 0x831D,
		0x8317, 0x0312, 0x0330, 0x8335, 0x833F, 0x033A, 0x832B,
		0x032E, 0x0324, 0x8321, 0x0360, 0x8365, 0x836F, 0x036A,
		0x837B, 0x037E, 0x0374, 0x8371, 0x8353, 0x0356, 0x035C,
		0x8359, 0x0348, 0x834D, 0x8347, 0x0342, 0x03C0, 0x83C5,
		0x83CF, 0x03CA, 0x83DB, 0x03DE, 0x03D4, 0x83D1, 0x83F3,
		0x03F6, 0x03FC, 0x83F9, 0x03E8, 0x83ED, 0x83E7, 0x03E2,
		0x83A3, 0x03A6, 0x03AC, 0x83A9, 0x03B8, 0x83BD, 0x83B7,
		0x03B2, 0x0390, 0x8395, 0x839F, 0x039A, 0x838B, 0x038E,
		0x0384, 0x8381, 0x0280, 0x8285, 0x828F, 0x028A, 0x829B,
		0x029E, 0x0294, 0x8291, 0x82B3, 0x02B6, 0x02BC, 0x82B9,
		0x02A8, 0x82AD, 0x82A7, 0x02A2, 0x82E3, 0x02E6, 0x02EC,
		0x82E9, 0x02F8, 0x82FD, 0x82F7, 0x02F2, 0x02D0, 0x82D5,
		0x82DF, 0x02DA, 0x82CB, 0x02CE, 0x02C4, 0x82C1, 0x8243,
		0x0246, 0x024C, 0x8249, 0x0258, 0x825D, 0x8257, 0x0252,
		0x0270, 0x8275, 0x827F, 0x027A, 0x826B, 0x026E, 0x0264,
		0x8261, 0x0220, 0x8225, 0x822F, 0x022A, 0x823B, 0x023E,
		0x0234, 0x8231, 0x8213, 0x0216, 0x021C, 0x8219, 0x0208,
		0x820D, 0x8207, 0x0202];

Module.prototype.makeWord = function(a, b) {
	return ((a & 0xff) | ((b & 0xff) << 8));
};

Module.prototype.getLowByte = function(a) {
	return (a & 0xff);
};

Module.prototype.getHighByte = function(a) {
	return ((a >> 8) & 0xff);
};

Module.prototype.getLowWord = function(a) {
	return (a & 0xffff);
};

Module.prototype.getHighWord = function(a) {
	return ((a >> 16) & 0xffff);
};

Module.prototype.updateCRC = function(crc_accum, data_blk_ptr, data_blk_size) {
	var i, j;

	for(j=0; j < data_blk_size; j++) {
		i = ((crc_accum >> 8) ^ data_blk_ptr[j]) & 0xff;
		crc_accum = (crc_accum << 8) ^ crc_table[i];
	}

	return crc_accum;
};
