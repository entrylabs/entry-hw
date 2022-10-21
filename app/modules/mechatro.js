/********************************************************
 * 명명 규칙
 *
 * 함수명, 변수명 : 첫 글자 소문자, 다음 단어 첫 글자 대문자, 두단어 이상 조합    예) nameRull
 * 키  값 : 모두 대문자, 단어사이 '_' 사용함                                   예) NAME_RULL
 *
 *********************************************************/
/* update 내용
   디지털 입력 업데이트 방법 변경 : 코딩에 사용된 디지털 포트만 -> 모두 업데이트
*/

const BaseModule = require('./baseModule');

class mechatro extends BaseModule {
    // 클래스 내부에서 사용될 필드들을 이곳에서 선언합니다.
    constructor() {
        super();
        this.entryJS_State = 0;

        this.remainData = 0;

        this.dataFromEntry = {};
        // 형식
        // dataFromEntry = {
        //     portNo: {
        //         MODE: 0,
        //         VALUE: 0,
        //         UPDATE: 2,  // 업데이트 횟수 셋팅
        //     },
        //    allServoRrun:{
        //    MODE:    
        //    VALUE:
        //    RUNTIME:
        //    },
        // }

        this.dataFromDevice = {};
        // 형식
        // this.dataFromDevice = {
        //     ULTRASONIC: 0,
        //     '2': 0,
        // 
        //     '21': 0,
        // };

        this.setMode = {
            SET_GROUP_1: 0x80,
            SET_INIT_DEVICE: 0x80,
            SET_DIGITAL_OUT: 0x81,
            SET_NO_TONE: 0x82,
            SET_PORT_DISABLE: 0x86,
            SET_BLUE_PW: 0x87,

            SET_ALL_SERVO_RUNTIME: 0x88,
            SET_MOTOR_CURRENT: 0x8A,    // 엔트리에서 수신하는 값, 포트번호와 함께 수신됨
            SET_MOTOR_CURRENT_A: 0x8A,  // 포트번호에 따라 값 선택 후 HW에 전송
            SET_MOTOR_CURRENT_B: 0X8B,  // 포트번호에 따라 값 선택 후 HW에 전송

            SET_MOTOR_SPEED_Free: 0x90,
            SET_MOTOR_SPEED_Fast: 0x94,

            SET_TONE: 0x98,
            SET_PWM: 0x9C,

            SET_GROUP_2: 0xA0,
            SET_SERVO_POSITION: 0xA0,

            SET_GROUP_3: 0xC0,
            SET_SERVO_SPEED: 0xC0,
            SET_SERVO_RUNTIME: 0xD0,

            SET_GROUP_INPUT: 0xE0,
            SET_ANALOG_IN: 0xE0,
            SET_ULTRASONIC: 0xE8,
            SET_DIGITAL_IN: 0xF0,
        };

        this.getMode = {
            COM_GROUP: 0x80,
            COM_INIT_DEVICE: 0x81,
            COM_PORT_DISABLED: 0x82,
            COM_BLUETOOTH_PW_OK: 0x83,
            COM_BLUETOOTH_PW_ERR: 0x84,

            GET_DIGITAL_IN: 0x88,
            GET_DIGITAL_is_H_port: 0x02,
            // GET_ANALOG_IN: 0x90~0xF8, ( 아날로그 포트 모드 구분 불필요 --> 삭제 22.3.26)
        };

        this.portMapToDevice = {
            DIGITAL_INOUT: {
                '2': 0,
                '4': 1,
                '5': 2,
                '6': 3,
                '7': 4,
                '10': 5,
                '16': 6,
                '17': 7,
                '18': 8,
                '19': 9,
            },
            ANALOG_IN: {
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
<<<<<<< HEAD
                '4': 1,
                '5': 2,
                '6': 3,
                '7': 4,
                '10': 5,
                '16': 6,
                '22': 0,
                '23': 1,
                '24': 2,
                '25': 3,
                '26': 4,
                '27': 5,
                '28': 6
=======
                '5': 1,
                '6': 2,
                '10': 3,
>>>>>>> 86daa0452b3fb584eb27fae29cf42a8cec40d5da
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
            },
            ULTRASONIC: {
                '2': 0,
                '4': 1,
                '5': 2,
                '6': 3,
                '7': 4,
                '10': 5,
            },
            TONE: {
                '5': 0,
                '6': 1,
                '7': 2,
                '10': 3,
            },
        };

        this.portMapToEntry = {  // 필요한 포트만 선택하여 나열
            DIGITAL_L: {
                '0': 2,
                '2': 4,
                '3': 5,
                '4': 6,
                '5': 7,
            },
            DIGITAL_H: {
                '0': 10,
                '4': 16,
                '5': 17,
                '6': 18,
                '7': 19,
            },
            ANALOG: {
                '2': 2,
                '3': 4,
                '4': 5,
                '5': 6,
                '6': 7,
                '7': 10,
                '8': 14,    // MA motor current
                '9': 15,    // MB motor current
                '10': 16,
                '11': 17,
                '12': 18,
                '13': 19,
                '14': 20,
                '15': 21,
            },
        };
    }

