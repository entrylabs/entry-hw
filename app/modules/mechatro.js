/********************************************************
 * 명명 규칙
 *
 * 함수명, 변수명 : 첫 글자 소문자, 다음 단어 첫 글자 대문자, 두단어 이상 조합    예) nameRull
 * 키  값 : 모두 대문자, 단어사이 '_' 사용함                                   예) NAME_RULL
 *
 *********************************************************/
const _ = require('lodash');
const BaseModule = require('./baseModule');

class mechatro extends BaseModule {
    // 클래스 내부에서 사용될 필드들을 이곳에서 선언합니다.
    constructor() {
        super();
        // 0일 때 requestLocalData()에서 초기화를 진행한다. 초기화 진행 후 값:2
        // 엔트리에서 데이터 입력 있으면, 3으로 셋팅
        // 정지, 데이터 없으면 3값에서 0으로 셋팅 후 HW 프로그램 초기화
        this.entryStopFlag = 0 ;  
        this.remainmode = 0;

        this.dataFromEntry = {};
        //형식
        //this.dataFromEntry = {
        //    portNo:{
        //        mode : 0,
        //        value: 0,
        //        flag : 0,
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
        
        this.setMode = {

            SET_GROUP_DEVICE: 0x80,
            SET_INIT_DEVICE:  0x80,
            SET_STANDBY_DEVICE:  0x81,
            SET_BLUE_PW:      0x82,
            SET_NO_TONE:      0x83,
            SET_DIGITAL_OUT:  0x90,

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
            COM_BLUETOOTH_PW_OK: 0x81,
            COM_BLUETOOTH_PW_ERR: 0x82,
            GET_DIGITAL_IN: 0x88,
            GET_ANALOG_IN : 0x90,
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
       
        this.isDigitalIn = { // 1: DIGITAL_IN
            '2': 1,
            '4': 1,
            '5': 1,
            '6': 1,
            '7': 1,
            '10': 1,
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
                '8': 14,
                '9': 15,
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
    고 했지만 없으면 연결이 안되어 null과 true 값을 리턴함
    */
    requestInitialData() {
        //console.log("requestInitialData");
        return null;
    }
    
    // 연결 후 초기에 수신받아서 정상연결인지를 확인해야하는 경우 사용합니다.
    checkInitialData(data, config) {
        //console.log("checkInitialData");
        return true;
    }
    
    // 주기적으로 하드웨어에서 받은 데이터의 검증이 필요한 경우 사용합니다.
    //validateLocalData(data) {
    //    return true;
    //}
    
    /*
    하드웨어 기기에 전달할 데이터를 반환합니다.
    slave 모드인 경우 duration 속성 간격으로 지속적으로 기기에 요청을 보냅니다.
    //형식
    //this.dataFromEntry = {
    //    portNo:{
    //        mode : 0,
    //        value: 0,
    //        flag : 0,
    //    },
    //};
    */
    requestLocalData() {
        //console.log( '     ■ -->> Device');
        const queryString = [];
        let query;
        const portkeys = Object.keys(this.dataFromEntry);
        let mode;
        let value;
        let modeGroup;
        let idx;
  
        if (this.entryStopFlag < 2) {  // 엔트리 stop시 초기화 명령 2회 전송
            this.entryStopFlag++;
            queryString.push(this.setMode.SET_INIT_DEVICE);
            return queryString;
        }

        // handleRemoteData()에서 값이 들어오지 않으면,
        // this.dataFromEntry={} 로 초기화시켜 정시 시 데이터 전송하지 않음.
        portkeys.forEach((portNo) => {
            //console.log( 'portkeys.forEach ');
            if (this.dataFromEntry[portNo].flag < 2) {
                mode = this.dataFromEntry[portNo].mode;
                if (portNo == 3 || portNo == 11) {
                    mode = this.setMode.SET_MOTOR_SPEED;  //모터는 모드를 직접 지정
                }
                modeGroup = mode & 0xe0;

                value = this.dataFromEntry[portNo].value;
                this.dataFromEntry[portNo].flag++;

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
    
                                query = parseInt(value / 100,10);
                                queryString.push(query);
    
                                query = value - parseInt(value / 100,10) * 100;
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
                                //Data1
                                idx = this.portMapToDevice.DIGITAL[portNo];
                                value = this.portMapToDevice.DIGITAL[value];
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
            //console.log("    ■ --> Data to Device: " , queryString);
            return queryString;
        } else {
            return null;
        }
    }
    
    // 하드웨어에서 온 데이터 처리, 하드웨어 연결되면 주기적인 실행.
    handleLocalData(data) {
       //console.log("                 ■ <<-- Device");
        this.dataFromDevice = {};
        let modeGroup;
        let portkey;
        let portNo;
        let data2;

        //console.log(data);

        if (this.remainmode) {
            data2 = data[0];
            if (this.remainmode > this.getMode.GET_DIGITAL_IN) {
                modeGroup = this.getMode.GET_ANALOG_IN;
            } else {
                modeGroup = this.remainmode & 0xf8; // b1111 1000
            }

            switch (modeGroup) {
                case this.getMode.GET_DIGITAL_IN :
                    // 디지털 값은 6bit로 한번에 들어온다.
                    // 인풋 모드인 PortNO 만 업데이트 한다.
                    for (portkey = 0 ; portkey < 6 ; portkey++) {
                        portNo = this.portMapToEntry.DIGITAL[portkey];
                        if (this.isDigitalIn[portNo]) {
                            this.dataFromDevice[portNo] = (data2 >> portkey) & 0x01;
                        }
                    }
                    break;
                case this.getMode.GET_ANALOG_IN:
                    portkey = (this.remainmode >>> 3) & 0x0F;
                    portNo = this.portMapToEntry.ANALOG[portkey];
                    //b0011 1000 0000 = 0x380
                    this.dataFromDevice[portNo] = ((this.remainmode << 7) & 0x380) | data[0];
                    break;
                }
            this.remainmode = 0;
        }

        data.forEach((value,idx) => {
            if (value & 0x80) { // b1000 0000 DATA1 일 때 실행
                if (value > this.getMode.GET_DIGITAL_IN) {
                    modeGroup = this.getMode.GET_ANALOG_IN;
                } else {
                    modeGroup = value & 0xf8; // b1111 1000
                }
                
                switch (modeGroup) {
                    case this.getMode.GET_DIGITAL_IN :
                        if (data[idx + 1] === undefined) {
                            this.remainmode = value;
                            //console.log( "     ■ <-- Rmode_D: ", value);
                        } else {
                            this.remainmode = 0;
                            data2 = data[idx + 1];
                            // 디지털 값은 6bit로 한번에 들어온다.
                            // 인풋 모드인 PortNO 만 업데이트 한다.
                            for (portkey = 0 ; portkey < 6 ; portkey++) {
                                portNo = this.portMapToEntry.DIGITAL[portkey];
                                if (this.isDigitalIn[portNo]) {
                                    this.dataFromDevice[portNo] = (data2 >> portkey) & 0x01;
                                }
                            }
                        }
                        break;
                    case this.getMode.GET_ANALOG_IN:
                        if (data[idx + 1] === undefined) {
                            this.remainmode = value;
                        } else {
                            this.remainmode = 0;
                            portkey = (value >>> 3) & 0x0F;
                            portNo = this.portMapToEntry.ANALOG[portkey];
                            //b0011 1000 0000 = 0x380
                            this.dataFromDevice[portNo] = ((value << 7) & 0x380) | data[idx + 1];
                        }
                        break;
                    case this.getMode.COM_BLUETOOTH_PW_OK:
                        this.dataFromDevice[2] = '0K';
                        break;
                    case this.getMode.COM_BLUETOOTH_PW_ERR:
                        this.dataFromDevice[2] = 'FAIL';
                        break;
                    }
            }
        });
    }

    // 엔트리로 전달할 데이터, 하드웨어 연결되면 주기적인 실행.
    requestRemoteData(handler) {
        if (this.entryStopFlag === 3) {
            this.entryStopFlag++;
            //console.log("set 4 entryStopFlag ", this.entryStopFlag);
            Object.keys(this.portMapToEntry.ANALOG).forEach((key) => {
                this.dataFromDevice[this.portMapToEntry.ANALOG[key]] = 0;
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
    //형식
    //this.dataFromEntry = {
    //    portNo:{
    //        mode : 0,
    //        value: 0,
    //        flag : 0,
    //    },
    //};
    handleRemoteData(handler) {
        //console.log("Entry -->> ■");
        //let getDatas = handler.receiveHandler.data;
        //console.log("handler : " , getDatas );
        let portNo;
        const setkeys = Object.keys(handler.receiveHandler.data);  // 엔트리가 정지하면 {} 입력 들어옴.

        if (setkeys.length) {
            // 데이터가 들어오기 시작하면, 정지 시 데이터가 초기화가 될 수 있도록 this.entryStopFlag === 3으로 설정
            // entryStopFlag < 2  requestLocalData()에서 entryStopFlag++ 및 하드웨어 초기화 데이터 송부
            // entryStopFlag = 3 전송 데이터 안들어 올경우 변경으로 초기화 준비
            if (this.entryStopFlag === 2) {
                this.entryStopFlag++;
                //console.log("set 3 entryStopFlag ", this.entryStopFlag);

                // 필요한 포트만 인풋모드로 설정하기 위해 인풋모드를 모두 해제한다.
                Object.keys(this.isDigitalIn).forEach((key) => {
                    this.isDigitalIn[key] = 0;
                });
            }

            setkeys.forEach((key) => {
                // handler key 값에서 portNo 추출
                if (key.startsWith('m')) {
                    portNo = key.substring(1);
                } else {
                    portNo = key;
                }
                // 포트 넘버에 대한 key값이 undefined 시 값을 할당
                if (!this.dataFromEntry[portNo]) {   
                    //console.log("Entry -->> ■" ,this.dataFromEntry ); // key 없을 때 return : undefined
                    this.dataFromEntry[portNo] = {
                        flag : 0,
                    };
                }
                //value 값 없데이트
                if (!key.startsWith('m')) {  
                    if (!this.dataFromEntry[portNo].value) {
                        this.dataFromEntry[portNo].value = 0;
                    }
                    if (this.dataFromEntry[portNo].value != handler.read(key)) {
                        this.dataFromEntry[portNo].value = handler.read(key);
                        this.dataFromEntry[portNo].flag = 0;
                    }
                }
                //mode 값 없데이트
                if (key.startsWith('m')) {
                    if (!this.dataFromEntry[portNo].mode) {
                        this.dataFromEntry[portNo].mode = 0;
                    }                    
                    if (this.dataFromEntry[portNo].mode != handler.read(key)) {
                        this.dataFromEntry[portNo].mode = handler.read(key);
                        this.dataFromEntry[portNo].flag = 0;

                        // 디지털 입력 업데이트 여부 확인을 위한 isDigitalIn 값 셋팅
                        // 디지털 입력이 각 포트 idx 별 비트값을로 들어오기 때문에
                        // 디바이스에서 들어온 데이를 해석할 때
                        // portNo값이 디지털 포트인지 확인한다. 아날로그 portNo는 키값이 없으므로,
                        // ( typeof this.isDigitalIn[portNo] === undefined ) 이다.
                        if (typeof this.isDigitalIn[portNo] === 'number') {  
                            this.isDigitalIn[portNo] =
                            (this.dataFromEntry[portNo].mode == this.setMode.SET_DIGITAL_IN) ? 1 : 0 ;
                        }
                    }
                }
                //console.log("Entry -->> ■" ,this.dataFromEntry );
            });
        }
        // 데이터가 있었다가 없는 상태가 되는지 검사
        // 엔트리 실행 정지되어 데이터가 없을 경우, 실행 되었으나 데이터 없을 경우 초기화를 한다.
        // 프로그램 실행 초기값으로 entryStopFlag==0 이여야 한다. 3인 상태는 이전에 데이터가 있었음을 의미한다.
        else if (this.entryStopFlag === 4) {
            this.dataFromEntry = {};
            this.entryStopFlag = 0;
            //console.log("set 0 entryStopFlag ", this.entryStopFlag);
            Object.keys(this.isDigitalIn).forEach((key) => {
                this.isDigitalIn[key] = 1; // 인풋모드로 초기화
            });
        }
        //console.log( this.dataFromEntry );
    }
}

module.exports = new mechatro();
