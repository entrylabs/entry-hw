var ENABLE = 0x01;
var VERSION_MAJOR = 0x02;
var VERSION_MINOR = 0x05;
var SET_PIN_MODE = 0xF4;
var START_SYSEX = 0xF0;
var END_SYSEX = 0xF7;
var QUERY_FIRMWARE = 0x79;
var ANALOG_MAPPING = 0x69;
var ANALOG_REPORT = 0xC0;
var ANALOG_MESSAGE = 0xE0;
var DIGITAL_MESSAGE = 0x90;
var RESET = 0xFE;
var DIGITAL_REPORT_LOW_CHANNEL = 0xD0;
var DIGITAL_REPORT_HIGH_CHANNEL = 0xD1;
var SEND_PRODUCT_SCHOOLKIT = 0xA0;
var END_BLOCK = 0x00;

// INPUT/OUTPUT/ANALOG/  PWM / SERVO /  I2C / ONEWIRE / STEPPER / ENCODER / SERIAL / PULLUP
// 0x00 / 0x01 / 0x02 / 0x03 / 0x04  / 0x06 /  0x07   /   0x08  /  0x09   /  0x0A  / 0x0B

var INPUT = 0;
var OUTPUT = 1;
var ANALOG = 2;
var PWM = 3;
var SERVO = 4;

var schoolKitFlag = false;

