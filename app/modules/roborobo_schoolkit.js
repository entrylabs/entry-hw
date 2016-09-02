var ENABLE = 0x01;
var VERSION_MAJOR = 0x02;
var VERSION_MINOR = 0x05;
var SET_PIN_MODE = 0xF4;
var END_SYSEX = 0xF7;
var QUERY_FIRMWARE = 0x79;
var REPORT_VERSION = 0xF9;
var ANALOG_MESSAGE = 0xE0;
var DIGITAL_MESSAGE = 0x90;
var RESET = 0xFE;
var DIGITAL_REPORT_LOW_CHANNEL = 0xD0;
var DIGITAL_REPORT_HIGH_CHANNEL = 0xD1;

// INPUT/OUTPUT/ PWM / SERVO /  I2C / ONEWIRE / STEPPER / ENCODER / SERIAL / PULLUP
// 0x00 / 0x01 / 0x03 / 0x04  / 0x06 /  0x07   /   0x08  /  0x09   /  0x0A  / 0x0B

var INPUT = 0;
var OUTPUT = 1;
var PWM = 3;
var SERVO = 4;

function Module() {
    this.digitalValue = new Array(7);
    this.remoteDigitalValue = new Array(14);
    this.sendFlag = false;
    this.ports = Array(14).fill(0);
    this.digitalPinMode = [ 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ];
    this.motorValue = [ 0, 0, 0, 0 ]; // [0] : 7Pin, [1] : 0Pin, [2] : 8Pin, [3] : 1Pin
    this.servoValue = [ 0, 0, 0, 0, 0 ];
    this.step = 0;
    this.packet = [ 0, 0, 0 ];
};

Module.prototype.init = function(handler, config) {    
};

Module.prototype.requestInitialData = function() {
    return this.schoolkitInit();
};

Module.prototype.checkInitialData = function(data, config) {
    return true;
};

Module.prototype.validateLocalData = function(data) {
    return true;
};

Module.prototype.handleRemoteData = function(handler) {
    var digitalValue = this.remoteDigitalValue;
    for (var i = 0; i < 5; i++) {
        digitalValue[i] = handler.read(i);
    }
};

Module.prototype.requestLocalData = function() {
    var query = [];
    var temp = [];
    
    // 1 : digital_read, 2 : digital_write, 3 : motor(PWM), 4 : color, 5 : servo
    switch(this.remoteDigitalValue[0]) {
        case 1:
            this.sendFlag = true;
        break;
        case 2 :
            this.sendFlag = true;
            query = this.digitalWrite();
            for(var i = 0; i < temp.length; i++) {
                query.push(temp[i]);
            }
        break;
        case 3 :
            this.sendFlag = true;            
            temp = this.motor();            
            for(var i = 0; i < temp.length; i++) {
                query.push(temp[i]);
            }
        break;
        case 4 :
            temp = this.setColor();
            if(temp != null) {
                for(var i = 0; i < temp.length; i++) {
                    query.push(temp[i]);
                }
            }
        break;
        case 5 :
            this.sendFlag = true; 
            temp = this.setServo();
            if(temp != null) {
                for(var i = 0; i < temp.length; i++) {
                    query.push(temp[i]);
                }
            }
        break;
        default:
            if(this.sendFlag == true) {
                this.sendFlag = false;                
                query = this.sendReset();
                console.log("Reset");
            }
        break;
    }
    return query;
};