    initDataFromEntryStopState() {
        this.dataFromEntry = {   // 인풋모드에서 사용하므로 
            '0': {
                MODE: this.setMode.SET_DIGITAL_IN,
                UPDATE: 0,
            },
            '2': {
                MODE: this.setMode.SET_DIGITAL_IN,
                UPDATE: 0,
            },
            '4': {
                MODE: this.setMode.SET_DIGITAL_IN,
                UPDATE: 0,
            },
            '5': {
                MODE: this.setMode.SET_DIGITAL_IN,
                UPDATE: 0,
            },
            '6': {
                MODE: this.setMode.SET_DIGITAL_IN,
                UPDATE: 0,
            },
            '7': {
                MODE: this.setMode.SET_DIGITAL_IN,
                UPDATE: 0,
            },
            '10': {
                MODE: this.setMode.SET_DIGITAL_IN,
                UPDATE: 0,
            },
            '14': {
                MODE: this.setMode.SET_PORT_DISABLE,
                UPDATE: 0,
            },
            '15': {
                MODE: this.setMode.SET_PORT_DISABLE,
                UPDATE: 0,
            },
            '16': {
                MODE: this.setMode.SET_ANALOG_IN,
                UPDATE: 0,
            },
            '17': {
                MODE: this.setMode.SET_ANALOG_IN,
                UPDATE: 0,
            },
            '18': {
                MODE: this.setMode.SET_ANALOG_IN,
                UPDATE: 0,
            },
            '19': {
                MODE: this.setMode.SET_ANALOG_IN,
                UPDATE: 0,
            },
            '20': {
                MODE: this.setMode.SET_ANALOG_IN,
                UPDATE: 0,
            },
            '21': {
                MODE: this.setMode.SET_ANALOG_IN,
                UPDATE: 0,
            },
            /*allServoPort: {
                MODE: this.setMode.SET_PORT_DISABLE,
                POSITION: { 0: 90, 1: 90, 2: 90, 3: 90, 4: 90, 5: 90, 6: 90 },
                VALUE: 20,
                UPDATE: 0,
            },*/
        };
        this.dataFromDevice['com'] = 'stop';
    }

    /*
    최초에 커넥션이 이루어진 후의 초기 설정.
    handler 는 워크스페이스와 통신하 데이터를 json 화 하는 오브젝트입니다. (datahandler/json 참고)
    config 은 module.json 오브젝트입니다.
    */
    init(handler, config) {
        this.handler = handler;
        this.config = config;
        this.initDataFromEntryStopState();
    }

    /*
    하드웨어 기기에 전달할 데이터를 반환합니다.
    하드웨어 연결되면 계속 실행
    slave 모드인 경우 duration 속성 간격으로 지속적으로 기기에 요청을 보냅니다.*/

