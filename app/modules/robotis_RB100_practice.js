function Module() {
    this.isReadDataArrived = true;
    this.isConnected = true;
    this.addressToRead = [];
    this.varTimeout = null;

    this.prevInstruction = 0;
    this.prevAddress = [];
    this.prevLength = [];
    this.prevValue = [];

    this.servoPrevAddres = []; // add by kjs 20170627 
    this.servoPrevLength = []; // add by kjs 20170627 
    this.servoPrevValue = []; // add by kjs 20170627 
    this.servoPrevAddres2 = []; // add by kjs 20170627 
    this.servoPrevLength2 = []; // add by kjs 20170627 
    this.servoPrevValue2 = []; // add by kjs 20170627 
    this.servoPrevAddres3 = []; // add by kjs 20170627 
    this.servoPrevLength3 = []; // add by kjs 20170627 
    this.servoPrevValue3 = []; // add by kjs 20170627 
    this.servoPrevAddres4 = []; // add by kjs 20170627 
    this.servoPrevLength4 = []; // add by kjs 20170627 
    this.servoPrevValue4 = []; // add by kjs 20170627 

    this.receiveBuffer = []; // buffer to receive from H/W
    this.dataBuffer = []; // saved sensor value buffer
    this.robotisBuffer = []; // buffer to save 'ROBOTIS_DATA'
    this.receiveAddress = -1; // to check read packet
    this.receiveLength = -1; // to check read packet
    this.defaultLength = -1; // to check read packet

    this.packetReceiveState = 0;
    this.headerCount = 0;

    this.isFront = 32; // add by kjs 170511
    this.prevRightValue = 0;
    this.prevLeftValue = 0;
    this.isRight = false;

    //this.touchSensor = 0;
    this.humidity = [];
    this.temperature = [];
    this.colorSensor = [];
    this.touchSensor = [];
    this.irSensor = [];
    this.lightSensor = [];
    this.detectedSound = 0;
    this.detectringSound = 0;
    this.userButtonState = 0;
    this.isUpdate = []; // add by kjs 170623
    this.prevState = []; // add by kjs 170623
}

Module.prototype.init = function(handler, config) {
    //console.log("######### init");

};

Module.prototype.lostController = function(self, callback) {
    self.timer = setInterval(() => {
        if (self.connected) {
            if (self.received == false) {
                if (this.isConnected == false) {
                    self.connected = false;
                    if (callback) {
                        callback('lost');
                    }
                }
                this.isConnected = false;
            }
            self.received = false;
        }
    }, 1000);
};

Module.prototype.requestInitialData = function() {
    //console.log("######### requestInitialData");
    this.isReadDataArrived = true;
    this.isConnected = true;
    this.addressToRead = [];
    this.varTimeout = null;

    this.prevInstruction = 0;
    this.prevAddress = [];
    this.prevLength = [];
    this.prevValue = [];

    this.servoPrevAddres = [];
    this.servoPrevLength = [];
    this.servoPrevValue = [];

    this.receiveBuffer = [];
    this.dataBuffer = [];
    this.robotisBuffer = [];
    this.receiveAddress = -1;
    this.receiveLength = -1;
    this.defaultLength = -1;

    //this.touchSensor = 0;
    this.colorSensor = [];
    this.temperature = [];
    this.humidity = [];
    this.touchSensor = [];
    this.irSensor = [];
    this.lightSensor = [];
    this.detectedSound = 0;
    this.detectringSound = 0;
    this.userButtonState = 0;

    this.servoPrevAddres = []; // add by kjs 20170627 
    this.servoPrevLength = []; // add by kjs 20170627 
    this.servoPrevValue = [];  // add by kjs 20170627 
    this.servoPrevAddres2 = []; // add by kjs 20170627 
    this.servoPrevLength2 = []; // add by kjs 20170627 
    this.servoPrevValue2 = [];  // add by kjs 20170627 
    this.servoPrevAddres3 = []; // add by kjs 20170627 
    this.servoPrevLength3 = []; // add by kjs 20170627 
    this.servoPrevValue3 = [];  // add by kjs 20170627 
    this.servoPrevAddres4 = []; // add by kjs 20170627 
    this.servoPrevLength4 = []; // add by kjs 20170627 
    this.servoPrevValue4 = [];  // add by kjs 20170627 

    this.robotisBuffer.push([INST_WRITE, 21, 2, 20]);
    this.robotisBuffer.push([INST_WRITE, 19, 1, 1]); // bypass 모드 켜기
    this.robotisBuffer.push([INST_WRITE, 20, 1, 0]); // bypass port를 BLE로 설정
    this.robotisBuffer.push([INST_WRITE, 23, 1, 1]); // auto report 기능 켜기
    this.robotisBuffer.push([INST_WRITE, 4250, 1, 1]); // huskylens 텍스트 지우기
    this.robotisBuffer.push([INST_WRITE, 722, 1, 0]); // dxl 토크 끄기
    
    rxPacket.header = [0, 0, 0];
    rxPacket.reserved = 0;
    rxPacket.id = 0;
    rxPacket.cmd = 0;
    rxPacket.error = 0;
    rxPacket.type = 0;
    rxPacket.index = 0;
    rxPacket.packetLength = 0;
    rxPacket.paramLength = 0;
    rxPacket.crc = 0;
    rxPacket.crcReceived = 0;
    rxPacket.checksum = 0;
    rxPacket.checksumReceived = 0;
    rxPacket.data = [];

    return this.readPacket(200, 0, 2);
};

Module.prototype.checkInitialData = function(data, config) {
    console.log('######### checkInitialData');

    return true;
};

