function Module() {
  this.sp = null;
  this.sensorTypes = {
    ALIVE: 0,
    DIGITAL: 1,
    ANALOG: 2,
    PWM: 3,
    SERVO_PIN: 4,
    TONE: 5,
    PULSEIN: 6,
    ULTRASONIC: 7,
    TIMER: 8,
    LCD_PRINT: 9,
    LCD_CLEAR: 10
  };

  this.actionTypes = {
    GET: 1,
    SET: 2,
    RESET: 3
  };

  this.sensorValueSize = {
    FLOAT: 2,
    SHORT: 3
  };

  this.digitalPortTimeList = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];

  this.sensorData = {
    ULTRASONIC: 0,
    DIGITAL: {
      '0': 0,
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
      '6': 0,
      '7': 0,
      '8': 0,
      '9': 0,
      '10': 0,
      '11': 0,
      '12': 0,
      '13': 0,
      '14': 0,
      '15': 0
    },
    ANALOG: {
      '0': 0,
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0
    },
    PULSEIN: {},
    TIMER: 0
  };

  this.defaultOutput = {};

  this.recentCheckData = {};

  this.sendBuffers = [];

  this.lastTime = 0;
  this.lastSendTime = 0;
  this.isDraing = false;
}

var sensorIdx = 0;

Module.prototype.init = function (handler, config) {
};

Module.prototype.setSerialPort = function (sp) {
  var self = this;
  this.sp = sp;
};

// 초기 송신데이터(필수)
Module.prototype.requestInitialData = function () {
  return this.makeSensorReadBuffer(this.sensorTypes.ANALOG, 0);
};

// 초기 수신데이터 체크(필수)
Module.prototype.checkInitialData = function (data, config) {
  return true;
  // 이후에 체크 로직 개선되면 처리
  // var datas = this.getDataByBuffer(data);
  // var isValidData = datas.some(function (data) {
  //     return (data.length > 4 && data[0] === 255 && data[1] === 85);
  // });
  // return isValidData;
};

Module.prototype.afterConnect = function (that, cb) {
  that.connected = true;
  if (cb) {
    cb('connected');
  }
};

Module.prototype.validateLocalData = function (data) {
  return true;
};

/** 엔트리에 데이터 전송하기
 * Web Socket(엔트리)에 아날로그, 디지털등 데이터 전송
 * @param handler
 */
Module.prototype.requestRemoteData = function (handler) {
  var self = this;
  if (!self.sensorData) {
    return;
  }
  Object.keys(this.sensorData).forEach(function (key) {
    if (self.sensorData[ key ] != undefined) {
      handler.write(key, self.sensorData[ key ]);
    }
  });
};

// Web Socket 데이터 처리
Module.prototype.handleRemoteData = function (handler) {
  var self = this;
  var getDatas = handler.read('GET');
  var setDatas = handler.read('SET') || this.defaultOutput;
  var time = handler.read('TIME');
  var buffer = new Buffer([]);

  if (getDatas) {
    var keys = Object.keys(getDatas);
    keys.forEach(function (key) {
      var isSend = false;
      var dataObj = getDatas[ key ];
      if (
        typeof dataObj.port === 'string' ||
        typeof dataObj.port === 'number'
      ) {
        var time = self.digitalPortTimeList[ dataObj.port ];
        if (dataObj.time > time) {
          isSend = true;
          self.digitalPortTimeList[ dataObj.port ] = dataObj.time;
        }
      } else if (Array.isArray(dataObj.port)) {
        isSend = dataObj.port.every(function (port) {
          var time = self.digitalPortTimeList[ port ];
          return dataObj.time > time;
        });

        if (isSend) {
          dataObj.port.forEach(function (port) {
            self.digitalPortTimeList[ port ] = dataObj.time;
          });
        }
      }

      if (isSend) {
        if (!self.isRecentData(dataObj.port, key, dataObj.data)) {
          self.recentCheckData[ dataObj.port ] = {
            type: key,
            data: dataObj.data
          };
          buffer = Buffer.concat([
            buffer,
            self.makeSensorReadBuffer(
              key,
              dataObj.port,
              dataObj.data
            )
          ]);
        }
      }
    });
  }

  if (setDatas) {
    var setKeys = Object.keys(setDatas);
    setKeys.forEach(function (port) {
      var data = setDatas[ port ];
      if (data) {
        if (self.digitalPortTimeList[ port ] < data.time) {
          self.digitalPortTimeList[ port ] = data.time;

          if (!self.isRecentData(port, data.type, data.data)) {
            self.recentCheckData[ port ] = {
              type: data.type,
              data: data.data
            };

            buffer = Buffer.concat([ buffer, self.makeOutputBuffer(data.type, port, data.data) ]);
          }
        }
      }
    });
  }

  if (buffer.length) {
    this.sendBuffers.push(buffer);
  }
};