    requestLocalData() {
        //console.log("        ■ -->> Device: ");
        const queryString = [];
        let query;
        let mode;
        let value;
        let modeGroup;
        let idx;
        // console.log("dataFromEntry : ", this.dataFromEntry);

        if (this.entryJS_State == 0) {  // 하드웨어 연결 or 엔트리 stop시 초기화 , 포트 모드 초기화
            this.entryJS_State = 1;
            queryString.push(this.setMode.SET_INIT_DEVICE);
            queryString.push(0);
            queryString.push(this.setMode.SET_INIT_DEVICE);
        }
        //console.log(Object.keys(this.dataFromEntry));

        Object.keys(this.dataFromEntry).forEach((portNo) => {
            //console.log('portkeys.forEach ');
            if (this.dataFromEntry[portNo].UPDATE) {
                mode = this.dataFromEntry[portNo].MODE;
                modeGroup = mode & 0xe0;
                value = this.dataFromEntry[portNo].VALUE;
                this.dataFromEntry[portNo].UPDATE--;
                //console.log("Send Data : [", portNo, "] = ", this.dataFromEntry[portNo]);
                switch (modeGroup) {
                    case this.setMode.SET_GROUP_1:
                        switch (mode) {
                            case this.setMode.SET_DIGITAL_OUT:
                                idx = this.portMapToDevice.DIGITAL_INOUT[portNo];
                                queryString.push(this.setMode.SET_DIGITAL_OUT);
                                query = (value << 4) + idx;
                                queryString.push(query);
                                this.dataFromDevice[portNo] = value;  // 아웃풋 데이터 모니터링 창에 값  업데이트  되도록 저장
                                break;

                            case this.setMode.SET_NO_TONE:
                                query = mode;
                                queryString.push(query);
                                this.dataFromDevice[portNo] = '0';   // 아웃풋 데이터 모니터링 창에 값  업데이트  되도록 저장
                                break;

                            case this.setMode.SET_BLUE_PW:
                                query = this.setMode.SET_BLUE_PW;
                                queryString.push(query);

                                query = parseInt(value / 100, 10);
                                queryString.push(query);

                                query = value - parseInt(value / 100, 10) * 100;
                                queryString.push(query);
                                break;

                            case this.setMode.SET_ALL_SERVO_RUNTIME:
                                // 서보 포지션 전송
                                mode = this.setMode.SET_SERVO_POSITION;
                                Object.keys(this.dataFromEntry[portNo].POSITION).forEach((idx) => {
                                    //Data1
                                    value = this.dataFromEntry[portNo].POSITION[idx];
                                    query = mode + ((value >> 4) & 0x08) + Number(idx);
                                    queryString.push(query);
                                    //console.log("p[", idx, "]", query);
                                    //Data2
                                    query = value & 0x7f;
                                    queryString.push(query);
                                    //console.log("p[", idx, '] v ', query);
                                    this.dataFromDevice[portNo] = value;   // 아웃풋 데이터 모니터링 창에 값  업데이트  되도록 저장
                                });
                                // 서보 RunTime 전송
                                mode = this.setMode.SET_ALL_SERVO_RUNTIME
                                value = this.dataFromEntry[portNo].VALUE;
                                query = mode + (value >>> 7);
                                queryString.push(query);
                                query = value & 0x7f;
                                queryString.push(query);
                                break;
                            case this.setMode.SET_MOTOR_CURRENT:
                                if (portNo == 14) {  // A0 : SEN_A
                                    query = this.setMode.SET_MOTOR_CURRENT_A;
                                } else {             // A1 : SEN_B
                                    query = this.setMode.SET_MOTOR_CURRENT_B;
                                }
                                queryString.push(query);
                                break;

                            case this.setMode.SET_MOTOR_SPEED_Free:
                                //Data1
                                idx = this.portMapToDevice.MOTOR[portNo];
                                query = mode + ((value >> 6) & 0x02) + idx;
                                queryString.push(query);
                                //Data2
                                query = value & 0x7f;
                                queryString.push(query);
                                break;

                            case this.setMode.SET_TONE:
                                //Data1
                                idx = this.portMapToDevice.TONE[portNo];
                                query = mode + idx;
                                queryString.push(query);
                                //Data2
                                queryString.push(value);
                                this.dataFromDevice[portNo] = 'tone';  // 아웃풋 데이터 모니터링 창에 값  업데이트  되도록 저장
                                //console.log("SET_TONE[",portNo,"]",query," - ", value);
                                break;

                            case this.setMode.SET_PWM:
                                //Data1
                                idx = this.portMapToDevice.PWM[portNo];
                                query = mode + idx;
                                queryString.push(query);
                                //Data2
                                query = value & 0x7f;
                                queryString.push(query);
                                this.dataFromDevice[portNo] = value;   // 아웃풋 데이터 모니터링 창에 값  업데이트  되도록 저장
                                break;
                        }
                        break;
                    /*
                    case this.setMode.SET_SERVO_POSITION: // 사용하지 않음
                        //Data1
                        idx = this.portMapToDevice.SERVO[portNo];
                        query = mode + ((value >> 4) & 0x08) + idx;
                        queryString.push(query);
                        //Data2
                        query = value & 0x7f;
                        queryString.push(query);
                        this.dataFromDevice[portNo] = value;    // 아웃풋 데이터 모니터링 창에 값  업데이트  되도록 저장
                        break;
                    */
                    case this.setMode.SET_GROUP_3:
                        switch (mode) {
                            case this.setMode.SET_SERVO_SPEED:
                                idx = this.portMapToDevice.SERVO[portNo];
                                // 포지션 전송
                                mode = this.setMode.SET_SERVO_POSITION;
                                value = this.dataFromEntry[portNo].POSITION;
                                query = mode + ((value >> 4) & 0x08) + idx;
                                queryString.push(query);
                                //console.log("p[", idx, "]", query);
                                query = value & 0x7f;
                                queryString.push(query);
                                //console.log("p[", idx, '] v ', query);
                                this.dataFromDevice[portNo] = value;   // 아웃풋 데이터 모니터링 창에 값  업데이트  되도록 저장

                                // 속도 전송
                                mode = this.setMode.SET_SERVO_SPEED;
                                value = this.dataFromEntry[portNo].VALUE;
                                query = mode + ((value >> 4) & 0x08) + idx;
                                queryString.push(query);
                                //Data2
                                query = value & 0x7f;
                                queryString.push(query);
                                break;

                            case this.setMode.SET_SERVO_RUNTIME:
                                query = mode;
                                queryString.push(query);
                                query = value;
                                queryString.push(query);
                                break;
                        }
                        break;

                    case this.setMode.SET_GROUP_INPUT:
                        //console.log('SET_GROUP_INPUT');
                        switch (mode) {
                            case this.setMode.SET_ANALOG_IN:
                                idx = this.portMapToDevice.ANALOG_IN[portNo];
                                query = mode + idx;
                                queryString.push(query);
                                break;
                            case this.setMode.SET_ULTRASONIC:
                                //Data1
                                idx = this.portMapToDevice.ULTRASONIC[portNo]; //trig pin
                                value = this.portMapToDevice.ULTRASONIC[value]; // the original value is echo portNo
                                query = mode + idx;
                                queryString.push(query);
                                //console.log("Data1 = "+ query);
                                //Data2
                                queryString.push(value);
                                //console.log("Data2 = "+ value);
                                break;
                            case this.setMode.SET_DIGITAL_IN:
                                idx = this.portMapToDevice.DIGITAL_INOUT[portNo];
                                query = mode + idx;
                                queryString.push(query);
                                //console.log("SET_DIGITAL_IN_L : ", portNo, " data:", query);
                                break;
                        }
                        break;
                }
            }
        });

        if (queryString.length > 0) {
            //queryString.unshift(this.setMode.SET_PORT_DISABLE); // Disable 명령 별도 송부로 삭제
            //console.log("Data to Device: ", queryString);
            return queryString;
        } else {
            return null;
        }
    }