Module.prototype.validateLocalData = function(data) {
    return true;
};

Module.prototype.requestRemoteData = function(handler) {
    for (let indexA = 0; indexA < this.dataBuffer.length; indexA++) { // 일반형
        if (this.dataBuffer[indexA] != undefined) {
            // console.log("indexA: " + indexA + " value: " + this.dataBuffer[indexA]);
            handler.write(indexA, this.dataBuffer[indexA]);
        }
    }
    //실과형
    //console.log("###### value : " + this.detectedSound);
    /*
    for (let i = 0; i < 4; i++) {        
        handler.write(`TOUCH${i}`, this.touchSensor[i]); // 접촉 센서
        handler.write(`IR${i}`, this.irSensor[i]); // 적외선 센서
        handler.write(`LIGHT${i}`, this.lightSensor[i]); // 조도 센서
        handler.write(`COLOR${i}`, this.colorSensor[i]); // 칼라 센서
        handler.write(`HUMIDTY${i}`, this.humidity[i]); // 습도 센서
        handler.write(`TEMPERATURE${i}`, this.temperature[i]); // 온도 센서
    }
    handler.write('DETECTEDSOUNDE', this.detectedSound); // 최종 소리 감지 횟수
    handler.write('DETECTINGSOUNDE1', this.detectringSound); // 실시간 소리 감지 횟수
    handler.write('USERBUTTONSTATE', this.userButtonState);
    */
};

Module.prototype.handleRemoteData = function(handler) {
    const data = handler.read('ROBOTIS_DATA');

    const setZero = handler.read('setZero');
    if (setZero[0] == 1) {
        this.robotisBuffer = [];

        this.servoPrevAddres = []; // add by kjs 20170627 
        this.servoPrevLength = []; // add by kjs 20170627 
        this.servoPrevValue = [];  // add by kjs 20170627 
        this.servoPrevAddres2 = []; // add by kjs 20170627 
        this.servoPrevLength2 = []; // add by kjs 20170627 
        this.servoPrevValue2 = [];  // add by kjs 20170627 
        this.servoPrevAddres3 = []; // add by kjs 20170627 
        this.servoPrevLength3 = []; // add by kjs 20170627 
        this.servoPrevValue3 = [];  // add by kjs 20170627 
        this.servoPrevAddres4 = []; // add by kjs 20170627 
        this.servoPrevLength4 = []; // add by kjs 20170627 
        this.servoPrevValue4 = [];  // add by kjs 20170627 
    }
    for (let index = 0; index < data.length; index++) {
        const instruction = data[index][0];
        const address = data[index][1];
        const length = data[index][2];
        const value = data[index][3];
        let doSend = false;
        //console.log("###2 : " + address + " and : " + value + " inst : " + instruction + " length : " + length);
        if (instruction == INST_NONE) {
            doSend = false;
        } else if (instruction == INST_READ) {
            if (this.isReadDataArrived == false &&
                this.prevInstruction == INST_READ &&
                this.prevAddress == address &&
                this.prevLength == length &&
                this.prevValue == value) {
                doSend = false;
            } else {
                doSend = true;
            }
        } else if (instruction == INST_BYPASS_READ) {
            if (this.isReadDataArrived == false &&
                this.prevInstruction == INST_BYPASS_READ &&
                this.prevAddress == address &&
                this.prevLength == length &&
                this.prevValue == value) {
                doSend = false;
            } else {
                doSend = true;
            }
        }
        //console.log("dosend : " + doSend);
        if (doSend) {
            for (let indexA = 0; indexA < this.robotisBuffer.length; indexA++) {
                if (data[index][0] == this.robotisBuffer[indexA][0] &&
                    data[index][1] == this.robotisBuffer[indexA][1] &&
                    data[index][2] == this.robotisBuffer[indexA][2] &&
                    data[index][3] == this.robotisBuffer[indexA][3]) {
                    doSend = false;
                    break;
                }
            }
        }
        if (instruction == INST_WRITE || 
            instruction == 4 || 
            instruction == 5 || 
            instruction == 6 || 
            instruction == INST_BYPASS_WRITE) {
            doSend = true;
        }
        if (!doSend) {
            continue;
        }

        if (setZero[0] == 1) {
            this.prevInstruction = 0;
            this.prevAddress = [];
            this.prevLength = [];
            this.prevValue = [];

            this.servoPrevAddres = []; // add by kjs 20170627 
            this.servoPrevLength = []; // add by kjs 20170627 
            this.servoPrevValue = [];  // add by kjs 20170627 
            this.servoPrevAddres2 = []; // add by kjs 20170627 
            this.servoPrevLength2 = []; // add by kjs 20170627 
            this.servoPrevValue2 = [];  // add by kjs 20170627 
            this.servoPrevAddres3 = []; // add by kjs 20170627 
            this.servoPrevLength3 = []; // add by kjs 20170627 
            this.servoPrevValue3 = [];  // add by kjs 20170627 
            this.servoPrevAddres4 = []; // add by kjs 20170627 
            this.servoPrevLength4 = []; // add by kjs 20170627 
            this.servoPrevValue4 = [];  // add by kjs 20170627 
        } else {
            this.prevInstruction = instruction;
            this.prevAddress = address;
            this.prevLength = length;
            this.prevValue = value;
            this.prevServoSet(address, value, length);
        }

        if (instruction == INST_WRITE || 
            instruction == INST_DXL_SYNCWRITE || 
            instruction == INST_DXL_REGWRITE || 
            instruction == INST_DXL_ACTION || 
            instruction == INST_BYPASS_WRITE) {
            this.robotisBuffer.push(data[index]);
            if (instruction == INST_WRITE) {
                // 만약 bypass mode를 enable 한다고 하면
                if (address == 19 && value == 1) {
                    // bypass port를 BLE로 설정
                    this.robotisBuffer.push([INST_WRITE, 20, 1, 0]);
                }
            }
        } else if (instruction == INST_READ || instruction == INST_BYPASS_READ) {
            if (this.addressToRead[address] == undefined || this.addressToRead[address] == 0) {
                this.addressToRead[address] = 1;
                this.robotisBuffer.push(data[index]);
            } else {
                // 10번 이상 읽지 못한다면 에러이므로 강제로 읽을 수 있도록 처리
                this.addressToRead[address] += 1;
                if (this.addressToRead[address] >= 10) {
                    this.addressToRead[address] = 0;
                }
            }
        }
    }
};

