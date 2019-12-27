const rendererConsole = require('../src/main/utils/rendererConsole');
const BaseModule = require('./baseModule');

class Mindpiggy extends BaseModule{
    constructor(){
        // console.log("Module");
        super();
        this.sp = null;

        this.sensorTypes={
            DIGITAL:0,
            ANALOG:1,
            NEOPIXEL:2,
            SPEAKER:3,
            DCMOTOR:4,
            REMOTE:5,
        };

        this.PortTimeList = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,0,0,0,0,0];
        this.recentCheckData = {};
        this.actionTypes={
            SET:0,
            GET:1,
            RESET:2,
        };
        // 전값
        this.recentSET={};
        this.recentGET={};
        //아두이노 보낼 버퍼
        this.sendBuffers=[];
        this.isDraing = false;
        //sensory아두이노에서 받은 값, handler.write 키:값
        this.portData={
        };
    }
    // 초기 설정- 하드웨어가 엔트리연결됬을때.
    init(handler, config){

    }
    setSerialPort(sp) {
        this.sp = sp;
    }
    // 초기 송신 데이터(필수)
    requestInitialData() {
        return null;
    }
    // 초기 수신 데이터 체크(필수)
    checkInitialData(data,config){
        return true;
    }
    // 하드웨어에서 받은 데이터의 검증이 필요한 경우
    validateLocalData(data){

        return true;
    }

    // 엔트리에 전달할 데이터.
    requestRemoteData(handler){
        var self = this;
        if(Object.keys(handler.read('GET')).length===0 && Object.keys(handler.read('SET')).length===0 && this.recentSET){
            this.sendBuffers=[];
            var buffer = new Buffer([]);
            Object.keys(self.recentSET).forEach(function(port){
                buffer = Buffer.concat([buffer,self.makeResetBuffer(port,self.recentSET[port].type)]);
            });
            delete this.recentSET;
            if(buffer.length)
                this.sendBuffers.push(buffer);
            delete this.isRecentData;
            this.recentCheckData = {};
        }

        for(var getPort in this.portData) {
            handler.write(getPort, this.portData[getPort]);
        }
        // //요청포트만 전달
        // if(this.recentGET){
        //     for(var getPort in this.recentGET) {
        //         //타입이 같을때
        //         // if(this.recentGET[getPort].type==this.portData[getPort].type)
        //             handler.write(getPort, this.portData[getPort]);
        //     }
        // }
    }

    // 엔트리에서 전달된 데이터 처리(Entry.hw.sendQueue로 보낸 데이터)
    handleRemoteData(handler){

        var self = this;
        var getDatas = handler.read('GET');
        var setDatas = handler.read('SET');
        if(Object.keys(setDatas).length > 0){
            if(!this.recentSET)this.recentSET={};
            for(var key in setDatas)self.recentSET[key] = setDatas[key];
        }
        if(Object.keys(getDatas).length > 0){
            if(!this.recentGET)this.recentGET={};
            for(var key in getDatas)self.recentGET[key] = getDatas[key];
        }

        var buffer = new Buffer([]);
        if(getDatas){
            var getkeys = Object.keys(getDatas);
            getkeys.forEach(function(port){
                var getValue=getDatas[port];
                if(getValue){
                    if(self.PortTimeList[port] < getValue.time) {
                        self.PortTimeList[port] = getValue.time;
                        // buffer = Buffer.concat([buffer,self.makeInputBuffer(port,getValue.type),]);
                        if(!self.isRecentData(port, getValue.type, -1)) {
                            self.recentCheckData[port] = {
                                type: getValue.type,
                                data: -1,
                            };
                            buffer = Buffer.concat([buffer,self.makeInputBuffer(port,getValue.type),]);
                        }
                    }
                }
            });
        }
        if(setDatas){
            var setkeys = Object.keys(setDatas);
            setkeys.forEach(function(port){
                var setValue=setDatas[port];
                if(setValue){
                    if(self.PortTimeList[port] < setValue.time) {
                        self.PortTimeList[port] = setValue.time;

                        if(!self.isRecentData(port, setValue.type, setValue.data)) {
                            self.recentCheckData[port] = {
                                type: setValue.type,
                                data: setValue.data
                            };
                            buffer = Buffer.concat([buffer,self.makeOutputBuffer(port,setValue.type,setValue.data)],);
                        }
                    }
                }
            });
        }

        if(buffer.length)
            this.sendBuffers.push(buffer);

        // rendererConsole.log(this.sendBuffers);

    }

    // 하드웨어에 명령을 전송합니다.
    requestLocalData(){
        var self = this;
        if (!this.isDraing && this.sendBuffers.length > 0) {
            this.isDraing = true;
            this.sp.write(this.sendBuffers.shift(), function() {
                if (self.sp) {
                    self.sp.drain(function() {
                        self.isDraing = false;
                    });
                }
            });
        }
        return null;
    }

    // 하드웨어에서 보내준 정보를 가공합니다.
    /// 0x02 DDRB DDRD PIND PINB analog[12byte] 0x03 10 13
    handleLocalData(data){
        // console.log("handleLocalData");
        var self = this;
        var datas = this.getDataByBuffer(Array.apply([],data));
        datas.forEach(function(data){
            if(data[0]!=0x02 || data[data.length-1]!=0x03 || data.length<19){
                return;
            }else{
                var DDR = [];
                var PIN = [];  // 15 14 13 12 11 10 9 8 7 6 5 4 3 2 1 0
                for(var i=7;i>=0;i--){
                    DDR.push((data[1]>>i)&1);
                    PIN.push((data[3]>>i)&1);
                }for(var i=7;i>=0;i--){
                    DDR.push((data[2]>>i)&1);
                    PIN.push((data[4]>>i)&1);
                }
                var ANAL= []; //0 1 2 3 4 5
                for(var i=0;i<6;i++){
                    var analogData = data[5+(i*2)]<<8 | data[6+(i*2)];
                    ANAL.push(analogData);
                }
                //digital
                for(var port=0;port<14;port++){
                    var inout = DDR.pop();
                    var value = PIN.pop();
                    if(inout==0){
                        self.portData[String(port)]={
                            data: value,
                            type: self.sensorTypes.DIGITAL,
                        }
                    }
                }

                //analog
                ANAL.forEach(function(value,indx){
                    self.portData[String(indx+14)]={
                        data: ANAL[indx],
                        type: self.sensorTypes.ANALOG,
                    }
                });
                //remote
                self.portData['A0']={
                    data: data[17],
                    type: self.sensorTypes.REMOTE,
                };
            }
        });
    }

    isRecentData(port, type, data) {
        var isRecent = false;
        var self = this;
        if(port in this.recentCheckData) {
            if(self.recentCheckData[port].type === type) {
                if(Array.isArray(data)){
                    isRecent = self.recentCheckData[port].data.every(function(recentdata,indx) {
                        return recentdata == data[indx];
                    });
                }else{
                    isRecent=(self.recentCheckData[port].data == data);
                }

            }
        }
        return isRecent;
    }
    getDataByBuffer(buffer) {
        var datas = [];
        var lastIndex = 0;
        buffer.forEach(function(value, idx) {
            if (value == 13 && buffer[idx + 1] == 10) {
                datas.push(buffer.slice(lastIndex, idx));
                lastIndex = idx + 2;
            }
        });
        return datas;
    }
    // 0x02 port action type 0x03//
    //센서입력버퍼 생성 함수
    makeInputBuffer(port, type){
        var buffer;
        switch(type){
            case this.sensorTypes.DIGITAL:{
                buffer = new Buffer([
                    0x02,
                    port,
                    this.actionTypes.GET,
                    type,
                    0x03,
                ]);
            }break;
            case this.sensorTypes.ANALOG:{
                buffer = new Buffer([
                    0x02,
                    port,
                    this.actionTypes.GET,
                    type,
                    0x03,
                ]);
            }break;
            case this.sensorTypes.NEOPIXEL:{

            }break;
            case this.sensorTypes.SPEAKER:{

            }break;
            case this.sensorTypes.DCMOTOR:{

            }break;
            case this.sensorTypes.REMOTE:{
                buffer = new Buffer([
                    0x02,
                    port,
                    this.actionTypes.GET,
                    type,
                    0x03,
                ]);
            }break;
        }
        return buffer;
    }
    // 0x02 port action type len data 0x03//
    //센서출력버퍼 생성 함수
    makeOutputBuffer(port, type, data){
        var buffer;
        switch(type){
            case this.sensorTypes.DIGITAL:{
                buffer = new Buffer([
                    0x02,
                    port,
                    this.actionTypes.SET,
                    type,
                    1,
                    data,
                    0x03,
                ]);
            }break;
            case this.sensorTypes.ANALOG:{
            }break;
            case this.sensorTypes.NEOPIXEL:{
                buffer = new Buffer([
                    0x02,
                    port,
                    this.actionTypes.SET,
                    type,
                    5,
                    data[0],
                    data[1],
                    data[2],
                    data[3],
                    data[4],
                    0x03,
                ]);
            }break;
            case this.sensorTypes.SPEAKER:{
                buffer = new Buffer([
                    0x02,
                    port,
                    this.actionTypes.SET,
                    type,
                    4,
                    data[0]>>8,
                    data[0]&255,
                    data[1]>>8,
                    data[1]&255,
                    0x03,
                ]);
            }break;
            case this.sensorTypes.DCMOTOR:{
                buffer = new Buffer([
                    0x02,
                    port,
                    this.actionTypes.SET,
                    type,
                    2,
                    data[0],
                    data[1],
                    0x03,
                ]);
            }break;
        }
        return buffer;
    }
    // 0x02 port action type 0x03//
    //센서출력버퍼 생성 함수
    makeResetBuffer(port, type){
        var buffer;
        switch(type){
            case this.sensorTypes.DIGITAL:{
                buffer = new Buffer([
                    0x02,
                    port,
                    this.actionTypes.RESET,
                    type,
                    0x03,
                ]);
            }break;
            case this.sensorTypes.ANALOG:{

            }break;
            case this.sensorTypes.NEOPIXEL:{
                buffer = new Buffer([
                    0x02,
                    port,
                    this.actionTypes.RESET,
                    type,
                    0x03,
                ]);
            }break;
            case this.sensorTypes.SPEAKER:{
                buffer = new Buffer([
                    0x02,
                    port,
                    this.actionTypes.RESET,
                    type,
                    0x03,
                ]);
                break;
            }
            case this.sensorTypes.DCMOTOR:{
                buffer = new Buffer([
                    0x02,
                    port,
                    this.actionTypes.RESET,
                    type,
                    0x03,
                ]);
            }break;
        }
        return buffer;
    }
    // 하드웨어 연결 해제시 호출됩니다.
    disconnect(connect){
        // console.log("disconnect");
        connect.close();
        if (this.sp) {
            delete this.sp;
        }
    }

    //엔트리와의 연결 종료 후 처리 코드입니다.
    reset(){
         // console.log("reset");
    }

}

module.exports = new Mindpiggy();