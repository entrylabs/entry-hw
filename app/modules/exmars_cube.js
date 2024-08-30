const BaseModule = require('./baseModule');
const { Index } = require('./magkinder');

class ExMarsCube extends BaseModule {
    // 클래스 내부에서 사용될 필드들을 이곳에서 선언합니다.
    constructor() {
        super();
        this.sp = null;
        this.packetType = 11;
        this.cubeData = new Array(17);
        this.faceCell = new Array(6);
        this.faceDir = new Array(6);
        this.record = new Array(8);
        this.currentMode = new Array(2);
        this.received = new Buffer(21);
        this.transmit = new Buffer(11);
        this.doubleTransmit = new Buffer(22);
        this.firstRun = false;
        this.packetIntegrity = false;
        this.entryMessage = 0;
        this.checkCount = 0;
        this.blockIndex = 2;
        this.getRecord = 0;
        this.recordIndex = 0;
        this.protocols = {
            header: 0,
            footer: 90,
            dongle: {
                firstCheck: 253,
                secondCheck: 254,
                thridCheck: 254,
            },
            index: {
                menu: 0,
                face: 7,
                faceDirection: 7,
                recordRequest: 8,
                recordResponse: 9,
                centerColor: 9,
                cellColor: 11,
                posDirTor: 12,
                sensingRequest: 28,
                sensingResponse: 28,
            },
            action: {
                faceMove: 1,
                faceResetAll: 2,
                faceMoveWithMotor: 3,
            },
            rotation: {
                zero: 0,
                thirty: 1,
                sixty: 2,
                ninety: 3,
                aHundredTwenty: 4,
                aHundredFifty: 5,
                aHundredEighty: 6,
            },
            faceColor: {
                white: 0,
                yellow: 1,
                green: 2,
                blue: 3,
                red: 4,
                purple: 5,
                all: 7,
            },
            cellColor: {
                off: 0,
                red: 1,
                green: 2,
                blue: 3,
                yellow: 4,
                purple: 6,
                white: 7,
                skip: 8,
            },
            direction: {
                break: 0,
                cw: 1,
                ccw: 2,
                passive: 3,
            },
            length: {
                transmitUSB: 11,
                transmitByte: 7,
                received: 7,
            },
            mode: {
                main: 0,
                sub: 1,
            },
        };
    }