    getAnalogData(portNo, data1, data2) {
        //b0011 1000 0000 = 0x380
        this.dataFromDevice[portNo] = ((data1 << 7) & 0x380) | data2;
    }

    getDigitalData(data1, data2) {
        let portMap;
        if (data1 & this.getMode.GET_DIGITAL_is_H_port) { //H Bit
            portMap = this.portMapToEntry.DIGITAL_H;
        } else {  // L Bit
            portMap = this.portMapToEntry.DIGITAL_L;
        }
        data2 = (data1 << 7) | data2;
        Object.entries(portMap).forEach(([key, portNo]) => {
            if (this.dataFromEntry[portNo].MODE == this.setMode.SET_DIGITAL_IN) {
                this.dataFromDevice[portNo] = (data2 >> key) & 0x01;
            }
        });
    }

    // 하드웨어에서 온 데이터 처리, 하드웨어 연결되면 주기적인 실행.
    handleLocalData(data) {
        //this.dataFromDevice = {};  // 엔트리 쪽을 상시 값 전송
        let modeGroup;
        let portkey;

        if (this.remainData) {
            modeGroup = this.remainData & 0xf8; // b1111 1000
            switch (modeGroup) {
                case this.getMode.GET_DIGITAL_IN:
                    this.getDigitalData(this.remainData, data[0]);
                    break;
                default: // this.getMode.GET_ANALOG_IN:
                    portkey = (this.remainData >>> 3) & 0x0F;
                    this.getAnalogData(this.portMapToEntry.ANALOG[portkey], this.remainData, data[0]);
            }
            this.remainData = 0;
        }

        data.forEach((getValue, idx) => {
            if (getValue & 0x80) { // b1000 0000 DATA1 일 때 실행
                modeGroup = getValue & 0xf8; // b1111 1000
                switch (modeGroup) {
                    case this.getMode.COM_GROUP:
                        switch (getValue) {
                            case this.getMode.COM_INIT_DEVICE:
                                //console.log(" <--COM_INIT_DEVICE");
                                break;
                            /* case this.getMode.COM_PORT_DISABLED:  모든 포트 상시 업데이트로 변경하면서 쓰지 않음.
                                this.dataFromDevice['com'] = 'Run';
                                break; */
                            case this.getMode.COM_BLUETOOTH_PW_OK:
                                this.dataFromDevice['com'] = 'PW 0K';
                                break;
                            case this.getMode.COM_BLUETOOTH_PW_ERR:
                                this.dataFromDevice['com'] = 'PW FAIL';
                                break;
                        }
                        break;
                    case this.getMode.GET_DIGITAL_IN:
                        if (data[idx + 1] === undefined) {
                            this.remainData = getValue;
                            //console.log( "     ■ <-- Rmode_D: ", getValue);
                        } else {
                            // this.remainData = 0;
                            this.getDigitalData(getValue, data[idx + 1]);
                        }
                        break;
                    default: // this.getMode.GET_ANALOG_IN:
                        if (data[idx + 1] === undefined) {
                            this.remainData = getValue;
                        } else {
                            //this.remainData = 0;
                            portkey = (getValue >>> 3) & 0x0F;
                            this.getAnalogData(this.portMapToEntry.ANALOG[portkey], getValue, data[idx + 1]);
                        }
                }
            }
        });
    }

