'use strict';
function Handler_old(config) {
	this.config = config;
	switch (config.entry.protocol) {
		case 'bytearray': {
			this.sendHandler = require('./bytearray.js').create(config.id, config.entry.bufferSize || config.entry.buffersize);
			break;
		}
		case 'json': {
			this.sendHandler = require('./json.js').create(config.id);
			break;
		}
//		case 'dmp': {
//			this.sendHandler = require('./dmp.js').create(config.id);
//			break;
//		}
	}
}

Handler_old.prototype.encode = function() {
	if (this.sendHandler) {
		return this.sendHandler.encode();
	}
};

Handler_old.prototype.decode = function(data, type) {
	if (type == 'binary') {
		if (data[1] != 0x00) {
			if (!this.receiveHandler) {
				switch (data[5]) {
					case 0x01: {
						this.receiveHandler = require('./bytearray.js').create(this.config.id);
						break;
					}
//					case 0x03: {
//						this.receiveHandler = require('./dmp.js').create(this.config.id);
//						break;
//					}
				}
			}
			if (this.receiveHandler) {
				this.receiveHandler.decode(data);
			}
		}
	} else if (type == 'utf8') {
		if (!this.receiveHandler) {
			this.receiveHandler = require('./json.js').create(this.config.id);
		}
		if (this.receiveHandler) {
			this.receiveHandler.decode(data);
		}
	}
};

Handler_old.prototype.e = function(arg) {
	if (this.receiveHandler) {
		return this.receiveHandler.e(arg);
	}
	return false;
};

Handler_old.prototype.read = function(arg) {
	if (this.receiveHandler) {
		return this.receiveHandler.read(arg);
	}
	return 0;
};

Handler_old.prototype.write = function(arg1, arg2) {
	if (this.sendHandler) {
		return this.sendHandler.write(arg1, arg2);
	}
	return false;
};

module.exports.create = function(config) {
	return new Handler_old(config);
};