Module.prototype.requestLocalData = function() {
    let sendBuffer = null;
    let dataLength = 0;
    if (this.isReadDataArrived == false) {
        //console.log("######## 1");
        return sendBuffer;
    }
    /////////////////
    this.isConnected  = true;
    if (!this.isConnected) {
        this.receiveAddress = -1;        
        return this.readPacket(200, 0, 2);
    }

    {
        const data = this.robotisBuffer.shift();
        if (data == null) {
            return sendBuffer;
        }
        const instruction = data[0];
        const address = data[1];
        const length = data[2];
        let value = data[3];
        const value2 = data[4];
        //console.log('send address : ' + address + ', ' + value + ", " + length); // add by kjs 170426
        if (instruction == INST_WRITE) {
            if (length == 1) {
                sendBuffer = this.writeBytePacket(200, address, value);
            } else if (length == 2) {
                sendBuffer = this.writeWordPacket(200, address, value);
            } else if (length == 4) {
                sendBuffer = this.writeDWordPacket(200, address, value);
            } else {
                sendBuffer = this.writeCustomLengthPacket(200, address, value, length);
            }
        } else if (instruction == INST_READ) {
            this.addressToRead[address] = 0;
            sendBuffer = this.readPacket(200, address, length);
        } else if (instruction == INST_DXL_SYNCWRITE) { //function(ids, address, rLength, values)
            //this.isReadDataArrived = true;
            const ids = data[4];
            value = data[5];
            const tmpSendBuffer = this.dxlSyncWritePacket(ids, address, length, value);
            const tmp = [];
            for (let j = 0; j < tmpSendBuffer / 20; j++) {
                for (let i = j * 20; i < j * 20 + 20; i++) {
                    tmp.push(tmpSendBuffer[i]);
                }
                sendBuffer.push(tmp);
            }
            
            sendBuffer = this.dxlSyncWritePacket(ids, address, length, value);
        } else if (instruction == INST_DXL_REGWRITE) {
            const ids = data[4];

            sendBuffer = this.dxlRegWritePacket(ids[0], address, length, value);
        } else if (instruction == INST_DXL_ACTION) {
            sendBuffer = this.dxlActionWrite();
        } else if (instruction == INST_BYPASS_READ) {
            const id = value;
            this.addressToRead[address] = 0;
            sendBuffer = this.readPacket(id, address, length);
        } else if (instruction == INST_BYPASS_WRITE) {
            const id = value;
            this.addressToRead[address] = 0;
            if (length == 1) {
                sendBuffer = this.writeBytePacket(id, address, value2);
            } else if (length == 2) {
                sendBuffer = this.writeWordPacket(id, address, value2);
            } else {
                sendBuffer = this.writeDWordPacket(id, address, value2);
            }
        }
    
        console.log(`send buffer : ${sendBuffer}`);
        if (sendBuffer[0] == 0xFF &&
            sendBuffer[1] == 0xFF &&
            sendBuffer[2] == 0xFD &&
            sendBuffer[3] == 0x00 &&
            sendBuffer[4] == 0xC8 ||
            (sendBuffer[4] >= 100 && sendBuffer[4] <= 119) ||
            (sendBuffer[4] >= 1 && sendBuffer[4] <= 63)) {
            dataLength = this.makeWord(sendBuffer[5], sendBuffer[6]);

            if (sendBuffer[7] == INST_READ) {
                this.receiveAddress = address;
                this.receiveLength = length;
                this.defaultLength = data[2];
                this.isReadDataArrived = false;                
                if (this.varTimeout != null) {
                    clearTimeout(this.varTimeout);
                }

                this.varTimeout = setTimeout(() => {
                    this.isReadDataArrived = true;
                }, 100);
            }
        }
    }
    return sendBuffer;
};
Module.prototype.packetChecker = function(data) {
    if (data[0] == 0xFF && data[1] == 0xFF  && data[2] == 0xFD) {
        return true;
    } else {
        return false;
    }
};

