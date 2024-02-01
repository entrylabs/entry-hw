function Module() {
  this.sp = null;
  this.sensorTypes = { 
    ALIVE:    0,
    DIGITAL:  1,
    ANALOG:   2,
    DHT_PIN:  3,
    LCD:      4,
    PWM:      5,
    SERVO_PIN:       6,
    PULSEIN:         7,
    ULTRASONIC:      8,
    TIMER:              9,
    WRITE_SEG:                10,
    READ_SEG: 13,
    READ_BLUETOOTH:     11,
    WRITE_BLUETOOTH:    12,
    GAS:                14
  };
  this.actionTypes = {
    GET:1,
    SET:2,
    MODULE:3,
    RESET:4
  };
  this.sensorValueSize = {
    FLOAT:2,
    SHORT:3,
    STRING:4
  };
  this.digitalPortTimeList = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  this.sensorData = {
    PULSEIN: {},
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
    },
    ANALOG: {
      '0': 0,
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
    },
    DHT_PIN: 0,
    TIMER: 0,
    READ_BLUETOOTH: 0,
    READ_SEG: 0,
  };
  this.defaultOutput = {};
  this.recentCheckData = {};
  this.sendBuffers = [];
  this.lastTime = 0;
  this.lastSendTime = 0;
  this.isDraing = false;
}
var sensorIdx = 0;
Module.prototype.init = function(handler, config) {
};

