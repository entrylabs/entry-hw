const BaseModule = require('./robotry');
class Parodule extends BaseModule {
  // 클래스 내부에서 사용될 필드들을 이곳에서 선언합니다.
  constructor() {
    super();
    this.sp = null;
    this.controlTypes = {
      DIGITAL: 0,
      ANALOG: 1,
      STRING: 2,
    };
    
    this.paroduleBuffers = [];
    this.paroduleInit = new Buffer("entry\r\n");
    this.paroduleUpdate = new Buffer("update\r\n");
  }
  /*
  최초에 커넥션이 이루어진 후의 초기 설정.
  handler 는 워크스페이스와 통신하 데이터를 json 화 하는 오브젝트입니다. (datahandler/json 참고)
  config 은 module.json 오브젝트입니다.
  */
  init(handler, config) {
    console.log("init");
    this.handler = handler;
    this.config = config;
  }

  setSerialPort(sp){
    console.log("setSerialPort");
    var self = this;
    this.sp = sp;
  }

  afterConnect(that, cb) {
    console.log("afterConnect");
    that.connected = true;
    if (cb) {
        cb('connected');
    }
  }

 
  /*
  연결 후 초기에 송신할 데이터가 필요한 경우 사용합니다.
  requestInitialData 를 사용한 경우 checkInitialData 가 필수입니다.
  이 두 함수가 정의되어있어야 로직이 동작합니다. 필요없으면 작성하지 않아도 됩니다.
  */
  requestInitialData() {
    console.log("requestInitialData");
    const loopTime = Date.now() + 250;
    while (Date.now() < loopTime) {
      // console.log(loopTime-Date.now())
    }
    return this.paroduleInit;
  }

  // 연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
  checkInitialData(data, config) {
    console.log(data);
    if (data == "paro\r\n" || data == "1\r\n") {
      console.log("OK");
      return true;
    }
    else {
      return false;
    }
  }

  // 주기적으로 하드웨어에서 받은 데이터의 검증이 필요한 경우 사용합니다.
  validateLocalData(data) {
    console.log("validateLocalData");
    return true;
  }

  /*
  하드웨어 기기에 전달할 데이터를 반환합니다.
  slave 모드인 경우 duration 속성 간격으로 지속적으로 기기에 요청을 보냅니다.
  */
  requestLocalData() {
    // 하드웨어로 보낼 데이터 로직
    console.log("requestLocalData");
    var self = this;

    if (!this.isDraing && this.paroduleBuffers.length > 0) {
      this.isDraing = true;
      this.sp.write(this.paroduleBuffers.shift(), function() {
        if (self.sp) {
          self.sp.drain(function() {
            self.isDraing = false;
          });
        }
      });
    }
    return 0;
}

  // 하드웨어에서 온 데이터 처리
  handleLocalData(data) {
    // 데이터 처리 로직
    console.log("handleLocalData");
  }

  // 엔트리로 전달할 데이터
  requestRemoteData(handler) {
    console.log("requestRemoteData");
    // handler.write(key, value) ...
  }

  // 엔트리에서 받은 데이터에 대한 처리
  handleRemoteData(handler) {
    console.log("handleRemoteData");
    // const value = handler.read(key) ...
  }

  // 연결 해제되면 시리얼 포트 제거
  disconnect(connect) {
    console.log("disconnect");
    var self = this;
    connect.close();
    if(self.sp) {
        delete self.sp;
    }
  }
  
  // 리셋
  reset(){
    console.log("reset");
    this.lastTime = 0;
    this.lastSendTime = 0;
    this.sensorData.PULSEIN = {}
  }
}

module.exports = new Parodule();