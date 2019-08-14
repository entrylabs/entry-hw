function Module() {
    this.digitalValue = new Array(11);
    this.remoteDigitalValue = [0];
    this.motor1 = 0;
    this.motor2 = 0;
    this.led = 0;
    this.buzzer = 0;
    this.anal1 = 0;
    this.anal2 = 0;
    this.digi1 = 0;
    this.digi2 = 0;
 
    this.sensingValueAnal1 = 0;
    this.sensingValueAnal2 = 0;
    this.sensingValueDigi = 0;
    this.initialBuffer = new Array(3);

}

Module.prototype.init = function(handler, config) {
};


Module.prototype.requestInitialData = function() {
    this.initialBuffer[0] = 0xFF;
    this.initialBuffer[1] = 0xFF;
    this.initialBuffer[2] = 0xFF;
    
    return this.initialBuffer;  //킹코더에서 255를 받아야 커넥션이 이루어진 것으로 판단한다.
};

Module.prototype.checkInitialData = function(data, config) {
     return true;

};

Module.prototype.validateLocalData = function(data) {
  	return true;
};

Module.prototype.handleRemoteData = function(handler) {
    //하드웨어로 보내기 step 1:엔트리에서 전달된 데이터 처리(Entry.hw.sendQueue로 보낸 데이터)

    this.motor1 = handler.read(3);
    this.motor2 = handler.read(4);
    this.led = handler.read(5);
    this.buzzer = handler.read(6);
    this.anal1 = handler.read(7);
    this.anal2 = handler.read(8);
    this.digi1 = handler.read(9);
    this.digi2 = handler.read(10);

};

Module.prototype.requestLocalData = function() {
    //하드웨어로 보내기 step 2:하드웨어에 명령을 전송
    var queryString = [];

    var byteToSend = 0; //00으로 시작
    var temp = this.motor2;
    byteToSend = byteToSend | (this.motor2 << 2) | this.motor1;
    queryString.push(byteToSend);
    byteToSend = 64;  //01로 시작
    byteToSend = byteToSend | (this.buzzer << 3) | this.led;
    queryString.push(byteToSend);
    byteToSend = 128;
    queryString.push(byteToSend);
    
    return queryString;

};

Module.prototype.handleLocalData = function(data) { // data: Native Buffer
    // 하드웨어에서 받기 step 1 : 보내준 정보를 가공
     for(var i = 0; i < data.length ; i++){
        if((data[i] >>> 6) == 0 ) this.sensingValueAnal1  =  data[i];
        else if((data[i] >>> 6) == 1 ) this.sensingValueAnal2  =  data[i];
        else if((data[i] >>> 6) == 2 ) this.sensingValueDigi  =  data[i];
    }
    
};

Module.prototype.requestRemoteData = function(handler) {
    // 하드웨어에서 받기 step 2 : 엔트리로 보내기
    handler.write(0, this.sensingValueAnal1);
    handler.write(1, this.sensingValueAnal2);
    handler.write(2, this.sensingValueDigi);
};

Module.prototype.reset = function() {
};

module.exports = new Module();
