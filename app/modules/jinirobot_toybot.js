function Module() {
    this.comparerId1 = 0;
    this.comparerId2 = 0;
    this.playedblockId = 0;
    this.deviceInfo = {
        name: "--",
        distance: 0,
        button: [0, 0],
        analog: 0,
        servo: [0, 0, 0, 0, 0],
        offset: [0, 0, 0, 0, 0],
    };
    this.cBuffer = []; // contants buffer
};

// 최초에 커넥션이 이루어진 후의 초기 설정.
// handler 는 워크스페이스와 통신하 데이터를 json 화 하는 오브젝트입니다. (datahandler/json 참고)
// config 은 module.json 오브젝트입니다.
Module.prototype.init = function(handler, config) {	
    this.comparerId1 = 0;
    this.comparerId2 = 0;
    this.playedblockId = 0;
    this.deviceInfo.distance = 0;
    this.deviceInfo.button[0] = 0;
    this.deviceInfo.button[1] = 0;
    this.deviceInfo.analog = 0;
    this.deviceInfo.servo[0] = 0;
    this.deviceInfo.servo[1] = 0;
    this.deviceInfo.servo[2] = 0;
    this.deviceInfo.servo[3] = 0;
    this.deviceInfo.servo[4] = 0;
    this.cBuffer = [];
};

// 연결 후 초기에 송신할 데이터가 필요한 경우 사용합니다.
// requestInitialData 를 사용한 경우 checkInitialData 가 필수입니다.
// 이 두 함수가 정의되어있어야 로직이 동작합니다. 필요없으면 작성하지 않아도 됩니다.
Module.prototype.requestInitialData = function() {
    const packet = this.firstPacket();
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
    this.addReadInput();
    this.addHeartBeat();
    const data = this.generate();
    return data;	
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
    const block1 = handler.read('setblock1');
    const block2 = handler.read('setblock2');
    if (this.comparerId1 !== block1.id) {
        this.comparerId1 = block1.id;
        if (block1.ledControl) {
            const r = block1.ledControl.r;
            const g = block1.ledControl.g;
            const b = block1.ledControl.b;
            this.addLedControl(r, g, b);
        } else if (block1.playScore) {
            const note = block1.playScore.note;
            const pitch = block1.playScore.pitch;
            this.playedblockId = block1.id;
            this.addMelodyPlayScore(note, pitch);
        } else if (block1.playList) {
            const list = block1.playList.list;
            const play = block1.playList.play;
            this.addMelodyPlayList(list, play);
        } else if (block1.servoControl) {
            const id = block1.servoControl.id;
            const speed = block1.servoControl.speed;
            const position = block1.servoControl.position;
            this.addServoControl(id, speed, position);
        } else if (block1.pwmControl) {
            const pwm = block1.pwmControl.pwm;
            this.addPwmControl(pwm);
        } else if (block1.dcControl) {
            const id = block1.dcControl.id;
            const speed = block1.dcControl.speed;
            this.addDcControl(id, speed);
        } else if (block1.servoOffset) {
            const id = block1.servoOffset.id;
            const offset = block1.servoOffset.offset;
            this.addServoOffset(id, offset);
        }
    }
    if (this.comparerId2 !== block2.id) {
        this.comparerId2 = block2.id;
        if (block2.playScore) {
            const note = block2.playScore.note;
            const pitch = block2.playScore.pitch;
            if (this.playedblockId == block2.id) {
                this.addMelodyPlayScore(note, pitch);
            }
        }
    }
};

Module.prototype.printBuffer = function(buffer) {
    let msg = buffer.length.toString() + ": ";
    for (let i = 0; i < buffer.length; i++) {
        msg += "0x" + buffer[i].toString(16) + ", ";
    }
    console.log(msg);
};

