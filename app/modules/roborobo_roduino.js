var ENABLE = 0x01;
var VERSION_MAJOR = 0x02;
var VERSION_MINOR = 0x05;
var START_SYSEX = 0xF0;
var SET_PIN_MODE = 0xF4;
var END_SYSEX = 0xF7;
var ANALOG_MAPPING = 0x69;
var QUERY_FIRMWARE = 0x79;
var REPORT_VERSION = 0xF9;
var DIGITAL_MESSAGE = 0x90;
var RESET = 0xFF;
var RESET1 = 0xFE;
var CONNECTION_STATE = 0xFF;
var ANALOG_REPORT = 0xC0;
var DIGITAL_REPORT_LOW_CHANNEL = 0xD0;
var DIGITAL_REPORT_HIGH_CHANNEL = 0xD1;

// INPUT/OUTPUT/ANALOG/  PWM / SERVO /  I2C / ONEWIRE / STEPPER / ENCODER / SERIAL / PULLUP
// 0x00 / 0x01 / 0x02 / 0x03 / 0x04  / 0x06 /  0x07   /   0x08  /  0x09   /  0x0A  / 0x0B

var INPUT = 0;
var OUTPUT = 1;
var ANALOG = 2;
var PWM = 3;
var SERVO = 4;

function Module() {
    this.digitalValue = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
    this.analogValue = [ 0, 0, 0, 0, 0, 0 ];
    this.remoteDigitalValue = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
    this.ports = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
    this.digitalData = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
    this.digitalPinMode = [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1 ];
    this.colorPin = 0;
    this.colorSetFlag = false;
};

Module.prototype.init = function(handler, config) {
};

Module.prototype.requestInitialData = function() {
    return this.roduinoInit();
};

Module.prototype.checkInitialData = function(data, config) {
    return true;
};

Module.prototype.validateLocalData = function(data) {
    return true;
};

Module.prototype.handleRemoteData = function(handler) {
	var digitalValue = this.remoteDigitalValue;
    this.colorPin = handler.read('colorPin');
    for (var port = 0; port < 14; port++) {
        digitalValue[port] = handler.read(port);
    }
};

Module.prototype.requestLocalData = function() {
    var query = [];
    var temp = [];

    query = this.digitalWrite();

    // 1 : digital_read, 2 : set_pin_mode, 3 : digital_write, 4 : analog_write, 5 : analog_read, 6 : motor, 7: color
    switch(this.remoteDigitalValue[0]) {
        case 1:
            temp = this.setPinMode(this.remoteDigitalValue[1], INPUT);
            if(temp != null) {
                for(var i = 0; i < temp.length; i++) {
                    query.push(temp[i]);
                }
            }
        break;
        case 3 :
            temp = this.setPinMode(this.remoteDigitalValue[1], OUTPUT);
            if(temp != null) {
                for(var i = 0; i < temp.length; i++) {
                    query.push(temp[i]);
                }
            }
        break;
    }

    if(!this.colorSetFlag && this.colorPin != 0) {
        temp = this.setColor();
        if(temp != null) {
            for(var i = 0; i < temp.length; i++) {
                query.push(temp[i]);
            }
        }
        this.colorSetFlag = true;
    }

    query.push(DIGITAL_REPORT_LOW_CHANNEL);
    query.push(ENABLE);

    query.push(DIGITAL_REPORT_HIGH_CHANNEL);
    query.push(ENABLE);

    return query;
};

Module.prototype.handleLocalData = function(data) { // data: Native Buffer
    for(var i = 0; i < data.length; i += 3) {
        var cmd = data[i];
        var LSB = data[i + 1];
        var MSB = data[i + 2];

        if(cmd == DIGITAL_MESSAGE) {
            if(MSB == 0) {
                var temp = 0;
                for(var pin = 2; pin < 8; pin++) {
                    temp = LSB & (1 << pin);
                    if(temp != 0) {
                        this.digitalValue[pin - 2] = 1;
                    } else {
                        this.digitalValue[pin - 2] = 0;
                    }
                }
            } else {
                this.digitalValue[5] = 1;
            }
        } else if(cmd == DIGITAL_MESSAGE + 1) {
            if(LSB == 1) {
                this.digitalValue[6] = 1;
            } else {
                this.digitalValue[6] = 0;
            }
        } else {            
            var pin = cmd & 0x0F;
            var value = LSB | (MSB << 7);
            this.analogValue[pin] = value;
        }
    }
};

Module.prototype.requestRemoteData = function(handler) {
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

Module.prototype.roduinoInit = function() {
    var queryString = [];

    this.digitalValue = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
    this.analogValue = [ 0, 0, 0, 0, 0, 0 ];
    this.ports = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
    this.digitalData = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
    this.digitalPinMode = [ -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1 ];
    this.colorPin = 0;
    this.colorSetFlag = false;

    queryString.push(START_SYSEX);
    queryString.push(QUERY_FIRMWARE);
    queryString.push(END_SYSEX);

    for(var i = 0; i < 6; i++) {
        queryString.push(ANALOG_REPORT + i);
        queryString.push(ENABLE);
    }

    return queryString;
};

Module.prototype.setPinMode = function(pin, mode) {
    var queryString = [];

    if(this.digitalPinMode[pin] != mode) {
        queryString.push(SET_PIN_MODE);
        queryString.push(pin);
        queryString.push(mode);
        this.digitalPinMode[pin] = mode;

        return queryString;
    }

    return null;
}

Module.prototype.digitalWrite = function() {
    var queryString = [];
    var mask = 0;

    queryString.push(DIGITAL_MESSAGE);
    for(var i = 2; i < 8; i++) {
        mask = 1 << (i % 8);
        if(this.remoteDigitalValue[i] == 1) {
            this.ports[0] |= mask;
        } else {
            this.ports[0] &= ~mask;
        }
    }
    queryString.push(this.ports[0] & 0x7F);
    queryString.push(this.ports[0] >> 7);

    queryString.push(DIGITAL_MESSAGE + 1);
    for (var i = 8; i < 14; i++) {
        mask = 1 << (i % 8);
        if(this.remoteDigitalValue[i] == 1) {
            this.ports[1] |= mask;
        } else {
            this.ports[1] &= ~mask;
        }
    }
    queryString.push(this.ports[1] & 0x7F);
    queryString.push(this.ports[1] >> 7);

    return queryString;
};

Module.prototype.setColor = function() {
    var queryString = [];
    var temp = null;

    for(var i = 0; i < 3; i++) {
        temp = this.setPinMode(this.colorPin + i, INPUT);
        if(temp != null) {
            for(var j = 0; j < temp.length; j++) {
                queryString.push(temp[j]);
            }
        }
    }
    return queryString;
};
