function Module() {
    this.soundKeyArray = [30578, 28861, 27241, 25713, 24270, 22908, 21622, 20408, 19263, 18182, 17161, 16198];
    this.ledPixelArray = [0, 0, 0, 0, 0, 0, 0];
    this.protocol = {
        nemoId: 0x24,
        fwVersion: 0x42,
        sCmd0 : 0xAD,
        sCmd1: 0xDA,
        rCmd0: 0xCD,
        rCmd1: 0xDA
    };
    this.sAddr = {
        cmd0: 0,
        cmd1: 1,
        size: 2,
        led7x1: 3,        
        led7x2: 4,
        led7x3: 5,
        led7x4: 6,
        led7x5: 7,
        led7x6: 8,
        led7x7: 9,
        led7x8: 10,
        led7x9: 11,
        led7x10: 12,
        led7x11: 13,
        led7x12: 14,
        led7x13: 15,
        led7x14: 16,
        ledMs0: 17,
        ledMs1: 18,
        ledPixel: 19,
        ledSet: 20,
        portSet: 21,
        melody: 22,
        buzzer0: 23,
        buzzer1: 24,
        ledRead: 25,
        textSize: 0  // 텍스트 크기는 따로 계산하여 입력한다.
    };
    this.rAddr = {
        cmd0: 0,
        cmd1: 1,
        size: 2,
        accelAx0: 3,
        accelAx1: 4,
        accelAy0: 5,
        accelAy1: 6,
        accelAz0: 7,
        accelAz1: 8,
        accelALinear: 9,
        accelD: 10,
        illumi: 11,
        exPort: 12,
        exDigital: 13,
        anSwitch0: 14,
        anSwitch1: 15,
        anSwitch2: 16,
        anSwitch3: 17,
        diSwitch0: 18,
        diSwitch1: 19,
        ledRead: 20,
        compass: 21,
        timeCheck: 22,
        cs: 23
    };
    this.length = {
        version: 2,
        send: 26, // cs 제외 길이
    };
    this.event = {
        button: false,
        motion: false
    };
    this.device = {
        fwVersion: 0,
        accelA: [0, 0, 0, 0], // x, y, z, linear
        accelD: [false, false, false, false, false, false, false, false], // 앞, 뒤, 좌, 우, 위, 아래, 세움, 충격
        illumi: 0,
        exPort: 0,
        exDigital: [false, false, false, false], // a1, fea1, rea1, bea1
        anSwitch: [0, 0, 0, 0],
        diSwitch: {
            a: [false, false, false, false], // sw1, sw2, sw3, sw4
            fea: [false, false, false, false],
            rea: [false, false, false, false],
            bea: [false, false, false, false],
        },
        ledRead: {
            last: 0,
            curr: 0,
            state: false,
        },
        compass: 0,
        timeCheck: [0, 0, 0],
    };
    this.deviceEx = {
        button: [
            {
                last: false,
                curr: false,
                state: [false, false, false] // 눌려있을 때, 눌렀을 때, 뗐을 때
            },
            {
                last: false,
                curr: false,
                state: [false, false, false] // 눌려있을 때, 눌렀을 때, 뗐을 때
            },
            {
                last: false,
                curr: false,
                state: [false, false, false] // 눌려있을 때, 눌렀을 때, 뗐을 때
            },
            {
                last: false,
                curr: false,
                state: [false, false, false] // 눌려있을 때, 눌렀을 때, 뗐을 때
            }
        ],
        expansion:  {
            last: 0,
            curr: 0,
            start: 0,
            state: [0, 0, 0, 0] // 값, 각도, 절대각도, 회전 수
        },
        compass: {
            last: 0,
            curr: 0,
            start: 0,
            state: [0, 0, 0, 0, 0] // 값, 각도, 절대각도, 회전 수, 방향
        },
        timeCheck: [
            {
                last: 0,
                curr: 0,
                state: false,
            },
            {
                last: 0,
                curr: 0,
                state: false,
            },
            {
                last: 0,
                curr: 0,
                state: false,
            },
        ]
    };
    this.basicBuffer = new Buffer(26); // cs 제외 길이
    this.textBuffer = new Buffer(0);

    this.lastInitBlockId = 0;
    this.lastOutputBlockId = 0;
    this.lastExtensionBlockId = 0;
};