Module.prototype.handleLocalData = function(data) { // data: Native Buffer
    for(var i = 0; i < data.length; i++) {
        var packet = data[i];
        
        switch(this.step) {
            case 0:
            {
                if(packet >= DIGITAL_MESSAGE && packet <= DIGITAL_MESSAGE + 6) {
                    this.packet[this.step++] = packet;
                }
            }
            break;
            case 1:
            case 2:
            {
                this.packet[this.step++] = packet;
            }
            break;
            case 3:
            {
                var cmd = this.packet[0];
                var LSB = this.packet[1];
                var MSB = this.packet[2];
                var mode = 0; // off : 1, on : 2
                
                if((cmd == DIGITAL_MESSAGE || cmd == DIGITAL_MESSAGE + 1) && (LSB != 0 || MSB != 0)) {
                    mode = 2;
                } else if(LSB == 0 && MSB == 0) {
                    mode = 1;
                }
                
                if(mode == 2) {
                    if(cmd == DIGITAL_MESSAGE) {
                        this.digitalValue[0] = 1;
                    } else if(cmd == DIGITAL_MESSAGE + 1) {
                        var temp = 0;
                        for(var pin = 8; pin < 14; pin++) {
                            temp = LSB >> (pin - 8);
                            if(temp == 1) {
                                this.digitalValue[pin - 7] = 1;
                            }
                        }
                    }
                } else if (mode == 1){
                    this.digitalValue[cmd - DIGITAL_MESSAGE] = 0;
                }                
                this.packet = [ 0, 0, 0 ];
                this.step = 0;
            }
            break;
            default:
            {
                this.packet = [ 0, 0, 0 ];
                this.step = 0;
            }
            break;
        }
    }
};

Module.prototype.requestRemoteData = function(handler) {
    for (var i = 0; i < this.digitalValue.length; i++) {
        var value = this.digitalValue[i];
        handler.write(i, value);
    }
};

Module.prototype.reset = function() {
};

module.exports = new Module();

Module.prototype.schoolkitInit = function() {
    var queryString = [];
    
    this.motorValue = [ 0, 0, 0, 0 ]; // [0] : 7Pin, [1] : 0Pin, [2] : 8Pin, [3] : 1Pin
    this.servoValue = [ 0, 0, 0, 0, 0 ];
    this.step = 0;
    
    queryString.push(0xAA);
    queryString.push(0xBB);
    queryString.push(0xCC);
    
    queryString.push(REPORT_VERSION);
    queryString.push(QUERY_FIRMWARE);
    queryString.push(END_SYSEX);
    
    return queryString;
};

Module.prototype.sendReset = function() {
    var queryString = [];

    this.digitalPinMode = [ 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ];
    this.motorValue_1 = [ 0, 0 ];
    this.motorValue_2 = [ 0, 0 ];    
    this.servoValue = [ 0, 0, 0, 0, 0 ];
    this.step = 0;
    
    queryString.push(RESET);
    
    return queryString;
};

Module.prototype.setPinMode = function(pin, mode) {
    var queryString = [];
    
    if(this.digitalPinMode[pin] != mode) {    
        queryString.push(SET_PIN_MODE);
        queryString.push(pin);
        queryString.push(mode);
        this.digitalPinMode[pin] = mode;
        console.log("pin : " + pin + ", mode : " + mode);
        
        return queryString;
    }
    
    return null;
}

Module.prototype.digitalWrite = function() {
    var queryString = [];
    var ChannelData = [0, 0];
    var pin = this.remoteDigitalValue[1];
    var value = this.remoteDigitalValue[2];
    var port = pin >> 3;
    var mask = 1 << (pin % 8);
    
    if(value == 1) {
        this.ports[port] |= mask;
    } else {
        this.ports[port] &= ~mask;
    }    
    ChannelData[0] |= this.ports[port] & 0x7F;
    ChannelData[1] |= (this.ports[port] >> 7) & 0x7F;
    
    queryString.push(DIGITAL_MESSAGE | port);
    queryString.push(ChannelData[0]);
    queryString.push(ChannelData[1]);    
    
    return queryString;
};

