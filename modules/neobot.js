function Module() {
	this.digitalValue = new Array(14);
	this.analogValue = new Array(6);

	this.remoteDigitalValue = new Array(14);
	this.readablePorts = null;
	this.i = 0;
}

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
	console.lopg('hhh');
};


Module.prototype.requestLocalData = function() {
	var array = new Array(1);    
	array[0] = 0x02;
	array[1] = 0x51;
	array[2] = 0x33;
	// var buf = new Array(1);

	// buf[0] = this.i++;
	
	console.log(array);

	return array;
};

Module.prototype.handleLocalData = function(data) { // data: Native Buffer
	console.log('hh');
};

Module.prototype.requestRemoteData = function(handler) {
	console.log('rr');
};

Module.prototype.reset = function() {
};

module.exports = new Module();