// 최초에 커넥션이 이루어진 후의 초기 설정.
// handler 는 워크스페이스와 통신하 데이터를 json 화 하는 오브젝트입니다. (datahandler/json 참고)
// config 은 module.json 오브젝트입니다.
Module.prototype.init = function(handler, config) {
    this.setDefault();
};

// 연결 후 초기에 송신할 데이터가 필요한 경우 사용합니다.
// requestInitialData 를 사용한 경우 checkInitialData 가 필수입니다.
// 이 두 함수가 정의되어있어야 로직이 동작합니다. 필요없으면 작성하지 않아도 됩니다.
Module.prototype.requestInitialData = function() {
    const packet = new Buffer(this.length.version);
    packet[this.sAddr.cmd0] = this.protocol.nemoId;
    packet[this.sAddr.cmd1] = this.protocol.fwVersion;
    return packet;
};

// 연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
Module.prototype.checkInitialData = function(data, config) {
    let isConnected = false;
    if (data.length === this.length.version && data[this.rAddr.cmd0] === this.protocol.fwVersion) {
        this.device.fwVersion = data[this.rAddr.cmd1];
        isConnected = true;
    }
    return isConnected;
};

// 하드웨어 기기에 전달할 데이터를 반환합니다.
// slave 모드인 경우 duration 속성 간격으로 지속적으로 기기에 요청을 보냅니다.
Module.prototype.requestLocalData = function() {    
    const basicSize = this.basicBuffer.length; // cs 제외 길이
    const textSize = this.textBuffer.length;
    const packetSize = basicSize + textSize + 1;
    const csIndex = packetSize - 1;    
    const packet = new Buffer(packetSize);


    this.basicBuffer[0] = this.protocol.sCmd0;
    this.basicBuffer[1] = this.protocol.sCmd1;
    this.basicBuffer[2] = (packetSize - 3); // cmd와 size 길이 제외
    for (let i = 0; i < basicSize; i++) {
        packet[i] = this.basicBuffer[i];
        if (i > this.sAddr.size) {
            packet[csIndex] = (packet[csIndex] + packet[i]) & 0xFF; 
        }
    }
    if (textSize > 0) {
        for (let i = 0; i < textSize; i++) {
            const index = basicSize + i;
            packet[index] = this.textBuffer[i];
            packet[csIndex] = (packet[csIndex] + packet[index]) & 0xFF; 
        }
    }

    this.basicBuffer = new Buffer(this.length.send);
    this.textBuffer = new Buffer(0);
    return packet;
};

// 주기적으로 하드웨어에서 받은 데이터의 검증이 필요한 경우 사용합니다.
Module.prototype.validateLocalData = function(data) {
    const size = data.length;
    let validation = false;
    if (size === this.length.version) {
        if (data[this.rAddr.cmd0] === this.protocol.fwVersion) {
            validation = true;
            this.device.fwVersion = data[this.rAddr.cmd1];
        }
    } else {
        if (data[this.rAddr.cmd0] === this.protocol.rCmd0 && data[this.rAddr.cmd1] === this.protocol.rCmd1) {
            const dataLength = data[this.rAddr.size] - 1;
            let cs = 0;
            for (let i = 0; i < dataLength; i++) {
                cs = ((cs & 0xFF) + data[i + 3]) & 0xFF;
            }
            if (data[this.rAddr.cs] === cs) {
                validation = true;
            }
        }
    }
    return validation;
};

// 하드웨어에서 온 데이터 처리
Module.prototype.handleLocalData = function(data) {
    const size = data.length
    if (size > this.length.version) {
        this.parsingAccelA(data);
        this.parsingAccelD(data);
        this.parsingIllumination(data);
        this.parsingExPort(data);
        this.parsingExDigital(data);
        this.parsingAnSwitch(data);
        this.parsingDiSwitch(data);
        this.parsingLedRead(data);
        this.parsingCompass(data);
        this.parsingTimeCheck(data);
    } else if (size === this.length.version) {
        this.device.fwVersion = data[this.rAddr.cmd1];
    }
};

