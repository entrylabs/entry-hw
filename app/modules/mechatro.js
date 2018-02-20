/********************************************************
 * 명명 규칙
 *
 * 함수명, 변수명 : 첫 글자 소문자, 다음 단어 첫 글자 대문자, 두단어 이상 조합    예) nameRull
 * 키  값 : 모두 대문자, 단어사이 '_' 사용함                                   예) NAME_RULL
 *
 *********************************************************/

function Module() {
    // this.setZero_flag = null
    // 사용하는 포트 리스트
    this.portList = [
        2,
        3,
        4,
        5,
        6,
        7,
        10,
        11,
        14,
        15,
        16,
        17,
        18,
        19,
        20,
        21,
        22,
        23,
        24,
        25,
    ];

    this.contMode = new Array(26);
    this.entryValue = new Array(26);
    this.deviceValue = new Array(26);

    // 데이터의 변경 유무 및 전송 횟수 제한 변수
    this.modeFlagToEntry = new Array(26);
    this.valueFlagToEntry = new Array(26);
    this.flagToDevice = new Array(26);

    this.entryState = {
        CHECKER: 0,
        STOP: 0,
        RUN: 1,
    };

    this.haveToSet = {
        DIVICE_INPUT_MODE: true,
        DIVICE_STANDBY_MODE: false,
        ENTRY_STANDBY_MODE: true,
    };

    this.remainPort = null;
    this.remainData = 0;

    this.portMode = {
        SET_G_DEVICE: 0x80,
        COM_ALIVE: 0x80,
        COM_INIT_DEVICE: 0x81,
        COM_STANDBY_DEVICE: 0x82,
        COM_NO_TONE: 0x83,
        COM_SET_BLUE_PW: 0x84,
        ERR_SET_BLUE_PW: 0x85,
        SET_DIGITAL_OUT: 0x90,

        SET_G_MOTOR: 0xa0,
        SET_MOTOR_SPEED: 0xa0,
        SET_MOTOR_CURRENT: 0xb0,

        SET_G_SERVO_PWM_TON: 0xc0,
        SET_SERVO_POSITION: 0xc0,
        SET_SERVO_SPEED: 0xc8,
        SET_PWM: 0xd0,
        SET_TONE: 0xd8,

        SET_G_INPUT: 0xe0,
        SET_ANALOG_IN: 0xe0,
        SET_DIGITAL_IN: 0xe8,
        SET_ULTRASONIC: 0xf0,

        GET_DIGITAL_IN: 0x90,
        GET_ANALOG_IN: 0xa0,
        GET_MOTOR_CURRENT: 0xb0,
        GET_ULTRASONIC_8: 0xc0,
        GET_ULTRASONIC_9: 0xd0,
    };

    this.portMapToDevice = {
        DIGITAL: {
            //IN/OUT, ULTRASONIC, TON
            '2': 0,
            '4': 1,
            '5': 2,
            '6': 3,
            '7': 4,
            '8': 5,
            '9': 6,
            '10': 7,
        },
        ANALOG: {
            '14': 0,
            '15': 1,
            '16': 2,
            '17': 3,
            '18': 4,
            '19': 5,
            '20': 6,
            '21': 7,
        },
        SERVO: {
            '2': 0,
            '5': 1,
            '6': 2,
            '10': 3,
            '22': 0,
            '23': 1,
            '24': 2,
            '25': 3,
        },
        PWM: {
            '5': 0,
            '6': 1,
            '9': 2,
            '10': 3,
        },
        MOTOR: {
            '3': 0,
            '11': 1,
            '14': 0,
            '15': 1,
        },
    };

    this.portMapToEntry = {
        DIGITAL: {
            '0': 2,
            '1': 4,
            '2': 5,
            '3': 6,
            '4': 7,
            '5': 8,
            '6': 9,
            '7': 10,
        },
        ANALOG: {
            '0': 14,
            '1': 15,
            '2': 16,
            '3': 17,
            '4': 18,
            '5': 19,
            '6': 20,
            '7': 21,
        },
    };
}