/**
 * 기존에 수신했던 데이터인가
 * 기존에 수신했던 데이터인지 확인합니다. 예를들어 LED ON/OFF의 경우 무한루프에서 상태가 변하지 않을 경우 추가로 신호를 하드웨어에 보내서 불필요한 오버헤드를
 * 발생시킬 필요가 없으므로, 같은 신호에 대해서는 중복으로 보내지 않도록 만듭니다.
 * 하지만, Tone과 같이 같은 신호라도 출력데이터를 보내야하므로 별도의 예외처리가 필요합니다.
 * @param port
 * @param type
 * @param data
 * @returns {boolean}
 */
Module.prototype.isRecentData = function (port, type, data) {
  var that = this;
  var isRecent = false;

  if (type == this.sensorTypes.ULTRASONIC) {
    var portString = port.toString();
    var isGarbageClear = false;
    Object.keys(this.recentCheckData).forEach(function (key) {
      var recent = that.recentCheckData[ key ];
      if (key === portString) {

      }
      if (key !== portString && recent.type == that.sensorTypes.ULTRASONIC) {
        delete that.recentCheckData[ key ];
        isGarbageClear = true;
      }
    });

    if ((port in this.recentCheckData && isGarbageClear) || !(port in this.recentCheckData)) {
      isRecent = false;
    } else {
      isRecent = true;
    }
  } else if (port in this.recentCheckData ) {
//   제외하고 싶은 센서 타입은 아래 조건문에 추가합니다.
    if(type != this.sensorTypes.TONE && type != this.sensorTypes.LCD_CLEAR){
      if (
        this.recentCheckData[ port ].type === type &&
        this.recentCheckData[ port ].data === data
      ) {
        isRecent = true;
      }
    }
  }

  return isRecent;
};

/**
 * 송신(PC->하드웨어) 데이터
 * 시리얼통신으로 버퍼에 쌓아놓은 데이터를 전송합니다.
 * @returns {null}
 */
Module.prototype.requestLocalData = function () {
  var self = this;

  if (!this.isDraing && this.sendBuffers.length > 0) {
    var sendBuffer = this.sendBuffers.shift();

    this.isDraing = true;
    this.sp.write(sendBuffer, function () {
      if (self.sp) {
        self.sp.drain(function () {
          self.isDraing = false;
        });
      }
    });
  }

  return null;
};

/** 수신(하드웨어->PC) 데이터 처리
 *ff 55 idx size data a
 */
Module.prototype.handleLocalData = function (data) {
  var self = this;
  var datas = this.getDataByBuffer(data);

  datas.forEach(function (data) {
    if (data.length <= 4 || data[ 0 ] !== 255 || data[ 1 ] !== 85) {
      return;
    }
    var readData = data.subarray(2, data.length);
    var value;
    switch (readData[ 0 ]) {
      case self.sensorValueSize.FLOAT: {
        value = new Buffer(readData.subarray(1, 5)).readFloatLE();
        value = Math.round(value * 100) / 100;
        break;
      }
      case self.sensorValueSize.SHORT: {
        value = new Buffer(readData.subarray(1, 3)).readInt16LE();
        break;
      }
      default: {
        value = 0;
        break;
      }
    }

    var type = readData[ readData.length - 1 ];
    var port = readData[ readData.length - 2 ];

    switch (type) {
      case self.sensorTypes.DIGITAL: {
        self.sensorData.DIGITAL[ port ] = value;
        break;
      }
      case self.sensorTypes.ANALOG: {
        self.sensorData.ANALOG[ port ] = value;
        break;
      }
      case self.sensorTypes.PULSEIN: {
        self.sensorData.PULSEIN[ port ] = value;
        break;
      }
      case self.sensorTypes.ULTRASONIC: {
        self.sensorData.ULTRASONIC = value;
        break;
      }
      case self.sensorTypes.TIMER: {
        self.sensorData.TIMER = value;
        break;
      }
      default: {
        break;
      }
    }
  });
};