// 엔트리로 전달할 데이터
Module.prototype.requestRemoteData = function(handler) {
    handler.write('NEMO_DEVICE', this.device);
    handler.write('NEMO_DEVICE_EX', this.deviceEx);
    handler.write('NEMO_EVENT_MOTION', this.event.motion);
    handler.write('NEMO_EVENT_BUTTON', this.event.button);
    this.event.motion = false;
    this.event.button = false;

};

// 엔트리에서 받은 데이터에 대한 처리
Module.prototype.handleRemoteData = function(handler) {
    const init = handler.read('NEMO_INIT');
    const output = handler.read('NEMO_OUTPUT');
    const extension = handler.read('NEMO_EXTENSION');

    if (init.id !== this.lastInitBlockId) {
        this.lastInitBlockId = init.id; 
        this.setDefault();
        this.addLedClear(true);        
        this.addMelody(0);
    }

    if (output.id !== this.lastOutputBlockId) {
        this.lastOutputBlockId = output.id;
        switch (output.index) {
            case 0:
                this.addLedSet(output.iconLED.index, output.iconLED.time);
                break;
            case 1:
                this.addLedLine(output.customLED.icon, output.customLED.value, output.customLED.time);
                break;
            case 2:
                this.addText(output.textLED.text, output.textLED.time);
                break;
            case 3:
                this.addLedClear(output.deleteLED.value);
                break;
            case 4:
                this.addLedPixel(output.coordinateLED.index, output.coordinateLED.state);
                break;
            case 5:
            case 6:
                this.addMelody(output.playMelody.title);
                break;
            case 7:
                this.addBuzzer(output.playNote.pitch);
                break;
            case 9:
                this.addBuzzer(output.playNote.pitch);
                this.addMelody(output.playMelody.title);
                break;
            case 10:
                this.addLEDRead(output.readLED.index);
                break;

        }
    }
    
    if (extension.id !== this.lastExtensionBlockId) {
        this.lastExtensionBlockId = extension.id;
        switch (extension.index)
        {
            case 0:
                this.addSetExpension(extension.setExpansion.type);
                break;
            case 1:
                this.addSetExpensionValue(extension.setExpansionValue.value);
                break;
            case 2:
                this.addSetCompassValue(extension.setCompassValue.value);
                break;
        }
    }
};

// 하드웨어 연결 해제 시 호출
Module.prototype.disconnect = function(connect) {
	connect.close();
};

// 연결 종료 후 처리 코드
Module.prototype.reset = function() {

};

Module.prototype.setDefault = function() {
    this.ledPixelArray = [0, 0, 0, 0, 0, 0, 0];
    this.event = {
        button: false,
        motion: false
    };
    this.device = {
        fwVersion: 0,
        accelA: [0, 0, 0, 0], // x, y, z, linear
        accelD: [false, false, false, false, false, false, false, false], // 앞, 뒤, 좌, 우, 위, 아래, 세움, 충격
        illumi: 0,
        exPort: 0,
        exDigital: [false, false, false, false], // a1, fea1, rea1, bea1
        anSwitch: [0, 0, 0, 0],
        diSwitch: {
            a: [false, false, false, false], // sw1, sw2, sw3, sw4
            fea: [false, false, false, false],
            rea: [false, false, false, false],
            bea: [false, false, false, false],
        },
        ledRead: {
            last: 0,
            curr: 0,
            state: false,
        },
        compass: 0,
        timeCheck: [0, 0, 0],
    };
    this.deviceEx = {
        button: [
            {
                last: false,
                curr: false,
                state: [false, false, false] // 눌려있을 때, 눌렀을 때, 뗐을 때
            },
            {
                last: false,
                curr: false,
                state: [false, false, false] // 눌려있을 때, 눌렀을 때, 뗐을 때
            },
            {
                last: false,
                curr: false,
                state: [false, false, false] // 눌려있을 때, 눌렀을 때, 뗐을 때
            },
            {
                last: false,
                curr: false,
                state: [false, false, false] // 눌려있을 때, 눌렀을 때, 뗐을 때
            }
        ],
        expansion:  {
            last: 0,
            curr: 0,
            start: 0,
            state: [0, 0, 0, 0, false, false, false] // 값, 각도, 절대각도, 회전 수, 눌려있을 때, 눌렀을 때, 뗐을 때
        },
        compass: {
            last: 0,
            curr: 0,
            start: 0,
            state: [0, 0, 0, 0, 0] // 값, 각도, 절대각도, 회전 수, 방향
        },
        timeCheck: [
            {
                last: 0,
                curr: 0,
                state: false,
            },
            {
                last: 0,
                curr: 0,
                state: false,
            },
            {
                last: 0,
                curr: 0,
                state: false,
            },
        ]
    };
    this.basicBuffer = new Buffer(26); // cs 제외 길이
    this.textBuffer = new Buffer(0);
};