// 핸들러 초기값 설정 하드웨어 연결 시 초기값 설정
Module.prototype.init = function(handler, config) {
    //console.log("init");
    this.entryState.CHECKER = this.entryState.STOP;
    this.haveToSet.DIVICE_INPUT_MODE = true;
    this.haveToSet.DIVICE_STANDBY_MODE = false;
    this.haveToSet.ENTRY_STANDBY_MODE = true;
    this.entryHW_setInput();
    this.entryHW_initMotor();
};

// 연결 직후 Hardware 에 보내는 초기값 설정
Module.prototype.requestInitialData = function() {
    //console.log("requestInitialData");
    return null;
};

// 초기 수신데이터 체크(필수)
Module.prototype.checkInitialData = function(data, config) {
    //console.log("checkInitialData");
    return true;
};

// 하드웨어에서 들어오는 데이터의 validate
Module.prototype.validateLocalData = function(data) {
    //console.log("validateLocalData");
    return true;
};

// Entry 에서 온 데이터 셋팅
Module.prototype.handleRemoteData = function(handler) {
    //console.log("dataFromEntry    ■");
    if (handler.e('entryStop') == true) {
        //console.log("Entry  stop      ■ ");
        this.entryState.CHECKER = this.entryState.STOP;
        this.haveToSet.DIVICE_INPUT_MODE = true;
        this.haveToSet.ENTRY_STANDBY_MODE = true;
        this.entryHW_setInput();
        this.entryHW_initMotor();
    } else if (this.entryState.CHECKER == this.entryState.STOP) {
        //console.log("Start            ■");
        this.entryState.CHECKER = this.entryState.RUN;
        this.haveToSet.DIVICE_STANDBY_MODE = true;
        this.entryHW_setStandBy();
    }
    this.dataFromEntry(handler);
};

// 하드웨어에 데이터 전송, 연결 프로그램이 구동 되면 상시 실행한다.
Module.prototype.requestLocalData = function() {
    var queryString = [];
    if (this.haveToSet.DIVICE_INPUT_MODE) {
        //console.log("                 ■--> DIVICE_INPUT_MODE");
        this.haveToSet.DIVICE_INPUT_MODE = false;
        queryString.push(this.portMode.COM_INIT_DEVICE);
    }
    if (this.haveToSet.DIVICE_STANDBY_MODE) {
        //console.log("                 ■--> DIVICE_STANDBY_MODE");
        this.haveToSet.DIVICE_STANDBY_MODE = false;
        queryString.push(this.portMode.COM_STANDBY_DEVICE);
    }
    if (this.entryState.CHECKER == this.entryState.RUN) {
        this.dataToDevice(queryString);
    }
    return queryString;
};

// 하드웨어에서 수신한 데이터 처리, 연결 프로그램이 구동 되면 상시 실행한다.
Module.prototype.handleLocalData = function(data) {
    this.dataFormDevice(data);
};

// 서버로 데이터 전송, 연결 프로그램이 구동 되면 상시 실행한다.
Module.prototype.requestRemoteData = function(handler) {
    if (this.haveToSet.ENTRY_STANDBY_MODE) {
        this.haveToSet.ENTRY_STANDBY_MODE = false;
        this.Entry_setStandBy(handler);
    }

    this.dataToEntry(handler);
};

// Web Socket 종료후 처리
Module.prototype.reset = function() {};

//**********************************************************
// Entry-HW 프로그램 셋팅 함수
Module.prototype.entryHW_initValues = function() {
    this.entryValue = [
        0,
        0,
        0,
        100,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        100,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
    ];
    this.deviceValue = [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
    ];
    this.valueFlagToEntry = [
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
    ];
    this.flagToDevice = [
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
        2,
    ];
};

Module.prototype.entryHW_setDigitalMode = function(mode) {
    for (var i = 2; i < 14; i++) {
        if (i != 3 && i != 11) {
            this.contMode[i] = mode;
            this.modeFlagToEntry[i] = 2;
        }
    }
};

