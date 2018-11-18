var ENABLE = 0x01;
var VERSION_MAJOR = 0x02;
var VERSION_MINOR = 0x05;
var START_SYSEX = 0xf0;
var SET_PIN_MODE = 0xf4;
var END_SYSEX = 0xf7;
var ANALOG_MAPPING = 0x69;
var QUERY_FIRMWARE = 0x79;
var REPORT_VERSION = 0xf9;
var DIGITAL_MESSAGE = 0x90;
var DIGITAL_MESSAGE_SE = 0x91;
var SONAR_MESSAGE = 0x63;
var RESET = 0xff;
var ANALOG_REPORT = 0xc0;
var DIGITAL_REPORT_LOW_CHANNEL = 0xd0;
var DIGITAL_REPORT_HIGH_CHANNEL = 0xd1;

var INPUT = 0;
var OUTPUT = 1;
var ANALOG = 2;
var PWM = 3;
var SERVO = 4;
var SONAR = 11;

function Module() {
  this.digitalValue = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  this.remoteDigitalValue = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  this.analogValue = [0, 0, 0, 0, 0, 0];
  this.ports = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  this.digitalData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  this.preDigitalPinMode = [-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2];
  this.digitalPinMode = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
  this.servoValue = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  this.colorSetFlag = false;
  this.queryString = [];
  this.stopSend = false;
}

Module.prototype.init = function (handler, config) {};

Module.prototype.requestInitialData = function () {
  return this.roduinoInit();
};

Module.prototype.checkInitialData = function (data, config) {
  return true;
};

Module.prototype.validateLocalData = function (data) {
  return true;
};


Module.prototype.handleRemoteData = function (handler) {
  var digitalValue = this.remoteDigitalValue;
  this.digitalPinMode = handler.read('digitalPinMode');

  for (var port = 0; port < 14; port++) {
    digitalValue[port] = handler.read(port);
  }
};

Module.prototype.setPinMode = function () {
  var queryString = [];
  for (var pin = 0; pin < this.digitalPinMode.length; pin++) {
    if (
      this.digitalPinMode[pin] !== -1 &&
      this.preDigitalPinMode[pin] !== this.digitalPinMode[pin]
    ) {
      queryString.push(SET_PIN_MODE);
      queryString.push(pin);
      queryString.push(this.digitalPinMode[pin]);
    }
  }
  return queryString;
};

Module.prototype.requestLocalData = function () {
  var query = [];
  var pinData = this.setPinMode();
  var digiData = this.digitalWrite();
  var digPinMode = this.digitalPinMode;
  var preDigPinMode = this.preDigitalPinMode;

  if (pinData.length > 0) {
    for (var i = 0; i < pinData.length; i++) {
      query.push(pinData[i]);
    }
  }

  for (var dgIdx = 0; dgIdx < digiData.length; dgIdx++) {
    query.push(digiData[dgIdx]);
  }
  for (var pin = 0; pin < digPinMode.length; pin++) {
    switch (digPinMode[pin]) {
      case INPUT:
      case OUTPUT:
        if (preDigPinMode[pin] !== digPinMode[pin]) {
          preDigPinMode[pin] = digPinMode[pin];
        }
        break;

      case SERVO:
        if (preDigPinMode[pin] !== digPinMode[pin]) {
          preDigPinMode[pin] = digPinMode[pin];
          query.push(0xf0);
          query.push(0x70);
          query.push(pin);
          query.push(0x20);
          query.push(0x04);
          query.push(0x60);
          query.push(0x12);
          query.push(0xf7);
        }
        query.push(0xe0 + pin);
        query.push(this.remoteDigitalValue[pin] & 0x7f);
        query.push(this.remoteDigitalValue[pin] >> 7);
        break;

      case PWM:
        query.push(0xe0 + pin);
        query.push(this.remoteDigitalValue[pin] & 0x7f);
        query.push(this.remoteDigitalValue[pin] >> 7);
        break;

      case SONAR:
        if (preDigPinMode[pin] !== digPinMode[pin]) {
          preDigPinMode[pin] = digPinMode[pin];
          query.push(0xf0);
          query.push(0x62);
          query.push(pin);
          query.push(pin);
          query.push(0x50);
          query.push(200 & 0x7f);
          query.push((200 >> 7) & 0x7f);
          query.push(0xf7);
        }
        break;
    }
  }

  if (!this.stopSend) {
    query.push(DIGITAL_REPORT_LOW_CHANNEL);
    query.push(ENABLE);
    query.push(DIGITAL_REPORT_HIGH_CHANNEL);
    query.push(ENABLE);
    this.stopSend = true;
  }

  return query;
};