    // 엔트리로 전달할 데이터, 하드웨어 연결되면 주기적인 실행.
    requestRemoteData(handler) {
        //console.log("Entry <<-- ■");
        //console.log("dataFromDevice data: ", this.dataFromDevice );
        Object.keys(this.dataFromDevice).forEach((key) => {  // key.length ===0 이면 실행 되지 않음.
            handler.write(key, this.dataFromDevice[key]);
        });
    }

    /* 엔트리에서 받은 데이터에 대한 처리
       엔트리 실행 중지시에는 작동 안함
       엔트리가 중지 되면 SetZero 에서 Entry.hw.update() 를 통해 SEND_DATA : {} 값이 들어옴.*/
    handleRemoteData(handler) {
        const getData = handler.read('SEND_DATA');
        const keysPorNo = Object.keys(getData);
        //console.log(getData);
        if (keysPorNo.length) {
            if (this.entryJS_State == 1) {   // 1(엔트리 정지로 초기화 완료) --> 2(엔트리 RUN 상태 블록 사용 시작)
                this.entryJS_State = 2;
                this.dataFromDevice['com'] = 'run';
                //console.log(" EntryJS State : 0 -> 1");
            }

            keysPorNo.forEach((LV1) => {
                if (!Object.prototype.hasOwnProperty.call(this.dataFromEntry, LV1)) {
                    //console.log("this.dataFromEntry[", LV1, "]:", this.dataFromEntry[LV1]);
                    this.dataFromEntry[LV1] = {};
                }
                Object.keys(getData[LV1]).forEach((LV2) => {
                    const keysLV2 = Object.keys(getData[LV1][LV2]);
                    if (keysLV2.length) {
                        if (!Object.prototype.hasOwnProperty.call(this.dataFromEntry[LV1], LV2)) {
                            //console.log("this.dataFromEntry[", LV1, "][", LV2, "]:", this.dataFromEntry[LV1][LV2]);
                            this.dataFromEntry[LV1][LV2] = {};
                        }
                        //console.log("this.dataFromEntry[", LV1, "][", LV2, "]:", this.dataFromEntry[LV1][LV2]);
                        Object.keys(keysLV2).forEach((idx) => {
                            if (!Object.prototype.hasOwnProperty.call(this.dataFromEntry[LV1][LV2], idx)) {
                                //console.log("this.dataFromEntry[", LV1, "][", LV2, "][", idx, "]");
                                this.dataFromEntry[LV1][LV2][idx] = undefined;
                            }
                            if (this.dataFromEntry[LV1][LV2][idx] != getData[LV1][LV2][idx]) {
                                this.dataFromEntry[LV1][LV2][idx] = getData[LV1][LV2][idx]
                                this.dataFromEntry[LV1].UPDATE = 2;
                            }
                        });
                    }
                    else {
                        if (!Object.prototype.hasOwnProperty.call(this.dataFromEntry[LV1], LV2)) {
                            //console.log("this.dataFromEntry[", LV1, "][", LV2, "]:", this.dataFromEntry[LV1][LV2]);
                            this.dataFromEntry[LV1][LV2] = undefined;
                        }
                        if (this.dataFromEntry[LV1][LV2] != getData[LV1][LV2]) {
                            this.dataFromEntry[LV1][LV2] = getData[LV1][LV2];
                            this.dataFromEntry[LV1].UPDATE = 2;
                            //console.log("Data From Entry[", LV1, "] : ", this.dataFromEntry[LV1]);
                        }
                    }
                });
            });
        }
        else if (this.entryJS_State == 2) {
            //console.log("Entry stop");
            this.initDataFromEntryStopState();
            this.entryJS_State = 0;
        }
        //console.log("dataFromEntry = ", this.dataFromEntry);
    }

    /*
    연결 후 초기에 송신할 데이터가 필요한 경우 사용합니다.
    requestInitialData 를 사용한 경우 checkInitialData 가 필수입니다.
    이 두 함수가 정의되어있어야 로직이 동작합니다. 필요없으면 작성하지 않아도 됩니다.
    */
    //requestInitialData() {
    // //console.log("requestInitialData");
    // return null;
    //}

    // 연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
    //checkInitialData(data, config) {
    // //console.log("checkInitialData");
    // return true;
    //}

    // 주기적으로 하드웨어에서 받은 데이터의 검증이 필요한 경우 사용합니다.
    //validateLocalData(data) {
    // return true;
    //}

}

module.exports = new mechatro();