Module.prototype.entryHW_setAnalogMode = function(mode) {
    for (var i = 14; i < 22; i++) {
        this.contMode[i] = mode;
        this.modeFlagToEntry[i] = 2;
    }
};

Module.prototype.entryHW_setInput = function() {
    //console.log("entryHW_setInput()")
    // 하드웨어 프로그램 인풋 모드로 초기화
    this.entryHW_initValues();
    this.entryHW_setDigitalMode(this.portMode.SET_DIGITAL_IN);
    this.entryHW_setAnalogMode(this.portMode.SET_ANALOG_IN);
};

Module.prototype.entryHW_setStandBy = function() {
    this.entryHW_initValues();
    this.entryHW_setDigitalMode(this.portMode.COM_STANDBY_DEVICE);
    this.entryHW_setAnalogMode(this.portMode.COM_STANDBY_DEVICE);
};

Module.prototype.entryHW_initMotor = function() {
    //console.log("entryHW_initMotor()")
    this.contMode[3] = this.portMode.SET_MOTOR_SPEED;
    this.contMode[11] = this.portMode.SET_MOTOR_SPEED;
    this.modeFlagToEntry[3] = 2;
    this.modeFlagToEntry[11] = 2;
    this.entryValue[3] = 100;
    this.entryValue[11] = 100;
};

//***********************************************************
// Entry-JS 셋팅 함수

Module.prototype.Entry_setStandBy = function(handler) {
    //console.log("Entry_setStandBy <--■")
    var portNo;
    for (var i = 0; i < this.portList.length; i++) {
        portNo = this.portList[i];
        handler.write('m' + portNo, this.portMode.COM_STANDBY_DEVICE);
        //console.log("Entry_setStandBy <<-■    P[" + portNo + "] : M_V[" + this.portMode.COM_STANDBY_DEVICE + "]" );
    }

    handler.write('3', 0);
    handler.write('11', 0);
};
//**********************************************************