/*
ff 55 len idx action device port  slot  data a
0  1  2   3   4      5      6     7     8
*/
Module.prototype.makeSensorReadBuffer = function (device, port, data) {
  var buffer;
  var dummy = new Buffer([ 10 ]);
  if (device == this.sensorTypes.ULTRASONIC) {
    buffer = new Buffer([
      255,
      85,
      6,
      sensorIdx,
      this.actionTypes.GET,
      device,
      port[ 0 ],
      port[ 1 ],
      10
    ]);
  } else if (!data) {
    buffer = new Buffer([
      255,
      85,
      5,
      sensorIdx,
      this.actionTypes.GET,
      device,
      port,
      10
    ]);
  } else {
    value = new Buffer(2);
    value.writeInt16LE(data);
    buffer = new Buffer([
      255,
      85,
      7,
      sensorIdx,
      this.actionTypes.GET,
      device,
      port,
      10
    ]);
    buffer = Buffer.concat([ buffer, value, dummy ]);
  }
  sensorIdx++;
  if (sensorIdx > 254) {
    sensorIdx = 0;
  }

  return buffer;
};
/** 전송(PC->하드웨어) 버퍼 만들기
 * 0xff 0x55 0x6 0x0 0x1 0xa 0x9 0x0 0x0 0xa
 * @param device
 * @param port
 * @param data
 * @returns {*}
 */
Module.prototype.makeOutputBuffer = function (device, port, data) {
  var buffer;
  var value = new Buffer(2);
  var dummy = new Buffer([ 10 ]);

  switch (device) {
    case this.sensorTypes.SERVO_PIN:
    case this.sensorTypes.DIGITAL:
    case this.sensorTypes.PWM: {
      value.writeInt16LE(data);
      buffer = new Buffer([
        255,
        85,
        6,
        sensorIdx,
        this.actionTypes.SET,
        device,
        port
      ]);
      buffer = Buffer.concat([ buffer, value, dummy ]);
      break;
    }
    case this.sensorTypes.TONE: {
      var time = new Buffer(2);
      if ($.isPlainObject(data)) {
        value.writeInt16LE(data.value);
        time.writeInt16LE(data.duration);
      } else {
        value.writeInt16LE(0);
        time.writeInt16LE(0);
      }
      buffer = new Buffer([
        255,
        85,
        8,
        sensorIdx,
        this.actionTypes.SET,
        device,
        port
      ]);
      buffer = Buffer.concat([ buffer, value, time, dummy ]);
      break;
    }
    case this.sensorTypes.LCD_PRINT: {
      var text;
      var row = Buffer(1);
      var column = Buffer(1);
      var textLen = 0;
      var textLenBuf = Buffer(1);

      if ($.isPlainObject(data)) {
//        numeric 데이터로 들어오는 경우가 있으므로, 문자열로 변경하기
        textLen = ('' + data.text).length;
        text = Buffer.from("" + data.text, 'ascii');
        row.writeInt8(data.row);
        textLenBuf.writeInt8(textLen);
        column.writeInt8(data.column);
      } else {
        textLen = 0;
        text = Buffer.from('', 'ascii');
        row.writeInt8(0);
        textLenBuf.writeInt8(textLen);
        column.writeInt8(0);
      }

      buffer = new Buffer([
        255,
        85,
        4 + 3 + textLen,
        sensorIdx,
        this.actionTypes.SET,
        device,
        port
      ]);

      buffer = Buffer.concat([ buffer, row, column, textLenBuf, text, dummy ]);

      console.log('write lcd');
      break;
    }
    case this.sensorTypes.LCD_CLEAR: {
      console.log('clear lcd');

      buffer = new Buffer([
        255,
        85,
        4,
        sensorIdx,
        this.actionTypes.SET,
        device,
        port
      ]);

      buffer = Buffer.concat([ buffer, dummy ]);
      break;
    }
  }

  console.log(buffer);

  return buffer;
};

Module.prototype.getDataByBuffer = function (buffer) {
  var datas = [];
  var lastIndex = 0;
  buffer.forEach(function (value, idx) {
    if (value == 13 && buffer[ idx + 1 ] == 10) {
      datas.push(buffer.subarray(lastIndex, idx));
      lastIndex = idx + 2;
    }
  });

  return datas;
};

Module.prototype.disconnect = function (connect) {
  var self = this;
  connect.close();
  if (self.sp) {
    delete self.sp;
  }
};

// Web Socket 종료후 처리
Module.prototype.reset = function () {
  this.lastTime = 0;
  this.lastSendTime = 0;

  this.sensorData.PULSEIN = {};
};

module.exports = new Module();