    //최초에 커넥션이 이루어진 후의 초기 설정.
    //handler 는 워크스페이스와 통신하 데이터를 json 화 하는 오브젝트입니다. (datahandler/json 참고)
    //config 은 module.json 오브젝트입니다.
    init(handler, config) {
        for (let i = 0; i < 6; i++) {
            this.faceCell[i] = new Array(9);
            this.cubeData[i] = new Array(9);
        }
        this.cubeData[6] = new Array(6);
        for (let i = 7; i < 15; i++) {
            this.cubeData[i] = new Array(6);
        }

        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 9; j++) {
                this.faceCell[i][j] = 0;
                this.cubeData[i][j] = this.translationCellColorToString(i, j);
            }
        }
        for (let i = 0; i < 6; i++) {
            this.faceDir[i] = 0;
            this.cubeData[6][i] = 0;
        }
        for (let i = 0; i < 8; i++) {            
            this.record[i] = new Array(6);
            for (let j = 0; j < 6; j++) {
                this.record[i][j] = 0;
                this.cubeData[i + 7][j] = 0;
            }
        }
        for (let i = 0; i < 2; i++) {
            this.cubeData[i + 16] = 0;
        }

        this.faceCell[0][8] = this.protocols.cellColor.white;
        this.faceCell[1][8] = this.protocols.cellColor.yellow;
        this.faceCell[2][8] = this.protocols.cellColor.green;
        this.faceCell[3][8] = this.protocols.cellColor.blue;
        this.faceCell[4][8] = this.protocols.cellColor.red;
        this.faceCell[5][8] = this.protocols.cellColor.purple;
    }

    setSerialPort(sp) {
        this.sp = sp;
    }

    //연결 후 초기에 송신할 데이터가 필요한 경우 사용합니다.
    //requestInitialData 를 사용한 경우 checkInitialData 가 필수입니다.
    //이 두 함수가 정의되어있어야 로직이 동작합니다. 필요없으면 작성하지 않아도 됩니다.
    requestInitialData() {
        return this.makePacketSensingRequest(this.protocols.faceColor.yellow);
    }

    // 연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
    checkInitialData(data, config) {
        let result = false;

        if (data[0] == this.protocols.header && data[6] == this.protocols.footer) {
            result = true;
        } else {
            result = false;
        }
        return result;
    }

    // 주기적으로 하드웨어에서 받은 데이터의 검증이 필요한 경우 사용합니다.
    validateLocalData(data) {
        let count = 0;
        this.packetIntegrity = false;

        if (data.length >= 21) {
            while (true) {
                if (data[count] == this.protocols.header && data[count + 20] == this.protocols.footer) {
                    for (let i = 0; i < 21; i++) {
                        this.received[i] = data[i];
                    }
                    count += 20;
                    if (data.length - count < 21) {
                        this.packetIntegrity = true;
                        break;
                    }
                }
                count++;
            }
        } else if (data.length >= 7) {
            while (true) {
                if (data[count] == this.protocols.header && data[count + 6] == this.protocols.footer) {
                    for (let i = 0; i < 7; i++) {
                        this.received[i] = data[i];
                    }
                    count += 6;
                    if (data.length - count < 7) {
                        this.packetIntegrity = true;
                        break;
                    }
                }
                count++;
            }
        }
        
        return this.packetIntegrity;
    }

    // 하드웨어에서 온 데이터 처리
    handleLocalData(data) {
        if (this.packetIntegrity == true) {
            this.decodingPacket(this.received);
        }
    }

    // 엔트리로 전달할 데이터
    requestRemoteData(handler) {
        for (let i = 0; i < 6; i++) {
            for (let j = 0; j < 9; j++) {
                this.cubeData[i][j] = this.translationCellColorToString(i, j);
            }
            this.cubeData[6][i] = String(this.faceDir[i]);
        }
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 6; j++) {
                this.cubeData[i + 7][j] = String(this.record[i][j]);
            }            
        }
        for (let i = 0; i < 2; i++) {
            this.cubeData[i + 16] = String(this.currentMode[i]);
        }
        for (const face in this.cubeData) {
            handler.write(face, this.cubeData[face]);
        }
    }

    // 엔트리에서 받은 데이터에 대한 처리
    handleRemoteData(handler) {
        if (this.entryMessage == 0) {
            const received = handler.read('SetBlock');
            if (this.blockIndex != received.index) {
                if (received.name == 'MenuInit') {
                    this.transmit = this.makePacketMenuSetting(10, 10);
                    this.blockIndex = received.index;
                    this.entryMessage = 1;
                } else if (received.name == 'NonBrake') {
                    const brake = Number(received.data0);
                    if (brake == 0) {
                        this.transmit = this.makePacketMenuSetting(13, 4);
                    } else {
                        this.transmit = this.makePacketMenuSetting(9, 3);
                    }
                    this.blockIndex = received.index;
                    this.entryMessage = 1;
                } else if (received.name == 'ModeSetting') {
                    const main = Number(received.data0);
                    const sub = Number(received.data1);
                    this.transmit = this.makePacketMenuSetting(main, sub);
                    this.blockIndex = received.index;
                    this.entryMessage = 1;
                } else if (received.name == 'CenterColorChange') {
                    const face = Number(received.data0);
                    const cell = Number(received.data1);
                    this.transmit = this.makePacketSetCenterColor(face, cell);
                    this.blockIndex = received.index;
                    this.entryMessage = 1;
                } else if (received.name == 'CellColorChange') {
                    const face = Number(received.data0);
                    const cell1 = Number(received.data1);
                    const cell2 = Number(received.data2);
                    const cell3 = Number(received.data3);
                    const cell4 = Number(received.data4);
                    const cell5 = Number(received.data5);
                    const cell6 = Number(received.data6);
                    const cell7 = Number(received.data7);
                    const cell8 = Number(received.data8);
                    this.transmit = this.makePacketSetCellColor(face, cell1, cell2, cell3,
                                                                cell4, cell5, cell6, cell7, cell8);
                    this.blockIndex = received.index;
                    this.entryMessage = 1;
                } else if (received.name == 'PosDirTorChange') {
                    const face = Number(received.data0);
                    const position = Number(received.data1);
                    const direction = Number(received.data2);
                    const torque = Number(received.data3);
                    this.transmit = this.makePacketSetPosDirTor(face, position, direction, torque);                    
                    this.blockIndex = received.index;
                    this.entryMessage = 1;
                } else if (received.name == 'FaceRotationOnlyColor') {
                    const face = Number(received.data0);
                    const direction = Number(received.data1);
                    let angle = Number(received.data2);
                    if (direction == 2) {
                        angle += 8;
                    }
                    this.transmit = this.makePacketMoveFace(face, angle);
                    this.blockIndex = received.index;
                    this.entryMessage = 1;
                } else if (received.name == 'FaceRotation') {                    
                    const face = Number(received.data0);
                    const direction = Number(received.data1);
                    let angle = Number(received.data2);
                    if (direction == 2) {
                        angle += 8;
                    }
                    this.transmit = this.makePacketFaceMoveWithMotor(face, angle);
                    this.blockIndex = received.index;
                    this.entryMessage = 1;
                } else if (received.name == 'FacesRotation') {
                    const face1 = Number(received.data0);
                    const direction1 = Number(received.data1);
                    let angle1 = Number(received.data2);
                    const face2 = Number(received.data3);
                    const direction2 = Number(received.data4);
                    let angle2 = Number(received.data5);
                    if (direction1 == 2) {
                        angle1 += 8;
                    }
                    if (direction2 == 2) {
                        angle2 += 8;
                    }
                    this.transmit = this.makePacketFacesMoveWithMotor(face1, angle1, face2, angle2);
                    this.blockIndex = received.index;
                    this.entryMessage = 1;
                } else if (received.name == 'SolveCube') {
                    const color = Number(received.data0);
                    const movingFace = Number(received.data1);
                    let face = this.protocols.faceColor.yellow;
                    let angle = this.protocols.rotation.ninety;
                    if (movingFace % 2 == 1) {
                        angle += 8;
                    }
                    if (color == 2) {
                        switch (movingFace) {
                            case 0: case 1: face = this.protocols.faceColor.green; break;
                            case 2: case 3: face = this.protocols.faceColor.purple; break;
                            case 4: case 5: face = this.protocols.faceColor.red; break;
                            case 6: case 7: face = this.protocols.faceColor.yellow; break;
                            case 8: case 9: face = this.protocols.faceColor.white; break;
                            case 10: case 11: face = this.protocols.faceColor.blue; break;
                        }
                    } else if (color == 5) {
                        switch (movingFace) {
                            case 0: case 1: face = this.protocols.faceColor.purple; break;
                            case 2: case 3: face = this.protocols.faceColor.blue; break;
                            case 4: case 5: face = this.protocols.faceColor.green; break;
                            case 6: case 7: face = this.protocols.faceColor.yellow; break;
                            case 8: case 9: face = this.protocols.faceColor.white; break;
                            case 10: case 11: face = this.protocols.faceColor.red; break;
                        }
                    } else if (color == 3) {
                        switch (movingFace) {
                            case 0: case 1: face = this.protocols.faceColor.blue; break;
                            case 2: case 3: face = this.protocols.faceColor.red; break;
                            case 4: case 5: face = this.protocols.faceColor.purple; break;
                            case 6: case 7: face = this.protocols.faceColor.yellow; break;
                            case 8: case 9: face = this.protocols.faceColor.white; break;
                            case 10: case 11: face = this.protocols.faceColor.green; break;
                        }
                    } else if (color == 4) {
                        switch (movingFace) {
                            case 0: case 1: face = this.protocols.faceColor.red; break;
                            case 2: case 3: face = this.protocols.faceColor.green; break;
                            case 4: case 5: face = this.protocols.faceColor.blue; break;
                            case 6: case 7: face = this.protocols.faceColor.yellow; break;
                            case 8: case 9: face = this.protocols.faceColor.white; break;
                            case 10: case 11: face = this.protocols.faceColor.purple; break;
                        }
                    }
                    this.transmit = this.makePacketFaceMoveWithMotor(face, angle);
                    this.blockIndex = received.index;
                    this.entryMessage = 1;
                } else if (received.name == 'ResetAllFace') {
                    this.transmit = this.makePacketResetAllFace();
                    this.blockIndex = received.index;
                    this.entryMessage = 1;
                } else if (received.name == 'PlayMode') {
                    const mode = Number(received.data0);                     
                    this.transmit = this.makePacket(0, 30, 3, mode, 255);
                    this.blockIndex = received.index;
                    this.entryMessage = 1;
                } else if (received.name == 'UserMode') {
                    const mode = Number(received.data0);                    
                    this.transmit = this.makePacket(0, 30, 1, mode, 255);
                    this.blockIndex = received.index;
                    this.entryMessage = 1;
                } else if (received.name == 'PlayNote') {
                    const note = Number(received.data0); 
                    let face = this.protocols.faceColor.white;
                    let angle = 3;
                    if (note != 12) {
                        if (note % 2 == 1) {
                            angle += 8;
                        }
                        switch (note) {
                            case 0: case 1: face = this.protocols.faceColor.white; break;
                            case 2: case 3: face = this.protocols.faceColor.yellow; break;
                            case 4: case 5: face = this.protocols.faceColor.green; break;
                            case 6: case 7: face = this.protocols.faceColor.blue; break;
                            case 8: case 9: face = this.protocols.faceColor.red; break;
                            case 10: case 11: face = this.protocols.faceColor.purple; break;
                        }                    
                        this.transmit = this.makePacketFaceMoveWithMotor(face, angle);
                        this.blockIndex = received.index;
                        this.entryMessage = 1;
                    }
                } else if (received.name == 'GetRecord') {
                    //if(this.getRecord != this.blockIndex) {
                    this.recordIndex =  Number(received.data0);
                    this.transmit = this.makePacketRecord(this.recordIndex);
                    this.blockIndex = received.index;
                    //this.getRecord = received.index;
                    this.entryMessage = 1;
                    //}
                }
            }
        }
    }

    // 하드웨어로 보낼 데이터 로직
    //slave 모드인 경우 duration 속성 간격으로 지속적으로 기기에 요청을 보냄
    requestLocalData() {
        let buffer;

        if (this.entryMessage == 1) {
            if (this.checkCount > 0) {
                buffer = this.transmit;
                this.entryMessage = 0;
                this.checkCount = 0;
            }
        } else {
            if (this.checkCount % 5 == 0) {
                buffer = this.makePacketSensingRequest(this.protocols.faceColor.all);
            }
        }
        if (this.checkCount % 12 == 0) {
            for (let i = 0; i < 6; i++) {
                this.faceDir[i] = 0;
            }
        }

        this.checkCount++;
        if (this.checkCount >= 2000) {
            this.checkCount = 0;
        }

        return buffer;
    }

    connect() {

    }

    // 하드웨어 연결 해제 시 호출
    disconnect(connect) {
        const self = this;

        connect.close();
        if(self.sp) {
            delete self.sp;
        }
    }

    // 엔트리와의 연결 종료 후 처리 코드
    reset() {

    }

    makePacket(index, parameter1, parameter2, parameter3, parameter4) {
        const buffer = new Buffer(this.packetType);
        
        if (this.packetType == this.protocols.length.transmitUSB) {
            buffer[0] = this.protocols.header;
            buffer[1] = index;
            buffer[2] = parameter1;
            buffer[3] = parameter2;
            buffer[4] = parameter3;
            buffer[5] = parameter4;
            buffer[6] = this.protocols.footer;
            buffer[7] = this.protocols.length.received;
            buffer[8] = this.protocols.dongle.firstCheck;
            buffer[9] = this.protocols.dongle.secondCheck;
            buffer[10] = this.protocols.dongle.thridCheck;
        } else {            
            buffer[0] = this.protocols.header;
            buffer[1] = index;
            buffer[2] = parameter1;
            buffer[3] = parameter2;
            buffer[4] = parameter3;
            buffer[5] = parameter4;
            buffer[6] = this.protocols.footer;
        }

        return buffer;
    }

    makePacketMenuSetting(main, sub) {
        return this.makePacket(this.protocols.index.menu, 11, main, sub, 255);
    }

    makePacketSetCenterColor(face, color) {
        const index = ((face << 5) | this.protocols.index.centerColor);

        return this.makePacket(index, color, 0, 0, 0);
    }

    makePacketSetCellColor(face, color1, color2, color3, color4, color5, color6, color7, color8) {
        const index = ((face << 5) | this.protocols.index.cellColor);
        const para1 = (color1 << 4) | color2;
        const para2 = (color3 << 4) | color4;
        const para3 = (color5 << 4) | color6;
        const para4 = (color7 << 4) | color8;
        
        return this.makePacket(index, para1, para2, para3, para4);
    }

    makePacketSetPosDirTor(face, position, direction, torque) {
        const index = ((face << 5) | this.protocols.index.posDirTor);
        let pos = 0;

        if (position < 2) {
            pos = 2;
        } else if (position > 141) {
            pos = 141;
        } else {
            pos = position;
        }

        return this.makePacket(index, pos, direction, torque, 0);
    }

    makePacketMoveFace(face, rotation) {
        let para = 0;
        let buffer = new Buffer(this.packetType);

        if (0 <= rotation && rotation <= 15) {
            if (face == this.protocols.faceColor.white ||
                face == this.protocols.faceColor.green ||
                face == this.protocols.faceColor.red) {
                para = (rotation << 4) & 240;
            } else if (face == this.protocols.faceColor.yellow ||
                     face == this.protocols.faceColor.blue ||
                     face == this.protocols.faceColor.purple) {
                para = rotation & 15;
            }
        }

        if (face == this.protocols.faceColor.white || face == this.protocols.faceColor.yellow) {
            buffer = this.makePacket(this.protocols.index.face, this.protocols.action.faceMove, para, 0, 0);
        } else if (face == this.protocols.faceColor.green || face == this.protocols.faceColor.blue) {
            buffer = this.makePacket(this.protocols.index.face, this.protocols.action.faceMove, 0, para, 0);
        } else if (face == this.protocols.faceColor.red || face == this.protocols.faceColor.purple) {
            buffer = this.makePacket(this.protocols.index.face, this.protocols.action.faceMove, 0, 0, para);
        }

        return buffer;
    }

    makePacketResetAllFace() {
        return this.makePacket(this.protocols.index.face, this.protocols.action.faceResetAll, 0, 0, 0);
    }

    makePacketFaceMoveWithMotor(face, rotation) {
        let para = 0;
        let buffer = new Buffer(this.packetType);

        if (0 <= rotation && rotation <= 15) {
            if (face == this.protocols.faceColor.white ||
                face == this.protocols.faceColor.green ||
                face == this.protocols.faceColor.red) {
                para = (rotation << 4) & 240;
            } else if (face == this.protocols.faceColor.yellow ||
                     face == this.protocols.faceColor.blue ||
                     face == this.protocols.faceColor.purple) {
                para = rotation & 15;
            }
        }

        if (face == this.protocols.faceColor.white || face == this.protocols.faceColor.yellow) {
            buffer = this.makePacket(this.protocols.index.face, this.protocols.action.faceMoveWithMotor, para, 0, 0);
        } else if (face == this.protocols.faceColor.green || face == this.protocols.faceColor.blue) {
            buffer = this.makePacket(this.protocols.index.face, this.protocols.action.faceMoveWithMotor, 0, para, 0);
        } else if (face == this.protocols.faceColor.red || face == this.protocols.faceColor.purple) {
            buffer = this.makePacket(this.protocols.index.face, this.protocols.action.faceMoveWithMotor, 0, 0, para);
        }

        return buffer;
    }
    
    makePacketFacesMoveWithMotor(face1, rotation1, face2, rotation2) {
        let para2 = 0;
        let para3 = 0;
        let para4 = 0;
        
        switch (face1) {
            case this.protocols.faceColor.white: para2 |= (rotation1 << 4) & 240; break;
            case this.protocols.faceColor.yellow: para2 |= rotation1 & 15; break;
            case this.protocols.faceColor.green: para3 |= (rotation1 << 4) & 240; break;
            case this.protocols.faceColor.blue: para3 |= rotation1 & 15; break;
            case this.protocols.faceColor.red: para4 |= (rotation1 << 4) & 240; break;
            case this.protocols.faceColor.purple: para4 |= rotation1 & 15; break;
        }        
        switch (face2) {
            case this.protocols.faceColor.white: para2 |= (rotation2 << 4) & 240; break;
            case this.protocols.faceColor.yellow: para2 |= rotation2 & 15; break;
            case this.protocols.faceColor.green: para3 |= (rotation2 << 4) & 240; break;
            case this.protocols.faceColor.blue: para3 |= rotation2 & 15; break;
            case this.protocols.faceColor.red: para4 |= (rotation2 << 4) & 240; break;
            case this.protocols.faceColor.purple: para4 |= rotation2 & 15; break;
        }

        return this.makePacket(this.protocols.index.face, this.protocols.action.faceMoveWithMotor, para2, para3, para4);
    }

    makePacketRecord(recordIndex) {
        const index = ((7 << 5) | this.protocols.index.recordRequest);
        
        return this.makePacket(index, recordIndex, 255, 255, 255);
    }

    makePacketSensingRequest(face) {
        const index = ((face << 5) | this.protocols.index.sensingRequest);

        return this.makePacket(index, 255, 255, 255, 255);
    }

    translationCellColorToString(face, cell) {
        let value = '';

        switch (this.faceCell[face][cell]) {
            case this.protocols.cellColor.off: value = 'O'; break;
            case this.protocols.cellColor.red: value = 'R'; break;
            case this.protocols.cellColor.green: value = 'G'; break;
            case this.protocols.cellColor.blue: value = 'B'; break;
            case this.protocols.cellColor.yellow: value = 'Y'; break;
            case this.protocols.cellColor.purple: value = 'P'; break;
            case this.protocols.cellColor.white: value = 'W'; break;
            case this.protocols.cellColor.skip: value = 'S'; break;
        }

        return value;
    }

    translationFaceNameToInt(faceName) {
        let translation = 0;

        if (faceName == 'W') {
            translation = this.protocols.faceColor.white;
        } else if (faceName == 'Y') {
            translation = this.protocols.faceColor.yellow;
        } else if (faceName == 'G') {
            translation = this.protocols.faceColor.green;
        } else if (faceName == 'B') {
            translation = this.protocols.faceColor.blue;
        } else if (faceName == 'R') {
            translation = this.protocols.faceColor.red;
        } else if (faceName == 'P') {
            translation = this.protocols.faceColor.purple;
        }

        return translation;
    }

    translationColorNameToInt(colorName) {        
        let translation = 0;

        if (colorName == 'Off') {
            translation = this.protocols.cellColor.off;
        } else if (colorName == 'Red') {
            translation = this.protocols.cellColor.red;
        } else if (colorName == 'Green') {
            translation = this.protocols.cellColor.green;
        } else if (colorName == 'Blue') {
            translation = this.protocols.cellColor.blue;
        } else if (colorName == 'Yellow') {
            translation = this.protocols.cellColor.yellow;
        } else if (colorName == 'Purple') {
            translation = this.protocols.cellColor.purple;
        } else if (colorName == 'White') {
            translation = this.protocols.cellColor.white;
        } else if (colorName == 'Skip') {
            translation = this.protocols.cellColor.skip;
        }

        return translation;
    }

    translationRotationToProtocols(rotation) {
        let translation = 0;

        if (rotation == '0') {
            translation = this.protocols.rotation.zero;
        } else if (rotation == '30') {
            translation = this.protocols.rotation.thirty;
        } else if (rotation == '60') {
            translation = this.protocols.rotation.sixty;
        } else if (rotation == '90') {
            translation = this.protocols.rotation.ninety;
        } else if (rotation == '120') {
            translation = this.protocols.rotation.aHundredTwenty;
        } else if (rotation == '150') {
            translation = this.protocols.rotation.aHundredFifty;
        } else if (rotation == '180') {
            translation = this.protocols.rotation.aHundredEighty;
        }

        return translation;
    }

    translationDirectionToProtocols(direction) {
        let translation = 0;

        if (direction == 'Break') {
            translation = this.protocols.direction.break;
        } else if (direction == 'CW') {
            translation = this.protocols.direction.cw;
        } else if (direction == 'CCW') {
            translation = this.protocols.direction.ccw;
        } else if (direction == 'Passive') {
            translation = this.protocols.direction.passive;
        }

        return translation;
    }

    decodingPacket(packet) {
        let face;
        var index = packet[1] & 31;

        if (index == this.protocols.index.menu)
        {
            this.currentMode[0] = packet[3];
            this.currentMode[1] = packet[4];
        }
        else if (index == this.protocols.index.sensingResponse) {
            face = (packet[1] >> 5) & 15;

            if (0 <= face && face <= 5) {
                if (face == this.protocols.faceColor.white) {
                    this.faceCell[face][0] == (packet[3] >> 4) & 15;
                    this.faceCell[face][1] == packet[3] & 15;
                    this.faceCell[face][2] == (packet[4] >> 4) & 15;
                    this.faceCell[face][3] = packet[4] & 15;
                    this.faceCell[face][4] = (packet[5] >> 4) & 15;
                    this.faceCell[face][5] = packet[5] & 15;
                    this.faceCell[face][6] = (packet[2] >> 4) & 15;
                    this.faceCell[face][7] = packet[2] & 15;
                } else if (face == this.protocols.faceColor.yellow) {
                    this.faceCell[face][0] = (packet[2] >> 4) & 15;
                    this.faceCell[face][1] = packet[2] & 15;
                    this.faceCell[face][2] = (packet[3] >> 4) & 15;
                    this.faceCell[face][3] = packet[3] & 15;
                    this.faceCell[face][4] = (packet[4] >> 4) & 15;
                    this.faceCell[face][5] = packet[4] & 15;
                    this.faceCell[face][6] = (packet[5] >> 4) & 15;
                    this.faceCell[face][7] = packet[5] & 15;
                } else if (face == this.protocols.face.green) {
                    this.faceCell[face][0] = (packet[3] >> 4) & 15;
                    this.faceCell[face][1] = packet[3] & 15;
                    this.faceCell[face][2] = (packet[4] >> 4) & 15;
                    this.faceCell[face][3] = packet[4] & 15;
                    this.faceCell[face][4] = (packet[5] >> 4) & 15;
                    this.faceCell[face][5] = packet[5] & 15;
                    this.faceCell[face][6] = (packet[2] >> 4) & 15;
                    this.faceCell[face][7] = packet[2] & 15;
                } else if (face == this.protocols.face.blue) {
                    this.faceCell[face][0] = (packet[4] >> 4) & 15;
                    this.faceCell[face][1] = packet[4] & 15;
                    this.faceCell[face][2] = (packet[5] >> 4) & 15;
                    this.faceCell[face][3] = packet[5] & 15;
                    this.faceCell[face][4] = (packet[2] >> 4) & 15;
                    this.faceCell[face][5] = packet[2] & 15;
                    this.faceCell[face][6] = (packet[3] >> 4) & 15;
                    this.faceCell[face][7] = packet[3] & 15;
                } else if (face == this.protocols.face.red) {
                    this.faceCell[face][0] = (packet[3] >> 4) & 15;
                    this.faceCell[face][1] = packet[3] & 15;
                    this.faceCell[face][2] = (packet[4] >> 4) & 15;
                    this.faceCell[face][3] = packet[4] & 15;
                    this.faceCell[face][4] = (packet[5] >> 4) & 15;
                    this.faceCell[face][5] = packet[5] & 15;
                    this.faceCell[face][6] = (packet[2] >> 4) & 15;
                    this.faceCell[face][7] = packet[2] & 15;
                } else if (face == this.protocols.face.purple) {
                    this.faceCell[face][0] = (packet[4] >> 4) & 15;
                    this.faceCell[face][1] = packet[4] & 15;
                    this.faceCell[face][2] = (packet[5] >> 4) & 15;
                    this.faceCell[face][3] = packet[5] & 15;
                    this.faceCell[face][4] = (packet[2] >> 4) & 15;
                    this.faceCell[face][5] = packet[2] & 15;
                    this.faceCell[face][6] = (packet[3] >> 4) & 15;
                    this.faceCell[face][7] = packet[3] & 15;
                }
            } else if (face == 7) {
                this.faceCell[0][0] = (((packet[2] & 3) << 1) | (packet[3] >> 7) & 1) & 7;
                this.faceCell[0][1] = (packet[3] >> 4) & 7;
                this.faceCell[0][2] = (packet[3] >> 1) & 7;
                this.faceCell[0][3] = (((packet[3] & 1) << 2) | (packet[4] >> 6) & 3) & 7;
                this.faceCell[0][4] = (packet[4] >> 3) & 7;
                this.faceCell[0][5] = packet[4] & 7;
                this.faceCell[0][6] = (packet[2] >> 5) & 7;
                this.faceCell[0][7] = (packet[2] >> 2) & 7;
    
                this.faceCell[1][0] = (packet[5] >> 5) & 7;
                this.faceCell[1][1] = (packet[5] >> 2) & 7;
                this.faceCell[1][2] = (((packet[5] & 3) << 1) | (packet[6] >> 7) & 1) & 7;
                this.faceCell[1][3] = (packet[6] >> 4) & 7;
                this.faceCell[1][4] = (packet[6] >> 1) & 7;
                this.faceCell[1][5] = (((packet[6] & 1) << 2) | (packet[7] >> 6) & 3) & 7;
                this.faceCell[1][6] = (packet[7] >> 3) & 7;
                this.faceCell[1][7] = packet[7] & 7;
    
                this.faceCell[2][0] = (((packet[8] & 3) << 1) | (packet[9] >> 7) & 1) & 7;
                this.faceCell[2][1] = (packet[9] >> 4) & 7;
                this.faceCell[2][2] = (packet[9] >> 1) & 7;
                this.faceCell[2][3] = (((packet[9] & 1) << 2) | (packet[10] >> 6) & 3) & 7;
                this.faceCell[2][4] = (packet[10] >> 3) & 7;
                this.faceCell[2][5] = packet[10] & 7;
                this.faceCell[2][6] = (packet[8] >> 5) & 7;
                this.faceCell[2][7] = (packet[8] >> 2) & 7;
    
                this.faceCell[3][0] = (packet[12] >> 1) & 7;
                this.faceCell[3][1] = (((packet[12] & 1) << 2) | (packet[13] >> 6) & 3) & 7;
                this.faceCell[3][2] = (packet[13] >> 3) & 7;
                this.faceCell[3][3] = packet[13] & 7;
                this.faceCell[3][4] = (packet[11] >> 5) & 7;
                this.faceCell[3][5] = (packet[11] >> 2) & 7;
                this.faceCell[3][6] = (((packet[11] & 3) << 1) | (packet[12] >> 7) & 1) & 7;
                this.faceCell[3][7] = (packet[12] >> 4) & 7;
    
                this.faceCell[4][0] = (((packet[14] & 3) << 1) | (packet[15] >> 7) & 1) & 7;
                this.faceCell[4][1] = (packet[15] >> 4) & 7;
                this.faceCell[4][2] = (packet[15] >> 1) & 7;
                this.faceCell[4][3] = (((packet[15] & 1) << 2) | (packet[16] >> 6) & 3) & 7;
                this.faceCell[4][4] = (packet[16] >> 3) & 7;
                this.faceCell[4][5] = packet[16] & 7;
                this.faceCell[4][6] = (packet[14] >> 5) & 7;
                this.faceCell[4][7] = (packet[14] >> 2) & 7;
    
                this.faceCell[5][0] = (packet[18] >> 1) & 7;
                this.faceCell[5][1] = (((packet[18] & 1) << 2) | (packet[19] >> 6) & 3) & 7;
                this.faceCell[5][2] = (packet[19] >> 3) & 7;
                this.faceCell[5][3] = packet[19] & 7;
                this.faceCell[5][4] = (packet[17] >> 5) & 7;
                this.faceCell[5][5] = (packet[17] >> 2) & 7;
                this.faceCell[5][6] = (((packet[17] & 3) << 1) | (packet[18] >> 7) & 1) & 7;
                this.faceCell[5][7] = (packet[18] >> 4) & 7;            
            }
        } else if (index == this.protocols.index.faceDirection) {
            if (packet[2] == 1) {
                this.faceDir[0] = (packet[3] >> 4) & 15; // 흰
                this.faceDir[1] = packet[3] & 15;        // 노
                this.faceDir[2] = (packet[4] >> 4) & 15; // 녹
                this.faceDir[3] = packet[4] & 15;        // 파
                this.faceDir[4] = (packet[5] >> 4) & 15; // 빨
                this.faceDir[5] = packet[5] & 15;        // 보
            }
        } else if (index == this.protocols.index.recordResponse) {
            // 0 : 최신
            // 1 : 차순
            // ---
            //5 : 최고
            this.record[this.recordIndex][packet[2]] = (packet[3] << 16) | (packet[4] << 8) | packet[5];
            this.getRecord = false;
        }    
    }
}

module.exports = new ExMarsCube();