//***********************************************************
// 데이터 처리 모듈
Module.prototype.dataFromEntry = function(handler) {
    let mode;
    let value;
    let portNo;
    let mPortNo;

    for (let i = 0; i < this.portList.length; i++) {
        // 사용하는 포트 리스트에 대하여 없데이트를 한다.
        //var str="";
        portNo = this.portList[i];
        mPortNo = 'm' + portNo;

        // 모드 저장
        if (handler.e(mPortNo) == true) {
            // 포트에 대한 모드 변수가 있는지 확인한다.
            mode = handler.read(mPortNo);
            if (this.contMode[portNo] != mode) {
                // 현재값과 다른 경우에 업데이트 한다.
                this.contMode[portNo] = mode; // 모드값 저장
                this.modeFlagToEntry[portNo] = 0; // 엔트리에 받은 값을 리턴하기 위한 flag 초기화
                this.flagToDevice[portNo] = 0; // 디바이스에 업데이트를 하기 위한 flag 초기화
                //console.log("dataFromEntry()  ->>■    ModeChange : P[" + portNo + "] M[" + this.contMode[portNo] + "]");
            }
            //console.log("dataFromEntry()  ->>■    ModeChange : P[" + portNo + "] M[" + this.contMode[portNo] + "]");
        }
        // 값 저장
        if (handler.e(portNo) == true) {
            // 포트 번호가 있는지 확인한다.
            value = handler.read(portNo);
            if (this.entryValue[portNo] != value) {
                // 현재값과 다른 경우에 업데이트 한다.
                this.entryValue[portNo] = value; // 값 저장
                this.valueFlagToEntry[portNo] = 0; // 엔트리에 받은 값을 리턴하기 위한 flag 초기화
                this.flagToDevice[portNo] = 0; // 디바이스에 업데이트를 하기 위한 flag 초기화
                //if ( portNo == 5 ){
                //console.log("dataFromEntry()  ->>■    ValueChange : P[" + portNo + "] V[" + this.entryValue[portNo] + "]" + " M["+ this.contMode[portNo] + "]");
                //}
            }
        }
        //str = "Port No [" + portNo + "]  " + str;
        //console.log(str);
    }
};
Module.prototype.dataToDevice = function(queryString) {
    //console.log("                 ■--> dataToDevice()");
    var query;

    var idx;
    var portNo;
    var mode;
    var modeGroup;
    var value;
    var contMode = this.contMode;
    var entryValue = this.entryValue;
    var flag = this.flagToDevice;

    for (var i = 0; i < this.portList.length; i++) {
        portNo = this.portList[i];
        // Entry 에서 값이 업데이트 되었는지 검사 후 데이터 1회 전송
        // dataFromEntry() 에서 flag=0 셋팅
        if (flag[portNo] < 1) {
            mode = contMode[portNo];
            modeGroup = mode & 0xe0;
            value = entryValue[portNo];
            flag[portNo]++;
            //console.log( "■ ---> No[" + portNo + "] M[" + mode+"] f[" + flag[portNo] + "] v" + value );
            //console.log("pin" + portNo + " value changed : " + value);

            switch (modeGroup) {
                case this.portMode.SET_G_DEVICE: {
                    switch (mode) {
                        case this.portMode.SET_DIGITAL_OUT: {
                            idx = this.portMapToDevice.DIGITAL[portNo];
                            query = mode + (value << 3) + idx;
                            queryString.push(query);
                            //console.log( "dataToDevice()      ■->> SET_DIGITAL_OUT : P[" + portNo + "(" + idx + ")] : V[" + query + "-" + value + "]");
                            break;
                        }
                        case this.portMode.COM_NO_TONE: {
                            query = mode;
                            queryString.push(query);
                            //console.log( "dataToDevice()      ■->> COM_NO_TONE");
                            break;
                        }
                        case this.portMode.COM_SET_BLUE_PW: {
                            //console.log("COM_SET_BLUE_PW : " + value);

                            query = this.portMode.COM_SET_BLUE_PW;
                            queryString.push(query);

                            query = parseInt(value / 100);
                            queryString.push(query);
                            //console.log("PW 1: " + query);

                            query = value - parseInt(value / 100) * 100;
                            queryString.push(query);
                            //console.log("PW 1: " + query);
                            break;
                        }
                    }
                    break;
                }
                case this.portMode.SET_G_MOTOR: {
                    switch (mode) {
                        case this.portMode.SET_MOTOR_SPEED: {
                            //Data1
                            idx = this.portMapToDevice.MOTOR[portNo];
                            query = mode + ((value >> 6) & 0x02) + idx;
                            queryString.push(query);
                            //console.log("                 ■    Data1 = "+ query);
                            //Data2
                            query = value & 0x7f;
                            queryString.push(query);
                            //console.log("                 ■    Data2 = "+ query);
                            //console.log("dataToDevice()      ■->> SET_G_MOTOR idx[" + idx + "] M["+ mode +"] V[" + value + "]" );
                            break;
                        }
                        case this.portMode.SET_MOTOR_CURRENT: {
                            idx = this.portMapToDevice.MOTOR[portNo];
                            query = mode + idx;
                            queryString.push(query);
                            //console.log("dataToDevice()      ■->> SET_G_MOTOR_C portNo[" + portNo + "("+ idx + ")] M["+ mode +"]" );
                            break;
                        }
                    }
                    break;
                }
                case this.portMode.SET_G_SERVO_PWM_TON: {
                    //console.log("dataToDevice()      ■->> SET_G_SERVO_PWM_TON ["+ mode +"]");
                    switch (mode) {
                        case this.portMode.SET_SERVO_POSITION: {
                            //Data1
                            idx = this.portMapToDevice.SERVO[portNo];
                            query = mode + ((value >> 5) & 0x4) + idx;
                            queryString.push(query);
                            //console.log( "dataToDevice()      ■->> SERVO : P[" + portNo + "(" + idx + ")] : V[" + query + "-" + (value & 0x7F) + "]");
                            //Data2
                            query = value & 0x7f;
                            queryString.push(query);

                            break;
                        }
                        case this.portMode.SET_SERVO_SPEED: {
                            //Data1
                            idx = this.portMapToDevice.SERVO[portNo];
                            query = mode + ((value >> 5) & 0x4) + idx;
                            queryString.push(query);
                            //console.log(" servo speed data1 : " + query);
                            //Data2
                            query = value & 0x7f;
                            queryString.push(query);
                            //console.log(" servo speed data2 : " + query);
                            break;
                        }
                        case this.portMode.SET_PWM: {
                            //Data1
                            idx = this.portMapToDevice.PWM[portNo];
                            query = mode + idx;
                            queryString.push(query);
                            //Data2
                            query = value & 0x7f;
                            queryString.push(query);
                            break;
                        }
                        case this.portMode.SET_TONE: {
                            //Data1
                            idx = this.portMapToDevice.DIGITAL[portNo];
                            query = mode + idx;
                            queryString.push(query);
                            //console.log("dataToDevice()      ■->> SET_G_SERVO_PWM_TON mode["+ mode +"]");
                            //Data2
                            queryString.push(value);
                            //console.log("dataToDevice()      ■->> SET_G_SERVO_PWM_TON value["+ value +"]");
                            break;
                        }
                    }
                    break;
                }
                case this.portMode.SET_G_INPUT: {
                    switch (mode) {
                        case this.portMode.SET_ANALOG_IN: {
                            idx = this.portMapToDevice.ANALOG[portNo];
                            query = mode + idx;
                            queryString.push(query);
                            break;
                        }

                        case this.portMode.SET_DIGITAL_IN: {
                            idx = this.portMapToDevice.DIGITAL[portNo];
                            query = mode + idx;
                            queryString.push(query);
                            //console.log("dataToDevice()      ■->> SET_DIGITAL_IN : P[" + portNo + "(" + idx + ")] M["+ mode + "]");
                            break;
                        }

                        case this.portMode.SET_ULTRASONIC: {
                            //Data1
                            idx = this.portMapToDevice.DIGITAL[portNo];
                            value = this.portMapToDevice.DIGITAL[value];
                            //console.log("dataToDevice()      ■->> mode[" + mode + "] trig_idx[" + idx + "] echo[" + value +"]");

                            query = mode + idx;
                            queryString.push(query);
                            //console.log("Data1 = "+ query);
                            //Data2
                            queryString.push(value);
                            //console.log("Data2 = "+ value);
                            break;
                        }
                    }
                    break;
                }

                default: {
                    break;
                }
            }
        }
    }
    return queryString;
};

