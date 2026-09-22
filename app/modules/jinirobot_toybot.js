function Module() {
    this.type = 0x03;
    this.version = 0x22;
    this.modeControl = 0x03;
    this.comparerId = 0;
    this.deviceInfo = {
        name: '',
        distance: 0,
        button: [0, 0],
        analog: 0,
        servo: [0, 0, 0, 0, 0],
        offset: [0, 0, 0, 0, 0]
    };
    this.repeatRead = [
        {index: 0x16, repeat: 0x02}, // Servo Current Each
        {index: 0x1E, repeat: 0x02}, // Servo Calibration
        {index: 0x43, repeat: 0x02}, // Analog Value
        {index: 0x53, repeat: 0x02}, // Button Control
        {index: 0x73, repeat: 0x02}  // Ultrasonic Distance
    ]
    this.cBuffer = []; // contants buffer
};

// 최초에 커넥션이 이루어진 후의 초기 설정.
// handler 는 워크스페이스와 통신하 데이터를 json 화 하는 오브젝트입니다. (datahandler/json 참고)
// config 은 module.json 오브젝트입니다.
Module.prototype.init = function(handler, config) {
    this.comparerId = 0;
    this.deviceInfo.distance = 0;
    this.deviceInfo.button[0] = 0;
    this.deviceInfo.button[1] = 0;
    this.deviceInfo.analog = 0;
    for (let i = 0; i < 5; i++) {
        this.deviceInfo.servo[0] = 0;
        this.deviceInfo.offset[0] = 0;
    }
    this.cBuffer = [];
};

// 연결 후 초기에 송신할 데이터가 필요한 경우 사용합니다.
// requestInitialData 를 사용한 경우 checkInitialData 가 필수입니다.
// 이 두 함수가 정의되어있어야 로직이 동작합니다. 필요없으면 작성하지 않아도 됩니다.
Module.prototype.requestInitialData = function() {
    const repeatName = [
        {index: 0x03, repeat: 0x02}
    ];
    this.addReturn(repeatName);
    this.addMode(this.modeControl);
    const packet = this.generate();
    return packet;
};

// 연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
Module.prototype.checkInitialData = function(data, config) {
    if (data.length >= 21 && this.checkHeader(data)) {
        this.parsing(data);
        const index = this.deviceInfo.name.indexOf('ToyBot');
        return index > -1 ? true : false;
    } else {
        return false;
    }
};

// 주기적으로 하드웨어에서 받은 데이터의 검증이 필요한 경우 사용합니다.
Module.prototype.validateLocalData = function(data) {
    const result = this.checkHeader(data);
    return result;
};

// 하드웨어 기기에 전달할 데이터를 반환합니다.
// slave 모드인 경우 duration 속성 간격으로 지속적으로 기기에 요청을 보냅니다.
Module.prototype.requestLocalData = function() {
    this.addReturn(this.repeatRead);
    this.addHeartBeat();
    const packet = this.generate();
    return packet;	
};

// 하드웨어에서 온 데이터 처리
Module.prototype.handleLocalData = function(data) {
    this.parsing(data);    
};

// 엔트리로 전달할 데이터
Module.prototype.requestRemoteData = function(handler) {
    handler.write('getblock', this.deviceInfo);
};

// 엔트리에서 받은 데이터에 대한 처리
Module.prototype.handleRemoteData = function(handler) {
    const block = handler.read('setblock');
    if (this.comparerId !== block.id) {
        this.comparerId = block.id;
        if (block.ledControl) {
            this.addLedControl(block.ledControl);
        } else if (block.playScore) {
            this.addMelodyPlayScore(block.playScore);
        } else if (block.playList) {
            this.addMelodyPlayList(block.playList);
        } else if (block.servoControl) {
            this.addServoControl(block.servoControl);
        } else if (block.pwmControl) {
            this.addPwmControl(block.pwmControl);
        } else if (block.dcControl) {
            this.addDcControl(block.dcControl);
        } else if (block.servoOffset) {
            this.addServoOffset(block.servoOffset);
        } else if (block.setZero) {
            this.addMelodyPlayScore(
                {
                    beat: 0x0B,
                    pitch:0x00
                }
            );
            this.addServoControl(
                [{
                    id: 0,
                    speed: 5,
                    position: this.deviceInfo.servo[0]
                },
                {
                    id: 1,
                    speed: 5,
                    position: this.deviceInfo.servo[1]
                },
                {
                    id: 2,
                    speed: 5,
                    position: this.deviceInfo.servo[2]
                },
                {
                    id: 3,
                    speed: 5,
                    position: this.deviceInfo.servo[3]
                },
                {
                    id: 4,
                    speed: 5,
                    position: this.deviceInfo.servo[4]
                }]
            );
            this.addPwmControl(0);
            this.addDcControl(
                [{
                    id: 0,
                    speed: 0
                },
                {
                    id: 1,
                    speed: 0
                }]
            );
        }
    }
};

