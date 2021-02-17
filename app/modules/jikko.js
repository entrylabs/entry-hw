function Module() {
  this.sp = null;
  this.sensorTypes = {
    ALIVE: 0,
    DIGITAL: 1,
    ANALOG: 2,
    PWM: 3,
    SERVO: 4,
    TONE: 5,
    PULSEIN: 6,
    ULTRASONIC: 7,
    TIMER: 8,
    LCD: 11,
    LCDCLEAR: 12,
    DCMOTOR: 14,
    PIR: 16,
    LCDINIT: 17,
    DHTHUMI: 18,
    DHTTEMP: 19,
    NEOPIXELINIT: 20,
    NEOPIXELBRIGHT: 21,
    NEOPIXEL: 22,
    NEOPIXELALL: 23,
    NEOPIXELCLEAR: 24,
    DOTMATRIXINIT: 25,
    DOTMATRIXBRIGHT: 26,
    DOTMATRIX: 27,
    DOTMATRIXEMOJI: 28,
    DOTMATRIXCLEAR: 29,
    MP3INIT: 30,
    MP3PLAY1: 31,
    MP3PLAY2: 32,
    MP3VOL: 33,
    LOADINIT: 35,
    LOADSCALE: 36,
    LOADVALUE: 37,
    DUST: 38,
    JOYINIT: 39,
    JOYX: 40,
    JOYY: 41,
    JOYZ: 42,
    JOYMOVE: 43,
    RFIDINIT: 44,
    RFIDTAP: 45,
    RFIDVALUE: 46,
    STEPINIT: 47,
    STEPSPEED: 48,
    STEPROTATE: 49,
    STEPROTATE2: 50,
    STEPROTATE3: 51,
  };

  this.actionTypes = {
    GET: 1,
    SET: 2,
    MODUEL: 3,
    RESET: 4,
  };

  this.sensorValueSize = {
    FLOAT: 2,
    SHORT: 3,
    STRING: 4,
  };

  this.digitalPortTimeList = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  this.sensorData = {
    ULTRASONIC: {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
      7: 0,
      8: 0,
      9: 0,
      10: 0,
      11: 0,
      12: 0,
      13: 0,
    },
    DHTTEMP: 0,
    DHTHUMI: 0,
    LOADVALUE: 0,
    RFIDTAP: 0,
    RFIDVALUE: 0,
    DUST: 0,
    JOYX: 0,
    JOYY: 0,
    JOYZ: 0,
    DIGITAL: {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
      6: 0,
      7: 0,
      8: 0,
      9: 0,
      10: 0,
      11: 0,
      12: 0,
      13: 0,
    },
    ANALOG: {
      0: 0,
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    },
    PULSEIN: {},
    TIMER: 0,
  };

  this.defaultOutput = {};

  this.recentCheckData = {};

  this.sendBuffers = [];

  this.lastTime = 0;
  this.lastSendTime = 0;
  this.isDraing = false;
}

let sensorIdx = 0;

Module.prototype.init = function (handler, config) {};

Module.prototype.setSerialPort = function (sp) {
  const self = this;
  this.sp = sp;
};

Module.prototype.requestInitialData = function () {
  return true;
  // MRT 개선 코드 구성 중 : 주석 처리 시 자사 다른 펌웨어와의 연결 오류 없음
  //return this.makeSensorReadBuffer(this.sensorTypes.ANALOG, 0);
};

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
    cb("connected");
  }
};

Module.prototype.validateLocalData = function (data) {
  return true;
};

Module.prototype.requestRemoteData = function (handler) {
  const self = this;
  if (!self.sensorData) {
    return;
  }
  Object.keys(this.sensorData).forEach((key) => {
    if (self.sensorData[key] != undefined) {
      handler.write(key, self.sensorData[key]);
    }
  });
};