Module.prototype.handleLocalData = function (data) {
  var digPinValue = this.digitalValue;

  for (var i = 0; i < data.length; i += 3) {
    var cmd = data[i];
    var LSB = data[i + 1];
    var MSB = data[i + 2];

    if (cmd == DIGITAL_MESSAGE && MSB == 0) {
      var dataCheck = 0;
      for (var pin = 0; pin < 8; pin++) {
        dataCheck = LSB & (1 << pin);
        if (dataCheck != 0) {
          digPinValue[pin] = 1;
        } else {
          digPinValue[pin] = 0;
        }
      }
    } else if (cmd == DIGITAL_MESSAGE && MSB != 0) {
      digPinValue[7] = 1;
    } else if (cmd == DIGITAL_MESSAGE_SE && LSB == 1) {
      digPinValue[8] = 1;
    } else if (cmd == DIGITAL_MESSAGE_SE && LSB != 1) {
      digPinValue[8] = 0;
    } else if (LSB == SONAR_MESSAGE) {
      var pin = data[i + 2];
      console.log("test: " + pin);
      digPinValue[pin] = data[i + 3] + (data[i + 4] << 7);
    } else {
      var pin = cmd & 0x0f;
      var value = LSB | (MSB << 7);
      this.analogValue[pin] = value;
    }
  }

};

Module.prototype.requestRemoteData = function (handler) {
  for (var i = 0; i < this.analogValue.length; i++) {
    var value = this.analogValue[i];
    handler.write('a' + i, value);
  }

  for (var i = 0; i < this.digitalValue.length; i++) {
    var value = this.digitalValue[i];
    handler.write(i, value);
  }
};

module.exports = new Module();

Module.prototype.roduinoInit = function () {
  var queryString = [];
  this.digitalValue = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  this.remoteDigitalValue = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  this.analogValue = [0, 0, 0, 0, 0, 0];
  this.ports = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  this.digitalData = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  this.preDigitalPinMode = [-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2];
  this.digitalPinMode = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1];
  this.servoValue = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  this.colorSetFlag = false;
  this.stopSend = false;

  queryString.push(START_SYSEX);
  queryString.push(QUERY_FIRMWARE);
  queryString.push(END_SYSEX);

  for (var i = 0; i < 6; i++) {
    queryString.push(ANALOG_REPORT + i);
    queryString.push(ENABLE);
  }

  return queryString;
};

Module.prototype.digitalWrite = function () {
  var queryString = [];
  var mask = 0;

  queryString.push(DIGITAL_MESSAGE);
  for (var i = 2; i < 8; i++) {
    mask = 1 << (i % 8);
    if (this.remoteDigitalValue[i] == 1) {
      this.ports[0] |= mask;
    } else {
      this.ports[0] &= ~mask;
    }
  }
  queryString.push(this.ports[0] & 0x7f);
  queryString.push(this.ports[0] >> 7);

  queryString.push(DIGITAL_MESSAGE + 1);
  for (var i = 8; i < 14; i++) {
    mask = 1 << (i % 8);
    if (this.remoteDigitalValue[i] == 1) {
      this.ports[1] |= mask;
    } else {
      this.ports[1] &= ~mask;
    }
  }
  queryString.push(this.ports[1] & 0x7f);
  queryString.push(this.ports[1] >> 7);

  return queryString;
};