Module.prototype.printBuffer = function(buffer) {
    let msg = buffer.length.toString() + ': ';
    for (let i = 0; i < buffer.length; i++) {
        msg += '0x' + buffer[i].toString(16) + ', ';
    }
    console.log(msg);
};

Module.prototype.checkHeader = function(data) {
    if (data.length >= 6) {
        let checker = 0xAA;
        for (let i = 1; i < 6; i++) {
            checker ^= data[i];
        }
        return checker === data[0] ? true : false;
    } else {
        return false;
    }
};

Module.prototype.parsing = function(data) {
    const length = data[4] | (data[5] << 8);
    let count = 0;

    while (true) {
        const index = data[6 + count];
        const size = data[7 + count] | (data[8 + count] << 8);
        switch (index) {
            case 0x03: { // Name
                this.deviceInfo.name = '';
                for (let i = 10; i < 21; i++) {
                    this.deviceInfo.name += String.fromCharCode(data[i + count]);
                }
            } break;
            case 0x16: { // Current Each
                const repeat = data[9 + count] * 4;
                for (let i = 0; i < repeat; i += 4) {
                    const id = data[10 + i + count];
                    const position = data[12 + i + count] | (data[13 + i + count] << 8);
                    this.deviceInfo.servo[id] = position;
                }
            } break;
            case 0x1E: { // Calibration
                const repeat = data[9 + count] * 3;
                for (let i = 0; i < repeat; i += 3) {
                    const id = data[10 + i + count];
                    const offset = data[11 + i + count] | (data[12 + i + count] << 8);
                    this.deviceInfo.offset[id] = offset >= 32768 ? offset - 65536 : offset;
                }
            } break;
            case 0x43: { // Analog Value
                this.deviceInfo.analog = data[9 + count] | (data[10 + count] << 8);
            } break;
            case 0x53: { // Button Control
                this.deviceInfo.button[0] = data[9 + count];
                this.deviceInfo.button[1] = data[10 + count];
            } break;
            case 0x73: { // Ultrasonic Distance
                this.deviceInfo.distance = data[9 + count] | (data[10 + count] << 8);
            } break;
        }
        count += 3 + size;
        if (count >= length) {
            break;
        }
    }
};

Module.prototype.generate = function() {
    const buffer = new Uint8Array(6 + this.cBuffer.length);
    buffer[0] = 0xAA;
    buffer[1] = 0xAA;
    buffer[2] = this.type;
    buffer[3] = this.version;
    buffer[4] = this.cBuffer.length & 0xFF;
    buffer[5] = (this.cBuffer.length >> 8) & 0xFF;
    for (let i = 0; i < this.cBuffer.length; i++) {
        buffer[1] ^= this.cBuffer[i];
        buffer[6 + i] = this.cBuffer[i];
    }
    for (let i = 1; i < 6; i++) {
        buffer[0] ^= buffer[i];
    }
    this.cBuffer = [];
    return buffer;
};

Module.prototype.addReturn = function(data) {
    const length = data.length * 2 + 1;
    const buffer = new Uint8Array(3 + length);
    buffer[0] = 0x01;
    buffer[1] = length & 0xFF;
    buffer[2] = (length >> 8) & 0xFF;
    buffer[3] = data.length;
    for (let i = 0; i < data.length; i++) {
        const addr = i * 2;
        buffer[addr + 4] = data[i].index;
        buffer[addr + 5] = data[i].repeat;
    }
    this.cBuffer.push(...buffer);
};