Module.prototype.motor = function() {
    var queryString = [];    
    var ChannelData = [0, 0];    
    var lotation = this.remoteDigitalValue[1]; // 0 : Stop, 1 : CW, 2 : CCW
    var pin = this.remoteDigitalValue[2];
    var motor = this.remoteDigitalValue[2] == 7 ? 1 : 2;    
    var value = this.remoteDigitalValue[3];
    var temp = [];
    var flag = false;
            
    switch(lotation) {
        case 0:
        {
            if(this.motorValue[0] != 0 || this.motorValue[1] != 0 || this.motorValue[2] != 0 || this.motorValue[3] != 0) {
                if(motor == 1) {
                    queryString.push(ANALOG_MESSAGE | 0x07);
                    queryString.push(0x00);
                    queryString.push(0x00);
                    queryString.push(ANALOG_MESSAGE);
                    queryString.push(0x00);
                    queryString.push(0x00);
                    
                    this.motorValue[0] = 0;
                    this.motorValue[1] = 0;
                } else {
                    queryString.push(ANALOG_MESSAGE | 0x08);
                    queryString.push(0x00);
                    queryString.push(0x00);
                    queryString.push(ANALOG_MESSAGE | 0x01);
                    queryString.push(0x00);
                    queryString.push(0x00);
                    
                    this.motorValue[2] = 0;
                    this.motorValue[3] = 0;
                }
                //console.log("Stop");   
            }            
        }
        break;
        case 1:
        {         
            if(motor == 1) {
                if(this.motorValue[0] != value) {
                    if(value > 127) {
                        ChannelData[0] = value - 128;
                        ChannelData[1] = 0x01;
                    } else {
                        ChannelData[0] = value;
                        ChannelData[1] = 0x00;
                    }
                    this.motorValue[0] = value;
                    this.motorValue[1] = 0;
                    flag = true;
                }
            } else {
                if(this.motorValue[2] != value) {
                    if(value > 127) {
                        ChannelData[0] = value - 128;
                        ChannelData[1] = 0x01;
                    } else {
                        ChannelData[0] = value;
                        ChannelData[1] = 0x00;
                    }
                    this.motorValue[2] = value;
                    this.motorValue[3] = 0;
                    flag = true;
                }
            }
        }
        break;
        case 2:
        {
            pin = pin - 7;
            if(motor == 1) {
                if(this.motorValue[1] != value) {
                    if(value > 127) {
                        ChannelData[0] = value - 128;
                        ChannelData[1] = 0x01;
                    } else {
                        ChannelData[0] = value;
                        ChannelData[1] = 0x00;
                    }
                    this.motorValue[0] = 0;
                    this.motorValue[1] = value;
                    flag = true;
                }
            } else {
                if(this.motorValue[3] != value) {
                    if(value > 127) {
                        ChannelData[0] = value - 128;
                        ChannelData[1] = 0x01;
                    } else {
                        ChannelData[0] = value;
                        ChannelData[1] = 0x00;
                    }
                    this.motorValue[2] = 0;
                    this.motorValue[3] = value;
                    flag = true;
                }
            }
        }
        break;        
    }
    
    if(flag == true) {
        queryString.push(ANALOG_MESSAGE | pin);
        queryString.push(ChannelData[0]);
        queryString.push(ChannelData[1]);
    }
    return queryString;
};

Module.prototype.setColor = function() {
    var queryString = [];
    var temp = null;
    
    for(var i = 1; i < 4; i++) {
        temp = this.setPinMode(this.remoteDigitalValue[i], INPUT);
        if(temp != null) {
            for(var j = 0; j < temp.length; j++) {
                queryString.push(temp[j]);
            }
        }
    }    
    return queryString;
};

Module.prototype.setServo = function() {
    var queryString = [];
    var pin = this.remoteDigitalValue[1];
    var value = this.remoteDigitalValue[2];
    
    if(this.servoValue[pin - 2] != value) {
        queryString.push(ANALOG_MESSAGE | pin);
        if(value > 127) {
            queryString.push(value - 128);
            queryString.push(0x01);
        } else {
            queryString.push(value);
            queryString.push(0x00);
        }
        this.servoValue[pin - 2] = value;
    }
    
    return queryString;
};