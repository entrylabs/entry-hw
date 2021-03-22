function Module() {
    this.OUTPUT_INST = {
        MOTOR: 0x05,
        OUTPUT: 0x0a,
    };

    this.OUTPUT_TYPE = {
        LED: 0,
        MELODY: 1,
    };

    this.INPUT_INST = 0x02;
    this.INPUT_TYPE = {
        LEFT_COLOR: 0,
        RIGHT_COLOR: 1,
        IR: 2,
        SWITCH: 3,
    };

    this.MOTOR_DATA = {
        RUN: 0b01000000,
        STOP: 0b00000000,
        CW: 0b00000000,
        CCW: 0b00010000,
        CHANNEL: {
            MOTOR1: 0b00000000,
            MOTOR2: 0b00000100,
        },
    };

    this.MOTOR_MOVEMENT = {
        STOP: 0,
        CW: 1,
        CCW: 2,
    };

    this.LED_COLOR = {
        0: [ 0x00, 0x00, 0x00, 0x00 ],  // off
        1: [ 0x7f, 0x00, 0x00, 0x01 ],  //red
        2: [ 0x7f, 0x7f, 0x00, 0x01 ],  // orange
        3: [ 0x00, 0x7f, 0x00, 0x03 ],  // yellow
        4: [ 0x10, 0x50, 0x00, 0x02 ],  // yellowgreen
        5: [ 0x00, 0x7f, 0x00, 0x02 ],  // green
        6: [ 0x00, 0x58, 0x7f, 0x06 ],  // skyblue
        7: [ 0x00, 0x00, 0x7f, 0x04 ],  // blue
        8: [ 0x5f, 0x00, 0x7f, 0x05 ],  // purple
        9: [ 0x7f, 0x33, 0x19, 0x05 ],  // pink
        10: [ 0x7f, 0x7f, 0x7f, 0x02 ], // white
    };

    this.TONE_TABLE = {
        1: [ 261, 293, 329, 349, 392, 440, 493 ],
        2: [ 523, 587, 659, 698, 783, 880, 987 ],
        3: [ 1046, 1175, 1319, 1397, 1568, 1760, 1976 ],
        4: [ 2093, 2349, 2637, 2794, 3136, 3520, 3951 ],
    };

    this.sensorData = {
        LeftColor: 0,
        RightColor: 0,
        IR: 0,
        Switch : 0,
    };

    this.outputData = {
        LED: {
            value: 0,
            isChange: false,
        },
        Melody: {
            octave: 0,
            note: 0,
            duration: 0,
            isChange: false,
        },
        LeftMotor: {
            value: 0,
            direction: 0,
            isChange: false,
        },
        RightMotor: {
            value: 0,
            direction: 0,
            isChange: false,
        },
    };

    this.VERSION_CHECK = [ 0xf0, 0x01, 0x7f, 0x00, 0xf7 ];
    this.ROE_MODE = [ 0xf0, 0x00, 0x7d, 0x01, 0x00, 0xf7 ];
    this.STOP_ROE = [ 0xf0, 0x00, 0x7d, 0x01, 0x05, 0xf7 ];
    this.CONNECTION_SOUND = [ 0xf0, 0x00, 0x0a, 0x03, 0x00, 0x02, 0x01, 0xf7 ];
    this.HEADER = 0xf0;
    this.SET = 0x00;
    this.GET = 0x01;
    this.ON = 0x00;
    this.OFF = 0x01;
    this.DUMMY = 0x00;
    this.END = 0xf7;

    this.isConnecting = false;
    this.isConnected = false;
    this.isRequest = false;
    this.requestData = [];
    this.debugFlag =false;
}
/*
  최초에 커넥션이 이루어진 후의 초기 설정.
  handler 는 워크스페이스와 통신하 데이터를 json 화 하는 오브젝트입니다. (datahandler/json 참고)
  config 은 module.json 오브젝트입니다.
*/
Module.prototype.init = function (handler, config) {};

/*
  연결 후 초기에 송신할 데이터가 필요한 경우 사용합니다.
  requestInitialData 를 사용한 경우 checkInitialData 가 필수입니다.
  이 두 함수가 정의되어있어야 로직이 동작합니다. 필요없으면 작성하지 않아도 됩니다.
*/
Module.prototype.requestInitialData = function () {
    this.isConnecting = false;
    this.isConnected = false;
    return this.VERSION_CHECK;
};

// 연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
Module.prototype.checkInitialData = function (data, config) {
    return this.checkConnect(data);
};

// 주기적으로 하드웨어에서 받은 데이터의 검증이 필요한 경우 사용합니다.
Module.prototype.validateLocalData = function (data) {
    return true;
};

/*
  하드웨어 기기에 전달할 데이터를 반환합니다.
  slave 모드인 경우 duration 속성 간격으로 지속적으로 기기에 요청을 보냅니다.
*/
Module.prototype.requestLocalData = function () {
    this.requestData = [];
    if(this.isConnecting && !this.isConnected) {
        this.requestData = this.makeSendData();
        this.isConnected = true;
    }
    
    if(this.isRequest) {
        this.requestData = this.makeSendData();
        this.isRequest = false;
    }
    return this.requestData;
};