Module.prototype.addMode = function(mode) {
    const buffer = new Uint8Array(4);
    buffer[0] = 0x02;
    buffer[1] = 0x01;
    buffer[2] = 0x00;
    buffer[3] = mode;
    this.cBuffer.push(...buffer);
}

Module.prototype.addLedControl = function(color) {
    const buffer = new Uint8Array(6);
    buffer[0] = 0x63;
    buffer[1] = 0x03;
    buffer[2] = 0x00;
    buffer[3] = color.r;
    buffer[4] = color.g;
    buffer[5] = color.b;
    this.cBuffer.push(...buffer);
};

Module.prototype.addMelodyPlayScore = function(note) {
    const buffer = new Uint8Array(6);
    buffer[0] = 0x83;
    buffer[1] = 0x03;
    buffer[2] = 0x00;
    buffer[3] = 0x01;
    buffer[4] = note.beat;
    buffer[5] = note.pitch;
    this.cBuffer.push(...buffer);
};

Module.prototype.addMelodyPlayList = function(list) {
    const buffer = new Uint8Array(5);
    buffer[0] = 0x87;
    buffer[1] = 0x02;
    buffer[2] = 0x00;
    buffer[3] = list.name;
    buffer[4] = list.play;
    this.cBuffer.push(...buffer);
};

Module.prototype.addServoControl = function(servo) {
    let count = 0;
    const buffer = new Uint8Array(4 + servo.length * 4);
    buffer[0] = 0x13;
    buffer[1] = 0x00;
    buffer[2] = 0x00;
    buffer[3] = 0x00;
    for (let i = 0; i < servo.length; i++) {
        const addr = i * 4;
        count++;
        buffer[addr + 4] = servo[i].id;
        buffer[addr + 5] = servo[i].speed;
        buffer[addr + 6] = servo[i].position & 0xFF;
        buffer[addr + 7] = (servo[i].position >> 8) & 0xFF;
    }
    buffer[1] = count * 4 + 1;
    buffer[3] = count;
    this.cBuffer.push(...buffer);
};

Module.prototype.addPwmControl = function(pwm) {
    if (pwm !== null) {
        const buffer = new Uint8Array(5);
        buffer[0] = 0x33;
        buffer[1] = 0x02;
        buffer[2] = 0x00;
        buffer[3] = pwm & 0xFF;
        buffer[4] = (pwm >> 8) & 0xFF;
        this.cBuffer.push(...buffer);
    }
};

Module.prototype.addDcControl = function(dc) {
    let count = 0;
    const buffer = new Uint8Array(4 + dc.length * 3);
    buffer[0] = 0x23;
    buffer[1] = 0x00;
    buffer[2] = 0x00;
    buffer[3] = 0x00;
    for (let i = 0; i < dc.length; i++) {
        const addr = i * 3;
        count++;
        buffer[addr + 4] = dc[i].id;
        buffer[addr + 5] = dc[i].speed & 0xFF;
        buffer[addr + 6] = (dc[i].speed >> 8) & 0xFF;
    }
    buffer[1] = count * 3 + 1;
    buffer[3] = count;
    this.cBuffer.push(...buffer);
};

Module.prototype.addServoOffset = function(servoOffset) {
    let count = 0;
    const buffer = new Uint8Array(4 + servoOffset.length * 3);
    buffer[0] = 0x1E;
    buffer[1] = 0x00;
    buffer[2] = 0x00;
    buffer[3] = 0x00;
    for (let i = 0; i < servoOffset.length; i++) {
        const addr = i * 3;
        count++;
        buffer[addr + 4] = servoOffset[i].id;
        buffer[addr + 5] = servoOffset[i].offset & 0xFF;
        buffer[addr + 6] = (servoOffset[i].offset >> 8) & 0xFF;
    }
    buffer[1] = count * 3 + 1;
    buffer[3] = count;
    this.cBuffer.push(...buffer);
};

Module.prototype.addHeartBeat = function() {
    const buffer = new Uint8Array(4);
    buffer[0] = 0xFF;
    buffer[1] = 0x01;
    buffer[2] = 0x00;
    buffer[3] = 0x01;
    this.cBuffer.push(...buffer);
};

// 하드웨어 연결 해제 시 호출
Module.prototype.disconnect = function(connect) {
	connect.close();
};

// 연결 종료 후 처리 코드
Module.prototype.reset = function() {};
    
module.exports = new Module();