Module.prototype.handleLocalData = function(data) { // data: Native Buffer
    let stuffLength = 0;
    console.log(`length: ${data.length}`);
    for (let i = 0; i < data.length; i++) {
        //this.receiveBuffer.push(data[i]);
        const dataIn = data[i];

        switch (this.packetReceiveState) {
            case PACKET_STATE_IDLE:
                if (this.headerCount >= 2) {
                    rxPacket.header[2] = dataIn;

                    if (rxPacket.header[0] == 0xFF &&
                        rxPacket.header[1] == 0xFF &&
                        rxPacket.header[2] == 0xFD) {
                        this.headerCount    = 0;
                        this.packetReceiveState = PACKET_STATE_RESERVED;
                    } else {
                        rxPacket.header[0] = rxPacket.header[1];
                        rxPacket.header[1] = rxPacket.header[2];
                        rxPacket.header[2] = 0;
                    }
                } else {
                    rxPacket.header[this.headerCount] = dataIn;
                    this.headerCount++;
                }
                break;

            case PACKET_STATE_RESERVED:
                if (dataIn == 0xFD) {
                    this.packetReceiveState = PACKET_STATE_IDLE;
                } else {
                    rxPacket.reserved       = dataIn;
                    this.packetReceiveState = PACKET_STATE_ID;
                }
                break;

            case PACKET_STATE_ID:
                rxPacket.id             = dataIn;
                this.packetReceiveState = PACKET_STATE_LENGTH_L;
                break;

            case PACKET_STATE_LENGTH_L:
                rxPacket.packetLength     = dataIn;
                this.packetReceiveState   = PACKET_STATE_LENGTH_H;
                break;

            case PACKET_STATE_LENGTH_H:
                rxPacket.packetLength    |= (dataIn << 8);
                if (rxPacket.packetLength < 1000) {
                    this.packetReceiveState = PACKET_STATE_DATA;
                } else {
                    this.packetReceiveState = PACKET_STATE_IDLE;
                }
                rxPacket.index            = 0;
                break;

            case PACKET_STATE_DATA:
                rxPacket.data[rxPacket.index] = dataIn;
                rxPacket.index++;

                if (rxPacket.index >= rxPacket.packetLength - 2) {
                    this.packetReceiveState = PACKET_STATE_CRC_L;
                }
                break;

            case PACKET_STATE_CRC_L:
                rxPacket.crcReceived = dataIn;
                this.packetReceiveState = PACKET_STATE_CRC_H;
                break;

            case PACKET_STATE_CRC_H:
                rxPacket.crcReceived    |= (dataIn << 8);

                stuffLength = this.removeStuffing(rxPacket.data, rxPacket.packetLength);
                rxPacket.packetLength -= stuffLength;

                rxPacket.cmd = rxPacket.data[0];
                rxPacket.error = rxPacket.data[1];

                if (rxPacket.cmd == DXL_INST_STATUS) {
                    console.log(`rx length: ${rxPacket.packetLength}`);
                    if (rxPacket.packetLength >= 147) {
                        let tempValue = 0;
                        for (let i = 0; i < addrMap.length; i++) {
                            switch (addrMap[i][1]) {
                                case 1:
                                    this.dataBuffer[addrMap[i][2]] = rxPacket.data[2 + addrMap[i][0]];
                                    break;

                                case 2:
                                    tempValue = rxPacket.data[2 + addrMap[i][0]] +
                                                (rxPacket.data[2 + addrMap[i][0] + 1] << 8);
                                    if (tempValue >= 32768) {
                                        tempValue = tempValue - 65536;
                                    }
                                    this.dataBuffer[addrMap[i][2]] = tempValue;
                                    break;

                                
                                case 4:
                                    this.dataBuffer[addrMap[i][2]] = rxPacket.data[2 + addrMap[i][0]] +
                                                                     (rxPacket.data[2 + addrMap[i][0] + 1] << 8) +
                                                                     (rxPacket.data[2 + addrMap[i][0] + 2] << 16) +
                                                                     (rxPacket.data[2 + addrMap[i][0] + 3] << 24);
                                    break;
                            }
                        }

                        // line category
                        this.dataBuffer[5201] = rxPacket.data[2 + 143];
                        
                        for (let i = 0; i < addrMap2.length; i++) {
                            switch (addrMap2[i][1]) {
                                case 1:
                                    this.dataBuffer[addrMap2[i][2]] = rxPacket.data[2 + addrMap2[i][0]];
                                    break;

                                case 2:
                                    tempValue = rxPacket.data[2 + addrMap2[i][0]] +
                                                (rxPacket.data[2 + addrMap2[i][0] + 1] << 8);
                                    if (tempValue >= 32768) {
                                        tempValue = tempValue - 65536;
                                    }
                                    this.dataBuffer[addrMap2[i][2]] = tempValue;
                                    break;

                                
                                case 4:
                                    this.dataBuffer[addrMap2[i][2]] = rxPacket.data[2 + addrMap2[i][0]] +
                                                                     (rxPacket.data[2 + addrMap2[i][0] + 1] << 8) +
                                                                     (rxPacket.data[2 + addrMap2[i][0] + 2] << 16) +
                                                                     (rxPacket.data[2 + addrMap2[i][0] + 3] << 24);
                                    break;
                            }
                        }
                    }
                }

                this.packetReceiveState = PACKET_STATE_IDLE;
                break;

                
            default:
            // code block
        }
    }

    /*
    if (this.receiveBuffer.length >= 11 + this.receiveLength) {
        this.isConnected = true;
        // console.log('<< 1 : ' + this.receiveLength + ' : ' + this.receiveBuffer);

        // while (this.receiveBuffer.length > 0) {
        while (this.receiveBuffer.length >= 11) {
            if (this.receiveBuffer.shift() == 0xFF) {
                if (this.receiveBuffer.shift() == 0xFF) {
                    if (this.receiveBuffer.shift() == 0xFD) {
                        if (this.receiveBuffer.shift() == 0x00) {
                            const id = this.receiveBuffer.shift();
                            if (id == 0xC8 ||
                                (id >= 100 && id <= 119) ||
                                (id >= 1 && id <= 63)) {
                                const packetLength = this.makeWord(this.receiveBuffer.shift(), 
                                    this.receiveBuffer.shift());
                                // if (packetLength > 4) {
                                // console.log("?? : " + this.receiveLength + ' / ' + (packetLength - 4));
                                if (this.receiveLength == (packetLength - 4)) {
                                    this.receiveBuffer.shift(); // take 0x55 - status check byte
                                    this.receiveBuffer.shift(); // take 0x00 - error check byte

                                    const valueLength = packetLength - 4;
                                    const returnValue = [];
                                    let tmpValue = 0;
                                    for (let index = 0; index < valueLength / this.defaultLength; index++) {
                                        if (this.defaultLength == 1) {
                                            tmpValue = this.receiveBuffer.shift();
                                            returnValue.push(tmpValue);
                                            // returnValue.push(this.receiveBuffer.shift());
                                        } else if (this.defaultLength == 2) {
                                            tmpValue = this.receiveBuffer.shift() | (this.receiveBuffer.shift() << 8);
                                            if (tmpValue > 60000) {
                                                tmpValue = tmpValue - 65536;
                                            }
                                            returnValue.push(tmpValue);
                                        } else if (this.defaultLength == 4) {
                                            tmpValue = this.receiveBuffer.shift() | 
                                            (this.receiveBuffer.shift() << 8) | 
                                            (this.receiveBuffer.shift() << 16) | 
                                            (this.receiveBuffer.shift() << 24);
                                            
                                            returnValue.push(tmpValue);
                                        }
                                    }

                                    if (this.receiveAddress != -1) {
                                        if (this.varTimeout != null) {
                                            clearTimeout(this.varTimeout);
                                        }

                                        for (let index = 0; index < returnValue.length; index++) {
                                            this.dataBuffer[this.receiveAddress + index * this.defaultLength] = 
                                            returnValue[index];
                                        }

                                        this.isReadDataArrived = true;
                                        //console.log('<- ' + 
                                        //new Date().getHours() + ':' + 
                                        //new Date().getMinutes() + ':' + 
                                        //new Date().getMilliseconds() + '\n' + 
                                        //this.receiveAddress + ' : ' + returnValue);
                                    } else {
                                        //console.log('<- ' + 
                                        //new Date().getHours() + ':' + 
                                        //new Date().getMinutes() + ':' + 
                                        //new Date().getMilliseconds() + '\n' + '-1');
                                    }

                                    this.receiveBuffer.shift(); // take crc check byte
                                    this.receiveBuffer.shift(); // take crc check byte

                                    // break because this packet has no error.
                                    break;
                                } else {
                                    for (let i = 0; i < packetLength; i++) {
                                        this.receiveBuffer.shift(); // take bytes of write status
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    */
};