Module.prototype.setSerialPort = function (sp) {
  var self = this;
  this.sp = sp;
};
Module.prototype.requestInitialData = function() {
  //return this.makeSensorReadBuffer(this.sensorTypes.ANALOG, 0);
  return true;
};
Module.prototype.checkInitialData = function(data, config) {
  return true;
};
Module.prototype.afterConnect = function(that, cb) {
  that.connected = true;
  if (cb) {
      cb('connected');
  }
};
Module.prototype.validateLocalData = function(data) { 
  return true;
};
Module.prototype.isRecentData = function(port, type, data) {
  var that = this;
  var isRecent = false;
  return isRecent;
};
Module.prototype.requestRemoteData = function(handler) {
  var self = this;
  if(!self.sensorData) {
    return;
  }
  Object.keys(this.sensorData).forEach(function (key) {
    if(self.sensorData[key] != undefined) {
        handler.write(key, self.sensorData[key]);           
    }
  })
};
Module.prototype.getDataByBuffer = function(buffer) {
  const datas = []; 
  let lastIndex = 0; 
  buffer.forEach(function (value, idx) {
                    if(value == 13 && buffer[idx+1] == 10) {
                      datas.push(buffer.subarray(lastIndex, idx)); 
                      lastIndex = idx + 2; 
                    }
                  }
                );
  return datas;
};
Module.prototype.handleLocalData = function(data) {
  const self = this;
  const datas = this.getDataByBuffer(data);
  datas.forEach(function(data) {
                    if(data.length <= 4 || data[0] !== 255 || data[1] !== 85) { 
                      return;
                    }
                    const readData = data.subarray(2, data.length); 
                    let value;
                    const type = readData[readData.length - 1];
                    const port = readData[readData.length - 2];
                    switch(readData[0]) { 
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
                        value = value.toString('ascii', 0, value.length);
                        break;
                      }
                      default: {
                        value = 0;
                        break;
                      }
                    }

                    
                   
                    switch(type) {
                      case self.sensorTypes.DIGITAL: {
                        self.sensorData.DIGITAL[port] = value;
                        break;
                      }
                      case self.sensorTypes.ANALOG: {
                        self.sensorData.ANALOG[port] = value;
                        break;
                      }
                      case self.sensorTypes.DHT_PIN: {
                        self.sensorData.DHT_PIN = value;
                        break;
                      }
                      case self.sensorTypes.PULSEIN: {
                        self.sensorData.PULSEIN[port] = value;
                        break;
                      }
                      case self.sensorTypes.ULTRASONIC: {
                        self.sensorData.ULTRASONIC = value;
                        break;
                      }
                      case self.sensorTypes.READ_BLUETOOTH: {
                        self.sensorData.READ_BLUETOOTH = value;
                        break;
                      }
                      case self.sensorTypes.READ_SEG: {
                        self.sensorData.READ_SEG = value;
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
                  }
                );
};
Module.prototype.requestLocalData = function() {
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

Module.prototype.makeSensorReadBuffer = function(device, port, data) {
  let buffer; 
  const dummy = new Buffer([10]); 
  if (device == this.sensorTypes.DIGITAL) {
    if (!data) {
      buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, port, 0, 10]);
    } else {
      buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, port, data, 10]);
    }
  }
  /*
  else if(device == this.sensorTypes.ANALOG) {
    if (!data) {
      buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, port, 0, 10]);
    } else {
      buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, port, data, 10]);
    }
  }
  */
  else if(device == this.sensorTypes.DHT_PIN) {
    //buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, port, 10]);
    
    if (!data) {
      buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, port, 0, 10]);
    } else {
      buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, port, data, 10]);
    }
    
  }
  else if (device == this.sensorTypes.ULTRASONIC) {
    buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, port[0], port[1], 10]);
  } 
  else if (device == this.sensorTypes.READ_BLUETOOTH) {
    buffer = new Buffer([255, 85, 5, sensorIdx, this.actionTypes.GET, device, port, 10]);
  }
  else if (device == this.sensorTypes.READ_SEG) {
    if (!data) {
      buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.GET, device, port, 0, 10]);
    } else {
      buffer = new Buffer([255, 85, 5, sensorIdx, this.actionTypes.GET, device, port, 10]);
    }
    
  }
  else if (!data) {
    buffer = new Buffer([255, 85, 5, sensorIdx, this.actionTypes.GET, device, port, 10]);
    
  } 
  else {
    value = new Buffer(2);
    value.writeInt16LE(data);
    buffer = new Buffer([255, 85, 7, sensorIdx, this.actionTypes.GET, device, port, 10]);
    
    buffer = Buffer.concat([buffer, value, dummy]);
    
  }
  
  sensorIdx++;
  if(sensorIdx > 254) {
    sensorIdx = 0;
  }
  
  return buffer;
};
Module.prototype.makeOutputBuffer = function(device, port, data) {
  let buffer;
  const value = new Buffer(2);
  const dummy = new Buffer([10]);
  switch(device) {
    case this.sensorTypes.SERVO_PIN:
    case this.sensorTypes.PWM:
    case this.sensorTypes.DIGITAL: {
      value.writeInt16LE(data);
      buffer = new Buffer([255, 85, 6, sensorIdx, this.actionTypes.SET, device, port,]);
      buffer = Buffer.concat([buffer, value, dummy]);
      break;
    }
    case this.sensorTypes.WRITE_SEG:
    case this.sensorTypes.WRITE_BLUETOOTH: 
    case this.sensorTypes.LCD: {
      var text0 = new Buffer(2);
      var text1 = new Buffer(2);
      var text2 = new Buffer(2);
      var text3 = new Buffer(2);
      var text4 = new Buffer(2);
      var text5 = new Buffer(2);
      var text6 = new Buffer(2);
      var text7 = new Buffer(2);
      var text8 = new Buffer(2);
      var text9 = new Buffer(2);
      var text10 = new Buffer(2);
      var text11 = new Buffer(2);
      var text12 = new Buffer(2);
      var text13 = new Buffer(2);
      var text14 = new Buffer(2);
      var text15 = new Buffer(2);
      if ($.isPlainObject(data)) {
          text0.writeInt16LE(data.text0);
          text1.writeInt16LE(data.text1);
          text2.writeInt16LE(data.text2);
          text3.writeInt16LE(data.text3);
          text4.writeInt16LE(data.text4);
          text5.writeInt16LE(data.text5);
          text6.writeInt16LE(data.text6);
          text7.writeInt16LE(data.text7);
          text8.writeInt16LE(data.text8);
          text9.writeInt16LE(data.text9);
          text10.writeInt16LE(data.text10);
          text11.writeInt16LE(data.text11);
          text12.writeInt16LE(data.text12);
          text13.writeInt16LE(data.text13);
          text14.writeInt16LE(data.text14);
          text15.writeInt16LE(data.text15);
      } else {
          text0.writeInt16LE(0);
          text1.writeInt16LE(0);
          text2.writeInt16LE(0);
          text3.writeInt16LE(0);
          text4.writeInt16LE(0);
          text5.writeInt16LE(0);
          text6.writeInt16LE(0);
          text7.writeInt16LE(0);
          text8.writeInt16LE(0);
          text9.writeInt16LE(0);
          text10.writeInt16LE(0);
          text11.writeInt16LE(0);
          text12.writeInt16LE(0);
          text13.writeInt16LE(0);
          text14.writeInt16LE(0);
          text15.writeInt16LE(0);
      }
      buffer = new Buffer([255, 85, 36, sensorIdx, this.actionTypes.MODULE, device, port]);
      buffer = Buffer.concat([buffer, text0, text1, text2, text3, text4, text5, text6, text7, text8, text9, text10, text11, text12, text13, text14, text15, dummy]);
      break;
    }  
    /*
    case this.sensorTypes.SEG: {
      var text0 = new Buffer(2);
      var text1 = new Buffer(2);
      var text2 = new Buffer(2);
      var text3 = new Buffer(2);
      if ($.isPlainObject(data)) {
        text0.writeInt16LE(data.text0);
        text1.writeInt16LE(data.text1);
        text2.writeInt16LE(data.text2);
        text3.writeInt16LE(data.text3);
      } else {
        text0.writeInt16LE(0);
        text1.writeInt16LE(0);
        text2.writeInt16LE(0);
        text3.writeInt16LE(0);
      }
      buffer = new Buffer([255, 85, 36, sensorIdx, this.actionTypes.MODULE, device, port]);
      buffer = Buffer.concat([buffer, text0, text1, text2, text3, dummy]);
      break;
    }
    */
  }
  return buffer;
};
Module.prototype.handleRemoteData = function(handler) {
  const self = this;
  const getDatas = handler.read('GET');
  const setDatas = handler.read('SET') || this.defaultOutput;
  const time = handler.read('TIME');
  let buffer = new Buffer([]);
  if (getDatas) {
      const keys = Object.keys(getDatas);
      keys.forEach((key) => {
          let isSend = false;
          const dataObj = getDatas[key];
          if (typeof dataObj.port === 'string' || typeof dataObj.port === 'number') {
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
                  buffer = Buffer.concat([buffer, self.makeSensorReadBuffer(key, dataObj.port, dataObj.data)]);
                  
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
                      buffer = Buffer.concat([buffer, self.makeOutputBuffer(data.type, port, data.data)]);
                  }
              }
          }
      });
  }
  if (buffer.length) {
      this.sendBuffers.push(buffer);
  }
};

Module.prototype.disconnect = function(connect) {
  const self = this;
  connect.close();
  if (self.sp) {
    delete self.sp;
  }
};

Module.prototype.reset = function() {
  this.lastTime = 0;
  this.lastSendTime = 0;
  this.sensorData.PULSEIN = {};
};

module.exports = new Module();