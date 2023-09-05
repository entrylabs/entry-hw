function Module() {
    this.ctlData = [0x26, 0xA8, 0x14, 0xC1, 0x14, 0x00, 0x00, 0x00, 0x00, 0x00, 
        0x00,	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
    this.sensorData = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];			
    this.buzzerCnt;	 
    this.noteID = 0;
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
    const id = (ctlData[8] >> 4) & 0x0F;
    if (this.noteID != id) {
        this.noteID = id;
        this.buzzerCnt = ctlData[9];
    }
    this.buzzerCnt = (this.buzzerCnt > 0) ? this.buzzerCnt - 1 : 0;
    if (this.buzzerCnt == 0) {
    	ctlData[8] = 0;
    	ctlData[9] = 0;
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
        (data[2] == 0x14) && (data[3] == 0xD1)) { 
        const sensorData = this.sensorData;
        data.forEach((value, idx) => {
            sensorData[idx] = value;
        });
    }
};

Module.prototype.requestRemoteData = function(handler) {
    handler.write('A0', !!(this.sensorData[6] & 0x01));      
    handler.write('A1', !!(this.sensorData[6] & 0x02));      
    handler.write('A2', this.sensorData[7]);         
    handler.write('A3', this.sensorData[8]);
    handler.write('A4', this.sensorData[9]);
    handler.write('A5', this.sensorData[10]);  
    handler.write('A6', this.sensorData[11]);   
   	handler.write('CMD', this.sensorData);
};

Module.prototype.reset = function() {
    this.ctlData = [0x26, 0xA8, 0x14, 0xC1, 0x14, 0x00, 0x00, 0x00, 0x00, 0x00, 
        0x00,	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
    this.sensorData = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];	
};
module.exports = new Module();