Module.prototype.reset = function() {
    this.addressToRead = [];
    this.varTimeout = null;

    this.prevInstruction = 0;
    this.prevAddress = [];
    this.prevLength = [];
    this.prevValue = [];

    this.receiveBuffer = [];
    this.dataBuffer = [];
    this.robotisBuffer = [];
    this.receiveAddress = -1;
    this.receiveLength = -1;
    this.defaultLength = -1;

    this.servoPrevAddres = []; // add by kjs 20170731
    this.servoPrevLength = []; // add by kjs 20170627 
    this.servoPrevValue = [];  // add by kjs 20170627 
    this.servoPrevAddres2 = []; // add by kjs 20170627 
    this.servoPrevLength2 = []; // add by kjs 20170627 
    this.servoPrevValue2 = [];  // add by kjs 20170627 
    this.servoPrevAddres3 = []; // add by kjs 20170627 
    this.servoPrevLength3 = []; // add by kjs 20170627 
    this.servoPrevValue3 = [];  // add by kjs 20170627 
    this.servoPrevAddres4 = []; // add by kjs 20170627 
    this.servoPrevLength4 = []; // add by kjs 20170627 
    this.servoPrevValue4 = [];  // add by kjs 20170731
};

module.exports = new Module();

const DXL_INST_STATUS = 0x55;

const INST_NONE = 0;
const INST_READ = 2;
const INST_WRITE = 3;
const INST_DXL_SYNCWRITE = 4;
const INST_DXL_REGWRITE = 5;
const INST_DXL_ACTION = 6;
const INST_BYPASS_READ = 0xA2;
const INST_BYPASS_WRITE = 0xA3;

const PACKET_STATE_IDLE     = 0;
const PACKET_STATE_RESERVED = 1;
const PACKET_STATE_ID       = 2;
const PACKET_STATE_LENGTH_L = 3;
const PACKET_STATE_LENGTH_H = 4;
const PACKET_STATE_DATA     = 5;
const PACKET_STATE_CRC_L    = 6;
const PACKET_STATE_CRC_H    = 7;

const rxPacket = {
    header: [0, 0, 0],
    reserved: 0,
    id: 0,
    cmd: 0,
    error: 0,
    type: 0,
    index: 0,
    packetLength: 0,
    paramLength: 0,
    crc: 0,
    crcReceived: 0,
    checksum: 0,
    checksumReceived: 0,
    data: [],
};