function Module() {
    this.digitalValue = new Array(14);
    this.remoteDigitalValue = new Array(14).fill(0);
    this.analogValue = new Array(2);
    this.ports = Array(14).fill(0);
    this.previousValue = [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
    this.preDigitalPinMode = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
    this.digitalPinMode = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
    this.servo = [ 0, 0, 0, 0, 0, 0 ];
    this.inputPin = [ 7, 9 ];
    this.packet = [ 0, 0, 0 ]; 
    this.step = 0;
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
    this.digitalPinMode = handler.read('digitalPinMode');
    this.servo = handler.read('servo');
    for (var port = 0; port < 14; port++) {
        digitalValue[port] = handler.read(port);
    }
};

Module.prototype.requestLocalData = function() {
    var query = [];
    var temp = [];

    query = this.setPinMode();
    
    if(schoolKitFlag == true) {
        if(query == null) {
            query = this.digitalWrite();
        } else {
            temp = this.digitalWrite();
            for(var i = 0; i < temp.length; i++) {
                query.push(temp[i]);
            }
        }
    }
    
    if(query == null) {
        query = this.setPWM();
    } else {
        temp = this.setPWM();
        for(var i = 0; i < temp.length; i++) {
            query.push(temp[i]);
        }
    }
    
    if(query == null) {
        query = this.motor();
    } else {
        temp = this.motor();
        for(var i = 0; i < temp.length; i++) {
            query.push(temp[i]);
        }
    }
        
    return query;
};

Module.prototype.handleLocalData = function(data) { // data: Native Buffer    
    for(var i = 0; i < data.length; i++) {
        if(data[i] == 0xFF) {
            schoolKitFlag = true;
        }
        
        var packet = data[i];
        
        switch(this.step) {
            case 0:
            {
                if(packet >= DIGITAL_MESSAGE && packet <= DIGITAL_MESSAGE + 6) {
                    this.packet[this.step++] = packet;
                } else if(packet >> 4 == 0x0E) {
					this.packet[this.step++] = packet;					
				} else {
					this.packet = [ 0, 0, 0 ];
					this.step = 0;
				}
            }
            break;
            case 1:
			{
				this.packet[this.step++] = packet;
			}
			break;
            case 2:
            {
                this.packet[this.step] = packet;
				
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
				
				if(cmd >> 4 == 0x0E) {
					var pin = cmd & 0x0F;
					if(pin == 8) {
						this.digitalValue[pin - 7] = LSB | (MSB << 7);
					} else if(pin == 10) {
						this.digitalValue[pin - 7] = 1023 - (LSB | (MSB << 7));
					}					
				}
				
                this.packet = [ 0, 0, 0 ];
                this.step = 0;
            }
            break;
        }
    }
};

Module.prototype.requestRemoteData = function(handler) {
    for (var i = 0; i < this.inputPin.length; i++) {
        var value = this.analogValue[i];
        handler.write('a' + this.inputPin[i], value);
    }
    
    for (var i = 0; i < this.digitalValue.length; i++) {
        var value = this.digitalValue[i];
        handler.write(i, value);
    }
};

Module.prototype.reset = function() {
    console.log('reset');
	this.digitalValue = new Array(14);
    this.remoteDigitalValue = new Array(14).fill(0);
    this.analogValue = new Array(2);
    this.ports = Array(14).fill(0);
    this.previousValue = [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
    this.preDigitalPinMode = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
    this.digitalPinMode = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
    this.servo = [ 0, 0, 0, 0, 0, 0 ];
    this.inputPin = [ 7, 9 ];
    this.packet = [ 0, 0, 0 ];
    this.step = 0;
};

module.exports = new Module();

Module.prototype.schoolkitInit = function() {
    var queryString = [];
    this.digitalValue = new Array(14);
    this.remoteDigitalValue = new Array(14).fill(0);
    this.analogValue = new Array(2);
    this.ports = Array(14).fill(0);
    this.previousValue = [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
    this.preDigitalPinMode = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
    this.digitalPinMode = [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];
    this.servo = [ 0, 0, 0, 0, 0, 0 ];
    this.inputPin = [ 7, 9 ];
    this.packet = [ 0, 0, 0 ];
    this.step = 0;
    
    queryString.push(START_SYSEX);
    queryString.push(SEND_PRODUCT_SCHOOLKIT);
    queryString.push(END_SYSEX);
    
    // queryString.push(START_SYSEX);
    // queryString.push(QUERY_FIRMWARE);
    // queryString.push(END_SYSEX);
    
    // queryString.push(START_SYSEX);
    // queryString.push(ANALOG_MAPPING);
    // queryString.push(END_SYSEX);
	
    return queryString;
};

Module.prototype.setPinMode = function() {
    var queryString = [];
    
    for(var i = 0; i < this.digitalPinMode.length; i++) {
        if(this.digitalPinMode[i] != this.preDigitalPinMode[i]) {
            queryString.push(SET_PIN_MODE);
            queryString.push(i);
            queryString.push(this.digitalPinMode[i]);
            this.preDigitalPinMode[i] = this.digitalPinMode[i];
        }
    }    
    return queryString;
}

Module.prototype.digitalWrite = function() {
    var queryString = [];
    var mask = 0;
    var value = 0;
    var sendFlag = false;
        
    for(var i = 2; i < 7; i++) {
        value = this.remoteDigitalValue[i];
        if(this.digitalPinMode[i] == 1) {
            if(this.previousValue[i] != value) {
                sendFlag = true;
                this.previousValue[i] = value;
                mask = 1 << (i % 8);
                if(value == 1) {
                    this.ports[0] |= mask;
                } else {
                    this.ports[0] &= ~mask;
                }            
            }
        }
    }
    
    if(sendFlag) {
        queryString.push(DIGITAL_MESSAGE);
        queryString.push(this.ports[0] & 0x7F);
        queryString.push(this.ports[0] >> 7);
    }
    
    return queryString;
};

Module.prototype.motor = function() {
    var queryString = [];
    var ChannelData = [ 0, 0 ];
    var temp = [ 0, 1 ];
    var direction = 0;
    
    for(var i = 0; i < temp.length; i++) {
        var pin = temp[i];
        var value = this.remoteDigitalValue[pin];
        
        if(this.previousValue[pin] != value) {
            this.previousValue[pin] = value;
            if(value > 0) {
                direction = 0x10;
            } else if(value < 0){
                direction = 0x20;
                value *= -1;
            } else {
                direction = 0x00;
            }
            
            if(value > 127) {
                ChannelData[0] = value - 128;
                ChannelData[1] = direction + 0x01;
            } else {
                ChannelData[0] = value;
                ChannelData[1] = direction + 0x00;
            }
            
            queryString.push(ANALOG_MESSAGE | pin);
            queryString.push(ChannelData[0]);
            queryString.push(ChannelData[1]);
        }
    }
    return queryString;
};

Module.prototype.setPWM = function() {
    var queryString = [];
    var value = 0;
    
    for(var i = 2; i < 7; i++) {
        value = this.remoteDigitalValue[i];
        
        if(this.previousValue[i] != value) {
            queryString.push(ANALOG_MESSAGE | i);
            if(value > 127) {
                queryString.push(value - 128);
                queryString.push(0x01);
            } else {
                queryString.push(value);
                queryString.push(0x00);
            }
            this.previousValue[i] = value;
        }
    }
    
    return queryString;
};