Module.prototype.parsingAccelA = function(data) {
    for (let i = 0; i < 3; i++) {
        const lowData = data[i * 2 + 3];
        const highData = data[i * 2 + 4];
        const temp = (lowData & 0x80) === 0x80
            ? (0x10000 - ((lowData << 8) | highData)) * -1
            : (lowData << 8) | highData;
        this.device.accelA[i] = temp / 10.0;
    }
    this.device.accelA[3] = data[this.rAddr.accelALinear]
};

Module.prototype.parsingAccelD = function(data) {    
    for (let i = 0; i < 8; i++) {
        const temp = (data[this.rAddr.accelD] >> i) & 0x01;
        if (temp === 1) {
            this.event.motion = true;
            this.device.accelD[7 - i] = true;
        } else {
            this.device.accelD[7 - i] = false;
        }
    }
}

Module.prototype.parsingIllumination = function(data) {
    this.device.illumi = data[this.rAddr.illumi];
}

Module.prototype.parsingExPort = function(data) {    
    const sen = data[this.rAddr.exPort];    
    this.device.exPort = sen;
    this.deviceEx.expansion.curr = sen;

    if (this.deviceEx.expansion.curr !== this.deviceEx.expansion.last) {
        let diff = this.deviceEx.expansion.last - this.deviceEx.expansion.curr;

        // 회전수: 3
        if (diff > 200) {
            this.deviceEx.expansion.state[3] += 1;
        } else if (diff < -200) {           
            this.deviceEx.expansion.state[3] -= 1;
        }

        // 값: 0
        this.deviceEx.expansion.state[0] = (sen - this.deviceEx.expansion.start) + (this.deviceEx.expansion.state[3] * 255);
        
        // 각도: 1
        let angle = (this.deviceEx.expansion.state[0] % 255);
        if (angle < 0) {
            angle = 255 + angle;
        }
        this.deviceEx.expansion.state[1] = Math.floor(angle * 1.41732);

        // 절대각도: 2    
        this.deviceEx.expansion.state[2] =  Math.floor(sen * 1.41732);
    }

    this.deviceEx.expansion.last = this.deviceEx.expansion.curr;
}

Module.prototype.parsingExDigital = function(data) {
    for (let i = 4; i < 8; i++) {
        const temp = (data[[this.rAddr.exDigital]] >> i) & 0x01;
        this.device.exDigital[i - 4] = temp === 1 ? true : false;
    }
    // 확장센서 버튼 상태값
    this.deviceEx.expansion.state[4] = this.device.exDigital[3];
    this.deviceEx.expansion.state[5] = this.device.exDigital[2];
    this.deviceEx.expansion.state[6] = this.device.exDigital[1];
}

Module.prototype.parsingAnSwitch = function(data) {
    this.device.anSwitch[0] = data[this.rAddr.anSwitch0];
    this.device.anSwitch[1] = data[this.rAddr.anSwitch1];
    this.device.anSwitch[2] = data[this.rAddr.anSwitch2];
    this.device.anSwitch[3] = data[this.rAddr.anSwitch3];
}

