// handler.read 키 매칭
var Mindpiggy = {
    DigitalPin : 'digitalpin',
    Mood_NeoPixel : 'moodneopixel',
    Chip_NeoPixel : 'chipneopixel',
    VibrationPin : 'vibration',
    SoundSensor : 'soundsensor',
    PhotoInterrupt : 'photointerrupt',
    Speaker : 'speaker',
};
var portInit={};
var sensInit={};
function Module() {
    // console.log("Module");
    this.isRemoteData=false;
    this.sp = null;

    // portdata , sensory => output, input 변수
    // 아두이노에 보낼 값, querystring 키:값
    this.portdata={
        // isDigital : 0,
        moodpixel:12,
        moodrgb : [0,0,0],
        chiprgb : [0,0,0],
        toneFrequency : 0,
        toneDuration : 0,
    };
    //아두이노에서 받은 값, handler.write 키:값
    this.sensory={
        isVibration:0,
        isPhotoInterrupt:0,
        SoundsensorValue : 0,
    };
}

// 초기 설정- 하드웨어가 엔트리연결됬을때.
Module.prototype.init = function(handler, config) {
    for(var key in this.portdata)
        portInit[key] = this.portdata[key];
    for(var key in this.sensory)
        sensInit[key] = this.sensory[key];
    // console.log("init");
};


// 초기 송신 데이터(필수)
Module.prototype.requestInitialData = function() {
    // console.log("requestInitialData");
    return null;
};

// 초기 수신 데이터 체크(필수)
Module.prototype.checkInitialData = function(data, config) {
    // console.log("checkInitialData");
    return true;
};
// 하드웨어에서 받은 데이터의 검증이 필요한 경우
Module.prototype.validateLocalData = function(data) {
    // console.log("validateLocalData");
    //작품 정지 했을떄 초기화
    if(this.isRemoteData==false){
        for (var key in this.portdata){
            this.portdata[key]=portInit[key];
        }
    }else this.isRemoteData=false;
    return true;
};

// 엔트리에 전달할 데이터.
Module.prototype.requestRemoteData = function(handler) {
    // console.log("requestRemoteData");
    // 전송
    for(var key in this.sensory) {
        handler.write(key, this.sensory[key]);
    }
    // 초기화
    for (var key in this.sensory){
        this.sensory[key]=sensInit[key];
    }
};

// 엔트리에서 전달된 데이터 처리(Entry.hw.sendQueue로 보낸 데이터)
Module.prototype.handleRemoteData = function(handler) {
    // console.log("handleRemoteData");

    if(handler.e(Mindpiggy.Mood_NeoPixel)){
        var recieve_mood=handler.read(Mindpiggy.Mood_NeoPixel);
        this.portdata.moodpixel=recieve_mood[0];
        this.portdata.moodrgb = recieve_mood.slice(1);
    }
    if(handler.e(Mindpiggy.Chip_NeoPixel)){
        var recieve_chip=handler.read(Mindpiggy.Chip_NeoPixel);
        this.portdata.chiprgb=recieve_chip.slice(0);
    }
    if(handler.e(Mindpiggy.Speaker)){
        var recieve_speaker=handler.read(Mindpiggy.Speaker);
        this.portdata.toneFrequency = recieve_speaker[0];
        this.portdata.toneDuration = recieve_speaker[1];
    }
    this.isRemoteData=true;
};

// 하드웨어에 명령을 전송합니다.
Module.prototype.requestLocalData = function() {
    // console.log("requestLocalData");
    var queryString = [];

    queryString = queryString.concat([
            0x02,
            0x01,
            0x04,
            this.portdata.moodpixel
        ]).concat(
            this.portdata.moodrgb
        ).concat([
            0x03,
        ]);
    queryString = queryString.concat([
            0x02,
            0x02,
            0x03
        ]).concat(
            this.portdata.chiprgb
        ).concat([
            0x03,
        ]);
    queryString = queryString.concat([
            0x02,
            0x03,
            0x04,
            this.portdata.toneFrequency>>8,
            this.portdata.toneFrequency&255,
            this.portdata.toneDuration>>8,
            this.portdata.toneDuration&255,
            0x03,
    ]);
    // console.log("String", queryString);
    return queryString;
};

// 하드웨어에서 보내준 정보를 가공합니다.
// _____vib ph1 ph0  ss1 ss1
//        0           1   2
Module.prototype.handleLocalData = function(data) {
    // console.log("handleLocalData");
    var vibValue=data[0]>>2;
    var phoValue=data[0]&3;
    var ssValue = (data[1]<<8) | data[2];

    this.sensory.isVibration=vibValue;
    this.sensory.isPhotoInterrupt=phoValue;
    this.sensory.SoundsensorValue=ssValue;
};

// 하드웨어 연결 해제 시 호출됩니다.
Module.prototype.disconnect = function(connect) {
    // console.log("disconnect");
    var self = this;
    connect.close();
    if (self.sp) {
        delete self.sp;
    }
};

// 엔트리와의 연결 종료 후 처리 코드입니다.
Module.prototype.reset = function() {
    // console.log("reset");
 };

// 여태까지 작성했던 코드를 묶어서 모듈화합니다.
module.exports = new Module();