Module.prototype.checkHeader = function(data) {
    if (data.length >= 6) {
        let checker = 0;
        for (let i = 1; i < 6; i++) {
            checker ^= data[i];
        }
        return checker === data[0] ? true : false;       
    }
    else {
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
            case 0x03: {
                this.deviceInfo.name = "";
                for (let i = 10; i < 21; i++) {
                    this.deviceInfo.name += String.fromCharCode(data[i + count]);
                }
            } break;
            case 0x13: { // Control Each
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

Module.prototype.firstPacket = function() {
    const buffer = new Uint8Array(16);
    buffer[0] = 0x2B;
    buffer[1] = 0x02;
    buffer[2] = 0x03;
    buffer[3] = 0x20;
    buffer[4] = 0x0A;
    buffer[5] = 0x00;
    buffer[6] = 0x02;
    buffer[7] = 0x01;
    buffer[8] = 0x00;
    buffer[9] = 0x03;
    buffer[10] = 0x01;
    buffer[11] = 0x03;
    buffer[12] = 0x00;
    buffer[13] = 0x01;
    buffer[14] = 0x03;
    buffer[15] = 0x02;
    return buffer;
};

Module.prototype.generate = function() {
    let buffer = [0, 0, 0, 0, 0, 0];
    buffer[2] = 0x03;
    buffer[3] = 0x20;
    buffer[4] = this.cBuffer.length & 0xFF;
    buffer[5] = (this.cBuffer.length >> 8) & 0xFF;
    for (let i = 0; i < this.cBuffer.length; i++) {
        buffer[1] ^= this.cBuffer[i];
        buffer.push(this.cBuffer[i]);
    }
    //buffer[1] ^= 0xAA;
    for (let i = 1; i < 6; i++) {
        buffer[0] ^= buffer[i];
    }
    //buffer[0] ^= 0xAA;
    this.cBuffer = [];
    return buffer;
};

Module.prototype.addHeartBeat = function() {
    const buffer = [0xFF, 0x01, 0x00, 0x01];
    this.cBuffer.push(...buffer);
};

Module.prototype.addReadInput = function() {
    const buffer = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    buffer[0] = 0x01;
    buffer[1] = 0x0B;
    buffer[2] = 0x00;
    buffer[3] = 0x05;
    buffer[4] = 0x43;
    buffer[5] = 0x02;
    buffer[6] = 0x53;
    buffer[7] = 0x02;
    buffer[8] = 0x73;
    buffer[9] = 0x02;
    buffer[10] = 0x13;
    buffer[11] = 0x02;    
    buffer[12] = 0x1E;
    buffer[13] = 0x02;
    this.cBuffer.push(...buffer);
};

Module.prototype.addLedControl = function(r, g, b) {
    if (r !== null && g !== null && b !== null) {
        const buffer = [0, 0, 0, 0, 0, 0];
        buffer[0] = 0x63;
        buffer[1] = 0x03;
        buffer[2] = 0x00;
        buffer[3] = r;
        buffer[4] = g;
        buffer[5] = b;
        this.cBuffer.push(...buffer);
    }
};

Module.prototype.addMelodyPlayScore = function(note, pitch) {
    if (note !== null && pitch !== null) {
        const buffer = [0, 0, 0, 0, 0, 0];
        buffer[0] = 0x83;
        buffer[1] = 0x02 + 1;
        buffer[2] = 0x00;
        buffer[3] = 0x01;
        buffer[4] = note;
        buffer[5] = pitch;
        this.cBuffer.push(...buffer);
    }
};

Module.prototype.addMelodyPlayList = function(list, play) {
    if (list !== null && play !== null) {
        const buffer = [0, 0, 0, 0, 0];
        buffer[0] = 0x87;
        buffer[1] = 0x02;
        buffer[2] = 0x00;
        buffer[3] = list;
        buffer[4] = play;
        this.cBuffer.push(...buffer);
    }
};

Module.prototype.addServoControl = function(id, speed, position) {
    let count = 0;
    let buffer = [0, 0, 0, 0];
    buffer[0] = 0x13;
    buffer[1] = 0x00;
    buffer[2] = 0x00;
    buffer[3] = 0x00;
    for (let i = 0; i < id.length; i++) {
        if (id[i] !== null && speed[i] !== null && position[i] !== null) {
            count++;
            buffer.push(id[i]);
            buffer.push(speed[i]);
            buffer.push(position[i] & 0xFF);
            buffer.push((position[i] >> 8) & 0xFF);
        }
    }
    buffer[1] = count * 4 + 1;
    buffer[3] = count;
    this.cBuffer.push(...buffer);
};

Module.prototype.addPwmControl = function(pwm) {
    if (pwm !== null) {
        const buffer = [0, 0, 0, 0];
        buffer[0] = 0x33;
        buffer[1] = 0x01;
        buffer[2] = 0x00;
        buffer[3] = pwm;
        this.cBuffer.push(...buffer);
    }
};

Module.prototype.addDcControl = function(id, speed) {
    let count = 0;
    let buffer = [0, 0, 0, 0];
    buffer[0] = 0x23;
    buffer[1] = 0x00;
    buffer[2] = 0x00;
    buffer[3] = 0x00;
    for (let i = 0; i < id.length; i++) {
        if (id[i] !== null && speed[i] !== null) {
            count++;
            buffer.push(id[i]);
            buffer.push(speed[i] & 0xFF);
            buffer.push((speed[i] >> 8) & 0xFF);
        }
    }
    buffer[1] = count * 3 + 1;
    buffer[3] = count;
    this.cBuffer.push(...buffer);

};

Module.prototype.addServoOffset = function(id, offset) {
    let count = 0;
    let buffer = [0, 0, 0, 0];
    buffer[0] = 0x1E;
    buffer[1] = 0x00;
    buffer[2] = 0x00;
    buffer[3] = 0x00;
    for (let i = 0; i < id.length; i++) {
        if (id[i] !== null && offset[i] !== null) {
            count++;
            buffer.push(id[i]);
            buffer.push(offset[i] & 0xFF);
            buffer.push((offset[i] >> 8) & 0xFF);
        }
    }
    buffer[1] = count * 3 + 1;
    buffer[3] = count;
    this.cBuffer.push(...buffer);
};



// 하드웨어 연결 해제 시 호출
Module.prototype.disconnect = function(connect) {
	connect.close();
};

// 연결 종료 후 처리 코드
Module.prototype.reset = function() {
};
    
module.exports = new Module();