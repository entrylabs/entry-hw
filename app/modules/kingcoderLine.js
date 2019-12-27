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
    this.setDigi1 = 0;
    this.setDigi2 = 0;
    this.isUseSetDigital = 0;
    
    this.sensingValueAnal1 = 0;
    this.sensingValueAnal2 = 0;
    this.sensingValueDigi = 0;
    this.initialBuffer = new Array(2);

}

Module.prototype.init = function(handler, config) {
};


Module.prototype.requestInitialData = function() {
    this.initialBuffer[0] = 0xFF;
    this.initialBuffer[1] = 0xFF; //255를 시작시에 보냄
    //this.initialBuffer[2] = 0xFF;
    
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
    this.setDigi1 = handler.read(11);
    this.setDigi2 = handler.read(12);
    this.isUseSetDigital = handler.read(13); //flag to check digital output
};

Module.prototype.requestLocalData = function() {
    //하드웨어로 보내기 step 2:하드웨어에 명령을 전송
    var queryString = [];

    var byteToSend = 64; //01000000
    var temp = this.motor2;
    byteToSend = byteToSend | (this.setDigi1 <<5) | (this.setDigi2 <<4) |
                    (this.motor2 << 2) | this.motor1;
    queryString.push(byteToSend);
    if(this.isUseSetDigital == 1){
        byteToSend = 128+32;  //101로 시작 
    }
    else{
        byteToSend = 128;  //100로 시작
    }
    byteToSend = byteToSend |  (this.buzzer << 3) | this.led;
    queryString.push(byteToSend);
   
    //우선 2바이트만 보내는 것으로 변경
    //byteToSend = 128;  
   // queryString.push(byteToSend);
    
    return queryString;

};

Module.prototype.handleLocalData = function(data) { // data: Native Buffer
    // 하드웨어에서 받기 step 1 : 보내준 정보를 가공
     for(var i = 0; i < data.length ; i++){
        if((data[i] >>> 6) == 1 ) this.sensingValueAnal1  =  data[i];
        else if((data[i] >>> 6) == 2 ) this.sensingValueAnal2  =  data[i];
        else if((data[i] >>> 6) == 3 ) this.sensingValueDigi  =  data[i]; //리모콘,컬러,디지털1,2
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