// 하드웨어에서 온 데이터 처리
Module.prototype.handleLocalData = function (data) {
    this.parsingData(data);
};

// 엔트리로 전달할 데이터
Module.prototype.requestRemoteData = function (handler) {
    var self = this;
    if (!self.sensorData) {
        return;
    }

    Object.keys(self.sensorData).forEach(function(key) {
        if (self.sensorData[key] != undefined) {
            handler.write(key, self.sensorData[key]);
        }
    });
};

// 엔트리에서 받은 데이터에 대한 처리
Module.prototype.handleRemoteData = function (handler) {
    var ledValue = handler.read('LED');
    var melodyValue = handler.read('Melody');
    var leftMotorValue = handler.read('LeftMotor');
    var rightMotorValue = handler.read('RightMotor');

    if(this.outputData.LED.value != ledValue) {
        this.outputData.LED.value = ledValue;
        this.outputData.LED.isChange = true;
    }

    if(this.outputData.Melody.octave != melodyValue[0] || this.outputData.Melody.note != melodyValue[1]) {
        this.outputData.Melody.octave = melodyValue[0];
        this.outputData.Melody.note = melodyValue[1];
        this.outputData.Melody.duration = melodyValue[2];
        this.outputData.Melody.isChange = true;
    }

    if(this.outputData.LeftMotor.direction != leftMotorValue[0] || this.outputData.LeftMotor.value != leftMotorValue[1]) {
        this.outputData.LeftMotor.direction = leftMotorValue[0];
        this.outputData.LeftMotor.value = leftMotorValue[1];
        this.outputData.LeftMotor.isChange = true;
    }

    if(this.outputData.RightMotor.direction != rightMotorValue[0] || this.outputData.RightMotor.value != rightMotorValue[1]) {
        this.outputData.RightMotor.direction = rightMotorValue[0];
        this.outputData.RightMotor.value = rightMotorValue[1];
        this.outputData.RightMotor.isChange = true;
    }
    this.isRequest = true;
};

Module.prototype.checkConnect = function (data) {
    if(data[0] == 0xf0 && data[1] == 0x01 && data[2] == 0x7f && data[4] == 0x40 && data[7] == 0xf7) {
        if(data.length > 8) {
            this.parsingData(data);
        }
        this.isConnecting = true;
        return true;
    } else {
        return false;
    }
};

Module.prototype.parsingData = function(data) {
    var count = 0;
    var instruction = 0;
    var length = 0;
    while(count < data.length) {
        if(data[count++] == this.HEADER) {
            if (data[count++] == this.GET) {
                instruction = data[count++];
                length = data[count++];
                if(instruction == this.INPUT_INST && data[count + length] == this.END) {
                    for(var i = 0; i < length; i += 3) {
                        if(data[count + i] == this.INPUT_TYPE.LEFT_COLOR) {
                            this.sensorData.LeftColor = data[count + i + 1];
                        } else if(data[count + i] == this.INPUT_TYPE.RIGHT_COLOR) {
                            this.sensorData.RightColor = data[count + i + 1];
                        } else if(data[count + i] == this.INPUT_TYPE.IR) {
                            this.sensorData.IR = data[count + i + 1];
                        } else if(data[count + i] == this.INPUT_TYPE.SWITCH) {
                            this.sensorData.Switch = data[count + i + 1];
                        }
                    }
                    count = count + length;
                }
            }
        }
    }
};