const addrMap = [
    [0,4,302],
    [4,1,42],
    [5,1,44],
    [6,1,45],
    [7,1,47],
    [8,1,50],
    [9,1,51],
    [10,1,52],
    [11,1,68],
    [12,2,70],
    [14,2,72],
    [16,2,74],
    [18,2,76],
    [20,2,78],
    [22,2,80],
    [24,2,82],
    [26,2,84],
    [28,1,86],
    [29,1,87],
    [30,2,88],
    [32,2,90],
    [34,1,112],
    [35,1,118],
    [36,1,119],
    [37,1,122],
    [38,1,123],
    [39,1,124],
    [40,1,125],
    [41,1,160],
    [42,1,220],
    [43,2,360],
    [45,2,362],
    [47,2,364],
    [49,2,366],
    [51,2,368],
    [53,2,370],
    [55,1,372],
    [56,1,373],
    [57,1,374],
    [58,1,375],
    [59,1,376],
    [60,1,377],
    [61,1,378],
    [62,1,379],
    [63,1,380],
    [64,1,381],
    [65,1,382],
    [66,1,383],
    [67,1,500],
    [68,1,501],
    [69,8,502],
    [77,1,700],
    [78,1,810],
    [79,1,5015],
    [80,1,5030],
    [81,1,5031],
    [82,1,5040],
];


const addrMap2 = [
    [152,1,4000],
    [153,2,4003],
    [155,1,4005],
    [156,1,4006],
    [157,2,4009],
    [159,2,4011],
    [161,2,4013],
    [163,2,4015],
    [165,2,4017],
    [167,2,4019],
    [169,2,4021],
    [171,2,4023],
    [173,2,4025],
    [175,2,4027],
    [177,1,4031],
    [178,1,4032],
    [179,1,4033],
    [180,2,4036],
    [182,2,4038],
    [184,2,4040],
    [186,2,4042],
    [188,2,4044],
    [190,2,4046],
    [192,2,4048],
    [194,2,4050],
];

//const rxPacket = Object.assign({}, packet);

Module.prototype.writeBytePacket = function(id, address, value) {
    console.log('######### writeBytepacket');
    const packet = [];
    packet.push(0xff);
    packet.push(0xff);
    packet.push(0xfd);
    packet.push(0x00);
    packet.push(id);
    packet.push(0x06);
    packet.push(0x00);
    packet.push(INST_WRITE);
    packet.push(this.getLowByte(address));
    packet.push(this.getHighByte(address));
    packet.push(value);
    const crc = this.updateCRC(0, packet, packet.length);
    packet.push(this.getLowByte(crc));
    packet.push(this.getHighByte(crc));
    return packet;
};

Module.prototype.writeWordPacket = function(id, address, value) {
    console.log('######### writeWordPacket');
    const packet = [];
    packet.push(0xff);
    packet.push(0xff);
    packet.push(0xfd);
    packet.push(0x00);
    packet.push(id);
    packet.push(0x07);
    packet.push(0x00);
    packet.push(INST_WRITE);
    packet.push(this.getLowByte(address));
    packet.push(this.getHighByte(address));
    packet.push(this.getLowByte(value));
    packet.push(this.getHighByte(value));
    const crc = this.updateCRC(0, packet, packet.length);
    packet.push(this.getLowByte(crc));
    packet.push(this.getHighByte(crc));
    return packet;
};

Module.prototype.writeDWordPacket = function(id, address, value) {
    console.log('######### writeDWordPacket');
    const packet = [];
    packet.push(0xff);
    packet.push(0xff);
    packet.push(0xfd);
    packet.push(0x00);
    packet.push(id);
    packet.push(0x09);
    packet.push(0x00);
    packet.push(INST_WRITE);
    packet.push(this.getLowByte(address));
    packet.push(this.getHighByte(address));
    packet.push(this.getLowByte(this.getLowWord(value)));
    packet.push(this.getHighByte(this.getLowWord(value)));
    packet.push(this.getLowByte(this.getHighWord(value)));
    packet.push(this.getHighByte(this.getHighWord(value)));
    console.log(`packet : ${packet}`);
    const crc = this.updateCRC(0, packet, packet.length);
    packet.push(this.getLowByte(crc));
    packet.push(this.getHighByte(crc));
    return packet;
};

Module.prototype.writeCustomLengthPacket = function(id, address, buf, length) {
    //console.log("######### writeCustomLengthPacket");
    const packet = [];
    let i = 0;
    packet.push(0xff);
    packet.push(0xff);
    packet.push(0xfd);
    packet.push(0x00);
    packet.push(id);
    packet.push(length + 5);
    packet.push(0x00);
    packet.push(INST_WRITE);
    packet.push(this.getLowByte(address));
    packet.push(this.getHighByte(address));
    console.log(buf);
    for (i = 0; i < length; i++) {
        console.log(buf[i]);
        if (typeof(buf[i]) == 'number') {
            packet.push(buf[i]);
        } else if (typeof(buf[i]) == 'string') {
            packet.push(buf[i].charCodeAt(0));
        }
    }
    //console.log("packet : " + packet);
    const crc = this.updateCRC(0, packet, packet.length);
    packet.push(this.getLowByte(crc));
    packet.push(this.getHighByte(crc));
    return packet;
};