Module.prototype.parsingDiSwitch = function(data) {
    for (let i = 0; i < 8; i++) {
        const temp1 = ((data[this.rAddr.diSwitch0] >> i) & 0x01) === 1 
            ? true
            : false;
        const temp2 = ((data[this.rAddr.diSwitch1] >> i) & 0x01) === 1
            ? true
            : false;
        if (4 <= i && i <= 7) {
            const index = i - 4;
            this.device.diSwitch.a[index] = temp1;
            this.deviceEx.button[index].curr = temp1;
            this.device.diSwitch.rea[index] = temp2;

            if (!this.deviceEx.button[index].curr && !this.deviceEx.button[index].last) {
                this.deviceEx.button[index].state[0] = false;
                this.deviceEx.button[index].state[1] = false;
                this.deviceEx.button[index].state[2] = false;
            } else {
                this.event.button = true;
                this.deviceEx.button[index].state[0] = true;
                if (this.deviceEx.button[index].curr && this.deviceEx.button[index].last) {
                    this.deviceEx.button[index].state[1] = false;
                    this.deviceEx.button[index].state[2] = false;
                } else if (this.deviceEx.button[index].curr && !this.deviceEx.button[index].last) {
                    this.deviceEx.button[index].state[1] = true;
                    this.deviceEx.button[index].state[2] = false;
                } else if (!this.deviceEx.button[index].curr && this.deviceEx.button[index].last) {
                    this.deviceEx.button[index].state[1] = false;
                    this.deviceEx.button[index].state[2] = true;
                }
            }
            this.deviceEx.button[index].last = this.deviceEx.button[index].curr;
        } else if (0 <= i && i <= 3) {
            const index = 3 - i;
            this.device.diSwitch.fea[index] = temp1;
            this.device.diSwitch.bea[index] = temp2;
        }
    }
};

Module.prototype.parsingLedRead = function(data) {
    this.device.ledRead.curr = data[this.rAddr.ledRead] & 0x7F;
    if (this.device.ledRead.curr !== this.device.ledRead.last) {
        this.device.ledRead.state = (data[this.rAddr.ledRead] >> 7) & 0x01;
    }
    this.device.ledRead.last = this.device.ledRead.curr;
};

Module.prototype.parsingCompass = function(data) {
    const sen = data[this.rAddr.compass];    
    this.device.compass = sen;
    this.deviceEx.compass.curr = sen;

    if (this.deviceEx.compass.curr !== this.deviceEx.compass.last) {
        let diff = this.deviceEx.compass.last - this.deviceEx.compass.curr;
        
        // 회전수: 3
        if (diff > 200) {
            this.deviceEx.compass.state[3] += 1;
        } else if (diff < -200) {           
            this.deviceEx.compass.state[3] -= 1;
        }

        // 값: 0
        this.deviceEx.compass.state[0] = (sen - this.deviceEx.compass.start) + (this.deviceEx.compass.state[3] * 255);
        
        // 각도: 1
        let angle = (this.deviceEx.compass.state[0] % 255);
        if (angle < 0) {
            angle = 255 + angle;
        }
        this.deviceEx.compass.state[1] = Math.floor(angle * 1.41732);

        // 절대각도: 2    
        this.deviceEx.compass.state[2] =  Math.floor(sen * 1.41732);

        // 방향: 4
        if (35 <= sen && sen < 99) {
            this.deviceEx.compass.state[4] = 0; // 동
        } else if (99 <= sen && sen < 163) {
            this.deviceEx.compass.state[4] = 2; // 남
        } else if (163 <= sen && sen < 227) {
            this.deviceEx.compass.state[4] = 1; // 서
        } else { // 227-34
            this.deviceEx.compass.state[4] = 3; // 북
        }
    }

    this.deviceEx.compass.last = this.deviceEx.compass.curr;
};

Module.prototype.parsingTimeCheck = function(data) {
    for (let i = 0; i < 3; i++) {
        this.device.timeCheck[i] = (data[this.rAddr.timeCheck] >> ((3 - i) * 2)) & 0x03;
        this.deviceEx.timeCheck[i].curr = this.device.timeCheck[i];
        this.deviceEx.timeCheck[i].state = (this.deviceEx.timeCheck[i].last !== this.deviceEx.timeCheck[i].curr)
            ? true
            : false; 
        this.deviceEx.timeCheck[i].last = this.deviceEx.timeCheck[i].curr;
    }
};