Module.prototype.makeSendData = function() {
    var buffer = [];  
    if(!this.isConnected) {
        buffer = buffer.concat(this.CONNECTION_SOUND, this.ROE_MODE, this.STOP_ROE);
    } else {
        if(this.outputData.LED.isChange) {
            buffer.push(this.HEADER);
            buffer.push(this.SET);
            buffer.push(this.OUTPUT_INST.OUTPUT);
            buffer.push(0x06);
            buffer.push(this.DUMMY);
            buffer.push(this.OUTPUT_TYPE.LED);
            buffer = buffer.concat(this.LED_COLOR[this.outputData.LED.value]);
            buffer.push(this.END);
            this.outputData.LED.isChange = false;
        }

        if(this.outputData.Melody.isChange) {
            var octave = this.outputData.Melody.octave > 0 ? this.TONE_TABLE[this.outputData.Melody.octave - 3] : 0;
            var note = this.outputData.Melody.note > 0 ? octave[this.outputData.Melody.note] - 1 : 0;
            var duration = this.outputData.Melody.duration;

            buffer.push(this.HEADER);
            buffer.push(this.SET);
            buffer.push(this.OUTPUT_INST.OUTPUT);
            buffer.push(0x07);
            buffer.push(this.DUMMY);
            buffer.push(this.OUTPUT_TYPE.MELODY);
            buffer.push(this.ON);
            buffer.push(note % 128);
            buffer.push(note / 128);
            buffer.push(duration % 128);
            buffer.push(duration / 128);
            buffer.push(this.END);
            this.outputData.Melody.isChange = false;
        }

        if(this.outputData.LeftMotor.isChange && this.outputData.RightMotor.isChange) {
            buffer.push(this.HEADER);
            buffer.push(this.SET);
            buffer.push(this.OUTPUT_INST.MOTOR);
            buffer.push(0x04);
            switch(this.outputData.LeftMotor.direction) {
                case this.MOTOR_MOVEMENT.STOP:
                    buffer.push(this.outputData.LeftMotor.value);
                    buffer.push(this.MOTOR_DATA.STOP | this.MOTOR_DATA.MOTOR1);
                    break;
                case this.MOTOR_MOVEMENT.CW:
                    buffer.push(this.outputData.LeftMotor.value);
                    buffer.push(this.MOTOR_DATA.RUN | this.MOTOR_DATA.CW | this.MOTOR_DATA.CHANNEL.MOTOR1);
                    break;
                case this.MOTOR_MOVEMENT.CCW:
                    buffer.push(this.outputData.LeftMotor.value);
                    buffer.push(this.MOTOR_DATA.RUN | this.MOTOR_DATA.CCW | this.MOTOR_DATA.CHANNEL.MOTOR1);
                    break;
            }

            switch(this.outputData.RightMotor.direction) {
                case this.MOTOR_MOVEMENT.STOP:
                    buffer.push(this.outputData.RightMotor.value);
                    buffer.push(this.MOTOR_DATA.STOP | this.MOTOR_DATA.MOTOR2);
                    break;
                case this.MOTOR_MOVEMENT.CW:
                    buffer.push(this.outputData.RightMotor.value);
                    buffer.push(this.MOTOR_DATA.RUN | this.MOTOR_DATA.CW | this.MOTOR_DATA.CHANNEL.MOTOR2);
                    break;
                case this.MOTOR_MOVEMENT.CCW:
                    buffer.push(this.outputData.RightMotor.value);
                    buffer.push(this.MOTOR_DATA.RUN | this.MOTOR_DATA.CCW | this.MOTOR_DATA.CHANNEL.MOTOR2);
                    break;
            }
            buffer.push(this.END);
            this.outputData.LeftMotor.isChange = false;
            this.outputData.RightMotor.isChange = false;
        }

        if(this.outputData.LeftMotor.isChange) {
            buffer.push(this.HEADER);
            buffer.push(this.SET);
            buffer.push(this.OUTPUT_INST.MOTOR);
            buffer.push(0x02);
            switch(this.outputData.LeftMotor.direction) {
                case this.MOTOR_MOVEMENT.STOP:
                    buffer.push(this.outputData.LeftMotor.value);
                    buffer.push(this.MOTOR_DATA.STOP | this.MOTOR_DATA.MOTOR1);
                    break;
                case this.MOTOR_MOVEMENT.CW:
                    buffer.push(this.outputData.LeftMotor.value);
                    buffer.push(this.MOTOR_DATA.RUN | this.MOTOR_DATA.CW | this.MOTOR_DATA.CHANNEL.MOTOR1);
                    break;
                case this.MOTOR_MOVEMENT.CCW:
                    buffer.push(this.outputData.LeftMotor.value);
                    buffer.push(this.MOTOR_DATA.RUN | this.MOTOR_DATA.CCW | this.MOTOR_DATA.CHANNEL.MOTOR1);
                    break;
            }
            buffer.push(this.END);
            this.outputData.LeftMotor.isChange = false;
        }

        if(this.outputData.RightMotor.isChange) {
            buffer.push(this.HEADER);
            buffer.push(this.SET);
            buffer.push(this.OUTPUT_INST.MOTOR);
            buffer.push(0x02);
            switch(this.outputData.RightMotor.direction) {
                case this.MOTOR_MOVEMENT.STOP:
                    buffer.push(this.outputData.RightMotor.value);
                    buffer.push(this.MOTOR_DATA.STOP | this.MOTOR_DATA.MOTOR2);
                    break;
                case this.MOTOR_MOVEMENT.CW:
                    buffer.push(this.outputData.RightMotor.value);
                    buffer.push(this.MOTOR_DATA.RUN | this.MOTOR_DATA.CW | this.MOTOR_DATA.CHANNEL.MOTOR2);
                    break;
                case this.MOTOR_MOVEMENT.CCW:
                    buffer.push(this.outputData.RightMotor.value);
                    buffer.push(this.MOTOR_DATA.RUN | this.MOTOR_DATA.CCW | this.MOTOR_DATA.CHANNEL.MOTOR2);
                    break;
            }
            buffer.push(this.END);
            this.outputData.RightMotor.isChange = false;
        }
    }
    return buffer;
};

module.exports = new Module();