Module.prototype.dataFormDevice = function(data) {
    let vFlag = this.valueFlagToEntry;
    let portNo;
    let idx;
    let mode;

    if (this.receiveBuffer == undefined) this.receiveBuffer = [];

    for (let i = 0; i < data.length; i++) {
        this.receiveBuffer.push(data[i]);
    }

    //console.log("             ■ <<<---  Device" + this.remainPort );
    while (this.receiveBuffer.length > 0) {
        let data1 = this.receiveBuffer.shift();
        //console.log( data1 );

        // Data 1
        if (data1 & 0x80) {
            mode = data1 & 0xf0; // b1111 0000
            switch (mode) {
                case this.portMode.GET_DIGITAL_IN: {
                    idx = data1 & 0x07;
                    portNo = this.portMapToEntry.DIGITAL[idx];
                    this.deviceValue[portNo] = (data1 & 0x08) >> 3;
                    //console.log("dataFormDevice()    ■<<- GET_DIGITAL_IN : P[" + portNo + "(" + idx + ")] D_V[" + this.deviceValue[portNo] + "]" );
                    vFlag[portNo] = 0;
                    this.remainPort = null;
                    break;
                }
                case this.portMode.GET_ANALOG_IN: {
                    idx = data1 & 0x07;
                    portNo = this.portMapToEntry.ANALOG[idx];
                    this.remainPort = portNo;
                    this.remainData = 0;
                    break;
                }
                case this.portMode.GET_MOTOR_CURRENT: {
                    idx = data1 & 0x01;
                    portNo = this.portMapToEntry.ANALOG[idx];
                    this.remainPort = portNo;
                    this.remainData = (data1 & 0x0e) << 6;
                    //console.log("dataFormDevice()    ■<<- GET_DIGITAL_IN : P[" + portNo + "(" + idx + ")]" );
                    break;
                }
                case this.portMode.GET_ULTRASONIC_8:
                case this.portMode.GET_ULTRASONIC_9: {
                    idx = data1 & 0x07;
                    portNo = this.portMapToEntry.DIGITAL[idx];
                    this.remainPort = portNo;
                    this.remainData = (data1 << 4) & 0x180;
                    //console.log("dataFormDevice()    ■<<- GET_ULTRA  port :" + portNo + " remainData : "+ this.remainData );
                    break;
                }
                case this.portMode.COM_ALIVE: {
                    switch (data1) {
                        case this.portMode.COM_SET_BLUE_PW:
                            this.deviceValue[2] = 'OK';
                            //console.log("dataFormDevice()    ■<<- GET_DIGITAL_IN : P[" + portNo + "(" + idx + ")] D_V[" + this.deviceValue[portNo] + "]" );
                            vFlag[2] = 0;
                            this.remainPort = null;
                            break;
                        case this.portMode.ERR_SET_BLUE_PW:
                            this.deviceValue[2] = 'FAIL';
                            //console.log("dataFormDevice()    ■<<- GET_DIGITAL_IN : P[" + portNo + "(" + idx + ")] D_V[" + this.deviceValue[portNo] + "]" );
                            vFlag[2] = 0;
                            this.remainPort = null;
                            break;
                    }
                    break;
                }
                default: {
                    this.remainPort = null;
                    this.remainData = 0;
                    break;
                }
            }
            //console.log("get 1st data remainPort" + this.remainPort);
        } else if (this.remainPort) {
            // Data 2
            this.deviceValue[this.remainPort] = this.remainData | data1;
            vFlag[this.remainPort] = 0;
            //console.log("remainPort[" + this.remainPort +"] data2[" + this.deviceValue[this.remainPort] + "]");
            this.remainPort = null;
        }
    }
};

