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
    const cmd = handler.read('CMD');
    const ctlData = this.ctlData;

    for (let n = 6; n < 20; n++) {
        ctlData[n] = cmd[n];
    }
    let sum = 0;
    ctlData.forEach((value, idx) => {
        if (idx > 5) {
            sum += value;
        }
    });
    ctlData[5] = sum & 0xFF;   
};

Module.prototype.requestLocalData = function() {
    return this.ctlData;
};

Module.prototype.handleLocalData = function(data) {
    let sum = 0;
    data.forEach((value, idx) => {
        if (idx > 5) {
            sum += value;
        }
    });
    if ((data[5] == (sum & 0xFF)) && (data[0] == 0x26) && (data[1] == 0xA8) && 
        (data[2] == 0x14) && (data[3] == 0xE3)) { 
        const sensorData = this.sensorData;
        data.forEach((value, idx) => {
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
    let val = this.sensorData[12];
    if (val > 127)	{
        val = -1 * (256 - val);
    }
    handler.write('A6', val);
    if (this.sensorData[6] == 4) {
        handler.write('A7', this.sensorData[13]);
    } else {
        val = this.sensorData[13];
        if (val > 127)	{
            val = -1 * (256 - val);
        }
        handler.write('A7', val);
  	}	
    val = this.sensorData[14];
    if (val > 127)	{
        val = -1 * (256 - val);
    }
    handler.write('A8', val);
    
    val = this.sensorData[15];
    if (val > 127)	{
        val = -1 * (256 - val);
    }
    handler.write('A9', val);
    
    val = this.sensorData[16];
    if (val > 127)	{
        val = -1 * (256 - val);
    }
    handler.write('A10', val);
    handler.write('A11', this.sensorData[17]); 
   	handler.write('CMD', this.sensorData);
};

Module.prototype.reset = function() {
    this.ctlData = [0x26, 0xA8, 0x14, 0xE1, 0x14, 0x00, 0x00, 0x00, 0x00, 0x00, 
        0x00,	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
    this.sensorData = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];	
};
module.exports = new Module();