Module.prototype.addLedLine = function(index, led, time) {
    // 펌웨어의 x,y 좌표와 실제 표기할 x,y 좌표가 달라 아래와 같이 프로그래밍합니다
    for (let i = 0; i < 7; i++) {
        const bitValue = led[i] & 0x01;
        this.ledPixelArray[i] |= 0x80;
        if (bitValue) {
            this.ledPixelArray[i] |= 1 << index;
        } else {
            this.ledPixelArray[i] &= ~(1 << index);
        }
    }
    for (let i = 0; i < 7; i++) {        
        this.basicBuffer[this.sAddr.led7x1 + i] = this.ledPixelArray[i];
    }
    this.basicBuffer[this.sAddr.ledMs0] = (time >> 8) & 0x7F;
    this.basicBuffer[this.sAddr.ledMs1] = time & 0xFF;
};

Module.prototype.addLedClear = function(value) {
    if (value === true) {
        for (let i = 0; i < 7; i++) {
            this.basicBuffer[this.sAddr.led7x1 + i] = 0x80;
        }
    }
}

Module.prototype.addLedPixel = function(index, state) {
    this.basicBuffer[this.sAddr.ledPixel] = ((state & 0x03) << 6) | (index & 0x3F);    
};

Module.prototype.addLedSet = function(index, time) {
    this.basicBuffer[this.sAddr.ledSet] = index;
    this.basicBuffer[this.sAddr.ledMs0] = (time >> 8) & 0x7F;
    this.basicBuffer[this.sAddr.ledMs1] = time & 0xFF;
};

Module.prototype.addPortset = function(index) {
    this.basicBuffer[this.sAddr.portSet] = index & 0x0F;
};

Module.prototype.addMelody = function(index) {
    this.basicBuffer[this.sAddr.melody] = 0x80 | (index & 0x7F);
};

Module.prototype.addBuzzer = function(note) {
    if (0 <= note && note <= 47) {
        const n = (note / 12) & 0xFF;
        const v = note % 12;
        let r = 2;
        for (let i = 0; i < n; i++) {
            r *= 2;
        }
        const hertz = this.soundKeyArray[v] / r;
        this.basicBuffer[this.sAddr.buzzer0] = 0x80 | ((hertz >> 8) & 0x7F);
        this.basicBuffer[this.sAddr.buzzer1] = hertz & 0x7F;
    }
};

Module.prototype.addText = function(text, time) {
    const size = text.length;
    this.textBuffer = new Buffer(size + 1);
    this.textBuffer[this.sAddr.textSize] = size;
    for (let i = 0; i < size; i++) {
        this.textBuffer[i + 1] = text[i].charCodeAt();
    }
    this.basicBuffer[this.sAddr.ledMs0] = (time >> 8) & 0x7F;
    this.basicBuffer[this.sAddr.ledMs1] = time & 0xFF;
};

Module.prototype.addLEDRead = function(index) {
    this.basicBuffer[this.sAddr.ledRead] = index;
};

Module.prototype.addSetExpension = function(type) {
    switch (type) {
        case 1:
        case 2:
        case 3:
            this.basicBuffer[this.sAddr.portSet] = 0x01;
            break;
        case 4:
        case 6:
            this.basicBuffer[this.sAddr.portSet] = 0x02;
            break;
        case 5:
            this.basicBuffer[this.sAddr.portSet] = 0x07;
            break;
        case 7:
            this.basicBuffer[this.sAddr.portSet] = 0x08;
            break;
        case 8:
            this.basicBuffer[this.sAddr.portSet] = 0x04;
            break;
        case 9:
            this.basicBuffer[this.sAddr.portSet] = 0x05;
            break;
        case 10:
            this.basicBuffer[this.sAddr.portSet] = 0x06;
            break;
    }
};

Module.prototype.addSetExpensionValue = function(value) {
    this.deviceEx.expansion.start = this.device.exPort - (value % 255);
    this.deviceEx.expansion.state[3] = Math.floor(value / 255);
    this.deviceEx.expansion.last = -1;
};

Module.prototype.addSetCompassValue = function(value) {    
    this.deviceEx.compass.start = this.device.compass - (value % 255);
    this.deviceEx.compass.state[3] = Math.floor(value / 255);
    this.deviceEx.compass.last = -1;
};
    
module.exports = new Module();