Module.prototype.dataToEntry = function(handler) {
    //console.log("Entry <<<--- ■");

    let portNo;
    let mode;
    let mFlag = this.modeFlagToEntry;
    let vFlag = this.valueFlagToEntry;

    for (let i = 0; i < this.portList.length; i++) {
        portNo = this.portList[i];
        mode = this.contMode[portNo];

        if (mFlag[portNo] < 1) {
            //console.log("dataToEntry()    <<-■    P[" + portNo + "] M[" + this.contMode[portNo] + "]" );
            handler.write('m' + portNo, this.contMode[portNo]);
            mFlag[portNo]++;
        }

        if (vFlag[portNo] < 1) {
            switch (mode) {
                case this.portMode.SET_ANALOG_IN:
                case this.portMode.SET_DIGITAL_IN:
                case this.portMode.SET_ULTRASONIC:
                case this.portMode.COM_SET_BLUE_PW:
                    handler.write(portNo, this.deviceValue[portNo]);
                    //console.log("dataToEntry()    <<-■    P[" + portNo + "] D_V[" + this.deviceValue[portNo] + "]" );
                    break;
                case this.portMode.SET_MOTOR_CURRENT:
                    handler.write(portNo, this.deviceValue[portNo] / 100);
                    //console.log("dataToEntry()    <<-■    P[" + portNo + "] D_V[" + this.deviceValue[portNo] + "]" );
                    break;
                case this.portMode.SET_MOTOR_SPEED:
                    handler.write('M' + portNo, this.entryValue[portNo] - 100);
                    //console.log("dataToEntry()    <<-■    P[" + portNo + "] M_V[" + (this.entryValue[portNo]-100) + "]" );
                    break;
                default:
                    handler.write(portNo, this.entryValue[portNo]);
                //console.log("dataToEntry()    <<-■    P[" + portNo + "] E_V[" + this.entryValue[portNo] + "]" );
            }
            vFlag[portNo]++;
        }
    }
};

module.exports = new Module();