Module.prototype.handleRemoteData = function (handler) {
  const self = this;
  const getDatas = handler.read("GET");
  const setDatas = handler.read("SET") || this.defaultOutput;
  const time = handler.read("TIME");
  let buffer = new Buffer([]);
  if (getDatas) {
    const keys = Object.keys(getDatas);
    keys.forEach((key) => {
      let isSend = false;
      const dataObj = getDatas[key];
      if (
        typeof dataObj.port === "string" ||
        typeof dataObj.port === "number"
      ) {
        const time = self.digitalPortTimeList[dataObj.port];
        if (dataObj.time > time) {
          isSend = true;
          self.digitalPortTimeList[dataObj.port] = dataObj.time;
        }
      } else if (Array.isArray(dataObj.port)) {
        isSend = dataObj.port.every((port) => {
          const time = self.digitalPortTimeList[port];
          return dataObj.time > time;
        });

        if (isSend) {
          dataObj.port.forEach((port) => {
            self.digitalPortTimeList[port] = dataObj.time;
          });
        }
      }

      if (isSend) {
        if (!self.isRecentData(dataObj.port, key, dataObj.data)) {
          self.recentCheckData[dataObj.port] = {
            type: key,
            data: dataObj.data,
          };
          buffer = Buffer.concat([
            buffer,
            self.makeSensorReadBuffer(key, dataObj.port, dataObj.data),
          ]);
        }
      }
    });
  }

  if (setDatas) {
    const setKeys = Object.keys(setDatas);
    setKeys.forEach((port) => {
      const data = setDatas[port];
      if (data) {
        if (self.digitalPortTimeList[port] < data.time) {
          self.digitalPortTimeList[port] = data.time;

          if (!self.isRecentData(port, data.type, data.data)) {
            self.recentCheckData[port] = {
              type: data.type,
              data: data.data,
            };
            buffer = Buffer.concat([
              buffer,
              self.makeOutputBuffer(data.type, port, data.data),
            ]);
          }
        }
      }
    });
  }
  if (buffer.length) {
    this.sendBuffers.push(buffer);
  }
};

Module.prototype.isRecentData = function (port, type, data) {
  var that = this;
  var isRecent = false;

  if (type == this.sensorTypes.ULTRASONIC) {
    var portString = port.toString();
    var isGarbageClear = false;
    Object.keys(this.recentCheckData).forEach(function (key) {
      var recent = that.recentCheckData[key];
      if (key === portString) {
      }
      if (key !== portString && recent.type == that.sensorTypes.ULTRASONIC) {
        delete that.recentCheckData[key];
        isGarbageClear = true;
      }
    });

    if (
      (port in this.recentCheckData && isGarbageClear) ||
      !(port in this.recentCheckData)
    ) {
      isRecent = false;
    } else {
      isRecent = true;
    }
  } else if (port in this.recentCheckData && type != this.sensorTypes.TONE) {
    if (
      this.recentCheckData[port].type === type &&
      this.recentCheckData[port].data === data
    ) {
      isRecent = true;
    }
  }

  return isRecent;
};

Module.prototype.requestLocalData = function () {
  const self = this;

  if (!this.isDraing && this.sendBuffers.length > 0) {
    this.isDraing = true;
    this.sp.write(this.sendBuffers.shift(), () => {
      if (self.sp) {
        self.sp.drain(() => {
          self.isDraing = false;
        });
      }
    });
  }

  return null;
};

