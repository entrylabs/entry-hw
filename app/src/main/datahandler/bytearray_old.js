'use strict';
function ByteArrayHandler(id, size) {
	if (size && typeof size == 'number' && size > 0) {
		const data = new Uint8Array(size + 6);
		
		data[0] = 0x01; // version
		let str = id.slice(0, 2); // company id
		data[1] = parseInt(str, 16) & 0xff;
		str = id.slice(2, 4); // model id
		data[2] = parseInt(str, 16) & 0xff;
		str = id.slice(4, 6); // variation id
		data[3] = parseInt(str, 16) & 0xff;
		data[4] = 0x00; // network id
		data[5] = 0x01; // protocol
		
		for (let i = 6, len = data.length; i < len; ++i) {
			data[i] = 0;
		}
		this.data = data;
	}
}

ByteArrayHandler.prototype.encode = function() {
	if (this.data) {
		return new Buffer(this.data);
	}
};

ByteArrayHandler.prototype.decode = function(data) { // data: array buffer
	this.data = new Uint8Array(data);
};

ByteArrayHandler.prototype.e = function(index) {
	return false;
};

ByteArrayHandler.prototype.read = function(index) {
	const data = this.data;
	if (data && index >= 0 && index < data.length - 6) {
		const value = data[index + 6];
		if (value) {
			return value;
		}
	}
	return 0;
};

ByteArrayHandler.prototype.write = function(index, value) {
	const data = this.data;
	if (data && index >= 0 && index < data.length - 6) {
		data[index + 6] = value;
		return true;
	}
	return false;
};

module.exports.create = function(id, size) {
	return new ByteArrayHandler(id, size);
};