Module.prototype.dxlRegWritePacket = function(id, address, length, value) {
    const packet = [];
    const paramLength = length + 5;
    let tmp1 = 0;
    let tmp2 = 0;

    packet.push(0xff);
    packet.push(0xff);
    packet.push(0xfd);
    packet.push(0x00);
    
    packet.push(this.getLowByte(id));
    packet.push(this.getLowByte(paramLength));
    packet.push(this.getHighByte(paramLength));
    
    packet.push(0x04);

    packet.push(this.getLowByte(address));
    packet.push(this.getHighByte(address));
    
    switch (length) {
        case 1:
            packet.push(this.getLowByte(value));
            break;
        case 2:
            break;
        case 4:
            packet.push(this.getLowByte(this.getLowWord(value)));
            packet.push(this.getHighByte(this.getLowWord(value)));
            packet.push(this.getLowByte(this.getHighWord(value)));
            packet.push(this.getHighByte(this.getHighWord(value)));
            break;
        case 8:
            tmp1 = value / 4294967296;
            tmp2 = value % 4294967296;

            packet.push(this.getLowByte(this.getLowWord(tmp1)));
            packet.push(this.getHighByte(this.getLowWord(tmp1)));
            packet.push(this.getLowByte(this.getHighWord(tmp1)));
            packet.push(this.getHighByte(this.getHighWord(tmp1)));

            packet.push(this.getLowByte(this.getLowWord(tmp2)));
            packet.push(this.getHighByte(this.getLowWord(tmp2)));
            packet.push(this.getLowByte(this.getHighWord(tmp2)));
            packet.push(this.getHighByte(this.getHighWord(tmp2)));
            break;
    }

    const crc = this.updateCRC(0, packet, packet.length);
    packet.push(this.getLowByte(crc));
    packet.push(this.getHighByte(crc));
    return packet;
};

Module.prototype.dxlActionWrite = function() {
    const packet = [];
    packet.push(0xff);
    packet.push(0xff);
    packet.push(0xfd);
    packet.push(0x00);

    packet.push(0xfe);

    packet.push(0x03);
    packet.push(0x00);

    packet.push(0x05);

    const crc = this.updateCRC(0, packet, packet.length);
    packet.push(this.getLowByte(crc));
    packet.push(this.getHighByte(crc));
    return packet;
};

Module.prototype.dxlSyncWritePacket = function(ids, address, rLength, values) {
    const packet = [];
    const paramLength = 7 + ids.length * (rLength + 1);

    packet.push(0xff);
    packet.push(0xff);
    packet.push(0xfd);
    packet.push(0x00);
    packet.push(0xfe);

    packet.push(this.getLowByte(paramLength));
    packet.push(this.getHighByte(paramLength));

    packet.push(0x83);

    packet.push(this.getLowByte(address));
    packet.push(this.getHighByte(address));

    packet.push(this.getLowByte(rLength));
    packet.push(this.getHighByte(rLength));

    for (let i = 0; i < ids.length; i++) {
        packet.push(this.getLowByte(ids[i]));
        switch (rLength) {
            case 1:
                packet.push(this.getLowByte(values[i]));
                break;
            case 2:
                break;
            case 4:
                packet.push(this.getLowByte(this.getLowWord(values[i])));
                packet.push(this.getHighByte(this.getLowWord(values[i])));
                packet.push(this.getLowByte(this.getHighWord(values[i])));
                packet.push(this.getHighByte(this.getHighWord(values[i])));
                break;
        }
    }

    const crc = this.updateCRC(0, packet, packet.length);
    packet.push(this.getLowByte(crc));
    packet.push(this.getHighByte(crc));
    return packet;
};

Module.prototype.prevServoCompare = function(address, value, length) {
    if ((address >= 108 && address <= 111) && value == 7) { //Module
        if (this.prevInstruction == INST_WRITE &&
            this.servoPrevAddres == address &&
            this.servoPrevLength == length &&
            this.servoPrevValue == value) {
            //doSend = false;
            return true;
        }
    }

    if (address >= 128 && address <= 131) { //Mode
        if (this.prevInstruction == INST_WRITE &&
            this.servoPrevAddres2 == address &&
            this.servoPrevLength2 == length &&
            this.servoPrevValue2 == value) {
            //doSend = false;
            return true;
        }
    }

    if (address >= 140 && address <= 146) { //Speed
        if (this.prevInstruction == INST_WRITE &&
            this.servoPrevAddres3 == address &&
            this.servoPrevLength3 == length &&
            this.servoPrevValue3 == value) {
            //doSend = false;
            return true;
        }
    }

    if (address >= 156 && address <= 162) { //Position
        if (this.prevInstruction4 == INST_WRITE &&
            this.servoPrevAddres4 == address &&
            this.servoPrevLength4 == length &&
            this.servoPrevValue4 == value) {
            //doSend = false;
            return true;
        }
    }
};

Module.prototype.prevServoSet = function(address, value, length) {
    if ((address >= 108 && address <= 111) && value == 7) { //Module
        this.servoPrevAddres = address;
        this.servoPrevLength = length;
        this.servoPrevValue = value;
    }

    if (address >= 128 && address <= 131) { //Mode
        this.servoPrevAddres2 = address;
        this.servoPrevLength2 = length;
        this.servoPrevValue2 = value;
    }

    if (address >= 140 && address <= 146) { //Speed
        this.servoPrevAddres3 = address;
        this.servoPrevLength3 = length;
        this.servoPrevValue3 = value;
    }

    if (address >= 156 && address <= 162) { //Position
        this.servoPrevAddres4 = address;
        this.servoPrevLength4 = length;
        this.servoPrevValue4 = value;
    }
};

Module.prototype.readPacket = function(id, address, lengthToRead) {
    //console.log("######### readPacket");
    const packet = [];
    packet.push(0xff);
    packet.push(0xff);
    packet.push(0xfd);
    packet.push(0x00);
    packet.push(id);
    packet.push(0x07);
    packet.push(0x00);
    packet.push(INST_READ);
    packet.push(this.getLowByte(address));
    packet.push(this.getHighByte(address));
    packet.push(this.getLowByte(lengthToRead));
    packet.push(this.getHighByte(lengthToRead));
    const crc = this.updateCRC(0, packet, packet.length);
    packet.push(this.getLowByte(crc));
    packet.push(this.getHighByte(crc));
    return packet;
};