/*
ff 55 idx size data a
*/
Module.prototype.handleLocalData = function (data) {
  const self = this;
  const datas = this.getDataByBuffer(data);

  datas.forEach((data) => {
    if (data.length <= 4 || data[0] !== 255 || data[1] !== 85) {
      return;
    }
    const readData = data.subarray(2, data.length);
    let value;
    switch (readData[0]) {
      case self.sensorValueSize.FLOAT: {
        value = new Buffer(readData.subarray(1, 5)).readFloatLE();
        value = Math.round(value * 100) / 100;
        break;
      }
      case self.sensorValueSize.SHORT: {
        value = new Buffer(readData.subarray(1, 3)).readInt16LE();
        break;
      }
      case self.sensorValueSize.STRING: {
        value = new Buffer(readData[1] + 3);
        value = readData.slice(2, readData[1] + 3);
        // value = value.toString('ascii', 0, value.length);
        value = value.toString();
        break;
      }
      default: {
        value = 0;
        break;
      }
    }

    const type = readData[readData.length - 1];
    const port = readData[readData.length - 2];

    switch (type) {
      case self.sensorTypes.DIGITAL: {
        self.sensorData.DIGITAL[port] = value;
        break;
      }
      case self.sensorTypes.ANALOG: {
        self.sensorData.ANALOG[port] = value;
        break;
      }
      case self.sensorTypes.PULSEIN: {
        self.sensorData.PULSEIN[port] = value;
        break;
      }
      case self.sensorTypes.DHTTEMP: {
        self.sensorData.DHTTEMP = value;
        break;
      }
      case self.sensorTypes.DHTHUMI: {
        self.sensorData.DHTHUMI = value;
        break;
      }
      case self.sensorTypes.ULTRASONIC: {
        self.sensorData.ULTRASONIC[port] = value;
        //      console.log(port);
        //      console.log(self.sensorData.ULTRASONIC[port]);
        break;
      }
      case self.sensorTypes.DUST: {
        self.sensorData.DUST = value;
        break;
      }
      case self.sensorTypes.TIMER: {
        self.sensorData.TIMER = value;
        break;
      }
      case self.sensorTypes.LOADVALUE: {
        self.sensorData.LOADVALUE = value;
        break;
      }
      case self.sensorTypes.RFIDTAP: {
        self.sensorData.RFIDTAP = value;
        // console.log('RFIDTAP');
        // console.log(value);
        break;
      }
      case self.sensorTypes.RFIDVALUE: {
        value = value.substring(0, value.length - 1); //마지막에 쓰레기값 출력X
        self.sensorData.RFIDVALUE = value;
        // console.log(value);
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
  let buffer;
  const dummy = new Buffer([10]);
  if (device == this.sensorTypes.DIGITAL) {
    //data 2: pull up, 0: normal
    if (!data) {
      buffer = new Buffer([
        255,
        85,
        6,
        sensorIdx,
        this.actionTypes.GET,
        device,
        port,
        0,
        10,
      ]);
    } else {
      //pullup인 경우
      buffer = new Buffer([
        255,
        85,
        6,
        sensorIdx,
        this.actionTypes.GET,
        device,
        port,
        data,
        10,
      ]);
    }
    //console.log(buffer);
  } else if (device == this.sensorTypes.RFIDTAP) {
    buffer = new Buffer([
      255,
      85,
      5,
      sensorIdx,
      this.actionTypes.GET,
      device,
      port,
      10,
    ]);
  } else if (device == this.sensorTypes.ULTRASONIC) {
    buffer = new Buffer([
      255,
      85,
      6,
      sensorIdx,
      this.actionTypes.GET,
      device,
      port[0],
      port[1],
      10,
    ]);
  } else if (device == this.sensorTypes.DUST) {
    buffer = new Buffer([
      255,
      85,
      6,
      sensorIdx,
      this.actionTypes.GET,
      device,
      port[0],
      port[1],
      10,
    ]);
  } else if (device == this.sensorTypes.DHTTEMP) {
    buffer = new Buffer([
      255,
      85,
      5,
      sensorIdx,
      this.actionTypes.GET,
      device,
      port,
      10,
    ]);
  } else if (device == this.sensorTypes.DHTHUMI) {
    buffer = new Buffer([
      255,
      85,
      5,
      sensorIdx,
      this.actionTypes.GET,
      device,
      port,
      10,
    ]);
  } else if (device == this.sensorTypes.LOADVALUE) {
    buffer = new Buffer([
      255,
      85,
      5,
      sensorIdx,
      this.actionTypes.GET,
      device,
      port,
      10,
    ]);
  } else if (device == this.sensorTypes.RFIDVALUE) {
    buffer = new Buffer([
      255,
      85,
      5,
      sensorIdx,
      this.actionTypes.GET,
      device,
      port,
      10,
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
      10,
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
      10,
    ]);
    buffer = Buffer.concat([buffer, value, dummy]);
  }
  sensorIdx++;
  if (sensorIdx > 254) {
    sensorIdx = 0;
  }

  return buffer;
};

//0xff 0x55 0x6 0x0 0x1 0xa 0x9 0x0 0x0 0xa
Module.prototype.makeOutputBuffer = function (device, port, data) {
  let buffer;
  const value = new Buffer(2);
  const dummy = new Buffer([10]);
  switch (device) {
    case this.sensorTypes.SERVO: {
      value.writeInt16LE(data);
      buffer = new Buffer([
        255,
        85,
        6,
        sensorIdx,
        this.actionTypes.SET,
        device,
        port,
      ]);
      buffer = Buffer.concat([buffer, value, dummy]);
      break;
    }
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
        port,
      ]);
      buffer = Buffer.concat([buffer, value, dummy]);
      break;
    }
    case this.sensorTypes.RESET_: {
      buffer = new Buffer([
        255,
        85,
        4,
        sensorIdx,
        this.actionTypes.SET,
        device,
        port,
      ]);
      buffer = Buffer.concat([buffer, dummy]);
      break;
    }
    case this.sensorTypes.TONE: {
      const time = new Buffer(2);
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
        port,
      ]);
      buffer = Buffer.concat([buffer, value, time, dummy]);
      break;
    }
    case this.sensorTypes.DCMOTOR: {
      const directionPort = new Buffer(2);
      const speedPort = new Buffer(2);
      const directionValue = new Buffer(2);
      const speedValue = new Buffer(2);
      if ($.isPlainObject(data)) {
        directionPort.writeInt16LE(data.port0);
        speedPort.writeInt16LE(data.port1);
        directionValue.writeInt16LE(data.value0);
        speedValue.writeInt16LE(data.value1);
      } else {
        directionPort.writeInt16LE(0);
        speedPort.writeInt16LE(0);
        directionValue.writeInt16LE(0);
        speedValue.writeInt16LE(0);
      }
      buffer = new Buffer([
        255,
        85,
        12,
        sensorIdx,
        this.actionTypes.SET,
        device,
        port,
      ]);
      buffer = Buffer.concat([
        buffer,
        directionPort,
        speedPort,
        directionValue,
        speedValue,
        dummy,
      ]);
      break;
    }
    case this.sensorTypes.NEOPIXELINIT: {
      console.log("NEOPIXELINIT");
      value.writeInt16LE(data);
      buffer = new Buffer([
        255,
        85,
        6,
        sensorIdx,
        this.actionTypes.SET,
        device,
        port,
      ]);
      buffer = Buffer.concat([buffer, value, dummy]);
      break;
    }
    case this.sensorTypes.NEOPIXELBRIGHT: {
      value.writeInt16LE(data);
      buffer = new Buffer([
        255,
        85,
        6,
        sensorIdx,
        this.actionTypes.SET,
        device,
        port,
      ]);
      buffer = Buffer.concat([buffer, value, dummy]);
      break;
    }
    case this.sensorTypes.NEOPIXEL: {
      const num = new Buffer(2);
      const r = new Buffer(2);
      const g = new Buffer(2);
      const b = new Buffer(2);
      if ($.isPlainObject(data)) {
        num.writeInt16LE(data.num);
        r.writeInt16LE(data.r);
        g.writeInt16LE(data.g);
        b.writeInt16LE(data.b);
      } else {
        num.writeInt16LE(0);
        r.writeInt16LE(0);
        g.writeInt16LE(0);
        b.writeInt16LE(0);
      }
      buffer = new Buffer([
        255,
        85,
        12,
        sensorIdx,
        this.actionTypes.SET,
        device,
        port,
      ]);
      buffer = Buffer.concat([buffer, num, r, g, b, dummy]);
      break;
    }
    case this.sensorTypes.NEOPIXELALL: {
      const r = new Buffer(2);
      const g = new Buffer(2);
      const b = new Buffer(2);
      if ($.isPlainObject(data)) {
        r.writeInt16LE(data.r);
        g.writeInt16LE(data.g);
        b.writeInt16LE(data.b);
      } else {
        r.writeInt16LE(0);
        g.writeInt16LE(0);
        b.writeInt16LE(0);
      }
      buffer = new Buffer([
        255,
        85,
        10,
        sensorIdx,
        this.actionTypes.SET,
        device,
        port,
      ]);
      buffer = Buffer.concat([buffer, r, g, b, dummy]);
      break;
    }
    case this.sensorTypes.NEOPIXELCLEAR: {
      buffer = new Buffer([
        255,
        85,
        4,
        sensorIdx,
        this.actionTypes.SET,
        device,
        port,
      ]);
      buffer = Buffer.concat([buffer, dummy]);
      break;
    }
    case this.sensorTypes.JOYINIT: {
      const port1 = new Buffer(2);
      const port2 = new Buffer(2);
      const port3 = new Buffer(2);
      if ($.isPlainObject(data)) {
        port1.writeInt16LE(data.port1);
        port2.writeInt16LE(data.port2);
        port3.writeInt16LE(data.port3);
      } else {
        port1.writeInt16LE(0);
        port2.writeInt16LE(0);
        port3.writeInt16LE(0);
      }
      buffer = new Buffer([
        255,
        85,
        10,
        sensorIdx,
        this.actionTypes.SET,
        device,
        port,
      ]);
      buffer = Buffer.concat([buffer, port1, port2, port3, dummy]);
      break;
    }
    case this.sensorTypes.STEPINIT: {
      const num = new Buffer(2);
      const port1 = new Buffer(2);
      const port2 = new Buffer(2);
      const port3 = new Buffer(2);
      const port4 = new Buffer(2);
      if ($.isPlainObject(data)) {
        num.writeInt16LE(data.num);
        port1.writeInt16LE(data.port1);
        port2.writeInt16LE(data.port2);
        port3.writeInt16LE(data.port3);
        port4.writeInt16LE(data.port4);
      } else {
        num.writeInt16LE(0);
        port1.writeInt16LE(0);
        port2.writeInt16LE(0);
        port3.writeInt16LE(0);
        port4.writeInt16LE(0);
      }
      buffer = new Buffer([
        255,
        85,
        14,
        sensorIdx,
        this.actionTypes.SET,
        device,
        port,
      ]);
      buffer = Buffer.concat([buffer, num, port1, port2, port3, port4, dummy]);
      break;
    }
    case this.sensorTypes.STEPSPEED: {
      const num = new Buffer(2);
      const speed = new Buffer(2);
      if ($.isPlainObject(data)) {
        num.writeInt16LE(data.num);
        speed.writeInt16LE(data.speed);
      } else {
        num.writeInt16LE(0);
        speed.writeInt16LE(0);
      }
      buffer = new Buffer([
        255,
        85,
        8,
        sensorIdx,
        this.actionTypes.SET,
        device,
        port,
      ]);
      buffer = Buffer.concat([buffer, num, speed, dummy]);
      break;
    }
    case this.sensorTypes.STEPROTATE: {
      const num = new Buffer(2);
      const dir = new Buffer(2);
      const val = new Buffer(4);
      if ($.isPlainObject(data)) {
        num.writeInt16LE(data.num);
        dir.writeInt16LE(data.dir);
        val.writeFloatLE(data.val);
      } else {
        num.writeInt16LE(0);
        dir.writeInt16LE(0);
        val.writeFloatLE(0);
      }
      buffer = new Buffer([
        255,
        85,
        12,
        sensorIdx,
        this.actionTypes.SET,
        device,
        port,
      ]);
      buffer = Buffer.concat([buffer, num, dir, val, dummy]);
      break;
    }
    case this.sensorTypes.STEPROTATE2: {
      const num = new Buffer(2);
      const dir = new Buffer(2);
      const val = new Buffer(4);
      if ($.isPlainObject(data)) {
        num.writeInt16LE(data.num);
        dir.writeInt16LE(data.dir);
        val.writeFloatLE(data.val);
      } else {
        num.writeInt16LE(0);
        dir.writeInt16LE(0);
        val.writeFloatLE(0);
      }
      buffer = new Buffer([
        255,
        85,
        12,
        sensorIdx,
        this.actionTypes.SET,
        device,
        port,
      ]);
      buffer = Buffer.concat([buffer, num, dir, val, dummy]);
      break;
    }
    case this.sensorTypes.STEPROTATE3: {
      const num = new Buffer(2);
      const dir = new Buffer(2);
      const sec = new Buffer(2);
      if ($.isPlainObject(data)) {
        num.writeInt16LE(data.num);
        dir.writeInt16LE(data.dir);
        sec.writeInt16LE(data.sec);
      } else {
        num.writeInt16LE(0);
        dir.writeInt16LE(0);
        sec.writeInt16LE(0);
      }
      buffer = new Buffer([
        255,
        85,
        10,
        sensorIdx,
        this.actionTypes.SET,
        device,
        port,
      ]);
      buffer = Buffer.concat([buffer, num, dir, sec, dummy]);
      break;
    }
    case this.sensorTypes.STEPSTOP: {
      buffer = new Buffer([
        255,
        85,
        4,
        sensorIdx,
        this.actionTypes.SET,
        device,
        port,
      ]);
      buffer = Buffer.concat([buffer, dummy]);
      break;
    }
    case this.sensorTypes.DOTMATRIXINIT: {
      const port1 = new Buffer(2);
      const port2 = new Buffer(2);
      const port3 = new Buffer(2);
      if ($.isPlainObject(data)) {
        port1.writeInt16LE(data.port1);
        port2.writeInt16LE(data.port2);
        port3.writeInt16LE(data.port3);
      } else {
        port1.writeInt16LE(0);
        port2.writeInt16LE(0);
        port3.writeInt16LE(0);
      }
      buffer = new Buffer([
        255,
        85,
        10,
        sensorIdx,
        this.actionTypes.SET,
        device,
        port,
      ]);
      buffer = Buffer.concat([buffer, port1, port2, port3, dummy]);
      break;
    }
    case this.sensorTypes.DOTMATRIXBRIGHT: {
      value.writeInt16LE(data);
      buffer = new Buffer([
        255,
        85,
        6,
        sensorIdx,
        this.actionTypes.SET,
        device,
        port,
      ]);
      buffer = Buffer.concat([buffer, value, dummy]);
      break;
    }
    case this.sensorTypes.DOTMATRIX: {
      var text;
      var textLen = 0;
      var textLenBuf = Buffer(2);
      if ($.isPlainObject(data)) {
        textLen = ("" + data.text).length;
        text = Buffer.from("" + data.text);
        textLenBuf.writeInt16LE(textLen);
      } else {
        textLen = 0;
        text = Buffer.from("", "ascii");
        textLenBuf.writeInt16LE(textLen);
      }
      buffer = new Buffer([
        255,
        85,
        4 + 2 + textLen,
        sensorIdx,
        this.actionTypes.SET,
        device,
        port,
      ]);
      buffer = Buffer.concat([buffer, textLenBuf, text, dummy]);
      break;
    }
    case this.sensorTypes.DOTMATRIXEMOJI: {
      value.writeInt16LE(data);
      buffer = new Buffer([
        255,
        85,
        6,
        sensorIdx,
        this.actionTypes.SET,
        device,
        port,
      ]);
      buffer = Buffer.concat([buffer, value, dummy]);
      break;
    }
    case this.sensorTypes.DOTMATRIXCLEAR: {
      buffer = new Buffer([
        255,
        85,
        4,
        sensorIdx,
        this.actionTypes.SET,
        device,
        port,
      ]);
      buffer = Buffer.concat([buffer, dummy]);
      break;
    }
    case this.sensorTypes.LCDINIT: {
      var list = new Buffer(2);
      var line = new Buffer(2);
      var col = new Buffer(2);
      if ($.isPlainObject(data)) {
        list.writeInt16LE(data.list);
        line.writeInt16LE(data.line);
        col.writeInt16LE(data.col);
      }
      buffer = new Buffer([
        255,
        85,
        10,
        sensorIdx,
        this.actionTypes.MODUEL,
        device,
        port,
      ]);
      buffer = Buffer.concat([buffer, list, col, line, dummy]);

      break;
    }
    case this.sensorTypes.LCDCLEAR: {
      buffer = new Buffer([
        255,
        85,
        4,
        sensorIdx,
        this.actionTypes.MODUEL,
        device,
        port,
      ]);
      buffer = Buffer.concat([buffer, dummy]);
      break;
    }
    case this.sensorTypes.LCD: {
      var text;
      var line = new Buffer(2);
      var col = new Buffer(2);
      var textLen = 0;
      var textLenBuf = Buffer(2);

      if ($.isPlainObject(data)) {
        textLen = ("" + data.text).length;
        // console.log(textLen);
        text = Buffer.from("" + data.text, "ascii");
        line.writeInt16LE(data.line);
        textLenBuf.writeInt16LE(textLen);
        col.writeInt16LE(data.column);
      } else {
        textLen = 0;
        text = Buffer.from("", "ascii");
        line.writeInt16LE(0);
        textLenBuf.writeInt16LE(textLen);
        col.writeInt16LE(0);
      }

      buffer = new Buffer([
        255,
        85,
        4 + 6 + textLen,
        sensorIdx,
        this.actionTypes.MODUEL,
        device,
        port,
      ]);

      buffer = Buffer.concat([buffer, line, col, textLenBuf, text, dummy]);
      break;
    }
    case this.sensorTypes.MP3INIT: {
      const tx = new Buffer(2);
      const rx = new Buffer(2);

      if ($.isPlainObject(data)) {
        tx.writeInt16LE(data.tx);
        rx.writeInt16LE(data.rx);
      } else {
        tx.writeInt16LE(0);
        rx.writeInt16LE(0);
      }

      buffer = new Buffer([
        255,
        85,
        8,
        sensorIdx,
        this.actionTypes.SET,
        device,
        port,
      ]);

      buffer = Buffer.concat([buffer, tx, rx, dummy]);
      break;
    }
    case this.sensorTypes.MP3PLAY1: {
      const tx = new Buffer(2);
      const num = new Buffer(2);

      if ($.isPlainObject(data)) {
        tx.writeInt16LE(data.tx);
        num.writeInt16LE(data.num);
      } else {
        tx.writeInt16LE(0);
        num.writeInt16LE(0);
      }

      buffer = new Buffer([
        255,
        85,
        8,
        sensorIdx,
        this.actionTypes.SET,
        device,
        port,
      ]);

      buffer = Buffer.concat([buffer, tx, num, dummy]);
      break;
    }
    case this.sensorTypes.MP3PLAY2: {
      const tx = new Buffer(2);
      const num = new Buffer(2);
      const time_value = new Buffer(2);

      if ($.isPlainObject(data)) {
        tx.writeInt16LE(data.tx);
        num.writeInt16LE(data.num);
        time_value.writeInt16LE(data.time_value);
      } else {
        tx.writeInt16LE(0);
        num.writeInt16LE(0);
        time_value.writeInt16LE(0);
      }

      buffer = new Buffer([
        255,
        85,
        10,
        sensorIdx,
        this.actionTypes.SET,
        device,
        port,
      ]);

      buffer = Buffer.concat([buffer, tx, num, time_value, dummy]);
      break;
    }
    case this.sensorTypes.MP3VOL: {
      const tx = new Buffer(2);
      const vol = new Buffer(2);

      if ($.isPlainObject(data)) {
        tx.writeInt16LE(data.tx);
        vol.writeInt16LE(data.vol);
      } else {
        tx.writeInt16LE(0);
        vol.writeInt16LE(0);
      }

      buffer = new Buffer([
        255,
        85,
        8,
        sensorIdx,
        this.actionTypes.SET,
        device,
        port,
      ]);

      buffer = Buffer.concat([buffer, tx, vol, dummy]);
      break;
    }
    case this.sensorTypes.LOADINIT: {
      const port1 = new Buffer(2);
      const port2 = new Buffer(2);
      if ($.isPlainObject(data)) {
        port1.writeInt16LE(data.port1);
        port2.writeInt16LE(data.port2);
      } else {
        port1.writeInt16LE(0);
        port2.writeInt16LE(0);
      }
      buffer = new Buffer([
        255,
        85,
        8,
        sensorIdx,
        this.actionTypes.SET,
        device,
        port,
      ]);
      buffer = Buffer.concat([buffer, port1, port2, dummy]);
      break;
    }
    case this.sensorTypes.LOADSCALE: {
      const num = new Buffer(4);
      if ($.isPlainObject(data)) {
        num.writeFloatLE(data.num);
      } else {
        num.writeFloatLE(0);
      }
      console.log(num);
      buffer = new Buffer([
        255,
        85,
        8,
        sensorIdx,
        this.actionTypes.SET,
        device,
        port,
      ]);
      buffer = Buffer.concat([buffer, num, dummy]);

      break;
    }
    case this.sensorTypes.RFIDINIT: {
      const port1 = new Buffer(2);
      const port2 = new Buffer(2);
      if ($.isPlainObject(data)) {
        port1.writeInt16LE(data.port1);
        port2.writeInt16LE(data.port2);
      } else {
        port1.writeInt16LE(0);
        port2.writeInt16LE(0);
      }
      buffer = new Buffer([
        255,
        85,
        8,
        sensorIdx,
        this.actionTypes.SET,
        device,
        port,
      ]);
      buffer = Buffer.concat([buffer, port1, port2, dummy]);
      break;
    }
  }

  return buffer;
};

Module.prototype.getDataByBuffer = function (buffer) {
  const datas = [];
  let lastIndex = 0;
  buffer.forEach((value, idx) => {
    if (value == 13 && buffer[idx + 1] == 10) {
      datas.push(buffer.subarray(lastIndex, idx));
      lastIndex = idx + 2;
    }
  });

  return datas;
};

Module.prototype.disconnect = function (connect) {
  const self = this;
  connect.close();
  if (self.sp) {
    delete self.sp;
  }
};

Module.prototype.reset = function () {
  this.lastTime = 0;
  this.lastSendTime = 0;

  this.sensorData.PULSEIN = {};
};

Module.prototype.lostController = function () {};

module.exports = new Module();
