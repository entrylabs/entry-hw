function Module() {
	this.cmdData = [0xF0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
	this.sensorData = [0xF0, 100, 0x00, 100, 100, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00];
	this.oldNoteCount = 0;
	this.emergency = 0;
}

Module.prototype.init = function(handler, config) {
	console.log("init");
};

Module.prototype.requestInitialData = function() {
	console.log("requestInitialData");
	return null;
};

Module.prototype.checkInitialData = function(data, config) {
	console.log("checkInitialData");
	return true;
};

Module.prototype.validateLocalData = function(data) {
	return true;
};

Module.prototype.handleRemoteData = function(handler) {
		var cmd = handler.read('CMD');
		this.noteCount = handler.read('noteCount');
		var cmdData = this.cmdData;
	
		if(typeof cmd != "object")
				return;

		cmd.forEach(function (value, idx) {
        cmdData[idx] = value;
    });
    		
		if(this.noteCount == this.oldNoteCount)
				cmdData[2] = 0;	
				
		if(cmd[8] == 0x81)
				this.emergency = 1;
		if(cmd[7] == 0x00)
				this.emergency = 0;
		if(this.emergency == 1)
				cmdData[7] = 0;
};

Module.prototype.requestLocalData = function() {
		this.oldNoteCount = this.noteCount;
		
		return this.cmdData;
};

Module.prototype.handleLocalData = function(data) { 
		var sensorData = this.sensorData;

		if((data[0] == 0xF0) && ((data.length==11) || (data.length==15))){
				data.forEach(function (value, idx) {
        		sensorData[idx] = value;
    		});
		}
};

Module.prototype.requestRemoteData = function(handler) {
			for (var i = 1; i < 11; i++) {
        var value = this.sensorData[i];
        if((i==1) || (i==3))
        		handler.write('A' + i, 100-value);
        else if(i==4)
        		handler.write('A' + i, value-100);
        else if(i==5)
        		handler.write('A' + i, (~value)&0xFF);
        else
        		handler.write('A' + i, value);
    }
    var n = this.sensorData[8];
    if(n > 127)	n = -1*(256-n);
    handler.write('A8', -1*n);
    
    n = this.sensorData[9];
    if(n > 127)	n = -1*(256-n);
    handler.write('A9', -1*n);
		//console.log(this.sensorData.length + ' ' + this.sensorData[7] + ' ' + this.sensorData[8] + ' ' + this.sensorData[9]);
		handler.write("CMD", this.sensorData);     
};

Module.prototype.reset = function() {
		this.cmdData = [0xF0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
		this.sensorData = [0xF0, 100, 0x00, 100, 100, 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00];
		this.oldNoteCount = 0;
		this.emergency = 0;
};

module.exports = new Module();
