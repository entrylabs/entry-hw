function Module() {
    this.ctlData = [0x26, 0xA8, 0x14, 0xE1, 0x14, 0x00, 0x00, 0x00, 0x00, 0x00, 
        0x00,	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
    this.sensorData = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];				 
}

Module.prototype.init = function(handler, config) {
    //console.log("init");
};

Module.prototype.requestInitialData = function() {
    //console.log("requestInitialData");
    return null;
};

Module.prototype.checkInitialData = function(data, config) {
    //console.log("checkInitialData");
    return true;
};

Module.prototype.validateLocalData = function(data) {
    return true;
};

Module.prototype.handleRemoteData = function(handler) {
    var cmd = handler.read('CMD');
    var ctlData = this.ctlData;

    for(var n=6; n<20; n++)
        ctlData[n] = cmd[n];
    var sum = 0;
    ctlData.forEach(function (value, idx) {
        if(idx > 5)
            sum += value;
    });
    ctlData[5] = sum&0xFF;   
};

Module.prototype.requestLocalData = function() {
    return this.ctlData;
};

Module.prototype.handleLocalData = function(data) {
    var sum = 0;
    data.forEach(function (value, idx) {
        if(idx > 5)
            sum += value;
    });
    if((data[5]==(sum&0xFF)) && (data[0] == 0x26) && (data[1] == 0xA8) && (data[2] == 0x14) && (data[3] == 0xE1)){ 
        var sensorData = this.sensorData;
        data.forEach(function (value, idx){
            sensorData[idx] = value;
        });
    }
};

Module.prototype.requestRemoteData = function(handler) {
    handler.write('A0', this.sensorData[6]);      
    handler.write('A1', this.sensorData[7]);         
    handler.write('A2', this.sensorData[8]);
    handler.write('A3', this.sensorData[9]);
    handler.write('A4', this.sensorData[10]);  
    handler.write('A5', this.sensorData[11]);   
    var n = this.sensorData[12];
    if(n > 127)	n = -1*(256-n);
    handler.write('A6', n);
    if(this.sensorData[6] == 4)
        handler.write('A7', this.sensorData[13]); 
    else{
        var n = this.sensorData[13];
        if(n > 127)	n = -1*(256-n);
            handler.write('A7', n);
  	}	
    var n = this.sensorData[14];
    if(n > 127)	n = -1*(256-n);
    handler.write('A8', n);
    var n = this.sensorData[15];
    if(n > 127)	n = -1*(256-n);
    handler.write('A9', n);
    handler.write('A10', this.sensorData[16]); 
    handler.write('A11', this.sensorData[17]); 
   	handler.write("CMD", this.sensorData);
};

Module.prototype.reset = function() {
    this.ctlData = [0x26, 0xA8, 0x14, 0xE1, 0x14, 0x00, 0x00, 0x00, 0x00, 0x00, 
        0x00,	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
    this.sensorData = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];	
};
module.exports = new Module();