const crcTable = [0x0000,
    0x8005, 0x800F, 0x000A, 0x801B, 0x001E, 0x0014, 0x8011,
    0x8033, 0x0036, 0x003C, 0x8039, 0x0028, 0x802D, 0x8027,
    0x0022, 0x8063, 0x0066, 0x006C, 0x8069, 0x0078, 0x807D,
    0x8077, 0x0072, 0x0050, 0x8055, 0x805F, 0x005A, 0x804B,
    0x004E, 0x0044, 0x8041, 0x80C3, 0x00C6, 0x00CC, 0x80C9,
    0x00D8, 0x80DD, 0x80D7, 0x00D2, 0x00F0, 0x80F5, 0x80FF,
    0x00FA, 0x80EB, 0x00EE, 0x00E4, 0x80E1, 0x00A0, 0x80A5,
    0x80AF, 0x00AA, 0x80BB, 0x00BE, 0x00B4, 0x80B1, 0x8093,
    0x0096, 0x009C, 0x8099, 0x0088, 0x808D, 0x8087, 0x0082,
    0x8183, 0x0186, 0x018C, 0x8189, 0x0198, 0x819D, 0x8197,
    0x0192, 0x01B0, 0x81B5, 0x81BF, 0x01BA, 0x81AB, 0x01AE,
    0x01A4, 0x81A1, 0x01E0, 0x81E5, 0x81EF, 0x01EA, 0x81FB,
    0x01FE, 0x01F4, 0x81F1, 0x81D3, 0x01D6, 0x01DC, 0x81D9,
    0x01C8, 0x81CD, 0x81C7, 0x01C2, 0x0140, 0x8145, 0x814F,
    0x014A, 0x815B, 0x015E, 0x0154, 0x8151, 0x8173, 0x0176,
    0x017C, 0x8179, 0x0168, 0x816D, 0x8167, 0x0162, 0x8123,
    0x0126, 0x012C, 0x8129, 0x0138, 0x813D, 0x8137, 0x0132,
    0x0110, 0x8115, 0x811F, 0x011A, 0x810B, 0x010E, 0x0104,
    0x8101, 0x8303, 0x0306, 0x030C, 0x8309, 0x0318, 0x831D,
    0x8317, 0x0312, 0x0330, 0x8335, 0x833F, 0x033A, 0x832B,
    0x032E, 0x0324, 0x8321, 0x0360, 0x8365, 0x836F, 0x036A,
    0x837B, 0x037E, 0x0374, 0x8371, 0x8353, 0x0356, 0x035C,
    0x8359, 0x0348, 0x834D, 0x8347, 0x0342, 0x03C0, 0x83C5,
    0x83CF, 0x03CA, 0x83DB, 0x03DE, 0x03D4, 0x83D1, 0x83F3,
    0x03F6, 0x03FC, 0x83F9, 0x03E8, 0x83ED, 0x83E7, 0x03E2,
    0x83A3, 0x03A6, 0x03AC, 0x83A9, 0x03B8, 0x83BD, 0x83B7,
    0x03B2, 0x0390, 0x8395, 0x839F, 0x039A, 0x838B, 0x038E,
    0x0384, 0x8381, 0x0280, 0x8285, 0x828F, 0x028A, 0x829B,
    0x029E, 0x0294, 0x8291, 0x82B3, 0x02B6, 0x02BC, 0x82B9,
    0x02A8, 0x82AD, 0x82A7, 0x02A2, 0x82E3, 0x02E6, 0x02EC,
    0x82E9, 0x02F8, 0x82FD, 0x82F7, 0x02F2, 0x02D0, 0x82D5,
    0x82DF, 0x02DA, 0x82CB, 0x02CE, 0x02C4, 0x82C1, 0x8243,
    0x0246, 0x024C, 0x8249, 0x0258, 0x825D, 0x8257, 0x0252,
    0x0270, 0x8275, 0x827F, 0x027A, 0x826B, 0x026E, 0x0264,
    0x8261, 0x0220, 0x8225, 0x822F, 0x022A, 0x823B, 0x023E,
    0x0234, 0x8231, 0x8213, 0x0216, 0x021C, 0x8219, 0x0208,
    0x820D, 0x8207, 0x0202,
];

Module.prototype.makeWord = function(a, b) {
    return ((a & 0xff) | ((b & 0xff) << 8));
};

Module.prototype.getLowByte = function(a) {
    return (a & 0xff);
};

Module.prototype.getHighByte = function(a) {
    return ((a >> 8) & 0xff);
};

Module.prototype.getLowWord = function(a) {
    return (a & 0xffff);
};

Module.prototype.getHighWord = function(a) {
    return ((a >> 16) & 0xffff);
};

Module.prototype.updateCRC = function(crcAccum, dataBlkPtr, dataBlkSize) {
    let i = 0;
    let j = 0;
    let crc = crcAccum;

    for (j = 0; j < dataBlkSize; j++) {
        i = ((crc >> 8) ^ dataBlkPtr[j]) & 0xff;
        crc = (crc << 8) ^ crcTable[i];
    }

    return crc;
};

Module.prototype.removeStuffing = function(buffer, length) {
    let i = 0;
    let stuffLength = 0;
    let index = 0;

    for (i = 0; i < length; i++) {
        if (i >= 2) {
            if (buffer[i - 2] == 0xFF &&
                buffer[i - 1] == 0xFF &&
                buffer[i] == 0xFD) {
                i++;
                stuffLength++;
            }
        }
        buffer[index++] = buffer[i];
    }

    return stuffLength;
};
