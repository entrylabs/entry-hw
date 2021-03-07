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
        //entryJS_State            상태                 작동 함수        작업 내용
        //     0        하드웨어 연결 or 엔트리 정지  requestLocalData()  하드웨어 2회 초기화    
        //     2        하드웨어 초기화 후            handleRemoteData()  블록 사용 여부 확인
        //                                                               데이터가 있으면(블록을 사용하면), 다음 단계로 넘어감 
        //                                                               데이터가 없으면(블록을 사용하지 않으면), 하드웨어가 초기화(모든 포트입력)된 상태를 계속 유지함.
        //     3        하드웨어 블록 사용            requestRemoteData() 사용하지 않는 아날로그 인풋값 "0"으로 초기화 (하드웨어 모니터에 0 표시됨)
        //     4        아날로그 인풋값 초기화        handleRemoteData()  엔트리 정지(수신 데이터 없음)시 EntryHW 초기화 

        this.remainData = 0;

        this.dataFromEntry = {};
        //형식
        //this.dataFromEntry = {
        //    portNo:{
        //        mode : 0,
        //        value: 0,
        //    },
        //};

        this.dataFromDevice = {};
        //형식
        //this.dataFromDevice = {
        //    ULTRASONIC : 0,
        //    '2' : 0,
        //
        //    '21': 0,
        //};

        this.haveToUpdateHW = {};
        this.isUltraEchoPort = {};

        this.setMode = {

            SET_GROUP_DEVICE: 0x80,
            SET_INIT_DEVICE: 0x80,
            SET_STANDBY_DEVICE: 0x81, // SET_AD_PORT_DISABLE 이름 변경 필요.
            SET_BLUE_PW: 0x82,
            SET_NO_TONE: 0x83,
            SET_DIGITAL_OUT: 0x90,

            SET_GROUP_MOTOR: 0xa0,
            SET_MOTOR_SPEED: 0xa0,
            SET_MOTOR_CURRENT: 0xb0,

            SET_GROUP_SERVO_PWM_TON: 0xc0,
            SET_SERVO_POSITION: 0xc0,
            SET_SERVO_SPEED: 0xc8,
            SET_PWM: 0xd0,
            SET_TONE: 0xd8,

            SET_GROUP_INPUT: 0xe0,
            SET_ANALOG_IN: 0xe0,
            SET_DIGITAL_IN: 0xe8,
            SET_ULTRASONIC: 0xf0,
        };

        this.getMode = {
            COM_: 0x80,
            COM_BLUETOOTH_PW_OK: 0x81,
            COM_BLUETOOTH_PW_ERR: 0x82,
            GET_DIGITAL_IN: 0x88,
            GET_ANALOG_IN: 0x90,
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
                '5': 10,
            },
            ANALOG: {
                '2': 2,
                '3': 4,
                '4': 5,
                '5': 6,
                '6': 7,
                '7': 10,
                '8': 14,    //  MA motor current
                '9': 15,    //  MB motor current
                '10': 16,
                '11': 17,
                '12': 18,
                '13': 19,
                '14': 20,
                '15': 21,
            },
        };
    }

    /*
    최초에 커넥션이 이루어진 후의 초기 설정.
    handler 는 워크스페이스와 통신하 데이터를 json 화 하는 오브젝트입니다. (datahandler/json 참고)
    config 은 module.json 오브젝트입니다.
    */
    init(handler, config) {
        this.handler = handler;
        this.config = config;
    }

    /*
    연결 후 초기에 송신할 데이터가 필요한 경우 사용합니다.
    requestInitialData 를 사용한 경우 checkInitialData 가 필수입니다.
    이 두 함수가 정의되어있어야 로직이 동작합니다. 필요없으면 작성하지 않아도 됩니다.
    */
    //requestInitialData() {
    //    //console.log("requestInitialData");
    //    return null;
    //}

    // 연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
    //checkInitialData(data, config) {
    //   console.log("checkInitialData");
    //    return true;
    //}

    // 주기적으로 하드웨어에서 받은 데이터의 검증이 필요한 경우 사용합니다.
    //validateLocalData(data) {
    //    return true;
    //}

    /*
    하드웨어 기기에 전달할 데이터를 반환합니다.
    하드웨어 연결되면 계속 실행
    slave 모드인 경우 duration 속성 간격으로 지속적으로 기기에 요청을 보냅니다.
    //형식
    //this.dataFromEntry = {
    //    portNo:{
    //        MODE : 0,
    //        VALUE: 0,
    //    },
    //};
    */
    requestLocalData() {
        //console.log('     ■ -->> Device');
        const queryString = [];
        let query;
        const portkeys = Object.keys(this.dataFromEntry);
        let mode;
        let value;
        let modeGroup;
        let idx;

        if (this.entryJS_State < 2) {  // 하드웨어 연결 or 엔트리 stop시, 초기화 명령 2회 전송
            this.entryJS_State++;
            queryString.push(this.setMode.SET_INIT_DEVICE);
            return queryString;
        }

        portkeys.forEach((portNo) => {
            //console.log( 'portkeys.forEach ');
            if (this.haveToUpdateHW[portNo]) {
                if (portNo == 3 || portNo == 11) {
                    mode = this.setMode.SET_MOTOR_SPEED;  //모터는 모드를 직접 지정
                } else {
                    mode = this.dataFromEntry[portNo].MODE;
                }
                modeGroup = mode & 0xe0;
                value = this.dataFromEntry[portNo].VALUE;
                this.haveToUpdateHW[portNo]--;

                switch (modeGroup) {
                    case this.setMode.SET_GROUP_DEVICE:
                        switch (mode) {
                            case this.setMode.SET_DIGITAL_OUT:
                                idx = this.portMapToDevice.DIGITAL[portNo];
                                query = mode + (value << 3) + idx;
                                queryString.push(query);
                                break;
                            case this.setMode.SET_NO_TONE:
                                query = mode;
                                queryString.push(query);
                                break;
                            case this.setMode.SET_BLUE_PW:
                                query = this.setMode.SET_BLUE_PW;
                                queryString.push(query);

                                query = parseInt(value / 100, 10);
                                queryString.push(query);

                                query = value - parseInt(value / 100, 10) * 100;
                                queryString.push(query);
                                break;
                        }
                        break;
                    case this.setMode.SET_GROUP_MOTOR:
                        switch (mode) {
                            case this.setMode.SET_MOTOR_SPEED:
                                //Data1
                                idx = this.portMapToDevice.MOTOR[portNo];
                                query = mode + ((value >> 6) & 0x02) + idx;
                                queryString.push(query);
                                //Data2
                                query = value & 0x7f;
                                queryString.push(query);
                                break;
                            case this.setMode.SET_MOTOR_CURRENT:
                                idx = this.portMapToDevice.MOTOR[portNo];
                                query = mode + idx;
                                queryString.push(query);
                                break;
                        }
                        break;
                    case this.setMode.SET_GROUP_SERVO_PWM_TON:
                        switch (mode) {
                            case this.setMode.SET_SERVO_POSITION:
                                //Data1
                                idx = this.portMapToDevice.SERVO[portNo];
                                query = mode + ((value >> 5) & 0x4) + idx;
                                queryString.push(query);
                                //Data2
                                query = value & 0x7f;
                                queryString.push(query);
                                break;
                            case this.setMode.SET_SERVO_SPEED:
                                //Data1
                                idx = this.portMapToDevice.SERVO[portNo];
                                query = mode + ((value >> 5) & 0x4) + idx;
                                queryString.push(query);
                                //Data2
                                query = value & 0x7f;
                                queryString.push(query);
                                break;
                            case this.setMode.SET_PWM:
                                //Data1
                                idx = this.portMapToDevice.PWM[portNo];
                                query = mode + idx;
                                queryString.push(query);
                                //Data2
                                query = value & 0x7f;
                                queryString.push(query);
                                break;
                            case this.setMode.SET_TONE:
                                //Data1
                                idx = this.portMapToDevice.DIGITAL[portNo];
                                query = mode + idx;
                                queryString.push(query);
                                //Data2
                                queryString.push(value);
                                break;
                        }
                        break;
                    case this.setMode.SET_GROUP_INPUT:
                        switch (mode) {
                            case this.setMode.SET_ANALOG_IN:
                                idx = this.portMapToDevice.ANALOG[portNo];
                                query = mode + idx;
                                queryString.push(query);
                                break;
                            case this.setMode.SET_DIGITAL_IN:
                                idx = this.portMapToDevice.DIGITAL[portNo];
                                query = mode + idx;
                                queryString.push(query);
                                break;
                            case this.setMode.SET_ULTRASONIC:

                                // 초음파 센서 echo 핀 목록 저장
                                this.isUltraEchoPort[value] = true;

                                //Data1
                                idx = this.portMapToDevice.DIGITAL[portNo]; //trig pin
                                value = this.portMapToDevice.DIGITAL[value]; // [value] is echo portNo

                                query = mode + idx;
                                queryString.push(query);
                                //console.log("Data1 = "+ query);
                                //Data2
                                queryString.push(value);
                                //console.log("Data2 = "+ value);
                                break;
                        }
                        break;
                }
            }
        });

        if (queryString.length > 0) {
            queryString.unshift(this.setMode.SET_STANDBY_DEVICE);
            //console.log("    ■ --> Data to Device: ", queryString);
            return queryString;
        } else {
            return null;
        }
    }

    getAnalogData(portNo, data1, data2) {
        //b0011 1000 0000 = 0x380
        if (portNo == 14 || portNo == 15) {
            this.dataFromDevice[portNo] = (((data1 << 7) & 0x380) | data2) * 10.0; // [cA] → [mA]
        } else {
            this.dataFromDevice[portNo] = ((data1 << 7) & 0x380) | data2;
        }
    }

    getDigitalData(data2) {
        let portNo;
        let portkey;
        for (portkey = 0; portkey < 6; portkey++) {
            portNo = this.portMapToEntry.DIGITAL[portkey];
            // 초음파 센서 echo 핀 업데이트 정지.
            if (this.isUltraEchoPort[portNo] === undefined) {
                this.dataFromDevice[portNo] = (data2 >> portkey) & 0x01;
                //console.log( "     ■ <-- [",portNo,"]: ", this.dataFromDevice[portNo]);
            }
        }
    }


    // 하드웨어에서 온 데이터 처리, 하드웨어 연결되면 주기적인 실행.
    handleLocalData(data) {
        //console.log("                 ■ <<-- Device");
        this.dataFromDevice = {};
        let modeGroup;
        let portkey;

        //console.log(data);
        if (this.remainData) {

            modeGroup = this.remainData & 0xf8; // b1111 1000

            switch (modeGroup) {
                case this.getMode.GET_DIGITAL_IN:
                    this.getDigitalData(data[0]);
                    break;
                default: // this.getMode.GET_ANALOG_IN:
                    portkey = (this.remainData >>> 3) & 0x0F;
                    this.getAnalogData(this.portMapToEntry.ANALOG[portkey], this.remainData, data[0]);
            }
            this.remainData = 0;
        }

        data.forEach((value, idx) => {
            if (value & 0x80) { // b1000 0000 DATA1 일 때 실행

                modeGroup = value & 0xf8; // b1111 1000

                switch (modeGroup) {

                    case this.getMode.COM_:
                        switch (value) {
                            case this.getMode.COM_BLUETOOTH_PW_OK:
                                this.dataFromDevice['com'] = '0K';
                                break;
                            case this.getMode.COM_BLUETOOTH_PW_ERR:
                                this.dataFromDevice['com'] = 'FAIL';
                                break;
                        }
                        break;

                    case this.getMode.GET_DIGITAL_IN:
                        if (data[idx + 1] === undefined) {
                            this.remainData = value;
                            //console.log( "     ■ <-- Rmode_D: ", value);
                        } else {
                            this.remainData = 0;
                            this.getDigitalData(data[idx + 1]);
                        }
                        break;

                    default: // this.getMode.GET_ANALOG_IN:
                        if (data[idx + 1] === undefined) {
                            this.remainData = value;
                        } else {
                            this.remainData = 0;
                            portkey = (value >>> 3) & 0x0F;
                            this.getAnalogData(this.portMapToEntry.ANALOG[portkey], value, data[idx + 1]);
                        }
                }
            }
        });
    }

    // 엔트리로 전달할 데이터, 하드웨어 연결되면 주기적인 실행.
    requestRemoteData(handler) {
        //console.log("                 ■ <<-- Entry");
        if (this.entryJS_State === 3) {
            this.entryJS_State++;
            //console.log("set 4 entryJS_State ", this.entryJS_State);
            Object.keys(this.portMapToEntry.ANALOG).forEach((key) => {
                if (key >= 8) {  // 아날로그 포트만 초기화
                    this.dataFromDevice[this.portMapToEntry.ANALOG[key]] = 0;
                }
            });
        }
        //console.log("dataFromDevice data: ", this.dataFromDevice );
        Object.keys(this.dataFromDevice).forEach((key) => {  // key.length ===0 이면 실행 되지 않음.
            handler.write(key, this.dataFromDevice[key]);
        });
    }

    // 엔트리에서 받은 데이터에 대한 처리
    // 엔트리 실행 중지시에는 작동 안함
    // 엔트리가 중지 되면 SetZero 에서 Entry.hw.update() 를 통해 값이 들어옴.
    // 형식
    //this.dataFromEntry = {
    //    portNo:{
    //        MODE : 0,
    //        VALUE: 0,
    //    },
    //};
    handleRemoteData(handler) {
        //console.log("Entry -->> ■");
        const getData = handler.read('SEND_DATA');
        const getkeys = Object.keys(getData);
        //console.log("SEND_DATA    =", getData);

        getkeys.forEach((portNo) => {
            if (!this.dataFromEntry.hasOwnProperty(portNo)) {
                //console.log( "this.dataFromEntry[",portNo,"]:",this.dataFromEntry[portNo] );
                this.dataFromEntry[portNo] = {};
            }
            Object.keys(getData[portNo]).forEach((key) => {
                if (!this.dataFromEntry[portNo].hasOwnProperty(key)) {
                    //console.log( "this.dataFromEntry[",portNo,"][",key,"]:", this.dataFromEntry[portNo][key] );
                    this.dataFromEntry[portNo][key] = undefined;
                }
                if (this.dataFromEntry[portNo][key] != getData[portNo][key]) {
                    this.dataFromEntry[portNo][key] = getData[portNo][key];
                    this.haveToUpdateHW[portNo] = 2;
                    //console.log("this.dataFromEntry[", portNo, "][", key, "]:", this.dataFromEntry[portNo][key]);
                }
            });
        });
        //console.log("dataFromEntry = ", this.dataFromEntry);

        if (getkeys.length) {
            if (this.entryJS_State === 2) {
                this.entryJS_State++;
                //console.log("set 3 entryJS_State ", this.entryJS_State);
            }
        }
        else if (this.entryJS_State === 4) {   // 엔트리 정지
            this.entryJS_State = 0;
            this.dataFromEntry = {};
            this.haveToUpdateHW = {};
            this.isUltraEchoPort = {};
        }
    }
}

module.exports = new mechatro();
