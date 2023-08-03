const { values } = require('lodash');
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

    this.cmdTime = 0;
    this.portTimeList = [0, 0, 0, 0, 0];
    this.terminal = [85, 238, 238, 238, 238, 10];
    this.moduleOff = [255, 85, 200, 200, 200, 200, 10];
    this.paroduleEntry = new Buffer("entry\r\n");
    this.paroduleInit = new Buffer("init\r\n");
    this.paroduleUpdate = new Buffer("update\r\n");
  }
  /*
  최초에 커넥션이 이루어진 후의 초기 설정.
  handler 는 워크스페이스와 통신하 데이터를 json 화 하는 오브젝트입니다. (datahandler/json 참고)
  config 은 module.json 오브젝트입니다.
  */
  init(handler, config) {
    this.handler = handler;
    this.config = config;
  }

  setSerialPort(sp) {
    var self = this;
    this.sp = sp;
  }

  afterConnect(that, cb) {
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
    /*
    const loopTime = Date.now() + 250;
    while (Date.now() < loopTime) {
    }
    return this.paroduleInit;
    */
  }

  // 연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
  checkInitialData(data, config) {
    /* 동작이 매끄럽지 못해서 보류 
    if (data == "paro\r\n" || data == "1\r\n") {
      return true;
    }
    else {
      return false;
    }
    */
    return true;
  }

  // 주기적으로 하드웨어에서 받은 데이터의 검증이 필요한 경우 사용합니다.
  validateLocalData(data) {
    return true;
  }

  /*
  하드웨어 기기에 전달할 데이터를 반환합니다.
  slave 모드인 경우 duration 속성 간격으로 지속적으로 기기에 요청을 보냅니다.
  */
  requestLocalData() {
    // 하드웨어로 보낼 데이터 로직
    var self = this;

    if (!this.isDraing && this.sendBuffers.length > 0) {
      this.isDraing = true;
      this.sp.write(this.sendBuffers.shift(), function () {
        if (self.sp) {
          self.sp.drain(function () {
            self.isDraing = false;
          });
        }
      });
    }

    return 0;
  }

  // 하드웨어에서 온 데이터 처리
  handleLocalData(data) {
    var datas = this.getDataByBuffer(data);
    console.log(datas);
    // 데이터 처리 로직
  }

  // 엔트리로 전달할 데이터
  requestRemoteData(handler) {
    // handler.write(key, value) ...
  }

  // 엔트리에서 받은 데이터에 대한 처리
  handleRemoteData(handler) {
    var self = this;
    var cmdDatas = handler.read('CMD');
    var getDatas = handler.read('GET');
    var setDatas = handler.read('SET');
    var time = handler.read('TIME');
    var buffer = new Buffer([]);
    // 입력 모듈일 경우
    if (getDatas) {

    }
    // 출력 모듈일 경우
    if (setDatas) {
      var setKey = Object.keys(setDatas);
      setKey.forEach(function (port) {
        var data = setDatas[port];
        if (data) {
          if (self.portTimeList[port] < data.time) {
            self.portTimeList[port] = data.time
            if (!self.isRecentData(port, data.type, data.data)) {
              self.recentCheckData[port] = {
                type: data.type,
                data: data.data
              }
              self.updateTerminalBuffer(port);
              buffer = new Buffer(self.makeOutputBuffer(data.type, null));
            }
          }
        }
      });

    }


    // 커맨드 명령어
    if (cmdDatas) {
      if (self.cmdTime < cmdDatas.time) {
        self.cmdTime = cmdDatas.time;

        if (!self.isRecentData(cmdDatas.data)) {
          self.recentCheckData = {
            data: cmdDatas.data
          }
          buffer = new Buffer(cmdDatas.data);
        }
      }
    }

    if (buffer.length) {
      console.log(buffer);
      this.sendBuffers.push(buffer);
    }
  }

  // recentCheckData 리스트에 있는 경우 true 반환 아니면 false
  isRecentData(port, type, data) {
    var isRecent = false;

    if (port in this.recentCheckData) {
      if (this.recentCheckData[port].type === type && this.recentCheckData[port].data === data) {
        isRecent = true;
      }
    }

    return isRecent;
  }

  updateTerminalBuffer(port) {
    if (this.recentCheckData[port].data === 0) {
      this.terminal[port] = 238;
    }
    else {
      this.terminal[port] = this.recentCheckData[port].data;
    }

  }
  makeOutputBuffer(dataType, data) {
    var buffer;
    if (dataType == this.controlTypes.STRING) {
      buffer = new Buffer(data);
    }
    else if (dataType == this.controlTypes.DIGITAL) {
      buffer = new Buffer([
        255,
        85,
        this.terminal[1],
        this.terminal[2],
        this.terminal[3],
        this.terminal[4],
        10
      ]);
    }
    else {

    }
    return buffer;
  }

  // '\r\n' 을 기준으로 버퍼를 자른다
  getDataByBuffer(buffer) {
    var datas = [];
    var lastIndex = 0;
    buffer.forEach(function (value, idx) {
      if (value == 13 && buffer[idx + 1] == 10) {
        datas.push(buffer.subarray(lastIndex, idx));
        lastIndex = idx + 2;
      }
    });
    return datas;
  }

  // 연결 해제되면 시리얼 포트 제거
  disconnect(connect) {
    var self = this;
    connect.close();
    if (self.sp) {
      delete self.sp;
    }
  }

  // 리셋
  reset() {
    this.lastTime = 0;
    this.lastSendTime = 0;
    this.sensorData.PULSEIN = {}
  }
}

module.exports = new Parodule();